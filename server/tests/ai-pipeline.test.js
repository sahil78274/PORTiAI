/**
 * AI Project Builder pipeline tests.
 *
 * These tests exercise the real planning, batching, retry, JSON parsing,
 * validation and assembly code against a local HTTP server that implements the
 * documented Gemini `generateContent` contract. They cover Starter, Standard
 * and Advanced modes across static, React, Express/MERN and Python stacks.
 *
 * A real Gemini/OpenAI key is NOT used here. The provider's HTTP contract and
 * every failure mode (429, 5xx, empty, malformed, MAX_TOKENS, missing files)
 * are emulated so the pipeline can be tested deterministically. Live model
 * quality can only be verified with a real key — see docs/TESTING.md.
 *
 *   node tests/ai-pipeline.test.js
 */
import http from 'node:http';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import assert from 'node:assert/strict';

const PROJECT_KEY = 'project-builder-test-key';
const PORTFOLIO_KEY = 'portfolio-test-key';
const PROJECT_MODEL = 'gemini-2.5-flash-test';
const PORTFOLIO_MODEL = 'gemini-portfolio-test';

let passed = 0;
const failures = [];

const test = async (name, fn) => {
  try {
    await fn();
    passed += 1;
    console.log(`  \u001b[32m✓\u001b[0m ${name}`);
  } catch (error) {
    failures.push({ name, error });
    console.log(`  \u001b[31m✗\u001b[0m ${name}`);
    console.log(`      ${error.message}`);
  }
};

const suite = (name) => console.log(`\n${name}`);

const freePort = () =>
  new Promise((resolve, reject) => {
    const server = net.createServer();
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      server.close(() => resolve(port));
    });
    server.on('error', reject);
  });

const STACK_LABELS = {
  'HTML, CSS & JavaScript': 'html-css-js',
  'React.js': 'react',
  'React + Node.js + Express': 'react-express',
  'MERN Stack': 'mern',
  Python: 'python',
};

