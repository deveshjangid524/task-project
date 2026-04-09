import React, { useState, useEffect } from 'react';
import { Search, Upload, BookOpen, Filter, Grid, List, Plus, Edit, Trash2, Eye, Download, Star } from 'lucide-react';
import axios from 'axios';

const LibraryPage = () => {
  const [books, setBooks] = useState([]);
  const [openLibraryBooks, setOpenLibraryBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [viewMode, setViewMode] = useState('grid');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showReaderModal, setShowReaderModal] = useState(false);
  const [selectedBook, setSelectedBook] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showOpenLibrary, setShowOpenLibrary] = useState(false);
  const [openLibrarySearch, setOpenLibrarySearch] = useState('react');
  const [openLibraryLoading, setOpenLibraryLoading] = useState(false);

  const categories = [
    'all', 'Fiction', 'Non-Fiction', 'Educational', 'Technical', 
    'Science', 'History', 'Biography', 'Self-Help', 'Other'
  ];

  const [uploadForm, setUploadForm] = useState({
    title: '',
    author: '',
    description: '',
    category: 'Other',
    tags: '',
    isbn: '',
    publishedYear: '',
    language: 'English',
    pageCount: '',
    file: null
  });

  useEffect(() => {
    fetchBooks();
    fetchOpenLibraryBooks();
  }, [searchTerm, selectedCategory, currentPage]);

  const fetchOpenLibraryBooks = async (query = 'javascript') => {
    try {
      setOpenLibraryLoading(true);
      
      // Try multiple approaches to avoid CORS issues
      const approaches = [
        // Approach 1: Direct fetch (might work if CORS headers are properly set)
        () => fetch(`https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=20`),
        // Approach 2: Using JSONP-like approach with callback parameter
        () => fetch(`https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=20&callback=callback`),
        // Approach 3: Using a public CORS proxy (as last resort)
        () => fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(`https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=20`)}`)
      ];
      
      let data = null;
      let lastError = null;
      
      for (const approach of approaches) {
        try {
          const response = await approach();
          if (response.ok) {
            const text = await response.text();
            // Handle potential JSONP wrapper
            if (text.startsWith('callback(') && text.endsWith(');')) {
              data = JSON.parse(text.slice(9, -2));
            } else {
              data = JSON.parse(text);
            }
            break;
          }
        } catch (error) {
          lastError = error;
          continue;
        }
      }
      
      if (data) {
        setOpenLibraryBooks(data.docs || []);
      } else {
        throw lastError || new Error('All approaches failed');
      }
    } catch (error) {
      console.error('Error fetching Open Library books:', error);
      setOpenLibraryBooks([]);
      // Show user-friendly error
      alert('Unable to fetch books from Open Library. This might be due to CORS restrictions. Please try again later.');
    } finally {
      setOpenLibraryLoading(false);
    }
  };

  const handleOpenLibrarySearch = (e) => {
    e.preventDefault();
    fetchOpenLibraryBooks(openLibrarySearch);
  };

  const importOpenLibraryBook = async (book) => {
    try {
      const bookData = {
        title: book.title || 'Unknown Title',
        author: book.author_name ? book.author_name.join(', ') : 'Unknown Author',
        description: `A book from Open Library. First published: ${book.first_publish_year || 'Unknown'}`,
        category: 'Fiction',
        tags: book.subject ? book.subject.slice(0, 5).join(', ') : '',
        isbn: book.isbn ? book.isbn[0] : '',
        publishedYear: book.first_publish_year?.toString() || '',
        language: book.language ? book.language[0] : 'English',
        pageCount: book.number_of_pages_median?.toString() || '',
        coverImage: book.cover_i ? `https://covers.openlibrary.org/b/id/${book.cover_i}-M.jpg` : ''
      };

      // Create a new endpoint for importing Open Library books
      await axios.post('/api/library/import', bookData, {
        withCredentials: true
      });
      
      fetchBooks();
      alert('Book imported successfully!');
    } catch (error) {
      console.error('Error importing book:', error);
      alert('Failed to import book: ' + (error.response?.data?.error || error.message));
    }
  };

  const fetchBooks = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (selectedCategory !== 'all') params.append('category', selectedCategory);
      params.append('page', currentPage);

      const response = await axios.get(`/api/library?${params}`, {
        withCredentials: true
      });
      
      setBooks(response.data.books || []);
      setTotalPages(response.data.totalPages || 1);
    } catch (error) {
      console.error('Error fetching books:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    
    Object.keys(uploadForm).forEach(key => {
      if (key !== 'file') {
        formData.append(key, uploadForm[key]);
      }
    });
    
    if (uploadForm.file) {
      formData.append('bookFile', uploadForm.file);
    }

    try {
      await axios.post('/api/library/upload', formData, {
        withCredentials: true,
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      setShowUploadModal(false);
      setUploadForm({
        title: '',
        author: '',
        description: '',
        category: 'Other',
        tags: '',
        isbn: '',
        publishedYear: '',
        language: 'English',
        pageCount: '',
        file: null
      });
      fetchBooks();
    } catch (error) {
      console.error('Error uploading book:', error);
    }
  };

  const handleDeleteBook = async (bookId) => {
    if (window.confirm('Are you sure you want to delete this book?')) {
      try {
        await axios.delete(`/api/library/${bookId}`, {
          withCredentials: true
        });
        fetchBooks();
      } catch (error) {
        console.error('Error deleting book:', error);
      }
    }
  };

  const openReader = (book) => {
    setSelectedBook(book);
    setShowReaderModal(true);
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const BookCard = ({ book }) => (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 p-4">
      <div className="aspect-w-3 aspect-h-4 mb-3">
        {book.coverImage ? (
          <img
            src={book.coverImage}
            alt={book.title}
            className="w-full h-48 object-cover rounded-lg"
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextElementSibling.style.display = 'flex';
            }}
          />
        ) : null}
        <div className={`w-full h-48 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg flex items-center justify-center ${book.coverImage ? 'hidden' : ''}`}>
          <BookOpen className="w-16 h-16 text-blue-600" />
        </div>
      </div>
      
      <h3 className="font-semibold text-gray-800 truncate mb-1">{book.title}</h3>
      <p className="text-sm text-gray-600 truncate mb-2">by {book.author}</p>
      
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
          {book.category}
        </span>
        <span className="text-xs text-gray-500">
          {book.isImported ? 'Imported' : formatFileSize(book.fileSize)}
        </span>
      </div>
      
      {book.description && (
        <p className="text-xs text-gray-600 line-clamp-2 mb-3">
          {book.description}
        </p>
      )}
      
      <div className="flex gap-2">
        {!book.isImported ? (
          <>
            <button
              onClick={() => openReader(book)}
              className="flex-1 bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700 transition-colors flex items-center justify-center gap-1"
            >
              <Eye className="w-4 h-4" />
              Read
            </button>
            <button
              onClick={() => handleDeleteBook(book._id)}
              className="bg-red-500 text-white px-3 py-2 rounded text-sm hover:bg-red-600 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => window.open(book.coverImage, '_blank')}
              className="flex-1 bg-green-600 text-white px-3 py-2 rounded text-sm hover:bg-green-700 transition-colors flex items-center justify-center gap-1"
            >
              <Eye className="w-4 h-4" />
              View Cover
            </button>
            <button
              onClick={() => handleDeleteBook(book._id)}
              className="bg-red-500 text-white px-3 py-2 rounded text-sm hover:bg-red-600 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </>
        )}
      </div>
    </div>
  );

  const BookListItem = ({ book }) => (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 p-4 flex items-center gap-4">
      <div className="w-20 h-28 flex-shrink-0">
        {book.coverImage ? (
          <img
            src={book.coverImage}
            alt={book.title}
            className="w-full h-full object-cover rounded-lg"
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextElementSibling.style.display = 'flex';
            }}
          />
        ) : null}
        <div className={`w-full h-full bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg flex items-center justify-center ${book.coverImage ? 'hidden' : ''}`}>
          <BookOpen className="w-8 h-8 text-blue-600" />
        </div>
      </div>
      
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-gray-800 truncate">{book.title}</h3>
        <p className="text-sm text-gray-600 truncate">by {book.author}</p>
        <p className="text-xs text-gray-500 mt-1">
          {book.category} • {book.isImported ? 'Imported' : formatFileSize(book.fileSize)} • {new Date(book.createdAt).toLocaleDateString()}
        </p>
        {book.description && (
          <p className="text-sm text-gray-600 line-clamp-2 mt-2">
            {book.description}
          </p>
        )}
      </div>
      
      <div className="flex gap-2">
        {!book.isImported ? (
          <>
            <button
              onClick={() => openReader(book)}
              className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 transition-colors flex items-center gap-1"
            >
              <Eye className="w-4 h-4" />
              Read
            </button>
            <button
              onClick={() => handleDeleteBook(book._id)}
              className="bg-red-500 text-white px-3 py-2 rounded text-sm hover:bg-red-600 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => window.open(book.coverImage, '_blank')}
              className="bg-green-600 text-white px-4 py-2 rounded text-sm hover:bg-green-700 transition-colors flex items-center gap-1"
            >
              <Eye className="w-4 h-4" />
              View Cover
            </button>
            <button
              onClick={() => handleDeleteBook(book._id)}
              className="bg-red-500 text-white px-3 py-2 rounded text-sm hover:bg-red-600 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                <BookOpen className="w-8 h-8 text-blue-600" />
                My Library
              </h1>
              <p className="text-gray-600 mt-2">Manage and read your digital book collection</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowOpenLibrary(!showOpenLibrary)}
                className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                  showOpenLibrary 
                    ? 'bg-green-600 text-white hover:bg-green-700' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                <BookOpen className="w-5 h-5" />
                {showOpenLibrary ? 'My Books' : 'Browse Free Books'}
              </button>
              <button
                onClick={() => setShowUploadModal(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <Upload className="w-5 h-5" />
                Upload Book
              </button>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search books by title, author, or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {categories.map(category => (
                <option key={category} value={category}>
                  {category === 'all' ? 'All Categories' : category}
                </option>
              ))}
            </select>
            
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'grid' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                }`}
              >
                <Grid className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'list' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                }`}
              >
                <List className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Books Display */}
        {showOpenLibrary ? (
          /* Open Library Section */
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Browse Free Books from Open Library</h2>
            
            {/* Open Library Search */}
            <form onSubmit={handleOpenLibrarySearch} className="flex gap-4 mb-6">
              <input
                type="text"
                placeholder="Search for books (e.g., harry potter, javascript, etc.)"
                value={openLibrarySearch}
                onChange={(e) => setOpenLibrarySearch(e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                type="submit"
                disabled={openLibraryLoading}
                className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {openLibraryLoading ? 'Searching...' : 'Search'}
              </button>
            </form>

            {openLibraryLoading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
              </div>
            ) : openLibraryBooks.length === 0 ? (
              <div className="text-center py-12">
                <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-700 mb-2">No books found</h3>
                <p className="text-gray-500">Try searching for different terms</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {openLibraryBooks.map((book, index) => (
                  <div key={index} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-shadow">
                    <div className="aspect-w-3 aspect-h-4 mb-3">
                      {book.cover_i ? (
                        <img
                          src={`https://covers.openlibrary.org/b/id/${book.cover_i}-M.jpg`}
                          alt={book.title}
                          className="w-full h-48 object-cover rounded-lg"
                          onError={(e) => {
                            e.target.src = '';
                            e.target.className = 'w-full h-48 bg-gradient-to-br from-green-100 to-blue-100 rounded-lg flex items-center justify-center';
                            e.target.innerHTML = '<div class="text-green-600"><svg class="w-16 h-16 mx-auto" fill="currentColor" viewBox="0 0 20 20"><path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z"/></svg></div>';
                          }}
                        />
                      ) : (
                        <div className="w-full h-48 bg-gradient-to-br from-green-100 to-blue-100 rounded-lg flex items-center justify-center">
                          <BookOpen className="w-16 h-16 text-green-600" />
                        </div>
                      )}
                    </div>
                    
                    <h3 className="font-semibold text-gray-800 text-sm line-clamp-2 mb-1">{book.title || 'Unknown Title'}</h3>
                    <p className="text-xs text-gray-600 truncate mb-2">
                      by {book.author_name ? book.author_name.join(', ') : 'Unknown Author'}
                    </p>
                    
                    <div className="text-xs text-gray-500 mb-3">
                      {book.first_publish_year && `Published: ${book.first_publish_year}`}
                      {book.number_of_pages_median && ` • ${book.number_of_pages_median} pages`}
                    </div>
                    
                    <button
                      onClick={() => importOpenLibraryBook(book)}
                      className="w-full bg-green-600 text-white px-3 py-2 rounded text-sm hover:bg-green-700 transition-colors"
                    >
                      Import to Library
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* My Books Section */
          loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : books?.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-12 text-center">
              <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">No books found</h3>
              <p className="text-gray-500 mb-6">
                {searchTerm || selectedCategory !== 'all' 
                  ? 'Try adjusting your search or filters' 
                  : 'Upload your first book or browse free books'
                }
              </p>
              <div className="flex justify-center gap-3">
                <button
                  onClick={() => setShowOpenLibrary(true)}
                  className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                >
                  <BookOpen className="w-5 h-5" />
                  Browse Free Books
                </button>
                {!searchTerm && selectedCategory === 'all' && (
                  <button
                    onClick={() => setShowUploadModal(true)}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                  >
                    <Plus className="w-5 h-5" />
                    Upload Book
                  </button>
                )}
              </div>
            </div>
          ) : (
          <>
            <div className={
              viewMode === 'grid' 
                ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
                : 'space-y-4'
            }>
              {(books || []).map(book => 
                viewMode === 'grid' 
                  ? <BookCard key={book._id} book={book} />
                  : <BookListItem key={book._id} book={book} />
              )}
            </div>
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-8">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Previous
                </button>
                <span className="px-4 py-2">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Next
                </button>
              </div>
            )}
          </>
        ))}
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-4">Upload New Book</h2>
              <form onSubmit={handleUpload}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Title *
                    </label>
                    <input
                      type="text"
                      required
                      value={uploadForm.title}
                      onChange={(e) => setUploadForm({...uploadForm, title: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Author *
                    </label>
                    <input
                      type="text"
                      required
                      value={uploadForm.author}
                      onChange={(e) => setUploadForm({...uploadForm, author: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      value={uploadForm.description}
                      onChange={(e) => setUploadForm({...uploadForm, description: e.target.value})}
                      rows="3"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category
                    </label>
                    <select
                      value={uploadForm.category}
                      onChange={(e) => setUploadForm({...uploadForm, category: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {categories.filter(cat => cat !== 'all').map(category => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tags (comma-separated)
                    </label>
                    <input
                      type="text"
                      value={uploadForm.tags}
                      onChange={(e) => setUploadForm({...uploadForm, tags: e.target.value})}
                      placeholder="e.g., programming, javascript, tutorial"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      ISBN
                    </label>
                    <input
                      type="text"
                      value={uploadForm.isbn}
                      onChange={(e) => setUploadForm({...uploadForm, isbn: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Published Year
                    </label>
                    <input
                      type="number"
                      value={uploadForm.publishedYear}
                      onChange={(e) => setUploadForm({...uploadForm, publishedYear: e.target.value})}
                      min="1000"
                      max={new Date().getFullYear()}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Language
                    </label>
                    <input
                      type="text"
                      value={uploadForm.language}
                      onChange={(e) => setUploadForm({...uploadForm, language: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Page Count
                    </label>
                    <input
                      type="number"
                      value={uploadForm.pageCount}
                      onChange={(e) => setUploadForm({...uploadForm, pageCount: e.target.value})}
                      min="1"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Book File * (PDF, EPUB, TXT)
                    </label>
                    <input
                      type="file"
                      required
                      accept=".pdf,.epub,.txt"
                      onChange={(e) => setUploadForm({...uploadForm, file: e.target.files[0]})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                
                <div className="flex justify-end gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowUploadModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Upload Book
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Reader Modal */}
      {showReaderModal && selectedBook && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-6xl h-[90vh] flex flex-col">
            <div className="flex justify-between items-center p-4 border-b">
              <h2 className="text-xl font-semibold">{selectedBook.title}</h2>
              <button
                onClick={() => setShowReaderModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              <iframe
                src={`/api/library/${selectedBook._id}/read`}
                className="w-full h-full border-0"
                title={selectedBook.title}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LibraryPage;
