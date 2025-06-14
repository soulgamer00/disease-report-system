/*
  Warnings:

  - You are about to alter the column `hospital_code` on the `populations` table. The data in that column could be lost. The data in that column will be cast from `VarChar(50)` to `VarChar(10)`.

*/
-- DropForeignKey
ALTER TABLE "populations" DROP CONSTRAINT "populations_hospital_code_fkey";

-- DropForeignKey
ALTER TABLE "users" DROP CONSTRAINT "users_hospital_code_fkey";

-- AlterTable
ALTER TABLE "hospitalname" ALTER COLUMN "hospital_code_5_digit" SET DATA TYPE VARCHAR(10);

-- AlterTable
ALTER TABLE "populations" ALTER COLUMN "hospital_code" SET DATA TYPE VARCHAR(10);

-- AlterTable
ALTER TABLE "users" ALTER COLUMN "hospital_code" SET DATA TYPE VARCHAR(10);

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_hospital_code_fkey" FOREIGN KEY ("hospital_code") REFERENCES "hospitalname"("hospital_code_5_digit") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "populations" ADD CONSTRAINT "populations_hospital_code_fkey" FOREIGN KEY ("hospital_code") REFERENCES "hospitalname"("hospital_code_5_digit") ON DELETE RESTRICT ON UPDATE CASCADE;
