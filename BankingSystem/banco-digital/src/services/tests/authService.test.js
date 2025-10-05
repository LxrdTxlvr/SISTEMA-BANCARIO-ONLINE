// src/services/__tests__/authService.test.js
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { authService } from '../authService'
import { supabase } from '../supabase'

vi.mock('../supabase')

describe('AuthService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should sign in with valid credentials', async () => {
    const mockUser = { id: '123', email: 'test@example.com' }
    supabase.auth.signInWithPassword.mockResolvedValue({
      data: { user: mockUser },
      error: null
    })

    const result = await authService.signIn('test@example.com', 'password123')
    
    expect(result.user).toEqual(mockUser)
    expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123'
    })
  })

  it('should throw error on invalid credentials', async () => {
    supabase.auth.signInWithPassword.mockResolvedValue({
      data: null,
      error: { message: 'Invalid credentials' }
    })

    await expect(
      authService.signIn('test@example.com', 'wrongpassword')
    ).rejects.toThrow()
  })
})