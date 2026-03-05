import express from 'express';

const app = express();
const PORT = 3000;

// Base: Фіктивні дані (hardcoded JSON у пам'яті) [cite: 81]
const events = [
    { id: 1, title: "Конференція розробників", description: "Основи Node.js", date: "2023-11-15", organizer: "IT Hub" },
    { id: 2, title: "Майстер-клас з HTTP", description: "Створення базового сервера", date: "2023-11-20", organizer: "Tech Academy" },
    { id: 3, title: "Express.js для початківців", description: "Роутинг та Middleware", date: "2023-12-05", organizer: "Code School" },
    { id: 4, title: "Просунутий Node", description: "Потоки (Streams)", date: "2023-10-10", organizer: "IT Hub" },
    { id: 5, title: "Бази даних", description: "Основи SQL", date: "2024-01-20", organizer: "Data Pros" }
];

// Middle: Middleware для логування часу запиту [cite: 84]
app.use((req, res, next) => {
    const requestTime = new Date().toISOString();
    console.log(`[${requestTime}] Отримано запит: ${req.method} ${req.url}`);
    next();
});

// Base: Маршрут GET /events [cite: 81]
app.get('/events', (req, res) => {
    // Middle & Advanced: Отримуємо Query-параметри [cite: 83, 86]
    let { page = 1, limit = 10, sort, order = 'asc' } = req.query;

    // Advanced: Валідація Query-параметрів [cite: 87]
    page = parseInt(page);
    limit = parseInt(limit);

    if (isNaN(page) || page < 1) {
        return res.status(400).json({ error: "Параметр page повинен бути числом >= 1" });
    }
    if (isNaN(limit) || limit < 1) {
        return res.status(400).json({ error: "Параметр limit повинен бути числом >= 1" });
    }

    // Копіюємо масив для безпечної роботи
    let resultEvents = [...events];

    // Advanced: Сортування даних за датою або назвою [cite: 86]
    if (sort === 'date' || sort === 'title') {
        resultEvents.sort((a, b) => {
            if (a[sort] < b[sort]) return order === 'desc' ? 1 : -1;
            if (a[sort] > b[sort]) return order === 'desc' ? -1 : 1;
            return 0;
        });
    }

    // Middle: Пагінація [cite: 83]
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const paginatedEvents = resultEvents.slice(startIndex, endIndex);

    // Повертаємо результат
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