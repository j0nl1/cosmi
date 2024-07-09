import { publicActions } from '../../client/public.js'
import { stringToPadNumber } from '../../utils/encoding.js'

import type { Client, Config } from '../../types/index.js'

export type GetPublicClientParameters = {
  chainId?: string
}

export type GetPublicClientReturnType = Client

export function getPublicClient<config extends Config>(
  config: config,
  parameters: GetPublicClientParameters = {},
): GetPublicClientReturnType {
  const chainId = parameters.chainId
    ? stringToPadNumber(parameters.chainId)
    : undefined

  return config.getClient({ chainId }).extend(publicActions)
}
