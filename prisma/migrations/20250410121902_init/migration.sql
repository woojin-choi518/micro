/*
  Warnings:

  - You are about to drop the column `biome` on the `Sample` table. All the data in the column will be lost.
  - You are about to drop the column `feature` on the `Sample` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `Sample` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[sample_id]` on the table `Sample` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `env_biome` to the `Sample` table without a default value. This is not possible if the table is not empty.
  - Added the required column `physical_specimen_remaining` to the `Sample` table without a default value. This is not possible if the table is not empty.
  - Added the required column `qiita_study_id` to the `Sample` table without a default value. This is not possible if the table is not empty.
  - Added the required column `sample_id` to the `Sample` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Sample" DROP COLUMN "biome",
DROP COLUMN "feature",
DROP COLUMN "type",
ADD COLUMN     "env_biome" TEXT NOT NULL,
ADD COLUMN     "env_feature" TEXT,
ADD COLUMN     "physical_specimen_remaining" BOOLEAN NOT NULL,
ADD COLUMN     "qiita_study_id" INTEGER NOT NULL,
ADD COLUMN     "sample_id" TEXT NOT NULL,
ADD COLUMN     "sample_id_full" TEXT,
ADD COLUMN     "sample_type" TEXT,
ADD COLUMN     "top5_asv" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Sample_sample_id_key" ON "Sample"("sample_id");
