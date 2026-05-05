/*
  Warnings:

  - You are about to drop the column `min_caracteres_iccid` on the `marcas_simcard` table. All the data in the column will be lost.
  - You are about to drop the column `min_caracteres_imei` on the `modelos_equipamentos` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `marcas_simcard` DROP COLUMN `min_caracteres_iccid`,
    ADD COLUMN `quantidade_caracteres_iccid` INTEGER NULL;

-- AlterTable
ALTER TABLE `modelos_equipamentos` DROP COLUMN `min_caracteres_imei`,
    ADD COLUMN `quantidade_caracteres_imei` INTEGER NULL;
