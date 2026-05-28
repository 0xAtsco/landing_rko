import { getTrafficCsv } from "@/lib/rko/server-store";

export const runtime = "nodejs";

export async function GET() {
  const csv = await getTrafficCsv();
  return new Response(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="rko-source-report.csv"`,
    },
  });
}
