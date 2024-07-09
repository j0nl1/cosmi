import { withRetry } from 'viem'
import type {
  TxData,
  Chain,
  Account,
  Client,
  Transport,
  CometBftRpcSchema,
} from '../../../types/index.js'

import { toBase64 } from '../../../utils/encoding.js'

export type broadcastTxParameters = {
  mode: 'commit' | 'sync' | 'async'
  tx: Uint8Array
}

export type broadcastTxReturnType = Promise<{ hash: string } | TxData>

const modes = {
  commit: 'broadcast_tx_commit',
  sync: 'broadcast_tx_sync',
  async: 'broadcast_tx_async',
} as const

export async function broadcastTx<
  C extends Chain | undefined,
  A extends Account | undefined = Account | undefined,
>(
  client: Client<Transport, C, A, CometBftRpcSchema>,
  parameters: broadcastTxParameters,
): broadcastTxReturnType {
  const { tx, mode } = parameters

  const response = await client.request({
    method: modes[mode],
    params: { tx: toBase64(tx) },
  })

  if (mode === 'async') return { hash: response.hash as string }

  const { txs } = await withRetry(
    async () => {
      const result = await client.request({
        method: 'tx_search',
        params: {
          query: `tx.hash='${response.hash}'`,
        },
      })
      if (!result.txs.length) throw new Error('Transaction not found')
      return result
    },
    { delay: 2500, retryCount: 30 },
  )

  const [{ tx_result: result }] = txs

  if (!result || result.code !== 0) {
    throw new Error(
      `Failed to broadcast transaction: ${result.log} (code ${result.code}) in codespace ${result.codespace}`,
    )
  }

  return result
}
