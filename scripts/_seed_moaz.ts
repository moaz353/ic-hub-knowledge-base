import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
const URL = process.env.SUPABASE_URL!;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const sb = createClient(URL, KEY);

const data = JSON.parse(readFileSync("/tmp/import.json","utf8"));
const { data: u } = await sb.from("profiles").select("id, username").eq("username","Moaz_IC").maybeSingle();
if (!u) { console.error("Moaz user not found"); process.exit(1); }
const user_id = u.id;
console.log("Moaz user_id:", user_id);

await sb.from("topics").delete().eq("user_id", user_id);

const topicsRows = data.topics.map((t: any) => ({
  user_id, id: t.id, name: t.name, full_name: t.fullName, description: t.description,
  color: t.color, icon: t.icon, sort_order: t.sort,
}));
const r1 = await sb.from("topics").insert(topicsRows);
if (r1.error) { console.error("topics:", r1.error); process.exit(1); }
console.log("topics:", topicsRows.length);

const itemsRows = data.items.map((it: any) => ({
  user_id, id: it.id, topic_id: it.topic_id,
  type: it.type || "note", title: it.title || "", description: it.description || "",
  file: it.file || "", thumbnail: it.thumbnail || "", tags: it.tags || [],
  source: it.source || "", date: it.date || null,
  rating: it.rating || 0, annotation: it.annotation || "",
  favorite: !!it.favorite, pinned: !!it.pinned,
}));
const r2 = await sb.from("items").insert(itemsRows);
if (r2.error) { console.error("items:", r2.error); process.exit(1); }
console.log("items:", itemsRows.length);
