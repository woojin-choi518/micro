-- CreateTable
CREATE TABLE "Taxonomy" (
    "id" TEXT NOT NULL,
    "asvSeq" TEXT NOT NULL,
    "domain" TEXT,
    "phylum" TEXT,
    "class" TEXT,
    "order" TEXT,
    "family" TEXT,
    "genus" TEXT,
    "species" TEXT,
    "confidence" DOUBLE PRECISION,

    CONSTRAINT "Taxonomy_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Taxonomy_asvSeq_key" ON "Taxonomy"("asvSeq");
