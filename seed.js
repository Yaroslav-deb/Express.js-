import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import { Event, Participant, User } from './models.js';

dotenv.config();

async function seedDB() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Очищення бази...');
        await Event.deleteMany({});
        await Participant.deleteMany({});
        await User.deleteMany({});

        const hashedPassword = await bcrypt.hash('123', 10);
        const adminUser = await User.create({ email: 'admin@mail.com', password: hashedPassword, role: 'Admin' });

        const events = await Event.insertMany([
            { title: "Конференція розробників", description: "Основи", date: "20.03.2026", organizer: "IT Hub", creator: adminUser._id },
            { title: "GraphQL Майстер-клас", description: "Створення API", date: "01.03.2026", organizer: "Academy", creator: adminUser._id }
        ]);

        await Participant.insertMany([
            { name: "Панченко Ярослав", email: "introvergest@gmail.com", eventId: events[0]._id },
            { name: "Кузін Богдан", email: "bogdan@example.com", eventId: events[0]._id }
        ]);

        console.log('Базу даних успішно наповнено!');
        process.exit(0);
    } catch (error) {
        console.error('Помилка:', error);
        process.exit(1);
    }
}
seedDB();