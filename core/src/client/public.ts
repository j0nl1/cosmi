import type { Account, Chain, Client, Transport } from '../types/index.js'

import {
  type QueryChainStatusReturnType,
  queryChainStatus,
} from './actions/base/queryChainStatus.js'

import {
  type QueryAbciParameters,
  type QueryAbciReturnType,
  queryAbci,
} from './actions/base/queryAbci.js'

import {
  type QueryContractSmartParameters,
  type QueryContractSmartReturnType,
  queryContractSmart,
} from './actions/queryContractSmart.js'

import {
  type QueryAccountParameters,
  type QueryAccountReturnType,
  queryAccount,
} from './actions/base/queryAccount.js'

import {
  type QueryAllBalancesParameters,
  type QueryAllBalancesReturnType,
  queryAllBalances,
} from './actions/queryAllBalances.js'

import {
  type QueryDenomMetadataParameters,
  type QueryDenomMetadataReturnType,
  queryDenomMetadata,
} from './actions/queryDenomMetadata.js'

import {
  type QueryBalanceParameters,
  type QueryBalanceReturnType,
  queryBalance,
} from './actions/queryBalance.js'

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
  queryBalance: (args: QueryBalanceParameters) => QueryBalanceReturnType
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
    queryBalance: (args) => queryBalance(client, args),
  }
}
