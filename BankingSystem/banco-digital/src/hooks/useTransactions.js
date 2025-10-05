import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../services/supabase';

export const useTransactions = (accountId = null) => {
  const queryClient = useQueryClient();

  const { data: transactions, isLoading, error } = useQuery({
    queryKey: ['transactions', accountId],
    queryFn: async () => {
      let query = supabase
        .from('transactions')
        .select('*, accounts(account_number, account_type)')
        .order('created_at', { ascending: false })
        .limit(50);

      if (accountId) {
        query = query.eq('account_id', accountId);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      return data;
    }
  });

  const createTransferMutation = useMutation({
    mutationFn: async ({ fromAccountId, toAccountNumber, amount, concept }) => {
      const { data, error } = await supabase.rpc('process_transfer', {
        p_from_account_id: fromAccountId,
        p_to_account_number: toAccountNumber,
        p_amount: amount,
        p_concept: concept
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['transactions']);
      queryClient.invalidateQueries(['accounts']);
    }
  });

  return {
    transactions,
    isLoading,
    error,
    createTransfer: createTransferMutation.mutate,
    isTransferring: createTransferMutation.isPending
  };
};

// =====================================================
// src/services/supabase.js
// =====================================================
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Falta configuración de Supabase. Revisa tu archivo .env');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});