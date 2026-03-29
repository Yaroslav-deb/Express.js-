import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import session from 'express-session';
import bcrypt from 'bcrypt';
import cors from 'cors';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { Event, Participant, User } from './models.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('Успішне підключення до MongoDB'))
    .catch(err => console.error('Помилка підключення до БД:', err));

app.use(express.json());
app.use(cors());

// Налаштування сесій
app.use(session({
    secret: 'super_secret_key_123',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 }
}));

const isAuthenticated = (req, res, next) => {
    if (req.session.user) return next();
    res.status(401).json({ error: 'Неавторизовано. Будь ласка, увійдіть у систему.' });
};

app.post('/register', async (req, res) => {
    try {
        const { email, password, role } = req.body;
        const candidate = await User.findOne({ email });
        if (candidate) return res.status(400).json({ message: 'Користувач вже існує' });
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({ email, password: hashedPassword, role: role || 'Organizer' });
        await user.save();
        res.status(201).json({ message: 'Користувача створено успішно' });
    } catch (e) { res.status(500).json({ message: 'Помилка при реєстрації' }); }
});

app.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(400).json({ message: 'Невірний логін або пароль' });
        }
        req.session.user = { id: user._id, email: user.email, role: user.role };
        res.json({ message: 'Вхід виконано успішно', user: req.session.user });
    } catch (e) { res.status(500).json({ message: 'Помилка при вході' }); }
});

app.get('/events', async (req, res) => {
    try {
        const events = await Event.find();
        res.json(events);
    } catch (error) { res.status(500).json({ error: error.message }); }
});

app.post('/events', isAuthenticated, async (req, res) => {
    try {
        const newEvent = new Event({ ...req.body, creator: req.session.user.id });
        await newEvent.save();
        res.status(201).json(newEvent);
    } catch (error) { res.status(500).json({ error: error.message }); }
});

app.put('/events/:id', isAuthenticated, async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);
        if (!event) return res.status(404).json({ error: 'Подію не знайдено' });
        if (event.creator.toString() !== req.session.user.id) {
            return res.status(403).json({ error: 'Можна редагувати лише свої події' });
        }
        const updatedEvent = await Event.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(updatedEvent);
    } catch (error) { res.status(500).json({ error: error.message }); }
});

app.delete('/events/:id', isAuthenticated, async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);
        if (!event) return res.status(404).json({ error: 'Подію не знайдено' });
        if (event.creator.toString() !== req.session.user.id && req.session.user.role !== 'Admin') {
            return res.status(403).json({ error: 'Доступ заборонено' });
        }
        await Event.findByIdAndDelete(req.params.id);
        res.json({ message: 'Подію успішно видалено' });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

app.post('/participants', isAuthenticated, async (req, res) => {
    try {
        const newParticipant = new Participant(req.body);
        await newParticipant.save();
        res.status(201).json(newParticipant);
    } catch (error) { res.status(500).json({ error: error.message }); }
});


const typeDefs = `#graphql
  type User { id: ID!, email: String!, role: String! }
  type Participant { id: ID!, name: String!, email: String!, eventId: ID! }
  
  type Event { 
    id: ID!, title: String!, description: String, date: String!, organizer: String, 
    creator: User, 
    participants: [Participant] # Nested field 
  }
  
  input AddEventInput { title: String!, description: String, date: String!, organizer: String }

  type Query {
    getEvents(limit: Int = 10, skip: Int = 0, title: String): [Event]
  }

  type Mutation {
    addEvent(input: AddEventInput!): Event
  }
`;

const resolvers = {
  Query: {
    getEvents: async (_, { limit, skip, title }) => {
      const query = title ? { title: { $regex: title, $options: 'i' } } : {};
      return await Event.find(query).skip(skip).limit(limit);
    }
  },
  Mutation: {
    addEvent: async (_, { input }, context) => {
      if (!context.user) throw new Error('Неавторизовано! Увійдіть у систему.');
      
      if (input.title.length < 3) throw new Error('Назва події занадто коротка');

      const event = new Event({ ...input, creator: context.user.id });
      await event.save();
      return event;
    }
  },
  Event: {
    creator: async (parent) => await User.findById(parent.creator),
    participants: async (parent) => await Participant.find({ eventId: parent._id })
  }
};

const apolloServer = new ApolloServer({ typeDefs, resolvers });
await apolloServer.start();

app.use('/graphql', expressMiddleware(apolloServer, {
    context: async ({ req }) => ({ user: req.session.user })
}));

app.listen(PORT, () => {
    console.log(`Сервер запущено: http://localhost:${PORT}`);
    console.log(`GraphQL доступний за адресою: http://localhost:${PORT}/graphql`);
});