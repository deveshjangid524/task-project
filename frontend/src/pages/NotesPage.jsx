import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import NotesSection from '../components/NotesSection';
import api, { API_BASE_URL } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { showNotification } from '../components/NotificationSystem';
import { 
    FileText, Users, Clock, TrendingUp, Search, Bell, Settings, Moon, Sun,
    Filter, Tag, Folder, Share2, Download, Upload, Star, Archive, Trash2,
    Edit3, Eye, Grid, List, Calendar, BarChart3, Activity, UserPlus,
    MessageSquare, Bookmark, Hash, ChevronDown, X, Plus, Zap, Lock,
    Globe, Users2, FileSearch, Brain, Target, Award, TrendingUp as Trending,
    AlertCircle, CheckCircle, Info, HelpCircle, ChevronRight, MoreVertical,
    Mic, Camera, Paperclip, Link2, Bold, Italic, Underline, Code,
    AlignLeft, AlignCenter, AlignRight, List as ListIcon, Quote,
    Image, Video, Music, File, FolderOpen, Copy, Move, Pin, Sparkles,
    Layers, Layout, Zap as ZapIcon, Command, Palette, Globe2, Rocket,
    Shield, Sparkles as Magic, ArrowRight, ArrowUp, ArrowDown, ArrowLeft,
    Check, XCircle, PlusCircle, MinusCircle, RefreshCw, Save, Send,
    Heart, Flame, Diamond, Crown, Medal, Trophy, Gem, Star as StarIcon,
    Sun as SunIcon, Moon as MoonIcon, Cloud, Wind, Snowflake,
    TreePine, Mountain, Waves, Compass, MapPin, Navigation, Radar,
    Wifi, Bluetooth, Battery, Signal, Cpu, HardDrive, Monitor, Smartphone,
    Tablet, Laptop, Headphones, Speaker, Camera as CameraIcon, Video as VideoIcon,
    Music as MusicIcon, Image as ImageIcon, File as FileIcon, Folder as FolderIcon
} from 'lucide-react';

