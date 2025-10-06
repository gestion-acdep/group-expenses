import type { IncomingMessage, ServerResponse } from 'node:http';

// Import handlers
import { handleRegister } from './handlers/auth/register.js';
import { handleLogin } from './handlers/auth/login.js';
import { handleMe } from './handlers/auth/me.js';
import { handleCreateGroup } from './handlers/groups/create.js';
import { handleGetGroups } from './handlers/groups/get.js';
import { handleGetSpecificGroup } from './handlers/groups/get-specific.js';
import { handleUpdateGroup } from './handlers/groups/update.js';
import { handleDeleteGroup } from './handlers/groups/delete.js';
import { handleCreateExpense } from './handlers/expenses/create.js';
import { handleGetExpenses } from './handlers/expenses/get.js';
import { handleUpdateExpense } from './handlers/expenses/update.js';
import { handleDeleteExpense } from './handlers/expenses/delete.js';

export async function handleRequest(req: IncomingMessage, res: ServerResponse) {
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  const url = new URL(req.url || '', `http://${req.headers.host}`);

  // Auth routes
  if (req.method === 'POST' && url.pathname === '/api/auth/register') {
    await handleRegister(req, res);
    return;
  }

  if (req.method === 'POST' && url.pathname === '/api/auth/login') {
    await handleLogin(req, res);
    return;
  }

  if (req.method === 'GET' && url.pathname === '/api/auth/me') {
    await handleMe(req, res);
    return;
  }

  // Group routes
  if (req.method === 'POST' && url.pathname === '/api/groups') {
    await handleCreateGroup(req, res);
    return;
  }

  if (req.method === 'GET' && url.pathname === '/api/groups') {
    await handleGetGroups(req, res);
    return;
  }

  if (req.method === 'GET' && url.pathname.startsWith('/api/groups/')) {
    const groupId = parseInt(url.pathname.split('/api/groups/')[1]);
    if (isNaN(groupId)) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Invalid group ID' }));
      return;
    }
    await handleGetSpecificGroup(req, res, groupId);
    return;
  }

  if (req.method === 'PUT' && url.pathname.startsWith('/api/groups/')) {
    const groupId = parseInt(url.pathname.split('/api/groups/')[1]);
    if (isNaN(groupId)) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Invalid group ID' }));
      return;
    }
    await handleUpdateGroup(req, res, groupId);
    return;
  }

  if (req.method === 'DELETE' && url.pathname.startsWith('/api/groups/')) {
    const groupId = parseInt(url.pathname.split('/api/groups/')[1]);
    if (isNaN(groupId)) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Invalid group ID' }));
      return;
    }
    await handleDeleteGroup(req, res, groupId);
    return;
  }

  // Expense routes
  if (req.method === 'POST' && url.pathname.match(/^\/api\/groups\/\d+\/expenses$/)) {
    const groupId = parseInt(url.pathname.split('/api/groups/')[1].split('/expenses')[0]);
    if (isNaN(groupId)) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Invalid group ID' }));
      return;
    }
    await handleCreateExpense(req, res, groupId);
    return;
  }

  if (req.method === 'GET' && url.pathname.match(/^\/api\/groups\/\d+\/expenses$/)) {
    const groupId = parseInt(url.pathname.split('/api/groups/')[1].split('/expenses')[0]);
    if (isNaN(groupId)) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Invalid group ID' }));
      return;
    }
    await handleGetExpenses(req, res, groupId);
    return;
  }

  if (req.method === 'PUT' && url.pathname.startsWith('/api/expenses/')) {
    const expenseId = parseInt(url.pathname.split('/api/expenses/')[1]);
    if (isNaN(expenseId)) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Invalid expense ID' }));
      return;
    }
    await handleUpdateExpense(req, res, expenseId);
    return;
  }

  if (req.method === 'DELETE' && url.pathname.startsWith('/api/expenses/')) {
    const expenseId = parseInt(url.pathname.split('/api/expenses/')[1]);
    if (isNaN(expenseId)) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Invalid expense ID' }));
      return;
    }
    await handleDeleteExpense(req, res, expenseId);
    return;
  }

  // Default response
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ ok: true, service: 'server', time: new Date().toISOString() }));
}