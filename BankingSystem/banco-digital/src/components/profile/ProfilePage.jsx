// src/components/profile/ProfilePage.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { User, Mail, CreditCard, Shield, Eye, EyeOff, Lock, AlertCircle, Key, CheckCircle } from 'lucide-react';
import { supabase } from '../../services/supabase';

export default function ProfilePage() {
  const { user, db } = useAuth();
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAccountDetails, setShowAccountDetails] = useState(false);
  const [verifyPassword, setVerifyPassword] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // Estados para configuración 2FA
  const [show2FASettings, setShow2FASettings] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [new2FACode, setNew2FACode] = useState('');
  const [confirm2FACode, setConfirm2FACode] = useState('');
  const [updating2FA, setUpdating2FA] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    const fetchAccounts = async () => {
      if (user && db) {
        try {
          const userAccounts = await db.getAccountsByUserId(user.id);
          setAccounts(userAccounts);
        } catch(error) {
          console.error("Error al cargar las cuentas:", error);
        } finally {
          setLoading(false);
        }
      }
    };
    fetchAccounts();
  }, [user, db]);

  const handleVerifyPassword = async (e) => {
    e.preventDefault();
    setVerifying(true);
    setError('');

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: verifyPassword
      });

      if (signInError) {
        setError('Contraseña incorrecta');
        setVerifying(false);
        return;
      }

      setShowAccountDetails(true);
      setVerifyPassword('');
    } catch (err) {
      setError('Error al verificar la contraseña');
    } finally {
      setVerifying(false);
    }
  };

  const handleHideDetails = () => {
    setShowAccountDetails(false);
    setVerifyPassword('');
    setError('');
  };

  const handleUpdate2FA = async (e) => {
    e.preventDefault();
    setUpdating2FA(true);
    setError('');
    setSuccessMessage('');

    // Validaciones
    if (new2FACode.length !== 6 || !/^\d+$/.test(new2FACode)) {
      setError('El código debe tener exactamente 6 números');
      setUpdating2FA(false);
      return;
    }

    if (new2FACode !== confirm2FACode) {
      setError('Los códigos no coinciden');
      setUpdating2FA(false);
      return;
    }

    try {
      // Verificar contraseña actual
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword
      });

      if (signInError) {
        setError('Contraseña incorrecta');
        setUpdating2FA(false);
        return;
      }

      // Guardar nuevo código 2FA en el perfil del usuario
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          two_factor_code: new2FACode,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (updateError) throw updateError;

      setSuccessMessage('¡Código 2FA actualizado exitosamente!');
      setCurrentPassword('');
      setNew2FACode('');
      setConfirm2FACode('');
      
      setTimeout(() => {
        setShow2FASettings(false);
        setSuccessMessage('');
      }, 2000);

    } catch (err) {
      console.error('Error al actualizar 2FA:', err);
      setError('Error al actualizar el código 2FA');
    } finally {
      setUpdating2FA(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  if (!user) {
    return <div className="text-center text-red-500">No se pudo cargar la información del perfil.</div>;
  }

  const primaryAccount = accounts[0];
  const totalBalance = accounts.reduce((sum, acc) => sum + parseFloat(acc.balance || 0), 0);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Información del Usuario */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Mi Perfil</h2>
        </div>
        <div className="p-6 space-y-6">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Datos Personales</h3>
            <div className="flex items-center gap-4">
              <User className="text-gray-500" size={20} />
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Nombre completo</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {user.user_metadata?.full_name || 'No disponible'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Mail className="text-gray-500" size={20} />
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Email</p>
                <p className="font-medium text-gray-900 dark:text-white">{user.email}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tarjeta de Cuenta Bancaria */}
      <div className="bg-gradient-to-br from-blue-600 via-purple-600 to-pink-500 rounded-xl shadow-2xl overflow-hidden">
        <div className="p-6 text-white">
          <div className="flex justify-between items-start mb-8">
            <div>
              <p className="text-blue-100 text-sm mb-1">Balance Total</p>
              <h3 className="text-3xl font-bold">
                ${totalBalance.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN
              </h3>
            </div>
            <CreditCard size={32} className="opacity-80" />
          </div>

          {primaryAccount && (
            <div className="space-y-3">
              <div>
                <p className="text-xs text-blue-100 mb-1">NÚMERO DE CUENTA</p>
                <p className="text-xl font-mono tracking-wider">
                  {showAccountDetails 
                    ? primaryAccount.account_number 
                    : `${'*'.repeat(primaryAccount.account_number?.length - 4)}${primaryAccount.account_number?.slice(-4)}`
                  }
                </p>
              </div>

              <div className="flex justify-between items-end">
                <div>
                  <p className="text-xs text-blue-100 mb-1">TIPO DE CUENTA</p>
                  <p className="font-medium">{primaryAccount.account_type || 'Ahorros'}</p>
                </div>
                <div>
                  <p className="text-xs text-blue-100 mb-1">MONEDA</p>
                  <p className="font-medium">{primaryAccount.currency || 'MXN'}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Verificación de Contraseña */}
        <div className="bg-white bg-opacity-10 backdrop-blur-lg p-4 border-t border-white border-opacity-20">
          {!showAccountDetails ? (
            <form onSubmit={handleVerifyPassword} className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-white mb-2">
                <Lock size={16} />
                <span>Verifica tu identidad para ver el número completo</span>
              </div>
              
              {error && (
                <div className="flex items-center gap-2 text-sm text-red-200 bg-red-500 bg-opacity-20 rounded-lg p-2">
                  <AlertCircle size={16} />
                  <span>{error}</span>
                </div>
              )}

              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={verifyPassword}
                    onChange={(e) => setVerifyPassword(e.target.value)}
                    placeholder="Ingresa tu contraseña"
                    className="w-full px-4 py-2 rounded-lg bg-white bg-opacity-20 border border-white border-opacity-30 text-white placeholder-blue-100 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50"
                    required
                    disabled={verifying}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white opacity-70 hover:opacity-100"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <button
                  type="submit"
                  disabled={verifying}
                  className="px-6 py-2 bg-white text-blue-600 rounded-lg font-medium hover:bg-opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {verifying ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
                      Verificando...
                    </>
                  ) : (
                    <>
                      <Shield size={18} />
                      Verificar
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-white">
                <Shield size={16} className="text-green-300" />
                <span>Identidad verificada</span>
              </div>
              <button
                onClick={handleHideDetails}
                className="px-4 py-2 bg-white bg-opacity-20 text-white rounded-lg text-sm hover:bg-opacity-30 transition-colors"
              >
                Ocultar detalles
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Configuración de Seguridad */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Configuración de Seguridad</h3>
        </div>
        <div className="p-6">
          {!show2FASettings ? (
            <button
              onClick={() => setShow2FASettings(true)}
              className="flex items-center justify-between w-full p-4 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900 dark:to-blue-900 rounded-lg hover:shadow-md transition-all"
            >
              <div className="flex items-center gap-3">
                <Key className="text-purple-600 dark:text-purple-400" size={24} />
                <div className="text-left">
                  <p className="font-medium text-gray-900 dark:text-white">Código de Verificación 2FA</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Cambia tu código de autenticación de dos factores</p>
                </div>
              </div>
              <span className="text-purple-600 dark:text-purple-400">→</span>
            </button>
          ) : (
            <form onSubmit={handleUpdate2FA} className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold text-gray-900 dark:text-white">Actualizar Código 2FA</h4>
                <button
                  type="button"
                  onClick={() => {
                    setShow2FASettings(false);
                    setError('');
                    setCurrentPassword('');
                    setNew2FACode('');
                    setConfirm2FACode('');
                  }}
                  className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  Cancelar
                </button>
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm flex items-center gap-2">
                  <AlertCircle size={16} />
                  <span>{error}</span>
                </div>
              )}

              {successMessage && (
                <div className="p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm flex items-center gap-2">
                  <CheckCircle size={16} />
                  <span>{successMessage}</span>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Contraseña actual
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  required
                  disabled={updating2FA}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nuevo código 2FA (6 dígitos)
                </label>
                <input
                  type="text"
                  value={new2FACode}
                  onChange={(e) => setNew2FACode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-center text-xl"
                  placeholder="000000"
                  maxLength="6"
                  required
                  disabled={updating2FA}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Confirmar nuevo código
                </label>
                <input
                  type="text"
                  value={confirm2FACode}
                  onChange={(e) => setConfirm2FACode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-center text-xl"
                  placeholder="000000"
                  maxLength="6"
                  required
                  disabled={updating2FA}
                />
              </div>

              <button
                type="submit"
                disabled={updating2FA}
                className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {updating2FA ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                    Actualizando...
                  </>
                ) : (
                  <>
                    <Key size={20} />
                    Actualizar Código 2FA
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Lista de Cuentas (si hay más de una) */}
      {accounts.length > 1 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Mis Cuentas</h3>
          </div>
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {accounts.map((account) => (
              <div key={account.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{account.account_type}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {showAccountDetails 
                        ? account.account_number 
                        : `${'*'.repeat(account.account_number?.length - 4)}${account.account_number?.slice(-4)}`
                      }
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900 dark:text-white">
                      ${parseFloat(account.balance || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{account.currency}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}