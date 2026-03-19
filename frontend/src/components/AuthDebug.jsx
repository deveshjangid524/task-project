import React from 'react';
import { useAuth } from '../context/AuthContext';

const AuthDebug = () => {
    const { user } = useAuth();
    
    const checkLocalStorage = () => {
        const userStr = localStorage.getItem('user');
        console.log('localStorage user:', userStr);
        console.log('Parsed user:', userStr ? JSON.parse(userStr) : null);
        console.log('AuthContext user:', user);
    };
    
    return (
        <div style={{ padding: '20px', border: '1px solid red', margin: '10px' }}>
            <h3>Authentication Debug</h3>
            <button onClick={checkLocalStorage}>Check Auth State</button>
            <div>
                <strong>User from AuthContext:</strong> {JSON.stringify(user, null, 2)}
            </div>
        </div>
    );
};

export default AuthDebug;
