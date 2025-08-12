## Explicação clara da comparação de períodos (Early vs Late)

Este documento explica, com exemplos simples, como calculamos e exibimos as diferenças de período (deltas) nas tabelas de Clusters e de URLs.

### Visão geral

- Você escolhe um conjunto de semanas no topo da página.
- Ordenamos essas semanas em ordem crescente e dividimos em duas metades:
  - Primeira metade = "early" (início do período)
  - Segunda metade = "late" (fim do período)
  - Se a quantidade for ímpar, a metade "early" fica com floor(n/2) semanas e a "late" com o restante.
- Para cada métrica (Cliques, Impressões, Conversões e Posição), comparamos o valor do fim do período contra o início do período e mostramos o delta sob o valor principal.

### Como dividimos as semanas (exemplos)

- Ex.: 6 semanas selecionadas
  - selectedWeeks: [2025-01-05, 2025-01-12, 2025-01-19, 2025-01-26, 2025-02-02, 2025-02-09]
  - early = 3 primeiras → [05/01, 12/01, 19/01]
  - late = 3 últimas → [26/01, 02/02, 09/02]
- Ex.: 5 semanas selecionadas
  - early = 2 primeiras, late = 3 últimas
- Com 0 ou 1 semana não dá para comparar; os deltas ficam 0 e o UI esconde automaticamente.

### Como agregamos os valores por período

- Cliques, Impressões, Conversões: somamos os valores dentro de cada período.
- Posição média: calculamos média ponderada por Impressões (quanto mais impressões, maior o peso na média).

  Fórmula da posição média em um período:

  \[ P = \frac{\sum (pos_i \times impr_i)}{\sum impr_i} \]

### Como calculamos os deltas (late vs early)

- Para X ∈ {Cliques, Impressões, Conversões}:
  - Delta absoluto: ΔX = X_late − X_early
  - Delta percentual: Δ%X = (X_late − X_early) / X_early (se X_early > 0; senão 0)
- Para Posição (quanto menor, melhor):
  - P_early e P_late são médias ponderadas
  - Delta absoluto: ΔP = P_early − P_late
    - ΔP > 0 significa melhoria (posição caiu)
  - Delta percentual: Δ%P = (P_early − P_late) / P_early (se P_early > 0; senão 0)

### Exemplos numéricos

1) Cliques/Impressões/Conversões
   - early: Cliques = 1.000, Impressões = 10.000, Conversões = 50
   - late: Cliques = 1.300, Impressões = 12.000, Conversões = 40
   - ΔCliques = 1.300 − 1.000 = +300 (Δ% = +30%)
   - ΔImpressões = 12.000 − 10.000 = +2.000 (Δ% = +20%)
   - ΔConversões = 40 − 50 = −10 (Δ% = −20%)

2) Posição (ponderada por impressões)
   - early:
     - Semana A: posição 12, impressões 3.000
     - Semana B: posição 9, impressões 1.000
     - P_early = (12×3.000 + 9×1.000) / (3.000+1.000) = (36.000+9.000)/4.000 = 11,25
   - late:
     - Semana C: posição 10, impressões 4.000
     - Semana D: posição 9, impressões 2.000
     - P_late = (10×4.000 + 9×2.000) / (4.000+2.000) = (40.000+18.000)/6.000 = 9,67
   - ΔP = 11,25 − 9,67 = +1,58 → melhoria (mostramos seta para cima em verde)

### Como aparece na interface

- Em cada célula numérica das tabelas, exibimos:
  - Linha 1: o valor principal (ex.: "12.000" impressões)
  - Linha 2 (pequena): o delta 🔼/🔽
    - Cliques/Impressões/Conversões: percentual (ex.: +20,0%)
    - Posição: absoluto com 1 casa (ex.: +1,6)
- Cores e ícones:
  - Verde + seta para cima = melhora (ou maior valor, no caso das métricas onde “mais é melhor”)
  - Vermelho + seta para baixo = piora
  - Para Posição, “melhora” é posição cair (número menor) → ΔP positivo mostra verde/🔼
- Ruído visual: deltas muito pequenos são ocultados automaticamente (threshold ~0,05%).

### Edge cases e regras práticas

- Se o valor do período early é 0, o delta percentual vira 0 (evitamos divisão por zero) e não exibimos (fica limpo).
- Com 0 ou 1 semana selecionada, não há comparação; a linha de delta some.
- Se não houver impressões, a posição média é 0 por definição e o delta não aparece.

### Onde está o código

- Servidor (cálculos): `lib/data/metrics-queries.ts`
  - `getClusterLeaderboard` (para a tabela de Clusters)
  - `getClusterUrlsMetrics` (para a tabela de URLs)
  - Helpers DRY: `splitWeeksSets` e `createAccum`
- UI (delta reutilizável): `components/ui/delta.tsx`
- Integrações nas tabelas:
  - `app/dashboard/components/data-table.tsx`
  - `app/clusters/components/urls-table.tsx`

### Como ajustar o comportamento (se precisar)

- Threshold de exibição do delta: `components/ui/delta.tsx` (prop `hideIfZero`, hoje ~0,05%).
- Forma de dividir períodos: em `lib/data/metrics-queries.ts`, helper `splitWeeksSets`. Podemos trocar por “período anterior do mesmo tamanho” ou outra lógica, se desejado.

---
Se quiser, posso trocar o split por “últimas N semanas vs N semanas anteriores” ou exibir também os deltas absolutos (ex.: +300) junto com os percentuais.

