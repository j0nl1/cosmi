import type { Account, Chain, Client, Transport } from '../types/index.js'

import {
  execute,
  executeMultiple,
  type ExecuteMultipleParameters,
  type ExecuteMultipleReturnType,
  type ExecuteParameters,
  type ExecuteReturnType,
} from './actions/execute.js'

export type SigningActions<
  _transport extends Transport = Transport,
  _chain extends Chain | undefined = Chain | undefined,
  _account extends Account | undefined = Account | undefined,
> = {
  execute: (args: ExecuteParameters) => ExecuteReturnType
  executeMultiple: (
    args: ExecuteMultipleParameters,
  ) => ExecuteMultipleReturnType
}

export function signingActions<
  transport extends Transport = Transport,
  chain extends Chain | undefined = Chain | undefined,
  account extends Account | undefined = Account | undefined,
>(
  client: Client<transport, chain, account>,
): SigningActions<transport, chain, account> {
  return {
    execute: (args) => execute(client, args),
    executeMultiple: (args) => executeMultiple(client, args),
  }
}
