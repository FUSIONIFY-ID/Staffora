import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'
import { PrismaClient } from '../../generated/prisma/client.js'

let prismaInstance: PrismaClient | undefined

export function getPrismaClient(): PrismaClient {
  if (!prismaInstance) {
    const connectionString =
      process.env.DATABASE_URL || 'postgresql://staffora:staffora_local@localhost:5432/staffora'
    const pool = new pg.Pool({ connectionString })
    const adapter = new PrismaPg(pool)
    prismaInstance = new PrismaClient({ adapter })
  }
  return prismaInstance
}

export const prisma = getPrismaClient()
