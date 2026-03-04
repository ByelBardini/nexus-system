-- AlterTable
ALTER TABLE `pedidos_rastreadores` ADD COLUMN `de_cliente_id` INTEGER NULL;
ALTER TABLE `pedidos_rastreadores` ADD COLUMN `operadora_id` INTEGER NULL;

-- AddForeignKey
ALTER TABLE `pedidos_rastreadores` ADD CONSTRAINT `pedidos_rastreadores_de_cliente_id_fkey` FOREIGN KEY (`de_cliente_id`) REFERENCES `clientes`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `pedidos_rastreadores` ADD CONSTRAINT `pedidos_rastreadores_operadora_id_fkey` FOREIGN KEY (`operadora_id`) REFERENCES `operadoras`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
