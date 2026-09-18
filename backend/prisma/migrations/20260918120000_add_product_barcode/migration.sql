-- CreateTable
-- Add barcode column to products (nullable, unique)
ALTER TABLE "products" ADD COLUMN "barcode" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "products_barcode_key" ON "products"("barcode");