'use client'

import { useQuery } from '@tanstack/react-query'
import { getSigningClient } from 'cosmi/store'
import { useAccount, useConfig } from 'wagmi'

import type { Config } from 'cosmi/types'
import type { SigningClient } from 'cosmi'

import type { UseQueryResult } from '@tanstack/react-query'

export function useSigningClient(): UseQueryResult<SigningClient> {
  const config = useConfig<Config>()
  const { isConnected, addresses } = useAccount()
  return useQuery<SigningClient>({
    enabled: isConnected,
    queryKey: ['signingClient', addresses],
    queryFn: () => getSigningClient(config),
  })
}
