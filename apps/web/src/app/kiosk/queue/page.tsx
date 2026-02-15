import QueueClient from "./queue-client";

type Service = {
  id: number;
  code: string;
  name: string;
  description?: string | null;
};

export default async function QueuePage() {
  const apiBase = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000/api";
  const response = await fetch(`${apiBase}/services`, { cache: "no-store" });
  const services = response.ok ? ((await response.json()) as Service[]) : [];

  return <QueueClient services={services} />;
}
