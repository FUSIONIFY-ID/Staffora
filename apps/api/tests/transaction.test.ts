import { afterAll, describe, expect, it } from 'vitest'
import { prisma } from '../src/common/database/prisma.js'
import { withTransaction } from '../src/common/database/transaction.js'

const TEST_NAME_PREFIX = 'TX-HELPER-'

async function removeTestSkills(): Promise<void> {
  await prisma.skill.deleteMany({ where: { name: { startsWith: TEST_NAME_PREFIX } } })
}

describe('database transaction helper (TSD 10.4 / ADR-009)', () => {
  afterAll(removeTestSkills)

  it('commits every write when the operation succeeds', async () => {
    const name = `${TEST_NAME_PREFIX}${Date.now()}-commit`

    const created = await withTransaction(async (tx) => tx.skill.create({ data: { name } }))

    const persisted = await prisma.skill.findUnique({ where: { name } })
    expect(persisted?.id).toBe(created.id)
  })

  it('rolls back every write when the operation throws', async () => {
    const name = `${TEST_NAME_PREFIX}${Date.now()}-rollback`

    await expect(
      withTransaction(async (tx) => {
        await tx.skill.create({ data: { name } })
        throw new Error('forced rollback')
      }),
    ).rejects.toThrow('forced rollback')

    const persisted = await prisma.skill.findUnique({ where: { name } })
    expect(persisted).toBeNull()
  })
})
