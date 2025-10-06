// src/App.jsx
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import Login from './components/auth/login';
import Dashboard from './components/dashboard/Dashboard';
import Layout from './components/layout/layout';
import TransferForm from './components/transfers/TransferForm';
import TransactionsPage from './components/transactions/TransactionsPage';
import ProfilePage from './components/profile/ProfilePage';
import DepositPage from './components/deposit/DepositPage';

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  return isAuthenticated ? children : <Navigate to="/login" />;
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={
        <ProtectedRoute>
          <Layout />
        </ProtectedRoute>
      }>
        <Route index element={<Dashboard />} />
        <Route path="transfer" element={<TransferForm />} />
        <Route path="transactions" element={<TransactionsPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="deposit" element={<DepositPage />} />
      </Route>
    </Routes>
  );
}

export default App;