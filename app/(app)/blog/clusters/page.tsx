import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function Page() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("blog_clusters")
    .select("run_id, url, cluster_id, cluster_name, parent_id, parent_name, distance")
    .order("run_id", { ascending: false })
    .limit(1000);

  if (error) {
    return (
      <div className="p-6">
        <h1 className="text-lg font-semibold">Erro ao carregar clusters</h1>
        <p className="text-sm text-muted-foreground">{error.message}</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-xl font-semibold">Blog Clusters</h1>
      <div className="rounded-md border overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="p-2 text-left">Run</th>
              <th className="p-2 text-left">URL</th>
              <th className="p-2 text-right">Cluster</th>
              <th className="p-2 text-left">Name</th>
              <th className="p-2 text-right">Parent</th>
              <th className="p-2 text-left">Parent Name</th>
              <th className="p-2 text-right">Distance</th>
            </tr>
          </thead>
          <tbody>
            {data?.map((row) => (
              <tr key={`${row.run_id}-${row.url}`} className="border-t">
                <td className="p-2">{row.run_id}</td>
                <td className="p-2">
                  <a href={row.url} target="_blank" className="underline">
                    {row.url}
                  </a>
                </td>
                <td className="p-2 text-right">{row.cluster_id}</td>
                <td className="p-2">{row.cluster_name ?? "-"}</td>
                <td className="p-2 text-right">{row.parent_id ?? "-"}</td>
                <td className="p-2">{row.parent_name ?? "-"}</td>
                <td className="p-2 text-right">{row.distance?.toFixed(3) ?? "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}


