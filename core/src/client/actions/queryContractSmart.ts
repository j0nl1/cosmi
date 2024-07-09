import { queryAbci } from './base/queryAbci.js'

import type {
  Transport,
  CometBftRpcSchema,
  Account,
  Chain,
  Client,
  JsonObject,
} from '../../types/index.js'

import { fromUtf8, toUtf8 } from '../../utils/encoding.js'

import {
  QuerySmartContractStateRequest,
  QuerySmartContractStateResponse,
} from 'cosmjs-types/cosmwasm/wasm/v1/query.js'

export type QueryContractSmartParameters = {
  address: string
  msg: JsonObject
  height?: number
}

export type QueryContractSmartReturnType<R = any> = Promise<R>

export async function queryContractSmart<
  R extends any | undefined,
  C extends Chain | undefined,
  A extends Account | undefined = Account | undefined,
>(
  client: Client<Transport, C, A, CometBftRpcSchema>,
  parameters: QueryContractSmartParameters,
): QueryContractSmartReturnType<R> {
  const { height = 0, address, msg } = parameters

  const { value } = await queryAbci(client, {
    path: '/cosmwasm.wasm.v1.Query/SmartContractState',
    data: QuerySmartContractStateRequest.encode({
      address,
      queryData: toUtf8(JSON.stringify(msg)),
    }).finish(),
    height,
    prove: false,
  })

  const { data } = QuerySmartContractStateResponse.decode(value)
  return JSON.parse(fromUtf8(data)) as R
}
