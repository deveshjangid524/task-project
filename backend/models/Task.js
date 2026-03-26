const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String },
    category: { type: String },
    priority: { type: String, enum: ['Low', 'Medium', 'High', 'Critical'], default: 'Medium' },
    status: { type: String, enum: ['To Do', 'In Progress', 'In Review', 'Completed', 'Blocked'], default: 'To Do' },
    assignedTo: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }], // Array to support multiple assignees
    dependsOn: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Task' }],
    timeEstimates: {
        estimatedHours: { type: Number, required: true },
        aiSuggestedHours: { type: Number }
    },
    scheduling: {
        manualStartDate: { type: Date },
        manualDueDate: { type: Date },
        aiOptimizedStartDate: { type: Date },
        aiOptimizedDueDate: { type: Date },
        isRescheduledByAI: { type: Boolean, default: false }
    },
    attachmentLinks: [{
        url: { type: String, required: true },
        addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        addedAt: { type: Date, default: Date.now }
    }],
    // New fields for completion data
    completionData: {
        comments: { type: String },
        documents: [{
            filename: { type: String },
            originalName: { type: String },
            mimetype: { type: String },
            size: { type: Number },
            path: { type: String },
            uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
            uploadedAt: { type: Date, default: Date.now }
        }],
        completedAt: { type: Date },
        completedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
    },
    historyLogs: [{
        action: { type: String },
        changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        timestamp: { type: Date, default: Date.now },
        details: { type: String }
    }],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Track who created task
}, { timestamps: true });

taskSchema.index({ status: 1, assignedTo: 1 });
module.exports = mongoose.model('Task', taskSchema);
