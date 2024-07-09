import {
  QueryAllBalancesRequest,
  QueryAllBalancesResponse,
} from "cosmjs-types/cosmos/bank/v1beta1/query.js";
import { queryAbci } from "./base/queryAbci.js";

import type {
  Transport,
  CometBftRpcSchema,
  Account,
  Chain,
  Prettify,
  Client,
  Coin,
} from "../../types/index.js";

export type QueryAllBalancesParameters = Prettify<
  QueryAllBalancesRequest & {
    height?: number;
  }
>;

export type QueryAllBalancesReturnType = Promise<Coin[]>;

export async function queryAllBalances<
  C extends Chain | undefined,
  A extends Account | undefined = Account | undefined,
>(
  client: Client<Transport, C, A, CometBftRpcSchema>,
  parameters: QueryAllBalancesParameters,
): QueryAllBalancesReturnType {
  const { height = 0, ...query } = parameters;

  const { value } = await queryAbci(client, {
    path: "/cosmos.bank.v1beta1.Query/AllBalances",
    data: QueryAllBalancesRequest.encode(query).finish(),
    height,
    prove: false,
  });

  const { balances } = QueryAllBalancesResponse.decode(value);
  return balances;
}
