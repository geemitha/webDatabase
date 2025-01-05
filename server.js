const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware to parse JSON and URL-encoded data
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Serve static files (e.g., the HTML and CSS)
app.use(express.static(path.join(__dirname, 'public')));

// Endpoint to handle form submissions
let tableData = [];
app.post('/submit', (req, res) => {
    const newData = req.body;
    tableData.push(newData);
    res.json({ success: true, data: tableData });
});

// Get table data
app.get('/data', (req, res) => {
    res.json(tableData);
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
