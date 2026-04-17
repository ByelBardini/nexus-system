-- AlterTable
ALTER TABLE `aparelhos` ADD COLUMN `observacao` VARCHAR(500) NULL,
    ADD COLUMN `subcliente_id` INTEGER NULL,
    ADD COLUMN `veiculo_id` INTEGER NULL;

-- AlterTable
ALTER TABLE `ordens_servico` ADD COLUMN `concluido_em` DATETIME(3) NULL,
    ADD COLUMN `concluido_por_id` INTEGER NULL,
    ADD COLUMN `iccid_aparelho` VARCHAR(50) NULL,
    ADD COLUMN `iccid_entrada` VARCHAR(50) NULL,
    ADD COLUMN `plataforma` ENUM('GETRAK', 'GEOMAPS', 'SELSYN') NULL,
    ADD COLUMN `status_cadastro` ENUM('AGUARDANDO', 'EM_CADASTRO', 'CONCLUIDO') NULL;

-- CreateIndex
CREATE INDEX `aparelhos_subcliente_id_idx` ON `aparelhos`(`subcliente_id`);

-- CreateIndex
CREATE INDEX `aparelhos_veiculo_id_idx` ON `aparelhos`(`veiculo_id`);

-- CreateIndex
CREATE INDEX `ordens_servico_concluido_por_id_fkey` ON `ordens_servico`(`concluido_por_id`);

-- AddForeignKey
ALTER TABLE `ordens_servico` ADD CONSTRAINT `ordens_servico_concluido_por_id_fkey` FOREIGN KEY (`concluido_por_id`) REFERENCES `usuarios`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `aparelhos` ADD CONSTRAINT `aparelhos_subcliente_id_fkey` FOREIGN KEY (`subcliente_id`) REFERENCES `subclientes`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `aparelhos` ADD CONSTRAINT `aparelhos_veiculo_id_fkey` FOREIGN KEY (`veiculo_id`) REFERENCES `veiculos`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
