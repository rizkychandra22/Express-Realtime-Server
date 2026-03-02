import express from 'express';
import { login, register } from '../controllers/authController.js';

const router = express.Router();

export default (db) => {
    router.post('/register', register(db));
    router.post('/login', login(db));
    return router;
};