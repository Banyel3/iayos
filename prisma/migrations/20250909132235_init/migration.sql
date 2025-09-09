-- CreateTable
CREATE TABLE "public"."accounts" (
    "accountID" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "isVerified" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("accountID")
);

-- CreateIndex
CREATE UNIQUE INDEX "accounts_email_key" ON "public"."accounts"("email");
