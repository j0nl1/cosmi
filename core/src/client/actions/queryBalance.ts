import {
  QueryBalanceRequest,
  QueryBalanceResponse,
} from 'cosmjs-types/cosmos/bank/v1beta1/query.js'
import { queryAbci } from './base/queryAbci.js'

import type {
  Account,
  Chain,
  Client,
  Coin,
  CometBftRpcSchema,
  Prettify,
  Transport,
} from '../../types/index.js'

export type QueryBalanceParameters = Prettify<
  QueryBalanceRequest & {
    height?: number
  }
>

export type QueryBalanceReturnType = Promise<Coin | undefined>

export async function queryBalance<
  C extends Chain | undefined,
  A extends Account | undefined = Account | undefined,
>(
  client: Client<Transport, C, A, CometBftRpcSchema>,
  parameters: QueryBalanceParameters,
): QueryBalanceReturnType {
  const { height = 0, ...query } = parameters

  const { value } = await queryAbci(client, {
    path: '/cosmos.bank.v1beta1.Query/Balance',
    data: QueryBalanceRequest.encode(query).finish(),
    height,
    prove: false,
  })

  const { balance } = QueryBalanceResponse.decode(value)
  return balance
}
