// src/services/transactionService.js
import { supabase } from './supabase'
import { accountService } from './accountService'
import { authService } from './authService'

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

  // Obtener todas las transacciones del usuario ACTUAL
  async getUserTransactions(limit = 50) {
    const user = await authService.getCurrentUser()
    
    if (!user) {
      throw new Error('Usuario no autenticado')
    }

    // Obtener solo las cuentas del usuario actual
    const accounts = await accountService.getUserAccounts()
    const accountIds = accounts.map(acc => acc.id)
    
    if (accountIds.length === 0) {
      return []
    }
    
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
  async makeTransfer(fromAccountId, toUserEmail, amount, concept) {
    try {
      const transferAmount = parseFloat(amount)
      const requires2FA = transferAmount > 1000
      
      // Llamar a la función RPC mejorada
      const { data, error } = await supabase.rpc('process_transfer_by_email', {
        p_from_account_id: fromAccountId, 
        p_to_user_email: toUserEmail, 
        p_amount: transferAmount, 
        p_concept: concept || 'Transferencia'
      })
    
      if (error) {
        console.error('Error de Supabase:', error)
        throw new Error(error.message || 'Error al procesar la transferencia')
      }
      
      // Verificar respuesta de la función
      if (data && typeof data === 'object' && data.success === false) {
        throw new Error(data.error || 'Error desconocido en la transferencia')
      }
      
      return { data, requires2FA }
      
    } catch (error) {
      console.error('Error en makeTransfer:', error)
      throw error
    }
  },

  // Crear depósito (ARREGLADO)
  async createDeposit(accountId, amount, concept) {
    try {
      const depositAmount = parseFloat(amount)
      
      if (isNaN(depositAmount) || depositAmount <= 0) {
        throw new Error('Monto inválido')
      }

      // Verificar que la cuenta existe y pertenece al usuario
      const user = await authService.getCurrentUser()
      const { data: account, error: accountError } = await supabase
        .from('accounts')
        .select('*')
        .eq('id', accountId)
        .eq('user_id', user.id)
        .single()

      if (accountError || !account) {
        throw new Error('Cuenta no encontrada o no tienes permisos')
      }

      // 1. Insertar transacción
      const { data: transaction, error: txError } = await supabase
        .from('transactions')
        .insert({
          account_id: accountId,
          type: 'deposit', 
          amount: depositAmount,
          concept: concept || 'Depósito en línea',
          status: 'completed'
        })
        .select()
        .single()
      
      if (txError) {
        console.error('Error al crear transacción:', txError)
        throw new Error(txError.message || 'Error al crear la transacción')
      }
      
      // 2. Actualizar balance usando la función RPC
      const { error: balanceError } = await supabase.rpc('increment_balance', {
        p_account_id: accountId,
        p_amount: depositAmount
      })
      
      if (balanceError) {
        console.error('Error al actualizar balance:', balanceError)
        throw new Error(balanceError.message || 'Error al actualizar el balance')
      }
      
      return transaction
    } catch (error) {
      console.error('Error en createDeposit:', error)
      throw error
    }
  },

  // Filtrar transacciones
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