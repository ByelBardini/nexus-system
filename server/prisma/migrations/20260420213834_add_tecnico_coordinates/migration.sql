-- AlterTable
ALTER TABLE `tecnicos` ADD COLUMN `latitude` DECIMAL(10, 7) NULL,
    ADD COLUMN `longitude` DECIMAL(10, 7) NULL,
    ADD COLUMN `geocoded_at` DATETIME(3) NULL,
    ADD COLUMN `geocoding_precision` ENUM('EXATO', 'CIDADE') NULL;
