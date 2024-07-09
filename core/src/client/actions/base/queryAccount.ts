import { queryAbci } from './queryAbci.js'

import type {
  Transport,
  CometBftRpcSchema,
  Account,
  Chain,
  Client,
} from '../../../types/index.js'
import { toBaseAccount } from './toBaseAccount.js'

import {
  QueryAccountRequest,
  QueryAccountResponse,
} from 'cosmjs-types/cosmos/auth/v1beta1/query.js'

import type { BaseAccount } from 'cosmjs-types/cosmos/auth/v1beta1/auth.js'

export type QueryAccountParameters = {
  height?: number
  address: string
}

export type QueryAccountReturnType = Promise<BaseAccount>

export async function queryAccount<
  C extends Chain | undefined,
  A extends Account | undefined = Account | undefined,
>(
  client: Client<Transport, C, A, CometBftRpcSchema>,
  parameters: QueryAccountParameters,
): QueryAccountReturnType {
  const { height = 0, address } = parameters

  const { value } = await queryAbci(client, {
    path: '/cosmos.auth.v1beta1.Query/Account',
    data: QueryAccountRequest.encode(
      QueryAccountRequest.fromPartial({ address }),
    ).finish(),
    height,
    prove: false,
  })

  const { account } = QueryAccountResponse.decode(value)
  if (!account) throw new Error(`Account not found for address: ${address}`)
  return toBaseAccount(account)
}
