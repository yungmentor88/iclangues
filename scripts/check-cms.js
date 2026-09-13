/**
 * Verifies the CMS migrations landed correctly.
 *
 * Run AFTER applying supabase/migrations/0001..0004:
 *   node scripts/check-cms.js
 *
 * Uses only the publishable (anon) key from .env.local, so it checks exactly
 * what an anonymous visitor can see — which also proves the RLS policies do
 * what they claim. It never needs a service-role key.
 */

const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");

function loadEnv() {
  const file = path.join(ROOT, ".env.local");
  if (!fs.existsSync(file)) {
    console.error("✗ .env.local not found — cannot check.");
    process.exit(1);
  }
  const env = {};
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m) env[m[1]] = m[2].trim();
  }
  return env;
}

const env = loadEnv();
const URL = env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!URL || !KEY) {
  console.error("✗ Supabase URL or key missing from .env.local");
  process.exit(1);
}

/** Row count via the Content-Range header, or an error code. */
async function count(table, query = "") {
  const url = `${URL}/rest/v1/${table}?select=*${query}`;
  const res = await fetch(url, {
    headers: {
      apikey: KEY,
      Authorization: `Bearer ${KEY}`,
      Prefer: "count=exact",
      Range: "0-0",
    },
  });
  if (res.status === 404) return { missing: true };
  if (!res.ok) return { error: `HTTP ${res.status}` };
  const range = res.headers.get("content-range") || "";
  const total = range.split("/")[1];
  return { count: total === "*" ? 0 : Number(total) };
}

/* table -> how many rows the seed should produce (null = don't care) */
const EXPECTED = {
  ui_strings: 112,
  pages: 4,
  page_sections: 17,
  nav_items: 4,
  faqs: 5,
  courses: 13,
  site_settings: 1,
  teachers: null,
  media: null,
  page_seo: null,
  content_versions: null,
};

(async () => {
  console.log(`Checking ${URL}\n`);

  let missing = 0;
  let mismatched = 0;

  for (const [table, expected] of Object.entries(EXPECTED)) {
    const r = await count(table);

    if (r.missing) {
      console.log(`  ✗ ${table.padEnd(18)} table does not exist — migration not applied`);
      missing++;
      continue;
    }
    if (r.error) {
      console.log(`  ? ${table.padEnd(18)} ${r.error}`);
      continue;
    }
    if (expected === null) {
      console.log(`  ✓ ${table.padEnd(18)} ${r.count} rows`);
      continue;
    }
    if (r.count === expected) {
      console.log(`  ✓ ${table.padEnd(18)} ${r.count} rows`);
    } else {
      console.log(`  ! ${table.padEnd(18)} ${r.count} rows (expected ${expected})`);
      mismatched++;
    }
  }

  /* RLS spot-check: anon must NOT be able to write. */
  console.log("\nRLS checks (anonymous key):");
  const res = await fetch(`${URL}/rest/v1/ui_strings`, {
    method: "POST",
    headers: {
      apikey: KEY,
      Authorization: `Bearer ${KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify({
      key: "__rls_probe__",
      section: "probe",
      draft_value: { en: "should be rejected" },
    }),
  });

  if (res.status === 404) {
    console.log("  – skipped (tables not migrated)");
  } else if (res.ok) {
    console.log("  ✗ anon INSERT SUCCEEDED — RLS is not protecting ui_strings!");
    mismatched++;
  } else {
    console.log(`  ✓ anon INSERT correctly rejected (HTTP ${res.status})`);
  }

  console.log("");
  if (missing) {
    console.log(`${missing} table(s) missing — apply supabase/migrations/0001..0004 in order.`);
    process.exit(1);
  }
  if (mismatched) {
    console.log(`${mismatched} check(s) need attention.`);
    process.exit(1);
  }
  console.log("All CMS checks passed.");
})().catch((e) => {
  console.error("check failed:", e.message);
  process.exit(1);
});