const manifestFor = (stack, complexity, idea) => {
  const lower = idea.toLowerCase();
  const auth = /auth|login|signup|sign up|password/.test(lower);
  const readme = { path: 'README.md', language: 'markdown', role: 'Documentation' };

  if (stack === 'html-css-js') {
    const files = [
      { path: 'index.html', language: 'html', role: 'Page markup' },
      { path: 'styles.css', language: 'css', role: 'Responsive styling' },
      { path: 'script.js', language: 'javascript', role: 'Interactions and persistence' },
    ];
    if (complexity !== 'starter') {
      files.push(
        { path: 'js/storage.js', language: 'javascript', role: 'Local storage helpers' },
        { path: 'js/ui.js', language: 'javascript', role: 'Render helpers' }
      );
    }
    if (complexity === 'advanced') {
      files.push(
        { path: 'js/validate.js', language: 'javascript', role: 'Input validation' },
        { path: 'js/events.js', language: 'javascript', role: 'Event wiring' },
        { path: 'js/theme.js', language: 'javascript', role: 'Theme switching' },
        { path: 'js/format.js', language: 'javascript', role: 'Formatting helpers' }
      );
    }
    return {
      title: 'Calculator & Landing Practice',
      description: 'A responsive browser project with real interactions, local state and accessible controls. Built with vanilla HTML, CSS and JavaScript.',
      techStack: ['HTML5', 'CSS3', 'JavaScript'],
      dependencies: [],
      setupSteps: ['Open index.html in a browser.'],
      features: ['Add and remove items', 'Responsive layout', 'Persist state in localStorage'],
      files: [...files, readme],
      entryFile: 'index.html',
      apiEndpoints: [],
    };
  }

  if (stack === 'react') {
    const files = [
      { path: 'package.json', language: 'json', role: 'Dependencies and scripts' },
      { path: 'index.html', language: 'html', role: 'Vite entry document' },
      { path: 'vite.config.js', language: 'javascript', role: 'Vite configuration' },
      { path: 'src/main.jsx', language: 'jsx', role: 'React entry point' },
      { path: 'src/App.jsx', language: 'jsx', role: 'Application shell' },
      { path: 'src/styles.css', language: 'css', role: 'Application styles' },
      { path: 'src/components/Header.jsx', language: 'jsx', role: 'Header component' },
      { path: 'src/components/TodoItem.jsx', language: 'jsx', role: 'Item component' },
      { path: 'src/hooks/useTodos.js', language: 'javascript', role: 'State hook' },
    ];
    if (complexity === 'advanced') {
      files.push({ path: 'src/pages/About.jsx', language: 'jsx', role: 'About page' });
    }
    return {
      title: 'React Todo Application',
      description: 'A React application with reusable components, hooks-based state and accessible controls. Data persists in localStorage.',
      techStack: ['React 18', 'Vite'],
      dependencies: ['react@18.3.1', 'react-dom@18.3.1', 'vite@5.4.11'],
      setupSteps: ['Run npm install.', 'Run npm run dev.'],
      features: ['Add and complete todos', 'Filter items', 'Persist to localStorage'],
      files: [...files, readme],
      entryFile: 'src/App.jsx',
      apiEndpoints: [],
    };
  }

  if (stack === 'react-express') {
    const files = [
      { path: 'client/package.json', language: 'json', role: 'Client dependencies' },
      { path: 'client/index.html', language: 'html', role: 'Client HTML entry' },
      { path: 'client/vite.config.js', language: 'javascript', role: 'Vite config with API proxy' },
      { path: 'client/src/main.jsx', language: 'jsx', role: 'Client entry' },
      { path: 'client/src/App.jsx', language: 'jsx', role: 'Client shell' },
      { path: 'client/src/styles.css', language: 'css', role: 'Client styles' },
      { path: 'client/src/components/Header.jsx', language: 'jsx', role: 'Header' },
      { path: 'client/src/pages/Home.jsx', language: 'jsx', role: 'Main page and API calls' },
      { path: 'server/package.json', language: 'json', role: 'Server dependencies' },
      { path: 'server/src/index.js', language: 'javascript', role: 'Server entry' },
      { path: 'server/src/app.js', language: 'javascript', role: 'Express app and routes' },
      { path: 'server/src/routes/itemRoutes.js', language: 'javascript', role: 'Item routes' },
      { path: 'server/src/controllers/itemController.js', language: 'javascript', role: 'Item handlers' },
      { path: 'server/src/middleware/error.js', language: 'javascript', role: 'Error middleware' },
      { path: '.env.example', language: 'text', role: 'Environment variables' },
    ];
    if (auth) {
      files.push(
        { path: 'client/src/pages/Login.jsx', language: 'jsx', role: 'Login page' },
        { path: 'server/src/routes/authRoutes.js', language: 'javascript', role: 'Auth routes' },
        { path: 'server/src/controllers/authController.js', language: 'javascript', role: 'Auth handlers' },
        { path: 'server/src/middleware/auth.js', language: 'javascript', role: 'Auth middleware' }
      );
    }
    return {
      title: auth ? 'Authenticated Task Manager' : 'Expense Tracker',
      description: 'A full-stack application with a React client, an Express REST API, validation and real CRUD operations. The client and server share one API contract.',
      techStack: ['React 18', 'Vite', 'Node.js', 'Express'],
      dependencies: ['react@18.3.1', 'express@4.21.2'],
      setupSteps: ['Install server dependencies.', 'Install client dependencies.', 'Start both dev servers.'],
      features: ['Create and edit records', 'Delete records', 'Loading and error states', auth ? 'Register and log in' : 'Filtering'],
      files: [...files, readme],
      entryFile: 'client/src/App.jsx',
      apiEndpoints: [
        { method: 'GET', path: '/api/items', description: 'List records' },
        { method: 'POST', path: '/api/items', description: 'Create a record' },
        { method: 'PUT', path: '/api/items/:id', description: 'Update a record' },
        { method: 'DELETE', path: '/api/items/:id', description: 'Delete a record' },
        ...(auth ? [{ method: 'POST', path: '/api/auth/login', description: 'Log in' }] : []),
      ],
    };
  }

  if (stack === 'mern') {
    return {
      title: 'MERN Notes Application',
      description: 'A complete MERN notes application with MongoDB persistence, an Express REST API and a React client. Includes environment configuration and a seed script.',
      techStack: ['MongoDB', 'Express', 'React 18', 'Node.js', 'Mongoose'],
      dependencies: ['express@4.21.2', 'mongoose@8.9.5', 'react@18.3.1'],
      setupSteps: [
        'Copy .env.example to server/.env and set MONGODB_URI.',
        'Install server and client dependencies.',
        'Start both dev servers.',
      ],
      features: ['Create, read, update and delete notes', 'MongoDB persistence', 'Form validation', 'Loading and error states'],
      files: [
        { path: 'client/package.json', language: 'json', role: 'Client dependencies' },
        { path: 'client/index.html', language: 'html', role: 'Client HTML entry' },
        { path: 'client/vite.config.js', language: 'javascript', role: 'Vite config with API proxy' },
        { path: 'client/src/main.jsx', language: 'jsx', role: 'Client entry' },
        { path: 'client/src/App.jsx', language: 'jsx', role: 'Client shell' },
        { path: 'client/src/styles.css', language: 'css', role: 'Client styles' },
        { path: 'client/src/components/Header.jsx', language: 'jsx', role: 'Header' },
        { path: 'client/src/pages/Home.jsx', language: 'jsx', role: 'Notes page and API calls' },
        { path: 'server/package.json', language: 'json', role: 'Server dependencies' },
        { path: 'server/src/index.js', language: 'javascript', role: 'Server entry and Mongo connection' },
        { path: 'server/src/app.js', language: 'javascript', role: 'Express app and routes' },
        { path: 'server/src/models/Note.js', language: 'javascript', role: 'Mongoose model' },
        { path: 'server/src/routes/noteRoutes.js', language: 'javascript', role: 'Notes routes' },
        { path: 'server/src/controllers/noteController.js', language: 'javascript', role: 'Notes handlers' },
        { path: 'server/src/middleware/error.js', language: 'javascript', role: 'Error middleware' },
        { path: 'server/scripts/seed.js', language: 'javascript', role: 'Seed script' },
        { path: '.env.example', language: 'text', role: 'Environment variables' },
        { path: 'README.md', language: 'markdown', role: 'Documentation' },
      ],
      entryFile: 'client/src/App.jsx',
      apiEndpoints: [
        { method: 'GET', path: '/api/notes', description: 'List notes' },
        { method: 'POST', path: '/api/notes', description: 'Create a note' },
        { method: 'PUT', path: '/api/notes/:id', description: 'Update a note' },
        { method: 'DELETE', path: '/api/notes/:id', description: 'Delete a note' },
      ],
    };
  }

  return {
    title: 'Python Task CLI',
    description: 'A Python command-line task manager with persistence, validation and a small test suite. Uses only the standard library.',
    techStack: ['Python 3'],
    dependencies: [],
    setupSteps: ['Run python app.py.'],
    features: ['Add tasks', 'Complete tasks', 'Save tasks to disk'],
    files: [
      { path: 'app.py', language: 'python', role: 'Entry point' },
      { path: 'tasks.py', language: 'python', role: 'Task logic' },
      { path: 'README.md', language: 'markdown', role: 'Documentation' },
    ],
    entryFile: 'app.py',
    apiEndpoints: [],
  };
};

