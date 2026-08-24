const crypto = require('node:crypto');
const express = require('express');
const reconstructedEvidence = require('./evidence/conversation-fb5ae479-291f-4354-86e5-bcb4c3d0539a.json');

const app = express();
const port = process.env.PORT || 3000;
const history = [];
const historyLimit = 100;
const maxValueBytes = 512;
const rateWindowMs = 60_000;
const rateLimit = Number.parseInt(process.env.RATE_LIMIT_MAX || '60', 10);
const requestCounts = new Map();

app.disable('x-powered-by');

app.use((_req, res, next) => {
  res.set({
    'Cache-Control': 'no-store',
    'Content-Security-Policy': "default-src 'none'; frame-ancestors 'none'",
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    'Referrer-Policy': 'no-referrer',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
  });
  next();
});

function safeTokenMatch(received, expected) {
  const receivedBuffer = Buffer.from(received || '', 'utf8');
  const expectedBuffer = Buffer.from(expected || '', 'utf8');

  return receivedBuffer.length === expectedBuffer.length
    && receivedBuffer.length > 0
    && crypto.timingSafeEqual(receivedBuffer, expectedBuffer);
}

function requireHistoryAuth(req, res, next) {
  const expectedToken = process.env.HISTORY_TOKEN;

  if (!expectedToken) {
    return res.status(503).json({
      error: 'El historial está deshabilitado hasta configurar HISTORY_TOKEN.',
    });
  }

  const authorization = req.get('authorization') || '';
  const receivedToken = authorization.startsWith('Bearer ')
    ? authorization.slice('Bearer '.length)
    : '';

  if (!safeTokenMatch(receivedToken, expectedToken)) {
    res.set('WWW-Authenticate', 'Bearer');
    return res.status(401).json({ error: 'No autorizado.' });
  }

  return next();
}

function limitIngestion(req, res, next) {
  const now = Date.now();
  const key = req.ip || 'unknown';
  const current = requestCounts.get(key);

  if (!current || current.resetAt <= now) {
    requestCounts.set(key, { count: 1, resetAt: now + rateWindowMs });
    return next();
  }

  current.count += 1;
  if (current.count > rateLimit) {
    res.set('Retry-After', String(Math.ceil((current.resetAt - now) / 1000)));
    return res.status(429).json({ error: 'Demasiadas peticiones. Inténtalo más tarde.' });
  }

  return next();
}

app.get('/api/historial', requireHistoryAuth, (_req, res) => {
  return res.json({
    aviso: 'Historial temporal de esta instancia; puede desaparecer o estar incompleto en Vercel.',
    total: history.length,
    historial: [...history].reverse(),
    evidenciaReconstruida: {
      aviso: 'Esta sección procede de la transcripción local y no es un Runtime Log recuperado.',
      total: 1,
      registros: [reconstructedEvidence],
    },
  });
});

app.get(['/evidencia', '/api/evidencia'], requireHistoryAuth, (_req, res) => {
  res.type('application/json');
  return res.send(`${JSON.stringify(reconstructedEvidence, null, 2)}\n`);
});

app.get('/api/*', limitIngestion, (req, res) => {
  const value = req.params[0];

  if (!value) {
    return res.status(400).json({ error: 'Escribe un valor después de /api/' });
  }

  if (Buffer.byteLength(value, 'utf8') > maxValueBytes) {
    return res.status(413).json({
      error: `El valor no puede superar ${maxValueBytes} bytes.`,
    });
  }

  const hash = crypto.createHash('md5').update(value, 'utf8').digest('hex');
  const entry = {
    valor: value,
    hash,
    fecha: new Date().toISOString(),
  };

  history.push(entry);

  if (history.length > historyLimit) {
    history.shift();
  }

  // No registrar el valor ni metadatos personales en los Runtime Logs.
  console.log('Petición MD5', {
    hash: entry.hash,
    fecha: entry.fecha,
    longitudBytes: Buffer.byteLength(value, 'utf8'),
  });

  return res.json({ hash });
});

app.get('/api', (_req, res) => {
  return res.status(400).json({ error: 'Escribe un valor después de /api/' });
});

if (require.main === module) {
  app.listen(port, () => {
    console.log(`Servidor disponible en http://localhost:${port}`);
  });
}

module.exports = app;
