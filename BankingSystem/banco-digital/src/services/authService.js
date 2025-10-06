// src/services/authService.js
import { supabase } from './supabase'
import { accountService } from './accountService'

export const authService = {
  // Login con email y contraseña
  async signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    if (error) throw error
    return data
  },

  // Registro
  async signUp(email, password, fullName) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName
        }
      }
    })
    if (error) throw error

    // Crear perfil con código 2FA por defecto
    if (data.user) {
      await supabase.from('profiles').insert({
        id: data.user.id,
        email,
        full_name: fullName,
        two_factor_code: '123456' // Código por defecto
      })

      // Crear una cuenta de ahorros por defecto para el nuevo usuario
      await accountService.createAccount({
        user_id: data.user.id,
        account_type: 'Ahorros',
        balance: 5000, // Saldo inicial de $5,000
        currency: 'MXN'
      })
    }

    return data
  },

  // Cerrar sesión
  async signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  },

  // Obtener sesión actual
  async getSession() {
    const { data, error } = await supabase.auth.getSession()
    if (error) throw error
    return data.session
  },

  // Obtener usuario actual
  async getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error) throw error
    return user
  },

  // Obtener código 2FA del usuario
  async get2FACode(userId) {
    const { data, error } = await supabase
      .from('profiles')
      .select('two_factor_code')
      .eq('id', userId)
      .single()
    
    if (error) throw error
    return data?.two_factor_code || '123456' // Por defecto si no existe
  },

  // Verificar código 2FA
  async verify2FA(userId, code) {
    const savedCode = await this.get2FACode(userId)
    return code === savedCode
  }
}