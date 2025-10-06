// src/components/transfers/TwoFactorAuth.jsx
import React, { useState } from 'react';
import { Lock, Loader2, XCircle, Info } from 'lucide-react';

export default function TwoFactorAuth({ transferData, onSuccess, onCancel, error, loading }) {
  const [code, setCode] = useState('');

  const handleVerify = (e) => {
    e.preventDefault();
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
          Ingresa tu código de verificación personal para completar la operación de{' '}
          <span className="font-semibold">
            ${parseFloat(transferData.amount).toLocaleString('es-MX', { minimumFractionDigits: 2 })} {transferData.currency}
          </span>
          .
        </p>

        {/* Info sobre cómo configurar el código */}
        <div className="mb-6 p-3 bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-700 rounded-lg text-left">
          <div className="flex items-start gap-2">
            <Info size={16} className="text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-blue-700 dark:text-blue-300">
              Puedes cambiar tu código de verificación en la sección <strong>Configuración de Seguridad</strong> de tu perfil
            </p>
          </div>
        </div>

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
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              className="w-full text-center text-2xl font-mono px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="000000"
              maxLength="6"
              required
              disabled={loading}
              autoFocus
            />
          </div>

          <div className="flex gap-4">
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="flex-1 px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || code.length !== 6}
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