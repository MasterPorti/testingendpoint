const crypto = require('node:crypto');
const express = require('express');
const reconstructedEvidence = require('./evidence/conversation-fb5ae479-291f-4354-86e5-bcb4c3d0539a.json');

const app = express();
const port = process.env.PORT || 3000;
const history = [];
const historyLimit = 100;

function getDeviceInfo(req) {
  const userAgent = req.get('user-agent') || 'No disponible';
  const mobileHint = req.get('sec-ch-ua-mobile');
  const forwardedFor = req.get('x-forwarded-for');

  let browser = 'Desconocido';
  if (/Edg\//i.test(userAgent)) browser = 'Microsoft Edge';
  else if (/OPR\//i.test(userAgent)) browser = 'Opera';
  else if (/Chrome\//i.test(userAgent)) browser = 'Google Chrome';
  else if (/Firefox\//i.test(userAgent)) browser = 'Mozilla Firefox';
  else if (/Safari\//i.test(userAgent)) browser = 'Safari';
  else if (/curl\//i.test(userAgent)) browser = 'curl';

  let operatingSystem = 'Desconocido';
  if (/Windows/i.test(userAgent)) operatingSystem = 'Windows';
  else if (/Android/i.test(userAgent)) operatingSystem = 'Android';
  else if (/iPhone|iPad|iPod/i.test(userAgent)) operatingSystem = 'iOS/iPadOS';
  else if (/Mac OS X|Macintosh/i.test(userAgent)) operatingSystem = 'macOS';
  else if (/Linux/i.test(userAgent)) operatingSystem = 'Linux';

  const isMobile = mobileHint
    ? mobileHint === '?1'
    : /Android|iPhone|iPad|iPod|Mobile/i.test(userAgent);

  return {
    ip: forwardedFor ? forwardedFor.split(',')[0].trim() : req.ip,
    tipo: isMobile ? 'Móvil' : 'Computadora u otro',
    sistemaOperativo: operatingSystem,
    navegador: browser,
    plataforma: (req.get('sec-ch-ua-platform') || 'No disponible').replaceAll('"', ''),
    idioma: req.get('accept-language') || 'No disponible',
    userAgent,
  };
}

app.get('/api/historial', (_req, res) => {
  res.set('Cache-Control', 'no-store');

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

app.get(['/evidencia', '/api/evidencia'], (_req, res) => {
  res.set('Cache-Control', 'no-store');
  res.type('application/json');

  return res.send(`${JSON.stringify(reconstructedEvidence, null, 2)}\n`);
});

app.get('/api/*', (req, res) => {
  const value = req.params[0];

  if (!value) {
    return res.status(400).json({ error: 'Escribe un valor después de /api/' });
  }

  const hash = crypto.createHash('md5').update(value, 'utf8').digest('hex');
  const entry = {
    valor: value,
    hash,
    fecha: new Date().toISOString(),
    dispositivo: getDeviceInfo(req),
  };

  history.push(entry);

  if (history.length > historyLimit) {
    history.shift();
  }

  // En Vercel, esta línea queda disponible temporalmente en Runtime Logs.
  console.log('Petición MD5', entry);

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
