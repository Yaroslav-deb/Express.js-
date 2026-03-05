import express from 'express';

const app = express();
const PORT = 3000;

const events = [
    { id: 1, title: "Конференція розробників", description: "Основи Node.js", date: "2023-11-15", organizer: "IT Hub" },
    { id: 2, title: "Майстер-клас з HTTP", description: "Створення базового сервера", date: "2023-11-20", organizer: "Tech Academy" },
    { id: 3, title: "Express.js для початківців", description: "Роутинг та Middleware", date: "2023-12-05", organizer: "Code School" },
    { id: 4, title: "Просунутий Node", description: "Потоки (Streams)", date: "2023-10-10", organizer: "IT Hub" },
    { id: 5, title: "Бази даних", description: "Основи SQL", date: "2024-01-20", organizer: "Data Pros" }
];

app.use((req, res, next) => {
    const requestTime = new Date().toISOString();
    console.log(`[${requestTime}] Отримано запит: ${req.method} ${req.url}`);
    next();
});

app.get('/events', (req, res) => {
    let { page = 1, limit = 10, sort, order = 'asc' } = req.query;

    page = parseInt(page);
    limit = parseInt(limit);

    if (isNaN(page) || page < 1) {
        return res.status(400).json({ error: "Параметр page повинен бути числом >= 1" });
    }
    if (isNaN(limit) || limit < 1) {
        return res.status(400).json({ error: "Параметр limit повинен бути числом >= 1" });
    }

    let resultEvents = [...events];

    if (sort === 'date' || sort === 'title') {
        resultEvents.sort((a, b) => {
            if (a[sort] < b[sort]) return order === 'desc' ? 1 : -1;
            if (a[sort] > b[sort]) return order === 'desc' ? -1 : 1;
            return 0;
        });
    }

    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const paginatedEvents = resultEvents.slice(startIndex, endIndex);

    res.json({
        total: resultEvents.length,
        page,
        limit,
        data: paginatedEvents
    });
});

app.listen(PORT, () => {
    console.log(`Сервер Express запущено: http://localhost:${PORT}`);
});