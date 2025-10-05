// src/components/dashboard/AccountCard.jsx
import React from 'react';
import { CreditCard } from 'lucide-react';

export default function AccountCard({ account }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md transition-all hover:shadow-lg transform hover:scale-105 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <CreditCard className="text-gray-500 dark:text-gray-400" size={24} />
          <h3 className="font-semibold text-gray-900 dark:text-white">
            {account.type}
          </h3>
        </div>
        <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full dark:bg-blue-900 dark:text-blue-300">
          {account.currency}
        </span>
      </div>
      <p className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
        ${account.balance.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
      </p>
      <p className="text-sm text-gray-500 dark:text-gray-400">
        {account.number}
      </p>
    </div>
  );
}