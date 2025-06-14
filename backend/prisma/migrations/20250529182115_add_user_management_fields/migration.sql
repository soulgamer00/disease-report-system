/*
  Warnings:

  - A unique constraint covering the columns `[email]` on the table `users` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "users" ADD COLUMN     "created_by" VARCHAR(50),
ADD COLUMN     "department" VARCHAR(100),
ADD COLUMN     "email" VARCHAR(255),
ADD COLUMN     "last_login_at" TIMESTAMP(3),
ADD COLUMN     "phone_number" VARCHAR(50),
ADD COLUMN     "position" VARCHAR(100),
ADD COLUMN     "updated_by" VARCHAR(50);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_hospital_code_idx" ON "users"("hospital_code");

-- CreateIndex
CREATE INDEX "users_role_id_idx" ON "users"("role_id");

-- CreateIndex
CREATE INDEX "users_is_active_idx" ON "users"("is_active");

-- CreateIndex
CREATE INDEX "users_last_login_at_idx" ON "users"("last_login_at");