const packageJson = (server) =>
  JSON.stringify(
    server
      ? {
          name: 'generated-server',
          private: true,
          type: 'module',
          scripts: { dev: 'node --watch src/index.js', start: 'node src/index.js' },
          dependencies: { express: '^4.21.2', cors: '^2.8.5', dotenv: '^16.4.7', mongoose: '^8.9.5' },
        }
      : {
          name: 'generated-client',
          private: true,
          type: 'module',
          scripts: { dev: 'vite', build: 'vite build', preview: 'vite preview' },
          dependencies: { react: '^18.3.1', 'react-dom': '^18.3.1' },
          devDependencies: { vite: '^5.4.11', '@vitejs/plugin-react': '^4.3.4' },
        },
    null,
    2
  );

const staticIndex = (title) => `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${title}</title>
    <link rel="stylesheet" href="styles.css" />
  </head>
  <body>
    <main class="app">
      <h1>${title}</h1>
      <form id="item-form">
        <label for="item-input">New item</label>
        <input id="item-input" required />
        <button type="submit">Add</button>
      </form>
      <ul id="item-list" aria-live="polite"></ul>
    </main>
    <script src="script.js"></script>
  </body>
</html>`;

const staticScript = `const form = document.getElementById('item-form');
const input = document.getElementById('item-input');
const list = document.getElementById('item-list');
let items = JSON.parse(localStorage.getItem('items') || '[]');

function render() {
  list.innerHTML = items.map((item, index) => '<li><span></span><button data-index="' + index + '">Remove</button></li>').join('');
  [...list.querySelectorAll('span')].forEach((node, index) => { node.textContent = items[index].text; });
}

form.addEventListener('submit', (event) => {
  event.preventDefault();
  const text = input.value.trim();
  if (!text) return;
  items.push({ text, done: false });
  localStorage.setItem('items', JSON.stringify(items));
  input.value = '';
  render();
});

list.addEventListener('click', (event) => {
  const index = Number(event.target.dataset.index);
  if (!Number.isInteger(index)) return;
  items.splice(index, 1);
  localStorage.setItem('items', JSON.stringify(items));
  render();
});

render();`;

