-- CreateTable
CREATE TABLE "Sample" (
    "id" TEXT NOT NULL,
    "biome" TEXT NOT NULL,
    "feature" TEXT,
    "type" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Sample_pkey" PRIMARY KEY ("id")
);
