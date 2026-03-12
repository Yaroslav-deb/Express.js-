import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Event, Participant } from './models.js';

dotenv.config();

async function seedDB() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Підключено до MongoDB. Очищення бази...');
        
        await Event.deleteMany({});
        await Participant.deleteMany({});

        const events = await Event.insertMany([
            { title: "Конференція розробників", description: "Основи Node.js", date: "2023-11-15", organizer: "IT Hub" },
            { title: "Майстер-клас з HTTP", description: "Створення базового сервера", date: "2023-11-20", organizer: "Tech Academy" },
            { title: "Express.js для початківців", description: "Роутинг та Middleware", date: "2023-12-05", organizer: "Code School" },
            { title: "Просунутий Node", description: "Потоки (Streams)", date: "2023-10-10", organizer: "IT Hub" },
            { title: "Бази даних", description: "Основи SQL", date: "2024-01-20", organizer: "Data Pros" }
        ]);

        await Participant.insertMany([
            { name: "Іван Іванов", email: "ivan@example.com", eventId: events[0]._id },
            { name: "Олена Петрівна", email: "olena@example.com", eventId: events[0]._id }
        ]);

        console.log('Базу даних успішно наповнено!');
        process.exit(0);
    } catch (error) {
        console.error('Помилка Seed-скрипта:', error);
        process.exit(1);
    }
}

seedDB();