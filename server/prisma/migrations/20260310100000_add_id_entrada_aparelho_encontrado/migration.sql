-- Add idEntrada and aparelhoEncontrado to ordens_servico
ALTER TABLE `ordens_servico` ADD COLUMN `id_entrada` VARCHAR(50) NULL;
ALTER TABLE `ordens_servico` ADD COLUMN `aparelho_encontrado` TINYINT(1) NULL;
