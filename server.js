const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer'); // Middleware for handling file uploads
const { v4: uuidv4 } = require('uuid');

const app = express();
const port = process.env.PORT || 3000;

// Configure Multer (File Uploads)
// We save files to a temporary 'uploads' folder
const upload = multer({ 
    dest: 'uploads/',
    limits: { fileSize: 1024 * 1024 * 1 } // Limit: 1 MB
});

// Ensure 'uploads' directory exists
if (!fs.existsSync('uploads')){
    fs.mkdirSync('uploads');
}

app.use(express.static(path.join(__dirname, 'public')));

// In-memory database to map IDs to File Paths
// Structure: { uuid: { path: 'uploads/filename', originalName: 'image.png' } }
const fileStore = new Map();

// 1. Upload Endpoint
app.post('/api/upload', upload.single('secretFile'), (req, res) => {
    // Check if file exists
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded or file too large (Max 1MB).' });
    }

    const id = uuidv4();
    
    // Save file info to memory
    fileStore.set(id, {
        path: req.file.path,
        originalName: req.file.originalname
    });

    // Generate link
    const protocol = req.protocol;
    const host = req.get('host');
    const downloadLink = `${protocol}://${host}/download/${id}`;

    res.json({ url: downloadLink });
});

// 2. Download (and Destroy) Endpoint
app.get('/download/:id', (req, res) => {
    const id = req.params.id;
    const fileData = fileStore.get(id);

    if (fileData) {
        const filePath = fileData.path;
        const fileName = fileData.originalName;

        // 1. Remove from map so the link is invalid immediately
        fileStore.delete(id);

        // 2. Send the file to the user
        res.download(filePath, fileName, (err) => {
            if (err) {
                console.error("Error sending file:", err);
            }

            // 3. CRITICAL: Delete the file from the disk (Server Memory)
            // This runs whether the download succeeded or failed
            fs.unlink(filePath, (unlinkErr) => {
                if (unlinkErr) console.error("Error deleting file:", unlinkErr);
                else console.log(`File ${fileName} deleted from server.`);
            });
        });

    } else {
        res.status(404).send(`
            <h1 style="font-family:sans-serif; text-align:center; margin-top:50px;">
                404 | File not found or already deleted.
            </h1>
        `);
    }
});

app.listen(port, () => {
    console.log(`File server running on port ${port}`);
});
