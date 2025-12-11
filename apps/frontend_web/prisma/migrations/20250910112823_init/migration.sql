/*
  Warnings:

  - You are about to drop the column `experienceYears` on the `Worker_Profile` table. All the data in the column will be lost.
  - You are about to drop the column `portfolioImages` on the `Worker_Profile` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."Worker_Profile" DROP COLUMN "experienceYears",
DROP COLUMN "portfolioImages",
ADD COLUMN     "profileImg" TEXT;

-- CreateTable
CREATE TABLE "public"."Freelancer_Specialization" (
    "workerID" INTEGER NOT NULL,
    "specializationID" INTEGER NOT NULL,
    "experienceYears" INTEGER NOT NULL,
    "certification" TEXT NOT NULL,

    CONSTRAINT "Freelancer_Specialization_pkey" PRIMARY KEY ("workerID")
);

-- CreateTable
CREATE TABLE "public"."Specialization" (
    "specializationID" SERIAL NOT NULL,
    "specializationName" TEXT NOT NULL,

    CONSTRAINT "Specialization_pkey" PRIMARY KEY ("specializationID")
);

-- CreateIndex
CREATE UNIQUE INDEX "Freelancer_Specialization_specializationID_key" ON "public"."Freelancer_Specialization"("specializationID");

-- CreateIndex
CREATE UNIQUE INDEX "Specialization_specializationID_key" ON "public"."Specialization"("specializationID");

-- AddForeignKey
ALTER TABLE "public"."Freelancer_Specialization" ADD CONSTRAINT "Freelancer_Specialization_workerID_fkey" FOREIGN KEY ("workerID") REFERENCES "public"."Worker_Profile"("profileID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Freelancer_Specialization" ADD CONSTRAINT "Freelancer_Specialization_specializationID_fkey" FOREIGN KEY ("specializationID") REFERENCES "public"."Specialization"("specializationID") ON DELETE RESTRICT ON UPDATE CASCADE;
