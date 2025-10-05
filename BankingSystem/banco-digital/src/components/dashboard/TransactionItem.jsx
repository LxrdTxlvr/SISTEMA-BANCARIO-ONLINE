// src/components/dashboard/TransactionItem.jsx
import React from 'react';
import { ArrowDownLeft, ArrowUpRight, Shield } from 'lucide-react';

export default function TransactionItem({ transaction }) {
  return (
    <div className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className={`p-2 rounded-lg ${
            transaction.amount > 0 
              ? 'bg-green-100 dark:bg-green-900' 
              : 'bg-red-100 dark:bg-red-900'
          }`}>
            {transaction.amount > 0 ? (
              <ArrowDownLeft className="text-green-600 dark:text-green-400" size={20} />
            ) : (
              <ArrowUpRight className="text-red-600 dark:text-red-400" size={20} />
            )}
          </div>
          <div>
            <p className="font-medium text-gray-900 dark:text-white">{transaction.concept}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {new Date(transaction.created_at).toLocaleDateString('es-MX')}
            </p>
            {transaction.requires_2fa && (
              <span className="inline-flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 mt-1">
                <Shield size={12} /> 2FA verificado
              </span>
            )}
          </div>
        </div>
        <div className="text-right">
          <p className={`font-semibold ${
            transaction.amount > 0 
              ? 'text-green-600 dark:text-green-400' 
              : 'text-red-600 dark:text-red-400'
          }`}>
            {transaction.amount > 0 ? '+' : ''}${Math.abs(transaction.amount).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">MXN</p>
        </div>
      </div>
    </div>
  );
}