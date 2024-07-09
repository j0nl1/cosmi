'use client'

import { getPublicClient, watchPublicClient } from 'cosmi/store'
import { useSyncExternalStoreWithSelector } from 'use-sync-external-store/shim/with-selector.js'
import { useConfig } from 'wagmi'

import type { Config } from 'cosmi/types'
import type { PublicClient } from 'cosmi'

type UsePublicClientParameters = {
  config?: Config
  chainId?: string
}

type UsePublicClientReturnType = PublicClient

export function usePublicClient(
  parameters: UsePublicClientParameters = {},
): UsePublicClientReturnType {
  const config = useConfig<Config>(parameters)

  return useSyncExternalStoreWithSelector(
    (onChange) => watchPublicClient(config, { onChange }),
    () => getPublicClient(config, parameters),
    () => getPublicClient(config, parameters),
    (x) => x,
    (a, b) => a?.uid === b?.uid,
  ) as PublicClient
}
