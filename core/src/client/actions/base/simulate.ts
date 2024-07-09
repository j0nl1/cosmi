import { queryAbci } from './queryAbci.js'

import type {
  Transport,
  CometBftRpcSchema,
  Account,
  Chain,
  Client,
} from '../../../types/index.js'

import {
  AuthInfo,
  Fee,
  Tx,
  type TxBody,
} from 'cosmjs-types/cosmos/tx/v1beta1/tx.js'

import { SignMode } from 'cosmjs-types/cosmos/tx/signing/v1beta1/signing.js'

import {
  SimulateRequest,
  SimulateResponse,
} from 'cosmjs-types/cosmos/tx/v1beta1/service.js'

import type { Any } from 'cosmjs-types/google/protobuf/any.js'

export type SimulateParameters = {
  txBody: TxBody
  publicKey: Any
  sequence: bigint
}

export type SimulateReturnType = Promise<SimulateResponse>

export async function simulate<
  C extends Chain | undefined,
  A extends Account | undefined = Account | undefined,
>(
  client: Client<Transport, C, A, CometBftRpcSchema>,
  parameters: SimulateParameters,
): SimulateReturnType {
  const { sequence, txBody, publicKey } = parameters

  const tx = Tx.fromPartial({
    authInfo: AuthInfo.fromPartial({
      fee: Fee.fromPartial({}),
      signerInfos: [
        {
          publicKey,
          sequence,
          modeInfo: { single: { mode: SignMode.SIGN_MODE_UNSPECIFIED } },
        },
      ],
    }),
    body: txBody,
    signatures: [new Uint8Array()],
  })

  const { value } = await queryAbci(client, {
    path: '/cosmos.tx.v1beta1.Service/Simulate',
    data: SimulateRequest.encode({
      txBytes: Tx.encode(tx).finish(),
    }).finish(),
    prove: false,
  })

  return SimulateResponse.decode(value)
}
