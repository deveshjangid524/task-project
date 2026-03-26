import React, { useState, useEffect } from 'react';
import api, { API_BASE_URL } from '../services/api';
import { showNotification } from './NotificationSystem';
import { FileText, Link, Plus, X, Download, Eye, Trash2, Upload } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const NotesSection = () => {
    const { user } = useAuth();
    const [notes, setNotes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);
    const [newNote, setNewNote] = useState({
        title: '',
        content: '',
        type: 'text', // text, url, file
        fileUrl: '',
        fileName: '',
        fileSize: 0,
        fileType: '',
        visibility: 'public', // public, selected
        visibleTo: [] // array of user IDs
    });
    const [uploading, setUploading] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [users, setUsers] = useState([]);

    useEffect(() => {
        if (user) {
            fetchNotes();
            fetchUsers();
        } else {
            setLoading(false);
        }
    }, [user]);

    const fetchUsers = async () => {
        try {
            const response = await api.get('/users');
            setUsers(response.data);
        } catch (error) {
            console.error('Error fetching users:', error);
        }
    };

    const fetchNotes = async () => {
        try {
            const response = await api.get('/notes');
            const allNotes = response.data;
            
            // Filter notes based on visibility
            const visibleNotes = allNotes.filter(note => {
                // If note is public, everyone can see it
                if (note.visibility === 'public') {
                    return true;
                }
                
                // If note is for selected users, check if current user is in the list
                if (note.visibility === 'selected') {
                    return note.visibleTo && note.visibleTo.includes(user?._id);
                }
                
                // If no visibility setting, default to public
                return true;
            });
            
            setNotes(visibleNotes);
        } catch (error) {
            console.error('Error fetching notes:', error);
            const errorMessage = error.response?.data?.message || 'Failed to load notes';
            showNotification('error', errorMessage, 'Error');
        } finally {
            setLoading(false);
        }
    };

    const handleFileUpload = async (file) => {
        if (!file) return;

        console.log('Starting file upload for:', file);
        console.log('File details:', {
            name: file.name,
            type: file.type,
            size: file.size,
            lastModified: file.lastModified
        });

        // Check file size (max 10MB)
        const maxSize = 10 * 1024 * 1024; // 10MB
        if (file.size > maxSize) {
            showNotification('error', 'File size must be less than 10MB', 'Error');
            return;
        }

        // Check file type
        const allowedTypes = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-powerpoint',
            'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            'text/plain',
            'image/jpeg',
            'image/png',
            'image/gif'
        ];

        console.log('File type check:', file.type, allowedTypes.includes(file.type));

        if (!allowedTypes.includes(file.type)) {
            showNotification('error', 'File type not supported. Please upload PDF, Word, Excel, PowerPoint, text, or image files.', 'Error');
            return;
        }

        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        console.log('FormData contents:');
        for (let [key, value] of formData.entries()) {
            console.log(key, value);
        }

        try {
            console.log('Sending upload request to /notes/upload');
            
            // Upload to backend
            const response = await api.post('/notes/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            
            console.log('Upload response:', response);
            console.log('Response data:', response.data);
            
            const fileInfo = response.data;
            
            if (!fileInfo) {
                throw new Error('No file info returned from server');
            }

            console.log('Setting newNote with file info:', fileInfo);
            
            setNewNote({
                ...newNote,
                fileUrl: fileInfo.fileUrl,
                fileName: fileInfo.fileName,
                fileSize: fileInfo.fileSize,
                fileType: fileInfo.fileType
            });
            
            setSelectedFile(file);
            showNotification('success', 'File uploaded successfully', 'Success');
        } catch (error) {
            console.error('Error uploading file:', error);
            console.error('Error response:', error.response);
            console.error('Error status:', error.response?.status);
            console.error('Error data:', error.response?.data);
            
            // If upload fails, still save the file info locally as fallback
            if (error.response?.status === 500) {
                console.log('Backend upload failed, using local fallback');
                
                // Create a local file URL for display purposes
                const localFileUrl = URL.createObjectURL(file);
                
                setNewNote({
                    ...newNote,
                    fileUrl: localFileUrl,
                    fileName: file.name,
                    fileSize: file.size,
                    fileType: file.type,
                    content: `Local file: ${file.name} (Backend upload unavailable)`
                });
                
                setSelectedFile(file);
                showNotification('warning', 'File saved locally (backend upload temporarily unavailable)', 'Warning');
            } else {
                const errorMessage = error.response?.data?.message || error.message || 'Failed to upload file';
                showNotification('error', errorMessage, 'Error');
            }
        } finally {
            setUploading(false);
        }
    };

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            handleFileUpload(file);
        }
    };

    const handleUserSelection = (userId) => {
        setNewNote(prev => ({
            ...prev,
            visibleTo: prev.visibleTo.includes(userId)
                ? prev.visibleTo.filter(id => id !== userId)
                : [...prev.visibleTo, userId]
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Check if user is authenticated
        if (!user) {
            showNotification('error', 'You must be logged in to save notes', 'Authentication Error');
            return;
        }
        
        // Check user role
        if (user.role !== 'Admin' && user.role !== 'Project Manager') {
            showNotification('error', 'Only Admins and Project Managers can create notes', 'Permission Denied');
            return;
        }
        
        console.log('Submitting note:', newNote);
        setLoading(true);

        try {
            const payload = {
                ...newNote,
                createdBy: user._id,
                createdAt: new Date()
            };

            // For file types, provide default content if empty
            if (newNote.type === 'file' && !payload.content) {
                payload.content = `File: ${payload.fileName || 'Document'}`;
            }

            // For text types, provide default content if empty
            if (newNote.type === 'text' && !payload.content) {
                payload.content = 'Text note';
            }

            // For URL types, provide default content if empty
            if (newNote.type === 'url' && !payload.content) {
                payload.content = 'URL note';
            }

            console.log('Payload being sent:', payload);

            const response = await api.post('/notes', payload);
            console.log('Note saved successfully:', response.data);
            showNotification('success', 'Note saved successfully', 'Success');
            
            // Reset form
            setNewNote({
                title: '',
                content: '',
                type: 'text',
                fileUrl: '',
                fileName: '',
                fileSize: 0,
                fileType: '',
                visibility: 'public',
                visibleTo: []
            });
            setSelectedFile(null);
            setShowAddForm(false);
            fetchNotes();
        } catch (error) {
            console.error('Error saving note:', error);
            const errorMessage = error.response?.data?.message || 'Failed to save note';
            showNotification('error', errorMessage, 'Error');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (noteId) => {
        // Find the note to check permissions
        const noteToDelete = notes.find(note => note._id === noteId);
        
        if (!noteToDelete) {
            showNotification('error', 'Note not found', 'Error');
            return;
        }

        // Check if user is authorized to delete
        const isAdmin = user?.role === 'Admin';
        const isCreator = noteToDelete.createdBy?._id === user?._id;
        
        if (!isAdmin && !isCreator) {
            showNotification('error', 'Only Admins and the original creator of the note are allowed to delete notes', 'Permission Denied');
            return;
        }

        if (!confirm('Are you sure you want to delete this note?')) return;

        try {
            await api.delete(`/notes/${noteId}`);
            showNotification('success', 'Note deleted successfully', 'Success');
            fetchNotes();
        } catch (error) {
            console.error('Error deleting note:', error);
            if (error.response?.status === 403) {
                showNotification('error', 'Only Admins and the original creator of the note are allowed to delete notes', 'Permission Denied');
            } else {
                showNotification('error', 'Failed to delete note', 'Error');
            }
        }
    };

    const getNoteIcon = (type) => {
        switch (type) {
            case 'url': return <Link className="w-4 h-4" />;
            case 'file': return <FileText className="w-4 h-4" />;
            default: return <FileText className="w-4 h-4" />;
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleString();
    };

    if (loading || !user) {
        return <div className="p-4 text-center">Loading notes...</div>;
    }

    return (
        <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">📝 Project Notes & Resources</h2>
                {(user?.role === 'Admin' || user?.role === 'Project Manager') && (
                    <button
                        onClick={() => setShowAddForm(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        Add Note
                    </button>
                )}
            </div>

            {/* Add Note Form */}
            {showAddForm && (
                <div className="mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold">Add New Note</h3>
                        <button
                            onClick={() => setShowAddForm(false)}
                            className="text-gray-500 hover:text-gray-700"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                    
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Title *
                            </label>
                            <input
                                type="text"
                                required
                                value={newNote.title}
                                onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Enter note title"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Type
                            </label>
                            <select
                                value={newNote.type}
                                onChange={(e) => setNewNote({ ...newNote, type: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="text">Text Note</option>
                                <option value="url">URL/Link</option>
                                <option value="file">Document/PDF</option>
                            </select>
                        </div>

                        {newNote.type === 'text' && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Content
                                </label>
                                <textarea
                                    value={newNote.content}
                                    onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    rows={4}
                                    placeholder="Enter your note content here..."
                                />
                            </div>
                        )}

                        {newNote.type === 'url' && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    URL *
                                </label>
                                <input
                                    type="url"
                                    required
                                    value={newNote.content}
                                    onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="https://example.com/resource"
                                />
                            </div>
                        )}

                        {newNote.type === 'file' && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Upload File
                                </label>
                                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                                    <input
                                        type="file"
                                        id="file-upload"
                                        onChange={handleFileSelect}
                                        accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.jpg,.jpeg,.png,.gif"
                                        className="hidden"
                                    />
                                    <label
                                        htmlFor="file-upload"
                                        className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 transition-colors"
                                    >
                                        <Upload className="w-4 h-4" />
                                        {uploading ? 'Uploading...' : 'Choose File'}
                                    </label>
                                    <p className="text-xs text-gray-500 mt-2">
                                        PDF, Word, Excel, PowerPoint, Text, Images (Max: 10MB)
                                    </p>
                                </div>

                                {selectedFile && (
                                    <div className="mt-4 p-3 bg-gray-50 rounded-md">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <FileText className="w-4 h-4 text-blue-600" />
                                                <span className="text-sm font-medium">{selectedFile.name}</span>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setSelectedFile(null);
                                                    setNewNote({
                                                        ...newNote,
                                                        fileUrl: '',
                                                        fileName: '',
                                                        fileSize: 0,
                                                        fileType: ''
                                                    });
                                                }}
                                                className="text-red-500 hover:text-red-700"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                        <div className="text-xs text-gray-500 mt-1">
                                            {(selectedFile.size / 1024).toFixed(1)} KB • {selectedFile.type}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Visibility Settings */}
                        <div className="border-t pt-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Visibility Settings
                            </label>
                            <div className="space-y-3">
                                <div className="flex items-center">
                                    <input
                                        type="radio"
                                        id="public"
                                        name="visibility"
                                        value="public"
                                        checked={newNote.visibility === 'public'}
                                        onChange={(e) => setNewNote({ ...newNote, visibility: e.target.value, visibleTo: [] })}
                                        className="mr-2"
                                    />
                                    <label htmlFor="public" className="text-sm text-gray-700">
                                        👥 All team members can see this note
                                    </label>
                                </div>
                                <div className="flex items-center">
                                    <input
                                        type="radio"
                                        id="selected"
                                        name="visibility"
                                        value="selected"
                                        checked={newNote.visibility === 'selected'}
                                        onChange={(e) => setNewNote({ ...newNote, visibility: e.target.value })}
                                        className="mr-2"
                                    />
                                    <label htmlFor="selected" className="text-sm text-gray-700">
                                        👁️ Only selected team members can see this note
                                    </label>
                                </div>
                                
                                {newNote.visibility === 'selected' && (
                                    <div className="ml-6 mt-2">
                                        <label className="block text-xs text-gray-600 mb-2">
                                            Select team members:
                                        </label>
                                        <div className="max-h-32 overflow-y-auto border border-gray-200 rounded-md p-2">
                                            {users.filter(u => u._id !== user?._id).map(u => (
                                                <div key={u._id} className="flex items-center mb-1">
                                                    <input
                                                        type="checkbox"
                                                        id={`user-${u._id}`}
                                                        checked={newNote.visibleTo.includes(u._id)}
                                                        onChange={() => handleUserSelection(u._id)}
                                                        className="mr-2"
                                                    />
                                                    <label htmlFor={`user-${u._id}`} className="text-sm text-gray-700">
                                                        {u.name} ({u.role})
                                                    </label>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <button
                                type="submit"
                                disabled={loading}
                                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                            >
                                {loading ? 'Saving...' : 'Save Now'}
                            </button>
                            <button
                                type="button"
                                onClick={() => setShowAddForm(false)}
                                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Notes List */}
            <div className="space-y-4">
                {notes.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                        <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                        <p>No notes shared yet.</p>
                        {(user?.role === 'Admin' || user?.role === 'Project Manager') ? (
                            <p className="text-sm mt-2">Be the first to share a resource!</p>
                        ) : (
                            <p className="text-sm mt-2">Only Admins and Project Managers can create notes.</p>
                        )}
                    </div>
                )}
                {notes.length > 0 && notes.map((note) => (
                        <div key={note._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start mb-2">
                                <div className="flex items-center gap-2">
                                    {getNoteIcon(note.type)}
                                    <h3 className="font-semibold text-gray-900">{note.title}</h3>
                                    <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                                        {note.type.toUpperCase()}
                                    </span>
                                </div>
                                <button
                                    onClick={() => handleDelete(note._id)}
                                    className="text-red-500 hover:text-red-700"
                                    title="Delete note"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="text-sm text-gray-600 mb-2">
                                By {note.createdBy?.name || 'Unknown'} • {formatDate(note.createdAt)}
                            </div>

                            {note.type === 'text' && (
                                <div className="text-gray-700 whitespace-pre-wrap">
                                    {note.content}
                                </div>
                            )}

                            {note.type === 'url' && (
                                <div className="flex items-center gap-2">
                                    <a
                                        href={note.content}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-600 hover:text-blue-800 underline flex items-center gap-1"
                                    >
                                        <Eye className="w-4 h-4" />
                                        Open Link
                                    </a>
                                </div>
                            )}

                            {note.type === 'file' && (
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <FileText className="w-4 h-4 text-blue-600" />
                                        <span className="text-sm font-medium">{note.fileName || 'File'}</span>
                                        {note.fileSize && (
                                            <span className="text-xs text-gray-500">
                                                ({(note.fileSize / 1024).toFixed(1)} KB)
                                            </span>
                                        )}
                                    </div>
                                    
                                    {/* Debug: Show file URL info */}
                                    {process.env.NODE_ENV === 'development' && (
                                        <div className="text-xs text-gray-400 bg-gray-100 p-2 rounded">
                                            Debug: fileUrl = {note.fileUrl || 'undefined'}
                                        </div>
                                    )}
                                    
                                    <div className="flex gap-2">
                                        {/* Always show View button for file types */}
                                        <button
                                            onClick={() => {
                                                console.log('View button clicked for note:', note);
                                                console.log('fileUrl:', note.fileUrl);
                                                console.log('content:', note.content);
                                                
                                                const fileUrl = note.fileUrl || note.content;
                                                console.log('Using fileUrl:', fileUrl);
                                                
                                                if (fileUrl) {
                                                    try {
                                                        let fullUrl;
                                                        
                                                        // Handle local blob URLs differently
                                                        if (fileUrl.startsWith('blob:')) {
                                                            console.log('Opening local blob URL');
                                                            fullUrl = fileUrl;
                                                        } else if (fileUrl.startsWith('http')) {
                                                            // Already a full URL (from backend)
                                                            fullUrl = fileUrl;
                                                        } else {
                                                            // Relative path - construct full URL using backend base URL
                                                            fullUrl = `${API_BASE_URL}${fileUrl.startsWith('/') ? '' : '/'}${fileUrl}`;
                                                        }
                                                        
                                                        console.log('Full URL for viewing:', fullUrl);
                                                        window.open(fullUrl, '_blank', 'noopener,noreferrer');
                                                        showNotification('success', 'Opening file...', 'Success');
                                                    } catch (error) {
                                                        console.error('Error opening file:', error);
                                                        showNotification('error', 'Failed to open file', 'Error');
                                                    }
                                                } else {
                                                    console.log('No file URL found');
                                                    showNotification('error', 'File URL not found', 'Error');
                                                }
                                            }}
                                            className="text-blue-600 hover:text-blue-800 underline flex items-center gap-1 text-sm cursor-pointer"
                                        >
                                            <Eye className="w-4 h-4" />
                                            View
                                        </button>
                                        
                                        <button
                                            onClick={() => {
                                                console.log('Download button clicked for note:', note);
                                                console.log('fileUrl:', note.fileUrl);
                                                console.log('content:', note.content);
                                                
                                                const fileUrl = note.fileUrl || note.content;
                                                console.log('Using fileUrl:', fileUrl);
                                                
                                                if (fileUrl) {
                                                    try {
                                                        let fullUrl;
                                                        
                                                        // Handle local blob URLs differently
                                                        if (fileUrl.startsWith('blob:')) {
                                                            console.log('Downloading local blob URL');
                                                            fullUrl = fileUrl;
                                                        } else if (fileUrl.startsWith('http')) {
                                                            // Already a full URL (from backend)
                                                            fullUrl = fileUrl;
                                                        } else {
                                                            // Relative path - construct full URL using backend base URL
                                                            fullUrl = `${API_BASE_URL}${fileUrl.startsWith('/') ? '' : '/'}${fileUrl}`;
                                                        }
                                                        
                                                        console.log('Full URL for download:', fullUrl);
                                                        
                                                        // Create download link
                                                        const link = document.createElement('a');
                                                        link.href = fullUrl;
                                                        link.download = note.fileName || 'document';
                                                        link.target = '_blank';
                                                        document.body.appendChild(link);
                                                        link.click();
                                                        document.body.removeChild(link);
                                                        showNotification('success', 'Download started...', 'Success');
                                                    } catch (error) {
                                                        console.error('Error downloading file:', error);
                                                        showNotification('error', 'Failed to download file', 'Error');
                                                    }
                                                } else {
                                                    console.log('No file URL found');
                                                    showNotification('error', 'File URL not found', 'Error');
                                                }
                                            }}
                                            className="text-green-600 hover:text-green-800 underline flex items-center gap-1 text-sm cursor-pointer"
                                        >
                                            <Download className="w-4 h-4" />
                                            Download
                                        </button>
                                    </div>
                                    {note.fileType && (
                                        <div className="text-xs text-gray-500">
                                            Type: {note.fileType}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                )   
            </div>
        </div>
    );
};

export default NotesSection;
