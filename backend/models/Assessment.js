const mongoose = require('mongoose');

const assessmentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  class: {
    type: String,
    required: true
  },
  section: {
    type: String,
    default: ''
  },
  examType: {
    type: String,
    enum: ['Midterm', 'Final', 'Pre-Board', 'Unit Test', 'Assignment', 'Other'],
    default: 'Other'
  },
  subjects: [{
    name: {
      type: String,
      required: true
    },
    field: {
      type: String,
      required: true
    },
    maxMarks: {
      type: Number,
      default: 100
    },
    passMarks: {
      type: Number,
      default: 40
    }
  }],
  students: [{
    id: {
      type: Number,
      required: true
    },
    rollNo: {
      type: String,
      required: true
    },
    name: {
      type: String,
      required: true
    },
    avatar: {
      type: String,
      default: ''
    },
    marks: {
      type: Map,
      of: Number,
      default: {}
    }
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isTemplate: {
    type: Boolean,
    default: false
  },
  totalMarks: {
    type: Number,
    default: 0
  },
  passPercentage: {
    type: Number,
    default: 40
  }
}, {
  timestamps: true
});

// Calculate total marks before saving
assessmentSchema.pre('save', function(next) {
  try {
    // Ensure subjects is an array and has valid structure
    if (this.subjects && Array.isArray(this.subjects)) {
      this.totalMarks = this.subjects.reduce((total, subject) => {
        return total + (subject.maxMarks || 0);
      }, 0);
    } else {
      this.totalMarks = 0;
    }
    next();
  } catch (error) {
    console.error('Error in pre-save hook:', error);
    next(error);
  }
});

// Index for faster queries
assessmentSchema.index({ createdBy: 1, class: 1 });
assessmentSchema.index({ title: 'text', description: 'text' });

module.exports = mongoose.model('Assessment', assessmentSchema);
