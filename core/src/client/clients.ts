import {
  type ClientConfig,
  type RpcSchema,
  createClient as viemCreateClient,
} from 'viem'

import type {
  Account,
  Chain,
  Client,
  CometBftRpcSchema,
  Prettify,
  Transport,
} from '../types/index.js'

import { publicActions, type PublicActions } from './public.js'
import { signingActions, type SigningActions } from './signing.js'

export function createBaseClient<
  T extends Transport,
  C extends Chain | undefined = undefined,
  A extends Account | undefined = undefined,
  R extends RpcSchema | undefined = undefined,
>(params: ClientConfig<T, C, A, R>) {
  return viemCreateClient<T, C, A, R>(params)
}

export type PublicClient<
  transport extends Transport = Transport,
  chain extends Chain | undefined = Chain | undefined,
  account extends Account | undefined = undefined,
  rpcSchema extends RpcSchema | undefined = undefined,
> = Prettify<
  Client<
    transport,
    chain,
    account,
    rpcSchema extends RpcSchema
      ? [...CometBftRpcSchema, ...rpcSchema]
      : CometBftRpcSchema,
    PublicActions<transport, chain>
  >
>

export type PublicClientConfig<
  T extends Transport = Transport,
  C extends Chain | undefined = Chain | undefined,
  A extends Account | undefined = undefined,
  R extends RpcSchema | undefined = undefined,
> = Prettify<
  Pick<
    ClientConfig<T, C, A, R>,
    | 'batch'
    | 'cacheTime'
    | 'ccipRead'
    | 'chain'
    | 'account'
    | 'key'
    | 'name'
    | 'pollingInterval'
    | 'rpcSchema'
    | 'transport'
  >
>

export function createPublicClient<
  T extends Transport,
  C extends Chain | undefined = undefined,
  A extends Account | undefined = undefined,
  R extends RpcSchema | undefined = undefined,
>(parameters: PublicClientConfig<T, C, A, R>): PublicClient<T, C, A, R> {
  const { key = 'public', name = 'Public Client' } = parameters

  const client = createBaseClient({
    ...parameters,
    key,
    name,
    type: 'publicClient',
  })
  return client.extend(publicActions) as PublicClient<T, C, A, R>
}

export type SigningClient<
  transport extends Transport = Transport,
  chain extends Chain | undefined = Chain | undefined,
  account extends Account | undefined = undefined,
  rpcSchema extends RpcSchema | undefined = undefined,
> = Prettify<
  Client<
    transport,
    chain,
    account,
    rpcSchema extends RpcSchema
      ? [...CometBftRpcSchema, ...rpcSchema]
      : CometBftRpcSchema,
    PublicActions<transport, chain> & SigningActions<transport, chain>
  >
>

export function createSigningClient<
  T extends Transport,
  C extends Chain | undefined = undefined,
  A extends Account | undefined = undefined,
  R extends RpcSchema | undefined = undefined,
>(parameters: PublicClientConfig<T, C, A, R>): SigningClient<T, C, A, R> {
  const { key = 'signing', name = 'Signing Client' } = parameters
  const client = createBaseClient({
    ...parameters,
    key,
    name,
    type: 'signingClient',
  })

  return (client.extend(publicActions) as PublicClient<T, C, A, R>).extend(
    signingActions,
  ) as SigningClient<T, C, A, R>
}
