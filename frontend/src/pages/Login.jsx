import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogIn, UserPlus, Key, Mail, User, Phone } from 'lucide-react';

const Login = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [isResetPassword, setIsResetPassword] = useState(false);
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
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="flex justify-center">
                    <div className="rounded-full bg-primary-100 p-3">
                        {isResetPassword ? <Key className="h-8 w-8 text-primary-600" : 
                         isLogin ? <LogIn className="h-8 w-8 text-primary-600" : 
                         <UserPlus className="h-8 w-8 text-primary-600" />}
                    </div>
                </div>
                <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                    {isResetPassword ? 'Reset your password' : 
                     isLogin ? 'Sign in to your account' : 'Create an account'}
                </h2>
                <p className="mt-2 text-center text-sm text-gray-600">
                    {isResetPassword ? (
                        <>
                            Or{' '}
                            <button
                                type="button"
                                onClick={() => {
                                    setIsResetPassword(false);
                                    setError('');
                                    setResetMessage('');
                                }}
                                className="font-medium text-primary-600 hover:text-primary-500 bg-transparent border-none cursor-pointer"
                            >
                                back to sign in
                            </button>
                        </>
                    ) : (
                        <>
                            Or{' '}
                            <button
                                type="button"
                                onClick={() => {
                                    if (isLogin) {
                                        setIsResetPassword(true);
                                    } else {
                                        setIsLogin(!isLogin);
                                    }
                                    setError('');
                                    setResetMessage('');
                                }}
                                className="font-medium text-primary-600 hover:text-primary-500 bg-transparent border-none cursor-pointer"
                            >
                                {isLogin ? 'reset password' : 'sign in to your existing account'}
                            </button>
                        </>
                    )}
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-gray-100">
                    {error && (
                        <div className="mb-4 bg-red-50 border-l-4 border-red-400 p-4">
                            <div className="flex">
                                <div className="ml-3">
                                    <p className="text-sm text-red-700">{error}</p>
                                </div>
                            </div>
                        </div>
                    )}
                    {resetMessage && (
                        <div className="mb-4 bg-green-50 border-l-4 border-green-400 p-4">
                            <div className="flex">
                                <div className="ml-3">
                                    <p className="text-sm text-green-700">{resetMessage}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    <form className="space-y-6" onSubmit={handleSubmit}>
                        {isResetPassword ? (
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                                    Email address
                                </label>
                                <div className="mt-1">
                                    <input
                                        id="email"
                                        name="email"
                                        type="email"
                                        autoComplete="email"
                                        required
                                        value={formData.email}
                                        onChange={handleChange}
                                        placeholder="Enter your email to receive reset link"
                                        className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                                    />
                                </div>
                            </div>
                        ) : (
                            <>
                                {!isLogin && (
                                    <>
                                        <div>
                                            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                                                Full Name
                                            </label>
                                            <div className="mt-1">
                                                <input
                                                    id="name"
                                                    name="name"
                                                    type="text"
                                                    required={!isLogin}
                                                    value={formData.name}
                                                    onChange={handleChange}
                                                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                                                Username
                                            </label>
                                            <div className="mt-1">
                                                <input
                                                    id="username"
                                                    name="username"
                                                    type="text"
                                                    required={!isLogin}
                                                    value={formData.username}
                                                    onChange={handleChange}
                                                    placeholder="Choose a unique username"
                                                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                                                Phone Number (optional)
                                            </label>
                                            <div className="mt-1">
                                                <input
                                                    id="phone"
                                                    name="phone"
                                                    type="tel"
                                                    value={formData.phone}
                                                    onChange={handleChange}
                                                    placeholder="+1 (555) 123-4567"
                                                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                                                Role
                                            </label>
                                            <div className="mt-1">
                                                <select
                                                    id="role"
                                                    name="role"
                                                    value={formData.role}
                                                    onChange={handleChange}
                                                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
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
                                        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                                            Email address
                                        </label>
                                        <div className="mt-1">
                                            <input
                                                id="email"
                                                name="email"
                                                type="email"
                                                autoComplete="email"
                                                required={!isLogin}
                                                value={formData.email}
                                                onChange={handleChange}
                                                className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                                            />
                                        </div>
                                    </div>
                                )}

                                {isLogin && (
                                    <div>
                                        <label htmlFor="loginIdentifier" className="block text-sm font-medium text-gray-700">
                                            Email, Username, or Phone
                                        </label>
                                        <div className="mt-1">
                                            <input
                                                id="loginIdentifier"
                                                name="loginIdentifier"
                                                type="text"
                                                autoComplete="username"
                                                required
                                                value={formData.loginIdentifier}
                                                onChange={handleChange}
                                                placeholder="Enter email, username, or phone number"
                                                className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                                            />
                                        </div>
                                    </div>
                                )}
                            </>
                        )}

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                                Password
                            </label>
                            <div className="mt-1">
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    autoComplete={isLogin ? "current-password" : "new-password"}
                                    required
                                    value={formData.password}
                                    onChange={handleChange}
                                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                                />
                            </div>
                        </div>

                        {!isLogin && (
                            <div>
                                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                                    Confirm Password
                                </label>
                                <div className="mt-1">
                                    <input
                                        id="confirmPassword"
                                        name="confirmPassword"
                                        type="password"
                                        autoComplete="new-password"
                                        required={!isLogin}
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
                                        className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                                    />
                                </div>
                            </div>
                        )}

                        <div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
                            >
                                {loading ? (isLogin ? 'Signing in...' : 'Creating account...') : (isLogin ? 'Sign in' : 'Register')}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Login;
