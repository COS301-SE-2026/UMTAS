import { redirect } from "next/navigation";
import { headers } from "next/headers";

export default async function RootPage() {
  const cookieHeader = (await headers()).get("cookie") ?? "";
  const res = await fetch(
    `${process.env.API_URL || "http://localhost:3001"}/api/auth/session`,
    {
      headers: { cookie: cookieHeader },
      cache: "no-store",
    },
  ).catch(() => null);

  const session = res?.ok ? await res.json() : null;

  if (session?.user) {
    redirect("/dashboard");
  } else {
    redirect("/login");
  }
}
