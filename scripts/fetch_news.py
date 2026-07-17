import feedparser
import requests
import os
from datetime import datetime

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")

HEADERS = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json"
}

RSS_FEEDS = [
    {
        "url": "https://news.google.com/rss/search?q=বাংলাদেশ+সরকার+বিএনপি&hl=bn&gl=BD&ceid=BD:bn",
        "category": "সরকারি"
    },
    {
        "url": "https://news.google.com/rss/search?q=প্রধানমন্ত্রী+তারেক+রহমান&hl=bn&gl=BD&ceid=BD:bn",
        "category": "সরকারি"
    },
    {
        "url": "https://news.google.com/rss/search?q=বাংলাদেশ+জাতীয়+সংসদ&hl=bn&gl=BD&ceid=BD:bn",
        "category": "সংসদ"
    },
    {
        "url": "https://news.google.com/rss/search?q=বাংলাদেশ+মন্ত্রিসভা&hl=bn&gl=BD&ceid=BD:bn",
        "category": "মন্ত্রিসভা"
    },
]

def get_existing_titles():
    res = requests.get(
        f"{SUPABASE_URL}/rest/v1/news?select=title&limit=500",
        headers=HEADERS
    )
    if res.status_code == 200:
        return {item["title"] for item in res.json()}
    return set()

def insert_news(item):
    res = requests.post(
        f"{SUPABASE_URL}/rest/v1/news",
        headers=HEADERS,
        json=item
    )
    return res.status_code == 201

def main():
    existing = get_existing_titles()
    print(f"বিদ্যমান সংবাদ: {len(existing)}টি")
    
    total_added = 0

    for feed_info in RSS_FEEDS:
        try:
            feed = feedparser.parse(feed_info["url"])
            print(f"Feed থেকে {len(feed.entries)}টি সংবাদ পাওয়া গেছে")

            for entry in feed.entries:
                title = entry.get("title", "").strip()
                source = entry.get("source", {}).get("title", "Google News")
                published = entry.get("published", datetime.now().isoformat())

                if not title or title in existing:
                    continue

                item = {
                    "title": title,
                    "source": source,
                    "time": published,
                    "category": feed_info["category"]
                }

                if insert_news(item):
                    existing.add(title)
                    total_added += 1
                    print(f"✅ যোগ হয়েছে: {title[:50]}")

        except Exception as e:
            print(f"❌ Error: {e}")

    print(f"\nমোট {total_added}টি নতুন সংবাদ যোগ হয়েছে")

if __name__ == "__main__":
    main()