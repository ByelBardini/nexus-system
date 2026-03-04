-- AlterTable: adicionar data_solicitacao, marca_equipamento_id e modelo_equipamento_id
ALTER TABLE `pedidos_rastreadores` ADD COLUMN `data_solicitacao` DATETIME(3) NULL;
ALTER TABLE `pedidos_rastreadores` ADD COLUMN `marca_equipamento_id` INTEGER NULL;
ALTER TABLE `pedidos_rastreadores` ADD COLUMN `modelo_equipamento_id` INTEGER NULL;

-- Preencher data_solicitacao com criado_em para registros existentes
UPDATE `pedidos_rastreadores` SET `data_solicitacao` = `criado_em` WHERE `data_solicitacao` IS NULL;

-- Tornar data_solicitacao NOT NULL
ALTER TABLE `pedidos_rastreadores` MODIFY COLUMN `data_solicitacao` DATETIME(3) NOT NULL;

-- AddForeignKey
ALTER TABLE `pedidos_rastreadores` ADD CONSTRAINT `pedidos_rastreadores_marca_equipamento_id_fkey` FOREIGN KEY (`marca_equipamento_id`) REFERENCES `marcas_equipamentos`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `pedidos_rastreadores` ADD CONSTRAINT `pedidos_rastreadores_modelo_equipamento_id_fkey` FOREIGN KEY (`modelo_equipamento_id`) REFERENCES `modelos_equipamentos`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
