import { defineChain as viemDefineChain } from "viem";
import type { Chain } from "../types/chain.js";

export function defineChain<chain extends Omit<Chain, "id"> & { id: string }>(
	chain: chain,
) {
	return viemDefineChain<Record<string, unknown>, Chain>(
		chain as unknown as Chain,
	);
}
