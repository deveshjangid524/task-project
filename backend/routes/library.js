const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Book = require('../models/Book');
const authMiddleware = require('../middleware/authMiddleware');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'uploads/books';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  // Accept PDF, EPUB, TXT files
  const allowedTypes = ['application/pdf', 'application/epub+zip', 'text/plain'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only PDF, EPUB, and TXT files are allowed'), false);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  },
  fileFilter: fileFilter
});

// Get all books for user
router.get('/', authMiddleware.protect, async (req, res) => {
  try {
    const { category, search, page = 1, limit = 12 } = req.query;
    const query = { uploadedBy: req.user._id };
    
    if (category && category !== 'all') {
      query.category = category;
    }
    
    if (search) {
      query.$text = { $search: search };
    }
    
    const books = await Book.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select('-filePath'); // Exclude file path from list view
    
    const total = await Book.countDocuments(query);
    
    res.json({
      books,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Error fetching books:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get book by ID
router.get('/:id', authMiddleware.protect, async (req, res) => {
  try {
    const book = await Book.findOne({ 
      _id: req.params.id, 
      uploadedBy: req.user._id 
    });
    if (!book) return res.status(404).json({ error: 'Book not found' });
    res.json(book);
  } catch (error) {
    console.error('Error fetching book:', error);
    res.status(500).json({ error: error.message });
  }
});

// Import book from Open Library (without file)
router.post('/import', authMiddleware.protect, async (req, res) => {
  try {
    const { title, author, description, category, tags, isbn, publishedYear, language, pageCount, coverImage } = req.body;
    
    // Validation
    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Title is required' });
    }
    
    if (!author || !author.trim()) {
      return res.status(400).json({ error: 'Author is required' });
    }
    
    // Parse tags if provided
    let parsedTags = [];
    if (tags) {
      parsedTags = tags.split(',').map(tag => tag.trim()).filter(tag => tag);
    }
    
    const book = new Book({
      title: title.trim(),
      author: author.trim(),
      description: description?.trim() || '',
      category: category || 'Fiction',
      tags: parsedTags,
      isbn: isbn?.trim() || '',
      publishedYear: publishedYear ? parseInt(publishedYear) : undefined,
      language: language?.trim() || 'English',
      pageCount: pageCount ? parseInt(pageCount) : undefined,
      coverImage: coverImage?.trim() || '',
      fileName: null,
      originalName: null,
      filePath: null,
      fileSize: 0,
      mimeType: null,
      uploadedBy: req.user._id,
      isImported: true
    });
    
    await book.save();
    console.log('Book imported successfully:', book._id);
    
    res.status(201).json(book);
  } catch (error) {
    console.error('Error importing book:', error);
    res.status(400).json({ error: error.message });
  }
});

// Upload new book
router.post('/upload', authMiddleware.protect, upload.single('bookFile'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    const { title, author, description, category, tags, isbn, publishedYear, language, pageCount } = req.body;
    
    // Validation
    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Title is required' });
    }
    
    if (!author || !author.trim()) {
      return res.status(400).json({ error: 'Author is required' });
    }
    
    // Parse tags if provided
    let parsedTags = [];
    if (tags) {
      parsedTags = tags.split(',').map(tag => tag.trim()).filter(tag => tag);
    }
    
    const book = new Book({
      title: title.trim(),
      author: author.trim(),
      description: description?.trim() || '',
      category: category || 'Other',
      tags: parsedTags,
      isbn: isbn?.trim() || '',
      publishedYear: publishedYear ? parseInt(publishedYear) : undefined,
      language: language?.trim() || 'English',
      pageCount: pageCount ? parseInt(pageCount) : undefined,
      fileName: req.file.filename,
      originalName: req.file.originalname,
      filePath: req.file.path,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      uploadedBy: req.user._id
    });
    
    await book.save();
    console.log('Book uploaded successfully:', book._id);
    
    // Return book without filePath for security
    const bookResponse = book.toObject();
    delete bookResponse.filePath;
    
    res.status(201).json(bookResponse);
  } catch (error) {
    console.error('Error uploading book:', error);
    
    // Clean up uploaded file if there was an error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(400).json({ error: error.message });
  }
});

// Download/read book
router.get('/:id/read', authMiddleware.protect, async (req, res) => {
  try {
    const book = await Book.findOne({ 
      _id: req.params.id, 
      uploadedBy: req.user._id 
    });
    
    if (!book) {
      return res.status(404).json({ error: 'Book not found' });
    }
    
    if (!fs.existsSync(book.filePath)) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    // Increment download count
    await Book.findByIdAndUpdate(req.params.id, { $inc: { downloadCount: 1 } });
    
    res.setHeader('Content-Type', book.mimeType);
    res.setHeader('Content-Disposition', `inline; filename="${book.originalName}"`);
    
    const fileStream = fs.createReadStream(book.filePath);
    fileStream.pipe(res);
  } catch (error) {
    console.error('Error reading book:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update book details
router.put('/:id', authMiddleware.protect, async (req, res) => {
  try {
    const { title, author, description, category, tags, isbn, publishedYear, language, pageCount } = req.body;
    
    const updateData = {};
    if (title) updateData.title = title.trim();
    if (author) updateData.author = author.trim();
    if (description !== undefined) updateData.description = description.trim();
    if (category) updateData.category = category;
    if (tags !== undefined) {
      updateData.tags = tags.split(',').map(tag => tag.trim()).filter(tag => tag);
    }
    if (isbn !== undefined) updateData.isbn = isbn.trim();
    if (publishedYear !== undefined) updateData.publishedYear = parseInt(publishedYear) || undefined;
    if (language) updateData.language = language.trim();
    if (pageCount !== undefined) updateData.pageCount = parseInt(pageCount) || undefined;
    
    const book = await Book.findOneAndUpdate(
      { _id: req.params.id, uploadedBy: req.user._id },
      updateData,
      { new: true, runValidators: true }
    ).select('-filePath');
    
    if (!book) return res.status(404).json({ error: 'Book not found' });
    
    res.json(book);
  } catch (error) {
    console.error('Error updating book:', error);
    res.status(400).json({ error: error.message });
  }
});

// Delete book
router.delete('/:id', authMiddleware.protect, async (req, res) => {
  try {
    const book = await Book.findOneAndDelete({
      _id: req.params.id,
      uploadedBy: req.user._id
    });
    
    if (!book) {
      return res.status(404).json({ error: 'Book not found' });
    }
    
    // Delete file from filesystem
    if (fs.existsSync(book.filePath)) {
      fs.unlinkSync(book.filePath);
    }
    
    console.log('Book deleted successfully:', book._id);
    res.json({ message: 'Book deleted successfully' });
  } catch (error) {
    console.error('Error deleting book:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
