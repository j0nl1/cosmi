import { toHex, fromBase64 } from '../../../utils/encoding.js'

import type {
  Chain,
  CometBftRpcSchema,
  QueryAbciResponse,
  Transport,
  Account,
  Client,
  Prettify,
} from '../../../types/index.js'

export type QueryAbciParameters = {
  path: string
  data: Uint8Array
  prove?: false
  height?: number
}

export type QueryAbciReturnType = Promise<
  Prettify<Omit<QueryAbciResponse, 'value'>> & { value: Uint8Array }
>

export async function queryAbci<
  C extends Chain | undefined,
  A extends Account | undefined = Account | undefined,
>(
  client: Client<Transport, C, A, CometBftRpcSchema>,
  parameters: QueryAbciParameters,
): QueryAbciReturnType {
  const { path, data, height = 0 } = parameters

  const { response } = await client.request({
    method: 'abci_query',
    params: {
      path,
      height: height.toString(),
      data: toHex(data),
      prove: false,
    },
  })

  if (response.code === 0) {
    return {
      ...response,
      value: fromBase64(response.value ?? ''),
    }
  }

  throw new Error(
    `query failed in codespace: ${response.codespace}, code: ${response.code}, log: ${response.log}`,
  )
}
