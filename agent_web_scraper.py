# agent_web_scraper.py
"""
Agent for scraping internal links from a website using Playwright and LangChain WebBaseLoader.
Stores results in a JSON file.
"""
import sys
import asyncio

if sys.platform.startswith('win'):
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

import json
import re
from urllib.parse import urlparse, urljoin
from typing import List, Optional

from playwright.async_api import async_playwright
from langchain_community.document_loaders import WebBaseLoader

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.responses import JSONResponse

# Requirements:
# pip install langchain-nebius
# You must set up Nebius credentials as per langchain-nebius documentation.
from langchain_nebius import ChatNebius
from langchain_core.prompts import ChatPromptTemplate
from dotenv import load_dotenv

load_dotenv()
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# Couchbase settings
import os
from couchbase.cluster import Cluster
from couchbase.options import ClusterOptions
from couchbase.auth import PasswordAuthenticator
from couchbase.exceptions import DocumentNotFoundException

USER_ID = "Bruce"


# --- Couchbase Memory Class ---
class CouchbaseMemory:
    def __init__(
        self,
        conn_str,
        username,
        password,
        bucket_name,
        scope_name="_default",
        collection_name="_default",
    ):
        self.cluster = Cluster(
            conn_str, ClusterOptions(PasswordAuthenticator(username, password))
        )
        self.bucket = self.cluster.bucket(bucket_name)
        self.scope = self.bucket.scope(scope_name)
        self.collection = self.scope.collection(collection_name)
        print("[Memory System] Connected to Couchbase Capella")

    def _doc_id(self, url: str):
        return f"url::{url}"

    def add(self, category: str, url: str, data: object):
        doc_id = self._doc_id(url)
        try:
            doc = self.collection.get(doc_id).content_as[dict]
        except DocumentNotFoundException:
            doc = {}

        doc.setdefault(category, [])
        if data not in doc[category]:
            doc[category].append(data)
            self.collection.upsert(doc_id, doc)
            print(
                f"[Memory System] Saved data for url '{url}' in category '{category}': '{data}'"
            )
        return True

    def search_by_category(self, url: str, category: str) -> list:
        doc_id = self._doc_id(url)
        try:
            doc = self.collection.get(doc_id).content_as[dict]
            results = doc.get(category, [])
        except DocumentNotFoundException:
            results = []
        print(
            f"[Memory System] Retrieved {len(results)} items from category '{category}' for url '{url}'."
        )
        return results


# --- Replace with your Capella credentials ---
COUCHBASE_CONN_STR = os.getenv("COUCHBASE_CONN_STR")
COUCHBASE_USERNAME = os.getenv("COUCHBASE_USERNAME")
COUCHBASE_PASSWORD = os.getenv("COUCHBASE_PASSWORD")
COUCHBASE_BUCKET = os.getenv("COUCHBASE_BUCKET")

persistent_data = CouchbaseMemory(
    conn_str=COUCHBASE_CONN_STR,
    username=COUCHBASE_USERNAME,
    password=COUCHBASE_PASSWORD,
    bucket_name=COUCHBASE_BUCKET,
    scope_name="_default",  # match your setup
    collection_name="_default",  # match your setup
)


# Add CORS middleware for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all for dev; restrict in prod
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def is_internal_link(base_url, link):
    """Check if the link is internal (same domain as base_url)."""
    parsed_base = urlparse(base_url)
    parsed_link = urlparse(urljoin(base_url, link))
    return parsed_base.netloc == parsed_link.netloc

def filter_links(base_url, links):
    """Filter only internal and non-social links."""
    social_domains = [
        'facebook.com', 'twitter.com', 'linkedin.com', 'instagram.com', 'youtube.com', 't.me', 'wa.me', 'pinterest.com', 'reddit.com', 'discord.com'
    ]
    filtered = []
    for link in links:
        parsed = urlparse(urljoin(base_url, link))
        if any(domain in parsed.netloc for domain in social_domains):
            continue
        if is_internal_link(base_url, link):
            filtered.append(urljoin(base_url, link))
    return list(set(filtered))  # Remove duplicates

async def get_internal_links(url):
    """Use Playwright to get all internal links from the page."""
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        await page.goto(url)
        # Get all hrefs from anchor tags
        hrefs = await page.eval_on_selector_all('a', 'elements => elements.map(e => e.href)')
        await browser.close()
    return filter_links(url, hrefs)

def scrape_with_langchain(urls):
    """Use LangChain WebBaseLoader to scrape content from each URL."""
    results = []
    for url in urls:
        try:
            loader = WebBaseLoader(url)
            docs = loader.load()
            for doc in docs:
                results.append({
                    'url': url,
                    'content': doc.page_content
                })
        except Exception as e:
            print(f"Failed to scrape {url}: {e}")
    return results

