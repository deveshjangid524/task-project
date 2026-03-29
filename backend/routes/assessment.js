const express = require('express');
const router = express.Router();
const Assessment = require('../models/Assessment');
const authMiddleware = require('../middleware/authMiddleware');

// Get all assessments for user
router.get('/', authMiddleware.protect, async (req, res) => {
  try {
    console.log('Fetching assessments for user:', req.user);
    const assessments = await Assessment.find({ createdBy: req.user._id })
      .sort({ createdAt: -1 });
    console.log('Found assessments:', assessments.length);
    res.json(assessments);
  } catch (error) {
    console.error('Error fetching assessments:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get assessment by ID
router.get('/:id', authMiddleware.protect, async (req, res) => {
  try {
    console.log('Fetching assessment by ID:', req.params.id, 'for user:', req.user);
    const assessment = await Assessment.findOne({ 
      _id: req.params.id, 
      createdBy: req.user._id 
    });
    if (!assessment) return res.status(404).json({ error: 'Assessment not found' });
    res.json(assessment);
  } catch (error) {
    console.error('Error fetching assessment:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create new assessment
router.post('/', authMiddleware.protect, async (req, res) => {
  try {
    console.log('🚀 Incoming body:', req.body);
    console.log('👤 User creating assessment:', req.user);
    
    // Manual validation first
    if (!req.body.title || !req.body.title.trim()) {
      return res.status(400).json({ error: 'Title is required' });
    }
    
    if (!req.body.class || !req.body.class.trim()) {
      return res.status(400).json({ error: 'Class is required' });
    }
    
    if (!req.body.subjects || !Array.isArray(req.body.subjects) || req.body.subjects.length === 0) {
      return res.status(400).json({ error: 'At least one subject is required' });
    }
    
    // Validate subjects structure
    for (let i = 0; i < req.body.subjects.length; i++) {
      const subject = req.body.subjects[i];
      if (!subject.name || !subject.name.trim()) {
        return res.status(400).json({ error: `Subject ${i + 1} name is required` });
      }
      if (!subject.field || !subject.field.trim()) {
        return res.status(400).json({ error: `Subject ${i + 1} field is required` });
      }
      // Check for spaces in field
      if (subject.field.includes(' ')) {
        return res.status(400).json({ error: `Subject ${i + 1} field cannot contain spaces` });
      }
    }
    
    // Ensure description is not empty
    req.body.description = req.body.description?.trim() || 'No description provided';
    
    // Clean up fields
    req.body.subjects = req.body.subjects.map(subject => ({
      ...subject,
      name: subject.name.trim(),
      field: subject.field.trim().replace(/\s+/g, ''), // Remove any spaces
      maxMarks: parseInt(subject.maxMarks) || 100,
      passMarks: parseInt(subject.passMarks) || 40
    }));
    
    console.log('✅ Validation passed, creating assessment...');
    
    const assessment = new Assessment({
      ...req.body,
      createdBy: req.user._id
    });
    
    await assessment.save();
    console.log('✅ Assessment created successfully:', assessment._id);
    res.status(201).json(assessment);
  } catch (error) {
    console.error('❌ FULL ERROR:', error);
    console.error('❌ VALIDATION:', error.errors);
    console.error('❌ ERROR MESSAGE:', error.message);
    
    // Handle validation errors specifically
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        error: 'Validation failed',
        details: validationErrors,
        receivedData: req.body 
      });
    }
    
    res.status(400).json({ 
      error: error.message,
      details: error.errors,
      receivedData: req.body 
    });
  }
});

// Update assessment
router.put('/:id', authMiddleware.protect, async (req, res) => {
  try {
    console.log('Updating assessment:', req.params.id, 'with data:', req.body);
    const assessment = await Assessment.findOneAndUpdate(
      { _id: req.params.id, createdBy: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!assessment) return res.status(404).json({ error: 'Assessment not found' });
    console.log('Assessment updated successfully');
    res.json(assessment);
  } catch (error) {
    console.error('Error updating assessment:', error);
    res.status(400).json({ error: error.message });
  }
});

// Delete assessment
router.delete('/:id', authMiddleware.protect, async (req, res) => {
  try {
    console.log('Deleting assessment:', req.params.id);
    const assessment = await Assessment.findOneAndDelete({
      _id: req.params.id,
      createdBy: req.user._id
    });
    if (!assessment) return res.status(404).json({ error: 'Assessment not found' });
    console.log('Assessment deleted successfully');
    res.json({ message: 'Assessment deleted successfully' });
  } catch (error) {
    console.error('Error deleting assessment:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
