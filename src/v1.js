import { send, readRaw } from './http.js';

// RFC 9457 problems are separate from the legacy { error, message } format.
const problems = {
  'invalid-json': [400, 'Malformed JSON'],
  validation: [400, 'Invalid request'],
  'idempotency-key-missing': [400, 'Idempotency-Key required'],
  'not-found': [404, 'Not found'],
  'idempotency-key-in-flight': [409, 'Request in progress'],
  'unknown-menu-item': [422, 'Unknown menu item'],
  'idempotency-key-reused': [422, 'Idempotency-Key reused'],
  internal: [500, 'Internal error'],
};

export function sendV1Problem(res, slug, detail, errors) {
  const [status, title] = problems[slug];
  const body = {
    type: 'https://menu.example/problems/' + slug,
    title,
    status,
    detail,
  };
  if (slug === 'validation' || slug === 'unknown-menu-item') {
    body.errors = errors ?? [];
  }
  send(res, status, body, { 'content-type': 'application/problem+json' });
}

function isIntegerIn(value, min, max) {
  return Number.isInteger(value) && value >= min && value <= max;
}

function pathId(text) {
  if (!/^[0-9]+$/.test(text)) return null;
  const id = Number(text);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

// Object member order is irrelevant to JSON equality; array order is significant.
function canonicalJson(value) {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) {
    return '[' + value.map(canonicalJson).join(',') + ']';
  }
  return '{' + Object.keys(value).sort().map(
    (key) => JSON.stringify(key) + ':' + canonicalJson(value[key])
  ).join(',') + '}';
}

function bodyErrors(body) {
  if (body === null || typeof body !== 'object' || Array.isArray(body)) {
    return [{ pointer: '', detail: 'must be a JSON object' }];
  }
  const errors = [];
  if (!isIntegerIn(body.tableId, 1, 200)) {
    errors.push({ pointer: '/tableId', detail: 'must be an integer from 1 to 200' });
  }
  if (!Array.isArray(body.items) || !isIntegerIn(body.items.length, 1, 20)) {
    errors.push({ pointer: '/items', detail: 'must be an array of 1 to 20 lines' });
  }
  if (Array.isArray(body.items)) {
    body.items.forEach((line, index) => {
      if (line === null || typeof line !== 'object' || Array.isArray(line)) {
        errors.push({ pointer: '/items/' + index, detail: 'must be an object' });
        return;
      }
      if (!isIntegerIn(line.menuItemId, 1, Number.MAX_SAFE_INTEGER)) {
        errors.push({ pointer: '/items/' + index + '/menuItemId', detail: 'must be a positive integer' });
      }
      if (!isIntegerIn(line.qty, 1, 20)) {
        errors.push({ pointer: '/items/' + index + '/qty', detail: 'must be an integer from 1 to 20' });
      }
    });
  }
  return errors;
}

function queryNumber(params, name, max, errors) {
  if (!params.has(name)) return null;
  const raw = params.get(name);
  const number = Number(raw);
  if (!/^[0-9]+$/.test(raw) || !isIntegerIn(number, 1, max)) {
    errors.push({ parameter: name, detail: 'must be an integer from 1 to ' + max });
    return null;
  }
  return number;
}

function parseCursor(token, tableId) {
  if (!/^[A-Za-z0-9_-]{1,4096}$/.test(token)) return null;
  try {
    const value = JSON.parse(Buffer.from(token, 'base64url').toString('utf8'));
    if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
    if (!isIntegerIn(value.anchor, 1, Number.MAX_SAFE_INTEGER)) return null;
    if (!isIntegerIn(value.before, 1, value.anchor)) return null;
    if (value.tableId !== tableId) return null;
    return value;
  } catch {
    return null;
  }
}

