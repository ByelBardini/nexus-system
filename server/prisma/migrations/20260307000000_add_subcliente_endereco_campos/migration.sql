-- Add endereco fields and expand cpf to Subcliente
ALTER TABLE `subclientes` ADD COLUMN `logradouro` VARCHAR(255) NULL;
ALTER TABLE `subclientes` ADD COLUMN `numero` VARCHAR(20) NULL;
ALTER TABLE `subclientes` ADD COLUMN `complemento` VARCHAR(100) NULL;
ALTER TABLE `subclientes` ADD COLUMN `bairro` VARCHAR(100) NULL;
ALTER TABLE `subclientes` MODIFY COLUMN `cpf` VARCHAR(20) NULL;
