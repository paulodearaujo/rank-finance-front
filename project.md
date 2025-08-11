# Escopo do Projeto — Dashboard de Clustering SEO (Hub‑and‑Spoke) · v2

**Objetivo:** entregar um dashboard para monitorar **qualidade de clustering (run atual)**, **sinais de SEO (GSC)** e **sinais de produto (Amplitude)** — consumindo **métricas já consolidadas no banco** e permitindo **triagem operacional de outliers**.

Premissas v2

- **Sem autenticação**: aplicação pública; nenhuma rota protegida.
- **Outliers**: representados por `cluster_id = -1` em `public.blog_clusters`.
- **Clusters**: trabalhamos com o **run mais recente**; séries GSC/Amplitude são semanais (YTD).

---

## 1) Público‑alvo e uso

- **Growth/SEO**: validar coerência de tópicos, decidir hubs/spokes e priorizar conteúdo.
- **Data/ML**: verificar qualidade do run atual.
- **Conteúdo**: atacar gaps e outliers, renomear clusters (rótulo no front por ora).

**Cadência:** semanal (novo run) + consultas ad‑hoc.

---

## 2) Dados disponíveis (schema)

- `public.blog_articles(url, name, category, ... )`
- `public.blog_articles_metrics(url, week_ending, gsc_clicks, gsc_impressions, gsc_ctr, gsc_position, amplitude_conversions, ...)`
- `public.blog_clusters(run_id, url, cluster_id, cluster_name?, parent_id?, distance, ...)`
- `public.blog_cluster_metrics(run_id, cluster_id, cluster_size, cluster_coherence, cluster_density, cluster_variance, avg_similarity, min_similarity, pillar_candidate_url, ...)`
- `public.blog_embeddings(url, embedding float4[], model, dimension)`

Observações

- Outliers estão somente em `blog_clusters` via `cluster_id = -1`.
- Métricas de qualidade disponíveis hoje: `cluster_coherence`, `cluster_density`, `avg_similarity`, `min_similarity`.

---

## 3) Visões

### 3.1. Visão Geral (run atual + séries)

Objetivo: status em até 5 segundos.

- **KPIs (cards)**:
  - `# clusters`: `count(distinct cluster_id where cluster_id >= 0)` (run atual)
  - `outlier_rate`: `count(cluster_id = -1) / total` (run atual)
  - **Distribuição de tamanhos**: histograma a partir de `blog_cluster_metrics.cluster_size`
- **Qualidade (proxies)**: exibir faixas/medianas de `cluster_coherence` e `cluster_density`.
- **Séries semanais (YTD)**:
  - GSC: Clicks, Impressions, CTR, Avg Position
  - Produto: `amplitude_conversions`

### 3.2. Inteligência de Clusters (Stakeholder View)

Visão única, minimalista e executiva que integra clusters e sinais de negócio/SEO.

- Filtro temporal (topo):
  - Presets (Última semana, Últimas 4, Trimestre, YTD) e intervalo customizado (Date Range)
  - Toggles: incluir outliers, normalizar por share, ordenar por Clicks/Conversions/CTR
- Painel superior (run/período selecionado):
  - KPIs: Clicks, Conversions, CTR média ponderada, Posição média ponderada
  - Indicador: % de outliers no tráfego e nas conversões
- Área interativa (séries agregadas — Area Chart · Interactive):
  - Área/linha semanal de Clicks e Conversions; brush/zoom no período; tooltip unificado
  - Snapping do intervalo ao calendário semanal (usa `week_ending`); TZ: America/Sao_Paulo
- Contribuição por Cluster (última semana do período — Bar Chart · Horizontal Stacked):
  - Barras horizontais empilhadas (Clicks vs Conversions) para top N clusters
- Leaderboard de Clusters (tabela + sparklines — Line Chart · Dots minimal):
  - Colunas: `cluster_id/cluster_name`, Clicks, Conversions, CTR, Position, `cluster_size`, `cluster_coherence`
  - Ações: ordenar, filtrar por tamanho/coherence, busca por nome/id
  - Virtualização para listas grandes; default Top 10 (configurável)
- Drill‑down (Sheet/Dialog ao clicar no cluster — Line Chart · Multiple):
  - KPIs do cluster (Size, Coherence, Density, Avg/Min Similarity)
  - Séries semanais do cluster (Clicks, Conversions, CTR, Position)
  - Semântica de eixos: Position em gráfico separado ("quanto menor, melhor") para evitar dupla escala confusa
  - Páginas do cluster:
    - Tabela resumida (Top N) com ação "Ver todas"
    - Lista completa em Drawer/Sheet com paginação, busca e filtros (KISS):
      - Colunas: `page (name/url)`, Clicks, Conversions, CTR, Position
      - Período = filtro global (Date Range); ordenação por métrica; export CSV
      - Atalhos: copiar URL, abrir em nova aba

