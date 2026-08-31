import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createUrl } from "../../utilities/request";

export default async function RootPage() {
  // const cookieHeader = (await headers()).get("cookie") ?? "";
  // const res = await fetch(createUrl("/auth/get-session"), {
  //   headers: { cookie: cookieHeader },
  //   cache: "no-store",
  // }).catch(() => null);

  // const session = res?.ok ? await res.json() : null;

  // if (session?.user) {
  redirect("/dashboard");
  // } else {
  //   redirect("/login");
  // }
}
