import { queryChainStatus } from './queryChainStatus.js'
import { fromBase64 } from '../../../utils/encoding.js'

import { broadcastTx, type broadcastTxReturnType } from './broadcastTx.js'

import type {
  Chain,
  Account,
  Client,
  Transport,
  CometBftRpcSchema,
  TxMessage,
} from '../../../types/index.js'

import { simulate } from './simulate.js'

import { queryAccount } from './queryAccount.js'
import { AuthInfo, TxBody, TxRaw } from 'cosmjs-types/cosmos/tx/v1beta1/tx.js'
import { SignMode } from 'cosmjs-types/cosmos/tx/signing/v1beta1/signing.js'
import { Any } from 'cosmjs-types/google/protobuf/any.js'

export type SignAndBroadcastTxParameters = {
  sender: string
  memo?: string
  messages: TxMessage[]
  timeoutHeight?: bigint
  gasLimit?: bigint
}

export type SignAndBroadcastTxReturnType = Promise<broadcastTxReturnType>

export async function signAndBroadcastTx<
  C extends Chain | undefined,
  A extends Account | undefined = Account | undefined,
>(
  client: Client<Transport, C, A, CometBftRpcSchema>,
  parameters: SignAndBroadcastTxParameters,
): SignAndBroadcastTxReturnType {
  if (!client.account) throw new Error('Account not found in client')
  if (!client.chain?.custom) throw new Error('Custom values are not provided')

  const { sender, messages, memo, timeoutHeight, gasLimit: gas } = parameters

  const chainId = await (async () => {
    if (client.chain?.id) return client.chain.id
    const { node_info } = await queryChainStatus(client)
    return node_info.network
  })()

  const txBody = TxBody.fromPartial({
    timeoutHeight: timeoutHeight ?? BigInt(0),
    messages: messages.map((message) =>
      Any.fromPartial({ typeUrl: message.typeUrl, value: message.value }),
    ),
    memo,
  })

  const { accountNumber, sequence, pubKey } = await queryAccount(client, {
    address: sender,
  })

  if (!pubKey) throw new Error(`PubKey not found for address: ${sender}`)

  const simulation = await simulate(client, {
    publicKey: pubKey,
    sequence,
    txBody,
  })

  const { gasLimit, gasAmount } = (() => {
    const { gasUsed } = simulation.gasInfo!
    const scale = client.chain?.fees?.baseFeeMultiplier ?? 1n
    const gasLimit = gas ?? Math.round(Number(gasUsed) * Number(scale))

    const denomAmount = Number(gasLimit) * client.chain.custom.gasSteps.default

    return {
      gasLimit: typeof gasLimit === 'bigint' ? gasLimit : BigInt(gasLimit),
      gasAmount: denomAmount,
    }
  })()

  if ('signTx' in client.account) {
    const { signed, signature: signedSignature } = await client.account.signTx(
      sender,
      {
        chainId: chainId.toString(),
        bodyBytes: TxBody.encode(txBody).finish(),
        authInfoBytes: AuthInfo.encode(
          AuthInfo.fromPartial({
            signerInfos: [
              {
                publicKey: pubKey,
                modeInfo: { single: { mode: SignMode.SIGN_MODE_DIRECT } },
                sequence,
              },
            ],
            fee: {
              gasLimit,
              amount: [
                {
                  denom: client.chain.nativeCurrency.name,
                  amount: gasAmount.toString(),
                },
              ],
            },
          }),
        ).finish(),
        accountNumber,
      },
    )

    const { signature } = signedSignature

    return await broadcastTx(client, {
      mode: 'sync',
      tx: TxRaw.encode({
        authInfoBytes: signed.authInfoBytes,
        bodyBytes: signed.bodyBytes,
        signatures: [fromBase64(signature)],
      }).finish(),
    })
  }

  throw new Error('Account does not support signing transactions')
}
