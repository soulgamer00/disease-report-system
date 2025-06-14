/*
  Warnings:

  - You are about to drop the column `treatmentarea` on the `patientsvisit` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "patientsvisit" DROP COLUMN "treatmentarea",
ADD COLUMN     "treatment_area" VARCHAR(100),
ADD COLUMN     "treatment_hospital" VARCHAR(255);

-- CreateIndex
CREATE INDEX "patientsvisit_treatment_hospital_idx" ON "patientsvisit"("treatment_hospital");
