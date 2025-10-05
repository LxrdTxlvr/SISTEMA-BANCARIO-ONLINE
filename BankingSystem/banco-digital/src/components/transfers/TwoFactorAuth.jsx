// src/components/transfers/TwoFactorAuth.jsx
import React, { useState } from 'react';
import { Lock, Loader2, XCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function TwoFactorAuth({ transferData, onSuccess, onCancel }) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { user } = useAuth();
  
  const handleVerify = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    // Simula la verificación del código 2FA
    // En una implementación real, esto validaría un código enviado por SMS/email
    if (code === '123456') {
      try {
        await onSuccess(code);
      } catch (err) {
        setError(err.message || 'Error al procesar la transferencia.');
      } finally {
        setLoading(false);
      }
    } else {
      setLoading(false);
      setError('Código incorrecto. Inténtalo de nuevo.');
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-8 text-center">
        <Lock size={48} className="text-purple-600 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
          Verificación de dos factores
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Ingresa el código que hemos enviado a tu dispositivo registrado para completar la transferencia de <span className="font-semibold">${parseFloat(transferData.amount).toLocaleString('es-MX', { minimumFractionDigits: 2 })} {transferData.currency}</span>.
        </p>
        
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm flex items-start gap-2 justify-center">
            <XCircle size={16} className="flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleVerify} className="space-y-4">
          <div>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full text-center text-2xl font-mono px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent tracking-widest"
              maxLength="6"
              required
              disabled={loading}
            />
          </div>
          
          <div className="flex gap-4">
            <button
              type="button"
              onClick={onCancel}
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
                  Verificando...
                </>
              ) : (
                'Verificar'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}