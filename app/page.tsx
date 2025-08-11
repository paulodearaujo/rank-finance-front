import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen grid place-items-center p-6">
      <div className="max-w-md w-full text-center space-y-4">
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Next.js + Supabase + shadcn/ui
        </p>
        <div className="pt-4 grid gap-2">
          <Link href="/blog/articles" className="underline text-sm">
            Ver artigos
          </Link>
          <Link href="/blog/articles/metrics" className="underline text-sm">
            Ver métricas
          </Link>
          <Link href="/blog/clusters" className="underline text-sm">
            Ver clusters
          </Link>
          <Link href="/blog/embeddings" className="underline text-sm">
            Ver embeddings
          </Link>
          <Button className="w-full mt-2">Começar</Button>
        </div>
      </div>
    </main>
  );
}
