// src/services/transactionService.js
import { supabase } from './supabase'
import { accountService } from './accountService' // Importación añadida

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

  // Realizar transferencia
  async makeTransfer(fromAccountId, toAccountNumber, amount, concept) {
    // Verificar si requiere 2FA
    const requires2FA = parseFloat(amount) > 1000
    
    // Llamar función de base de datos
    const { data, error } = await supabase.rpc('process_transfer', {
      p_from_account_id: fromAccountId,
      p_to_user_email: toAccountNumber,
      p_amount: amount,
      p_concept: concept
    })
    
    if (error) throw error
    
    if (!data.success) {
      throw new Error(data.error)
    }
    
    return { ...data, requires2FA }
  },

  // Crear depósito
  async createDeposit(accountId, amount, concept) {
    const { data, error } = await supabase
      .from('transactions')
      .insert({
        account_id: accountId,
        type: 'deposit',
        amount,
        concept,
        status: 'completed'
      })
      .select()
      .single()
    
    if (error) throw error
    
    // Actualizar balance
    await supabase.rpc('increment_balance', {
      p_account_id: accountId,
      p_amount: amount
    })
    
    return data
  },

  // Filtrar transacciones
  async filterTransactions(accountId, filters) {
    let query = supabase
      .from('transactions')
      .select('*')
      .eq('account_id', accountId)
    
    if (filters.type) {
      query = query.eq('transaction_type', filters.type)
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