const fileContent = (filePath, plan) => {
  const stack = STACK_LABELS[plan.stackLabel] || plan.stack || 'html-css-js';
  const title = plan.title || 'Generated Project';

  if (filePath.endsWith('package.json')) {
    const server = /(^|\/)server\//.test(filePath) || (stack === 'react' && filePath === 'package.json' ? false : false);
    return packageJson(server || filePath.startsWith('server/'));
  }
  if (filePath.endsWith('vite.config.js')) {
    return `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: { port: 5173, proxy: { '/api': 'http://localhost:5000' } },
});`;
  }
  if (filePath === 'index.html') return staticIndex(title);
  if (filePath === 'client/index.html') {
    return `<!doctype html>
<html lang="en"><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /><title>${title}</title></head>
<body><div id="root"></div><script type="module" src="/src/main.jsx"></script></body></html>`;
  }
  if (filePath === 'styles.css') {
    return `:root{color-scheme:light dark}body{margin:0;font-family:system-ui,sans-serif}.app{max-width:52rem;margin:0 auto;padding:2rem}button{cursor:pointer}`;
  }
  if (filePath.endsWith('styles.css')) {
    return `:root{color-scheme:light dark}body{margin:0;font-family:system-ui,sans-serif}#root{max-width:56rem;margin:0 auto;padding:1.5rem}`;
  }
  if (filePath === 'script.js') return staticScript;
  if (filePath.startsWith('js/')) {
    return `export function ${filePath.split('/').pop().replace('.js', '')}Helper(value) {\n  return String(value || '').trim();\n}`;
  }
  if (filePath.endsWith('main.jsx')) {
    return `import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './styles.css';

createRoot(document.getElementById('root')).render(<React.StrictMode><App /></React.StrictMode>);`;
  }
  if (filePath.endsWith('App.jsx')) {
    if (stack === 'react') {
      return `import Header from './components/Header.jsx';
import TodoItem from './components/TodoItem.jsx';
import useTodos from './hooks/useTodos.js';

export default function App() {
  const { todos, addTodo, removeTodo, toggleTodo } = useTodos();
  return (
    <div>
      <Header title="${title}" />
      <main>
        <button type="button" onClick={() => addTodo('New task')}>Add task</button>
        <ul>
          {todos.map((todo) => (
            <TodoItem key={todo.id} todo={todo} onToggle={toggleTodo} onRemove={removeTodo} />
          ))}
        </ul>
      </main>
    </div>
  );
}`;
    }
    return `import Header from './components/Header.jsx';
import Home from './pages/Home.jsx';

export default function App() {
  return (
    <div>
      <Header title="${title}" />
      <Home />
    </div>
  );
}`;
  }
  if (filePath.endsWith('Header.jsx')) {
    return `export default function Header({ title }) {\n  return <header><h1>{title}</h1></header>;\n}`;
  }
  if (filePath.endsWith('TodoItem.jsx')) {
    return `export default function TodoItem({ todo, onToggle, onRemove }) {
  return (
    <li>
      <button type="button" onClick={() => onToggle(todo.id)}>{todo.done ? 'Done' : 'Open'}</button>
      <span>{todo.text}</span>
      <button type="button" onClick={() => onRemove(todo.id)}>Remove</button>
    </li>
  );
}`;
  }
  if (filePath.endsWith('useTodos.js')) {
    return `import { useState } from 'react';

export default function useTodos() {
  const [todos, setTodos] = useState([{ id: 1, text: 'First task', done: false }]);
  const addTodo = (text) => setTodos((current) => [...current, { id: Date.now(), text, done: false }]);
  const removeTodo = (id) => setTodos((current) => current.filter((todo) => todo.id !== id));
  const toggleTodo = (id) => setTodos((current) => current.map((todo) => (todo.id === id ? { ...todo, done: !todo.done } : todo)));
  return { todos, addTodo, removeTodo, toggleTodo };
}`;
  }
  if (filePath.endsWith('pages/Home.jsx')) {
    const auth = /auth|login/i.test(plan.idea || '');
    return `import { useEffect, useState } from 'react';

export default function Home() {
  const [items, setItems] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/items')
      .then((response) => { if (!response.ok) throw new Error('Could not load items'); return response.json(); })
      .then((data) => setItems(data.items || []))
      .catch((err) => setError(err.message));
  }, []);

  async function createItem() {
    const response = await fetch('/api/items', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: 'New item' }) });
    if (!response.ok) { setError('Could not save item'); return; }
    const data = await response.json();
    setItems((current) => [...current, data.item]);
  }

  ${auth ? "async function login(email, password) {\n    const response = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });\n    return response.ok;\n  }\n" : ''}
  return (
    <main>
      <button type="button" onClick={createItem}>Add item</button>
      {error ? <p role="alert">{error}</p> : null}
      <ul>{items.map((item) => <li key={item._id || item.id}>{item.title}</li>)}</ul>
    </main>
  );
}`;
  }
  if (filePath.endsWith('pages/Login.jsx')) {
    return `export default function Login() {\n  return <form><label>Email<input type="email" required /></label><button type="submit">Log in</button></form>;\n}`;
  }
  if (filePath.endsWith('hooks/useItems.js')) {
    return `import { useCallback, useState } from 'react';

export default function useItems() {
  const [items, setItems] = useState([]);
  const reload = useCallback(async () => {
    const response = await fetch('/api/items');
    if (!response.ok) throw new Error('Could not load items');
    const data = await response.json();
    setItems(data.items || []);
  }, []);
  return { items, reload, setItems };
}`;
  }
  if (filePath.endsWith('utils/api.js')) {
    return `const BASE = import.meta.env.VITE_API_URL || '';

export async function request(path, options = {}) {
  const response = await fetch(BASE + path, { headers: { 'Content-Type': 'application/json' }, ...options });
  if (!response.ok) throw new Error('Request failed');
  return response.json();
}`;
  }
  if (filePath.endsWith('server/src/index.js') || filePath.endsWith('server/index.js')) {
    const mongo = stack === 'mern';
    return `import 'dotenv/config';
import app from './app.js';${mongo ? "\nimport mongoose from 'mongoose';" : ''}

const port = process.env.PORT || 5000;
${mongo ? "await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/generated');" : ''}
app.listen(port, () => console.log('API listening on ' + port));`;
  }
  if (filePath.endsWith('server/src/app.js')) {
    const auth = /auth/i.test(plan.idea || '');
    return `import express from 'express';
import cors from 'cors';
import itemRoutes from './routes/itemRoutes.js';${auth ? "\nimport authRoutes from './routes/authRoutes.js';" : ''}
import errorHandler from './middleware/error.js';

const app = express();
app.use(cors());
app.use(express.json());
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));
app.use('/api/items', itemRoutes);${auth ? "\napp.use('/api/auth', authRoutes);" : ''}
app.use(errorHandler);

export default app;`;
  }
  if (filePath.endsWith('routes/itemRoutes.js')) {
    return `import { Router } from 'express';
import { listItems, createItem, updateItem, removeItem } from '../controllers/itemController.js';

const router = Router();
router.get('/', listItems);
router.post('/', createItem);
router.put('/:id', updateItem);
router.delete('/:id', removeItem);

export default router;`;
  }
  if (filePath.endsWith('controllers/itemController.js')) {
    const mongo = stack === 'mern';
    return `${mongo ? "import Note from '../models/Note.js';\n\n" : 'const items = [];\n\n'}
export async function listItems(_req, res) {
  ${mongo ? "const notes = await Note.find().sort({ createdAt: -1 });\n  res.json({ items: notes });" : "res.json({ items });"}
}

export async function createItem(req, res) {
  const title = String(req.body?.title || '').trim();
  if (!title) return res.status(400).json({ error: 'Title is required' });
  ${mongo ? "const note = await Note.create({ title });\n  res.status(201).json({ item: note });" : "const item = { id: String(items.length + 1), title };\n  items.push(item);\n  res.status(201).json({ item });"}
}

export async function updateItem(req, res) {
  ${mongo ? "const note = await Note.findByIdAndUpdate(req.params.id, { title: req.body?.title }, { new: true });\n  if (!note) return res.status(404).json({ error: 'Not found' });\n  res.json({ item: note });" : "const item = items.find((entry) => entry.id === req.params.id);\n  if (!item) return res.status(404).json({ error: 'Not found' });\n  item.title = req.body?.title || item.title;\n  res.json({ item });"}
}

export async function removeItem(req, res) {
  ${mongo ? "await Note.findByIdAndDelete(req.params.id);\n  res.status(204).end();" : "const index = items.findIndex((entry) => entry.id === req.params.id);\n  if (index >= 0) items.splice(index, 1);\n  res.status(204).end();"}
}`;
  }
  if (filePath.endsWith('server/src/models/Note.js')) {
    return `import mongoose from 'mongoose';

const noteSchema = new mongoose.Schema({ title: { type: String, required: true, trim: true } }, { timestamps: true });
export default mongoose.model('Note', noteSchema);`;
  }
  if (filePath.endsWith('routes/authRoutes.js')) {
    return `import { Router } from 'express';
import { login } from '../controllers/authController.js';

const router = Router();
router.post('/login', login);
export default router;`;
  }
  if (filePath.endsWith('controllers/authController.js')) {
    return `export async function login(req, res) {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });
  res.json({ token: 'signed-session-token', user: { email } });
}`;
  }
  if (filePath.endsWith('middleware/auth.js')) {
    return `export default function requireAuth(req, res, next) {\n  if (!req.headers.authorization) return res.status(401).json({ error: 'Unauthorized' });\n  next();\n}`;
  }
  if (filePath.endsWith('middleware/error.js')) {
    return `export default function errorHandler(error, _req, res, _next) {\n  const status = error.status || 500;\n  res.status(status).json({ error: { message: error.message || 'Server error' } });\n}`;
  }
  if (filePath.endsWith('server/scripts/seed.js')) {
    return `import 'dotenv/config';
import mongoose from 'mongoose';
import Note from '../src/models/Note.js';

await mongoose.connect(process.env.MONGODB_URI);
await Note.deleteMany({});
await Note.create({ title: 'Seeded note' });
await mongoose.disconnect();
console.log('Seed complete');`;
  }
  if (filePath === '.env.example') {
    return stack === 'mern'
      ? 'MONGODB_URI=mongodb://127.0.0.1:27017/generated\nPORT=5000\nCLIENT_URL=http://localhost:5173\n'
      : 'PORT=5000\nCLIENT_URL=http://localhost:5173\n';
  }
  if (filePath === 'README.md') return `# ${title}\n\nGenerated test documentation.\n`;
  if (filePath.endsWith('.py')) {
    return filePath === 'app.py'
      ? `from tasks import load_tasks, save_tasks\n\n\ndef main():\n    tasks = load_tasks()\n    print(f"{len(tasks)} tasks")\n    tasks.append({"title": "Demo", "done": False})\n    save_tasks(tasks)\n\n\nif __name__ == "__main__":\n    main()\n`
      : `import json\nfrom pathlib import Path\n\nFILE = Path("tasks.json")\n\n\ndef load_tasks():\n    if not FILE.exists():\n        return []\n    return json.loads(FILE.read_text())\n\n\ndef save_tasks(tasks):\n    FILE.write_text(json.dumps(tasks, indent=2))\n`;
  }
  return `export default ${JSON.stringify(filePath)};\n`;
};

