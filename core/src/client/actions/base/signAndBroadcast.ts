import { fromBase64 } from '../../../utils/encoding.js'
import { queryChainStatus } from './queryChainStatus.js'

import { broadcastTx, type broadcastTxReturnType } from './broadcastTx.js'

import type {
  Account,
  Chain,
  Client,
  CometBftRpcSchema,
  Transport,
  TxMessage,
} from '../../../types/index.js'

import { simulate } from './simulate.js'

import { PubKey } from 'cosmjs-types/cosmos/crypto/secp256k1/keys.js'
import { SignMode } from 'cosmjs-types/cosmos/tx/signing/v1beta1/signing.js'
import { AuthInfo, TxBody, TxRaw } from 'cosmjs-types/cosmos/tx/v1beta1/tx.js'
import { Any } from 'cosmjs-types/google/protobuf/any.js'
import { msgs } from '../../../amino/index.js'
import { queryAccount } from './queryAccount.js'

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

  const signer = await (async () => {
    if (!client.account) throw new Error('Account not found in client')
    if ('getSigner' in client.account) {
      return client.account.getSigner(chainId.toString())
    }
    throw new Error('Account does not support signing')
  })()

  const { accountNumber, sequence } = await queryAccount(client, {
    address: sender,
  })

  const [{ pubkey: key }] = await signer.getAccounts()

  const anyKey = Any.fromPartial({
    typeUrl: PubKey.typeUrl,
    value: PubKey.encode(PubKey.fromPartial({ key })).finish(),
  })

  const simulation = await simulate(client, {
    publicKey: anyKey,
    sequence,
    txBody,
  })

  const { gasLimit, gasAmount } = (() => {
    const { gasUsed } = simulation.gasInfo!
    const scale = client.chain?.fees?.baseFeeMultiplier ?? 1n
    const gasLimit = gas ?? Math.round(Number(gasUsed) * Number(scale))

    const denomAmount = Math.round(
      Number(gasLimit) * client.chain.custom.gasSteps.default,
    )

    return {
      gasLimit: typeof gasLimit === 'bigint' ? gasLimit : BigInt(gasLimit),
      gasAmount: denomAmount,
    }
  })()

  const { signed, signature } = await (async () => {
    if ('signDirect' in signer) {
      const { signed, signature } = await signer.signDirect(sender, {
        chainId: chainId.toString(),
        bodyBytes: TxBody.encode(txBody).finish(),
        authInfoBytes: AuthInfo.encode(
          AuthInfo.fromPartial({
            signerInfos: [
              {
                publicKey: anyKey,
                modeInfo: { single: { mode: SignMode.SIGN_MODE_DIRECT } },
                sequence,
              },
            ],
            fee: {
              gasLimit,
              amount: [
                {
                  denom: client.chain?.nativeCurrency.name,
                  amount: gasAmount.toString(),
                },
              ],
            },
          }),
        ).finish(),
        accountNumber,
      })
      return { signed, signature: signature.signature }
    }

    if ('signAmino' in signer) {
      const { signed, signature } = await signer.signAmino(sender, {
        chain_id: chainId.toString(),
        sequence: sequence.toString(),
        account_number: accountNumber.toString(),
        fee: {
          amount: [
            {
              denom: client.chain?.nativeCurrency.name as string,
              amount: gasAmount.toString(),
            },
          ],
          gas: gasLimit.toString(),
        },
        msgs: messages.map(({ typeUrl, value }) =>
          (
            msgs[typeUrl as keyof typeof msgs] as unknown as {
              toAmino: (v: Uint8Array) => {
                type: string
                value: any
              }
            }
          ).toAmino(value),
        ),
        memo: memo || '',
      })

      return {
        signed: {
          accountNumber,
          chainId: chainId.toString(),
          bodyBytes: TxBody.encode({
            ...txBody,
            messages: signed.msgs.map(({ type, value }) =>
              (
                msgs[type as keyof typeof msgs] as {
                  fromAmino: (v: unknown) => {
                    typeUrl: string
                    value: Uint8Array
                  }
                }
              ).fromAmino(value),
            ),
            memo: signed.memo,
          }).finish(),
          authInfoBytes: AuthInfo.encode(
            AuthInfo.fromPartial({
              fee: {
                amount: signed.fee.amount,
                gasLimit: BigInt(signed.fee.gas),
              },
              signerInfos: [
                {
                  publicKey: anyKey,
                  modeInfo: {
                    single: { mode: SignMode.SIGN_MODE_LEGACY_AMINO_JSON },
                  },
                  sequence,
                },
              ],
            }),
          ).finish(),
        },
        signature: signature.signature,
      }
    }
    throw new Error('Unsupported signer')
  })()

  return await broadcastTx(client, {
    mode: 'sync',
    tx: TxRaw.encode({
      authInfoBytes: signed.authInfoBytes,
      bodyBytes: signed.bodyBytes,
      signatures: [fromBase64(signature)],
    }).finish(),
  })
}
