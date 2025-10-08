// src/services/accountService.js
import { supabase } from './supabase'
import { authService } from './authService'

export const accountService = {
  // Obtener cuentas del usuario ACTUAL solamente
  async getUserAccounts() {
    // Obtener el usuario autenticado
    const user = await authService.getCurrentUser()
    
    if (!user) {
      throw new Error('Usuario no autenticado')
    }

    // CRÍTICO: Filtrar por user_id para obtener SOLO las cuentas del usuario actual
    const { data, error } = await supabase
      .from('accounts')
      .select('*')
      .eq('user_id', user.id) // <-- ESTE ES EL FIX PRINCIPAL
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Error al obtener cuentas:', error)
      throw error
    }
    
    return data || []
  },

  // Obtener balance total DEL USUARIO ACTUAL
  async getTotalBalance() {
    const accounts = await this.getUserAccounts()
    return accounts.reduce((total, acc) => total + parseFloat(acc.balance || 0), 0)
  },

  // Crear nueva cuenta
  async createAccount(accountData) {
    const user = await authService.getCurrentUser()
    
    if (!user) {
      throw new Error('Usuario no autenticado')
    }
    
    // Generar número de cuenta único
    const accountNumber = `****${Math.floor(1000 + Math.random() * 9000)}`
    
    const { data, error } = await supabase
      .from('accounts')
      .insert({
        user_id: user.id,
        account_number: accountNumber,
        balance: accountData.balance || 0,
        account_type: accountData.account_type || 'Ahorros',
        currency: accountData.currency || 'MXN'
      })
      .select()
      .single()
    
    if (error) {
      console.error('Error al crear cuenta:', error)
      throw error
    }
    
    return data
  },

  // Actualizar cuenta
  async updateAccount(accountId, updates) {
    const { data, error } = await supabase
      .from('accounts')
      .update(updates)
      .eq('id', accountId)
      .select()
      .single()
    
    if (error) {
      console.error('Error al actualizar cuenta:', error)
      throw error
    }
    
    return data
  },

  // Obtener una cuenta específica
  async getAccountById(accountId) {
    const { data, error } = await supabase
      .from('accounts')
      .select('*')
      .eq('id', accountId)
      .single()
    
    if (error) {
      console.error('Error al obtener cuenta:', error)
      throw error
    }
    
    return data
  }
}