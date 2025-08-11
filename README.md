# Dashboard Inbound

Aplicação Next.js (App Router) para construir um dashboard inbound: autenticação, sessão SSR, tema consistente e biblioteca de componentes pronta para uso.

### Para quem é e o que resolve

- Base para criar telas de acompanhamento (métricas, conteúdo, operações) com foco em velocidade e consistência visual.
- Autenticação integrada com sessão mantida entre requisições (sem “logouts” aleatórios durante navegação).
- Catálogo de componentes de UI prontos para compor páginas rapidamente.

### Como a aplicação se organiza

- Roteamento (`app/`): páginas e layouts usando o App Router.
- Middleware (`middleware.ts`): atualiza a sessão do Supabase a cada requisição.
- Supabase (`lib/supabase/*`): clientes separados para Browser e Server; o middleware usa o cliente de servidor.
- UI (`components/ui/*`): componentes reutilizáveis (inputs, navegação, overlays, data display, charts).
- Estilo/Tema (`app/globals.css`): tokens OKLCH + Tailwind v4 via `@theme inline`.

### Fluxo de autenticação

1. A requisição entra pelo `middleware.ts`.
2. `updateSession(request)` valida/refresca a sessão com o Supabase.
3. Se necessário, a navegação pode redirecionar para a página de login (ajustável em `lib/supabase/middleware.ts`).

### Convenções de UI e tema

- Utilize utilitários como `bg-background`, `text-foreground`, `border-border`, `size-*`.
- Componentes expõem `data-slot` para facilitar estilização seletiva.
- Para classes dinâmicas, use `cn(...)` de `lib/utils.ts` (mescla `clsx` + `tailwind-merge`).

### Como rodar

Requisitos: Node 20+, pnpm 10+, Podman (com Docker API compatível)

1) Configuração de ambiente (`.env`):

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

2) Subir stack local do Supabase (Podman):

```bash
podman machine start   # expõe Docker API em /var/run/docker.sock
npx -y supabase start  # sobe DB + APIs locais
```

3) Instalação e execução do app:

```bash
pnpm install
pnpm dev   # http://localhost:3000
```

Produção:

```bash
pnpm build && pnpm start
```

### Diretórios principais

- `app/` — páginas, layouts e estilos globais
- `components/ui/` — biblioteca de componentes
- `lib/supabase/` — clientes e middleware helper do Supabase
- `lib/` — utilitários e tipos de banco (`database.types.ts`)

### Banco e tipos (local vs remoto)

- Local (a partir do banco que roda na sua máquina com migrations aplicadas):

```bash
pnpm db:types:local
```

- Remoto linked (gera a partir do projeto Supabase vinculado):

```bash
npx -y supabase link --project-ref <SEU_PROJECT_REF>
pnpm db:types:linked
```

- Alternativa por URL direta (serve para qualquer Postgres):

```bash
DATABASE_URL="postgresql://USER:PASS@HOST:PORT/DB" \
npx -y supabase gen types typescript --db-url="$DATABASE_URL" -s public > lib/database.types.ts
```

- Reset local + aplicar migrations + gerar tipos de uma vez:

```bash
pnpm db:sync-types:local
```

### Tailwind v4

- Substitua as diretivas antigas por imports v4 no `app/globals.css`:

```css
@import "tailwindcss/preflight";
@import "tailwindcss/utilities";
```

Recursos do tema utilizam `@theme` e `@apply`, já compatíveis.

### Scripts úteis

- `pnpm lint` / `pnpm format` — qualidade do código
- `pnpm typecheck` / `pnpm typecheck:edge` / `pnpm typecheck:ci` — checagens de tipos
- `pnpm db:reset:local` — reseta o banco local (aplica migrations)
- `pnpm db:types:local` — gera tipos do banco local
- `pnpm db:types:linked` — gera tipos do projeto remoto vinculado
- `pnpm db:sync-types:local` — reset + gera tipos locais
