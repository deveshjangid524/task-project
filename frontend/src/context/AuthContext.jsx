import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadStoredUser = () => {
            try {
                const storedUser = localStorage.getItem('user');
                if (storedUser) {
                    const parsedUser = JSON.parse(storedUser);
                    // Validate that parsed user has required fields
                    if (parsedUser && parsedUser._id && parsedUser.email) {
                        setUser(parsedUser);
                    } else {
                        console.warn('Invalid user data in localStorage, clearing...');
                        localStorage.removeItem('user');
                    }
                }
            } catch (error) {
                console.error('Error parsing stored user data:', error);
                // Clear corrupted data
                localStorage.removeItem('user');
            } finally {
                setLoading(false);
            }
        };
        
        loadStoredUser();
    }, []);

    const login = async (email, password) => {
        try {
            const response = await api.post('/auth/login', { email, password });
            setUser(response.data);
            localStorage.setItem('user', JSON.stringify(response.data));
            // Store token separately for assessment API
            if (response.data.token) {
                localStorage.setItem('token', response.data.token);
                console.log('Token stored in localStorage:', response.data.token.substring(0, 20) + '...');
            }
            return { success: true };
        } catch (error) {
            return { success: false, message: error.response?.data?.message || 'Login failed' };
        }
    };

    const register = async (userData) => {
        try {
            console.log('Sending this payload to API: ', userData);
            const response = await api.post('/auth/register', userData);
            console.log('Success payload:', response.data);
            setUser(response.data);
            localStorage.setItem('user', JSON.stringify(response.data));
            // Store token separately for assessment API
            if (response.data.token) {
                localStorage.setItem('token', response.data.token);
                console.log('Token stored in localStorage:', response.data.token.substring(0, 20) + '...');
            }
            return { success: true };
        } catch (error) {
            console.error('Registration API Error:', error);
            if(error.response) console.error('Data:', error.response.data);
            return { success: false, message: error.response?.data?.message || 'Registration failed' };
        }
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('user');
        localStorage.removeItem('token'); // Also remove token
    };

    if (loading) return <div>Loading...</div>;

    return (
        <AuthContext.Provider value={{ user, login, register, logout, setUser }}>
            {children}
        </AuthContext.Provider>
    );
};
