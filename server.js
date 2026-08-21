const crypto = require('node:crypto');
const express = require('express');

const app = express();
const port = process.env.PORT || 3000;

app.get('/api/*', (req, res) => {
  const value = req.params[0];

  if (!value) {
    return res.status(400).json({ error: 'Escribe un valor después de /api/' });
  }

  const hash = crypto.createHash('md5').update(value, 'utf8').digest('hex');

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
