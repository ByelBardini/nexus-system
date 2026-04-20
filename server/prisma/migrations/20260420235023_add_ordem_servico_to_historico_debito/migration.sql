-- AlterTable
ALTER TABLE `historico_debitos_rastreadores` ADD COLUMN `ordem_servico_id` INTEGER NULL;

-- CreateIndex
CREATE INDEX `historico_debitos_rastreadores_ordem_servico_id_idx` ON `historico_debitos_rastreadores`(`ordem_servico_id`);

-- AddForeignKey
ALTER TABLE `historico_debitos_rastreadores` ADD CONSTRAINT `historico_debitos_rastreadores_ordem_servico_id_fkey` FOREIGN KEY (`ordem_servico_id`) REFERENCES `ordens_servico`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
