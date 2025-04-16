/*
  Warnings:

  - The `top5_asv` column on the `Sample` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "Sample" DROP COLUMN "top5_asv",
ADD COLUMN     "top5_asv" TEXT[];
