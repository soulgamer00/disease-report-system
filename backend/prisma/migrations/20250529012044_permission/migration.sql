-- AlterTable
ALTER TABLE "users" ADD COLUMN     "hospital_code" VARCHAR(5);

-- CreateTable
CREATE TABLE "permissions" (
    "id" SERIAL NOT NULL,
    "role_id" INTEGER NOT NULL,
    "permission_code" VARCHAR(100) NOT NULL,
    "can_access" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "permissions_role_id_permission_code_key" ON "permissions"("role_id", "permission_code");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_hospital_code_fkey" FOREIGN KEY ("hospital_code") REFERENCES "hospitalname"("hospital_code_5_digit") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "permissions" ADD CONSTRAINT "permissions_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
