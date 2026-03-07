const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['Admin', 'Project Manager', 'Team Member'], default: 'Team Member' },
    skills: [{ type: String }],
    availability: {
        workingHoursPerDay: { type: Number, default: 8 },
        timeZone: { type: String, default: 'UTC' }
    },
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
