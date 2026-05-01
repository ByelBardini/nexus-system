-- ATENÇÃO: executar APENAS após migrar-descartados.ts confirmar COUNT(*) = 0 em aparelhos WHERE status = 'DESCARTADO'

-- AlterTable
ALTER TABLE `aparelhos` MODIFY `status` ENUM('EM_ESTOQUE', 'CONFIGURADO', 'DESPACHADO', 'COM_TECNICO', 'INSTALADO') NOT NULL DEFAULT 'EM_ESTOQUE';

-- AlterTable
ALTER TABLE `aparelhos_historico` MODIFY `status_anterior` ENUM('EM_ESTOQUE', 'CONFIGURADO', 'DESPACHADO', 'COM_TECNICO', 'INSTALADO') NOT NULL,
    MODIFY `status_novo` ENUM('EM_ESTOQUE', 'CONFIGURADO', 'DESPACHADO', 'COM_TECNICO', 'INSTALADO') NOT NULL;
