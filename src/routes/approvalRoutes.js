const express = require('express');
const { approveContent, rejectContent, getPendingContent } = require('../controllers/approvalController');
const { verifyToken, verifyRole } = require('../middlewares/authMiddleware');

const router = express.Router();

// All routes require principal role
router.use(verifyToken, verifyRole('principal'));

router.get('/pending', getPendingContent);
router.put('/:contentId/approve', approveContent);
router.put('/:contentId/reject', rejectContent);

module.exports = router;
