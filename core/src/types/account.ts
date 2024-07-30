import type { Account as AccountViem } from 'viem'
import type { Base64 } from './encoding.js'
import type { AminoSignDoc, SignDoc } from './signature.js'

export type AccountData = {
  address: string
  algo: string
  pubkey: Uint8Array
}

export type Account =
  | AccountViem
  | {
      address: `0x${string}`
      type: 'json-rpc'
      getSigner: (chainId: string) =>
        | {
            getAccounts: () => Promise<AccountData[]>
            signAmino: (
              signer: string,
              doc: AminoSignDoc,
            ) => Promise<{
              signature: { signature: Base64 }
              signed: AminoSignDoc
            }>
          }
        | {
            getAccounts: () => Promise<AccountData[]>
            signDirect: (
              signer: string,
              doc: SignDoc,
            ) => Promise<{
              signature: { signature: Base64 }
              signed: SignDoc
            }>
          }
    }
