-- CreateTable
CREATE TABLE "populations" (
    "id" SERIAL NOT NULL,
    "years" INTEGER NOT NULL,
    "populations" INTEGER NOT NULL,
    "hospital_code" VARCHAR(50) NOT NULL,
    "createby" VARCHAR(50),
    "createat" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updateby" VARCHAR(50),
    "updateat" TIMESTAMP(3) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "populations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "populations_years_idx" ON "populations"("years");

-- CreateIndex
CREATE INDEX "populations_hospital_code_idx" ON "populations"("hospital_code");

-- CreateIndex
CREATE UNIQUE INDEX "populations_years_hospital_code_key" ON "populations"("years", "hospital_code");

-- AddForeignKey
ALTER TABLE "populations" ADD CONSTRAINT "populations_hospital_code_fkey" FOREIGN KEY ("hospital_code") REFERENCES "hospitalname"("hospital_code_5_digit") ON DELETE RESTRICT ON UPDATE CASCADE;
