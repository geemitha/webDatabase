const express = require("express");
const path = require("path");
const multer = require("multer");
const csv = require("csv-parser");
const fs = require("fs");
const Journal = require("../config/journal");

const app = express();
const router = express.Router();

// Configure multer for file uploads
//const upload = multer({ dest: "uploads/" });

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
// Ensure "uploads" directory exists
const uploadDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure Multer to store files in "uploads" directory
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});

const upload = multer({ storage });

// Endpoint for bulk upload
router.post("/bulk-data", upload.single("csvFile"), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ success: false, message: "No file uploaded" });
    }

    const filePath = req.file.path;
    const entries = [];
    const requiredHeaders = ["title", "issn", "publisher", "ranking", "discipline", "journalHome"];
    let headersValid = true;

    try {
        await new Promise((resolve, reject) => {
            fs.createReadStream(filePath)
                .pipe(csv())
                .on("headers", (headers) => {
                    headersValid = requiredHeaders.every(header => headers.includes(header));
                    if (!headersValid) {
                        reject(new Error("Invalid CSV template"));
                    }
                })
                .on("data", (row) => {
                    if (headersValid && row) {  // <-- Ensure row is not undefined
                        const cleanRow = {};

                        requiredHeaders.forEach((header) => {
                            cleanRow[header] = row?.[header] ?? ""; // Safe optional chaining
                        });

                        cleanRow.isArchive = 'false'; // Set isArchive to false for new data
                        entries.push(cleanRow);
                    }
                })
                .on("end", resolve)
                .on("error", reject);
        });

        if (!headersValid) {
            throw new Error("Invalid CSV template");
        }

        // Set isArchive to true for existing records
        await Journal.update({ isArchive: 'true' }, { where: { isArchive: 'false' } });

        // Insert data in batches of 10
        const batchSize = 10;
        for (let i = 0; i < entries.length; i += batchSize) {
            const batch = entries.slice(i, i + batchSize);
            await Journal.bulkCreate(batch, { ignoreDuplicates: true });
        }

        res.json({ success: true, message: "Bulk upload successful", totalRecords: entries.length });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    } finally {
        // Always remove the uploaded file after processing
        fs.unlink(filePath, (err) => {
            if (err) console.error("Error deleting file:", err);
        });
    }
});



module.exports = router;