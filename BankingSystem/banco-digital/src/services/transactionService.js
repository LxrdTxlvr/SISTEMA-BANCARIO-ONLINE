// src/services/transactionService.js
import { supabase } from './supabase'
import { accountService } from './accountService'

export const transactionService = {
  // Obtener transacciones de una cuenta
  async getAccountTransactions(accountId, limit = 50) {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('account_id', accountId)
      .order('created_at', { ascending: false })
      .limit(limit)
    
    if (error) throw error
    return data
  },

  // Obtener todas las transacciones del usuario
  async getUserTransactions(limit = 50) {
    const accounts = await accountService.getUserAccounts()
    const accountIds = accounts.map(acc => acc.id)
    
    const { data, error } = await supabase
      .from('transactions')
      .select('*, accounts(account_number, account_type)')
      .in('account_id', accountIds)
      .order('created_at', { ascending: false })
      .limit(limit)
    
    if (error) throw error
    return data
  },

  // Realizar transferencia (ARREGLO: Nombre de la función RPC)
  async makeTransfer(fromAccountId, toUserEmail, amount, concept) {
    try {

      // 1. Asegurar tipos de datos
      const requires2FA = parseFloat(amount) > 1000
      const transferAmount = parseFloat(amount);
      
      // 2. Llamar función de base de datos con los parámetros correctos
      // CAMBIO CRÍTICO: Usar 'process_transfer_by_email' como sugiere el log.
      const { data, error } = await supabase.rpc('process_transfer_by_email', {
        p_from_account_id: fromAccountId, 
        p_to_user_email: toUserEmail, 
        p_amount: transferAmount, 
        p_concept: concept 
      })
    
      if (error) {
        console.error('Error de Supabase:', error);
        throw new Error(error.message || 'Error al procesar la transferencia');
      }
      
      // La función RPC retorna un objeto JSON con { success: boolean, error?: string }
      if (data && typeof data === 'object' && data.success === false) {
        throw new Error(data.error || 'Error desconocido en la transferencia');
      }
      
      // Si no hay error de Supabase y data.success no es false, asumimos éxito.
      return { data, requires2FA };
      
    } catch (error) {
      console.error('Error en makeTransfer:', error);
      throw error;
    }
  },

  // Crear depósito (ARREGLO: Eliminación de columna no existente)
  async createDeposit(accountId, amount, concept) {
    try {
      // Insertar transacción
      
      const { data: transaction, error: txError } = await supabase
        .from('transactions')
        .insert({
          account_id: accountId,
          type: 'deposit', 
          amount: parseFloat(amount),
          concept,
          status: 'completed',
          // SE ELIMINA 'requires2FA' para corregir el error PGRST204.
        })
        .select()
        .single()
      
      if (txError) throw txError
      
      // Actualizar balance usando la función RPC
      const { error: balanceError } = await supabase.rpc('increment_balance', {
        p_account_id: accountId,
        p_amount: amount
      })
      
      if (balanceError) throw balanceError
      
      return transaction
    } catch (error) {
      console.error('Error en createDeposit:', error);
      throw error;
    }
  },

  // Filtrar transacciones (CORREGIDO)
  async filterTransactions(accountId, filters) {
    let query = supabase
      .from('transactions')
      .select('*')
      .eq('account_id', accountId)
    
    if (filters.type) {
      query = query.eq('type', filters.type)
    }
    
    if (filters.dateFrom) {
      query = query.gte('created_at', filters.dateFrom)
    }
    
    if (filters.dateTo) {
      query = query.lte('created_at', filters.dateTo)
    }
    
    if (filters.search) {
      query = query.ilike('concept', `%${filters.search}%`)
    }
    
    const { data, error } = await query.order('created_at', { ascending: false })
    
    if (error) throw error
    return data
  }
}