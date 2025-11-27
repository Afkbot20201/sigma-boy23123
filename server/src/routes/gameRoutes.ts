import { Router } from 'express';
import { auth } from '../middleware/auth.js';
import { getGame, getGameMoves } from '../controllers/gameController.js';

const router = Router();
router.get('/:id', auth, getGame);
router.get('/:id/moves', auth, getGameMoves);
export default router;
