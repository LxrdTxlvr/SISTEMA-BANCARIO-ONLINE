// src/hooks/useAccounts.js
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { accountService } from '../services/accountService'

export const useAccounts = () => {
  const queryClient = useQueryClient()

  const { data: accounts, isLoading, error } = useQuery({
    queryKey: ['accounts'],
    queryFn: accountService.getUserAccounts
  })

  const createAccountMutation = useMutation({
    mutationFn: accountService.createAccount,
    onSuccess: () => {
      queryClient.invalidateQueries(['accounts'])
    }
  })

  return {
    accounts,
    isLoading,
    error,
    createAccount: createAccountMutation.mutate
  }
}