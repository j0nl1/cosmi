'use client'

import { createElement } from 'react'
import type { ResolvedRegister, State } from 'wagmi'
import { Hydrate, WagmiContext } from 'wagmi'

export type CosmiProviderProps = {
  config: ResolvedRegister['config']
  initialState?: State | undefined
  reconnectOnMount?: boolean | undefined
  children?: React.ReactNode | undefined
}

export const CosmiContext = WagmiContext

export const CosmiProvider: React.FC<CosmiProviderProps> = (
  parameters: CosmiProviderProps,
) => {
  const { children, config } = parameters

  const props = { value: config }
  return createElement(
    Hydrate,
    parameters,
    createElement(CosmiContext.Provider, props, children),
  )
}
