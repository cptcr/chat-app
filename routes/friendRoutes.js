import express from 'express';
import { sendFriendRequest, acceptFriendRequest, denyFriendRequest, getFriends, getFriendRequests } from '../controllers/friendController.js';
import { authenticateToken } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/send-friend-request', authenticateToken, sendFriendRequest);
router.post('/accept-friend-request', authenticateToken, acceptFriendRequest);
router.post('/deny-friend-request', authenticateToken, denyFriendRequest);
router.get('/friends', authenticateToken, getFriends);
router.get('/friend-requests', authenticateToken, getFriendRequests);

export default router;
