import 'dotenv/config';
import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';

const port = process.env.PORT ? Number(process.env.PORT) : 4001;

const client = createClient({
  url: process.env.DATABASE_URL!,
  authToken: process.env.DATABASE_TOKEN!
});
const db = drizzle(client);

// Simple HTTP server using Node's http to avoid extra deps initially
import http from 'node:http';

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ ok: true, service: 'server', time: new Date().toISOString() }));
});

server.listen(port, () => {
  console.log(`[server] listening on http://localhost:${port}`);
  (async () => {
    try {
      await client.execute('select 1');
      console.log('DB connected successfully');
    } catch (err) {
      console.error('DB connection failed', err);
    }
  })();
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
