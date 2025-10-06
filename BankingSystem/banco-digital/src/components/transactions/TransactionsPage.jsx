// src/components/transactions/TransactionsPage.jsx

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import TransactionItem from '../dashboard/TransactionItem'; // Reutilizamos el mismo componente de la lista
import { Loader2, BookOpen } from 'lucide-react';

export default function TransactionsPage() {
  const { user, db } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadTransactions = async () => {
      if (!user || !db) return;

      setLoading(true);
      try {
        // Obtenemos TODAS las transacciones del usuario, sin límite
        const userTransactions = await db.getTransactionsByUserId(user.id);
        setTransactions(userTransactions);
      } catch (err) {
        console.error('Error cargando transacciones:', err);
        setError('No se pudo cargar el historial de movimientos.');
      } finally {
        setLoading(false);
      }
    };

    loadTransactions();
  }, [user, db]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-48">
        <Loader2 className="animate-spin text-blue-500" size={48} />
      </div>
    );
  }

  if (error) {
    return <div className="text-center text-red-500 p-8">{error}</div>;
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center gap-4">
        <BookOpen className="text-gray-500" />
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Historial de Movimientos
        </h2>
      </div>

      {transactions.length > 0 ? (
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {/* Mapeamos y mostramos CADA transacción */}
          {transactions.map((tx) => (
            <TransactionItem key={tx.id} transaction={tx} />
          ))}
        </div>
      ) : (
        <div className="p-12 text-center text-gray-500 dark:text-gray-400">
          <p>No se han encontrado movimientos en tu cuenta.</p>
        </div>
      )}
    </div>
  );
}