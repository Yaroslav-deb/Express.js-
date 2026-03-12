import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Event, Participant } from './models.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('Успішне підключення до MongoDB'))
    .catch(err => console.error('Помилка підключення до БД:', err));

app.use(express.json());

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

app.get('/participants/:eventId', async (req, res) => {
    try {
        const participants = await Participant.find({ eventId: req.params.eventId });
        res.json(participants);
    } catch (error) {
        res.status(500).json({ error: 'Недійсний ID події' });
    }
});

app.listen(PORT, () => {
    console.log(`Сервер запущено: http://localhost:${PORT}`);
});