// src/components/transfers/TwoFactorAuth.jsx

import React, { useState } from 'react';
import { Lock, Loader2, XCircle } from 'lucide-react';

// CAMBIO: Añadimos 'error' y 'loading' como props para recibir el estado desde el padre
export default function TwoFactorAuth({ transferData, onSuccess, onCancel, error, loading }) {
  const [code, setCode] = useState('');

  const handleVerify = (e) => {
    e.preventDefault();
    // CAMBIO: Ya no verificamos aquí, solo pasamos el código al padre
    if (code) {
      onSuccess(code);
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
          Ingresa el código que hemos enviado a tu email para completar la transferencia de <span className="font-semibold">${parseFloat(transferData.amount).toLocaleString('es-MX', { minimumFractionDigits: 2 })} {transferData.currency}</span>.
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
              className="w-full text-center text-2xl font-mono px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600"
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
              className="flex-1 px-6 py-3 border border-gray-300 rounded-lg"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-semibold flex items-center justify-center gap-2"
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