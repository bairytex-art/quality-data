const fs = require('fs');
const path = require('path');

module.exports = (req, res) => {
  // Serve the index.html file for all non-API routes
  const indexPath = path.join(__dirname, '..', 'index.html');
  
  try {
    const indexContent = fs.readFileSync(indexPath, 'utf8');
    res.setHeader('Content-Type', 'text/html');
    res.send(indexContent);
  } catch (error) {
    res.status(500).send('Error loading index.html');
  }
};
