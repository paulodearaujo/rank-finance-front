import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function Page() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("blog_embeddings")
    .select("url, model, dimension, created_at")
    .order("created_at", { ascending: false })
    .limit(1000);

  if (error) {
    return (
      <div className="p-6">
        <h1 className="text-lg font-semibold">Erro ao carregar embeddings</h1>
        <p className="text-sm text-muted-foreground">{error.message}</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-xl font-semibold">Blog Embeddings</h1>
      <div className="rounded-md border overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="p-2 text-left">URL</th>
              <th className="p-2 text-left">Model</th>
              <th className="p-2 text-right">Dim</th>
              <th className="p-2 text-left">Created</th>
            </tr>
          </thead>
          <tbody>
            {data?.map((row) => (
              <tr key={row.url} className="border-t">
                <td className="p-2">
                  <a href={row.url} target="_blank" className="underline">
                    {row.url}
                  </a>
                </td>
                <td className="p-2">{row.model}</td>
                <td className="p-2 text-right">{row.dimension}</td>
                <td className="p-2">{row.created_at ? new Date(row.created_at).toLocaleString() : "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}


