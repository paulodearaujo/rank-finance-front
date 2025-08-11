import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen grid place-items-center p-6">
      <div className="max-w-md w-full text-center space-y-4">
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">shadcn/ui demo</p>
        <div className="pt-4 grid gap-2">
          <Link href="/dashboard">
            <Button className="w-full">Abrir painel</Button>
          </Link>
        </div>
      </div>
    </main>
  );
}
