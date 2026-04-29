-- AlterTable
ALTER TABLE `pedidos_rastreadores` ADD COLUMN `numero_nf` VARCHAR(100) NULL,
    ADD COLUMN `tipo_despacho` VARCHAR(20) NULL,
    ADD COLUMN `transportadora` VARCHAR(200) NULL;
