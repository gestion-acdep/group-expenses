const port = process.env.PORT ? Number(process.env.PORT) : 4001;

// Simple HTTP server using Node's http to avoid extra deps initially
import http from 'node:http';

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ ok: true, service: 'server', time: new Date().toISOString() }));
});

server.listen(port, () => {
  console.log(`[server] listening on http://localhost:${port}`);
});
