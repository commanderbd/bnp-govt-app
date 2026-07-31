import os
import feedparser
import requests
from bs4 import BeautifulSoup
from supabase import create_client

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_KEY")
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

RSS_FEEDS = [
    "https://news.google.com/rss/search?q=বাংলাদেশ+বিএনপি+সরকার&hl=bn&gl=BD&ceid=BD:bn",
    "https://news.google.com/rss/search?q=তারেক+রহমান&hl=bn&gl=BD&ceid=BD:bn",
    "https://news.google.com/rss/search?q=বাংলাদেশ+মন্ত্রিসভা&hl=bn&gl=BD&ceid=BD:bn",
]

def fetch_article_content(url):
    try:
        headers = {"User-Agent": "Mozilla/5.0"}
        res = requests.get(url, headers=headers, timeout=8)
        soup = BeautifulSoup(res.content, "html.parser")
        # মূল content খোঁজা
        for tag in ["article", "main", ".article-body", ".content"]:
            el = soup.select_one(tag)
            if el:
                text = el.get_text(separator="\n", strip=True)
                return text[:2000] if len(text) > 2000 else text
        # fallback — paragraph থেকে
        paragraphs = soup.find_all("p")
        text = "\n".join(p.get_text(strip=True) for p in paragraphs[:10])
        return text[:2000] if text else None
    except:
        return None

def fetch_and_save():
    existing = supabase.from_("news").select("title").execute()
    existing_titles = {item["title"] for item in (existing.data or [])}
    
    new_count = 0
    for feed_url in RSS_FEEDS:
        feed = feedparser.parse(feed_url)
        for entry in feed.entries[:5]:
            title = entry.get("title", "").strip()
            if not title or title in existing_titles:
                continue
            
            link = entry.get("link", "")
            content = fetch_article_content(link)
            
            news_item = {
                "title": title,
                "source": entry.get("source", {}).get("title", "Google News"),
                "time": entry.get("published", ""),
                "category": "সরকারি",
                "link": link,
                "content": content or "",
            }
            
            result = supabase.from_("news").insert(news_item).execute()
            if result.data:
                existing_titles.add(title)
                new_count += 1
                print(f"যোগ করা হয়েছে: {title[:50]}")
    
    print(f"মোট {new_count}টি নতুন সংবাদ যোগ হয়েছে")

if __name__ == "__main__":
    fetch_and_save()