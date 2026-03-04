-- AlterTable: adiciona cliente_id e remove data_previsao (prazo)
ALTER TABLE `pedidos_rastreadores` ADD COLUMN `cliente_id` INTEGER NULL;
ALTER TABLE `pedidos_rastreadores` DROP COLUMN `data_previsao`;

-- AddForeignKey
ALTER TABLE `pedidos_rastreadores` ADD CONSTRAINT `pedidos_rastreadores_cliente_id_fkey` FOREIGN KEY (`cliente_id`) REFERENCES `clientes`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
