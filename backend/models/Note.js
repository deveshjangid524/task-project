const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema({
    title: { type: String, required: true },
    content: { type: String, required: true },
    type: { type: String, enum: ['text', 'url', 'file'], default: 'text' },
    fileUrl: { type: String },
    fileName: { type: String },
    fileSize: { type: Number },
    fileType: { type: String },
    visibility: { type: String, enum: ['public', 'selected'], default: 'public' },
    visibleTo: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

// Update the updatedAt field on save
noteSchema.pre('save', function() {
    console.log('Pre-save hook called for note');
    this.updatedAt = new Date();
    console.log('UpdatedAt set to:', this.updatedAt);
});

// Add indexes for better performance
noteSchema.index({ createdBy: 1, createdAt: -1 });
noteSchema.index({ visibility: 1 });
noteSchema.index({ type: 1 });

module.exports = mongoose.model('Note', noteSchema);
