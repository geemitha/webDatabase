const express = require("express");
const path = require("path");
const multer = require("multer");
const csv = require("csv-parser");
const fs = require("fs");
const sequelize = require("../config/sequelize");
const Journal = require("../config/journal");

const app = express();
const router = express.Router();

// Configure multer for file uploads
const upload = multer({ dest: "uploads/" });

// Sync database
sequelize.sync().then(() => {
    console.log('Database synced');
});

// Endpoint to retrieve data
router.get("/data", async (req, res) => {
    try {
        const journals = await Journal.findAll();
        res.json(journals);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Endpoint to add new entry
router.post("/data", async (req, res) => {
    try {
        const newEntry = await Journal.create(req.body);
        res.json({ success: true, data: newEntry });
    } catch (error) {
        if (error.name === 'SequelizeUniqueConstraintError') {
            res.status(400).json({ success: false, message: "Duplicate ISSN. This ISSN already exists in the database." });
        } else {
            res.status(500).json({ success: false, message: error.message });
        }
    }
});

// Endpoint to update an entry
router.put("/data/:id", async (req, res) => {
    const { id } = req.params;
    await Journal.update(req.body, { where: { id } });
    res.json({ success: true });
});

// Endpoint to delete an entry
router.delete("/data/:id", async (req, res) => {
    const { id } = req.params;
    await Journal.destroy({ where: { id } });
    res.json({ success: true });
});

// Endpoint for bulk upload
router.post("/bulk-data", upload.single("csvFile"), (req, res) => {
    const filePath = req.file.path;
    const entries = [];
    const requiredHeaders = ["title", "issn", "publisher", "ranking", "discipline", "journalHome"];
    let headersValid = true;

    fs.createReadStream(filePath)
        .pipe(csv())
        .on("headers", (headers) => {
            headersValid = requiredHeaders.every(header => headers.includes(header));
            if (!headersValid) {
                fs.unlinkSync(filePath); // Remove the uploaded file
                return res.status(400).json({ success: false, message: "Invalid CSV template" });
            }
        })
        .on("data", (row) => {
            if (headersValid) {
                const { title, issn, publisher, ranking, discipline, journalHome } = row;
                if (title && issn && publisher && ranking && discipline && journalHome) {
                    entries.push({ title, issn, publisher, ranking, discipline, journalHome });
                }
            }
        })
        .on("end", async () => {
            if (headersValid) {
                try {
                    await Journal.bulkCreate(entries, { ignoreDuplicates: true });
                    fs.unlinkSync(filePath); // Remove the uploaded file
                    res.json({ success: true, message: "Bulk upload successful", data: entries });
                } catch (error) {
                    fs.unlinkSync(filePath); // Remove the uploaded file
                    if (error.name === 'SequelizeUniqueConstraintError') {
                        res.status(400).json({ success: false, message: "Duplicate ISSN found in the CSV file." });
                    } else {
                        res.status(500).json({ success: false, message: error.message });
                    }
                }
            }
        })
        .on("error", (error) => {
            fs.unlinkSync(filePath); // Remove the uploaded file
            res.status(500).json({ success: false, message: "Error processing CSV file", error });
        });
});

module.exports = router;