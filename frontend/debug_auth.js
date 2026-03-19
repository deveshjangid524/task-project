// Debug script - run this in browser console to check authentication
console.log('Current user in localStorage:', JSON.parse(localStorage.getItem('user')));
console.log('Token exists:', !!JSON.parse(localStorage.getItem('user'))?.token);

// Clear corrupted authentication
localStorage.removeItem('user');
console.log('Cleared localStorage - please refresh and log in again');
