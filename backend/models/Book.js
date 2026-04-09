const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  author: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  category: {
    type: String,
    enum: ['Fiction', 'Non-Fiction', 'Educational', 'Technical', 'Science', 'History', 'Biography', 'Self-Help', 'Other'],
    default: 'Other'
  },
  tags: [{
    type: String,
    trim: true
  }],
  isbn: {
    type: String,
    trim: true
  },
  publishedYear: {
    type: Number
  },
  language: {
    type: String,
    default: 'English'
  },
  pageCount: {
    type: Number
  },
  fileName: {
    type: String,
    required: function() { return !this.isImported; }
  },
  originalName: {
    type: String,
    required: function() { return !this.isImported; }
  },
  filePath: {
    type: String,
    required: function() { return !this.isImported; }
  },
  fileSize: {
    type: Number,
    required: function() { return !this.isImported; }
  },
  mimeType: {
    type: String,
    required: function() { return !this.isImported; }
  },
  coverImage: {
    type: String
  },
  isImported: {
    type: Boolean,
    default: false
  },
  rating: {
    type: Number,
    min: 0,
    max: 5,
    default: 0
  },
  isPublic: {
    type: Boolean,
    default: true
  },
  downloadCount: {
    type: Number,
    default: 0
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Index for faster queries
bookSchema.index({ uploadedBy: 1, category: 1 });
bookSchema.index({ title: 'text', author: 'text', description: 'text' });
bookSchema.index({ tags: 1 });

module.exports = mongoose.model('Book', bookSchema);
