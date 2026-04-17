-- Add idAparelho, localInstalacao, posChave to ordens_servico
ALTER TABLE `ordens_servico` ADD COLUMN `id_aparelho` VARCHAR(50) NULL;
ALTER TABLE `ordens_servico` ADD COLUMN `local_instalacao` VARCHAR(200) NULL;
ALTER TABLE `ordens_servico` ADD COLUMN `pos_chave` VARCHAR(10) NULL;
