-- CreateTable planos_simcard
CREATE TABLE `planos_simcard` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `marca_simcard_id` INTEGER NOT NULL,
    `plano_mb` INTEGER NOT NULL,
    `ativo` BOOLEAN NOT NULL DEFAULT true,
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `planos_simcard_marca_simcard_id_plano_mb_key`(`marca_simcard_id`, `plano_mb`),
    INDEX `planos_simcard_marca_simcard_id_idx`(`marca_simcard_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Add tem_planos to marcas_simcard
ALTER TABLE `marcas_simcard` ADD COLUMN `tem_planos` BOOLEAN NOT NULL DEFAULT false;

-- Migrate existing planoMb from marcas_simcard to planos_simcard
INSERT INTO `planos_simcard` (`marca_simcard_id`, `plano_mb`, `ativo`, `criado_em`)
SELECT `id`, `plano_mb`, true, NOW(3) FROM `marcas_simcard` WHERE `plano_mb` IS NOT NULL;

UPDATE `marcas_simcard` SET `tem_planos` = true WHERE `plano_mb` IS NOT NULL;

-- Add plano_simcard_id to aparelhos
ALTER TABLE `aparelhos` ADD COLUMN `plano_simcard_id` INTEGER NULL;

-- Migrate aparelhos: link planoSimcardId where we have marcaSimcardId and planoMb
UPDATE `aparelhos` a
INNER JOIN `planos_simcard` p ON p.`marca_simcard_id` = a.`marca_simcard_id` AND p.`plano_mb` = a.`plano_mb`
SET a.`plano_simcard_id` = p.`id`
WHERE a.`plano_mb` IS NOT NULL AND a.`marca_simcard_id` IS NOT NULL;

-- Drop plano_mb from aparelhos
ALTER TABLE `aparelhos` DROP COLUMN `plano_mb`;

-- Drop plano_mb from marcas_simcard
ALTER TABLE `marcas_simcard` DROP COLUMN `plano_mb`;

-- Add plano_simcard_id to lotes_aparelhos
ALTER TABLE `lotes_aparelhos` ADD COLUMN `plano_simcard_id` INTEGER NULL;

-- CreateIndex
CREATE INDEX `aparelhos_plano_simcard_id_idx` ON `aparelhos`(`plano_simcard_id`);
CREATE INDEX `lotes_aparelhos_plano_simcard_id_idx` ON `lotes_aparelhos`(`plano_simcard_id`);

-- AddForeignKey
ALTER TABLE `planos_simcard` ADD CONSTRAINT `planos_simcard_marca_simcard_id_fkey` FOREIGN KEY (`marca_simcard_id`) REFERENCES `marcas_simcard`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `aparelhos` ADD CONSTRAINT `aparelhos_plano_simcard_id_fkey` FOREIGN KEY (`plano_simcard_id`) REFERENCES `planos_simcard`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `lotes_aparelhos` ADD CONSTRAINT `lotes_aparelhos_plano_simcard_id_fkey` FOREIGN KEY (`plano_simcard_id`) REFERENCES `planos_simcard`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
