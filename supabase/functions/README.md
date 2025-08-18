# Supabase Edge Functions

Edge Functions são funções serverless escritas em TypeScript/JavaScript que rodam no Deno runtime, próximas aos seus usuários.

## 🤔 Quando usar Edge Functions?

### ✅ Use Edge Functions quando precisar

- **Processar dados antes de salvar no banco**: Validações complexas, transformações
- **Integrar com APIs externas**: Pagamentos (Stripe), envio de emails (SendGrid), WhatsApp
- **Executar lógica sensível**: Cálculos que não devem rodar no cliente
- **Webhooks**: Receber notificações de outros serviços
- **Tarefas agendadas**: Processos que rodam periodicamente

### ❌ NÃO use Edge Functions para

- Queries simples no banco (use o cliente Supabase direto)
- Operações que podem rodar no cliente
- Servir arquivos estáticos

## 📊 Exemplo prático com `apps_scrape`

Imagine que você quer analisar sentimento dos reviews antes de mostrar:

```typescript
// supabase/functions/analyze-app/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const { app_id } = await req.json()

  // Buscar app do banco
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  const { data: app } = await supabase
    .from('apps_scrape')
    .select('*')
    .eq('app_id', app_id)
    .single()

  // Chamar API de análise de sentimento
  const sentiment = await fetch('https://api.sentiment.com/analyze', {
    method: 'POST',
    body: JSON.stringify({ text: app.description })
  })

  // Retornar app com análise
  return new Response(
    JSON.stringify({
      ...app,
      sentiment: await sentiment.json()
    }),
    { headers: { "Content-Type": "application/json" } }
  )
})
```

## 🚀 Como criar uma Edge Function

```bash
# 1. Criar a função
npx supabase functions new analyze-app

# 2. Escrever o código em supabase/functions/analyze-app/index.ts

# 3. Testar localmente
npx supabase functions serve analyze-app

# 4. Deploy para produção
npx supabase functions deploy analyze-app
```

## 📱 Como chamar do seu app Next.js

```typescript
// No seu componente React
// This frontend does not ship a browser Supabase client.
// Use server utilities when integrating with Next.js routes.

const supabase = createClient()

// Chamar a Edge Function
const { data, error } = await supabase.functions.invoke('analyze-app', {
  body: { app_id: 'com.example.app' }
})

// data contém app com análise de sentimento
```

## 💰 Custos

- **Gratuito**: 500K invocações/mês
- **Pro**: 2M invocações/mês
- Depois disso: $2 por milhão de invocações

## 🔑 Vantagens vs API Routes do Next.js

| Edge Functions | Next.js API Routes |
|---------------|-------------------|
| Roda globalmente (edge) | Roda no servidor Node.js |
| Escala automaticamente | Depende do hosting |
| Isolado do frontend | Junto com o frontend |
| Deno runtime (mais seguro) | Node.js runtime |
| Deploy independente | Deploy com o app |

## 📚 Recursos

- [Documentação oficial](https://supabase.com/docs/guides/functions)
- [Exemplos](https://github.com/supabase/supabase/tree/master/examples/edge-functions)
- [Deno Deploy](https://deno.com/deploy)
