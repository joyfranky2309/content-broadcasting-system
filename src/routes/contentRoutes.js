const express = require('express');
const { uploadContent, submitContent } = require('../controllers/uploadController');
const { verifyToken, verifyRole } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware');

const router = express.Router();

router.post('/upload', verifyToken, verifyRole('teacher'), upload.single('file'), uploadContent);
router.post('/:contentId/submit', verifyToken, verifyRole('teacher'), submitContent);

module.exports = router;
