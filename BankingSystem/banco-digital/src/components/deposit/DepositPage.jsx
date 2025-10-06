// src/components/deposit/DepositPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useQueryClient } from '@tanstack/react-query'; 
import { transactionService } from '../../services/transactionService';
import { authService } from '../../services/authService';
import { Loader2, ArrowDownLeft, Shield, Lock } from 'lucide-react';
import TwoFactorAuth from '../transfers/TwoFactorAuth';

export default function DepositPage() {
  const { user, db } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient(); 
  const [accounts, setAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [show2FA, setShow2FA] = useState(false);

  useEffect(() => {
    const loadAccounts = async () => {
      if (user && db) {
        const userAccounts = await db.getAccountsByUserId(user.id);
        setAccounts(userAccounts);
        if (userAccounts.length > 0) {
          setSelectedAccount(userAccounts[0].id);
        }
      }
    };
    loadAccounts();
  }, [user, db]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const depositAmount = parseFloat(amount);
    
    if (!selectedAccount || !depositAmount || depositAmount <= 0) {
      setError('Por favor, selecciona una cuenta e ingresa un monto válido.');
      return;
    }

    console.log('Monto del depósito:', depositAmount);
    console.log('¿Requiere 2FA?', depositAmount > 1000);

    // Solo requerir 2FA para depósitos mayores a $1,000
    if (depositAmount > 1000) {
      console.log('Activando 2FA...');
      setShow2FA(true);
      return; // IMPORTANTE: Detener aquí y esperar 2FA
    }

    // Si es menor o igual a 1000, procesar directamente sin 2FA
    console.log('Procesando sin 2FA...');
    await processDeposit();
  };

  const processDeposit = async () => {
    setLoading(true);
    setError('');

    try {
      const depositAmount = parseFloat(amount);
      await transactionService.createDeposit(selectedAccount, depositAmount, 'Depósito en línea');
      await queryClient.invalidateQueries({ queryKey: ['accounts'] });
      await queryClient.invalidateQueries({ queryKey: ['transactions'] });
      
      setSuccess(`¡Depósito de ${depositAmount.toFixed(2)} realizado con éxito!`);
      setAmount('');
      setShow2FA(false);
      
      // Redirigir después de 2 segundos
      setTimeout(() => navigate('/'), 2000);
    } catch (err) {
      setError('Hubo un error al procesar el depósito.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handle2FASuccess = async (code) => {
    setError('');
    
    try {
      // Verificar código 2FA con el código personalizado del usuario
      const isValid = await authService.verify2FA(user.id, code);
      
      if (!isValid) {
        setError('Código 2FA incorrecto');
        setLoading(false);
        return;
      }

      await processDeposit();
    } catch (error) {
      setError('Error al verificar el código 2FA');
      console.error('Error 2FA:', error);
      setLoading(false);
    }
  };

  const handle2FACancel = () => {
    setShow2FA(false);
    setError('');
    setLoading(false);
  };

  // Si está en modo 2FA, mostrar el componente de verificación
  if (show2FA) {
    return (
      <TwoFactorAuth
        transferData={{
          amount: amount,
          concept: 'Depósito en línea',
          currency: 'MXN'
        }}
        onSuccess={handle2FASuccess}
        onCancel={handle2FACancel}
        error={error}
        loading={loading}
      />
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center gap-4 mb-6">
          <ArrowDownLeft className="text-green-500" size={32} />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Realizar un Depósito</h2>
        </div>

        {/* Advertencia de 2FA - Solo si el monto es mayor a 1000 */}
        {parseFloat(amount) > 1000 && (
          <div className="mb-6 bg-yellow-50 dark:bg-yellow-900 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Shield className="text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" size={20} />
              <div>
                <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                  Autenticación de dos factores requerida
                </p>
                <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                  Los depósitos mayores a $1,000 MXN requieren verificación adicional
                </p>
              </div>
            </div>
          </div>
        )}

        {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">{error}</div>}
        {success && <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-lg">{success}</div>}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Cuenta de destino
            </label>
            <select 
              value={selectedAccount}
              onChange={(e) => setSelectedAccount(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
              disabled={loading || accounts.length === 0}
            >
              {accounts.map(acc => (
                <option key={acc.id} value={acc.id}>
                  {acc.account_type} - {acc.account_number} (${parseFloat(acc.balance || 0).toFixed(2)} {acc.currency})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Monto a depositar (MXN)
            </label>
            <input
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="0.00"
              required
              disabled={loading}
            />
          </div>

          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => navigate('/')}
              disabled={loading}
              className="flex-1 px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Volver
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  Procesando...
                </>
              ) : (
                <>
                  <Lock size={20} />
                  Continuar con verificación
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}