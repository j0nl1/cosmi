import { ConnectorUnavailableReconnectingError } from 'wagmi'

import type {
  Client,
  Config,
  Connection,
  Connector,
} from '../../types/index.js'

import { stringToPadNumber } from '../../utils/encoding.js'
import { createPublicClient, type PublicClient } from '../../client/clients.js'
import { http } from '../../transports/http.js'

export type GetConnectorClientParameters = {
  chainId?: string
  connector?: Connector
}

export type GetConnectorClientReturnType = PublicClient | any

export async function getConnectorClient<C extends Config>(
  config: C,
  parameters: GetConnectorClientParameters = {},
): Promise<GetConnectorClientReturnType> {
  let connection: Connection | undefined
  if (parameters.connector) {
    const { connector } = parameters
    if (
      config.state.status === 'reconnecting' &&
      !connector.getAccounts &&
      !connector.getChainId
    ) {
      throw new ConnectorUnavailableReconnectingError({ connector })
    }

    const [accounts, chainId] = await Promise.all([
      connector.getAccounts(),
      connector.getChainId(),
    ])
    connection = {
      accounts: accounts as any,
      chainId,
      connector,
    }
  } else connection = config.state.connections.get(config.state.current!)
  if (!connection) throw new Error('Connection not found')

  const chainId = parameters.chainId
    ? stringToPadNumber(parameters.chainId)
    : connection.chainId

  const connectorChainId = await connection.connector.getChainId()
  if (connectorChainId !== connection.chainId) {
    throw new Error('ConnectorChainIdMismatchError')
  }

  const connector = connection.connector
  if (connector.getClient) return connector.getClient({ chainId })

  const chain = config.chains.find((chain) => chain.id === chainId)
  /*   const provider = (await connection.connector.getProvider()) as {
    request(...args: any): Promise<any>
  } */

  return createPublicClient({
    chain: chain,
    name: 'Connector Client',
    transport: (opts) => http()({ ...opts, retryCount: 0 }),
  })
}
