import { Page } from "@playwright/test";
const storageStatePath = "playwright/.auth/user.json";
import fs from "fs";

function getAuthHeaders(): Record<string, string> {
  if (!fs.existsSync(storageStatePath)) return {};

  const rawState = JSON.parse(fs.readFileSync(storageStatePath, "utf-8"));
  if (!rawState.cookies || rawState.cookies.length === 0) return {};

  const cookieString = rawState.cookies
    .map((c: { name: string; value: string }) => `${c.name}=${c.value}`)
    .join("; ");

  return {
    cookie: cookieString,
  };
}

export function getLhConfig(page: Page) {
  return {
    page,
    port: 9222,
    thresholds: {
      accessibility: 90,
      "best-practices": 85,
      seo: 80,
    },
    opts: {
      extraHeaders: getAuthHeaders(),
      disableStorageReset: true,
    },
  };
}
