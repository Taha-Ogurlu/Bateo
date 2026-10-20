import { marked } from "marked";
import { db } from "./db";

/**
 * Not içeriği zengin metin (HTML) tabanlıdır; eski markdown notları bir kez çevirir.
 */
export async function migrateNotesToHtml(): Promise<void> {
  const notes = await db.notes.toArray();
  const updates: { id: string; content: string }[] = [];

  for (const n of notes) {
    const c = n.content ?? "";
    const looksLikeHtml = /<[a-z][\s\S]*>/i.test(c);
    if (c.trim() && !looksLikeHtml) {
      updates.push({ id: n.id, content: marked.parse(c, { async: false }) as string });
    }
  }

  if (updates.length === 0) return;
  await db.transaction("rw", db.notes, async () => {
    for (const u of updates) {
      await db.notes.update(u.id, { content: u.content, updatedAt: Date.now() });
    }
  });
}
