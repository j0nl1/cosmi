import type { Account as AccountViem } from 'viem'
import type { SignDoc } from './signature.js'
import type { Base64 } from './encoding.js'

export type Account =
  | AccountViem
  | {
      address: `0x${string}`
      type: 'json-rpc'
      signTx: (
        signer: string,
        doc: SignDoc,
      ) => Promise<{
        signature: { signature: Base64 }
        signed: SignDoc
      }>
    }
