import { Router } from 'express';
import { adminOnly, auth } from '../middleware/auth.js';
import { banUser, listUsers, resetElo, unbanUser } from '../controllers/adminController.js';

const router = Router();
router.use(auth, adminOnly);
router.get('/users', listUsers);
router.post('/users/:id/ban', banUser);
router.post('/users/:id/unban', unbanUser);
router.post('/users/:id/reset-elo', resetElo);
export default router;
