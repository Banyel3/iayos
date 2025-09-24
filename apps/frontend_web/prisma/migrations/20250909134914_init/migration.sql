/*
  Warnings:

  - You are about to drop the `accounts` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "public"."profileType" AS ENUM ('WORKER', 'CLIENT', 'BOTH');

-- CreateEnum
CREATE TYPE "public"."availabilityStatus" AS ENUM ('AVAILABLE', 'BUSY', 'OFFLINE');

-- DropTable
DROP TABLE "public"."accounts";

-- CreateTable
CREATE TABLE "public"."Accounts" (
    "accountID" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "isVerified" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL,

    CONSTRAINT "Accounts_pkey" PRIMARY KEY ("accountID")
);

-- CreateTable
CREATE TABLE "public"."Profile" (
    "profileID" SERIAL NOT NULL,
    "accountID" INTEGER NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "contactNum" TEXT NOT NULL,
    "profileType" "public"."profileType",

    CONSTRAINT "Profile_pkey" PRIMARY KEY ("profileID")
);

-- CreateTable
CREATE TABLE "public"."Worker_Profile" (
    "profileID" INTEGER NOT NULL,
    "portfolioImages" TEXT NOT NULL,
    "hourlyRate" DECIMAL(10,2) NOT NULL,
    "experienceYears" INTEGER NOT NULL,
    "verifiedSkills" JSONB NOT NULL,
    "responseTimeAvg" DECIMAL(5,2) NOT NULL,
    "completionRate" DECIMAL(5,2) NOT NULL,
    "bio" TEXT NOT NULL,
    "totalEarningGross" DECIMAL(10,2) NOT NULL,
    "withholdingBalance" DECIMAL(10,2) NOT NULL,
    "description" TEXT NOT NULL,
    "availabilityStatus" "public"."availabilityStatus" NOT NULL DEFAULT 'OFFLINE',

    CONSTRAINT "Worker_Profile_pkey" PRIMARY KEY ("profileID")
);

-- CreateIndex
CREATE UNIQUE INDEX "Accounts_email_key" ON "public"."Accounts"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Profile_accountID_key" ON "public"."Profile"("accountID");

-- AddForeignKey
ALTER TABLE "public"."Profile" ADD CONSTRAINT "Profile_accountID_fkey" FOREIGN KEY ("accountID") REFERENCES "public"."Accounts"("accountID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Worker_Profile" ADD CONSTRAINT "Worker_Profile_profileID_fkey" FOREIGN KEY ("profileID") REFERENCES "public"."Profile"("profileID") ON DELETE RESTRICT ON UPDATE CASCADE;