async def agent_scrape_site(base_url: str) -> List[dict]:
    """Main agent function: gets internal links, scrapes, returns data."""
    internal_links = await get_internal_links(base_url)
    data = scrape_with_langchain(internal_links)
    return data

class ScrapeRequest(BaseModel):
    url: str
    save_to_file: Optional[bool] = False
    output_json: Optional[str] = 'scraped_data.json'

@app.post("/scrape")
async def scrape_endpoint(request: ScrapeRequest):
    try:
        data = await agent_scrape_site(request.url)
        if request.save_to_file:
            with open(request.output_json, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
        return JSONResponse(content={"results": data})
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class ComplianceRequest(BaseModel):
    url: str

EU_PROMPT = '''You are an expert in EU regulatory compliance. Given this input JSON (which describes a website content) and assess the likelihood that the company's AI product/service falls into each EU AI Act category.

## EU AI Act Categories:

**1. Prohibited AI Practices (Banned)**
- Social scoring by governments
- Real-time biometric identification in public spaces
- AI that exploits vulnerabilities (age, disability, economic situation)
- Subliminal techniques to manipulate behavior
- Emotion recognition in workplace/education (with exceptions)

**2. High-Risk AI Systems**
- Biometrics (face recognition, emotion detection)
- Employment (hiring, firing, performance evaluation)
- Education (student assessment, admission decisions)
- Finance (credit scoring, insurance risk assessment)
- Law enforcement (criminal risk assessment)
- Healthcare (diagnostic systems)
- Critical infrastructure (traffic, utilities)
- Government services (benefits, immigration)

**3. Limited Risk AI Systems**
- Chatbots and conversational AI
- AI that interacts directly with humans
- Emotion recognition systems (outside prohibited contexts)
- Biometric categorization systems
- AI that generates/manipulates content (deepfakes)

**4. Minimal Risk AI Systems**
- AI-enabled video games
- Spam filters
- AI for inventory management
- Most other AI applications not in above categories

**5. General Purpose AI (GPAI) Models**
- Foundation models (like GPT, Claude)
- Large language models
- Multimodal AI models
- AI models that can be adapted for various tasks

## Your Task:
1. Read the website content about their AI product/service
2. Score likelihood (0-10) for each category above
3. Extract website URL and brief description
4. Output as JSON only

## Output Format (JSON only):
```json
{
 "website_url": "[URL]",
 "website_description": "[Brief 1-2 sentence description of what the company/product does]",
 "category_scores": {
 "prohibited_ai_practices": [0-10],
 "high_risk_ai_systems": [0-10],
 "limited_risk_ai_systems": [0-10],
 "minimal_risk_ai_systems": [0-10],
 "general_purpose_ai_models": [0-10]
 }
```

Respond with JSON only, no additional text.'''

@app.post("/analyze_compliance")
async def analyze_compliance(request: ComplianceRequest):
    try:
        # 1. Scrape site
        scraped_data = await agent_scrape_site(request.url)
        scraped_json = json.dumps(scraped_data, ensure_ascii=False)
        # 2. Prepare LLM prompt
        prompt = [
            {"role": "system", "content": EU_PROMPT},
            {"role": "user", "content": f"Input JSON: {scraped_json}"}
        ]
        # 3. Run LLM (Nebius)
        llm = ChatNebius(
            model="Qwen/Qwen3-235B-A22B",
            temperature=0.4
        )
        llm_response = llm.invoke(prompt)
        # 4. Parse and return JSON only
        try:
            compliance_json = json.loads(llm_response.content.strip())            
        except Exception:
            # Fallback: try to extract JSON from response
            import re
            match = re.search(r'\{.*\}', llm_response.content, re.DOTALL)
            if match:
                compliance_json = json.loads(match.group(0))
            else:
                raise HTTPException(status_code=500, detail="LLM did not return valid JSON.")
        persistent_data.add(category="report",url=request.url,data=compliance_json)
        print("[Memory System] Saved data for url '{url}' in category 'report': '{data}'")
        return JSONResponse(content=compliance_json)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import sys
    import uvicorn
    if len(sys.argv) > 1 and sys.argv[1] == "serve":
        uvicorn.run("agent_web_scraper:app", host="0.0.0.0", port=8000, reload=True)
    else:
        if len(sys.argv) < 2:
            print("Usage: python agent_web_scraper.py <url> [output_json]")
            exit(1)
        url = sys.argv[1]
        output_json = sys.argv[2] if len(sys.argv) > 2 else 'scraped_data.json'
        data = asyncio.run(agent_scrape_site(url))
        with open(output_json, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        print(f"Scraped data saved to {output_json}")
