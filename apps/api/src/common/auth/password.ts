import { randomBytes } from 'node:crypto'
import bcrypt from 'bcryptjs'

const BCRYPT_SALT_ROUNDS = 12

let dummyHash: Promise<string> | undefined

export async function hashPassword(plainText: string): Promise<string> {
  return bcrypt.hash(plainText, BCRYPT_SALT_ROUNDS)
}

/**
 * When `hash` is null (unknown account) the comparison still runs against a dummy hash of the
 * same cost, so response timing cannot be used to enumerate registered emails.
 */
export async function verifyPassword(plainText: string, hash: string | null): Promise<boolean> {
  if (hash === null) {
    dummyHash ??= hashPassword(randomBytes(32).toString('hex'))
    await bcrypt.compare(plainText, await dummyHash)
    return false
  }
  return bcrypt.compare(plainText, hash)
}
