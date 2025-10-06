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

    // Crear perfil y cuenta por defecto
    if (data.user) {
      await supabase.from('profiles').insert({
        id: data.user.id,
        email,
        full_name: fullName
      })

      // CAMBIO: Crear una cuenta de ahorros por defecto para el nuevo usuario
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
  }
}