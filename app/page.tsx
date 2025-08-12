import { IconChartBar } from "@tabler/icons-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="min-h-screen grid place-items-center p-6">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="flex justify-center">
          <div className="p-4 rounded-full bg-primary/10">
            <IconChartBar className="size-12 text-primary" />
          </div>
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Dashboard SEO Clustering</h1>
          <p className="text-muted-foreground">
            Análise de performance e agrupamento de conteúdo do blog
          </p>
        </div>
        <div className="pt-4">
          <Link href="/dashboard">
            <Button size="lg" className="gap-2">
              <IconChartBar className="size-5" />
              Acessar Dashboard
            </Button>
          </Link>
        </div>
      </div>
    </main>
  );
}