export function createV1(db) {
  // Track requests while their bodies are still arriving. SQLite serializes
  // completed writes, but it cannot see a request that has not begun a write.
  const inFlightKeys = new Set();
  const q = {
    menu: db.prepare('SELECT id, name, price_vnd AS priceVnd FROM menu_items WHERE id = ?'),
    order: db.prepare('SELECT id, table_id AS tableId, total_vnd AS totalVnd, created_at AS createdAt FROM orders WHERE id = ?'),
    lines: db.prepare('SELECT menu_item_id AS menuItemId, qty, unit_price_vnd AS unitPriceVnd FROM order_items WHERE order_id = ? ORDER BY line'),
    putOrder: db.prepare('INSERT INTO orders (table_id, total_vnd, created_at) VALUES (?, ?, ?)'),
    putLine: db.prepare('INSERT INTO order_items (order_id, line, menu_item_id, qty, unit_price_vnd) VALUES (?, ?, ?, ?, ?)'),
    seenKey: db.prepare('SELECT fingerprint, response_json AS responseJson, location FROM order_idempotency WHERE key = ?'),
    putKey: db.prepare('INSERT INTO order_idempotency (key, fingerprint, response_json, location) VALUES (?, ?, ?, ?)'),
    maxOrder: db.prepare('SELECT COALESCE(MAX(id), 0) AS id FROM orders'),
    page: db.prepare(
      'SELECT id FROM orders WHERE id <= ? AND (? IS NULL OR id < ?) ' +
      'AND (? IS NULL OR table_id = ?) ORDER BY id DESC LIMIT ?'
    ),
  };

  function getOrder(id) {
    const order = q.order.get(id);
    if (!order) return null;
    return {
      id: order.id,
      tableId: order.tableId,
      items: q.lines.all(id),
      totalVnd: order.totalVnd,
      createdAt: order.createdAt,
    };
  }


  async function postOrder(req, res) {
    const key = req.headers['idempotency-key'];
    if (typeof key !== 'string' || key.length < 1 || key.length > 255 || !key.trim()) {
      sendV1Problem(res, 'idempotency-key-missing', 'Provide an Idempotency-Key of 1 to 255 characters.');
      return;
    }

    // Reserve the key before awaiting a potentially slow request body. A
    // competing request parses its own JSON before checking the reservation,
    // as required by the contract's error-precedence rules.
    const ownsReservation = !inFlightKeys.has(key);
    if (ownsReservation) {
      inFlightKeys.add(key);
      // Release on success, an error response, or a disconnected client.
      const release = () => inFlightKeys.delete(key);
      res.once('finish', release);
      res.once('close', release);
    }
    let body;
    try {
      body = JSON.parse(await readRaw(req));
    } catch {
      sendV1Problem(res, 'invalid-json', 'The request body is not valid JSON.');
      return;
    }

    const fingerprint = canonicalJson(body);
    // If a successful response already exists, the new request is a replay,
    // even if another replay is currently reading its body.
    if (!ownsReservation && inFlightKeys.has(key) && !q.seenKey.get(key)) {
      sendV1Problem(res, 'idempotency-key-in-flight', 'The first request with this key is still in progress.');
      return;
    }
    // The lock covers the lookup as well as the insert, including requests from
    // another Node process using the same SQLite database file.
    db.exec('BEGIN IMMEDIATE');
    let committed = false;
    try {
      const previous = q.seenKey.get(key);
      if (previous) {
        if (previous.fingerprint === fingerprint) {
          db.exec('COMMIT');
          committed = true;
          send(res, 201, JSON.parse(previous.responseJson), {
            Location: previous.location,
            'Idempotent-Replayed': 'true',
          });
        } else {
          db.exec('COMMIT');
          committed = true;
          sendV1Problem(res, 'idempotency-key-reused', 'This key has already been used for a different order.');
        }
        return;
      }

      const errors = bodyErrors(body);
      if (errors.length) {
        db.exec('COMMIT');
        committed = true;
        sendV1Problem(res, 'validation', errors.length + ' fields are invalid.', errors);
        return;
      }

      const prices = [];
      const missing = [];
      body.items.forEach((line, i) => {
        const menu = q.menu.get(line.menuItemId);
        if (menu) prices.push(menu.priceVnd);
        else missing.push({ pointer: '/items/' + i + '/menuItemId', detail: 'menu item does not exist' });
      });
      if (missing.length) {
        db.exec('COMMIT');
        committed = true;
        sendV1Problem(res, 'unknown-menu-item', missing.length + ' menu items do not exist.', missing);
        return;
      }

      const total = body.items.reduce((sum, line, i) => sum + prices[i] * line.qty, 0);
      const createdAt = new Date().toISOString();
      const { lastInsertRowid } = q.putOrder.run(body.tableId, total, createdAt);
      const id = Number(lastInsertRowid);
      body.items.forEach((line, i) => q.putLine.run(id, i, line.menuItemId, line.qty, prices[i]));
      const order = getOrder(id);
      const location = '/v1/orders/' + id;
      q.putKey.run(key, fingerprint, JSON.stringify(order), location);
      db.exec('COMMIT');
      committed = true;
      send(res, 201, order, { Location: location });
    } finally {
      if (!committed) db.exec('ROLLBACK');
    }
  }

  function getOrderPage(res, url) {
    const errors = [];
    const tableId = queryNumber(url.searchParams, 'tableId', 200, errors);
    const limit = queryNumber(url.searchParams, 'limit', 100, errors) ?? 20;
    const token = url.searchParams.get('cursor');
    const cursor = token === null ? null : parseCursor(token, tableId);
    if (token !== null && cursor === null) {
      errors.push({ parameter: 'cursor', detail: 'must be a valid cursor for this table' });
    }
    if (errors.length) {
      sendV1Problem(res, 'validation', errors.length + ' query parameters are invalid.', errors);
      return;
    }

    const anchor = cursor ? cursor.anchor : q.maxOrder.get().id;
    const before = cursor ? cursor.before : null;
    const rows = q.page.all(anchor, before, before, tableId, tableId, limit + 1);
    const pageRows = rows.slice(0, limit);
    const items = pageRows.map((row) => getOrder(row.id));
    const nextCursor = rows.length > limit
      ? Buffer.from(JSON.stringify({
        anchor, before: pageRows[pageRows.length - 1].id, tableId,
      })).toString('base64url')
      : null;
    send(res, 200, { items, nextCursor });
  }

  return async function handleV1(req, res, url) {
    const path = url.pathname;
    if (req.method === 'GET') {
      const menuMatch = /^\/v1\/menu\/([^/]+)$/.exec(path);
      if (menuMatch) {
        const id = pathId(menuMatch[1]);
        const item = id === null ? null : q.menu.get(id);
        if (!item) sendV1Problem(res, 'not-found', 'The requested menu item does not exist.');
        else send(res, 200, item);
        return true;
      }

      const orderMatch = /^\/v1\/orders\/([^/]+)$/.exec(path);
      if (orderMatch) {
        const id = pathId(orderMatch[1]);
        const order = id === null ? null : getOrder(id);
        if (!order) sendV1Problem(res, 'not-found', 'The requested order does not exist.');
        else send(res, 200, order);
        return true;
      }

      if (path === '/v1/orders') {
        getOrderPage(res, url);
        return true;
      }
    }

    if (req.method === 'POST' && path === '/v1/orders') {
      await postOrder(req, res);
      return true;
    }

    sendV1Problem(res, 'not-found', 'The requested API route does not exist.');
    return true;
  };
}
