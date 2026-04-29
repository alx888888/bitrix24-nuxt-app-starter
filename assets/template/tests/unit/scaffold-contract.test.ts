import { describe, expect, it } from 'vitest'
import { validateStarterContract } from '../../scripts/validate-starter-contract.mjs'

describe('starter scaffold contract', () => {
  it('matches the generated file set and docs contract', () => {
    expect(validateStarterContract(process.cwd())).toEqual({
      ok: true,
      rootDir: process.cwd()
    })
  })
})
