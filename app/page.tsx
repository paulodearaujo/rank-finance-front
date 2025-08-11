import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="min-h-screen grid place-items-center p-6">
      <div className="max-w-md w-full text-center space-y-4">
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Next.js + Supabase + shadcn/ui
        </p>
        <div className="pt-2">
          <Button className="w-full">Começar</Button>
        </div>
      </div>
    </main>
  );
}
