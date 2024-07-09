import { getConnectorClient } from "./getConnectorClient.js";

import type { Config, Connector } from "../../types/index.js";
import { signingActions } from "../../client/signing.js";
import type { SigningClient } from "../../client/clients.js";

export type GetWalletClientParameters = {
  connector?: Connector;
  chainId?: string;
};

export async function getSigningClient<C extends Config>(
  config: C,
  parameters: GetWalletClientParameters = {},
): Promise<SigningClient> {
  const client = await getConnectorClient(config, parameters);
  return client.extend(signingActions);
}
