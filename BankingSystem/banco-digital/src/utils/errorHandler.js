// src/utils/errorHandler.js
export class AppError extends Error {
  constructor(message, statusCode, code) {
    super(message)
    this.statusCode = statusCode
    this.code = code
    this.isOperational = true
  }
}

export const errorHandler = {
  handle(error) {
    console.error('Error:', error)
    
    // Errores de Supabase
    if (error.code) {
      switch (error.code) {
        case '23505': // Unique violation
          return 'Este registro ya existe'
        case '23503': // Foreign key violation
          return 'Referencia inválida'
        case '42501': // Insufficient privilege
          return 'No tienes permisos para esta acción'
        case 'PGRST116': // No rows returned
          return 'Registro no encontrado'
        default:
          return 'Error en la operación'
      }
    }
    
    // Errores de autenticación
    if (error.message?.includes('Invalid login credentials')) {
      return 'Usuario o contraseña incorrectos'
    }
    
    return error.message || 'Ha ocurrido un error'
  }
}