### 3.3. Triage de Outliers

- Fonte: `blog_clusters` com `cluster_id = -1` (run atual).
- Para cada outlier, sugerir **3 clusters candidatos** por similaridade de embedding:
  1) calcular centróide (média) dos embeddings por cluster (`cluster_id >= 0`)
  2) ranquear clusters por **cosseno** em relação ao embedding do outlier
- Exportar CSV com sugestões (cluster candidato e score). Sem mutação de dados no back nesta fase.

### 3.4. (fundido em 3.2)

Os sinais de SEO & Produto foram integrados à visão 3.2 (Mapa, Contribuição, Séries e Drill‑down).

### 3.5. Visualizador UMAP (backlog)

- Não há coordenadas 2D no schema atual. Futuro: persistir `umap_x/umap_y` por URL e run.
- Opcional tático para debug: PCA 2D em memória sobre amostra pequena.

---

## 4) Arquitetura/Implementação

- **Framework:** Next.js 14+ (App Router) + TypeScript
- **UI:** Tailwind v4 + shadcn/ui
- **Gráficos:** Recharts (cards, barras, linhas). Para scatter denso (futuro UMAP), considerar Canvas/WebGL.
- **Gráficos (shadcn/ui + Recharts):**
  - Area (Interactive) para séries agregadas de Clicks/Conversions — ver [Area Charts](https://ui.shadcn.com/charts/area)
  - Bar Horizontal Stacked para contribuição por cluster — ver [Bar Charts](https://ui.shadcn.com/charts/bar#charts)
  - Line Multiple/Dots para drill‑down e sparklines — ver [Line Charts](https://ui.shadcn.com/charts/line#charts)
  - Tooltip avançado/unificado — ver [Tooltips](https://ui.shadcn.com/charts/tooltip#charts)
  - Para scatter denso (futuro UMAP), considerar Canvas/WebGL
- **Estado/Fetch:** Server Components (SSR). TanStack Query é opcional para filtros/client e persistência em `sessionStorage`.
- **Supabase:** `@supabase/ssr` para server e browser client. Sem login:
  - manter `middleware.ts` sem redirecionamentos (ou desativado); apenas `NextResponse.next()` se usado para refresh.
- **Rotas (KISS):** `/dashboard` (visão integrada 3.2) e `/outliers` (triagem 3.3).
- **Base de UI (DRY):** reaproveitar o block `dashboard-01` (sidebar, header, cards, chart interativo, data table) como esqueleto de layout, adaptando componentes:
  - `SectionCards` → KPIs (Clicks, Conversions, CTR, Position, Outliers%)
  - `ChartAreaInteractive` → séries semanais agregadas (Clicks/Conversions) com brush
  - `DataTable` → leaderboard de clusters (ordenável/filtrável)
  - `AppSidebar/SiteHeader` → navegação mínima e filtros globais (Date Range)
- **Filtro por data:** Date Range usando `Calendar + Popover` do shadcn/ui; presets + intervalo customizado.
- **DRY/KISS:**
  - uma única camada de agregação (queries SQL) para abastecer KPIs, área e leaderboard
  - util único para cálculo de variações semanais e normalizações; evitar duplicação em componentes

Seeds e dados

- Preparar seed opcional para local: artigos, séries semanais e um run com clusters/outliers.

---

## 5) Critérios de aceite (v2)

- Overview:
  - exibe `#clusters`, `outlier_rate`, histograma de tamanhos e séries YTD
- Explorer:
  - tabela com colunas e filtros; link para `pillar_candidate_url`
- Outliers:
  - lista de outliers; sugestões de 3 clusters por similaridade (centróides) + export CSV
- Sinais:
  - séries por página e por cluster (join + agregação)

---

## 6) Backlog e extensões

- Métricas adicionais por cluster: `silhouette`, `dbcv`, `ari_stability`
- Palavras‑chave e exemplares por cluster (ex.: `blog_cluster_keywords`)
- UMAP 2D persistido (`umap_x`, `umap_y`) por URL e run
- Indexação vetorial (`pgvector`) para triagem mais rápida em escala
- Persistência de rótulos/edições de cluster no back (API + RLS quando houver login)

---

## 7) Stack operacional

- **Qualidade:** Biome, TypeScript strict, hooks pre‑commit (Husky)
- **Testes:** Vitest + Testing Library (unidades e integração de componentes)
- **Mocks:** MSW para desenvolvimento desacoplado
