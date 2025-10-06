// src/components/transfers/TransferForm.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { AlertCircle, Shield, Loader2 } from 'lucide-react';
import TwoFactorAuth from './TwoFactorAuth';
import { transactionService } from '../../services/transactionService';
import { authService } from '../../services/authService';

export default function TransferForm() {
  const { user, db } = useAuth();
  const [accounts, setAccounts] = useState([]);
  const [transferForm, setTransferForm] = useState({
    accountId: null,
    toUserEmail: '',
    amount: '',
    currency: 'MXN',
    concept: ''
  });
  const [show2FA, setShow2FA] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadAccounts();
  }, [user, db]);

  const loadAccounts = async () => {
    if (!user || !db) return;

    try {
      const userAccounts = await db.getAccountsByUserId(user.id);
      setAccounts(userAccounts);
      if (userAccounts.length > 0) {
        setTransferForm(prev => ({ ...prev, accountId: userAccounts[0].id }));
      }
    } catch (error) {
      console.error('Error cargando cuentas:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const amount = parseFloat(transferForm.amount);

    if (!transferForm.accountId || amount <= 0 || !transferForm.recipient) {
      setError('Por favor, completa todos los campos requeridos.');
      setLoading(false);
      return;
    }

    // Verificar saldo antes de continuar
    const account = accounts.find(acc => acc.id === transferForm.accountId);
    if (!account) {
      setError('Cuenta no encontrada');
      setLoading(false);
      return;
    }

    if (account.balance < amount) {
      setError('Saldo insuficiente');
      setLoading(false);
      return;
    }

    // Si es mayor a 1000, activar 2FA
    if (amount > 1000) {
      setShow2FA(true);
      setLoading(false);
      return; // IMPORTANTE: Detener ejecución aquí
    }

    // Si no requiere 2FA, procesar directamente
    await processTransfer();
  };

  const processTransfer = async () => {
    setLoading(true);
    setError('');

    try {
      const amount = parseFloat(transferForm.amount);

      console.log('Iniciando transferencia:', {
        accountId: transferForm.accountId,
        recipient: transferForm.recipient,
        amount: amount,
        concept: transferForm.concept
      });

      // Usar el servicio real para la transferencia
      const result = await transactionService.makeTransfer(
        transferForm.accountId,
        transferForm.toUserEmail,
        amount,
        transferForm.concept || 'Transferencia'
      );

      console.log('Resultado de transferencia:', result);

      // Verificar diferentes estructuras de respuesta
      if (result && (result.success === true || result.data?.success === true)) {
        alert('¡Transferencia realizada exitosamente!');
        navigate('/');
      } else {
        // Extraer mensaje de error de diferentes estructuras posibles
        const errorMsg = 
          result?.error || 
          result?.data?.error || 
          result?.message || 
          'Error al procesar la transferencia. Verifica que el destinatario tenga una cuenta activa.';
        
        setError(errorMsg);
        console.error('Error de transferencia:', result);
      }
    } catch (error) {
      console.error('Error en transferencia (catch):', error);
      
      // Manejo detallado de errores
      let errorMessage = 'Error al procesar la transferencia';
      
      if (error.message) {
        errorMessage = error.message;
      } else if (error.error) {
        errorMessage = error.error;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      setError(errorMessage);
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
        return;
      }

      await processTransfer();
      setShow2FA(false);
    } catch (error) {
      setError('Error al verificar el código 2FA');
      console.error('Error 2FA:', error);
    }
  };

  const handle2FACancel = () => {
    setShow2FA(false);
    setError('');
    setLoading(false);
  };

  if (show2FA) {
    return (
      <TwoFactorAuth
        transferData={transferForm}
        accounts={accounts}
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
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Nueva Transferencia</h2>
        
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm flex items-start gap-2">
            <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Cuenta de origen
            </label>
            <select 
              value={transferForm.accountId || ''}
              onChange={(e) => setTransferForm({...transferForm, accountId: parseInt(e.target.value)})}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
              disabled={loading}
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
              Email del Destinatario
            </label>
            <input
              type="email"
              value={transferForm.toUserEmail}
              onChange={(e) => setTransferForm({...transferForm, toUserEmail: e.target.value})}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="email@destinatario.com"
              required
              disabled={loading}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Monto
              </label>
              <input
                type="number"
                step="0.01"
                value={transferForm.amount}
                onChange={(e) => setTransferForm({...transferForm, amount: e.target.value})}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0.00"
                required
                disabled={loading}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Moneda
              </label>
              <select 
                value={transferForm.currency}
                onChange={(e) => setTransferForm({...transferForm, currency: e.target.value})}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={loading}
              >
                <option value="MXN">MXN</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
              </select>
            </div>
          </div>

          {parseFloat(transferForm.amount) > 1000 && (
            <div className="bg-yellow-50 dark:bg-yellow-900 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Shield className="text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" size={20} />
                <div>
                  <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                    Autenticación de dos factores requerida
                  </p>
                  <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                    Las transferencias mayores a $1,000 MXN requieren verificación adicional
                  </p>
                </div>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Concepto (opcional)
            </label>
            <input
              type="text"
              value={transferForm.concept}
              onChange={(e) => setTransferForm({...transferForm, concept: e.target.value})}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Descripción de la transferencia"
              disabled={loading}
            />
          </div>

          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => navigate('/')}
              disabled={loading}
              className="flex-1 px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-600 hover:to-purple-700 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  Procesando...
                </>
              ) : (
                'Continuar'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}