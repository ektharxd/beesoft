require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Dynamically load all API routes from the api/ directory
const apiDir = path.join(__dirname, 'api');
fs.readdirSync(apiDir).forEach(file => {
  if (file.endsWith('.js')) {
    const routeName = file.replace('.js', '');
    const routePath = `/api/${routeName}`;
    const handlerModule = require(path.join(apiDir, file));
    // Support both default export (ESM) and module.exports (CJS)
    const handler = handlerModule.default || handlerModule;
    app.all(routePath, (req, res) => handler(req, res));
  }
});

app.listen(PORT, () => {
  console.log(`Local API server running at http://localhost:${PORT}`);
});
