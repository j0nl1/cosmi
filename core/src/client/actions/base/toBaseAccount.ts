import { BaseAccount } from 'cosmjs-types/cosmos/auth/v1beta1/auth.js'

import type { Any } from 'cosmjs-types/google/protobuf/any.js'

const ERR_UNKNOWN_ACCOUNT_TYPE = 'Unknown account type'

/**
 * Parses an `Any` protobuf message and returns the `BaseAccount`. Throws if unable
 * to parse correctly.
 */
export function toBaseAccount({ typeUrl, value }: Any): any {
  switch (typeUrl) {
    case '/cosmos.auth.v1beta1.BaseAccount':
      return BaseAccount.decode(value)

    default: {
      throw new Error(`${ERR_UNKNOWN_ACCOUNT_TYPE}: ${typeUrl.slice(1)}`)
    }
  }
}
