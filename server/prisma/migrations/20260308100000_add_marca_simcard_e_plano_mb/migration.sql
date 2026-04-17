-- CreateTable
CREATE TABLE `marcas_simcard` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nome` VARCHAR(100) NOT NULL,
    `operadora_id` INTEGER NOT NULL,
    `ativo` BOOLEAN NOT NULL DEFAULT true,
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `marcas_simcard_operadora_id_nome_key`(`operadora_id`, `nome`),
    INDEX `marcas_simcard_operadora_id_idx`(`operadora_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AlterTable
ALTER TABLE `aparelhos` ADD COLUMN `marca_simcard_id` INTEGER NULL,
    ADD COLUMN `plano_mb` INTEGER NULL;

-- AlterTable
ALTER TABLE `lotes_aparelhos` ADD COLUMN `marca_simcard_id` INTEGER NULL;

-- CreateIndex
CREATE INDEX `aparelhos_marca_simcard_id_idx` ON `aparelhos`(`marca_simcard_id`);

-- CreateIndex
CREATE INDEX `lotes_aparelhos_marca_simcard_id_idx` ON `lotes_aparelhos`(`marca_simcard_id`);

-- AddForeignKey
ALTER TABLE `marcas_simcard` ADD CONSTRAINT `marcas_simcard_operadora_id_fkey` FOREIGN KEY (`operadora_id`) REFERENCES `operadoras`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `aparelhos` ADD CONSTRAINT `aparelhos_marca_simcard_id_fkey` FOREIGN KEY (`marca_simcard_id`) REFERENCES `marcas_simcard`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `lotes_aparelhos` ADD CONSTRAINT `lotes_aparelhos_marca_simcard_id_fkey` FOREIGN KEY (`marca_simcard_id`) REFERENCES `marcas_simcard`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
