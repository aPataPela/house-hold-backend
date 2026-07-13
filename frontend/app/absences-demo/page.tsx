import { Suspense } from "react";
import AbsencesDemoClient from "./absences-demo-client";

export const dynamic = "force-dynamic";

export default async function AbsencesDemoPage({
  searchParams,
}: {
  searchParams?: Promise<{ scenario?: string }> | { scenario?: string };
}) {
  const resolved = searchParams ? await searchParams : {};
  const scenario = resolved.scenario ?? "happy";
  return (
    <Suspense fallback={null}>
      <AbsencesDemoClient scenario={scenario} />
    </Suspense>
  );
}
