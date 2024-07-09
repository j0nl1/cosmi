import type { Config as WagmiConfig } from 'wagmi'
import type { Chain } from './chain.js'

export type Config = WagmiConfig<readonly [Chain, ...Chain[]]>
