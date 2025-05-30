const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs').promises;
const { requireAuth, requirePermission } = require('./auth');
const ActivityLogger = require('../middleware/activityLogger');

const router = express.Router();

// Configure multer for memory storage (we'll process with sharp)
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
    },
    fileFilter: (req, file, cb) => {
        // Check if file is an image
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed'), false);
        }
    }
});

// Image upload endpoint with activity logging
router.post('/upload', requireAuth, requirePermission('editor'), upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No image file provided' });
        }

        // Generate unique filename
        const timestamp = Date.now();
        const randomString = Math.random().toString(36).substring(2, 15);
        const filename = `${timestamp}_${randomString}.webp`;
        const filepath = path.join(__dirname, '../uploads/images', filename);

        // Process image with sharp (convert to WebP, resize if too large, optimize)
        await sharp(req.file.buffer)
            .resize(1920, 1080, { 
                fit: 'inside', 
                withoutEnlargement: true 
            })
            .webp({ 
                quality: 85,
                effort: 4 
            })
            .toFile(filepath);

        // Generate thumbnail for faster loading
        const thumbnailFilename = `thumb_${filename}`;
        const thumbnailPath = path.join(__dirname, '../uploads/images', thumbnailFilename);
        
        await sharp(req.file.buffer)
            .resize(400, 300, { 
                fit: 'inside', 
                withoutEnlargement: true 
            })
            .webp({ 
                quality: 70,
                effort: 4 
            })
            .toFile(thumbnailPath);

        // Store image info in database
        const db = require('../database/init').getInstance();
        const result = await db.run(
            `INSERT INTO uploaded_images (filename, thumbnail_filename, original_name, file_size, uploaded_by, created_at)
             VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
            [filename, thumbnailFilename, req.file.originalname, req.file.size, req.user.id]
        );

        // Log the image upload
        await ActivityLogger.logImageUpload(req.user.id, filename, req.file.size, req);

        res.json({
            success: true,
            imageId: result.id,
            filename: filename,
            thumbnailFilename: thumbnailFilename,
            url: `/uploads/images/${filename}`,
            thumbnailUrl: `/uploads/images/${thumbnailFilename}`,
            originalName: req.file.originalname
        });

    } catch (error) {
        console.error('Error uploading image:', error);
        
        // Log the failed upload
        await ActivityLogger.log({
            staffUserId: req.user.id,
            actionType: 'upload',
            resourceType: 'image',
            actionDetails: {
                originalFilename: req.file?.originalname,
                fileSize: req.file?.size,
                errorMessage: error.message
            },
            ipAddress: req.ip,
            userAgent: req.get('User-Agent'),
            sessionId: req.sessionID,
            success: false,
            errorMessage: error.message
        });
        
        res.status(500).json({ error: 'Failed to upload image' });
    }
});

// Get uploaded images (for image picker)
router.get('/list', requireAuth, requirePermission('editor'), async (req, res) => {
    try {
        const db = require('../database/init').getInstance();
        const images = await db.all(`
            SELECT ui.*, su.steam_username as uploaded_by_username
            FROM uploaded_images ui
            LEFT JOIN staff_users su ON ui.uploaded_by = su.id
            ORDER BY ui.created_at DESC
            LIMIT 50
        `);

        res.json(images.map(img => ({
            id: img.id,
            filename: img.filename,
            thumbnailFilename: img.thumbnail_filename,
            originalName: img.original_name,
            url: `/uploads/images/${img.filename}`,
            thumbnailUrl: `/uploads/images/${img.thumbnail_filename}`,
            uploadedBy: img.uploaded_by_username,
            createdAt: img.created_at
        })));
    } catch (error) {
        console.error('Error fetching images:', error);
        res.status(500).json({ error: 'Failed to fetch images' });
    }
});

// Delete image
router.delete('/:id', requireAuth, requirePermission('moderator'), async (req, res) => {
    try {
        const { id } = req.params;
        const db = require('../database/init').getInstance();
        
        // Get image info
        const image = await db.get('SELECT * FROM uploaded_images WHERE id = ?', [id]);
        if (!image) {
            return res.status(404).json({ error: 'Image not found' });
        }

        // Delete files
        const imagePath = path.join(__dirname, '../uploads/images', image.filename);
        const thumbnailPath = path.join(__dirname, '../uploads/images', image.thumbnail_filename);
        
        try {
            await fs.unlink(imagePath);
            await fs.unlink(thumbnailPath);
        } catch (fileError) {
            console.warn('Could not delete image files:', fileError);
        }

        // Remove from database
        await db.run('DELETE FROM uploaded_images WHERE id = ?', [id]);

        res.json({ success: true, message: 'Image deleted successfully' });
    } catch (error) {
        console.error('Error deleting image:', error);
        res.status(500).json({ error: 'Failed to delete image' });
    }
});

module.exports = router; 