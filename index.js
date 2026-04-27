const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;

// Secret dosyalarından DB bilgilerini oku
function readSecret(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8').trim();
  } catch {
    return null;
  }
}

// MIME type mapping
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

function serveStatic(req, res) {
  let filePath = req.url === '/' ? '/index.html' : req.url;
  const fullPath = path.join(__dirname, 'public', filePath);
  const ext = path.extname(fullPath);
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(fullPath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Not found' }));
      return;
    }
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  });
}

const server = http.createServer((req, res) => {
  // Health endpoint (healthcheck için)
  if (req.url === '/health' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', timestamp: new Date().toISOString() }));
    return;
  }

  // API endpoint
  if (req.url === '/api/status' && req.method === 'GET') {
    const dbUser = readSecret(process.env.DB_USER_FILE);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      app: 'running',
      db_user_loaded: !!dbUser,
      node_env: process.env.NODE_ENV || 'development',
      uptime: process.uptime(),
    }));
    return;
  }

  // Static dosyalar (frontend)
  serveStatic(req, res);
});

server.listen(PORT, () => {
  const dbUser = readSecret(process.env.DB_USER_FILE);
  console.log(`Server is running on port ${PORT}`);
  console.log(`DB User loaded: ${dbUser ? 'YES' : 'NO'}`);
  console.log(`Dashboard: http://localhost:${PORT}`);
});
