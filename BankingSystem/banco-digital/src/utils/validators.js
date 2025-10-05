// src/utils/validators.js
export const validators = {
  email: (email) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return regex.test(email)
  },

  password: (password) => {
    // Mínimo 8 caracteres, una mayúscula, una minúscula, un número
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/
    return regex.test(password)
  },

  amount: (amount) => {
    return !isNaN(amount) && parseFloat(amount) > 0
  },

  accountNumber: (number) => {
    // Validar CLABE (18 dígitos en México)
    return /^\d{18}$/.test(number)
  }
}