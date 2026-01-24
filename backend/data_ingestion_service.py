"""
Real-time data ingestion service for silver market narratives.
Fetches data from News API and Reddit.
"""

import requests
import time
from typing import List, Dict
from datetime import datetime, timedelta
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()


class DataIngestionService:
    """Service to ingest real-time silver market data from multiple sources."""
    
    def _sanitize_text(self, text: str) -> str:
        """
        Sanitize text by removing or replacing problematic Unicode characters.
        This prevents encoding errors on Windows console.
        """
        if not text:
            return ""
        # Encode to ascii, ignoring characters that can't be encoded
        # Then decode back to string
        try:
            return text.encode('ascii', 'ignore').decode('ascii')
        except Exception:
            # Fallback: remove all non-ASCII characters manually
            return ''.join(char for char in text if ord(char) < 128)
    
    def __init__(self):
        """Initialize with API keys from environment variables."""
        self.news_api_key = os.getenv('NEWS_API_KEY', '')
        self.rapidapi_key = os.getenv('X_RAPIDAPI_KEY', '')
        
        if self.news_api_key:
            print(f"[OK] News API key loaded: {self.news_api_key[:10]}...")
        else:
            print("[WARN] Warning: NEWS_API_KEY not found in .env file")
            
        if self.rapidapi_key:
            print(f"[OK] RapidAPI key loaded: {self.rapidapi_key[:10]}...")
        else:
            print("[WARN] Warning: X_RAPIDAPI_KEY not found in .env file")
    
    def fetch_news_articles(self, query: str = "silver market", days_back: int = 14) -> List[Dict]:
        """
        Fetch recent news articles about silver markets from News API.
        
        Args:
            query: Search query for news articles
            days_back: How many days back to search
            
        Returns:
            List of articles with format: [{text, timestamp, source}, ...]
        """
        if not self.news_api_key:
            print("[WARN] No News API key - using fallback data")
            return self._get_fallback_news()
        
        try:
            print(f"[NEWS] Fetching news articles for '{query}'...")
            
            # Calculate date range
            from_date = (datetime.now() - timedelta(days=days_back)).strftime('%Y-%m-%d')
            
            # News API endpoint
            url = "https://newsapi.org/v2/everything"
            params = {
                'q': query,
                'from': from_date,
                'sortBy': 'publishedAt',
                'language': 'en',
                'apiKey': self.news_api_key,
                'pageSize': 100  # Max 100 articles
            }
            
            # Make request with timeout
            response = requests.get(url, params=params, timeout=10)
            response.raise_for_status()
            
            data = response.json()
            
            # Check for API errors
            if data.get('status') != 'ok':
                print(f"[ERROR] News API error: {data.get('message', 'Unknown error')}")
                return self._get_fallback_news()
            
            articles = []
            total_articles = data.get('totalResults', 0)
            print(f"[OK] News API returned {total_articles} total results")
            
            # Process each article
            for article in data.get('articles', []):
                try:
                    # Calculate days ago from published date
                    pub_date_str = article.get('publishedAt', '')
                    if pub_date_str:
                        pub_date = datetime.strptime(pub_date_str[:10], '%Y-%m-%d')
                        days_ago = (datetime.now() - pub_date).days
                    else:
                        days_ago = 1
                    
                    # Combine title and description for better context
                    title = self._sanitize_text(article.get('title', ''))
                    description = self._sanitize_text(article.get('description', ''))
                    text = f"{title} {description}".strip()
                    
                    # Skip if text is too short
                    if len(text) < 20:
                        continue
                    
                    articles.append({
                        'text': text,
                        'timestamp': min(days_ago, 14),  # Cap at 14 days
                        'date': pub_date.strftime('%Y-%m-%d'),
                        'source': self._sanitize_text(article.get('source', {}).get('name', 'News'))
                    })
                    
                except Exception as e:
                    # Skip problematic articles
                    continue
            
            print(f"[OK] Processed {len(articles)} news articles")
            return articles
            
        except requests.exceptions.Timeout:
            print("[ERROR] News API timeout - using fallback data")
            return self._get_fallback_news()
            
        except requests.exceptions.RequestException as e:
            print(f"[ERROR] News API request failed: {e}")
            return self._get_fallback_news()
            
        except Exception as e:
            print(f"[ERROR] Unexpected error fetching news: {e}")
            return self._get_fallback_news()
    
    def fetch_reddit_posts(self, subreddit: str = "Silverbugs+WallStreetBets", limit: int = 100) -> List[Dict]:
        """
        Fetch recent Reddit posts about silver using public JSON API.
        No authentication required!
        
        Args:
            subreddit: Subreddit(s) to search (use + to combine multiple)
            limit: Number of posts to fetch (max 100)
            
        Returns:
            List of posts with format: [{text, timestamp, source}, ...]
        """
        try:
            print(f"[REDDIT] Fetching Reddit posts from r/{subreddit}...")
            
            # Reddit's public JSON API endpoint
            url = f"https://www.reddit.com/r/{subreddit}/search.json"
            params = {
                'q': 'silver prediction OR silver price OR silver forecast OR SLV',
                'restrict_sr': 'on',
                'sort': 'new',
                'limit': min(limit, 100),
                't': 'month'  # Posts from last month to cover 14 days
            }
            
            # Reddit requires User-Agent header
            headers = {
                'User-Agent': 'NarrativeDetectionBot/1.0 (Educational Hackathon Project)'
            }
            
            # Make request
            response = requests.get(url, params=params, headers=headers, timeout=10)
            response.raise_for_status()
            
            data = response.json()
            posts = []
            
            # Check if data is valid
            if 'data' not in data or 'children' not in data['data']:
                print("[WARN] Reddit API returned unexpected format")
                return []
            
            # Process each post
            for post in data['data']['children']:
                try:
                    post_data = post['data']
                    
                    # Calculate days ago from UTC timestamp
                    created_utc = post_data.get('created_utc', time.time())
                    days_ago = int((time.time() - created_utc) / 86400)
                    
                    # Combine title and selftext for full context
                    title = self._sanitize_text(post_data.get('title', ''))
                    selftext = self._sanitize_text(post_data.get('selftext', ''))
                    text = f"{title} {selftext}".strip()
                    
                    # Skip if too short or too long
                    if len(text) < 20:
                        continue
                    if len(text) > 1000:
                        text = text[:1000]  # Truncate very long posts
                    
                    posts.append({
                        'text': text,
                        'timestamp': min(days_ago, 14),
                        'date': datetime.fromtimestamp(created_utc).strftime('%Y-%m-%d'),
                        'source': 'Reddit'
                    })
                    
                except Exception as e:
                    # Skip problematic posts
                    continue
            
            print(f"[OK] Processed {len(posts)} Reddit posts")
            return posts
            
        except requests.exceptions.Timeout:
            print("[ERROR] Reddit API timeout")
            return []
            
        except requests.exceptions.RequestException as e:
            print(f"[ERROR] Reddit API request failed: {e}")
            return []
            
        except Exception as e:
            print(f"[ERROR] Unexpected error fetching Reddit: {e}")
            return []
    def fetch_yahoo_finance_news(self, symbol: str = "silver") -> List[Dict]:
        """
        Fetch news from Yahoo Finance via RapidAPI.
        """
        if not self.rapidapi_key:
            return []
            
        try:
            print(f"[YAHOO] Fetching Yahoo Finance news for '{symbol}'...")
            
            url = "https://apidojo-yahoo-finance-v1.p.rapidapi.com/auto-complete"
            
            querystring = {"q": symbol, "region": "US"}
            
            headers = {
                "X-RapidAPI-Key": self.rapidapi_key,
                "X-RapidAPI-Host": "apidojo-yahoo-finance-v1.p.rapidapi.com"
            }
            
            response = requests.get(url, headers=headers, params=querystring, timeout=10)
            response.raise_for_status()
            
            data = response.json()
            articles = []
            
            # Yahoo 'news' is usually inside the 'news' key of auto-complete
            for item in data.get('news', []):
                try:
                    title = self._sanitize_text(item.get('title', ''))
                    # Yahoo news items often don't have descriptions, so we repeat title or use publisher
                    publisher = item.get('publisher', '')
                    text = f"{title} - {publisher}".strip()
                    
                    if len(text) < 10:
                        continue
                        
                    # Timestamp is often in 'providerPublishTime' (unix epoch)
                    pub_time = item.get('providerPublishTime', time.time())
                    days_ago = int((time.time() - pub_time) / 86400)
                    
                    articles.append({
                        'text': text,
                        'timestamp': min(days_ago, 14),
                        'date': datetime.fromtimestamp(pub_time).strftime('%Y-%m-%d'),
                        'source': 'Yahoo Finance'
                    })
                except Exception:
                    continue
            
            print(f"[OK] Processed {len(articles)} Yahoo Finance articles")
            return articles
            
        except Exception as e:
            print(f"[ERROR] Yahoo Finance API error: {e}")
            return []

    def fetch_x_posts(self, query: str = "silver price") -> List[Dict]:
        """
        Fetch recent posts from X (Twitter) via RapidAPI.
        Using twitter154.p.rapidapi.com or similar scraper.
        """
        if not self.rapidapi_key:
            return []
            
        try:
            print(f"[X] Fetching X posts for '{query}'...")
            
            # Using a popular Twitter Scraper on RapidAPI
            url = "https://twitter154.p.rapidapi.com/search/search"
            
            querystring = {
                "query": query,
                "section": "top",
                "limit": "20"
            }
            
            headers = {
                "X-RapidAPI-Key": self.rapidapi_key,
                "X-RapidAPI-Host": "twitter154.p.rapidapi.com"
            }
            
            response = requests.get(url, headers=headers, params=querystring, timeout=12)
            
            # Handle if this specific API host fails/is invalid for the key
            if response.status_code == 403 or response.status_code == 401:
                print(f"[WARN] X API Key invalid for host 'twitter154'. User might need to subscribe.")
                return []
            
            response.raise_for_status()
            data = response.json()
            
            posts = []
            results = data.get('results', [])
            if not results and 'timeline' in data: # Some APIs return different structure
                results = data.get('timeline', [])
                
            for item in results:
                try:
                    # Extract text
                    text = self._sanitize_text(item.get('text', '') or item.get('content', ''))
                    if len(text) < 10:
                        continue
                        
                    # Extract date
                    date_str = item.get('creation_date', '') # Format: Mon Oct 23 ...
                    # If date parsing fails, use today
                    days_ago = 0
                    pub_date_str = datetime.now().strftime('%Y-%m-%d')
                    
                    if date_str:
                        try:
                            # Try generic parsing or just assume recent
                            # Often formatted as "Day MMM DD HH:MM:SS +XXXX YYYY"
                            # We'll just rely on ingestion time for now if parsing complex
                            pass 
                        except:
                            pass
                    
                    posts.append({
                        'text': text,
                        'timestamp': min(days_ago, 14),
                        'date': pub_date_str,
                        'source': 'X (Twitter)'
                    })
                except Exception:
                    continue
            
            print(f"[OK] Processed {len(posts)} X posts")
            return posts
            
        except Exception as e:
            print(f"[ERROR] X API error: {e}")
            return []
    def fetch_all_sources(self) -> List[Dict]:
        """
        Fetch data from all available sources and combine them.
        
        Returns:
            Combined list of all data points from News API and Reddit
        """
        print("\n" + "="*60)
        print(">>> STARTING REAL-TIME DATA INGESTION")
        print("="*60)
        
        all_data = []
        
        # Fetch from News API
        news_articles = self.fetch_news_articles()
        all_data.extend(news_articles)
        
        # Fetch from Reddit
        reddit_posts = self.fetch_reddit_posts()
        all_data.extend(reddit_posts)
        
        # Fetch from Yahoo Finance
        yahoo_news = self.fetch_yahoo_finance_news()
        all_data.extend(yahoo_news)
        
        # Fetch from X (Twitter)
        x_posts = self.fetch_x_posts()
        all_data.extend(x_posts)
        
        # Filter out empty texts
        all_data = [item for item in all_data if item['text'].strip()]
        
        # Remove duplicate texts
        seen_texts = set()
        unique_data = []
        for item in all_data:
            text_lower = item['text'].lower()[:100]  # First 100 chars for comparison
            if text_lower not in seen_texts:
                seen_texts.add(text_lower)
                unique_data.append(item)
        
        print("\n" + "="*60)
        print("[OK] INGESTION COMPLETE")
        print(f"  - News articles: {len(news_articles)}")
        print(f"  - Reddit posts: {len(reddit_posts)}")
        print(f"  - Reddit posts: {len(reddit_posts)}")
        print(f"  - Yahoo news: {len(yahoo_news)}")
        print(f"  - X posts: {len(x_posts)}")
        print(f"  - Total unique: {len(unique_data)}")
        print("="*60 + "\n")
        
        return unique_data
    
    def _get_fallback_news(self) -> List[Dict]:
        """
        Fallback to sample data if API calls fail.
        """
        print("[FALLBACK] Using sample data as fallback")
        from sample_data import SILVER_NEWS_DATA
        return SILVER_NEWS_DATA


# Singleton instance
_ingestion_service = None


def get_ingestion_service() -> DataIngestionService:
    """Get or create the data ingestion service singleton."""
    global _ingestion_service
    if _ingestion_service is None:
        _ingestion_service = DataIngestionService()
    return _ingestion_service