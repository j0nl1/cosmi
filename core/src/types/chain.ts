import type { Chain as ViemChain } from 'viem'

export type Chain = ViemChain<
  undefined,
  {
    registry?: {
      assets: string
      chain: string
    }
    gasSteps: {
      default: number
    }
  }
>
