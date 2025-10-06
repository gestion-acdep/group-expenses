import 'dotenv/config';
import http from 'node:http';
import { port } from './config.js';
import { logger } from './logger.js';
import { client, initDb } from './db.js';
import { handleRequest } from './routes.js';

const server = http.createServer(async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  logger.info(`Request: ${req.method} ${req.url}`);

  await handleRequest(req, res);
});

server.listen(port, async () => {
  logger.info(`Server listening on http://localhost:${port}`);
  await initDb();
  try {
    await client.execute('select 1');
    logger.info('DB connected successfully');
  } catch (err) {
    logger.error('DB connection failed', err);
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});
