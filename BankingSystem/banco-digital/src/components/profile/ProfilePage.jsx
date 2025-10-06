// src/components/profile/ProfilePage.jsx

import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { User, Mail, CreditCard, Shield } from 'lucide-react';

export default function ProfilePage() {
  const { user, db } = useAuth();
  const [account, setAccount] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchAccount = async () => {
      if (user && db) {
        try {
          const userAccounts = await db.getAccountsByUserId(user.id);
          if (userAccounts.length > 0) {
            setAccount(userAccounts[0]); // Mostramos la primera cuenta
          }
        } catch(error) {
          console.error("Error al cargar la cuenta:", error);
        } finally {
          setLoading(false);
        }
      }
    };
    fetchAccount();
  }, [user, db]);

  if (loading) {
    return <div className="text-center">Cargando perfil...</div>;
  }

  if (!user || !account) {
    return <div className="text-center text-red-500">No se pudo cargar la información del perfil o la cuenta.</div>;
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 max-w-2xl mx-auto">
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
              <p className="font-medium text-gray-900 dark:text-white">{user.user_metadata?.full_name || 'No disponible'}</p>
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

        <div className="space-y-4 pt-6 border-t border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Datos de la Cuenta</h3>
          <div className="flex items-center gap-4">
            <CreditCard className="text-gray-500" size={20} />
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Número de Cuenta</p>
              <p className="font-mono text-gray-900 dark:text-white tracking-wider">{account.account_number}</p>
            </div>
          </div>
           <div className="flex items-center gap-4">
            <Shield className="text-gray-500" size={20} />
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Tipo de Cuenta</p>
              <p className="font-medium text-gray-900 dark:text-white">{account.account_type}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}