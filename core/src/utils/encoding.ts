import type { Base64, Hex } from '../types/encoding.js'

export function toUtf8(str: string): Uint8Array {
  return new TextEncoder().encode(str)
}

export function fromUtf8(data: Uint8Array, lossy = false): string {
  const fatal = !lossy
  return new TextDecoder('utf-8', { fatal }).decode(data)
}

export function toBase64(bytes: Uint8Array): Base64 {
  const bitString = String.fromCharCode(...bytes)
  return btoa(bitString)
}

export function fromBase64(base64: string): Uint8Array {
  if (
    !base64.match(
      /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/,
    )
  ) {
    throw new Error('Invalid base64 string format')
  }
  return Uint8Array.from(atob(base64), (c) => c.charCodeAt(0))
}

export function toHex(bytes: Uint8Array, prefixed = false): Hex {
  let hexStr = ''
  for (let i = 0; i < bytes.length; i++) {
    hexStr += bytes[i].toString(16).padStart(2, '0')
  }
  return prefixed ? `0x${hexStr}` : hexStr
}

export function fromHex(hex: Hex): Uint8Array {
  const hexStr = hex.startsWith('0x') ? hex.substring(2) : hex
  if (hexStr.length % 2 !== 0) {
    throw new Error('hex string has an odd length')
  }
  const bytes = new Uint8Array(hexStr.length / 2)
  for (let i = 0, j = 0; i < hexStr.length; i += 2, j++) {
    const hexByteString = hexStr.substring(i, i + 2)
    if (!hexByteString.match(/[0-9a-f]{2}/i)) {
      throw new Error('invalid hex byte')
    }
    bytes[j] = Number.parseInt(hexByteString, 16)
  }
  return bytes
}

export function stringToPadNumber(str: string): number {
  return Number(
    str
      .split('')
      .map((char) => char.charCodeAt(0).toString().padStart(3, '0'))
      .join(''),
  )
}

export function padNumberToString(num: string | number): string {
  const numStr = num.toString()
  return Array.from({ length: numStr.length / 3 }, (_, i) =>
    String.fromCharCode(Number.parseInt(numStr.slice(i * 3, i * 3 + 3), 10)),
  ).join('')
}
