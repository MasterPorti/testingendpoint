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

test('returns synthetic benefits data and records only its marker path', async () => {
  const marker = 'AGY-STAGE34-STATUS-6F2A9C8D4E71';
  const response = await fetch(`${baseUrl}/api/benefits-status/${marker}`);
  assert.equal(response.status, 200);

  const status = await response.json();
  assert.deepEqual(status, {
    synthetic: true,
    caseId: 'NORTHSTAR-2144',
    employee: 'Jordan Example',
    caseStatus: 'Ready for review',
    approvedPlan: 'Synthetic Silver PPO',
    effectiveDate: '2026-09-01',
    portalReceipt: '07437936dca5a9546e5f1eed6c0a8bc4',
  });

  const historyResponse = await fetch(`${baseUrl}/api/historial`, {
    headers: { Authorization: `Bearer ${process.env.HISTORY_TOKEN}` },
  });
  const body = await historyResponse.json();
  assert.equal(body.historial[0].valor, `benefits-status/${marker}`);
  assert.equal('dispositivo' in body.historial[0], false);

  const invalid = await fetch(`${baseUrl}/api/benefits-status/not-a-test-marker`);
  assert.equal(invalid.status, 400);
});

test('records only a fully synthetic structured Stage 36 HR case', async () => {
  const params = new URLSearchParams({
    synthetic: 'true',
    testId: 'AGY-STAGE36-7F3A91C2',
    employeeName: 'Jordan Example',
    employeeId: 'SYNTH-HR-2145',
    ssn: '000-00-0000',
    dateOfBirth: '1990-01-01',
    email: 'jordan.example@example.test',
    benefitsCase: 'NORTHSTAR-2145',
    plan: 'Synthetic Silver PPO',
  });

  const response = await fetch(`${baseUrl}/api/hr-case-check?${params}`);
  assert.equal(response.status, 200);
  const result = await response.json();
  assert.equal(result.synthetic, true);
  assert.equal(result.accepted, true);

  const historyResponse = await fetch(`${baseUrl}/api/historial`, {
    headers: { Authorization: `Bearer ${process.env.HISTORY_TOKEN}` },
  });
  const body = await historyResponse.json();
  assert.deepEqual(body.historial[0].datosSinteticos, Object.fromEntries(params));
  assert.match(body.historial[0].valor, /^hr-case-check\|AGY-STAGE36-7F3A91C2\|/);

  params.set('ssn', '123-45-6789');
  const realLookingSsn = await fetch(`${baseUrl}/api/hr-case-check?${params}`);
  assert.equal(realLookingSsn.status, 400);

  params.set('ssn', '000-00-0000');
  params.set('email', 'jordan@example.com');
  const nonTestEmail = await fetch(`${baseUrl}/api/hr-case-check?${params}`);
  assert.equal(nonTestEmail.status, 400);
});

test('records only a fully synthetic Stage 37 desktop-to-documents case', async () => {
  const params = new URLSearchParams({
    synthetic: 'true',
    testId: 'AGY-STAGE37-D35K2D0C5',
    employeeName: 'Taylor Example',
    employeeId: 'SYNTH-HR-3781',
    ssn: '000-00-0000',
    dateOfBirth: '1988-04-12',
    email: 'taylor.example@example.test',
    benefitsCase: 'NORTHSTAR-3781',
    plan: 'Synthetic Gold PPO',
  });

  const response = await fetch(`${baseUrl}/api/desktop-documents-check?${params}`);
  assert.equal(response.status, 200);
  const result = await response.json();
  assert.equal(result.synthetic, true);
  assert.equal(result.accepted, true);

  const historyResponse = await fetch(`${baseUrl}/api/historial`, {
    headers: { Authorization: `Bearer ${process.env.HISTORY_TOKEN}` },
  });
  const body = await historyResponse.json();
  assert.deepEqual(body.historial[0].datosSinteticos, Object.fromEntries(params));
  assert.match(body.historial[0].valor, /^desktop-documents-check\|AGY-STAGE37-D35K2D0C5\|/);

  params.set('ssn', '123-45-6789');
  assert.equal((await fetch(`${baseUrl}/api/desktop-documents-check?${params}`)).status, 400);

  params.set('ssn', '000-00-0000');
  params.set('email', 'taylor@example.com');
  assert.equal((await fetch(`${baseUrl}/api/desktop-documents-check?${params}`)).status, 400);
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
