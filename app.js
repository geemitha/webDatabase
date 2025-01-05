const express = require("express");
const path = require("path");

const app = express();
const PORT = 3000;

// Middleware to serve static files
app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());

// Temporary storage for table data
let tableData = [];

// Endpoint to retrieve data
app.get("/data", (req, res) => {
    res.json(tableData);
});

// Endpoint to add new entry
app.post("/data", (req, res) => {
    const newEntry = req.body;
    tableData.push(newEntry);
    res.json({ success: true });
});

// Endpoint to handle bulk data upload
app.post("/bulk-data", (req, res) => {
    const bulkEntries = req.body;
    tableData = [...tableData, ...bulkEntries];
    res.json({ success: true });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});