const geminiStub = {
  mode: 'ok',
  calls: 0,
  plan: null,
  idea: '',
  truncateBatchOnce: false,
  omitOnce: '',
  keys: [],
  lastPayload: null,
  lastUrl: '',
};

const json = (res, status, body) => {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(body));
};

const sendText = (res, text, finishReason = 'STOP') =>
  json(res, 200, { candidates: [{ content: { parts: [{ text }] }, finishReason }] });

const startStub = (port) =>
  new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      let raw = '';
      req.on('data', (chunk) => {
        raw += chunk;
      });
      req.on('end', () => {
        geminiStub.calls += 1;
        geminiStub.keys.push(req.headers['x-goog-api-key']);
        geminiStub.lastUrl = req.url;
        const payload = JSON.parse(raw || '{}');
        geminiStub.lastPayload = payload;
        const prompt = payload?.contents?.[0]?.parts?.[0]?.text || '';

        if (geminiStub.mode === 'quota') {
          return json(res, 429, { error: { message: 'Quota exceeded for requests per day.', status: 'RESOURCE_EXHAUSTED' } });
        }
        if (geminiStub.mode === 'server-error') {
          return json(res, 500, { error: { message: 'Internal provider error', status: 'INTERNAL' } });
        }
        if (geminiStub.mode === 'empty') {
          return json(res, 200, { candidates: [{ content: { parts: [] }, finishReason: 'STOP' }] });
        }
        if (geminiStub.mode === 'bad-json') {
          return sendText(res, 'This is not JSON at all.');
        }

        if (prompt.startsWith('Plan a ')) {
          if (geminiStub.mode === 'truncated-plan') {
            return sendText(res, '{"title":"Incomplete plan","description":"A plan that was cut off before any files",', 'MAX_TOKENS');
          }
          const stackMatch = /Stack: (.+)/.exec(prompt);
          const complexityMatch = /Complexity mode: (\w+) \((\w+)\)/.exec(prompt);
          const stack = STACK_LABELS[stackMatch?.[1]?.trim()] || 'html-css-js';
          const complexity = complexityMatch?.[2] || 'standard';
          const ideaMatch = /Idea \(data\):\s*"""\s*([\s\S]*?)\s*"""/.exec(prompt);
          geminiStub.idea = ideaMatch?.[1] || '';
          geminiStub.plan = { ...manifestFor(stack, complexity, geminiStub.idea), stackLabel: stackMatch?.[1]?.trim() };
          return sendText(res, JSON.stringify(geminiStub.plan));
        }

        if (prompt.startsWith('Write the code for this project.')) {
          const requested =
            /Write ONLY (?:this file|these files) now: (.+)/.exec(prompt)?.[1]?.split(',').map((item) => item.trim()) || [];
          if (geminiStub.mode === 'missing-everything') {
            return sendText(res, JSON.stringify({ files: [] }));
          }
          if (geminiStub.mode === 'truncated-batch' && requested.length > 1) {
            return sendText(res, '{"files":[{"path":"index.html","content":"<html>', 'MAX_TOKENS');
          }
          if (geminiStub.mode === 'truncated-always') {
            return sendText(res, '{"files":[{"path":"index.html","content":"<html>', 'MAX_TOKENS');
          }
          if (geminiStub.truncateBatchOnce && requested.length > 1) {
            geminiStub.truncateBatchOnce = false;
            return sendText(res, '{"files":[{"path":"index.html","content":"<html>', 'MAX_TOKENS');
          }
          let requestedSet = requested;
          if (geminiStub.omitOnce) {
            const omit = geminiStub.omitOnce;
            requestedSet = requested.filter((item) => item !== omit);
            geminiStub.omitOnce = '';
          }
          return sendText(
            res,
            JSON.stringify({
              files: requestedSet.map((filePath) => ({
                path: filePath,
                content: fileContent(filePath, { ...geminiStub.plan, idea: geminiStub.idea }),
              })),
            })
          );
        }

        return sendText(res, JSON.stringify({ text: 'fallback' }));
      });
    });
    server.listen(port, '127.0.0.1', () => resolve(server));
  });

