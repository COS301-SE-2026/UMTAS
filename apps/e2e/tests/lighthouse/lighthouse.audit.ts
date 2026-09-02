import test from "@playwright/test";
import lighthouse from "lighthouse";
import fs from "fs";

const storageStatePath = "playwright/.auth/user.json";
function getCookieHeader(): string {
  if (!fs.existsSync(storageStatePath)) return "";
  const rawState = JSON.parse(fs.readFileSync(storageStatePath, "utf-8"));
  if (!rawState.cookies || rawState.cookies.length === 0) return "";

  return rawState.cookies
    .map((c: { name: string; value: string }) => `${c.name}=${c.value}`)
    .join("; ");
}
