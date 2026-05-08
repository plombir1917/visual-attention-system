/*
  Warnings:

  - A unique constraint covering the columns `[key_hash]` on the table `user` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "user_key_hash_key" ON "user"("key_hash");
