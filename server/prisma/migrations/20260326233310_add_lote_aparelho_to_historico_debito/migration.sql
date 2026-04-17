-- AlterTable
ALTER TABLE `historico_debitos_rastreadores` ADD COLUMN `aparelho_id` INTEGER NULL,
    ADD COLUMN `lote_id` INTEGER NULL;

-- CreateIndex
CREATE INDEX `historico_debitos_rastreadores_lote_id_idx` ON `historico_debitos_rastreadores`(`lote_id`);

-- CreateIndex
CREATE INDEX `historico_debitos_rastreadores_aparelho_id_idx` ON `historico_debitos_rastreadores`(`aparelho_id`);

-- AddForeignKey
ALTER TABLE `historico_debitos_rastreadores` ADD CONSTRAINT `historico_debitos_rastreadores_lote_id_fkey` FOREIGN KEY (`lote_id`) REFERENCES `lotes_aparelhos`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `historico_debitos_rastreadores` ADD CONSTRAINT `historico_debitos_rastreadores_aparelho_id_fkey` FOREIGN KEY (`aparelho_id`) REFERENCES `aparelhos`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
