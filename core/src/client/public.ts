import type { Account, Chain, Client, Transport } from '../types/index.js'

import {
  queryChainStatus,
  type QueryChainStatusReturnType,
} from './actions/base/queryChainStatus.js'

import {
  queryAbci,
  type QueryAbciParameters,
  type QueryAbciReturnType,
} from './actions/base/queryAbci.js'

import {
  queryContractSmart,
  type QueryContractSmartParameters,
  type QueryContractSmartReturnType,
} from './actions/queryContractSmart.js'

import {
  queryAccount,
  type QueryAccountParameters,
  type QueryAccountReturnType,
} from './actions/base/queryAccount.js'

import {
  queryAllBalances,
  type QueryAllBalancesParameters,
  type QueryAllBalancesReturnType,
} from './actions/queryAllBalances.js'

import {
  queryDenomMetadata,
  type QueryDenomMetadataParameters,
  type QueryDenomMetadataReturnType,
} from './actions/queryDenomMetadata.js'

export type PublicActions<
  _transport extends Transport = Transport,
  _chain extends Chain | undefined = Chain | undefined,
  _account extends Account | undefined = Account | undefined,
> = {
  queryAbci: (args: QueryAbciParameters) => QueryAbciReturnType
  queryChainStatus: () => QueryChainStatusReturnType
  queryAccount: (args: QueryAccountParameters) => QueryAccountReturnType
  queryContractSmart: <R = any>(
    args: QueryContractSmartParameters,
  ) => QueryContractSmartReturnType<R>
  queryAllBalances: (
    args: QueryAllBalancesParameters,
  ) => QueryAllBalancesReturnType
  queryDenomMetadata: (
    args: QueryDenomMetadataParameters,
  ) => QueryDenomMetadataReturnType
}

export function publicActions<
  transport extends Transport = Transport,
  chain extends Chain | undefined = Chain | undefined,
  account extends Account | undefined = Account | undefined,
>(
  client: Client<transport, chain, account>,
): PublicActions<transport, chain, account> {
  return {
    queryChainStatus: () => queryChainStatus(client),
    queryAbci: (args) => queryAbci(client, args),
    queryAccount: (args) => queryAccount(client, args),
    queryContractSmart: (args) => queryContractSmart(client, args),
    queryAllBalances: (args) => queryAllBalances(client, args),
    queryDenomMetadata: (args) => queryDenomMetadata(client, args),
  }
}
