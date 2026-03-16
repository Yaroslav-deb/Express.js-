import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import session from 'express-session';
import bcrypt from 'bcrypt';
import { Event, Participant, User } from './models.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('Успішне підключення до MongoDB'))
    .catch(err => console.error('Помилка підключення до БД:', err));

app.use(express.json());

app.use(session({
    secret: 'super_secret_key_123',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 }
}));

const isAuthenticated = (req, res, next) => {
    if (req.session.user) {
        return next();
    }
    res.status(401).json({ error: 'Неавторизовано. Будь ласка, увійдіть у систему.' });
};

const authorizeRole = (roles) => {
    return (req, res, next) => {
        if (!req.session.user || !roles.includes(req.session.user.role)) {
            return res.status(403).json({ error: 'Доступ заборонено. Недостатньо прав.' });
        }
        next();
    };
};

app.post('/register', async (req, res) => {
    try {
        const { email, password, role } = req.body;
        
        const candidate = await User.findOne({ email });
        if (candidate) {
            return res.status(400).json({ message: 'Користувач з таким email вже існує' });
        }
        
        const hashedPassword = await bcrypt.hash(password, 10);
        
        const user = new User({
            email,
            password: hashedPassword,
            role: role || 'Organizer'
        });
        
        await user.save();
        res.status(201).json({ message: 'Користувача створено успішно' });
    } catch (e) {
        res.status(500).json({ message: 'Помилка при реєстрації' });
    }
});

app.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Користувача не знайдено' });
        }
        
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Невірний пароль' });
        }
        
        req.session.user = { id: user._id, email: user.email, role: user.role };
        res.json({ message: 'Вхід виконано успішно', user: req.session.user });
    } catch (e) {
        res.status(500).json({ message: 'Помилка при вході' });
    }
});

app.post('/logout', (req, res) => {
    req.session.destroy();
    res.json({ message: 'Вихід виконано успішно' });
});

app.get('/events', async (req, res) => {
    try {
        let { page = 1, limit = 10, sort = 'date', order = 'asc', cursor } = req.query;
        limit = parseInt(limit);
        page = parseInt(page);
        
        const sortOrder = order === 'desc' ? -1 : 1;
        let query = {};

        if (cursor) {
            query._id = { $gt: cursor };
            const events = await Event.find(query).limit(limit);
            return res.json({
                type: 'cursor-based',
                nextCursor: events.length > 0 ? events[events.length - 1]._id : null,
                data: events
            });
        }

        const skip = (page - 1) * limit;
        const events = await Event.find(query)
            .sort({ [sort]: sortOrder })
            .skip(skip)
            .limit(limit);

        const total = await Event.countDocuments();

        res.json({
            type: 'offset-based',
            total,
            page,
            limit,
            data: events
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/participants/:eventId', isAuthenticated, async (req, res) => {
    try {
        const participants = await Participant.find({ eventId: req.params.eventId });
        res.json(participants);
    } catch (error) {
        res.status(500).json({ error: 'Недійсний ID події' });
    }
});

app.delete('/events/:id', isAuthenticated, authorizeRole(['Admin']), async (req, res) => {
    try {
        res.json({ message: `Подію ${req.params.id} успішно видалено (Це заглушка для Admin)` });
    } catch (error) {
        res.status(500).json({ error: 'Помилка при видаленні' });
    }
});

app.listen(PORT, () => {
    console.log(`Сервер запущено: http://localhost:${PORT}`);
});