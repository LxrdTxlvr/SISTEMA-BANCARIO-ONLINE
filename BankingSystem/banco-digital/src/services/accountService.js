// src/services/accountService.js
import { supabase } from './supabase'
import { authService } from './authService' // Importación añadida

export const accountService = {
  // Obtener cuentas del usuario
  async getUserAccounts() {
    const { data, error } = await supabase
      .from('accounts')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data
  },

  // Obtener balance total
  async getTotalBalance() {
    const accounts = await this.getUserAccounts()
    return accounts.reduce((total, acc) => total + parseFloat(acc.balance), 0)
  },

  // Crear nueva cuenta
  async createAccount(accountData) {
    const user = await authService.getCurrentUser()
    
    // Generar número de cuenta único
    const accountNumber = `****${Math.floor(1000 + Math.random() * 9000)}`
    
    const { data, error } = await supabase
      .from('accounts')
      .insert({
        user_id: user.id,
        account_number: accountNumber,
        ...accountData
      })
      .select()
      .single()
    
    if (error) throw error
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
    
    if (error) throw error
    return data
  }
}