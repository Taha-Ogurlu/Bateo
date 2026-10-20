// Supabase uçtan uca testi: rastgele bir test hesabıyla kayıt olur,
// push_records RPC ile bir kayıt yazar, geri okur ve doğrular.
// Çalıştırma: npm run test:cloud
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url)) + "/..";

function readEnv() {
  const out = {};
  try {
    const raw = readFileSync(path.join(root, ".env"), "utf8");
    for (const line of raw.split(/\r?\n/)) {
      const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
      if (m) out[m[1]] = m[2].trim();
    }
  } catch {
    /* yok */
  }
  return out;
}

const env = readEnv();
const url = env.VITE_SUPABASE_URL;
const key = env.VITE_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.log("CLOUD_TEST " + JSON.stringify({ ok: false, reason: ".env eksik" }));
  process.exit(1);
}

const sb = createClient(url, key, { auth: { persistSession: false } });

const email = `bateo-test-${Date.now()}@example.com`;
const password = `Test-${Math.random().toString(36).slice(2)}A1`;

const result = { ok: false, step: "start" };

try {
  const up = await sb.auth.signUp({ email, password });
  if (up.error) throw new Error("signUp: " + up.error.message);
  if (!up.data.session) {
    throw new Error("Oturum yok — Supabase'de Authentication → Email → 'Confirm email' KAPALI olmalı.");
  }
  result.step = "signup";

  const docId = "test_" + Date.now();
  const now = Date.now();
  const push = await sb.rpc("push_records", {
    p_records: [
      {
        table_name: "notes",
        doc_id: docId,
        data: { id: docId, title: "Test notu", content: "<p>merhaba</p>", updatedAt: now },
        updated_at: now,
        deleted: false,
      },
    ],
  });
  if (push.error) throw new Error("push_records: " + push.error.message);
  result.step = "push";

  const sel = await sb.from("records").select("doc_id,data,deleted").eq("doc_id", docId);
  if (sel.error) throw new Error("select: " + sel.error.message);
  const rows = sel.data?.length ?? 0;
  result.step = "select";

  await sb.from("records").delete().eq("doc_id", docId);
  await sb.auth.signOut();

  result.ok = rows === 1;
  result.rows = rows;
  result.account = email.replace(/@.*/, "@…");
} catch (e) {
  result.error = e.message;
}

console.log("CLOUD_TEST " + JSON.stringify(result));
process.exit(result.ok ? 0 : 1);
