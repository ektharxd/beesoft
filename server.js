require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// Dynamically load all API routes from the api/ directory
const apiDir = path.join(__dirname, 'api');
fs.readdirSync(apiDir).forEach(file => {
  if (file.endsWith('.js')) {
    const routeName = file.replace('.js', '');
    const routePath = `/api/${routeName}`;
    const handlerModule = require(path.join(apiDir, file));
    // Support both default export (ESM) and module.exports (CJS)
    const handler = handlerModule.default || handlerModule;

    // If handler is an Express router, use app.use
    if (typeof handler === 'function' && handler.name === 'router') {
      app.use(routePath, handler);
    } else if (typeof handler === 'function') {
      // If handler is a plain function (req, res)
      app.all([routePath, `${routePath}/*`], (req, res) => handler(req, res));
    } else {
      console.warn(`API handler for ${routePath} is not a function or router.`);
    }
  }
});


// Mount admin routers from admin-dashboard/backend/routes under /api/admin
const adminRoutesDir = path.join(__dirname, 'admin-dashboard', 'backend', 'routes');
if (fs.existsSync(adminRoutesDir)) {
  fs.readdirSync(adminRoutesDir).forEach(file => {
    if (file.endsWith('.js')) {
      const routeName = file.replace('.js', '');
      const routePath = `/api/admin/${routeName}`;
      const handlerModule = require(path.join(adminRoutesDir, file));
      const handler = handlerModule.default || handlerModule;
      if (typeof handler === 'function' && handler.name === 'router') {
        app.use(routePath, handler);
      } else if (typeof handler === 'function') {
        app.all([routePath, `${routePath}/*`], (req, res) => handler(req, res));
      } else {
        console.warn(`Admin API handler for ${routePath} is not a function or router.`);
      }
    }
  });
}

app.listen(PORT, () => {
  console.log(`Local API server running at http://localhost:${PORT}`);
});
