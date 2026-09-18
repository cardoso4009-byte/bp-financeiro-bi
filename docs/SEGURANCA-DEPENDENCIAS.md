# Segurança de dependências — Next.js

Em 18/09/2026, o projeto foi atualizado de Next.js 14.2.5 para Next.js 15.5.25 e de React 18.3.1 para React 19.3.0, mantendo a linha 15.5 de Maintenance LTS.

A decisão considera os avisos atuais do CI e os comunicados oficiais de segurança do Next.js. A manutenção de agosto de 2026 passou a exigir Next.js 15.5.24 ou 16.3.3 para corrigir duas vulnerabilidades críticas. A versão 15.5.25 disponível no npm está acima desse piso.

O upgrade também atualiza TypeScript para 5.9.3 e os tipos de React para 19.3.0.

O CI passa a executar o `security:next:gate`, que verifica que a versão declarada do Next.js está acima do piso documentado. O gate não substitui a atualização periódica: o piso deverá ser revisado em cada novo ciclo de segurança do framework.

Fontes oficiais:
- Next.js — August 2026 Security Release.
- Next.js — guia oficial de upgrade da versão 15.
- npm — versões publicadas do pacote next.
