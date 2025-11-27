import { Router } from 'express';
import { globalLeaderboard } from '../controllers/leaderboardController.js';

const router = Router();
router.get('/global', globalLeaderboard);
export default router;
