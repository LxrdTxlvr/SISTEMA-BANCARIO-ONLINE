// src/context/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/services/supabase';
import { authService } from '@/services/authService';
import { loggingService } from '@/services/logginService';
import { accountService } from '@/services/accountService';
import { transactionService } from '@/services/transactionService';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [biometricAvailable, setBiometricAvailable] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );
    
    // Aquí puedes verificar la disponibilidad de la WebAuthn API si lo deseas.
    // Aunque el código anterior es un placeholder, lo mantenemos como ejemplo.
    if (window.isSecureContext) {
      navigator.credentials.get({ publicKey: { challenge: new Uint8Array() }, mediation: 'conditional' })
        .then(() => setBiometricAvailable(true))
        .catch(() => setBiometricAvailable(false));
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email, password) => {
    const { data, error } = await authService.signIn(email, password);
    if (error) {
      loggingService.logSecurityEvent('login_failed', { reason: error.message });
      throw new Error('Credenciales de inicio de sesión no válidas.');
    }
    loggingService.logSecurityEvent('login_success', { userId: data.user.id });
    return data;
  };

  const register = async (name, email, password) => {
    const { data, error } = await authService.signUp(email, password, name);
    if (error) {
      throw new Error('Error al registrar usuario: ' + error.message);
    }
    return data;
  };

  const signOut = async () => {
    await authService.signOut();
  };

  const loginWithBiometric = async () => {
    alert("Función de biometría aún no implementada.");
    throw new Error('Función no implementada');
  };

  const registerBiometric = async () => {
    alert("Función de registro de biometría aún no implementada.");
    throw new Error('Función no implementada');
  };

  const value = {
    user,
    session,
    loading,
    login,
    register,
    signOut,
    isAuthenticated: !!user,
    biometricAvailable,
    biometricRegistered: false,
    loginWithBiometric,
    registerBiometric,
    // Pasamos directamente los servicios para que los componentes puedan usarlos.
    db: {
      getAccountsByUserId: accountService.getUserAccounts,
      getTransactionsByUserId: transactionService.getUserTransactions,
      updateAccount: accountService.updateAccount,
      addTransaction: transactionService.makeTransfer,
      addNotification: () => console.log('Notificación añadida'),
    }
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}