import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { AlertCircle, Shield, Lock } from 'lucide-react';
import TwoFactorAuth from './TwoFactorAuth';

export default function TransferForm() {
  const { user, db } = useAuth();
  const [accounts, setAccounts] = useState([]);
  const [transferForm, setTransferForm] = useState({
    accountId: null,
    recipient: '',
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
  }, [user]);

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

    const amount = parseFloat(transferForm.amount);

    if (!transferForm.accountId) {
      setError('Selecciona una cuenta de origen');
      return;
    }

    if (amount <= 0) {
      setError('El monto debe ser mayor a 0');
      return;
    }

    // Si es mayor a 1000, activar 2FA
    if (amount > 1000 && !show2FA) {
      setShow2FA(true);
      return;
    }

    // Procesar transferencia
    await processTransfer(amount);
  };

  const processTransfer = async (amount) => {
    setLoading(true);
    setError('');

    try {
      const account = accounts.find(acc => acc.id === transferForm.accountId);

      if (!account) {
        setError('Cuenta no encontrada');
        return;
      }

      if (account.balance < amount) {
        setError('Saldo insuficiente');
        return;
      }

      // Actualizar balance
      account.balance -= amount;
      await db.updateAccount(account);

      // Registrar transacción
      await db.addTransaction({
        accountId: account.id,
        type: 'expense',
        amount: -amount,
        concept: `Transferencia a ${transferForm.recipient}`,
        date: new Date().toISOString(),
        status: 'completed',
        requires2FA: amount > 1000
      });

      // Notificación
      await db.addNotification({
        userId: user.id,
        type: 'transaction',
        message: `Transferencia exitosa de $${amount.toFixed(2)} ${transferForm.currency}`,
        time: 'Ahora',
        read: false
      });

      alert('¡Transferencia realizada exitosamente!');
      navigate('/');
    } catch (error) {
      setError('Error al procesar la transferencia: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handle2FASuccess = async (code) => {
    if (code === '123456') {
      await processTransfer(parseFloat(transferForm.amount));
      setShow2FA(false);
    } else {
      setError('Código 2FA incorrecto');
    }
  };

  const handle2FACancel = () => {
    setShow2FA(false);
    setError('');
  };

  if (show2FA) {
    return (
      <TwoFactorAuth
        transferData={transferForm}
        accounts={accounts}
        onSuccess={handle2FASuccess}
        onCancel={handle2FACancel}
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
                  {acc.type} - {acc.number} (${acc.balance.toFixed(2)} {acc.currency})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Destinatario
            </label>
            <input
              type="text"
              value={transferForm.recipient}
              onChange={(e) => setTransferForm({...transferForm, recipient: e.target.value})}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Nombre o CLABE"
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
              className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-600 hover:to-purple-700 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Procesando...' : 'Continuar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}