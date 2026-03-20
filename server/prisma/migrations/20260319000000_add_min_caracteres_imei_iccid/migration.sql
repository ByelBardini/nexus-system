-- Add min_caracteres_imei to modelos_equipamentos
ALTER TABLE `modelos_equipamentos` ADD COLUMN `min_caracteres_imei` INTEGER NULL;

-- Add min_caracteres_iccid to marcas_simcard
ALTER TABLE `marcas_simcard` ADD COLUMN `min_caracteres_iccid` INTEGER NULL;
