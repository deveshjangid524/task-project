import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';

import PrivateRoute from './components/PrivateRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import UnifiedDashboard from './pages/UnifiedDashboard';
import Profile from './pages/Profile';
import TeamOverview from './pages/TeamOverview';
import TaskBoard from './pages/TaskBoard';
import NotesPage from './pages/NotesPage';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected Routes using Layout */}
          <Route element={<PrivateRoute />}>
            <Route element={<Layout />}>
              <Route path="/dashboard" element={<UnifiedDashboard />} />
              <Route path="/tasks" element={<TaskBoard />} />
              <Route path="/team" element={<TeamOverview />} />
              <Route path="/notes" element={<NotesPage />} />
              <Route path="/profile" element={<Profile />} />
              {/* Other routes will be added here */}
            </Route>
          </Route>

          {/* Redirect root to dashboard */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          {/* Catch all */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
