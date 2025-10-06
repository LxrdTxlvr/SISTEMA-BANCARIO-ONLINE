// src/components/dashboard/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import {  Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext'; // Importación actualizada para usar el contexto
import { DollarSign, TrendingUp, Send, ArrowDownLeft, CreditCard, Clock, User, Fingerprint } from 'lucide-react';
import AccountCard from './AccountCard';
import TransactionItem from './TransactionItem'; // Importación añadida

export default function Dashboard() {
  const { user, db, biometricAvailable, biometricRegistered, registerBiometric } = useAuth();
  const [accounts, setAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [registeringBio, setRegisteringBio] = useState(false);

  useEffect(() => {
    loadData();
  }, [user, db]);

  const loadData = async () => {
    if (!user || !db) return;

    setLoading(true);

    try {
      const userAccounts = await db.getAccountsByUserId(user.id);
      setAccounts(userAccounts);

      const userTransactions = await db.getTransactionsByUserId(user.id);
      setTransactions(userTransactions);
    } catch (error) {
      console.error('Error cargando datos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterBiometric = async () => {
    setRegisteringBio(true);
    try {
      await registerBiometric();
      alert('¡Autenticación biométrica configurada exitosamente!');
      await loadData();
    } catch (error) {
      alert('Error al configurar biometría: ' + error.message);
    } finally {
      setRegisteringBio(false);
    }
  };

  const getTotalBalance = () => {
    return accounts.reduce((sum, acc) => sum + parseFloat(acc.balance), 0);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-slide-in">
      {/* Balance Total */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-6 text-white shadow-xl">
        <div className="flex justify-between items-start mb-4">
          <div>
            <p className="text-blue-100 text-sm mb-1">Balance Total</p>
            <h2 className="text-4xl font-bold">
              ${getTotalBalance().toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN
            </h2>
          </div>
          <div className="bg-white bg-opacity-20 p-3 rounded-lg backdrop-blur-sm">
            <DollarSign size={24} />
          </div>
        </div>
        <div className="flex gap-4 text-sm">
          <div className="flex items-center gap-1">
            <TrendingUp size={16} />
            <span>Sistema Local Activo</span>
          </div>
        </div>
      </div>

      {/* Banner de Biometría */}
      {biometricAvailable && !biometricRegistered && (
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900 dark:to-blue-900 rounded-xl p-6 border border-purple-200 dark:border-purple-700">
          <div className="flex items-start gap-4">
            <div className="bg-purple-100 dark:bg-purple-800 p-3 rounded-lg">
              <Fingerprint className="text-purple-600 dark:text-purple-400" size={24} />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Activa la autenticación biométrica
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Inicia sesión más rápido y seguro usando tu huella digital o Face ID
              </p>
              <button
                onClick={handleRegisterBiometric}
                disabled={registeringBio}
                className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {registeringBio ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    Configurando...
                  </>
                ) : (
                  <>
                    <Fingerprint size={18} />
                    Configurar ahora
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cuentas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {accounts.map((account) => (
          <AccountCard key={account.id} account={account} />
        ))}
      </div>

      {/* Acciones rápidas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link
        to="/transfer"
        className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-md hover:shadow-lg transition-all transform hover:scale-105 border border-gray-200 dark:border-gray-700 text-left"
      >
        <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-lg w-fit mb-3">
          <Send className="text-blue-600 dark:text-blue-400" size={24} />
        </div>
        <p className="text-sm font-medium text-gray-900 dark:text-white">Transferir</p>
      </Link>

      <Link
        to="/transactions"
        className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-md hover:shadow-lg transition-all transform hover:scale-105 border border-gray-200 dark:border-gray-700 text-left"
      >
        <div className="bg-purple-100 dark:bg-purple-900 p-3 rounded-lg w-fit mb-3">
          <Clock className="text-purple-600 dark:text-purple-400" size={24} />
        </div>
        <p className="text-sm font-medium text-gray-900 dark:text-white">Historial</p>
      </Link>

      <Link
        to="/deposit"
        className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-md hover:shadow-lg transition-all transform hover:scale-105 border border-gray-200 dark:border-gray-700 text-left"
      >
        <div className="bg-green-100 dark:bg-green-900 p-3 rounded-lg w-fit mb-3">
          <ArrowDownLeft className="text-green-600 dark:text-green-400" size={24} />
        </div>
        <p className="text-sm font-medium text-gray-900 dark:text-white">Depositar</p>
      </Link>

      <Link
        to="/profile"
        className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-md hover:shadow-lg transition-all transform hover:scale-105 border border-gray-200 dark:border-gray-700 text-left"
      >
        <div className="bg-orange-100 dark:bg-orange-900 p-3 rounded-lg w-fit mb-3">
          <User className="text-orange-600 dark:text-orange-400" size={24} />
        </div>
        <p className="text-sm font-medium text-gray-900 dark:text-white">Perfil</p>
      </Link>
      </div>

      {/* Transacciones recientes */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Movimientos Recientes</h3>
        </div>
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {transactions.slice(0, 5).map((tx) => (
            <TransactionItem key={tx.id} transaction={tx} />
          ))}
          {transactions.length === 0 && (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
              No hay transacciones aún
            </div>
          )}
        </div>
        {transactions.length > 5 && (
          <div className="p-4 bg-gray-50 dark:bg-gray-900">
            <button
              onClick={() => navigate('/transactions')}
              className="w-full text-center text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium text-sm"
            >
              Ver todos los movimientos →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}