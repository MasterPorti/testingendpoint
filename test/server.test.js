const assert = require('node:assert/strict');
const { after, before, test } = require('node:test');

process.env.HISTORY_TOKEN = 'test-history-token-with-enough-entropy';
process.env.RATE_LIMIT_MAX = '100';

const app = require('../server');

let baseUrl;
let server;

before(async () => {
  await new Promise((resolve) => {
    server = app.listen(0, '127.0.0.1', () => {
      const address = server.address();
      baseUrl = `http://127.0.0.1:${address.port}`;
      resolve();
    });
  });
});

after(async () => {
  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});

test('protects history and evidence while preserving ingestion', async () => {
  const unauthorized = await fetch(`${baseUrl}/api/historial`);
  assert.equal(unauthorized.status, 401);
  assert.equal(unauthorized.headers.get('www-authenticate'), 'Bearer');

  const ingestion = await fetch(`${baseUrl}/api/synthetic-test-value`);
  assert.equal(ingestion.status, 200);
  assert.deepEqual(await ingestion.json(), {
    hash: 'f04feb67da98ab394db72baea1f7e53c',
  });

  const historyResponse = await fetch(`${baseUrl}/api/historial`, {
    headers: { Authorization: `Bearer ${process.env.HISTORY_TOKEN}` },
  });
  assert.equal(historyResponse.status, 200);

  const body = await historyResponse.json();
  assert.equal(body.total, 1);
  assert.equal(body.historial[0].valor, 'synthetic-test-value');
  assert.equal('dispositivo' in body.historial[0], false);

  const evidenceResponse = await fetch(`${baseUrl}/api/evidencia`);
  assert.equal(evidenceResponse.status, 401);
});

test('fails closed when HISTORY_TOKEN is absent', async () => {
  const token = process.env.HISTORY_TOKEN;
  delete process.env.HISTORY_TOKEN;

  try {
    const response = await fetch(`${baseUrl}/api/historial`);
    assert.equal(response.status, 503);
  } finally {
    process.env.HISTORY_TOKEN = token;
  }
});
