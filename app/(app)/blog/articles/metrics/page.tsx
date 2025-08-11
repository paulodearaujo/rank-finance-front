import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function Page() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("blog_articles_metrics")
    .select(
      "url, week_ending, gsc_clicks, gsc_impressions, gsc_ctr, gsc_position, amplitude_conversions",
    )
    .order("week_ending", { ascending: false })
    .limit(1000);

  if (error) {
    return (
      <div className="p-6">
        <h1 className="text-lg font-semibold">Erro ao carregar métricas</h1>
        <p className="text-sm text-muted-foreground">{error.message}</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-xl font-semibold">Blog Articles Metrics</h1>
      <div className="rounded-md border overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="p-2 text-left">Week</th>
              <th className="p-2 text-left">URL</th>
              <th className="p-2 text-right">Clicks</th>
              <th className="p-2 text-right">Impr.</th>
              <th className="p-2 text-right">CTR</th>
              <th className="p-2 text-right">Pos.</th>
              <th className="p-2 text-right">Conv.</th>
            </tr>
          </thead>
          <tbody>
            {data?.map((row) => (
              <tr key={`${row.url}-${row.week_ending}`} className="border-t">
                <td className="p-2">{new Date(row.week_ending).toLocaleDateString()}</td>
                <td className="p-2">
                  <a href={row.url} target="_blank" className="underline">
                    {row.url}
                  </a>
                </td>
                <td className="p-2 text-right">{row.gsc_clicks ?? 0}</td>
                <td className="p-2 text-right">{row.gsc_impressions ?? 0}</td>
                <td className="p-2 text-right">{row.gsc_ctr?.toFixed(3) ?? "0.000"}</td>
                <td className="p-2 text-right">{row.gsc_position?.toFixed(2) ?? "0.00"}</td>
                <td className="p-2 text-right">{row.amplitude_conversions ?? 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}


