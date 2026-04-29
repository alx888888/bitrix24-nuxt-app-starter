export type BitrixRuntimePayload = Record<string, unknown>

export function isBitrixRecord(value: unknown): value is BitrixRuntimePayload {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

export function toText(value: unknown): string {
  if (Array.isArray(value)) return toText(value[0])
  if (value === undefined || value === null) return ''
  return String(value)
}

function pickCaseInsensitive(payload: BitrixRuntimePayload, key: string) {
  if (payload[key] !== undefined) return payload[key]
  if (payload[key.toLowerCase()] !== undefined) return payload[key.toLowerCase()]
  if (payload[key.toUpperCase()] !== undefined) return payload[key.toUpperCase()]
  return undefined
}

export function pickBracketField(payload: BitrixRuntimePayload, namespace: string, key: string) {
  for (const candidate of [
    `${namespace}[${key}]`,
    `${namespace}[${key.toLowerCase()}]`,
    `${namespace.toUpperCase()}[${key}]`,
    `${namespace.toUpperCase()}[${key.toLowerCase()}]`
  ]) {
    if (payload[candidate] !== undefined) return payload[candidate]
  }

  return undefined
}

export function pickNestedField(payload: BitrixRuntimePayload, namespace: string, key: string) {
  const nested = payload[namespace] ?? payload[namespace.toLowerCase()] ?? payload[namespace.toUpperCase()]
  if (!isBitrixRecord(nested)) return undefined
  return pickCaseInsensitive(nested, key)
}

export function pickPayloadField(payload: BitrixRuntimePayload, key: string, namespaces: string[] = []) {
  const direct = pickCaseInsensitive(payload, key)
  if (direct !== undefined) return direct

  for (const namespace of namespaces) {
    const bracket = pickBracketField(payload, namespace, key)
    if (bracket !== undefined) return bracket
    const nested = pickNestedField(payload, namespace, key)
    if (nested !== undefined) return nested
  }

  return undefined
}

export function readBracketArray(payload: BitrixRuntimePayload, key: string) {
  const prefix = `${key}[`
  const entries = Object.entries(payload)
    .filter(([entryKey]) => entryKey.startsWith(prefix) && entryKey.endsWith(']'))
    .map(([entryKey, value]) => ({
      index: Number(entryKey.slice(prefix.length, -1)),
      value
    }))
    .filter((entry) => Number.isInteger(entry.index))
    .sort((left, right) => left.index - right.index)

  return entries.map((entry) => entry.value)
}

export function readPayloadArray(payload: BitrixRuntimePayload, key: string) {
  const direct = payload[key] ?? payload[key.toLowerCase()] ?? payload[key.toUpperCase()]
  if (Array.isArray(direct)) return direct
  const bracket = readBracketArray(payload, key)
  return bracket.length > 0 ? bracket : []
}

export function readPayloadObject(payload: BitrixRuntimePayload, namespace: string) {
  const output: BitrixRuntimePayload = {}
  const nested = payload[namespace] ?? payload[namespace.toLowerCase()] ?? payload[namespace.toUpperCase()]
  if (isBitrixRecord(nested)) {
    Object.assign(output, nested)
  }

  const bracketPrefix = `${namespace}[`
  const upperBracketPrefix = `${namespace.toUpperCase()}[`
  for (const [key, value] of Object.entries(payload)) {
    const matchingPrefix = key.startsWith(bracketPrefix)
      ? bracketPrefix
      : key.startsWith(upperBracketPrefix)
        ? upperBracketPrefix
        : ''
    if (!matchingPrefix || !key.endsWith(']')) continue
    output[key.slice(matchingPrefix.length, -1)] = value
  }

  return output
}

export function readBitrixAuthPayload(payload: BitrixRuntimePayload) {
  return readPayloadObject(payload, 'auth')
}

export function readBitrixProperties(payload: BitrixRuntimePayload) {
  return readPayloadObject(payload, 'properties')
}

export function readBitrixDocumentId(payload: BitrixRuntimePayload) {
  return readPayloadArray(payload, 'document_id').map(toText).filter(Boolean)
}