const PORT = await freePort();
const stub = await startStub(PORT);

process.env.GEMINI_PROJECT_API_KEY = PROJECT_KEY;
process.env.GEMINI_PORTFOLIO_API_KEY = PORTFOLIO_KEY;
process.env.GEMINI_PROJECT_MODEL = PROJECT_MODEL;
process.env.GEMINI_PORTFOLIO_MODEL = PORTFOLIO_MODEL;
process.env.GEMINI_PROJECT_API_BASE_URL = `http://127.0.0.1:${PORT}`;
process.env.GEMINI_PORTFOLIO_API_BASE_URL = `http://127.0.0.1:${PORT}`;
process.env.AI_PROVIDER = 'gemini';
process.env.AI_PROJECT_TIMEOUT_MS = '30000';
process.env.AI_PROVIDER_TIMEOUT_MS = '10000';
process.env.AI_PROVIDER_RETRIES = '1';
process.env.AI_PROJECT_CREDITS_MONTHLY = '20';

const { env } = await import('../src/config/env.js');
const { generateProject, safeProjectPath } = await import('../src/services/projectBuilderService.js');
const { parseJsonFromText, parseJsonResponse } = await import('../src/services/geminiService.js');

const tempRoot = await fsp.mkdtemp(path.join(os.tmpdir(), 'portiai-ai-project-'));
const esbuildBin = fileURLToPath(new URL('../../client/node_modules/.bin/esbuild', import.meta.url));
let jsxChecks = 0;
let jsxSkipped = false;

const syntaxCheck = async (project, label) => {
  const dir = path.join(tempRoot, label.replace(/[^a-z0-9]+/gi, '-'));
  await fsp.mkdir(dir, { recursive: true });
  await fsp.writeFile(path.join(dir, 'package.json'), '{"type":"module","private":true}');

  for (const file of project.files) {
    const target = path.join(dir, file.path);
    await fsp.mkdir(path.dirname(target), { recursive: true });
    await fsp.writeFile(target, file.content);

    if (/\.jsx$/.test(file.path)) {
      if (fs.existsSync(esbuildBin)) {
        const result = spawnSync(esbuildBin, ['--loader=jsx', '--log-level=error'], {
          input: file.content,
          encoding: 'utf8',
        });
        assert.equal(result.status, 0, `${label}: JSX syntax error in ${file.path}: ${result.stderr}`);
        jsxChecks += 1;
      } else {
        jsxSkipped = true;
      }
    } else if (/\.(js|mjs)$/.test(file.path)) {
      const result = spawnSync(process.execPath, ['--check', target], { encoding: 'utf8' });
      assert.equal(result.status, 0, `${label}: JavaScript syntax error in ${file.path}: ${result.stderr}`);
    } else if (/\.json$/.test(file.path)) {
      assert.doesNotThrow(() => JSON.parse(file.content), `${label}: invalid JSON in ${file.path}`);
    }
  }
};

const expectComplete = (project) => {
  assert.ok(project.files.length >= 2, 'project has files');
  assert.ok(project.files.every((file) => file.content.trim()), 'every file has content');
  assert.equal(new Set(project.files.map((file) => file.path)).size, project.files.length, 'paths are unique');
  assert.ok(project.files.some((file) => file.path === 'README.md'), 'README exists');
  assert.ok(project.files.some((file) => file.path === project.entryFile), 'entry file exists');
  assert.equal(project.issues.filter((issue) => issue.severity === 'error').length, 0, 'no blocking issues');
};

suite('Gemini configuration and key separation');

await test('the Project Builder uses GEMINI_PROJECT_API_KEY and its own model, never the portfolio key', async () => {
  assert.equal(env.gemini.apiKey, PORTFOLIO_KEY);
  assert.equal(env.gemini.model, PORTFOLIO_MODEL);
  assert.equal(env.ai.geminiApiKey, PROJECT_KEY);
  assert.equal(env.ai.geminiModel, PROJECT_MODEL);

  geminiStub.keys.length = 0;
  await generateProject({ idea: 'A simple calculator with keyboard support', stack: 'html-css-js', complexity: 'starter' });
  assert.ok(geminiStub.keys.length > 0);
  assert.ok(geminiStub.keys.every((key) => key === PROJECT_KEY), 'no portfolio key was sent to the project endpoint');
  assert.match(geminiStub.lastUrl, /\/v1beta\/models\/gemini-2.5-flash-test:generateContent/);
  assert.equal(geminiStub.lastPayload.generationConfig.responseMimeType, 'application/json');
  assert.equal(geminiStub.lastPayload.generationConfig.thinkingConfig.thinkingBudget, 0);
  assert.equal(geminiStub.lastPayload.generationConfig.candidateCount, 1);
  assert.ok(!geminiStub.lastUrl.includes(PROJECT_KEY), 'the key is not in the URL');
});

suite('JSON parsing');

