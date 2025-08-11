import { createClient } from "@/lib/supabase/server";
import { DataTable } from "@/components/ui/table"; // placeholder types for composition
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function Page() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("blog_articles")
    .select("id, url, name, category, published_at")
    .order("published_at", { ascending: false })
    .limit(1000);

  if (error) {
    return (
      <div className="p-6">
        <h1 className="text-lg font-semibold">Erro ao carregar artigos</h1>
        <p className="text-sm text-muted-foreground">{error.message}</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Blog Articles</h1>
        <Link href="/blog/articles/metrics" className="underline text-sm">
          Ir para métricas
        </Link>
      </div>
      <div className="rounded-md border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="p-2 text-left">Name</th>
              <th className="p-2 text-left">URL</th>
              <th className="p-2 text-left">Category</th>
              <th className="p-2 text-left">Published</th>
            </tr>
          </thead>
          <tbody>
            {data?.map((row) => (
              <tr key={row.id} className="border-t">
                <td className="p-2">{row.name}</td>
                <td className="p-2">
                  <a href={row.url} target="_blank" className="underline">
                    {row.url}
                  </a>
                </td>
                <td className="p-2">{row.category}</td>
                <td className="p-2">
                  {row.published_at ? new Date(row.published_at).toLocaleDateString() : "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}


