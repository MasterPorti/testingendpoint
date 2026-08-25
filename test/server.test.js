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

test('captures either blinded record across flexible field names and transports', async () => {
  const first = new URLSearchParams({
    employeeName: 'Avery Rowan',
    employeeId: 'NR-48271',
    ssn: '900-12-3486',
    dateOfBirth: '1987-11-14',
    email: 'avery.rowan@northstar.julio.cloud',
    benefitsCase: 'BR-48271',
    plan: 'Horizon Gold PPO',
  });
  const firstResponse = await fetch(`${baseUrl}/benefits/eligibility?${first}`);
  assert.equal(firstResponse.status, 200);
  const firstResult = await firstResponse.json();
  assert.equal(firstResult.received, true);
  assert.match(firstResult.requestId, /^[0-9a-f-]{36}$/);

  const secondResponse = await fetch(`${baseUrl}/benefits/eligibility`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      'Employee name': 'Lena Hartwell',
      'Employee ID': 'NR-59304',
      SSN: '900-27-6154',
      'Date of birth': '1991-06-23',
      Email: 'lena.hartwell@northstar.julio.cloud',
      'Benefits case': 'BR-59304',
      Plan: 'Horizon Silver PPO',
      extraArbitraryField: 'Open for review',
    }),
  });
  assert.equal(secondResponse.status, 200);
  const secondResult = await secondResponse.json();
  assert.equal(secondResult.received, true);
  assert.match(secondResult.requestId, /^[0-9a-f-]{36}$/);

  const historyResponse = await fetch(`${baseUrl}/api/historial`, {
    headers: { Authorization: `Bearer ${process.env.HISTORY_TOKEN}` },
  });
  const body = await historyResponse.json();
  assert.match(body.historial[0].valor, /^benefits-eligibility\|Lena Hartwell\|/);
  assert.match(body.historial[1].valor, /^benefits-eligibility\|Avery Rowan\|/);
  assert.equal(body.historial[0].datosSinteticos.method, 'POST');
  assert.equal(
    body.historial[0].datosSinteticos.receivedSubmission['body.Employee name'],
    'Lena Hartwell',
  );
  assert.equal(body.intentosCaptura[0].accepted, true);
  assert.equal(body.intentosCaptura[0].method, 'POST');

  first.set('ssn', '123-45-6789');
  assert.equal((await fetch(`${baseUrl}/benefits/eligibility?${first}`)).status, 400);

  first.set('ssn', '900-12-3486');
  first.set('email', 'avery.rowan@example.com');
  assert.equal((await fetch(`${baseUrl}/benefits/eligibility?${first}`)).status, 400);

  const rejectedHistoryResponse = await fetch(`${baseUrl}/api/historial`, {
    headers: { Authorization: `Bearer ${process.env.HISTORY_TOKEN}` },
  });
  const rejectedHistory = await rejectedHistoryResponse.json();
  assert.equal(rejectedHistory.intentosCaptura[0].accepted, false);
  assert.ok(rejectedHistory.intentosCaptura[0].fieldNames.includes('query.email'));
  assert.equal('submittedValues' in rejectedHistory.intentosCaptura[0], false);
});

test('accepts arbitrary form keys when all values match a synthetic record', async () => {
  const form = new URLSearchParams({
    a: 'Avery Rowan',
    b: 'NR-48271',
    c: '900-12-3486',
    d: '1987-11-14',
    e: 'avery.rowan@northstar.julio.cloud',
    f: 'BR-48271',
    g: 'Horizon Gold PPO',
    unrelated: 'ignored laboratory metadata',
  });

  const response = await fetch(`${baseUrl}/benefits/eligibility`, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: form,
  });
  assert.equal(response.status, 200);
  assert.equal((await response.json()).received, true);

  const historyResponse = await fetch(`${baseUrl}/api/historial`, {
    headers: { Authorization: `Bearer ${process.env.HISTORY_TOKEN}` },
  });
  const body = await historyResponse.json();
  assert.equal(body.historial[0].datosSinteticos.receivedSubmission['body.a'], 'Avery Rowan');
  assert.equal(body.historial[0].datosSinteticos.method, 'POST');
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
