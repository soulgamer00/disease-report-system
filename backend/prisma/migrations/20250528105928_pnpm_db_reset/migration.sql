-- CreateTable
CREATE TABLE "disease_card" (
    "id" SERIAL NOT NULL,
    "img" VARCHAR(255),
    "eng_name" VARCHAR(100),
    "thai_name" VARCHAR(100) NOT NULL,
    "da_name" VARCHAR(25),
    "details" VARCHAR(1000),
    "createdby" VARCHAR(50),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedby" VARCHAR(50),
    "updated_at" TIMESTAMP(3) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "disease_card_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "symptoms" (
    "id" SERIAL NOT NULL,
    "disease_id" INTEGER NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "createdby" VARCHAR(50),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedby" VARCHAR(50),
    "updated_at" TIMESTAMP(3) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "symptoms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "patientsvisit" (
    "id" SERIAL NOT NULL,
    "idcardcod" VARCHAR(13),
    "patient_hn" VARCHAR(20),
    "nameprefix" VARCHAR(10),
    "patient_name" VARCHAR(255) NOT NULL,
    "p_gender" VARCHAR(10),
    "birthday" DATE,
    "age_at_illness" INTEGER,
    "maritalstatus" VARCHAR(50),
    "p_nationality" VARCHAR(50),
    "occupation" VARCHAR(255),
    "phonenumber" VARCHAR(50),
    "current_house_number" VARCHAR(50),
    "current_village_number" VARCHAR(10),
    "current_road_name" VARCHAR(255),
    "current_province" VARCHAR(100),
    "current_district" VARCHAR(100),
    "current_sub_district" VARCHAR(100),
    "addresssick_house_number" VARCHAR(50),
    "addresssick_village_number" VARCHAR(10),
    "addresssick_road_name" VARCHAR(255),
    "addresssick_province" VARCHAR(100),
    "addresssick_district" VARCHAR(100),
    "addresssick_sub_district" VARCHAR(100),
    "disease_id" INTEGER NOT NULL,
    "symptomsofdisease" TEXT,
    "treatmentarea" VARCHAR(100),
    "hospital_code" VARCHAR(50) NOT NULL,
    "illness_date" DATE NOT NULL,
    "treatment_date" DATE,
    "diagnosis_date" DATE,
    "deathdate" DATE,
    "lab_result" VARCHAR(100),
    "ns1_result" VARCHAR(50),
    "patient_type" VARCHAR(50),
    "patientcondition" VARCHAR(50),
    "causeofdeath" TEXT,
    "receivingprovince" VARCHAR(100),
    "remarks" TEXT,
    "createdby" VARCHAR(50),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedby" VARCHAR(50),
    "updated_at" TIMESTAMP(3) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "patientsvisit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "disease_card_thai_name_key" ON "disease_card"("thai_name");

-- CreateIndex
CREATE UNIQUE INDEX "symptoms_disease_id_name_key" ON "symptoms"("disease_id", "name");

-- CreateIndex
CREATE INDEX "patientsvisit_idcardcod_idx" ON "patientsvisit"("idcardcod");

-- CreateIndex
CREATE INDEX "patientsvisit_hospital_code_idx" ON "patientsvisit"("hospital_code");

-- CreateIndex
CREATE INDEX "patientsvisit_illness_date_idx" ON "patientsvisit"("illness_date");

-- CreateIndex
CREATE INDEX "patientsvisit_created_at_idx" ON "patientsvisit"("created_at");

-- CreateIndex
CREATE INDEX "patientsvisit_patient_name_idx" ON "patientsvisit"("patient_name");

-- AddForeignKey
ALTER TABLE "symptoms" ADD CONSTRAINT "symptoms_disease_id_fkey" FOREIGN KEY ("disease_id") REFERENCES "disease_card"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patientsvisit" ADD CONSTRAINT "patientsvisit_disease_id_fkey" FOREIGN KEY ("disease_id") REFERENCES "disease_card"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patientsvisit" ADD CONSTRAINT "patientsvisit_hospital_code_fkey" FOREIGN KEY ("hospital_code") REFERENCES "hospitalname"("hospital_code_5_digit") ON DELETE RESTRICT ON UPDATE CASCADE;
