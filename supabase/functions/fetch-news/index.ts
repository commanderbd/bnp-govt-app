import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const KEYWORDS = [
  "বাংলাদেশ সরকার",
  "প্রধানমন্ত্রী তারেক",
  "বিএনপি সরকার",
  "মন্ত্রিসভা বাংলাদেশ",
  "জাতীয় সংসদ বাংলাদেশ",
];

const RSS_FEEDS = KEYWORDS.map(kw => ({
  url: `https://news.google.com/rss/search?q=${encodeURIComponent(kw)}&hl=bn&gl=BD&ceid=BD:bn`,
  source: "Google News",
  category: "সরকারি"
}));

function parseRSS(xml: string, source: string, category: string) {
  const items: { title: string; source: string; time: string; category: string }[] = [];
  const itemMatches = xml.matchAll(/<item>([\s\S]*?)<\/item>/g);

  for (const match of itemMatches) {
    const itemXml = match[1];

    const titleMatch = itemXml.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/) ||
                       itemXml.match(/<title>(.*?)<\/title>/);
    const pubDateMatch = itemXml.match(/<pubDate>(.*?)<\/pubDate>/);
    const sourceMatch = itemXml.match(/<source[^>]*>(.*?)<\/source>/);

    const title = titleMatch?.[1]?.trim() || "";
    const pubDate = pubDateMatch?.[1]?.trim() || new Date().toISOString();
    const newsSource = sourceMatch?.[1]?.trim() || source;

    if (title && title.length > 10) {
      items.push({ title, source: newsSource, time: pubDate, category });
    }
  }

  return items;
}

Deno.serve(async () => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  let totalAdded = 0;
  const errors: string[] = [];

  for (const feed of RSS_FEEDS) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);

      const response = await fetch(feed.url, {
        signal: controller.signal,
        headers: { "User-Agent": "Mozilla/5.0" }
      });
      clearTimeout(timeout);

      const xml = await response.text();
      const items = parseRSS(xml, feed.source, feed.category);

      for (const item of items) {
        const { data: existing } = await supabase
          .from("news")
          .select("id")
          .eq("title", item.title)
          .single();

        if (!existing) {
          const { error } = await supabase.from("news").insert(item);
          if (!error) totalAdded++;
        }
      }
    } catch (err) {
      errors.push(`${feed.url}: ${err}`);
      console.error("Feed error:", err);
    }
  }

  return new Response(
    JSON.stringify({ success: true, added: totalAdded, errors }),
    { headers: { "Content-Type": "application/json" } }
  );
});