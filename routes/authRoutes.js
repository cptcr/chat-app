import express from 'express';
import { signup, login } from '../controllers/authController.js';

const router = express.Router();

router.get('/signup', (req, res) => res.render('signup', { title: 'Sign Up' }));
router.post('/signup', signup);
router.get('/login', (req, res) => res.render('login', { title: 'Login' }));
router.post('/login', login);

export default router;
