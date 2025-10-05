// src/utils/encryption.js
import CryptoJS from 'crypto-js'

const SECRET_KEY = process.env.VITE_ENCRYPTION_KEY

export const encryption = {
  encrypt(data) {
    return CryptoJS.AES.encrypt(JSON.stringify(data), SECRET_KEY).toString()
  },

  decrypt(ciphertext) {
    const bytes = CryptoJS.AES.decrypt(ciphertext, SECRET_KEY)
    return JSON.parse(bytes.toString(CryptoJS.enc.Utf8))
  },

  hashPassword(password) {
    return CryptoJS.SHA256(password).toString()
  }
}