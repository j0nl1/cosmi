import {
  QueryDenomMetadataRequest,
  QueryDenomMetadataResponse,
} from 'cosmjs-types/cosmos/bank/v1beta1/query.js'
import { queryAbci } from './base/queryAbci.js'

import type {
  Transport,
  CometBftRpcSchema,
  Account,
  Chain,
  Prettify,
  Client,
} from '../../types/index.js'

export type QueryDenomMetadataParameters = Prettify<
  QueryDenomMetadataRequest & {
    height?: number
  }
>

export type QueryDenomMetadataReturnType = Promise<QueryDenomMetadataResponse>

export async function queryDenomMetadata<
  C extends Chain | undefined,
  A extends Account | undefined = Account | undefined,
>(
  client: Client<Transport, C, A, CometBftRpcSchema>,
  parameters: QueryDenomMetadataParameters,
): QueryDenomMetadataReturnType {
  const { height = 0, ...query } = parameters

  const { value } = await queryAbci(client, {
    path: '/cosmos.bank.v1beta1.Query/DenomMetadata',
    data: QueryDenomMetadataRequest.encode(query).finish(),
    height,
    prove: false,
  })

  return QueryDenomMetadataResponse.decode(value)
}