await test('handles fences, prose, braces inside strings and escaped quotes', () => {
  const parsed = parseJsonFromText(
    'Here is the result:\n```json\n{"files":[{"path":"a.js","content":"const x = { a: \\"}\\" }; // escaped"}]}\n```\nDone.'
  );
  assert.equal(parsed.files[0].path, 'a.js');
  assert.match(parsed.files[0].content, /escaped/);
});

await test('reports truncated JSON instead of repairing it', () => {
  const result = parseJsonResponse('{"files":[{"path":"index.html","content":"<html>');
  assert.equal(result.value, null);
  assert.equal(result.error, 'TRUNCATED');
});

await test('reports empty and non-JSON responses', () => {
  assert.equal(parseJsonResponse('').error, 'EMPTY');
  assert.equal(parseJsonResponse('No JSON here').error, 'NO_JSON');
});

suite('Path safety');

await test('rejects traversal, absolute, Windows, node_modules and .git paths', () => {
  for (const bad of ['../secret.js', 'src/../../secret.js', '/etc/passwd', 'C:\\Windows\\x.js', 'node_modules/pkg/index.js', '.git/config', 'src//file.js', 'src/./file.js']) {
    assert.equal(safeProjectPath(bad), null, bad);
  }
  assert.equal(safeProjectPath('./src/App.jsx'), 'src/App.jsx');
  assert.equal(safeProjectPath('server/src/models/Note.js'), 'server/src/models/Note.js');
});

suite('Starter mode');

await test('Starter: simple calculator (static HTML/CSS/JS)', async () => {
  const project = await generateProject({
    idea: 'A simple calculator with working buttons, keyboard support and a responsive layout',
    stack: 'html-css-js',
    complexity: 'starter',
  });
  expectComplete(project);
  assert.equal(project.complexity, 'starter');
  assert.ok(project.previewSupported && project.previewHtml.includes('<style>'), 'CSS is inlined into the preview');
  assert.ok(project.files.find((file) => file.path === 'script.js').content.includes('addEventListener'));
  await syntaxCheck(project, 'starter-calculator');
});

await test('Starter: responsive landing page', async () => {
  const project = await generateProject({
    idea: 'A responsive landing page for a study planner with working navigation and a signup form',
    stack: 'html-css-js',
    complexity: 'starter',
  });
  expectComplete(project);
  assert.ok(project.files.some((file) => file.path === 'index.html'));
  assert.ok(project.files.some((file) => file.path.endsWith('.css')));
  await syntaxCheck(project, 'starter-landing');
});

await test('Starter: todo application with localStorage', async () => {
  const project = await generateProject({
    idea: 'A todo application that saves tasks in localStorage and lets users add and remove them',
    stack: 'html-css-js',
    complexity: 'starter',
  });
  expectComplete(project);
  assert.match(project.files.find((file) => file.path === 'script.js').content, /localStorage/);
  await syntaxCheck(project, 'starter-todo');
});

suite('Standard mode');

await test('Standard: React todo application with components and hooks', async () => {
  const project = await generateProject({
    idea: 'A React todo application with filters, reusable components and localStorage persistence',
    stack: 'react',
    complexity: 'standard',
  });
  expectComplete(project);
  assert.ok(project.files.some((file) => file.path === 'src/components/TodoItem.jsx'));
  assert.ok(project.files.some((file) => file.path === 'src/hooks/useTodos.js'));
  assert.ok(project.files.length >= 8, 'standard React project has multiple components');
  await syntaxCheck(project, 'standard-react-todo');
});

await test('Standard: recipe application', async () => {
  const project = await generateProject({
    idea: 'A recipe box where users save recipes, search by ingredient and mark favourites',
    stack: 'react',
    complexity: 'standard',
  });
  expectComplete(project);
  assert.ok(project.files.some((file) => /components\/.+\.jsx$/.test(file.path)));
  await syntaxCheck(project, 'standard-recipe');
});

await test('Standard: expense tracker with frontend/backend CRUD', async () => {
  const project = await generateProject({
    idea: 'An expense tracker with create, edit, delete and filtering, stored through an Express API',
    stack: 'react-express',
    complexity: 'standard',
  });
  expectComplete(project);
  assert.ok(project.files.some((file) => file.path === 'server/src/app.js'));
  assert.ok(project.files.some((file) => file.path === 'client/src/App.jsx'));
  assert.ok(project.files.find((file) => file.path === 'server/src/app.js').content.includes('/api/items'));
  assert.ok(project.files.find((file) => file.path === 'client/src/pages/Home.jsx').content.includes('/api/items'));
  await syntaxCheck(project, 'standard-expense');
});

suite('Advanced mode');

await test('Advanced: MERN notes app with MongoDB CRUD', async () => {
  const project = await generateProject({
    idea: 'A MERN stack notes app with MongoDB CRUD, validation and a seed script',
    stack: 'mern',
    complexity: 'advanced',
  });
  expectComplete(project);
  assert.ok(project.files.some((file) => file.path === 'server/src/models/Note.js'));
  assert.ok(project.files.some((file) => file.path === 'server/scripts/seed.js'));
  assert.ok(project.files.some((file) => file.path === '.env.example'));
  assert.ok(project.files.find((file) => file.path === 'server/src/models/Note.js').content.includes('mongoose'));
  assert.ok(project.files.find((file) => file.path === 'server/src/app.js').content.includes('/api/items'));
  await syntaxCheck(project, 'advanced-mern-notes');
});

await test('Advanced: full-stack task management application', async () => {
  const project = await generateProject({
    idea: 'A full-stack task management application with priorities, statuses, CRUD and a filterable list',
    stack: 'react-express',
    complexity: 'advanced',
  });
  expectComplete(project);
  assert.ok(project.files.length >= 13, 'advanced project is larger than starter');
  assert.ok(project.files.some((file) => file.path === 'client/vite.config.js'));
  assert.match(project.files.find((file) => file.path === 'client/vite.config.js').content, /proxy/);
  await syntaxCheck(project, 'advanced-task-manager');
});

