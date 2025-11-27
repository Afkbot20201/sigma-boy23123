import { Request, Response } from 'express';
import { loginUser, registerUser } from '../services/authService.js';
import { AuthedRequest } from '../middleware/auth.js';

export async function register(req: Request, res: Response) {
  const { username, email, password } = req.body;
  if (!username || !email || !password) return res.status(400).json({ error: 'Missing fields' });
  try {
    const data = await registerUser(username, email, password);
    res.json(data);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
}

export async function login(req: Request, res: Response) {
  const { emailOrUsername, password } = req.body;
  if (!emailOrUsername || !password) return res.status(400).json({ error: 'Missing fields' });
  try {
    const data = await loginUser(emailOrUsername, password);
    res.json(data);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
}

export async function me(req: AuthedRequest, res: Response) {
  res.json({ user: req.user });
}
