import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: String,
    date: { type: Date, required: true },
    organizer: String
});

eventSchema.index({ date: 1 });
eventSchema.index({ title: 1 });

const participantSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true },
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true }
});

const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['Admin', 'Organizer', 'User'], default: 'Organizer' }
});

export const Event = mongoose.model('Event', eventSchema);
export const Participant = mongoose.model('Participant', participantSchema);
export const User = mongoose.model('User', userSchema);