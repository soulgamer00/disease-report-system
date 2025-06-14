-- CreateTable
CREATE TABLE "roles" (
    "id" SERIAL NOT NULL,
    "role_name" VARCHAR(20) NOT NULL,
    "description" TEXT,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "username" VARCHAR(50) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "role_id" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hospitalname" (
    "id" SERIAL NOT NULL,
    "hospital_name" VARCHAR(255),
    "hospital_code_9e_digit" VARCHAR(9),
    "hospital_code_9_digit" VARCHAR(9),
    "hospital_code_5_digit" VARCHAR(5) NOT NULL,
    "organization_type" VARCHAR(255),
    "health_service_type" VARCHAR(255),
    "affiliation" VARCHAR(255),
    "department_division" VARCHAR(255),
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "hospitalname_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "roles_role_name_key" ON "roles"("role_name");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "hospitalname_hospital_code_5_digit_key" ON "hospitalname"("hospital_code_5_digit");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
