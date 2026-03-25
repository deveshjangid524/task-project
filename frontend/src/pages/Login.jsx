import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogIn, UserPlus, Key, Mail, User, Phone, Eye, EyeOff, Shield, Sparkles } from 'lucide-react';

const Login = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [isResetPassword, setIsResetPassword] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        username: '',
        password: '',
        confirmPassword: '',
        role: 'Team Member',
        loginIdentifier: '', // For login with email/phone/username
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [resetMessage, setResetMessage] = useState('');

    const { login, register } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setResetMessage('');
        setLoading(true);

        if (isResetPassword) {
            // Handle password reset
            try {
                // Mock reset password - in real app, this would call an API
                await new Promise(resolve => setTimeout(resolve, 1000));
                setResetMessage('Password reset link has been sent to your email!');
                setLoading(false);
                setTimeout(() => {
                    setIsResetPassword(false);
                    setResetMessage('');
                }, 3000);
            } catch (error) {
                setError('Failed to send reset link. Please try again.');
                setLoading(false);
            }
        } else if (isLogin) {
            // Handle multi-field login
            const result = await login(formData.loginIdentifier, formData.password);
            if (result.success) {
                navigate('/dashboard');
            } else {
                setError(result.message);
                setLoading(false);
            }
        } else {
            // Handle registration
            if (formData.password !== formData.confirmPassword) {
                setError('Passwords do not match');
                setLoading(false);
                return;
            }

            // eslint-disable-next-unused-vars
            const { confirmPassword, loginIdentifier, ...registerData } = formData;
            const result = await register(registerData);

            if (result.success) {
                navigate('/dashboard');
            } else {
                setError(result.message);
                setLoading(false);
            }
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
            {/* Background decoration */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-200 to-purple-200 rounded-full opacity-20 blur-3xl"></div>
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-indigo-200 to-pink-200 rounded-full opacity-20 blur-3xl"></div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-purple-200 to-blue-200 rounded-full opacity-10 blur-3xl"></div>
            </div>

            <div className="relative w-full max-w-6xl mx-auto">
                <div className="grid md:grid-cols-2 gap-8 items-center">
                    
                    {/* Left side - Welcome content */}
                    <div className="hidden md:block text-center lg:text-left space-y-6 p-8">
                        <div className="flex items-center justify-center lg:justify-start space-x-3">
                            <div className="p-3 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl shadow-lg">
                                <Shield className="h-8 w-8 text-white" />
                            </div>
                            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                TaskFlow AI
                            </h1>
                        </div>
                        
                        <div className="space-y-4">
                            <h2 className="text-4xl font-bold text-gray-900 leading-tight">
                                Welcome to Your
                                <span className="block bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                    Productivity Hub
                                </span>
                            </h2>
                            
                            <p className="text-lg text-gray-600 leading-relaxed">
                                Streamline your workflow, collaborate with your team, and achieve more with our powerful task management platform.
                            </p>
                        </div>

                        <div className="grid grid-cols-3 gap-4 pt-6">
                            <div className="text-center p-4 bg-white/60 backdrop-blur-sm rounded-2xl border border-white/20">
                                <div className="text-2xl font-bold text-blue-600">10K+</div>
                                <div className="text-sm text-gray-600">Active Users</div>
                            </div>
                            <div className="text-center p-4 bg-white/60 backdrop-blur-sm rounded-2xl border border-white/20">
                                <div className="text-2xl font-bold text-purple-600">99.9%</div>
                                <div className="text-sm text-gray-600">Uptime</div>
                            </div>
                            <div className="text-center p-4 bg-white/60 backdrop-blur-sm rounded-2xl border border-white/20">
                                <div className="text-2xl font-bold text-indigo-600">24/7</div>
                                <div className="text-sm text-gray-600">Support</div>
                            </div>
                        </div>

                        <div className="flex items-center justify-center lg:justify-start space-x-4 pt-6">
                            <div className="flex -space-x-2">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 border-2 border-white"></div>
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 border-2 border-white"></div>
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-indigo-600 border-2 border-white"></div>
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-400 to-pink-600 border-2 border-white flex items-center justify-center">
                                    <span className="text-xs text-white font-bold">+5</span>
                                </div>
                            </div>
                            <p className="text-sm text-gray-600">
                                Join thousands of productive teams
                            </p>
                        </div>
                    </div>

                    {/* Right side - Login/Register form */}
                    <div className="w-full max-w-md mx-auto">
                        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8 space-y-6">
                            
                            {/* Header */}
                            <div className="text-center space-y-4">
                                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl shadow-lg">
                                    {isResetPassword ? (
                                        <Key className="h-8 w-8 text-white" />
                                    ) : isLogin ? (
                                        <LogIn className="h-8 w-8 text-white" />
                                    ) : (
                                        <UserPlus className="h-8 w-8 text-white" />
                                    )}
                                </div>
                                
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900">
                                        {isResetPassword ? (
                                            'Reset your password'
                                        ) : isLogin ? (
                                            'Welcome back'
                                        ) : (
                                            'Create your account'
                                        )}
                                    </h2>
                                    <p className="text-gray-600 mt-2">
                                        {isResetPassword ? (
                                            'Enter your email to receive a reset link'
                                        ) : isLogin ? (
                                            'Sign in to continue to your workspace'
                                        ) : (
                                            'Start your journey to better productivity'
                                        )}
                                    </p>
                                </div>
                            </div>

                            {/* Toggle buttons */}
                            {!isResetPassword && (
                                <div className="flex bg-gray-100 rounded-xl p-1">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setIsLogin(true);
                                            setError('');
                                            setResetMessage('');
                                        }}
                                        className={`flex-1 py-2 px-4 rounded-lg font-medium text-sm transition-all duration-200 ${
                                            isLogin
                                                ? 'bg-white text-blue-600 shadow-sm'
                                                : 'text-gray-600 hover:text-gray-900'
                                        }`}
                                    >
                                        Sign In
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setIsLogin(false);
                                            setError('');
                                            setResetMessage('');
                                        }}
                                        className={`flex-1 py-2 px-4 rounded-lg font-medium text-sm transition-all duration-200 ${
                                            !isLogin
                                                ? 'bg-white text-blue-600 shadow-sm'
                                                : 'text-gray-600 hover:text-gray-900'
                                        }`}
                                    >
                                        Register
                                    </button>
                                </div>
                            )}

                            {/* Error/Success messages */}
                            {error && (
                                <div className="flex items-center p-4 bg-red-50 border border-red-200 rounded-xl">
                                    <div className="flex-shrink-0">
                                        <div className="w-5 h-5 bg-red-100 rounded-full flex items-center justify-center">
                                            <span className="text-red-600 text-xs">!</span>
                                        </div>
                                    </div>
                                    <div className="ml-3">
                                        <p className="text-sm text-red-700">{error}</p>
                                    </div>
                                </div>
                            )}
                            
                            {resetMessage && (
                                <div className="flex items-center p-4 bg-green-50 border border-green-200 rounded-xl">
                                    <div className="flex-shrink-0">
                                        <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center">
                                            <span className="text-green-600 text-xs">✓</span>
                                        </div>
                                    </div>
                                    <div className="ml-3">
                                        <p className="text-sm text-green-700">{resetMessage}</p>
                                    </div>
                                </div>
                            )}

                            {/* Form */}
                            <form className="space-y-5" onSubmit={handleSubmit}>
                                {isResetPassword ? (
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-900 mb-2">
                                            Email address
                                        </label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <Mail className="h-5 w-5 text-gray-400" />
                                            </div>
                                            <input
                                                name="email"
                                                type="email"
                                                autoComplete="email"
                                                required
                                                value={formData.email}
                                                onChange={handleChange}
                                                placeholder="Enter your email address"
                                                className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-400 transition-all"
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        {!isLogin && (
                                            <>
                                                <div>
                                                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                                                        Full Name
                                                    </label>
                                                    <div className="relative">
                                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                            <User className="h-5 w-5 text-gray-400" />
                                                        </div>
                                                        <input
                                                            name="name"
                                                            type="text"
                                                            required={!isLogin}
                                                            value={formData.name}
                                                            onChange={handleChange}
                                                            placeholder="Enter your full name"
                                                            className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-400 transition-all"
                                                        />
                                                    </div>
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                                                        Username
                                                    </label>
                                                    <div className="relative">
                                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                            <User className="h-5 w-5 text-gray-400" />
                                                        </div>
                                                        <input
                                                            name="username"
                                                            type="text"
                                                            required={!isLogin}
                                                            value={formData.username}
                                                            onChange={handleChange}
                                                            placeholder="Choose a unique username"
                                                            className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-400 transition-all"
                                                        />
                                                    </div>
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                                                        Phone Number (optional)
                                                    </label>
                                                    <div className="relative">
                                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                            <Phone className="h-5 w-5 text-gray-400" />
                                                        </div>
                                                        <input
                                                            name="phone"
                                                            type="tel"
                                                            value={formData.phone}
                                                            onChange={handleChange}
                                                            placeholder="+1 (555) 123-4567"
                                                            className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-400 transition-all"
                                                        />
                                                    </div>
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                                                        Role
                                                    </label>
                                                    <div className="relative">
                                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                            <Shield className="h-5 w-5 text-gray-400" />
                                                        </div>
                                                        <select
                                                            name="role"
                                                            value={formData.role}
                                                            onChange={handleChange}
                                                            className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white"
                                                        >
                                                            <option value="Team Member">Team Member</option>
                                                            <option value="Project Manager">Project Manager</option>
                                                            <option value="Admin">Admin</option>
                                                        </select>
                                                    </div>
                                                </div>
                                            </>
                                        )}

                                        {!isLogin && (
                                            <div>
                                                <label className="block text-sm font-semibold text-gray-900 mb-2">
                                                    Email address
                                                </label>
                                                <div className="relative">
                                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                        <Mail className="h-5 w-5 text-gray-400" />
                                                    </div>
                                                    <input
                                                        name="email"
                                                        type="email"
                                                        autoComplete="email"
                                                        required={!isLogin}
                                                        value={formData.email}
                                                        onChange={handleChange}
                                                        placeholder="Enter your email address"
                                                        className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-400 transition-all"
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        {isLogin && (
                                            <div>
                                                <label className="block text-sm font-semibold text-gray-900 mb-2">
                                                    Email, Username, or Phone
                                                </label>
                                                <div className="relative">
                                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                        <User className="h-5 w-5 text-gray-400" />
                                                    </div>
                                                    <input
                                                        name="loginIdentifier"
                                                        type="text"
                                                        autoComplete="username"
                                                        required
                                                        value={formData.loginIdentifier}
                                                        onChange={handleChange}
                                                        placeholder="Enter email, username, or phone"
                                                        className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-400 transition-all"
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </>
                                )}

                                <div>
                                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                                        Password
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <Key className="h-5 w-5 text-gray-400" />
                                        </div>
                                        <input
                                            name="password"
                                            type={showPassword ? "text" : "password"}
                                            autoComplete={isLogin ? "current-password" : "new-password"}
                                            required
                                            value={formData.password}
                                            onChange={handleChange}
                                            placeholder="Enter your password"
                                            className="block w-full pl-10 pr-10 py-3 border border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-400 transition-all"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                        >
                                            {showPassword ? (
                                                <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                                            ) : (
                                                <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                                            )}
                                        </button>
                                    </div>
                                </div>

                                {!isLogin && (
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-900 mb-2">
                                            Confirm Password
                                        </label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <Key className="h-5 w-5 text-gray-400" />
                                            </div>
                                            <input
                                                name="confirmPassword"
                                                type={showConfirmPassword ? "text" : "password"}
                                                autoComplete="new-password"
                                                required={!isLogin}
                                                value={formData.confirmPassword}
                                                onChange={handleChange}
                                                placeholder="Confirm your password"
                                                className="block w-full pl-10 pr-10 py-3 border border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-400 transition-all"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                            >
                                                {showConfirmPassword ? (
                                                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                                                ) : (
                                                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                )}

                                <div>
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full flex items-center justify-center py-3 px-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02]"
                                    >
                                        {loading ? (
                                            <div className="flex items-center space-x-2">
                                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                <span>
                                                    {isResetPassword ? 'Sending reset link...' : 
                                                     isLogin ? 'Signing in...' : 'Creating account...'}
                                                </span>
                                            </div>
                                        ) : (
                                            <div className="flex items-center space-x-2">
                                                <Sparkles className="h-5 w-5" />
                                                <span>
                                                    {isResetPassword ? 'Send Reset Link' : 
                                                     isLogin ? 'Sign In' : 'Create Account'}
                                                </span>
                                            </div>
                                        )}
                                    </button>
                                </div>
                            </form>

                            {/* Footer links */}
                            <div className="text-center space-y-4">
                                {!isResetPassword && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setIsResetPassword(true);
                                            setError('');
                                            setResetMessage('');
                                        }}
                                        className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
                                    >
                                        Forgot your password?
                                    </button>
                                )}
                                
                                {isResetPassword && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setIsResetPassword(false);
                                            setError('');
                                            setResetMessage('');
                                        }}
                                        className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
                                    >
                                        Back to sign in
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
