export type Base64 = string
export type Hex = string
export type JsonObject = { [key: string]: JsonValue }

export type JsonValue =
  | JsonObject
  | JsonValue[]
  | string
  | number
  | boolean
  | undefined
  | null
