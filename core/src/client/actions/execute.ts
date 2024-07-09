import { toUtf8 } from '../../utils/encoding.js'
import { MsgExecuteContract } from 'cosmjs-types/cosmwasm/wasm/v1/tx.js'

import type {
  Account,
  Chain,
  Client,
  Coin,
  CometBftRpcSchema,
  JsonValue,
  Transport,
  TxParameteres,
} from '../../types/index.js'

import { signAndBroadcastTx } from './base/signAndBroadcast.js'
import type { broadcastTxReturnType } from './base/broadcastTx.js'

export type ExecuteMsg = {
  address: string
  message: JsonValue
  funds?: Coin[]
}

export type ExecuteMultipleParameters = TxParameteres<{
  sender: string
  execute: ExecuteMsg[]
  gasLimit?: bigint
}>

export type ExecuteParameters = TxParameteres<{
  sender: string
  execute: ExecuteMsg
}>

export type ExecuteReturnType = broadcastTxReturnType
export type ExecuteMultipleReturnType = broadcastTxReturnType

export async function execute<
  C extends Chain | undefined,
  A extends Account | undefined = Account | undefined,
>(
  client: Client<Transport, C, A, CometBftRpcSchema>,
  parameters: ExecuteParameters,
): ExecuteReturnType {
  const { execute, sender, gasLimit, memo, timeoutHeight } = parameters
  return await executeMultiple(client, {
    sender,
    gasLimit,
    memo,
    timeoutHeight,
    execute: [execute],
  })
}

export async function executeMultiple<
  C extends Chain | undefined,
  A extends Account | undefined = Account | undefined,
>(
  client: Client<Transport, C, A, CometBftRpcSchema>,
  parameters: ExecuteMultipleParameters,
): ExecuteMultipleReturnType {
  const { sender, execute, gasLimit, memo, timeoutHeight } = parameters
  const msgs = execute.map(({ address, message, funds }) => ({
    typeUrl: MsgExecuteContract.typeUrl,
    value: MsgExecuteContract.encode({
      sender,
      contract: address,
      msg: toUtf8(JSON.stringify(message)),
      funds: funds || [],
    }).finish(),
  }))

  return await signAndBroadcastTx(client, {
    messages: msgs,
    sender,
    memo,
    gasLimit,
    timeoutHeight,
  })
}
