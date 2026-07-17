import feedparser
import requests
import os
from datetime import datetime

SUPABASE_URL = os.environ.get("SUPABASE_URL", "").strip()
SUPABASE_KEY = os.environ.get("SUPABASE_KEY", "").strip()

HEADERS = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=minimal"
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
    print(f"❌ Existing titles error: {res.status_code} - {res.text}")
    return set()

def insert_news(item):
    res = requests.post(
        f"{SUPABASE_URL}/rest/v1/news",
        headers=HEADERS,
        json=item
    )
    if res.status_code not in [200, 201]:
        print(f"❌ Insert error: {res.status_code} - {res.text[:100]}")
        return False
    return True

def main():
    existing = get_existing_titles()
    print(f"বিদ্যমান সংবাদ: {len(existing)}টি")

    total_added = 0

    for feed_info in RSS_FEEDS:
        try:
            feed = feedparser.parse(feed_info["url"])
            print(f"Feed থেকে {len(feed.entries)}টি সংবাদ পাওয়া গেছে")

            for entry in feed.entries[:10]:
                title = entry.get("title", "").strip()
                source = entry.get("source", {}).get("title", "Google News")

                # তারিখ সহজ format-এ রাখুন
                try:
                    pub = entry.get("published", "")
                    if pub:
                        dt = datetime(*entry.published_parsed[:6])
                        time_str = dt.strftime("%d %b %Y")
                    else:
                        time_str = datetime.now().strftime("%d %b %Y")
                except:
                    time_str = datetime.now().strftime("%d %b %Y")

                if not title or title in existing:
                    continue

                item = {
                    "title": title,
                    "source": source,
                    "time": time_str,
                    "category": feed_info["category"]
                }

                if insert_news(item):
                    existing.add(title)
                    total_added += 1