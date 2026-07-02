import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RSS_FEEDS = [
  {
    url: "https://www.prothomalo.com/feed",
    source: "প্রথম আলো"
  },
  {
    url: "https://www.kalerkantho.com/rss.xml",
    source: "কালের কণ্ঠ"
  },
  {
    url: "https://bssnews.net/feed",
    source: "বিএসএস"
  },
];

const KEYWORDS = [
  "প্রধানমন্ত্রী", "মন্ত্রী", "সংসদ", "সরকার",
  "মন্ত্রণালয়", "বিএনপি", "তারেক", "মির্জা ফখরুল",
  "cabinet", "parliament", "minister", "government"
];

function isRelevant(title: string): boolean {
  return KEYWORDS.some(kw =>
    title.toLowerCase().includes(kw.toLowerCase())
  );
}

function parseRSS(xml: string, source: string) {
  const items: { title: string; source: string; time: string; category: string }[] = [];
  const itemMatches = xml.matchAll(/<item>([\s\S]*?)<\/item>/g);

  for (const match of itemMatches) {
    const itemXml = match[1];

    const titleMatch = itemXml.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/) ||
                       itemXml.match(/<title>(.*?)<\/title>/);
    const pubDateMatch = itemXml.match(/<pubDate>(.*?)<\/pubDate>/);

    const title = titleMatch?.[1]?.trim() || "";
    const pubDate = pubDateMatch?.[1]?.trim() || new Date().toLocaleDateString("bn-BD");

    if (title && isRelevant(title)) {
      items.push({
        title,
        source,
        time: pubDate,
        category: "সরকারি",
      });
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

  for (const feed of RSS_FEEDS) {
    try {
      const response = await fetch(feed.url);
      const xml = await response.text();
      const items = parseRSS(xml, feed.source);

      for (const item of items) {
        const { data: existing } = await supabase
          .from("news")
          .select("id")
          .eq("title", item.title)
          .single();

        if (!existing) {
          await supabase.from("news").insert(item);
          totalAdded++;
        }
      }
    } catch (err) {
      console.error(`Feed error (${feed.source}):`, err);
    }
  }

  return new Response(
    JSON.stringify({ success: true, added: totalAdded }),
    { headers: { "Content-Type": "application/json" } }
  );
});