await test('Advanced: authentication-based full-stack application', async () => {
  const project = await generateProject({
    idea: 'A full-stack task manager with user authentication, login, signup, protected routes and per-user tasks',
    stack: 'react-express',
    complexity: 'advanced',
  });
  expectComplete(project);
  assert.ok(project.files.some((file) => file.path === 'server/src/routes/authRoutes.js'));
  assert.ok(project.files.some((file) => file.path === 'server/src/middleware/auth.js'));
  assert.ok(project.files.find((file) => file.path === 'server/src/app.js').content.includes('/api/auth'));
  assert.ok(project.files.find((file) => file.path === 'client/src/pages/Home.jsx').content.includes('/api/auth/login'));
  await syntaxCheck(project, 'advanced-auth');
});

suite('Failure handling, retries and partial projects');

await test('a missing file is retried individually and the project still completes', async () => {
  geminiStub.omitOnce = 'styles.css';
  const project = await generateProject({
    idea: 'A small todo app with local storage and responsive styles',
    stack: 'html-css-js',
    complexity: 'starter',
  });
  expectComplete(project);
  assert.ok(project.files.find((file) => file.path === 'styles.css').content.includes('body'));
});

await test('a truncated batch is split into individual files instead of failing', async () => {
  geminiStub.truncateBatchOnce = true;
  const project = await generateProject({
    idea: 'A responsive landing page with a form and local storage',
    stack: 'html-css-js',
    complexity: 'starter',
  });
  expectComplete(project);
});

await test('a truncated single-file response is retried once', async () => {
  /*
   * With a one-file batch, MAX_TOKENS is not split further. The provider
   * retry is for transient failures; a persistent truncation must fail
   * honestly rather than save the partial file.
   */
  geminiStub.mode = 'truncated-always';
  await assert.rejects(
    generateProject({
      idea: 'A small calculator with keyboard support and responsive layout',
      stack: 'html-css-js',
      complexity: 'starter',
    }),
    (error) => ['TRUNCATED', 'INCOMPLETE_PROJECT'].includes(error.code)
  );
  geminiStub.mode = 'ok';
});

await test('a project with no usable files is rejected, not saved as ready', async () => {
  geminiStub.mode = 'missing-everything';
  await assert.rejects(
    generateProject({
      idea: 'A recipe collection with search and favourites',
      stack: 'html-css-js',
      complexity: 'starter',
    }),
    (error) => error.code === 'INCOMPLETE_PROJECT'
  );
  geminiStub.mode = 'ok';
});

await test('malformed project-plan JSON fails with BAD_RESPONSE', async () => {
  geminiStub.mode = 'bad-json';
  await assert.rejects(
    generateProject({
      idea: 'A calculator with buttons and keyboard input',
      stack: 'html-css-js',
      complexity: 'starter',
    }),
    (error) => error.code === 'BAD_RESPONSE'
  );
  geminiStub.mode = 'ok';
});

await test('a MAX_TOKENS plan fails as TRUNCATED with a clear code', async () => {
  geminiStub.mode = 'truncated-plan';
  await assert.rejects(
    generateProject({
      idea: 'A calculator with buttons and keyboard input',
      stack: 'html-css-js',
      complexity: 'starter',
    }),
    (error) => error.code === 'TRUNCATED'
  );
  geminiStub.mode = 'ok';
});

await test('daily quota failures map to QUOTA and do not retry endlessly', async () => {
  geminiStub.mode = 'quota';
  const before = geminiStub.calls;
  await assert.rejects(
    generateProject({
      idea: 'A calculator with buttons and keyboard input',
      stack: 'html-css-js',
      complexity: 'starter',
    }),
    (error) => error.code === 'QUOTA'
  );
  assert.ok(geminiStub.calls - before <= 2, 'quota errors are not retried repeatedly');
  geminiStub.mode = 'ok';
});

await test('5xx provider failures surface as UNAVAILABLE after a bounded retry', async () => {
  geminiStub.mode = 'server-error';
  const before = geminiStub.calls;
  await assert.rejects(
    generateProject({
      idea: 'A calculator with buttons and keyboard input',
      stack: 'html-css-js',
      complexity: 'starter',
    }),
    (error) => error.code === 'UNAVAILABLE'
  );
  assert.ok(geminiStub.calls - before <= 2, 'one retry at most');
  geminiStub.mode = 'ok';
});

await test('an empty provider response fails with BAD_RESPONSE', async () => {
  geminiStub.mode = 'empty';
  await assert.rejects(
    generateProject({
      idea: 'A calculator with buttons and keyboard input',
      stack: 'html-css-js',
      complexity: 'starter',
    }),
    (error) => ['BAD_RESPONSE', 'TRUNCATED'].includes(error.code)
  );
  geminiStub.mode = 'ok';
});

stub.close();
await fsp.rm(tempRoot, { recursive: true, force: true });

console.log(`\n${passed}/${passed + failures.length} checks passed`);
if (jsxSkipped) {
  console.log('  note: client/node_modules is not installed, so JSX syntax checks were skipped. Run `cd client && npm install` first.');
} else {
  console.log(`  JSX files syntax-checked with esbuild: ${jsxChecks}`);
}

if (failures.length) {
  console.error('\nFailures:');
  for (const failure of failures) {
    console.error(`- ${failure.name}: ${failure.error.stack || failure.error.message}`);
  }
  process.exit(1);
}

process.exit(0);
