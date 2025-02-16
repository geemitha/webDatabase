const express = require("express");
const path = require("path");
const multer = require("multer");
const sequelize = require("./config/sequelize");


const app = express();
const router = require("./routes/journalRouter");

const PORT = 3000;

// Middleware to serve static files
app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());



// Sync database
sequelize.sync().then(() => {
    console.log('Database synced');
});

app.use(router);

// Start server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});