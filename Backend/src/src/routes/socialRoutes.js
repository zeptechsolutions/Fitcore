import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { requireAuth } from '../utils/auth.js';
import { getFriendOverview, getFriendRequests, getFriends, getWeeklyRanking, removeFriend, respondFriendRequest, searchUsers, sendFriendRequest } from '../controllers/socialController.js';

const router = Router();
router.use(requireAuth);
router.get('/search', asyncHandler(searchUsers));
router.get('/friends', asyncHandler(getFriends));
router.get('/friends/:userId', asyncHandler(getFriendOverview));
router.get('/requests', asyncHandler(getFriendRequests));
router.post('/requests', asyncHandler(sendFriendRequest));
router.patch('/requests/:id', asyncHandler(respondFriendRequest));
router.delete('/friends/:userId', asyncHandler(removeFriend));
router.get('/ranking', asyncHandler(getWeeklyRanking));
export default router;
