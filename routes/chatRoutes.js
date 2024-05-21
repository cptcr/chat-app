import express from 'express';
import { getChatPage, sendMessage } from '../controllers/chatController.js';
import { authenticateToken } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/chat', authenticateToken, getChatPage);
router.post('/message', authenticateToken, sendMessage);

export default router;
