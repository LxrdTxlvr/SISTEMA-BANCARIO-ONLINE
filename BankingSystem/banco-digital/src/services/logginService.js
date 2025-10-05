// src/services/loggingService.js
import { supabase } from './supabase'

export const loggingService = {
  async logSecurityEvent(eventType, details) {
    const user = await supabase.auth.getUser()
    
    // Obtener información del dispositivo
    const deviceInfo = {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language
    }
    
    // Registrar evento
    await supabase.from('security_logs').insert({
      user_id: user.data.user?.id,
      event_type: eventType,
      device_info: JSON.stringify(deviceInfo),
      ip_address: details.ip,
      location: details.location
    })
  },

  async logTransaction(transactionId, status) {
    console.log(`Transaction ${transactionId}: ${status}`)
    
    // En producción, usar servicio como Sentry o LogRocket
    if (process.env.NODE_ENV === 'production') {
      // Sentry.captureMessage(`Transaction ${transactionId}: ${status}`)
    }
  }
}