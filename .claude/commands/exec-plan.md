Invoque o agente **`executar-plano`** passando o nome do plano: $ARGUMENTS

O agente irá ler `.claude/plans/$ARGUMENTS.md`, reler os docs/context e docs/Telas, delegar a escrita de testes ao agente `criar-testes`, validar os testes via agente `conferir-testes`, implementar a solução e atualizar os docs. Você nunca executa testes — apenas avisa o usuário ao final.
