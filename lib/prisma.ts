// lib/prisma.ts
import type { PrismaClient as StandardPrismaClient } from "@prisma/client";

// Conditional imports based on environment
type PrismaClientType = StandardPrismaClient;
let PrismaClientConstructor: new () => PrismaClientType;

// Check if we're in localhost/development environment
const isLocalhost = typeof window !== 'undefined' 
  ? window.location.hostname === 'localhost' 
  : process.env.NODE_ENV === 'development' || 
    process.env.VERCEL_URL === undefined;

if (isLocalhost) {
  // Use local custom Prisma client for development
  try {
    const { PrismaClient: LocalPrismaClient } = require("@/lib/generated/prisma");
    PrismaClientConstructor = LocalPrismaClient;
  } catch {
    console.warn("Local Prisma client not found, falling back to standard client");
    const { PrismaClient: StandardPrismaClient } = require("@prisma/client");
    PrismaClientConstructor = StandardPrismaClient;
  }
} else {
  // Use standard Prisma client for production/Vercel
  const { PrismaClient: StandardPrismaClient } = require("@prisma/client");
  PrismaClientConstructor = StandardPrismaClient;
}

const globalForPrisma = global as unknown as { prisma: PrismaClientType };

export const prisma = globalForPrisma.prisma || new PrismaClientConstructor();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
