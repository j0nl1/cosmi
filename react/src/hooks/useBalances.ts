'use client'

import { useQuery } from '@tanstack/react-query'

import { useAccount } from 'wagmi'
import { usePublicClient } from './usePublicClient.js'

import type { Coin, Config } from 'cosmi/types'

type UseBalancesParameters = {
  config?: Config
  address?: string
}

export function useBalances(parameters: UseBalancesParameters = {}) {
  const { address } = parameters.address ? parameters : useAccount()

  const client = usePublicClient(parameters)

  return useQuery<Coin[]>({
    enabled: Boolean(address),
    queryKey: ['balances', address],
    queryFn: () => client.queryAllBalances({ address: address! }),
  })
}
