/*
  Warnings:

  - Made the column `idcardcod` on table `patientsvisit` required. This step will fail if there are existing NULL values in that column.
  - Made the column `nameprefix` on table `patientsvisit` required. This step will fail if there are existing NULL values in that column.
  - Made the column `p_gender` on table `patientsvisit` required. This step will fail if there are existing NULL values in that column.
  - Made the column `birthday` on table `patientsvisit` required. This step will fail if there are existing NULL values in that column.
  - Made the column `age_at_illness` on table `patientsvisit` required. This step will fail if there are existing NULL values in that column.
  - Made the column `maritalstatus` on table `patientsvisit` required. This step will fail if there are existing NULL values in that column.
  - Made the column `p_nationality` on table `patientsvisit` required. This step will fail if there are existing NULL values in that column.
  - Made the column `occupation` on table `patientsvisit` required. This step will fail if there are existing NULL values in that column.
  - Made the column `phonenumber` on table `patientsvisit` required. This step will fail if there are existing NULL values in that column.
  - Made the column `current_house_number` on table `patientsvisit` required. This step will fail if there are existing NULL values in that column.
  - Made the column `current_village_number` on table `patientsvisit` required. This step will fail if there are existing NULL values in that column.
  - Made the column `current_road_name` on table `patientsvisit` required. This step will fail if there are existing NULL values in that column.
  - Made the column `current_province` on table `patientsvisit` required. This step will fail if there are existing NULL values in that column.
  - Made the column `current_district` on table `patientsvisit` required. This step will fail if there are existing NULL values in that column.
  - Made the column `current_sub_district` on table `patientsvisit` required. This step will fail if there are existing NULL values in that column.
  - Made the column `addresssick_house_number` on table `patientsvisit` required. This step will fail if there are existing NULL values in that column.
  - Made the column `addresssick_village_number` on table `patientsvisit` required. This step will fail if there are existing NULL values in that column.
  - Made the column `addresssick_road_name` on table `patientsvisit` required. This step will fail if there are existing NULL values in that column.
  - Made the column `addresssick_province` on table `patientsvisit` required. This step will fail if there are existing NULL values in that column.
  - Made the column `addresssick_district` on table `patientsvisit` required. This step will fail if there are existing NULL values in that column.
  - Made the column `addresssick_sub_district` on table `patientsvisit` required. This step will fail if there are existing NULL values in that column.
  - Made the column `symptomsofdisease` on table `patientsvisit` required. This step will fail if there are existing NULL values in that column.
  - Made the column `treatment_date` on table `patientsvisit` required. This step will fail if there are existing NULL values in that column.
  - Made the column `diagnosis_date` on table `patientsvisit` required. This step will fail if there are existing NULL values in that column.
  - Made the column `lab_result` on table `patientsvisit` required. This step will fail if there are existing NULL values in that column.
  - Made the column `ns1_result` on table `patientsvisit` required. This step will fail if there are existing NULL values in that column.
  - Made the column `patient_type` on table `patientsvisit` required. This step will fail if there are existing NULL values in that column.
  - Made the column `patientcondition` on table `patientsvisit` required. This step will fail if there are existing NULL values in that column.
  - Made the column `receivingprovince` on table `patientsvisit` required. This step will fail if there are existing NULL values in that column.
  - Made the column `remarks` on table `patientsvisit` required. This step will fail if there are existing NULL values in that column.
  - Made the column `treatment_area` on table `patientsvisit` required. This step will fail if there are existing NULL values in that column.
  - Made the column `treatment_hospital` on table `patientsvisit` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "patientsvisit" ALTER COLUMN "idcardcod" SET NOT NULL,
ALTER COLUMN "nameprefix" SET NOT NULL,
ALTER COLUMN "p_gender" SET NOT NULL,
ALTER COLUMN "birthday" SET NOT NULL,
ALTER COLUMN "age_at_illness" SET NOT NULL,
ALTER COLUMN "maritalstatus" SET NOT NULL,
ALTER COLUMN "p_nationality" SET NOT NULL,
ALTER COLUMN "occupation" SET NOT NULL,
ALTER COLUMN "phonenumber" SET NOT NULL,
ALTER COLUMN "current_house_number" SET NOT NULL,
ALTER COLUMN "current_village_number" SET NOT NULL,
ALTER COLUMN "current_road_name" SET NOT NULL,
ALTER COLUMN "current_province" SET NOT NULL,
ALTER COLUMN "current_district" SET NOT NULL,
ALTER COLUMN "current_sub_district" SET NOT NULL,
ALTER COLUMN "addresssick_house_number" SET NOT NULL,
ALTER COLUMN "addresssick_village_number" SET NOT NULL,
ALTER COLUMN "addresssick_road_name" SET NOT NULL,
ALTER COLUMN "addresssick_province" SET NOT NULL,
ALTER COLUMN "addresssick_district" SET NOT NULL,
ALTER COLUMN "addresssick_sub_district" SET NOT NULL,
ALTER COLUMN "symptomsofdisease" SET NOT NULL,
ALTER COLUMN "treatment_date" SET NOT NULL,
ALTER COLUMN "diagnosis_date" SET NOT NULL,
ALTER COLUMN "lab_result" SET NOT NULL,
ALTER COLUMN "ns1_result" SET NOT NULL,
ALTER COLUMN "patient_type" SET NOT NULL,
ALTER COLUMN "patientcondition" SET NOT NULL,
ALTER COLUMN "receivingprovince" SET NOT NULL,
ALTER COLUMN "remarks" SET NOT NULL,
ALTER COLUMN "treatment_area" SET NOT NULL,
ALTER COLUMN "treatment_hospital" SET NOT NULL;
