import { Routes, Route, Navigate } from 'react-router-dom';

import LoginForm from '../features/auth/LoginForm';
import RegisterForm from '../features/auth/RegisterForm';
import Dashboard from '../features/dashboard/Dashboard';
import ProtectedRoute from '../components/ProtectedRoute';


export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginForm />} />
      <Route path="/register" element={<RegisterForm />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  );
}