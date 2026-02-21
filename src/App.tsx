import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { LandingPage } from '@/pages/LandingPage';
import { Dashboard } from '@/pages/Dashboard';
import { VideoRoom } from '@/pages/VideoRoom';
import { Login } from '@/pages/Login';
import { Signup } from '@/pages/Signup';
import { AdminLogin } from '@/pages/AdminLogin';
import React from 'react';
import { Toaster } from "@/components/ui/sonner";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  return children;
}

import { PatientAuth } from '@/pages/auth/PatientAuth';
import { LabAuth } from '@/pages/auth/LabAuth';
import { DoctorAuth } from '@/pages/auth/DoctorAuth';
import { TechnicianAuth } from '@/pages/auth/TechnicianAuth';

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/" element={user ? <Navigate to="/dashboard" replace /> : <LandingPage />} />

      {/* Role-Specific Auth Routes */}
      <Route path="/login/patient" element={user ? <Navigate to="/dashboard" replace /> : <PatientAuth />} />
      <Route path="/login/lab" element={user ? <Navigate to="/dashboard" replace /> : <LabAuth />} />
      <Route path="/login/doctor" element={user ? <Navigate to="/dashboard" replace /> : <DoctorAuth />} />
      <Route path="/login/technician" element={user ? <Navigate to="/dashboard" replace /> : <TechnicianAuth />} />

      <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <Login />} />
      <Route path="/admin" element={user ? <Navigate to="/dashboard" replace /> : <AdminLogin />} />
      <Route path="/signup" element={user ? <Navigate to="/dashboard" replace /> : <Signup />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/room/:roomId"
        element={
          <ProtectedRoute>
            <VideoRoom />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
        <Toaster />
      </AuthProvider>
    </Router>
  );
}

export default App;