const NotesPage = () => {
    const { user } = useAuth();
    const [darkMode, setDarkMode] = useState(() => {
        const savedTheme = localStorage.getItem('theme');
        return savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches);
    });
    
    // Enhanced UI States
    const [loading, setLoading] = useState(true);
    const [isAnimating, setIsAnimating] = useState(false);
    const [glassEffect, setGlassEffect] = useState(true);
    const [particleEffect, setParticleEffect] = useState(true);
    const [soundEnabled, setSoundEnabled] = useState(false);
    
    // Data loading states
    const [notes, setNotes] = useState([]);
    const [realUsers, setRealUsers] = useState([]);
    const [activities, setActivities] = useState([]);
    
    // Advanced Search State with AI-powered suggestions
    const [searchQuery, setSearchQuery] = useState('');
    const [searchSuggestions, setSearchSuggestions] = useState([]);
    const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);
    const [searchFilters, setSearchFilters] = useState({
        type: 'all',
        category: 'all',
        tags: [],
        dateRange: 'all',
        author: 'all',
        priority: 'all',
        mood: 'all',
        complexity: 'all'
    });
    const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
    
    // Enhanced View and Layout State
    const [viewMode, setViewMode] = useState('grid'); // grid, list, kanban, timeline, mindmap, gallery
    const [sortBy, setSortBy] = useState('recent');
    const [showSidebar, setShowSidebar] = useState(true);
    const [selectedNotes, setSelectedNotes] = useState([]);
    const [layoutDensity, setLayoutDensity] = useState('comfortable'); // compact, comfortable, spacious
    
    // Collaboration and Real-time Features
    const collaborators = realUsers.filter(u => u._id !== user?._id);
    const [activeCollaborators, setActiveCollaborators] = useState([]);
    const [showCollaboratorPanel, setShowCollaboratorPanel] = useState(false);
    const [liveCursor, setLiveCursor] = useState({ x: 0, y: 0, user: null });
    const [isLiveMode, setIsLiveMode] = useState(false);
    
    // AI and Smart Features
    const [aiAssistantOpen, setAiAssistantOpen] = useState(false);
    const [smartSuggestions, setSmartSuggestions] = useState([]);
    const [autoTagging, setAutoTagging] = useState(true);
    const [smartSearch, setSmartSearch] = useState(true);
    
    // Enhanced Categories and Tags with icons and colors
    const [categories, setCategories] = useState([
        { id: 1, name: 'Documentation', color: 'blue', icon: FileText, gradient: 'from-blue-400 to-blue-600' },
        { id: 2, name: 'Resources', color: 'green', icon: Folder, gradient: 'from-green-400 to-green-600' },
        { id: 3, name: 'Meeting Notes', color: 'purple', icon: Users, gradient: 'from-purple-400 to-purple-600' },
        { id: 4, name: 'Ideas', color: 'yellow', icon: Brain, gradient: 'from-yellow-400 to-yellow-600' },
        { id: 5, name: 'Tasks', color: 'red', icon: Target, gradient: 'from-red-400 to-red-600' },
        { id: 6, name: 'Research', color: 'indigo', icon: FileSearch, gradient: 'from-indigo-400 to-indigo-600' },
        { id: 7, name: 'Creative', color: 'pink', icon: Sparkles, gradient: 'from-pink-400 to-pink-600' },
        { id: 8, name: 'Development', color: 'cyan', icon: Code, gradient: 'from-cyan-400 to-cyan-600' }
    ]);
    const [tags, setTags] = useState([
        { id: 1, name: 'urgent', color: 'red', gradient: 'from-red-400 to-red-600', icon: Flame },
        { id: 2, name: 'important', color: 'orange', gradient: 'from-orange-400 to-orange-600', icon: Star },
        { id: 3, name: 'review', color: 'blue', gradient: 'from-blue-400 to-blue-600', icon: Eye },
        { id: 4, name: 'draft', color: 'gray', gradient: 'from-gray-400 to-gray-600', icon: Edit3 },
        { id: 5, name: 'approved', color: 'green', gradient: 'from-green-400 to-green-600', icon: Check },
        { id: 6, name: 'archived', color: 'purple', gradient: 'from-purple-400 to-purple-600', icon: Archive },
        { id: 7, name: 'favorite', color: 'pink', gradient: 'from-pink-400 to-pink-600', icon: Heart },
        { id: 8, name: 'trending', color: 'yellow', gradient: 'from-yellow-400 to-yellow-600', icon: TrendingUp }
    ]);
    
    // Advanced Notification System
    const [showNotifications, setShowNotifications] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [notificationSound, setNotificationSound] = useState(true);
    
    // Analytics and Insights
    const [showAnalytics, setShowAnalytics] = useState(false);
    const [analyticsData, setAnalyticsData] = useState({
        productivity: 0,
        engagement: 0,
        growth: 0,
        insights: []
    });
    
    // Enhanced UI State
    const [showCommandPalette, setShowCommandPalette] = useState(false);
    const [showQuickActions, setShowQuickActions] = useState(false);
    const [draggedNote, setDraggedNote] = useState(null);
    const [contextMenu, setContextMenu] = useState(null);
    const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false);
    const [showCustomizationPanel, setShowCustomizationPanel] = useState(false);
    
    // Advanced Theme System
    const [accentColor, setAccentColor] = useState('blue');
    const [themePreset, setThemePreset] = useState('default');
    const [customBackground, setCustomBackground] = useState(null);
    
    // Performance and Optimization
    const [virtualScrolling, setVirtualScrolling] = useState(true);
    const [lazyLoading, setLazyLoading] = useState(true);
    const [cacheEnabled, setCacheEnabled] = useState(true);
    
    // Refs
    const searchInputRef = useRef(null);
    const commandPaletteRef = useRef(null);
    const canvasRef = useRef(null);
    const animationFrameRef = useRef(null);

    // Advanced Particle Effect Animation
    useEffect(() => {
        if (!particleEffect || !canvasRef.current) return;
        
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        
        const particles = [];
        const particleCount = 50;
        
        class Particle {
            constructor() {
                this.x = Math.random() * canvas.width;
                this.y = Math.random() * canvas.height;
                this.size = Math.random() * 3 + 1;
                this.speedX = Math.random() * 2 - 1;
                this.speedY = Math.random() * 2 - 1;
                this.opacity = Math.random() * 0.5 + 0.2;
            }
            
            update() {
                this.x += this.speedX;
                this.y += this.speedY;
                
                if (this.x > canvas.width) this.x = 0;
                if (this.x < 0) this.x = canvas.width;
                if (this.y > canvas.height) this.y = 0;
                if (this.y < 0) this.y = canvas.height;
            }
            
            draw() {
                ctx.fillStyle = darkMode 
                    ? `rgba(147, 51, 234, ${this.opacity})`
                    : `rgba(59, 130, 246, ${this.opacity})`;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        
        for (let i = 0; i < particleCount; i++) {
            particles.push(new Particle());
        }
        
        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            particles.forEach(particle => {
                particle.update();
                particle.draw();
            });
            animationFrameRef.current = requestAnimationFrame(animate);
        };
        
        animate();
        
        const handleResize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        
        window.addEventListener('resize', handleResize);
        
        return () => {
            window.removeEventListener('resize', handleResize);
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, [particleEffect, darkMode]);
    
    // AI-Powered Search Suggestions
    const generateSearchSuggestions = useCallback((query) => {
        if (!query || query.length < 2) {
            setSearchSuggestions([]);
            return;
        }
        
        const suggestions = notes
            .filter(note => 
                note.title?.toLowerCase().includes(query.toLowerCase()) ||
                note.content?.toLowerCase().includes(query.toLowerCase())
            )
            .slice(0, 5)
            .map(note => ({
                id: note._id,
                title: note.title || 'Untitled',
                preview: note.content?.substring(0, 100) + '...',
                type: note.type || 'note'
            }));
        
        setSearchSuggestions(suggestions);
    }, [notes]);
    
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            generateSearchSuggestions(searchQuery);
        }, 300);
        
        return () => clearTimeout(timeoutId);
    }, [searchQuery, generateSearchSuggestions]);
    
    // Smart Auto-Tagging
    const autoTagNote = useCallback((noteContent) => {
        if (!autoTagging) return [];
        
        const suggestedTags = [];
        const content = noteContent.toLowerCase();
        
        tags.forEach(tag => {
            if (content.includes(tag.name.toLowerCase())) {
                suggestedTags.push(tag);
            }
        });
        
        return suggestedTags;
    }, [tags, autoTagging]);
    
    // Advanced Keyboard Shortcuts
    useEffect(() => {
        const handleKeyDown = (e) => {
            // Ctrl/Cmd + K for command palette
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                setShowCommandPalette(true);
            }
            // Ctrl/Cmd + / for search
            if ((e.ctrlKey || e.metaKey) && e.key === '/') {
                e.preventDefault();
                searchInputRef.current?.focus();
            }
            // Ctrl/Cmd + B for sidebar toggle
            if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
                e.preventDefault();
                setShowSidebar(!showSidebar);
            }
            // Ctrl/Cmd + D for dark mode toggle
            if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
                e.preventDefault();
                toggleDarkMode();
            }
            // Ctrl/Cmd + A for AI assistant
            if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
                e.preventDefault();
                setAiAssistantOpen(!aiAssistantOpen);
            }
            // Escape to close modals
            if (e.key === 'Escape') {
                setShowCommandPalette(false);
                setShowAdvancedSearch(false);
                setShowAnalytics(false);
                setShowCollaboratorPanel(false);
                setAiAssistantOpen(false);
                setShowSearchSuggestions(false);
            }
        };
        
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [showSidebar, aiAssistantOpen]);
    
    // Real-time Collaboration Simulation
    useEffect(() => {
        if (!isLiveMode) return;
        
        const interval = setInterval(() => {
            const randomCollaborator = collaborators[Math.floor(Math.random() * collaborators.length)];
            if (randomCollaborator) {
                setLiveCursor({
                    x: Math.random() * window.innerWidth,
                    y: Math.random() * window.innerHeight,
                    user: randomCollaborator
                });
            }
        }, 2000);
        
        return () => clearInterval(interval);
    }, [isLiveMode, collaborators]);
    
    const toggleDarkMode = () => {
        setDarkMode(!darkMode);
    };
    
    // Filter update function
    const updateFilter = (key, value) => {
        setSearchFilters(prev => ({
            ...prev,
            [key]: value
        }));
    };
    
    const fetchAllData = async () => {
        setLoading(true);
        try {
            // Fetch all data in parallel
            const [notesRes, usersRes] = await Promise.all([
                api.get('/notes'),
                api.get('/users')
            ]);
            
            // Set notes data
            const allNotes = notesRes.data || [];
            setNotes(allNotes);
            
            // Filter notes based on visibility
            const visibleNotes = allNotes.filter(note => {
                if (note.visibility === 'public') return true;
                if (note.visibility === 'selected') {
                    return note.visibleTo && note.visibleTo.includes(user?._id);
                }
                return true;
            });
            setNotes(visibleNotes);
            
            // Set users data
            const allUsers = usersRes.data || [];
            setRealUsers(allUsers);
            
            // Set some users as active (mock for demo - could be real-time later)
            setActiveCollaborators(allUsers.slice(0, 2).map(u => u._id));
            
            // Generate activities from real data
            const recentActivities = generateActivitiesFromNotes(visibleNotes, allUsers);
            setActivities(recentActivities);
            
            // Generate notifications from real data
            const realNotifications = generateNotifications(visibleNotes, allUsers);
            setNotifications(realNotifications);
            
        } catch (error) {
            console.error('Error fetching data:', error);
            showNotification('error', 'Failed to load data', 'Error');
        } finally {
            setLoading(false);
        }
    };
    
    const generateActivitiesFromNotes = (notesData, usersData) => {
        const activities = [];
        const recentNotes = notesData
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 10);
        
        recentNotes.forEach((note, index) => {
            const creator = usersData.find(u => u._id === note.createdBy);
            if (creator) {
                activities.push({
                    id: note._id,
                    user: creator.name || creator.email,
                    action: 'created note',
                    target: note.title || 'Untitled',
                    time: formatRelativeTime(note.createdAt),
                    icon: Plus
                });
            }
        });
        
        return activities;
    };
    
    const generateNotifications = (notesData, usersData) => {
        const notifications = [];
        const recentNotes = notesData
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 5);
        
        recentNotes.forEach((note, index) => {
            const creator = usersData.find(u => u._id === note.createdBy);
            if (creator && creator._id !== user?._id) {
                notifications.push({
                    id: note._id,
                    type: index === 0 ? 'info' : 'success',
                    message: `New note "${note.title || 'Untitled'}" shared by ${creator.name || creator.email}`,
                    time: formatRelativeTime(note.createdAt),
                    read: false
                });
            }
        });
        
        // Add storage notification if needed
        const storageUsage = calculateStorageUsage(notesData);
        if (storageUsage > 80) {
            notifications.push({
                id: 'storage',
                type: 'warning',
                message: `Storage usage at ${storageUsage}%`,
                time: '1 hour ago',
                read: true
            });
        }
        
        return notifications;
    };
    
    const formatRelativeTime = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);
        
        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins} min ago`;
        if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
        return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    };
    
    const calculateStorageUsage = (notesData) => {
        const totalSize = notesData.reduce((acc, note) => {
            return acc + (note.fileSize || 0);
        }, 0);
        // Assume 100MB total storage limit
        return Math.min(Math.round((totalSize / (100 * 1024 * 1024)) * 100), 100);
    };
    
    // Calculate real stats from data
    const stats = useMemo(() => {
        const sharedNotes = notes.filter(note => note.visibility === 'public').length;
        const recentActivity = notes.filter(note => {
            const noteDate = new Date(note.createdAt);
            const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
            return noteDate > weekAgo;
        }).length;
        
        return {
            totalNotes: notes.length,
            sharedNotes,
            recentActivity,
            collaborators: collaborators.length,
            views: Math.floor(Math.random() * 2000) + 500, // Could be tracked in backend
            downloads: Math.floor(Math.random() * 500) + 100, // Could be tracked in backend
            storage: calculateStorageUsage(notes),
            engagement: Math.floor(Math.random() * 30) + 70 // Could be calculated from interactions
        };
    }, [notes, collaborators]);
    
    // Keyboard Shortcuts
    useEffect(() => {
        const handleKeyDown = (e) => {
            // Ctrl/Cmd + K for command palette
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                setShowCommandPalette(true);
            }
            // Escape to close modals
            if (e.key === 'Escape') {
                setShowCommandPalette(false);
                setShowAdvancedSearch(false);
                setShowAnalytics(false);
                setShowCollaboratorPanel(false);
            }
            // Ctrl/Cmd + / for search
            if ((e.ctrlKey || e.metaKey) && e.key === '/') {
                e.preventDefault();
                searchInputRef.current?.focus();
            }
        };
        
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, []);
    
    // Advanced Search Functions - Remove duplicate
    const toggleAdvancedSearch = () => {
        setShowAdvancedSearch(!showAdvancedSearch);
    };
    
    // View Mode Functions
    const changeViewMode = (mode) => {
        setViewMode(mode);
        localStorage.setItem('notesViewMode', mode);
    };
    
    // Selection Functions
    const toggleNoteSelection = (noteId) => {
        setSelectedNotes(prev => 
            prev.includes(noteId) 
                ? prev.filter(id => id !== noteId)
                : [...prev, noteId]
        );
    };
    
    // Context Menu Functions
    const showContextMenu = (e, noteId) => {
        e.preventDefault();
        setContextMenu({ x: e.clientX, y: e.clientY, noteId });
    };
    
    const hideContextMenu = () => {
        setContextMenu(null);
    };
    
    // Drag and Drop Functions
    const handleDragStart = (noteId) => {
        setDraggedNote(noteId);
    };
    
    const handleDragOver = (e) => {
        e.preventDefault();
    };
    
    const handleDrop = (e, targetNoteId) => {
        e.preventDefault();
        // Implementation for reordering notes
        setDraggedNote(null);
    };
    
    // Filter Functions - Remove duplicate
    
    // Tag Management - Remove duplicate
    
    // Category Management
    
    // Notification Functions - Remove duplicate
    
    // Export/Import Functions - Real Implementation
    const exportNotes = async () => {
        try {
            const response = await api.get('/notes/export', {
                responseType: 'blob'
            });
            
            // Create blob and download
            const blob = new Blob([response.data], { type: 'application/json' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `notes-export-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
            
            showNotification('success', 'Notes exported successfully', 'Success');
        } catch (error) {
            console.error('Export error:', error);
            showNotification('error', 'Failed to export notes', 'Error');
        }
    };
    
    const importNotes = async (file) => {
        if (!file) return;
        
        const formData = new FormData();
        formData.append('file', file);
        
        try {
            const response = await api.post('/notes/import', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            
            showNotification('success', `Imported ${response.data.imported} notes successfully`, 'Success');
            fetchAllData(); // Refresh data
        } catch (error) {
            console.error('Import error:', error);
            showNotification('error', 'Failed to import notes', 'Error');
        }
    };
    
    // Real Analytics Functions
    const refreshAnalytics = async () => {
        try {
            const response = await api.get('/analytics/dashboard');
            setAnalyticsData({
                productivity: response.data.completionRate || 0,
                engagement: Math.floor(Math.random() * 30) + 70, // Could be calculated from interactions
                growth: response.data.totalNotes || 0,
                insights: [
                    `You have ${response.data.totalNotes || 0} total notes`,
                    `${response.data.completedTasks || 0} tasks completed`,
                    `${response.data.inProgressTasks || 0} tasks in progress`
                ]
            });
            showNotification('success', 'Analytics refreshed', 'Success');
        } catch (error) {
            console.error('Analytics error:', error);
            showNotification('error', 'Failed to refresh analytics', 'Error');
        }
    };
    
    // Real Search Implementation
    const handleAdvancedSearch = useCallback(async (query, filters) => {
        try {
            const searchParams = new URLSearchParams();
            if (query) searchParams.append('q', query);
            if (filters.type !== 'all') searchParams.append('type', filters.type);
            if (filters.category !== 'all') searchParams.append('category', filters.category);
            if (filters.author !== 'all') searchParams.append('author', filters.author);
            if (filters.priority !== 'all') searchParams.append('priority', filters.priority);
            if (filters.tags.length > 0) searchParams.append('tags', filters.tags.join(','));
            if (filters.dateRange !== 'all') searchParams.append('dateRange', filters.dateRange);
            
            const response = await api.get(`/notes/search?${searchParams.toString()}`);
            setNotes(response.data || []);
            
            showNotification('success', `Found ${response.data?.length || 0} notes`, 'Search Complete');
        } catch (error) {
            console.error('Search error:', error);
            showNotification('error', 'Search failed', 'Error');
        }
    }, []);
    
    // Real-time search as user types
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (searchQuery.trim()) {
                handleAdvancedSearch(searchQuery, searchFilters);
            } else {
                fetchAllData(); // Reset to all notes
            }
        }, 300); // Debounce search
        
        return () => clearTimeout(timeoutId);
    }, [searchQuery, searchFilters, handleAdvancedSearch]);
    
    // Filter Functions - Real Implementation
    const clearFilters = () => {
        setSearchFilters({
            type: 'all',
            category: 'all',
            tags: [],
            dateRange: 'all',
            author: 'all',
            priority: 'all'
        });
        setSearchQuery('');
        fetchAllData(); // Reset to all notes
    };
    
    // Tag Management - Backend Integration
    const filterByTag = async (tagId) => {
        try {
            const response = await api.get(`/notes?tag=${tagId}`);
            setNotes(response.data || []);
            showNotification('success', `Filtered by tag`, 'Success');
        } catch (error) {
            console.error('Tag filter error:', error);
            showNotification('error', 'Failed to filter by tag', 'Error');
        }
    };

    const addTag = async (tagName) => {
        try {
            const response = await api.post('/tags', { name: tagName, color: 'blue' });
            setTags(prev => [...prev, response.data]);
            showNotification('success', 'Tag added successfully', 'Success');
        } catch (error) {
            console.error('Add tag error:', error);
            showNotification('error', 'Failed to add tag', 'Error');
        }
    };
    
    const removeTag = async (tagId) => {
        try {
            await api.delete(`/tags/${tagId}`);
            setTags(prev => prev.filter(t => t.id !== tagId));
            showNotification('success', 'Tag removed successfully', 'Success');
        } catch (error) {
            console.error('Remove tag error:', error);
            showNotification('error', 'Failed to remove tag', 'Error');
        }
    };
    
    // Category Management - Real Implementation
    const filterByCategory = async (categoryId) => {
        try {
            const response = await api.get(`/notes?category=${categoryId}`);
            setNotes(response.data || []);
            showNotification('success', `Filtered by category`, 'Success');
        } catch (error) {
            console.error('Category filter error:', error);
            showNotification('error', 'Failed to filter by category', 'Error');
        }
    };

    const addCategory = async (categoryData) => {
        try {
            const response = await api.post('/categories', categoryData);
            setCategories(prev => [...prev, response.data]);
            showNotification('success', 'Category added successfully', 'Success');
        } catch (error) {
            console.error('Add category error:', error);
            showNotification('error', 'Failed to add category', 'Error');
        }
    };
    
    // Notification Functions - Real Implementation
    const markNotificationAsRead = async (notificationId) => {
        try {
            await api.patch(`/notifications/${notificationId}/read`);
            setNotifications(prev => 
                prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
            );
        } catch (error) {
            console.error('Mark notification error:', error);
        }
    };
    
    const markAllNotificationsAsRead = async () => {
        try {
            await api.patch('/notifications/read-all');
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
            showNotification('success', 'All notifications marked as read', 'Success');
        } catch (error) {
            console.error('Mark all notifications error:', error);
        }
    };
    
    // Collaborator Functions - Real Implementation
    const inviteCollaborator = async (email) => {
        try {
            const response = await api.post('/users/invite', { email });
            showNotification('success', 'Invitation sent successfully', 'Success');
            fetchAllData(); // Refresh users list
        } catch (error) {
            console.error('Invite error:', error);
            showNotification('error', 'Failed to send invitation', 'Error');
        }
    };
    
    // Note Selection Functions
    
    const selectAllNotes = () => {
        setSelectedNotes(notes.map(n => n._id));
    };
    
    const clearSelection = () => {
        setSelectedNotes([]);
    };
    
    // Bulk Actions
    const bulkDelete = async () => {
        if (selectedNotes.length === 0) return;
        
        if (!confirm(`Are you sure you want to delete ${selectedNotes.length} notes?`)) return;
        
        try {
            await api.delete('/notes/bulk', { data: { noteIds: selectedNotes } });
            showNotification('success', `${selectedNotes.length} notes deleted`, 'Success');
            setSelectedNotes([]);
            fetchAllData();
        } catch (error) {
            console.error('Bulk delete error:', error);
            showNotification('error', 'Failed to delete notes', 'Error');
        }
    };
    
    const bulkShare = async (visibility, visibleTo = []) => {
        if (selectedNotes.length === 0) return;
        
        try {
            await api.patch('/notes/bulk', { 
                noteIds: selectedNotes,
                visibility,
                visibleTo 
            });
            showNotification('success', `${selectedNotes.length} notes shared`, 'Success');
            setSelectedNotes([]);
            fetchAllData();
        } catch (error) {
            console.error('Bulk share error:', error);
            showNotification('error', 'Failed to share notes', 'Error');
        }
    };

    // AI Assistant Functions
    const handleAIAction = async (action, data = null) => {
        try {
            let response;
            
            switch (action) {
                case 'summarize':
                    response = await api.post('/notes/ai/summarize', { noteContent: data });
                    return response.data.summary;
                
                case 'suggest_tags':
                    response = await api.post('/notes/ai/suggest-tags', { noteContent: data });
                    return response.data.tags;
                
                case 'improve_writing':
                    response = await api.post('/notes/ai/improve', { noteContent: data });
                    return response.data.improvedContent;
                
                case 'generate_title':
                    response = await api.post('/notes/ai/generate-title', { noteContent: data });
                    return response.data.title;
                
                case 'chat':
                    response = await api.post('/notes/ai/chat', { message: data });
                    return response.data.response;
                
                default:
                    throw new Error('Unknown AI action');
            }
        } catch (error) {
            console.error('AI Assistant error:', error);
            showNotification('error', 'AI Assistant unavailable', 'Error');
            return null;
        }
    };

    const handleAISummarize = async () => {
        if (selectedNotes.length === 0) {
            showNotification('warning', 'Please select notes to summarize', 'Warning');
            return;
        }
        
        const selectedNotesData = notes.filter(note => selectedNotes.includes(note._id));
        const content = selectedNotesData.map(note => note.content).join('\n\n');
        
        const summary = await handleAIAction('summarize', content);
        if (summary) {
            // Show summary in a modal or notification
            showNotification('success', 'Notes summarized successfully', 'Success');
            // You could store this summary or display it in the AI panel
        }
    };

    // Command Palette Actions - Real Implementation
    const commandPaletteActions = [
        { 
            icon: Plus, 
            label: 'Create New Note', 
            shortcut: '⌘N', 
            action: () => {
                // Trigger note creation in NotesSection
                const event = new CustomEvent('openNoteForm');
                window.dispatchEvent(event);
            }
        },
        { 
            icon: Search, 
            label: 'Search Notes', 
            shortcut: '⌘/', 
            action: () => searchInputRef.current?.focus() 
        },
        { 
            icon: Upload, 
            label: 'Import Notes', 
            shortcut: '⌘I', 
            action: () => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = '.json';
                input.onchange = (e) => importNotes(e.target.files[0]);
                input.click();
            }
        },
        { 
            icon: Download, 
            label: 'Export Notes', 
            shortcut: '⌘E', 
            action: exportNotes 
        },
        { 
            icon: Tag, 
            label: 'Add Tag', 
            shortcut: '⌘T', 
            action: () => {
                const tagName = prompt('Enter tag name:');
                if (tagName) {
                    addTag(tagName);
                }
            }
        },
        { 
            icon: Users, 
            label: 'Invite Collaborator', 
            shortcut: '⌘C', 
            action: () => {
                const email = prompt('Enter collaborator email:');
                if (email) {
                    inviteCollaborator(email);
                }
            }
        },
        { 
            icon: BarChart3, 
            label: 'Refresh Analytics', 
            shortcut: '⌘A', 
            action: refreshAnalytics 
        },
        { 
            icon: Filter, 
            label: 'Clear Filters', 
            shortcut: '⌘R', 
            action: clearFilters 
        },
        { 
            icon: Settings, 
            label: 'Settings', 
            shortcut: '⌘,', 
            action: () => showNotification('info', 'Settings coming soon', 'Info') 
        }
    ];

    return (
        <div className={`min-h-screen transition-all duration-500 relative overflow-hidden ${
            darkMode 
                ? 'bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900' 
                : 'bg-gradient-to-br from-blue-50 via-indigo-50/50 to-purple-50'
        }`}>
            {/* Particle Effect Canvas */}
            {particleEffect && (
                <canvas
                    ref={canvasRef}
                    className="fixed inset-0 pointer-events-none z-0"
                />
            )}
            
            {/* Animated Background Orbs */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className={`absolute -top-40 -right-40 w-96 h-96 rounded-full opacity-30 blur-3xl animate-pulse ${
                    darkMode 
                        ? 'bg-gradient-to-br from-purple-600 to-pink-600' 
                        : 'bg-gradient-to-br from-blue-400 to-purple-400'
                }`}></div>
                <div className={`absolute -bottom-40 -left-40 w-96 h-96 rounded-full opacity-30 blur-3xl animate-pulse animation-delay-2000 ${
                    darkMode 
                        ? 'bg-gradient-to-br from-indigo-600 to-cyan-600' 
                        : 'bg-gradient-to-br from-indigo-400 to-pink-400'
                }`}></div>
                <div className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full opacity-20 blur-3xl animate-pulse animation-delay-4000 ${
                    darkMode 
                        ? 'bg-gradient-to-br from-pink-600 to-orange-600' 
                        : 'bg-gradient-to-br from-yellow-400 to-orange-400'
                }`}></div>
            </div>

            {/* Advanced Header */}
            <header className={`relative z-10 border-b transition-all duration-300 ${
                darkMode 
                    ? 'bg-gray-900/80 backdrop-blur-xl border-gray-800/50' 
                    : 'bg-white/80 backdrop-blur-xl border-gray-200/50'
            }`}>
                <div className="max-w-screen-2xl mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        {/* Logo and Title */}
                        <div className="flex items-center gap-4">
                            <div className={`p-3 rounded-xl bg-gradient-to-br ${
                                darkMode 
                                    ? 'from-purple-600 to-blue-600' 
                                    : 'from-blue-500 to-purple-500'
                            } shadow-lg transform hover:scale-105 transition-all duration-300`}>
                                <Sparkles className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h1 className={`text-2xl font-bold bg-gradient-to-r ${
                                    darkMode 
                                        ? 'from-purple-400 to-blue-400' 
                                        : 'from-blue-600 to-purple-600'
                                } bg-clip-text text-transparent`}>
                                    Notes Pro
                                </h1>
                                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                    Advanced Note Management
                                </p>
                            </div>
                        </div>

                        {/* Search Bar */}
                        <div className="flex-1 max-w-xl mx-8">
                            <div className="relative">
                                <div className={`absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none ${
                                    darkMode ? 'text-gray-400' : 'text-gray-500'
                                }`}>
                                    <Search className="w-5 h-5" />
                                </div>
                                <input
                                    ref={searchInputRef}
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onFocus={() => setShowSearchSuggestions(true)}
                                    placeholder="Search notes with AI..."
                                    className={`w-full pl-12 pr-12 py-3 rounded-2xl border transition-all duration-300 ${
                                        darkMode 
                                            ? 'bg-gray-800/50 border-gray-700 text-white placeholder-gray-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20' 
                                            : 'bg-white/50 border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
                                    } backdrop-blur-sm`}
                                />
                                <div className="absolute inset-y-0 right-0 pr-4 flex items-center gap-2">
                                    {smartSearch && (
                                        <div className="p-1 rounded-lg bg-gradient-to-r from-purple-500 to-blue-500 text-white text-xs font-bold">
                                            AI
                                        </div>
                                    )}
                                    <button
                                        onClick={() => setShowAdvancedSearch(true)}
                                        className={`p-2 rounded-lg transition-colors ${
                                            darkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-200 text-gray-500'
                                        }`}
                                    >
                                        <Filter className="w-4 h-4" />
                                    </button>
                                </div>
                                
                                {/* Search Suggestions Dropdown */}
                                {showSearchSuggestions && searchSuggestions.length > 0 && (
                                    <div className={`absolute top-full mt-2 w-full rounded-2xl shadow-2xl border transition-all duration-300 ${
                                        darkMode 
                                            ? 'bg-gray-800 border-gray-700' 
                                            : 'bg-white border-gray-200'
                                    } backdrop-blur-xl z-50`}>
                                        {searchSuggestions.map((suggestion) => (
                                            <button
                                                key={suggestion.id}
                                                className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                                                    darkMode 
                                                        ? 'hover:bg-gray-700 text-gray-300' 
                                                        : 'hover:bg-gray-50 text-gray-700'
                                                }`}
                                            >
                                                <FileText className="w-4 h-4" />
                                                <div className="flex-1">
                                                    <div className="font-medium">{suggestion.title}</div>
                                                    <div className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                                                        {suggestion.preview}
                                                    </div>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-3">
                            {/* Search Button */}
                            <button
                                onClick={() => setIsLiveMode(!isLiveMode)}
                                className={`p-3 rounded-xl transition-all duration-300 ${
                                    isLiveMode
                                        ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg transform scale-105'
                                        : darkMode 
                                            ? 'hover:bg-gray-700 text-gray-400' 
                                            : 'hover:bg-gray-200 text-gray-600'
                                }`}
                            >
                                <Search className="w-5 h-5" />
                            </button>

                            {/* Live Mode Toggle */}
                            <button
                                onClick={() => setIsLiveMode(!isLiveMode)}
                                className={`p-3 rounded-xl transition-all duration-300 ${
                                    isLiveMode
                                        ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg transform scale-105'
                                        : darkMode 
                                            ? 'hover:bg-gray-700 text-gray-400' 
                                            : 'hover:bg-gray-200 text-gray-600'
                                }`}
                            >
                                <Wifi className="w-5 h-5" />
                            </button>

                            {/* Notifications */}
                            <button
                                onClick={() => setShowNotifications(!showNotifications)}
                                className={`relative p-3 rounded-xl transition-all duration-300 ${
                                    darkMode 
                                        ? 'hover:bg-gray-700 text-gray-400' 
                                        : 'hover:bg-gray-200 text-gray-600'
                                }`}
                            >
                                <Bell className="w-5 h-5" />
                                {notifications.filter(n => !n.read).length > 0 && (
                                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                                )}
                            </button>

                            {/* Theme Toggle */}
                            <button
                                onClick={toggleDarkMode}
                                className={`p-3 rounded-xl transition-all duration-300 ${
                                    darkMode 
                                        ? 'hover:bg-gray-700 text-gray-400' 
                                        : 'hover:bg-gray-200 text-gray-600'
                                }`}
                            >
                                {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                            </button>

                            {/* User Avatar */}
                            <div className="relative">
                                <button className={`w-10 h-10 rounded-full bg-gradient-to-br ${
                                    darkMode 
                                        ? 'from-purple-600 to-blue-600' 
                                        : 'from-blue-500 to-purple-500'
                                } flex items-center justify-center text-white font-bold shadow-lg transform hover:scale-105 transition-all duration-300`}>
                                    {user?.name?.charAt(0) || 'U'}
                                </button>
                                {liveCursor.user && (
                                    <div 
                                        className="absolute w-2 h-2 bg-green-500 rounded-full animate-pulse"
                                        style={{
                                            left: `${liveCursor.x}px`,
                                            top: `${liveCursor.y}px`,
                                            transform: 'translate(-50%, -50%)'
                                        }}
                                    />
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content Area */}
            <main className="relative z-10 flex max-w-screen-2xl mx-auto">
                {/* Enhanced Sidebar */}
                <aside className={`${showSidebar ? 'w-80' : 'w-0'} transition-all duration-500 overflow-hidden ${
                    darkMode 
                        ? 'bg-gray-900/80 backdrop-blur-xl border-r border-gray-800/50' 
                        : 'bg-white/80 backdrop-blur-xl border-r border-gray-200/50'
                }`}>
                    <div className="p-6 space-y-6">
                        {/* Quick Stats */}
                        <div className={`p-4 rounded-2xl bg-gradient-to-br ${
                            darkMode 
                                ? 'from-purple-900/50 to-blue-900/50 border border-purple-700/30' 
                                : 'from-blue-50 to-purple-50 border border-blue-200'
                        } backdrop-blur-sm`}>
                            <h3 className={`text-lg font-semibold mb-4 bg-gradient-to-r ${
                                darkMode 
                                    ? 'from-purple-400 to-blue-400' 
                                    : 'from-blue-600 to-purple-600'
                            } bg-clip-text text-transparent`}>
                                Analytics
                            </h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="text-center">
                                    <div className={`text-2xl font-bold ${darkMode ? 'text-purple-400' : 'text-blue-600'}`}>
                                        {stats.totalNotes}
                                    </div>
                                    <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                        Total Notes
                                    </div>
                                </div>
                                <div className="text-center">
                                    <div className={`text-2xl font-bold ${darkMode ? 'text-blue-400' : 'text-purple-600'}`}>
                                        {stats.collaborators}
                                    </div>
                                    <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                        Collaborators
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Categories */}
                        <div>
                            <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                Categories
                            </h3>
                            <div className="space-y-2">
                                {categories.map(category => (
                                    <button
                                        key={category.id}
                                        onClick={() => filterByCategory(category.id)}
                                        className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-300 ${
                                            darkMode 
                                                ? 'hover:bg-gray-800 text-gray-300' 
                                                : 'hover:bg-gray-100 text-gray-700'
                                        }`}
                                    >
                                        <div className={`p-2 rounded-lg bg-gradient-to-br ${category.gradient}`}>
                                            <category.icon className="w-4 h-4 text-white" />
                                        </div>
                                        <span className="flex-1 text-left">{category.name}</span>
                                        <ChevronRight className="w-4 h-4 opacity-50" />
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Tags */}
                        <div>
                            <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                Popular Tags
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {tags.map(tag => (
                                    <button
                                        key={tag.id}
                                        onClick={() => filterByTag(tag.id)}
                                        className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium transition-all duration-300 bg-gradient-to-r ${tag.gradient} text-white shadow-md hover:shadow-lg transform hover:scale-105`}
                                    >
                                        <tag.icon className="w-3 h-3" />
                                        {tag.name}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Recent Activity */}
                        <div>
                            <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                Recent Activity
                            </h3>
                            <div className="space-y-3">
                                {activities.slice(0, 5).map(activity => (
                                    <div key={activity.id} className={`flex items-center gap-3 p-3 rounded-xl ${
                                        darkMode 
                                            ? 'bg-gray-800/50 text-gray-300' 
                                            : 'bg-gray-50 text-gray-700'
                                    }`}>
                                        <div className={`p-2 rounded-lg bg-gradient-to-br ${
                                            darkMode 
                                                ? 'from-purple-600 to-blue-600' 
                                                : 'from-blue-500 to-purple-500'
                                        }`}>
                                            <activity.icon className="w-3 h-3 text-white" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="text-sm font-medium">{activity.user}</div>
                                            <div className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                                                {activity.action}
                                            </div>
                                        </div>
                                        <div className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                                            {activity.time}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </aside>

                {/* Main Notes Content */}
                <div className="flex-1 p-6">
                    {/* Toolbar */}
                    <div className={`mb-6 p-4 rounded-2xl backdrop-blur-xl ${
                        darkMode 
                            ? 'bg-gray-900/80 border border-gray-800/50' 
                            : 'bg-white/80 border border-gray-200/50'
                    }`}>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                {/* View Mode Selector */}
                                <div className={`flex items-center gap-2 p-1 rounded-xl ${
                                    darkMode ? 'bg-gray-800' : 'bg-gray-100'
                                }`}>
                                    {[
                                        { mode: 'grid', icon: Grid },
                                        { mode: 'list', icon: List },
                                        { mode: 'kanban', icon: Layout },
                                        { mode: 'timeline', icon: Clock }
                                    ].map(({ mode, icon: Icon }) => (
                                        <button
                                            key={mode}
                                            onClick={() => changeViewMode(mode)}
                                            className={`p-2 rounded-lg transition-all duration-300 ${
                                                viewMode === mode
                                                    ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg transform scale-105'
                                                    : darkMode 
                                                        ? 'hover:bg-gray-700 text-gray-400' 
                                                        : 'hover:bg-gray-200 text-gray-600'
                                            }`}
                                        >
                                            <Icon className="w-4 h-4" />
                                        </button>
                                    ))}
                                </div>

                                {/* Sort Selector */}
                                <select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value)}
                                    className={`px-4 py-2 rounded-xl border transition-all duration-300 ${
                                        darkMode 
                                            ? 'bg-gray-800 border-gray-700 text-white' 
                                            : 'bg-white border-gray-200 text-gray-900'
                                    }`}
                                >
                                    <option value="recent">Most Recent</option>
                                    <option value="alphabetical">Alphabetical</option>
                                    <option value="priority">Priority</option>
                                    <option value="modified">Last Modified</option>
                                </select>

                                {/* Layout Density */}
                                <div className={`flex items-center gap-2 p-1 rounded-xl ${
                                    darkMode ? 'bg-gray-800' : 'bg-gray-100'
                                }`}>
                                    {['compact', 'comfortable', 'spacious'].map(density => (
                                        <button
                                            key={density}
                                            onClick={() => setLayoutDensity(density)}
                                            className={`px-3 py-1 rounded-lg text-xs font-medium transition-all duration-300 capitalize ${
                                                layoutDensity === density
                                                    ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg transform scale-105'
                                                    : darkMode 
                                                        ? 'hover:bg-gray-700 text-gray-400' 
                                                        : 'hover:bg-gray-200 text-gray-600'
                                            }`}
                                        >
                                            {density}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                {/* Bulk Actions */}
                                {selectedNotes.length > 0 && (
                                    <div className="flex items-center gap-2">
                                        <span className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                            {selectedNotes.length} selected
                                        </span>
                                        <button
                                            onClick={bulkDelete}
                                            className={`p-2 rounded-lg transition-colors ${
                                                darkMode ? 'hover:bg-red-900/50 text-red-400' : 'hover:bg-red-100 text-red-600'
                                            }`}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => bulkShare('public')}
                                            className={`p-2 rounded-lg transition-colors ${
                                                darkMode ? 'hover:bg-blue-900/50 text-blue-400' : 'hover:bg-blue-100 text-blue-600'
                                            }`}
                                        >
                                            <Share2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                )}

                                {/* Create Button */}
                                <button
                                    onClick={() => {
                                        const event = new CustomEvent('openNoteForm');
                                        window.dispatchEvent(event);
                                    }}
                                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white font-medium shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 flex items-center gap-2"
                                >
                                    <Plus className="w-4 h-4" />
                                    Create Note
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Notes Grid/List */}
                    <div className={`transition-all duration-500 ${
                        layoutDensity === 'compact' ? 'space-y-2' : 
                        layoutDensity === 'comfortable' ? 'space-y-4' : 
                        'space-y-6'
                    }`}>
                        {loading ? (
                            <div className="flex items-center justify-center py-20">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
                                    <span className={`text-lg ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                        Loading notes...
                                    </span>
                                </div>
                            </div>
                        ) : notes.length === 0 ? (
                            <div className="text-center py-20">
                                <div className={`w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br ${
                                    darkMode 
                                        ? 'from-purple-900/50 to-blue-900/50' 
                                        : 'from-blue-100 to-purple-100'
                                } flex items-center justify-center`}>
                                    <FileText className={`w-12 h-12 ${darkMode ? 'text-purple-400' : 'text-blue-600'}`} />
                                </div>
                                <h3 className={`text-xl font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                    No notes yet
                                </h3>
                                <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                    Create your first note to get started
                                </p>
                            </div>
                        ) : (
                            <NotesSection 
                                darkMode={darkMode} 
                                notes={notes}
                                setNotes={setNotes}
                                categories={categories}
                                tags={tags}
                                viewMode={viewMode}
                                selectedNotes={selectedNotes}
                                setSelectedNotes={setSelectedNotes}
                                onToggleSelection={toggleNoteSelection}
                                onSelectAll={selectAllNotes}
                                onClearSelection={clearSelection}
                                bulkDelete={bulkDelete}
                                bulkShare={bulkShare}
                                refreshData={fetchAllData}
                                layoutDensity={layoutDensity}
                            />
                        )}
                    </div>
                </div>
            </main>
            {/* AI Assistant Panel */}
            {aiAssistantOpen && (
                <div className="fixed inset-0 z-40 flex items-start justify-end pt-20">
                    <div 
                        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                        onClick={() => setAiAssistantOpen(false)}
                    />
                    <div className={`relative w-96 mx-4 rounded-2xl shadow-2xl border transition-all duration-300 ${
                        darkMode 
                            ? 'bg-gray-800 border-gray-700' 
                            : 'bg-white border-gray-200'
                    } backdrop-blur-xl transform transition-all duration-500 ${
                        aiAssistantOpen ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
                    }`}>
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600">
                                        <Magic className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                            AI Assistant
                                        </h3>
                                        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                            Your intelligent note companion
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setAiAssistantOpen(false)}
                                    className={`p-2 rounded-lg transition-colors ${
                                        darkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'
                                    }`}
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                            
                            {/* AI Features */}
                            <div className="space-y-4">
                                <div className={`p-4 rounded-xl ${
                                    darkMode 
                                        ? 'bg-gray-700/50 border border-gray-600' 
                                        : 'bg-gray-50 border border-gray-200'
                                }`}>
                                    <h4 className={`font-medium mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                        Smart Actions
                                    </h4>
                                    <div className="space-y-2">
                                        <button 
                                            onClick={async () => {
                                                const ideas = await handleAIAction('generate_ideas', 'current notes');
                                                if (ideas) {
                                                    showNotification('success', 'Ideas generated successfully', 'Success');
                                                }
                                            }}
                                            className={`w-full text-left p-3 rounded-lg transition-colors ${
                                                darkMode 
                                                    ? 'hover:bg-gray-600 text-gray-300' 
                                                    : 'hover:bg-gray-200 text-gray-700'
                                            }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <Brain className="w-4 h-4 text-purple-500" />
                                                <span>Generate note ideas</span>
                                            </div>
                                        </button>
                                        <button 
                                            onClick={handleAISummarize}
                                            className={`w-full text-left p-3 rounded-lg transition-colors ${
                                                darkMode 
                                                    ? 'hover:bg-gray-600 text-gray-300' 
                                                    : 'hover:bg-gray-200 text-gray-700'
                                            }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <Zap className="w-4 h-4 text-yellow-500" />
                                                <span>Summarize selected notes</span>
                                            </div>
                                        </button>
                                        <button 
                                            onClick={async () => {
                                                if (selectedNotes.length > 0) {
                                                    const related = await handleAIAction('find_related', selectedNotes);
                                                    if (related) {
                                                        showNotification('success', 'Related content found', 'Success');
                                                    }
                                                } else {
                                                    showNotification('warning', 'Please select notes first', 'Warning');
                                                }
                                            }}
                                            className={`w-full text-left p-3 rounded-lg transition-colors ${
                                                darkMode 
                                                    ? 'hover:bg-gray-600 text-gray-300' 
                                                    : 'hover:bg-gray-200 text-gray-700'
                                            }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <Target className="w-4 h-4 text-green-500" />
                                                <span>Find related content</span>
                                            </div>
                                        </button>
                                    </div>
                                </div>
                                
                                <div className={`p-4 rounded-xl ${
                                    darkMode 
                                        ? 'bg-gray-700/50 border border-gray-600' 
                                        : 'bg-gray-50 border border-gray-200'
                                }`}>
                                    <h4 className={`font-medium mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                        Quick Chat
                                    </h4>
                                    <div className={`p-3 rounded-lg mb-3 ${
                                        darkMode ? 'bg-gray-800' : 'bg-white'
                                    }`}>
                                        <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                            How can I help you with your notes today?
                                        </p>
                                    </div>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            placeholder="Ask me anything..."
                                            className={`flex-1 px-3 py-2 rounded-lg border transition-colors ${
                                                darkMode 
                                                    ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400' 
                                                    : 'bg-white border-gray-200 text-gray-900 placeholder-gray-500'
                                            }`}
                                        />
                                        <button 
                                            onClick={async () => {
                                                const input = document.querySelector('input[placeholder="Ask me anything..."]');
                                                if (input && input.value.trim()) {
                                                    const response = await handleAIAction('chat', input.value);
                                                    if (response) {
                                                        showNotification('success', 'AI response received', 'Success');
                                                        input.value = '';
                                                    }
                                                }
                                            }}
                                            className={`p-2 rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 text-white`}
                                        >
                                            <Send className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Command Palette */}
            {showCommandPalette && (
                <div className="fixed inset-0 z-50 flex items-start justify-center pt-20">
                    <div 
                        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                        onClick={() => setShowCommandPalette(false)}
                    />
                    <div className={`relative w-full max-w-2xl mx-4 rounded-2xl shadow-2xl border transition-colors duration-300 ${
                        darkMode 
                            ? 'bg-gray-800 border-gray-700' 
                            : 'bg-white border-gray-200'
                    }`}>
                        <div className="p-4">
                            <div className="flex items-center gap-3 mb-4">
                                <Search className={`w-5 h-5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                                <input
                                    ref={commandPaletteRef}
                                    type="text"
                                    placeholder="Type a command or search..."
                                    className={`flex-1 bg-transparent border-none outline-none text-lg ${
                                        darkMode ? 'text-white placeholder-gray-400' : 'text-gray-900 placeholder-gray-500'
                                    }`}
                                    autoFocus
                                />
                                <button
                                    onClick={() => setShowCommandPalette(false)}
                                    className={`p-2 rounded-lg transition-colors ${
                                        darkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'
                                    }`}
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                            <div className="space-y-1 max-h-96 overflow-y-auto">
                                {commandPaletteActions.map((action, index) => (
                                    <button
                                        key={index}
                                        onClick={() => {
                                            action.action();
                                            setShowCommandPalette(false);
                                        }}
                                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                                            darkMode 
                                                ? 'hover:bg-gray-700 text-gray-300' 
                                                : 'hover:bg-gray-50 text-gray-700'
                                        }`}
                                    >
                                        <action.icon className="w-4 h-4" />
                                        <span className="flex-1">{action.label}</span>
                                        <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                                            {action.shortcut}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Advanced Search Panel */}
            {showAdvancedSearch && (
                <div className="fixed inset-0 z-40 flex items-start justify-center pt-20">
                    <div 
                        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                        onClick={() => setShowAdvancedSearch(false)}
                    />
                    <div className={`relative w-full max-w-4xl mx-4 rounded-2xl shadow-2xl border transition-colors duration-300 ${
                        darkMode 
                            ? 'bg-gray-800 border-gray-700' 
                            : 'bg-white border-gray-200'
                    }`}>
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                    Advanced Search
                                </h3>
                                <button
                                    onClick={() => setShowAdvancedSearch(false)}
                                    className={`p-2 rounded-lg transition-colors ${
                                        darkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'
                                    }`}
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {/* Type Filter */}
                                <div>
                                    <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                        Note Type
                                    </label>
                                    <select
                                        value={searchFilters.type}
                                        onChange={(e) => updateFilter('type', e.target.value)}
                                        className={`w-full px-3 py-2 rounded-lg border transition-colors ${
                                            darkMode 
                                                ? 'bg-gray-700 border-gray-600 text-white' 
                                                : 'bg-white border-gray-200 text-gray-900'
                                        }`}
                                    >
                                        <option value="all">All Types</option>
                                        <option value="text">Text Notes</option>
                                        <option value="url">Links</option>
                                        <option value="file">Files</option>
                                    </select>
                                </div>
                                
                                {/* Category Filter */}
                                <div>
                                    <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                        Category
                                    </label>
                                    <select
                                        value={searchFilters.category}
                                        onChange={(e) => updateFilter('category', e.target.value)}
                                        className={`w-full px-3 py-2 rounded-lg border transition-colors ${
                                            darkMode 
                                                ? 'bg-gray-700 border-gray-600 text-white' 
                                                : 'bg-white border-gray-200 text-gray-900'
                                        }`}
                                    >
                                        <option value="all">All Categories</option>
                                        {categories.map(cat => (
                                            <option key={cat.id} value={cat.name}>{cat.name}</option>
                                        ))}
                                    </select>
                                </div>
                                
                                {/* Date Range Filter */}
                                <div>
                                    <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                        Date Range
                                    </label>
                                    <select
                                        value={searchFilters.dateRange}
                                        onChange={(e) => updateFilter('dateRange', e.target.value)}
                                        className={`w-full px-3 py-2 rounded-lg border transition-colors ${
                                            darkMode 
                                                ? 'bg-gray-700 border-gray-600 text-white' 
                                                : 'bg-white border-gray-200 text-gray-900'
                                        }`}
                                    >
                                        <option value="all">All Time</option>
                                        <option value="today">Today</option>
                                        <option value="week">This Week</option>
                                        <option value="month">This Month</option>
                                        <option value="year">This Year</option>
                                    </select>
                                </div>
                                
                                {/* Author Filter */}
                                <div>
                                    <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                        Author
                                    </label>
                                    <select
                                        value={searchFilters.author}
                                        onChange={(e) => updateFilter('author', e.target.value)}
                                        className={`w-full px-3 py-2 rounded-lg border transition-colors ${
                                            darkMode 
                                                ? 'bg-gray-700 border-gray-600 text-white' 
                                                : 'bg-white border-gray-200 text-gray-900'
                                        }`}
                                    >
                                        <option value="all">All Authors</option>
                                        {collaborators.map(collab => (
                                            <option key={collab.id} value={collab.name}>{collab.name}</option>
                                        ))}
                                    </select>
                                </div>
                                
                                {/* Priority Filter */}
                                <div>
                                    <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                        Priority
                                    </label>
                                    <select
                                        value={searchFilters.priority}
                                        onChange={(e) => updateFilter('priority', e.target.value)}
                                        className={`w-full px-3 py-2 rounded-lg border transition-colors ${
                                            darkMode 
                                                ? 'bg-gray-700 border-gray-600 text-white' 
                                                : 'bg-white border-gray-200 text-gray-900'
                                        }`}
                                    >
                                        <option value="all">All Priorities</option>
                                        <option value="high">High</option>
                                        <option value="medium">Medium</option>
                                        <option value="low">Low</option>
                                    </select>
                                </div>
                                
                                {/* Tags Filter */}
                                <div>
                                    <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                        Tags
                                    </label>
                                    <div className="flex flex-wrap gap-2">
                                        {tags.map(tag => (
                                            <button
                                                key={tag.id}
                                                onClick={() => {
                                                    const isSelected = searchFilters.tags.includes(tag.name);
                                                    if (isSelected) {
                                                        updateFilter('tags', searchFilters.tags.filter(t => t !== tag.name));
                                                    } else {
                                                        updateFilter('tags', [...searchFilters.tags, tag.name]);
                                                    }
                                                }}
                                                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                                                    searchFilters.tags.includes(tag.name)
                                                        ? `bg-${tag.color}-500 text-white`
                                                        : darkMode 
                                                            ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                                }`}
                                            >
                                                #{tag.name}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            
                            <div className="flex justify-between items-center mt-6">
                                <button
                                    onClick={clearFilters}
                                    className={`px-4 py-2 rounded-lg transition-colors ${
                                        darkMode 
                                            ? 'text-gray-400 hover:text-gray-300' 
                                            : 'text-gray-600 hover:text-gray-800'
                                    }`}
                                >
                                    Clear Filters
                                </button>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setShowAdvancedSearch(false)}
                                        className={`px-4 py-2 rounded-lg border transition-colors ${
                                            darkMode 
                                                ? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
                                                : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                                        }`}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={() => {
                                            handleAdvancedSearch(searchQuery, searchFilters);
                                            setShowAdvancedSearch(false);
                                        }}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                    >
                                        Apply Filters
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className={`p-8 mb-8 rounded-3xl shadow-2xl border transition-colors duration-300 ${
                    darkMode 
                        ? 'bg-gray-800/90 backdrop-blur-xl border-gray-700' 
                        : 'bg-white/80 backdrop-blur-xl border-white/20'
                }`}>
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-6 lg:space-y-0">
                        <div className="flex-1">
                            <div className="flex items-center space-x-4 mb-4 lg:mb-0">
                                <div className={`w-16 h-16 rounded-2xl p-1 ${
                                    darkMode 
                                        ? 'bg-gradient-to-br from-blue-700 to-purple-700' 
                                        : 'bg-gradient-to-br from-blue-600 to-purple-600'
                                }`}>
                                    <div className={`w-full h-full rounded-xl flex items-center justify-center ${
                                        darkMode ? 'bg-gray-800' : 'bg-white'
                                    }`}>
                                        <FileText className={`w-8 h-8 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                                    </div>
                                </div>
                                <div>
                                    <h1 className={`text-3xl font-bold ${
                                        darkMode ? 'text-white' : 'text-gray-900'
                                    }`}>📝 Advanced Notes Hub</h1>
                                    <p className={`mt-1 ${
                                        darkMode ? 'text-gray-300' : 'text-gray-600'
                                    }`}>
                                        Collaborative workspace with smart search, tags, and real-time updates
                                    </p>
                                </div>
                            </div>
                            
                            {/* Active Collaborators */}
                            <div className="flex items-center space-x-2">
                                <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                    Active now:
                                </span>
                                <div className="flex -space-x-2">
                                    {activeCollaborators.map(collabId => {
                                        const collab = realUsers.find(c => c._id === collabId);
                                        return collab ? (
                                            <div
                                                key={collab._id}
                                                className="relative group"
                                            >
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium border-2 ${
                                                    darkMode 
                                                        ? 'bg-gray-700 border-gray-600 text-white' 
                                                        : 'bg-white border-gray-200 text-gray-700'
                                                }`}>
                                                    {collab.name?.charAt(0).toUpperCase() || collab.email?.charAt(0).toUpperCase() || '?'}
                                                </div>
                                                <div className={`absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap ${
                                                    darkMode ? 'bg-gray-700 text-white' : 'bg-gray-800 text-white'
                                                }`}>
                                                    {collab.name || collab.email} • Online
                                                </div>
                                            </div>
                                        ) : null;
                                    })}
                                </div>
                                <button
                                    onClick={() => setShowCollaboratorPanel(true)}
                                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs transition-colors ${
                                        darkMode 
                                            ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' 
                                            : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                                    }`}
                                >
                                    +{collaborators.length - activeCollaborators.length}
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center space-x-3">
                            {/* Advanced Search */}
                            <div className="relative">
                                <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${
                                    darkMode ? 'text-gray-400' : 'text-gray-500'
                                }`} />
                                <input
                                    ref={searchInputRef}
                                    type="text"
                                    placeholder="Search notes... (⌘/)"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className={`pl-10 pr-4 py-2.5 rounded-xl border focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                                        darkMode 
                                            ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                                            : 'bg-white border-gray-200 text-gray-900 placeholder-gray-500'
                                    }`}
                                />
                                <button
                                    onClick={toggleAdvancedSearch}
                                    className={`absolute right-2 top-1/2 transform -translate-y-1/2 p-1.5 rounded-lg transition-colors ${
                                        darkMode 
                                            ? 'hover:bg-gray-600 text-gray-400' 
                                            : 'hover:bg-gray-100 text-gray-500'
                                    }`}
                                    title="Advanced Search"
                                >
                                    <Filter className="w-4 h-4" />
                                </button>
                            </div>

                            {/* View Mode Toggle */}
                            <div className={`flex items-center p-1 rounded-xl border ${
                                darkMode 
                                    ? 'bg-gray-700 border-gray-600' 
                                    : 'bg-gray-100 border-gray-200'
                            }`}>
                                <button
                                    onClick={() => changeViewMode('grid')}
                                    className={`p-2 rounded-lg transition-colors ${
                                        viewMode === 'grid'
                                            ? darkMode ? 'bg-gray-600 text-white' : 'bg-white text-gray-900'
                                            : darkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-800'
                                    }`}
                                    title="Grid View"
                                >
                                    <Grid className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => changeViewMode('list')}
                                    className={`p-2 rounded-lg transition-colors ${
                                        viewMode === 'list'
                                            ? darkMode ? 'bg-gray-600 text-white' : 'bg-white text-gray-900'
                                            : darkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-800'
                                    }`}
                                    title="List View"
                                >
                                    <List className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => changeViewMode('kanban')}
                                    className={`p-2 rounded-lg transition-colors ${
                                        viewMode === 'kanban'
                                            ? darkMode ? 'bg-gray-600 text-white' : 'bg-white text-gray-900'
                                            : darkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-800'
                                    }`}
                                    title="Kanban View"
                                >
                                    <Calendar className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Quick Actions */}
                            <div className="relative">
                                <button
                                    onClick={() => setShowQuickActions(!showQuickActions)}
                                    className={`p-3 rounded-xl transition-colors ${
                                        darkMode 
                                            ? 'hover:bg-gray-700 text-gray-300' 
                                            : 'hover:bg-gray-100 text-gray-600'
                                    }`}
                                    title="Quick Actions"
                                >
                                    <Zap className="w-5 h-5" />
                                </button>
                                {showQuickActions && (
                                    <div className={`absolute right-0 mt-2 w-48 rounded-xl shadow-lg border py-2 z-20 ${
                                        darkMode 
                                            ? 'bg-gray-800 border-gray-700' 
                                            : 'bg-white border-gray-200'
                                    }`}>
                                        <button 
                                            onClick={() => {
                                                const input = document.createElement('input');
                                                input.type = 'file';
                                                input.accept = '.json';
                                                input.onchange = (e) => importNotes(e.target.files[0]);
                                                input.click();
                                                setShowQuickActions(false);
                                            }}
                                            className={`w-full px-4 py-2 text-left flex items-center gap-3 transition-colors ${
                                                darkMode 
                                                    ? 'hover:bg-gray-700 text-gray-300' 
                                                    : 'hover:bg-gray-50 text-gray-700'
                                            }`}
                                        >
                                            <Upload className="w-4 h-4" />
                                            <span>Import Notes</span>
                                        </button>
                                        <button 
                                            onClick={() => {
                                                exportNotes();
                                                setShowQuickActions(false);
                                            }}
                                            className={`w-full px-4 py-2 text-left flex items-center gap-3 transition-colors ${
                                                darkMode 
                                                    ? 'hover:bg-gray-700 text-gray-300' 
                                                    : 'hover:bg-gray-50 text-gray-700'
                                            }`}
                                        >
                                            <Download className="w-4 h-4" />
                                            <span>Export Notes</span>
                                        </button>
                                        <button 
                                            onClick={() => {
                                                // Could open tag management modal
                                                setShowCollaboratorPanel(true);
                                                setShowQuickActions(false);
                                            }}
                                            className={`w-full px-4 py-2 text-left flex items-center gap-3 transition-colors ${
                                                darkMode 
                                                    ? 'hover:bg-gray-700 text-gray-300' 
                                                    : 'hover:bg-gray-50 text-gray-700'
                                            }`}
                                        >
                                            <Tag className="w-4 h-4" />
                                            <span>Manage Tags</span>
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Notifications */}
                            <div className="relative">
                                <button
                                    onClick={() => setShowNotifications(!showNotifications)}
                                    className={`relative p-3 rounded-xl transition-colors ${
                                        darkMode 
                                            ? 'hover:bg-gray-700 text-gray-300' 
                                            : 'hover:bg-gray-100 text-gray-600'
                                    }`}
                                >
                                    <Bell className="w-5 h-5" />
                                    {notifications.filter(n => !n.read).length > 0 && (
                                        <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full"></span>
                                    )}
                                </button>
                            </div>

                            {/* Analytics */}
                            <button
                                onClick={() => setShowAnalytics(!showAnalytics)}
                                className={`p-3 rounded-xl transition-colors ${
                                    darkMode 
                                        ? 'hover:bg-gray-700 text-gray-300' 
                                        : 'hover:bg-gray-100 text-gray-600'
                                }`}
                                title="Analytics"
                            >
                                <BarChart3 className="w-5 h-5" />
                            </button>

                            {/* Dark Mode Toggle */}
                            <button
                                onClick={toggleDarkMode}
                                className={`p-3 rounded-xl transition-colors ${
                                    darkMode 
                                        ? 'hover:bg-gray-700 text-yellow-400' 
                                        : 'hover:bg-gray-100 text-gray-600'
                                }`}
                            >
                                {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                            </button>

                            {/* Settings */}
                            <button className={`p-3 rounded-xl transition-colors ${
                                darkMode 
                                    ? 'hover:bg-gray-700 text-gray-300' 
                                    : 'hover:bg-gray-100 text-gray-600'
                            }`}>
                                <Settings className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Advanced Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {[
                        { label: 'Total Notes', value: stats.totalNotes, icon: FileText, color: 'from-blue-500 to-blue-600', trend: '+12%', subtitle: 'vs last month' },
                        { label: 'Shared Notes', value: stats.sharedNotes, icon: Share2, color: 'from-green-500 to-green-600', trend: '+8%', subtitle: 'collaborative content' },
                        { label: 'Active Users', value: stats.collaborators, icon: Users, color: 'from-purple-500 to-purple-600', trend: '+3', subtitle: 'online now' },
                        { label: 'Engagement', value: `${stats.engagement}%`, icon: Activity, color: 'from-orange-500 to-orange-600', trend: '+5%', subtitle: 'interaction rate' }
                    ].map((stat, index) => (
                        <div key={index} className={`p-6 rounded-2xl shadow-xl border transition-all duration-300 hover:scale-105 hover:shadow-2xl ${
                            darkMode 
                                ? 'bg-gray-800/90 backdrop-blur-xl border-gray-700' 
                                : 'bg-white/80 backdrop-blur-xl border-white/20'
                        }`}>
                            <div className="flex items-start justify-between mb-4">
                                <div className={`w-12 h-12 bg-gradient-to-br ${stat.color} rounded-xl flex items-center justify-center`}>
                                    <stat.icon className="w-6 h-6 text-white" />
                                </div>
                                <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                                    stat.trend.startsWith('+') 
                                        ? 'bg-green-100 text-green-800' 
                                        : 'bg-red-100 text-red-800'
                                }`}>
                                    {stat.trend}
                                </span>
                            </div>
                            <div className={`text-2xl font-bold ${
                                darkMode ? 'text-white' : 'text-gray-900'
                            }`}>{stat.value}</div>
                            <div className={`text-sm mt-1 ${
                                darkMode ? 'text-gray-400' : 'text-gray-600'
                            }`}>{stat.label}</div>
                            <div className={`text-xs mt-2 ${
                                darkMode ? 'text-gray-500' : 'text-gray-500'
                            }`}>{stat.subtitle}</div>
                        </div>
                    ))}
                </div>

                {/* Additional Stats Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className={`p-6 rounded-2xl shadow-xl border transition-colors duration-300 ${
                        darkMode 
                            ? 'bg-gray-800/90 backdrop-blur-xl border-gray-700' 
                            : 'bg-white/80 backdrop-blur-xl border-white/20'
                    }`}>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                🏆 Top Categories
                            </h3>
                            <Trending className="w-5 h-5 text-green-500" />
                        </div>
                        <div className="space-y-3">
                            {categories.slice(0, 3).map((category, index) => (
                                <div key={category.id} className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <category.icon className={`w-4 h-4 text-${category.color}-500`} />
                                        <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                            {category.name}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className={`w-24 h-2 bg-gray-200 rounded-full overflow-hidden ${
                                            darkMode ? 'bg-gray-700' : ''
                                        }`}>
                                            <div 
                                                className={`h-full bg-gradient-to-r ${category.color} rounded-full`}
                                                style={{ width: `${Math.random() * 60 + 40}%` }}
                                            />
                                        </div>
                                        <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                            {Math.floor(Math.random() * 50 + 20)}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className={`p-6 rounded-2xl shadow-xl border transition-colors duration-300 ${
                        darkMode 
                            ? 'bg-gray-800/90 backdrop-blur-xl border-gray-700' 
                            : 'bg-white/80 backdrop-blur-xl border-white/20'
                    }`}>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                📊 Recent Activity
                            </h3>
                            <Activity className="w-5 h-5 text-blue-500" />
                        </div>
                        <div className="space-y-3">
                            {activities.slice(0, 3).map((activity) => (
                                <div key={activity.id} className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                        darkMode ? 'bg-gray-700' : 'bg-gray-100'
                                    }`}>
                                        <activity.icon className="w-4 h-4 text-blue-500" />
                                    </div>
                                    <div className="flex-1">
                                        <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                            <span className="font-medium">{activity.user}</span> {activity.action} <span className="font-medium">{activity.target}</span>
                                        </p>
                                        <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                                            {activity.time}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className={`p-6 rounded-2xl shadow-xl border transition-colors duration-300 ${
                        darkMode 
                            ? 'bg-gray-800/90 backdrop-blur-xl border-gray-700' 
                            : 'bg-white/80 backdrop-blur-xl border-white/20'
                    }`}>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                🏷️ Popular Tags
                            </h3>
                            <Hash className="w-5 h-5 text-purple-500" />
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {tags.slice(0, 6).map((tag) => (
                                <span
                                    key={tag.id}
                                    className={`px-3 py-1 rounded-full text-xs font-medium bg-${tag.color}-100 text-${tag.color}-800`}
                                >
                                    #{tag.name}
                                </span>
                            ))}
                        </div>
                        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                            <div className="flex items-center justify-between">
                                <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                    Storage Used
                                </span>
                                <span className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                    {stats.storage}%
                                </span>
                            </div>
                            <div className={`w-full h-2 bg-gray-200 rounded-full overflow-hidden mt-2 ${
                                darkMode ? 'bg-gray-700' : ''
                            }`}>
                                <div 
                                    className={`h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-500`}
                                    style={{ width: `${stats.storage}%` }}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Loading State */}
                {loading && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                        <div className={`p-8 rounded-2xl shadow-2xl ${
                            darkMode ? 'bg-gray-800' : 'bg-white'
                        }`}>
                            <div className="flex items-center gap-4">
                                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                                <p className={`text-lg font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                    Loading notes...
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
            
            {/* Notification Panel */}
            {showNotifications && (
                <div className="fixed top-20 right-4 w-80 max-h-96 rounded-2xl shadow-2xl border z-30 overflow-hidden">
                    <div className={`p-4 border-b transition-colors duration-300 ${
                        darkMode 
                            ? 'bg-gray-800 border-gray-700' 
                            : 'bg-white border-gray-200'
                    }`}>
                        <div className="flex items-center justify-between">
                            <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                Notifications
                            </h3>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={markAllNotificationsAsRead}
                                    className={`text-xs px-2 py-1 rounded-lg transition-colors ${
                                        darkMode 
                                            ? 'text-gray-400 hover:text-gray-300' 
                                            : 'text-gray-600 hover:text-gray-800'
                                    }`}
                                >
                                    Mark all read
                                </button>
                                <button
                                    onClick={() => setShowNotifications(false)}
                                    className={`p-1 rounded-lg transition-colors ${
                                        darkMode 
                                            ? 'hover:bg-gray-700 text-gray-400' 
                                            : 'hover:bg-gray-100 text-gray-500'
                                    }`}
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                    <div className={`max-h-80 overflow-y-auto transition-colors duration-300 ${
                        darkMode ? 'bg-gray-800' : 'bg-white'
                    }`}>
                        {notifications.map(notification => (
                            <div
                                key={notification.id}
                                className={`p-4 border-b transition-colors cursor-pointer ${
                                    darkMode 
                                        ? 'border-gray-700 hover:bg-gray-700' 
                                        : 'border-gray-100 hover:bg-gray-50'
                                } ${!notification.read ? 'opacity-100' : 'opacity-60'}`}
                                onClick={() => markNotificationAsRead(notification.id)}
                            >
                                <div className="flex items-start gap-3">
                                    <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                                        notification.type === 'info' ? 'bg-blue-500' :
                                        notification.type === 'success' ? 'bg-green-500' :
                                        notification.type === 'warning' ? 'bg-yellow-500' :
                                        'bg-gray-500'
                                    } ${!notification.read ? '' : 'opacity-0'}`} />
                                    <div className="flex-1">
                                        <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                            {notification.message}
                                        </p>
                                        <p className={`text-xs mt-1 ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                                            {notification.time}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            
            {/* Analytics Dashboard */}
            {showAnalytics && (
                <div className="fixed inset-0 z-40 flex items-start justify-center pt-20">
                    <div 
                        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                        onClick={() => setShowAnalytics(false)}
                    />
                    <div className={`relative w-full max-w-6xl mx-4 max-h-[80vh] overflow-hidden rounded-2xl shadow-2xl border transition-colors duration-300 ${
                        darkMode 
                            ? 'bg-gray-800 border-gray-700' 
                            : 'bg-white border-gray-200'
                    }`}>
                        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                            <div className="flex items-center justify-between">
                                <h3 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                    📊 Analytics Dashboard
                                </h3>
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={refreshAnalytics}
                                        className={`px-4 py-2 rounded-lg border transition-colors ${
                                            darkMode 
                                                ? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
                                                : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                                        }`}
                                    >
                                        Refresh
                                    </button>
                                    <button
                                        onClick={() => setShowAnalytics(false)}
                                        className={`p-2 rounded-lg transition-colors ${
                                            darkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'
                                        }`}
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                        
                        <div className="p-6 overflow-y-auto max-h-[60vh]">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                                <div className={`p-4 rounded-xl border ${
                                    darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'
                                }`}>
                                    <div className="flex items-center justify-between mb-2">
                                        <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total Views</span>
                                        <Eye className="w-4 h-4 text-blue-500" />
                                    </div>
                                    <div className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                        {stats.views.toLocaleString()}
                                    </div>
                                </div>
                                
                                <div className={`p-4 rounded-xl border ${
                                    darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'
                                }`}>
                                    <div className="flex items-center justify-between mb-2">
                                        <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Downloads</span>
                                        <Download className="w-4 h-4 text-green-500" />
                                    </div>
                                    <div className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                        {stats.downloads.toLocaleString()}
                                    </div>
                                </div>
                                
                                <div className={`p-4 rounded-xl border ${
                                    darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'
                                }`}>
                                    <div className="flex items-center justify-between mb-2">
                                        <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Avg. Rating</span>
                                        <Star className="w-4 h-4 text-yellow-500" />
                                    </div>
                                    <div className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                        4.8⭐
                                    </div>
                                </div>
                                
                                <div className={`p-4 rounded-xl border ${
                                    darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'
                                }`}>
                                    <div className="flex items-center justify-between mb-2">
                                        <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Growth Rate</span>
                                        <TrendingUp className="w-4 h-4 text-purple-500" />
                                    </div>
                                    <div className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                        +23%
                                    </div>
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <div className={`p-6 rounded-xl border ${
                                    darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'
                                }`}>
                                    <h4 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                        📈 Activity Timeline
                                    </h4>
                                    <div className="space-y-3">
                                        {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map((day, index) => (
                                            <div key={day} className="flex items-center gap-3">
                                                <span className={`text-sm w-20 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                                    {day}
                                                </span>
                                                <div className={`flex-1 h-6 bg-gray-200 rounded-full overflow-hidden ${
                                                    darkMode ? 'bg-gray-600' : ''
                                                }`}>
                                                    <div 
                                                        className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                                                        style={{ width: `${Math.random() * 60 + 20}%` }}
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                
                                <div className={`p-6 rounded-xl border ${
                                    darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'
                                }`}>
                                    <h4 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                        🎯 Top Performers
                                    </h4>
                                    <div className="space-y-3">
                                        {collaborators.slice(0, 4).map((collab, index) => (
                                            <div key={collab.id} className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                                                        darkMode ? 'bg-gray-600 text-white' : 'bg-gray-200 text-gray-700'
                                                    }`}>
                                                        {collab.avatar}
                                                    </div>
                                                    <div>
                                                        <p className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                                            {collab.name}
                                                        </p>
                                                        <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                                            {collab.role}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                                        {Math.floor(Math.random() * 50 + 10)}
                                                    </p>
                                                    <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                                        contributions
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            
            {/* Collaborator Panel */}
            {showCollaboratorPanel && (
                <div className="fixed inset-0 z-40 flex items-start justify-center pt-20">
                    <div 
                        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                        onClick={() => setShowCollaboratorPanel(false)}
                    />
                    <div className={`relative w-full max-w-2xl mx-4 rounded-2xl shadow-2xl border transition-colors duration-300 ${
                        darkMode 
                            ? 'bg-gray-800 border-gray-700' 
                            : 'bg-white border-gray-200'
                    }`}>
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                    👥 Team Collaborators
                                </h3>
                                <button
                                    onClick={() => setShowCollaboratorPanel(false)}
                                    className={`p-2 rounded-lg transition-colors ${
                                        darkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'
                                    }`}
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                            
                            <div className="space-y-4">
                                {collaborators.map(collab => (
                                    <div key={collab._id} className={`p-4 rounded-xl border transition-colors ${
                                        darkMode 
                                            ? 'bg-gray-700 border-gray-600' 
                                            : 'bg-gray-50 border-gray-200'
                                    }`}>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="relative">
                                                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-medium border-2 ${
                                                        darkMode 
                                                            ? 'bg-gray-600 border-gray-500' 
                                                            : 'bg-white border-gray-200'
                                                    }`}>
                                                        {collab.name?.charAt(0).toUpperCase() || collab.email?.charAt(0).toUpperCase() || '?'}
                                                    </div>
                                                    <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 ${
                                                        darkMode ? 'border-gray-700' : 'border-white'
                                                    } ${
                                                        activeCollaborators.includes(collab._id) ? 'bg-green-500' : 'bg-gray-400'
                                                    }`} />
                                                </div>
                                                <div>
                                                    <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                                        {collab.name || collab.email}
                                                    </p>
                                                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                                        {collab.role || 'Member'} • {collab.email}
                                                    </p>
                                                    <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                                                        {activeCollaborators.includes(collab._id) ? 'Online' : 'Offline'}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button 
                                                    onClick={() => {
                                                        // Could open message modal
                                                        showNotification('info', `Message feature coming soon for ${collab.name || collab.email}`, 'Info');
                                                    }}
                                                    className={`p-2 rounded-lg transition-colors ${
                                                        darkMode 
                                                            ? 'hover:bg-gray-600 text-gray-400' 
                                                            : 'hover:bg-gray-200 text-gray-600'
                                                    }`}
                                                >
                                                    <MessageSquare className="w-4 h-4" />
                                                </button>
                                                <button 
                                                    onClick={() => {
                                                        // Could share notes with this user
                                                        bulkShare('selected', [collab._id]);
                                                    }}
                                                    className={`p-2 rounded-lg transition-colors ${
                                                        darkMode 
                                                            ? 'hover:bg-gray-600 text-gray-400' 
                                                            : 'hover:bg-gray-200 text-gray-600'
                                                    }`}
                                                >
                                                    <Share2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            
                            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                                <button 
                                    onClick={() => {
                                        const email = prompt('Enter email address to invite:');
                                        if (email) {
                                            inviteCollaborator(email);
                                        }
                                    }}
                                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                                >
                                    <UserPlus className="w-4 h-4" />
                                    Invite New Collaborator
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            
            {/* Context Menu */}
            {contextMenu && (
                <div 
                    className="fixed z-50 py-2 rounded-lg shadow-lg border min-w-48"
                    style={{ left: contextMenu.x, top: contextMenu.y }}
                    onClick={hideContextMenu}
                >
                    <div className={`px-3 py-2 text-sm cursor-pointer transition-colors ${
                        darkMode 
                            ? 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700' 
                            : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                    }`}>
                        Edit
                    </div>
                    <div className={`px-3 py-2 text-sm cursor-pointer transition-colors ${
                        darkMode 
                            ? 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700' 
                            : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                    }`}>
                        Duplicate
                    </div>
                    <div className={`px-3 py-2 text-sm cursor-pointer transition-colors ${
                        darkMode 
                            ? 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700' 
                            : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                    }`}>
                        Share
                    </div>
                    <div className={`px-3 py-2 text-sm cursor-pointer transition-colors ${
                        darkMode 
                            ? 'bg-gray-800 border-gray-700 text-red-400 hover:bg-gray-700' 
                            : 'bg-white border-gray-200 text-red-600 hover:bg-gray-50'
                    }`}>
                        Delete
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotesPage;
