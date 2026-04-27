const express = require('express');
const { getLiveContent } = require('../controllers/broadcastController');

const router = express.Router();

router.get('/:teacherId', getLiveContent);

module.exports = router;
