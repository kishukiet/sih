import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, LoginGuard } from './components/LoginGuard';
import Dashboard from './pages/Dashboard';
import DevicesPage from './pages/DevicesPage';
import Navigation from './components/Navigation';

function AppContent() {
  return (
    <Router>
      <div className="min-h-screen bg-slate-50">
        <Navigation />
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/devices" element={<DevicesPage />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

function App() {
  return (
    <AuthProvider>
      <LoginGuard>
        <AppContent />
      </LoginGuard>
    </AuthProvider>
  );
}

export default App;