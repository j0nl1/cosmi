import type { Prettify } from 'viem'

export type TxParameteres<T = unknown> = Prettify<
  T & {
    gasLimit?: bigint
    memo?: string
    timeoutHeight?: bigint
  }
>

export type TxMessage = {
  typeUrl: string
  value: Uint8Array
}
