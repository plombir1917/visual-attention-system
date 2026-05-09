/*
  Warnings:

  - A unique constraint covering the columns `[user_id]` on the table `api_key` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[prefix]` on the table `api_key` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "api_key_user_id_key" ON "api_key"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "api_key_prefix_key" ON "api_key"("prefix");
