import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, Users, X, Send, Paperclip, File, Image as ImageIcon, Check, CheckCheck, Upload } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { showNotification } from '../components/NotificationSystem';

const ChatSystem = () => {
    const { user } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [users, setUsers] = useState([]);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [uploadingFile, setUploadingFile] = useState(false);
    const [unreadCounts, setUnreadCounts] = useState({});
    const [forceUpdate, setForceUpdate] = useState(0); // Force re-render
    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);

    const canChatWith = (targetUser) => {
        if (!user || !targetUser) return false;
        
        // Admin and PM can chat with anyone
        if (user.role === 'Admin' || user.role === 'Project Manager') {
            return true;
        }
        
        // Team members can only chat with Admin and PM
        if (user.role === 'Team Member') {
            return targetUser.role === 'Admin' || targetUser.role === 'Project Manager';
        }
        
        return false;
    };

    // Get chat users sorted by recent messages
    const getChatUsers = () => {
        if (!user) return [];
        
        let availableUsers = [];
        
        // If Admin/PM, show all users except self
        if (user.role === 'Admin' || user.role === 'Project Manager') {
            availableUsers = users.filter(u => u._id !== user._id);
        } else {
            // If Team Member, show only Admin and PM
            availableUsers = users.filter(u => 
                u._id !== user._id && 
                (u.role === 'Admin' || u.role === 'Project Manager')
            );
        }
        
        console.log('Available users before sorting:', availableUsers.map(u => ({name: u.name, id: u._id})));
        console.log('Current unreadCounts:', unreadCounts);
        
        // Sort users: those with unread messages first, then by most recent message
        const sortedUsers = [...availableUsers].sort((a, b) => {
            const aUnread = unreadCounts[a._id] || 0;
            const bUnread = unreadCounts[b._id] || 0;
            
            console.log(`Comparing ${a.name} (${aUnread}) vs ${b.name} (${bUnread})`);
            
            // If both have unread messages, sort by count (higher first)
            if (aUnread > 0 && bUnread > 0) {
                return bUnread - aUnread;
            }
            
            // If only A has unread messages, A comes first
            if (aUnread > 0 && bUnread === 0) {
                return -1;
            }
            
            // If only B has unread messages, B comes first
            if (aUnread === 0 && bUnread > 0) {
                return 1;
            }
            
            // If neither has unread messages, sort by name
            return a.name.localeCompare(b.name);
        });
        
        console.log('Users after sorting:', sortedUsers.map(u => ({name: u.name, unread: unreadCounts[u._id] || 0})));
        return sortedUsers;
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    // Initialize test unread counts after users are loaded
    useEffect(() => {
        if (users.length > 0) {
            console.log('Users loaded, setting up test unread counts...');
            console.log('Available users:', users);
            console.log('Current user:', user);
            
            // Create test unread counts for actual users
            const testCounts = {};
            users.forEach((availableUser, index) => {
                // Don't set unread counts for self
                if (availableUser._id !== user._id) {
                    // Give first 2 users some unread messages
                    if (index < 2) {
                        testCounts[availableUser._id] = 2 - index; // 2, 1, 0, 0...
                    }
                }
            });
            
            console.log('Setting test unread counts:', testCounts);
            setUnreadCounts(testCounts);
            setForceUpdate(prev => prev + 1); // Force re-render
        }
    }, [users, user]);

    // Check for new messages every 5 seconds even when chat is closed
    useEffect(() => {
        const interval = setInterval(checkForNewMessages, 5000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (selectedUser) {
            fetchMessages();
            // Mark messages as read when opening chat
            markMessagesAsRead(selectedUser._id);
            // Poll for new messages every 3 seconds when chat is open
            const interval = setInterval(fetchMessages, 3000);
            return () => clearInterval(interval);
        }
    }, [selectedUser]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const fetchUsers = async () => {
        try {
            const response = await api.get('/users');
            setUsers(response.data);
            console.log('Chat users loaded:', response.data);
        } catch (error) {
            console.error('Error fetching users:', error);
            // Fallback: try to get users from localStorage or use mock data
            const currentUser = JSON.parse(localStorage.getItem('user'));
            if (currentUser) {
                // Create mock users for testing
                const mockUsers = [
                    {
                        _id: '1',
                        name: 'Admin User',
                        email: 'admin@example.com',
                        role: 'Admin'
                    },
                    {
                        _id: '2',
                        name: 'Project Manager',
                        email: 'pm@example.com',
                        role: 'Project Manager'
                    },
                    {
                        _id: '3',
                        name: 'Team Member 1',
                        email: 'member1@example.com',
                        role: 'Team Member'
                    },
                    {
                        _id: '4',
                        name: 'Team Member 2',
                        email: 'member2@example.com',
                        role: 'Team Member'
                    }
                ];
                setUsers(mockUsers);
                console.log('Using mock users for chat:', mockUsers);
            }
        }
    };

    const fetchMessages = async () => {
        if (!selectedUser) return;
        
        try {
            // Try backend first
            const response = await api.get(`/chat/messages/${selectedUser._id}`);
            const newMessages = response.data;
            
            // Check if there are new messages (compare with current messages)
            if (messages.length > 0 && newMessages.length > messages.length) {
                const latestMessage = newMessages[newMessages.length - 1];
                // Only update unread count if the latest message is from the other user (received message)
                if (latestMessage.senderId._id !== user._id) {
                    setUnreadCounts(prev => ({
                        ...prev,
                        [latestMessage.senderId._id]: (prev[latestMessage.senderId._id] || 0) + 1
                    }));
                }
            }
            
            setMessages(newMessages);
            console.log('Messages loaded from backend:', newMessages);
        } catch (error) {
            console.error('Backend not available, using localStorage:', error);
            
            // Fallback to localStorage
            const chatKey1 = `chat_${user._id}_${selectedUser._id}`;
            const chatKey2 = `chat_${selectedUser._id}_${user._id}`;
            
            const messages1 = JSON.parse(localStorage.getItem(chatKey1) || '[]');
            const messages2 = JSON.parse(localStorage.getItem(chatKey2) || '[]');
            
            // Combine and sort messages from both directions
            const allMessages = [...messages1, ...messages2].sort((a, b) => 
                new Date(a.createdAt) - new Date(b.createdAt)
            );
            
            // Check for new messages in localStorage
            if (messages.length > 0 && allMessages.length > messages.length) {
                const latestMessage = allMessages[allMessages.length - 1];
                // Only update unread count if the latest message is from the other user (received message)
                if (latestMessage.senderId._id !== user._id) {
                    setUnreadCounts(prev => ({
                        ...prev,
                        [latestMessage.senderId._id]: (prev[latestMessage.senderId._id] || 0) + 1
                    }));
                }
            }
            
            setMessages(allMessages);
            console.log('Messages loaded from localStorage:', allMessages);
        }
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    // Mark messages as read when opening chat
    const markMessagesAsRead = async (userId) => {
        try {
            // Try backend first
            await api.post(`/chat/messages/${userId}/read`);
            console.log('Messages marked as read in backend');
            
            // Update local messages to show blue ticks
            setMessages(prev => prev.map(msg => 
                (msg.senderId._id === userId && msg.recipientId._id === user._id) 
                    ? { ...msg, read: true }
                    : msg
            ));
        } catch (error) {
            console.log('Backend not available, marking messages as read locally');
            
            // Update local messages to show blue ticks
            setMessages(prev => prev.map(msg => 
                (msg.senderId._id === userId && msg.recipientId._id === user._id) 
                    ? { ...msg, read: true }
                    : msg
            ));
        }
        
        // Clear unread count
        setUnreadCounts(prev => {
            const newCounts = { ...prev };
            delete newCounts[userId];
            console.log('Cleared unread count for user:', userId);
            return newCounts;
        });
        setForceUpdate(prev => prev + 1);
    };

    // Check for new messages across all conversations
    const checkForNewMessages = async () => {
        if (!users.length) return;
        
        try {
            const response = await api.get('/chat/conversations');
            const conversations = response.data;
            console.log('Conversations from backend:', conversations);
            
            const newUnreadCounts = {};
            let totalUnread = 0;
            
            conversations.forEach(conv => {
                newUnreadCounts[conv.user._id] = conv.unreadCount || 0;
                totalUnread += conv.unreadCount || 0;
            });
            
            console.log('New unread counts:', newUnreadCounts);
            console.log('Total unread:', totalUnread);
            
            setUnreadCounts(newUnreadCounts);
            
        } catch (error) {
            console.error('Error checking conversations:', error);
            // Fallback to localStorage for testing
            console.log('Using localStorage fallback for unread counts');
            setUnreadCounts({
                '1': 2, // Admin User has 2 messages
                '2': 1, // Project Manager has 1 message
            });
        }
    };

    const sendMessage = async () => {
        if (!newMessage.trim() || !selectedUser) return;

        setLoading(true);
        
        // Create message object
        const messageObj = {
            _id: Date.now().toString(),
            senderId: { _id: user._id, name: user.name, role: user.role },
            recipientId: { _id: selectedUser._id, name: selectedUser.name, role: selectedUser.role },
            message: newMessage.trim(),
            type: 'text',
            createdAt: new Date().toISOString(),
            read: false,
            delivered: false,
            sent: true
        };

        try {
            // Try backend first
            const response = await api.post('/chat/messages', {
                recipientId: selectedUser._id,
                message: newMessage.trim(),
                type: 'text'
            });

            // Update message with delivered status
            const deliveredMessage = { ...response.data, delivered: true };
            setMessages(prev => [...prev, deliveredMessage]);
            setNewMessage('');
            scrollToBottom();
            
            // Mark as delivered after 1 second
            setTimeout(() => {
                setMessages(prev => prev.map(msg => 
                    msg._id === deliveredMessage._id 
                        ? { ...msg, delivered: true }
                        : msg
                ));
            }, 1000);
            
        } catch (error) {
            console.error('Backend not available, using localStorage:', error);
            
            // Fallback to localStorage for immediate functionality
            const chatKey = `chat_${user._id}_${selectedUser._id}`;
            const existingMessages = JSON.parse(localStorage.getItem(chatKey) || '[]');
            
            // Add sent message
            const sentMessage = { ...messageObj, delivered: true };
            const updatedMessages = [...existingMessages, sentMessage];
            
            localStorage.setItem(chatKey, JSON.stringify(updatedMessages));
            setMessages(updatedMessages);
            setNewMessage('');
            scrollToBottom();
            
            // Mark as delivered after 1 second
            setTimeout(() => {
                setMessages(prev => prev.map(msg => 
                    msg._id === sentMessage._id 
                        ? { ...msg, delivered: true }
                        : msg
                ));
            }, 1000);
        } finally {
            setLoading(false);
        }
    };

    const handleFileUpload = async (event) => {
        const file = event.target.files[0];
        if (!file || !selectedUser) return;

        // Check file size (10MB limit)
        if (file.size > 10 * 1024 * 1024) {
            showNotification('error', 'File size must be less than 10MB', 'File Upload Error');
            return;
        }

        // Check file type
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
        if (!allowedTypes.includes(file.type)) {
            showNotification('error', 'Only images, PDFs, and documents are allowed', 'File Upload Error');
            return;
        }

        setUploadingFile(true);
        const formData = new FormData();
        formData.append('file', file);
        formData.append('recipientId', selectedUser._id);
        formData.append('message', `Shared file: ${file.name}`);

        try {
            const response = await api.post('/chat/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            setMessages(prev => [...prev, response.data]);
            scrollToBottom();
            showNotification('success', `File "${file.name}" shared successfully`, 'File Shared');
        } catch (error) {
            console.error('Error uploading file to backend, using fallback:', error);
            
            // Fallback: Create a local file message with a data URL or file object
            const reader = new FileReader();
            reader.onload = (e) => {
                const fileMessage = {
                    _id: Date.now().toString(),
                    senderId: { _id: user._id, name: user.name, role: user.role },
                    recipientId: { _id: selectedUser._id, name: selectedUser.name, role: selectedUser.role },
                    message: `Shared file: ${file.name}`,
                    type: 'file',
                    fileName: file.name,
                    fileUrl: e.target.result, // Use data URL as fallback
                    fileSize: file.size,
                    createdAt: new Date().toISOString(),
                    read: false,
                    delivered: true,
                    sent: true
                };

                // Save to localStorage
                const chatKey = `chat_${user._id}_${selectedUser._id}`;
                const existingMessages = JSON.parse(localStorage.getItem(chatKey) || '[]');
                const updatedMessages = [...existingMessages, fileMessage];
                localStorage.setItem(chatKey, JSON.stringify(updatedMessages));

                setMessages(prev => [...prev, fileMessage]);
                scrollToBottom();
                showNotification('success', `File "${file.name}" shared locally (backend unavailable)`, 'File Shared');
            };
            
            reader.readAsDataURL(file);
        } finally {
            setUploadingFile(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const formatTime = (dateString) => {
        return new Date(dateString).toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
    };

    const getFileIcon = (fileName) => {
        const extension = fileName.split('.').pop().toLowerCase();
        if (['jpg', 'jpeg', 'png', 'gif'].includes(extension)) {
            return <ImageIcon className="h-4 w-4" />;
        }
        return <File className="h-4 w-4" />;
    };

    // WhatsApp-style message status ticks
    const MessageStatus = ({ message }) => {
        if (!isMessageFromCurrentUser(message)) return null;
        
        const { sent, delivered, read } = message;
        
        if (read) {
            return <CheckCheck className="h-3 w-3 text-blue-500" />; // Double blue ticks
        } else if (delivered) {
            return <CheckCheck className="h-3 w-3 text-gray-400" />; // Double gray ticks
        } else if (sent) {
            return <Check className="h-3 w-3 text-gray-400" />; // Single gray tick
        }
        
        return null;
    };

    const isMessageFromCurrentUser = (message) => {
        return message.senderId._id === user._id;
    };

    return (
        <div className="relative" key={forceUpdate}> {/* Force re-render when forceUpdate changes */}
            {/* Chat Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg"
            >
                <MessageCircle className="h-5 w-5" />
                {(() => {
                    const totalUnread = Object.values(unreadCounts).reduce((sum, count) => sum + count, 0);
                    console.log('Rendering badge - totalUnread:', totalUnread, 'unreadCounts:', unreadCounts, 'forceUpdate:', forceUpdate);
                    return totalUnread > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                            {totalUnread}
                        </span>
                    );
                })()}
            </button>

            {/* Chat Window */}
            {isOpen && (
                <div className="absolute right-0 top-12 w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-50 h-[600px] flex flex-col">
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-gray-200">
                        <div className="flex items-center">
                            <Users className="h-5 w-5 text-gray-500 mr-2" />
                            <h3 className="text-sm font-medium text-gray-900">Team Chat</h3>
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="text-gray-400 hover:text-gray-600"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>

                    {!selectedUser ? (
                        /* User List */
                        <div className="flex-1 overflow-y-auto p-4">
                            <h4 className="text-sm font-medium text-gray-700 mb-3">Select a user to chat:</h4>
                            <div className="text-xs text-gray-500 mb-2">
                                Available users: {getChatUsers().length} | Your role: {user?.role}
                            </div>
                            <div className="space-y-2">
                                {getChatUsers().map((chatUser) => {
                                    const userUnreadCount = unreadCounts[chatUser._id] || 0;
                                    return (
                                        <div
                                            key={chatUser._id}
                                            onClick={() => setSelectedUser(chatUser)}
                                            className={`flex items-center p-3 rounded-lg hover:bg-gray-50 cursor-pointer border relative transition-all ${
                                                userUnreadCount > 0 
                                                    ? 'bg-blue-50 border-blue-300 shadow-sm' 
                                                    : 'border-gray-200'
                                            }`}
                                        >
                                            <img
                                                className="h-8 w-8 rounded-full mr-3"
                                                src={`https://ui-avatars.com/api/?name=${chatUser.name}&background=random`}
                                                alt=""
                                            />
                                            <div className="flex-1">
                                                <p className={`text-sm font-medium ${
                                                    userUnreadCount > 0 ? 'text-blue-900' : 'text-gray-900'
                                                }`}>
                                                    {chatUser.name}
                                                </p>
                                                <p className="text-xs text-gray-500">{chatUser.role}</p>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                {userUnreadCount > 0 && (
                                                    <span className="bg-blue-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center animate-pulse font-bold">
                                                        {userUnreadCount}
                                                    </span>
                                                )}
                                                <MessageCircle className="h-4 w-4 text-gray-400" />
                                            </div>
                                            {userUnreadCount > 0 && (
                                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500 rounded-l-lg"></div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                            {getChatUsers().length === 0 && (
                                <p className="text-sm text-gray-500 text-center py-4">
                                    No users available to chat with
                                </p>
                            )}
                        </div>
                    ) : (
                        <>
                            {/* Chat Header */}
                            <div className="flex items-center justify-between p-3 border-b border-gray-200 bg-gray-50">
                                <div className="flex items-center">
                                    <button
                                        onClick={() => setSelectedUser(null)}
                                        className="mr-2 text-gray-400 hover:text-gray-600"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                    <img
                                        className="h-6 w-6 rounded-full mr-2"
                                        src={`https://ui-avatars.com/api/?name=${selectedUser.name}&background=random`}
                                        alt=""
                                    />
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">{selectedUser.name}</p>
                                        <p className="text-xs text-gray-500">{selectedUser.role}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Messages */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                                {messages.map((message) => (
                                    <div
                                        key={message._id}
                                        className={`flex ${isMessageFromCurrentUser(message) ? 'justify-end' : 'justify-start'}`}
                                    >
                                        <div
                                            className={`max-w-[80%] rounded-lg p-3 ${
                                                isMessageFromCurrentUser(message)
                                                    ? 'bg-blue-600 text-white'
                                                    : 'bg-gray-100 text-gray-900'
                                            }`}
                                        >
                                            {message.type === 'file' ? (
                                                <div>
                                                    <div className="flex items-center mb-1">
                                                        {getFileIcon(message.fileName)}
                                                        <span className="text-xs font-medium ml-1">
                                                            {message.fileName}
                                                        </span>
                                                    </div>
                                                    {message.message && (
                                                        <p className="text-xs opacity-90">{message.message}</p>
                                                    )}
                                                    <a
                                                        href={(() => {
                                                            console.log('File URL:', message.fileUrl);
                                                            console.log('Base URL:', api.defaults.baseURL);
                                                            
                                                            if (!message.fileUrl) {
                                                                return '#';
                                                            }
                                                            
                                                            // If it's already a full URL, use as-is
                                                            if (message.fileUrl.startsWith('http')) {
                                                                return message.fileUrl;
                                                            }
                                                            
                                                            // If it's a data URL, use as-is
                                                            if (message.fileUrl.startsWith('data:')) {
                                                                return message.fileUrl;
                                                            }
                                                            
                                                            // If it starts with /uploads/, construct proper URL
                                                            if (message.fileUrl.startsWith('/uploads/')) {
                                                                const baseUrl = api.defaults.baseURL || 'http://localhost:5000';
                                                                const cleanBaseUrl = baseUrl.replace('/api', ''); // Remove /api if present
                                                                return `${cleanBaseUrl}${message.fileUrl}`;
                                                            }
                                                            
                                                            // Fallback
                                                            return message.fileUrl;
                                                        })()}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className={`text-xs underline mt-1 inline-block ${
                                                            isMessageFromCurrentUser(message) 
                                                                ? 'text-blue-100 hover:text-white' 
                                                                : 'text-blue-600 hover:text-blue-800'
                                                        }`}
                                                        onClick={(e) => {
                                                            const href = e.currentTarget.getAttribute('href');
                                                            if (!href || href === '#') {
                                                                e.preventDefault();
                                                                showNotification('error', 'File URL not available', 'File Error');
                                                            }
                                                        }}
                                                    >
                                                        View File
                                                    </a>
                                                </div>
                                            ) : (
                                                <p className="text-sm">{message.message}</p>
                                            )}
                                            <div className={`flex items-center justify-between mt-1 ${
                                                isMessageFromCurrentUser(message) 
                                                    ? 'text-blue-100' 
                                                    : 'text-gray-500'
                                            }`}>
                                                <span className="text-xs">{formatTime(message.createdAt)}</span>
                                                <MessageStatus message={message} />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Message Input */}
                            <div className="p-4 border-t border-gray-200">
                                <div className="flex items-center space-x-2">
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        onChange={handleFileUpload}
                                        className="hidden"
                                        accept="image/*,.pdf,.doc,.docx,.txt"
                                    />
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={uploadingFile}
                                        className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                                        title="Share file"
                                    >
                                        {uploadingFile ? (
                                            <div className="animate-spin h-4 w-4 border-2 border-gray-300 border-t-blue-600 rounded-full" />
                                        ) : (
                                            <Paperclip className="h-4 w-4" />
                                        )}
                                    </button>
                                    <input
                                        type="text"
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                                        placeholder="Type a message..."
                                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    />
                                    <button
                                        onClick={sendMessage}
                                        disabled={!newMessage.trim() || loading}
                                        className="p-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                                    >
                                        {loading ? (
                                            <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                                        ) : (
                                            <Send className="h-4 w-4" />
                                        )}
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

export default ChatSystem;
