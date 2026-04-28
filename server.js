require('dotenv').config();
const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files (frontend)
app.use(express.static(__dirname));

// Root route - serve the main HTML file with injected config
app.get('/', (req, res) => {
  const filePath = path.join(process.cwd(), 'index.html');
  try {
    let content = require('fs').readFileSync(filePath, 'utf8');
    
    // Inject environment variables into the HTML for the frontend to use
    const config = {
      SUPABASE_URL: process.env.SUPABASE_URL,
      SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY
    };
    
    const configScript = `<script>window.CONFIG = ${JSON.stringify(config)};</script>`;
    content = content.replace('</head>', `${configScript}</head>`);
    
    res.send(content);
  } catch (err) {
    console.error('Error reading index.html:', err);
    res.status(500).send('Internal Server Error');
  }
});

// Catch-all handler for client-side routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`Static server running on port ${PORT}`);
  console.log(`Frontend available at http://localhost:${PORT}`);
});

module.exports = app;
