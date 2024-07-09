import type {
  Chain,
  CometBftRpcSchema,
  Transport,
  Account,
  Client,
} from '../../../types/index.js'

export type QueryChainStatusReturnType = Promise<
  CometBftRpcSchema[13]['ReturnType']
>

export async function queryChainStatus<
  C extends Chain | undefined,
  A extends Account | undefined = Account | undefined,
>(
  client: Client<Transport, C, A, CometBftRpcSchema>,
): QueryChainStatusReturnType {
  return await client.request({ method: 'status' })
}
