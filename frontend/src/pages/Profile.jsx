import React, { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
    User, 
    Mail, 
    Phone, 
    MapPin, 
    Calendar, 
    Briefcase, 
    Clock, 
    Award, 
    Star, 
    TrendingUp, 
    Target, 
    Settings, 
    Camera, 
    Edit3, 
    Save, 
    X, 
    Check, 
    AlertCircle,
    Globe,
    Code,
    Palette,
    Users,
    Shield,
    Zap,
    Heart,
    BookOpen,
    Coffee,
    Moon
} from 'lucide-react';

const Profile = () => {
    const { user, setUser } = useAuth();
    const [profileData, setProfileData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [activeTab, setActiveTab] = useState('overview');
    const [saveStatus, setSaveStatus] = useState('');
    const [newSkill, setNewSkill] = useState('');
    const [darkMode, setDarkMode] = useState(() => {
        // Check localStorage for saved preference
        const savedTheme = localStorage.getItem('theme');
        return savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches);
    });
    const [emailNotifications, setEmailNotifications] = useState(true);
    const [language, setLanguage] = useState('en');
    const [profileImage, setProfileImage] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [uploadingImage, setUploadingImage] = useState(false);
    const [showImageCropper, setShowImageCropper] = useState(false);
    const fileInputRef = useRef(null);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        location: '',
        bio: '',
        skills: [],
        availability: {
            workingHoursPerDay: 8,
            timeZone: 'UTC'
        },
        preferences: {
            theme: darkMode ? 'dark' : 'light',
            language: 'en',
            notifications: true
        }
    });

    // Mock data for demonstration
    const [stats] = useState({
        tasksCompleted: 127,
        projectsActive: 8,
        teamMembers: 12,
        productivity: 94
    });

    const [recentActivity] = useState([
        { id: 1, type: 'task', title: 'Completed API Integration', time: '2 hours ago', icon: Check },
        { id: 2, type: 'project', title: 'Started Dashboard Redesign', time: '5 hours ago', icon: Briefcase },
        { id: 3, type: 'achievement', title: 'Earned Fast Learner Badge', time: '1 day ago', icon: Award },
        { id: 4, type: 'team', title: 'Joined Development Team', time: '2 days ago', icon: Users }
    ]);

    const [achievements] = useState([
        { id: 1, name: 'Task Master', description: 'Completed 100+ tasks', icon: Target, color: 'bg-blue-500' },
        { id: 2, name: 'Team Player', description: 'Excellent collaboration', icon: Users, color: 'bg-green-500' },
        { id: 3, name: 'Quick Learner', description: 'Rapid skill acquisition', icon: Zap, color: 'bg-purple-500' },
        { id: 4, name: 'Problem Solver', description: 'Creative solutions', icon: Heart, color: 'bg-red-500' }
    ]);

    useEffect(() => {
        if (user) {
            setFormData({
                name: user.name || '',
                email: user.email || '',
                phone: user.phone || '',
                location: user.location || '',
                bio: user.bio || '',
                skills: user.skills || [],
                availability: user.availability || { workingHoursPerDay: 8, timeZone: 'UTC' },
                preferences: user.preferences || { theme: darkMode ? 'dark' : 'light', language: 'en', notifications: true }
            });
            setProfileData(user);
            setLoading(false);
        }
    }, [user, darkMode]);

    // Apply dark mode to document
    useEffect(() => {
        if (darkMode) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    }, [darkMode]);

    const toggleDarkMode = () => {
        setDarkMode(!darkMode);
        setFormData({
            ...formData,
            preferences: {
                ...formData.preferences,
                theme: !darkMode ? 'dark' : 'light'
            }
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaveStatus('saving');
        
        try {
            const response = await api.put('/users/profile', formData);
            setProfileData(response.data);
            
            const currentUser = JSON.parse(localStorage.getItem('user'));
            const updatedUser = {
                ...response.data,
                token: currentUser.token
            };
            
            setUser(updatedUser);
            localStorage.setItem('user', JSON.stringify(updatedUser));
            
            setEditing(false);
            setSaveStatus('success');
            setTimeout(() => setSaveStatus(''), 3000);
        } catch (error) {
            console.error('Error updating profile:', error);
            setSaveStatus('error');
            setTimeout(() => setSaveStatus(''), 3000);
        }
    };

    const addSkill = () => {
        if (newSkill.trim() && !formData.skills.includes(newSkill.trim())) {
            setFormData({
                ...formData,
                skills: [...formData.skills, newSkill.trim()]
            });
            setNewSkill('');
        }
    };

    const removeSkill = (skillToRemove) => {
        setFormData({
            ...formData,
            skills: formData.skills.filter(skill => skill !== skillToRemove)
        });
    };

    const getRoleColor = (role) => {
        switch(role) {
            case 'Admin': return 'bg-purple-100 text-purple-700 border-purple-200';
            case 'Project Manager': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'Team Member': return 'bg-green-100 text-green-700 border-green-200';
            default: return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    const getSkillIcon = (skill) => {
        const skillLower = skill.toLowerCase();
        if (skillLower.includes('react') || skillLower.includes('vue') || skillLower.includes('angular')) return Code;
        if (skillLower.includes('design') || skillLower.includes('ui') || skillLower.includes('ux')) return Palette;
        if (skillLower.includes('team') || skillLower.includes('management')) return Users;
        if (skillLower.includes('security') || skillLower.includes('admin')) return Shield;
        return BookOpen;
    };

    // Image upload functions
    const handleImageClick = () => {
        fileInputRef.current?.click();
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Validate file type
            if (!file.type.startsWith('image/')) {
                setSaveStatus('error');
                setTimeout(() => {
                    setSaveStatus('');
                    alert('Please select an image file (JPG, PNG, GIF)');
                }, 3000);
                return;
            }

            // Validate file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                setSaveStatus('error');
                setTimeout(() => {
                    setSaveStatus('');
                    alert('File size must be less than 5MB');
                }, 3000);
                return;
            }

            setProfileImage(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result);
                setShowImageCropper(true);
            };
            reader.readAsDataURL(file);
        }
    };

    const uploadImage = async () => {
        if (!profileImage) return;

        setUploadingImage(true);
        setSaveStatus('saving');
        try {
            const formData = new FormData();
            formData.append('profileImage', profileImage);

            const response = await api.post('/users/upload-profile-image', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            // Update user data with new image URL
            const updatedUser = {
                ...profileData,
                profileImage: response.data.profileImage,
            };

            setProfileData(updatedUser);
            
            // Update global user state
            const currentUser = JSON.parse(localStorage.getItem('user'));
            const updatedUserWithToken = {
                ...updatedUser,
                token: currentUser.token
            };
            setUser(updatedUserWithToken);
            localStorage.setItem('user', JSON.stringify(updatedUserWithToken));

            setSaveStatus('success');
            setTimeout(() => setSaveStatus(''), 3000);
            setShowImageCropper(false);
            setImagePreview(null);
            setProfileImage(null);
        } catch (error) {
            console.error('Error uploading image:', error);
            setSaveStatus('error');
            setTimeout(() => setSaveStatus(''), 3000);
        } finally {
            setUploadingImage(false);
        }
    };

    const removeImage = async () => {
        try {
            await api.delete('/users/profile-image');
            
            const updatedUser = {
                ...profileData,
                profileImage: null,
            };

            setProfileData(updatedUser);
            setImagePreview(null);
            setProfileImage(null);
            
            // Update global user state
            const currentUser = JSON.parse(localStorage.getItem('user'));
            const updatedUserWithToken = {
                ...updatedUser,
                token: currentUser.token
            };
            setUser(updatedUserWithToken);
            localStorage.setItem('user', JSON.stringify(updatedUserWithToken));

            setSaveStatus('success');
            setTimeout(() => setSaveStatus(''), 3000);
        } catch (error) {
            console.error('Error removing image:', error);
            setSaveStatus('error');
            setTimeout(() => setSaveStatus(''), 3000);
        }
    };

    const cancelImageUpload = () => {
        setImagePreview(null);
        setProfileImage(null);
        setShowImageCropper(false);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    // Helper function to get full image URL
    const getImageUrl = (imagePath) => {
        if (!imagePath) return null;
        // If it's already a full URL, return as is
        if (imagePath.startsWith('http')) {
            return imagePath;
        }
        // Otherwise, construct the URL from the backend
        return `${api.defaults.baseURL?.replace('/api', '') || 'https://task-project-36nd.onrender.com'}/uploads/${imagePath.split('/').pop()}`;
    };

    if (loading) return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
            <div className="text-center">
                <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-600">Loading profile...</p>
            </div>
        </div>
    );

    return (
        <div className={`min-h-screen transition-colors duration-300 ${
            darkMode 
                ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900' 
                : 'bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50'
        }`}>
            {/* Background decoration */}
            <div className="absolute inset-0 overflow-hidden">
                <div className={`absolute -top-40 -right-40 w-80 h-80 rounded-full opacity-20 blur-3xl ${
                    darkMode 
                        ? 'bg-gradient-to-br from-blue-800 to-purple-800' 
                        : 'bg-gradient-to-br from-blue-200 to-purple-200'
                }`}></div>
                <div className={`absolute -bottom-40 -left-40 w-80 h-80 rounded-full opacity-20 blur-3xl ${
                    darkMode 
                        ? 'bg-gradient-to-br from-indigo-800 to-pink-800' 
                        : 'bg-gradient-to-br from-indigo-200 to-pink-200'
                }`}></div>
            </div>

            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className={`p-8 mb-8 rounded-3xl shadow-2xl border transition-colors duration-300 ${
                    darkMode 
                        ? 'bg-gray-800/90 backdrop-blur-xl border-gray-700' 
                        : 'bg-white/80 backdrop-blur-xl border-white/20'
                }`}>
                    <div className="flex flex-col lg:flex-row items-center lg:items-start space-y-6 lg:space-y-0 lg:space-x-8">
                        {/* Profile Avatar */}
                        <div className="relative group">
                            <div className={`w-32 h-32 rounded-2xl p-1 ${
                                darkMode 
                                    ? 'bg-gradient-to-br from-blue-700 to-purple-700' 
                                    : 'bg-gradient-to-br from-blue-600 to-purple-600'
                            }`}>
                                <div className={`w-full h-full rounded-2xl flex items-center justify-center overflow-hidden ${
                                    darkMode ? 'bg-gray-800' : 'bg-white'
                                }`}>
                                    {profileData?.profileImage || imagePreview ? (
                                        <img 
                                            src={imagePreview || getImageUrl(profileData?.profileImage)} 
                                            alt="Profile" 
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <User className={`w-16 h-16 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                                    )}
                                </div>
                            </div>
                            
                            {/* Upload/Remove buttons */}
                            <div className="absolute bottom-2 right-2 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={handleImageClick}
                                    className="w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-100 transition-colors"
                                    title="Upload photo"
                                >
                                    <Camera className="w-4 h-4 text-gray-600" />
                                </button>
                                {(profileData?.profileImage || imagePreview) && (
                                    <button
                                        onClick={imagePreview ? cancelImageUpload : removeImage}
                                        className="w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-red-50 transition-colors"
                                        title={imagePreview ? "Cancel upload" : "Remove photo"}
                                    >
                                        <X className="w-4 h-4 text-red-600" />
                                    </button>
                                )}
                            </div>
                            
                            {/* Hidden file input */}
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleImageChange}
                                className="hidden"
                            />
                        </div>

                        {/* Image Cropper Modal */}
                        {showImageCropper && imagePreview && (
                            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
                                <div className={`max-w-md w-full rounded-3xl shadow-2xl p-6 relative ${
                                    darkMode ? 'bg-gray-800' : 'bg-white'
                                }`}>
                                    <h3 className={`text-xl font-bold mb-4 ${
                                        darkMode ? 'text-white' : 'text-gray-900'
                                    }`}>
                                        Profile Photo Preview
                                    </h3>
                                    
                                    <div className="mb-6">
                                        <div className="w-48 h-48 mx-auto rounded-2xl overflow-hidden border-4 border-blue-500">
                                            <img 
                                                src={imagePreview} 
                                                alt="Profile preview" 
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                    </div>

                                    <div className={`text-sm mb-6 text-center ${
                                        darkMode ? 'text-gray-400' : 'text-gray-600'
                                    }`}>
                                        <p>Click "Upload" to set this as your profile photo</p>
                                        <p className="mt-1">Maximum file size: 5MB</p>
                                    </div>

                                    <div className="flex space-x-3">
                                        <button
                                            onClick={uploadImage}
                                            disabled={uploadingImage}
                                            className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {uploadingImage ? (
                                                <div className="flex items-center justify-center">
                                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                                    Uploading...
                                                </div>
                                            ) : (
                                                'Upload Photo'
                                            )}
                                        </button>
                                        <button
                                            onClick={cancelImageUpload}
                                            className={`flex-1 py-3 font-semibold rounded-xl transition-all duration-200 ${
                                                darkMode 
                                                    ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' 
                                                    : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                                            }`}
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Profile Info */}
                        <div className="flex-1 text-center lg:text-left">
                            <div className="flex flex-col sm:flex-row items-center lg:items-start space-y-4 sm:space-y-0 sm:space-x-4">
                                <div>
                                    <h1 className={`text-3xl font-bold ${
                                        darkMode ? 'text-white' : 'text-gray-900'
                                    }`}>{profileData?.name}</h1>
                                    <p className={`mt-1 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                        {profileData?.email}
                                    </p>
                                </div>
                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${
                                    darkMode 
                                        ? getRoleColor(profileData?.role).replace(/text-\w+-700/, 'text-gray-200').replace(/bg-\w+-100/, 'bg-gray-700').replace(/border-\w+-200/, 'border-gray-600')
                                        : getRoleColor(profileData?.role)
                                }`}>
                                    <Shield className="w-4 h-4 mr-1" />
                                    {profileData?.role}
                                </span>
                            </div>
                            
                            {profileData?.bio && (
                                <p className={`mt-4 max-w-2xl ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                    {profileData.bio}
                                </p>
                            )}

                            <div className={`flex flex-wrap items-center gap-4 mt-6 text-sm ${
                                darkMode ? 'text-gray-400' : 'text-gray-600'
                            }`}>
                                {profileData?.location && (
                                    <div className="flex items-center">
                                        <MapPin className="w-4 h-4 mr-1" />
                                        {profileData.location}
                                    </div>
                                )}
                                <div className="flex items-center">
                                    <Calendar className="w-4 h-4 mr-1" />
                                    Joined {new Date(profileData?.createdAt || Date.now()).toLocaleDateString()}
                                </div>
                                <div className="flex items-center">
                                    <Clock className="w-4 h-4 mr-1" />
                                    {formData.availability.workingHoursPerDay}h/day
                                </div>
                            </div>
                        </div>

                        {/* Edit Button */}
                        <div className="flex space-x-3">
                            {!editing ? (
                                <button
                                    onClick={() => setEditing(true)}
                                    className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg transition-all duration-200 transform hover:scale-[1.02]"
                                >
                                    <Edit3 className="w-4 h-4 mr-2" />
                                    Edit Profile
                                </button>
                            ) : (
                                <>
                                    <button
                                        onClick={handleSubmit}
                                        disabled={saveStatus === 'saving'}
                                        className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold rounded-xl shadow-lg transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50"
                                    >
                                        {saveStatus === 'saving' ? (
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                        ) : (
                                            <Save className="w-4 h-4 mr-2" />
                                        )}
                                        Save
                                    </button>
                                    <button
                                        onClick={() => setEditing(false)}
                                        className={`inline-flex items-center px-6 py-3 font-semibold rounded-xl transition-all duration-200 ${
                                            darkMode 
                                                ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' 
                                                : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                                        }`}
                                    >
                                        <X className="w-4 h-4 mr-2" />
                                        Cancel
                                    </button>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Save Status */}
                    {saveStatus && (
                        <div className={`mt-6 flex items-center p-4 rounded-xl ${
                            saveStatus === 'success' ? 'bg-green-50 text-green-700' :
                            saveStatus === 'error' ? 'bg-red-50 text-red-700' :
                            'bg-blue-50 text-blue-700'
                        }`}>
                            {saveStatus === 'success' && <Check className="w-5 h-5 mr-2" />}
                            {saveStatus === 'error' && <AlertCircle className="w-5 h-5 mr-2" />}
                            {saveStatus === 'saving' && <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />}
                            {saveStatus === 'success' && (
                                uploadingImage ? 'Profile photo updated successfully!' : 
                                'Profile updated successfully!'
                            )}
                            {saveStatus === 'error' && (
                                uploadingImage ? 'Failed to upload photo. Please try again.' : 
                                'Failed to update profile. Please try again.'
                            )}
                            {saveStatus === 'saving' && (
                                uploadingImage ? 'Uploading photo...' : 
                                'Saving changes...'
                            )}
                        </div>
                    )}
                </div>

                {/* Navigation Tabs */}
                <div className={`p-2 mb-8 rounded-2xl shadow-xl border transition-colors duration-300 ${
                    darkMode 
                        ? 'bg-gray-800/90 backdrop-blur-xl border-gray-700' 
                        : 'bg-white/80 backdrop-blur-xl border-white/20'
                }`}>
                    <nav className="flex space-x-1">
                        {[
                            { id: 'overview', label: 'Overview', icon: User },
                            { id: 'activity', label: 'Activity', icon: TrendingUp },
                            { id: 'achievements', label: 'Achievements', icon: Award },
                            { id: 'settings', label: 'Settings', icon: Settings }
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex-1 flex items-center justify-center py-3 px-4 rounded-xl font-medium text-sm transition-all duration-200 ${
                                    activeTab === tab.id
                                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                                        : darkMode 
                                            ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700'
                                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                                }`}
                            >
                                <tab.icon className="w-4 h-4 mr-2" />
                                {tab.label}
                            </button>
                        ))}
                    </nav>
                </div>

                {/* Tab Content */}
                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-8">
                        {activeTab === 'overview' && (
                            <>
                                {/* Edit Form */}
                                {editing && (
                                    <div className={`p-8 rounded-3xl shadow-2xl border transition-colors duration-300 ${
                                        darkMode 
                                            ? 'bg-gray-800/90 backdrop-blur-xl border-gray-700' 
                                            : 'bg-white/80 backdrop-blur-xl border-white/20'
                                    }`}>
                                        <h2 className={`text-2xl font-bold mb-6 ${
                                            darkMode ? 'text-white' : 'text-gray-900'
                                        }`}>Edit Profile</h2>
                                        <form onSubmit={handleSubmit} className="space-y-6">
                                            <div className="grid md:grid-cols-2 gap-6">
                                                <div>
                                                    <label className={`block text-sm font-semibold mb-2 ${
                                                        darkMode ? 'text-gray-200' : 'text-gray-900'
                                                    }`}>Full Name</label>
                                                    <input
                                                        type="text"
                                                        value={formData.name}
                                                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                                                        className={`block w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                                                            darkMode 
                                                                ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                                                                : 'border-gray-200'
                                                        }`}
                                                    />
                                                </div>
                                                <div>
                                                    <label className={`block text-sm font-semibold mb-2 ${
                                                        darkMode ? 'text-gray-200' : 'text-gray-900'
                                                    }`}>Email</label>
                                                    <input
                                                        type="email"
                                                        value={formData.email}
                                                        disabled
                                                        className={`block w-full px-4 py-3 border rounded-xl ${
                                                            darkMode 
                                                                ? 'bg-gray-700 border-gray-600 text-gray-500' 
                                                                : 'bg-gray-100 border-gray-200 text-gray-500'
                                                        }`}
                                                    />
                                                </div>
                                            </div>

                                            <div className="grid md:grid-cols-2 gap-6">
                                                <div>
                                                    <label className={`block text-sm font-semibold mb-2 ${
                                                        darkMode ? 'text-gray-200' : 'text-gray-900'
                                                    }`}>Phone</label>
                                                    <input
                                                        type="tel"
                                                        value={formData.phone}
                                                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                                                        placeholder="+1 (555) 123-4567"
                                                        className={`block w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                                                            darkMode 
                                                                ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                                                                : 'border-gray-200'
                                                        }`}
                                                    />
                                                </div>
                                                <div>
                                                    <label className={`block text-sm font-semibold mb-2 ${
                                                        darkMode ? 'text-gray-200' : 'text-gray-900'
                                                    }`}>Location</label>
                                                    <input
                                                        type="text"
                                                        value={formData.location}
                                                        onChange={(e) => setFormData({...formData, location: e.target.value})}
                                                        placeholder="San Francisco, CA"
                                                        className={`block w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                                                            darkMode 
                                                                ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                                                                : 'border-gray-200'
                                                        }`}
                                                    />
                                                </div>
                                            </div>

                                            <div>
                                                <label className={`block text-sm font-semibold mb-2 ${
                                                    darkMode ? 'text-gray-200' : 'text-gray-900'
                                                }`}>Bio</label>
                                                <textarea
                                                    value={formData.bio}
                                                    onChange={(e) => setFormData({...formData, bio: e.target.value})}
                                                    rows={3}
                                                    placeholder="Tell us about yourself..."
                                                    className={`block w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none ${
                                                        darkMode 
                                                            ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                                                            : 'border-gray-200'
                                                    }`}
                                                />
                                            </div>

                                            <div>
                                                <label className={`block text-sm font-semibold mb-2 ${
                                                    darkMode ? 'text-gray-200' : 'text-gray-900'
                                                }`}>Skills</label>
                                                <div className="space-y-3">
                                                    <div className="flex space-x-2">
                                                        <input
                                                            type="text"
                                                            value={newSkill}
                                                            onChange={(e) => setNewSkill(e.target.value)}
                                                            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                                                            placeholder="Add a skill..."
                                                            className={`flex-1 px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                                                                darkMode 
                                                                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                                                                    : 'border-gray-200'
                                                            }`}
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={addSkill}
                                                            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors"
                                                        >
                                                            Add
                                                        </button>
                                                    </div>
                                                    <div className="flex flex-wrap gap-2">
                                                        {formData.skills.map((skill, index) => {
                                                            const Icon = getSkillIcon(skill);
                                                            return (
                                                                <span key={index} className={`inline-flex items-center px-3 py-2 rounded-xl text-sm ${
                                                                    darkMode 
                                                                        ? 'bg-blue-900/50 text-blue-300 border-blue-700' 
                                                                        : 'bg-blue-50 text-blue-700 border-blue-200'
                                                                } border`}>
                                                                    <Icon className="w-4 h-4 mr-1" />
                                                                    {skill}
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => removeSkill(skill)}
                                                                        className={`ml-2 ${darkMode ? 'text-blue-400 hover:text-blue-200' : 'text-blue-500 hover:text-blue-700'}`}
                                                                    >
                                                                        <X className="w-3 h-3" />
                                                                    </button>
                                                                </span>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="grid md:grid-cols-2 gap-6">
                                                <div>
                                                    <label className={`block text-sm font-semibold mb-2 ${
                                                        darkMode ? 'text-gray-200' : 'text-gray-900'
                                                    }`}>Working Hours/Day</label>
                                                    <select
                                                        value={formData.availability.workingHoursPerDay}
                                                        onChange={(e) => setFormData({
                                                            ...formData, 
                                                            availability: {...formData.availability, workingHoursPerDay: parseInt(e.target.value)}
                                                        })}
                                                        className={`block w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                                                            darkMode 
                                                                ? 'bg-gray-700 border-gray-600 text-white' 
                                                                : 'border-gray-200'
                                                        }`}
                                                    >
                                                        {[4, 6, 8, 10, 12].map(hours => (
                                                            <option key={hours} value={hours}>{hours} hours</option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className={`block text-sm font-semibold mb-2 ${
                                                        darkMode ? 'text-gray-200' : 'text-gray-900'
                                                    }`}>Time Zone</label>
                                                    <select
                                                        value={formData.availability.timeZone}
                                                        onChange={(e) => setFormData({
                                                            ...formData, 
                                                            availability: {...formData.availability, timeZone: e.target.value}
                                                        })}
                                                        className={`block w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                                                            darkMode 
                                                                ? 'bg-gray-700 border-gray-600 text-white' 
                                                                : 'border-gray-200'
                                                        }`}
                                                    >
                                                        <option value="UTC">UTC</option>
                                                        <option value="EST">EST</option>
                                                        <option value="PST">PST</option>
                                                        <option value="GMT">GMT</option>
                                                        <option value="CET">CET</option>
                                                    </select>
                                                </div>
                                            </div>
                                        </form>
                                    </div>
                                )}

                                {/* Stats Grid */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                    {[
                                        { label: 'Tasks Completed', value: stats.tasksCompleted, icon: Check, color: 'from-blue-500 to-blue-600' },
                                        { label: 'Active Projects', value: stats.projectsActive, icon: Briefcase, color: 'from-green-500 to-green-600' },
                                        { label: 'Team Members', value: stats.teamMembers, icon: Users, color: 'from-purple-500 to-purple-600' },
                                        { label: 'Productivity', value: `${stats.productivity}%`, icon: TrendingUp, color: 'from-orange-500 to-orange-600' }
                                    ].map((stat, index) => (
                                        <div key={index} className={`p-6 rounded-2xl shadow-xl border transition-colors duration-300 ${
                                            darkMode 
                                                ? 'bg-gray-800/90 backdrop-blur-xl border-gray-700' 
                                                : 'bg-white/80 backdrop-blur-xl border-white/20'
                                        }`}>
                                            <div className={`w-12 h-12 bg-gradient-to-br ${stat.color} rounded-xl flex items-center justify-center mb-4`}>
                                                <stat.icon className="w-6 h-6 text-white" />
                                            </div>
                                            <div className={`text-2xl font-bold ${
                                                darkMode ? 'text-white' : 'text-gray-900'
                                            }`}>{stat.value}</div>
                                            <div className={`text-sm mt-1 ${
                                                darkMode ? 'text-gray-400' : 'text-gray-600'
                                            }`}>{stat.label}</div>
                                        </div>
                                    ))}
                                </div>

                                {/* Skills Section */}
                                {!editing && (
                                    <div className={`p-8 rounded-3xl shadow-2xl border transition-colors duration-300 ${
                                        darkMode 
                                            ? 'bg-gray-800/90 backdrop-blur-xl border-gray-700' 
                                            : 'bg-white/80 backdrop-blur-xl border-white/20'
                                    }`}>
                                        <h2 className={`text-2xl font-bold mb-6 ${
                                            darkMode ? 'text-white' : 'text-gray-900'
                                        }`}>Skills & Expertise</h2>
                                        {formData.skills.length > 0 ? (
                                            <div className="flex flex-wrap gap-3">
                                                {formData.skills.map((skill, index) => {
                                                    const Icon = getSkillIcon(skill);
                                                    return (
                                                        <div key={index} className={`inline-flex items-center px-4 py-2 rounded-xl border ${
                                                            darkMode 
                                                                ? 'bg-blue-900/30 border-blue-700' 
                                                                : 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200'
                                                        }`}>
                                                            <Icon className={`w-4 h-4 mr-2 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                                                            <span className={`text-sm font-medium ${darkMode ? 'text-blue-300' : 'text-blue-700'}`}>
                                                                {skill}
                                                            </span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        ) : (
                                            <p className={darkMode ? 'text-gray-500' : 'text-gray-500'}>
                                                No skills listed yet. Add some skills to showcase your expertise!
                                            </p>
                                        )}
                                    </div>
                                )}
                            </>
                        )}

                        {activeTab === 'activity' && (
                            <div className={`p-8 rounded-3xl shadow-2xl border transition-colors duration-300 ${
                                darkMode 
                                    ? 'bg-gray-800/90 backdrop-blur-xl border-gray-700' 
                                    : 'bg-white/80 backdrop-blur-xl border-white/20'
                            }`}>
                                <h2 className={`text-2xl font-bold mb-6 ${
                                    darkMode ? 'text-white' : 'text-gray-900'
                                }`}>Recent Activity</h2>
                                <div className="space-y-4">
                                    {recentActivity.map(activity => (
                                        <div key={activity.id} className={`flex items-center p-4 rounded-xl ${
                                            darkMode ? 'bg-gray-700' : 'bg-gray-50'
                                        }`}>
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-4 ${
                                                darkMode ? 'bg-blue-900' : 'bg-blue-100'
                                            }`}>
                                                <activity.icon className={`w-5 h-5 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                                            </div>
                                            <div className="flex-1">
                                                <p className={`font-medium ${
                                                    darkMode ? 'text-white' : 'text-gray-900'
                                                }`}>{activity.title}</p>
                                                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                                    {activity.time}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {activeTab === 'achievements' && (
                            <div className={`p-8 rounded-3xl shadow-2xl border transition-colors duration-300 ${
                                darkMode 
                                    ? 'bg-gray-800/90 backdrop-blur-xl border-gray-700' 
                                    : 'bg-white/80 backdrop-blur-xl border-white/20'
                            }`}>
                                <h2 className={`text-2xl font-bold mb-6 ${
                                    darkMode ? 'text-white' : 'text-gray-900'
                                }`}>Achievements</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {achievements.map(achievement => (
                                        <div key={achievement.id} className={`rounded-2xl p-6 ${
                                            darkMode ? 'bg-gray-700' : 'bg-gray-50'
                                        }`}>
                                            <div className={`w-12 h-12 ${achievement.color} rounded-xl flex items-center justify-center mb-4`}>
                                                <achievement.icon className="w-6 h-6 text-white" />
                                            </div>
                                            <h3 className={`font-semibold ${
                                                darkMode ? 'text-white' : 'text-gray-900'
                                            }`}>{achievement.name}</h3>
                                            <p className={`text-sm mt-1 ${
                                                darkMode ? 'text-gray-400' : 'text-gray-600'
                                            }`}>{achievement.description}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {activeTab === 'settings' && (
                            <div className={`p-8 rounded-3xl shadow-2xl border transition-colors duration-300 ${
                                darkMode 
                                    ? 'bg-gray-800/90 backdrop-blur-xl border-gray-700' 
                                    : 'bg-white/80 backdrop-blur-xl border-white/20'
                            }`}>
                                <h2 className={`text-2xl font-bold mb-6 ${
                                    darkMode ? 'text-white' : 'text-gray-900'
                                }`}>Preferences</h2>
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className={`font-medium ${
                                                darkMode ? 'text-white' : 'text-gray-900'
                                            }`}>Email Notifications</p>
                                            <p className={`text-sm ${
                                                darkMode ? 'text-gray-400' : 'text-gray-600'
                                            }`}>Receive email updates about your tasks</p>
                                        </div>
                                        <button 
                                            onClick={() => setEmailNotifications(!emailNotifications)}
                                            className={`w-12 h-6 rounded-full relative transition-colors ${
                                                emailNotifications ? 'bg-blue-600' : 'bg-gray-300'
                                            }`}
                                        >
                                            <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${
                                                emailNotifications ? 'translate-x-6' : 'translate-x-0.5'
                                            }`}></div>
                                        </button>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className={`font-medium ${
                                                darkMode ? 'text-white' : 'text-gray-900'
                                            }`}>Dark Mode</p>
                                            <p className={`text-sm ${
                                                darkMode ? 'text-gray-400' : 'text-gray-600'
                                            }`}>Use dark theme</p>
                                        </div>
                                        <button 
                                            onClick={toggleDarkMode}
                                            className={`w-12 h-6 rounded-full relative transition-colors ${
                                                darkMode ? 'bg-blue-600' : 'bg-gray-300'
                                            }`}
                                        >
                                            <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${
                                                darkMode ? 'translate-x-6' : 'translate-x-0.5'
                                            }`}></div>
                                        </button>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className={`font-medium ${
                                                darkMode ? 'text-white' : 'text-gray-900'
                                            }`}>Language</p>
                                            <p className={`text-sm ${
                                                darkMode ? 'text-gray-400' : 'text-gray-600'
                                            }`}>Choose your preferred language</p>
                                        </div>
                                        <select 
                                            value={language}
                                            onChange={(e) => setLanguage(e.target.value)}
                                            className={`px-4 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                                                darkMode 
                                                    ? 'bg-gray-700 border-gray-600 text-white' 
                                                    : 'border-gray-200'
                                            }`}
                                        >
                                            <option value="en">English</option>
                                            <option value="es">Spanish</option>
                                            <option value="fr">French</option>
                                            <option value="de">German</option>
                                            <option value="zh">Chinese</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-8">
                        {/* Quick Stats */}
                        <div className={`p-8 rounded-3xl shadow-2xl border transition-colors duration-300 ${
                            darkMode 
                                ? 'bg-gray-800/90 backdrop-blur-xl border-gray-700' 
                                : 'bg-white/80 backdrop-blur-xl border-white/20'
                        }`}>
                            <h3 className={`text-lg font-bold mb-6 ${
                                darkMode ? 'text-white' : 'text-gray-900'
                            }`}>Quick Stats</h3>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
                                        Profile Completion
                                    </span>
                                    <span className={`font-semibold ${
                                        darkMode ? 'text-white' : 'text-gray-900'
                                    }`}>85%</span>
                                </div>
                                <div className={`w-full rounded-full h-2 ${
                                    darkMode ? 'bg-gray-700' : 'bg-gray-200'
                                }`}>
                                    <div className="bg-gradient-to-r from-blue-600 to-purple-600 h-2 rounded-full" style={{width: '85%'}}></div>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
                                        Response Rate
                                    </span>
                                    <span className={`font-semibold ${
                                        darkMode ? 'text-white' : 'text-gray-900'
                                    }`}>92%</span>
                                </div>
                                <div className={`w-full rounded-full h-2 ${
                                    darkMode ? 'bg-gray-700' : 'bg-gray-200'
                                }`}>
                                    <div className="bg-gradient-to-r from-green-600 to-emerald-600 h-2 rounded-full" style={{width: '92%'}}></div>
                                </div>
                            </div>
                        </div>

                        {/* Team Members */}
                        <div className={`p-8 rounded-3xl shadow-2xl border transition-colors duration-300 ${
                            darkMode 
                                ? 'bg-gray-800/90 backdrop-blur-xl border-gray-700' 
                                : 'bg-white/80 backdrop-blur-xl border-white/20'
                        }`}>
                            <h3 className={`text-lg font-bold mb-6 ${
                                darkMode ? 'text-white' : 'text-gray-900'
                            }`}>Team Members</h3>
                            <div className="space-y-3">
                                {['Alice Johnson', 'Bob Smith', 'Carol White'].map((name, index) => (
                                    <div key={index} className="flex items-center space-x-3">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                            darkMode 
                                                ? 'bg-gradient-to-br from-blue-600 to-purple-600' 
                                                : 'bg-gradient-to-br from-blue-400 to-purple-400'
                                        }`}>
                                            <span className="text-white font-semibold">{name.charAt(0)}</span>
                                        </div>
                                        <div>
                                            <p className={`font-medium ${
                                                darkMode ? 'text-white' : 'text-gray-900'
                                            }`}>{name}</p>
                                            <p className={`text-sm ${
                                                darkMode ? 'text-gray-400' : 'text-gray-500'
                                            }`}>Online</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;
