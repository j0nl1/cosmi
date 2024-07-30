import { fromUtf8, toUtf8 } from '../utils/encoding.js'

import { MsgExecuteContract } from 'cosmjs-types/cosmwasm/wasm/v1/tx.js'
import { Any } from 'cosmjs-types/google/protobuf/any.js'
import type { Coin } from '../types/coin.js'

export type ExecuteAminoMsg = {
  sender: string
  contract: string
  msg: any
  funds: Coin[]
}

const msgs = {
  '/cosmwasm.wasm.v1.MsgExecuteContract': {
    toAmino: (msg: Uint8Array) => {
      const { msg: message, ...rest } = MsgExecuteContract.decode(msg)
      return {
        type: 'wasm/MsgExecuteContract',
        value: {
          ...rest,
          msg: JSON.parse(fromUtf8(message)),
        },
      }
    },
  },
  'wasm/MsgExecuteContract': {
    fromAmino: ({ sender, contract, msg, funds }: ExecuteAminoMsg): Any =>
      Any.fromPartial({
        typeUrl: MsgExecuteContract.typeUrl,
        value: MsgExecuteContract.encode({
          sender,
          contract,
          msg: toUtf8(JSON.stringify(msg)),
          funds: [...funds],
        }).finish(),
      }),
  },
}

export { msgs }
