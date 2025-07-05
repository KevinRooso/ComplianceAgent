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
app = FastAPI()

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

EU_PROMPT = '''You are an expert in EU regulatory compliance. Given this input JSON (which describes a website’s AI features, dataflows, vendor relationships, and model types), analyse whether the site complies with the EU AI Act (Regulation (EU) 2024/1689). Provide a detailed JSON output with:

1. “scope_applicability”: Does the site fall under the Act? (yes/no), citing:
   • provider/deployer status
   • user base in EU or non‑EU
2. “risk_classification”: Classify each AI component as:
   • “unacceptable”, “high”, “limited”, “minimal”, or “GPAI”
3. “requirements_check”: For each component, report compliance with applicable obligations:
   • For unacceptable risk: check absence
   • High-risk: risk management, data governance, human oversight, technical documentation, recordkeeping, conformity assessment
   • Limited risk: transparency disclosures
   • GPAI: transparency, copyright checks, bias testing, energy reporting
4. “code_of_practice_adherence”: Whether site follows preliminary Code of Practice guidelines for GPAI if applicable
5. “enforcement_timeline”: Identify which parts of the Act are currently enforceable (e.g., transparency for GPAI from 1 Aug 2025; bans from 2 Feb 2025)
6. “penalty_risk_assessment”: Assess likely exposure to fines (e.g., up to 7 % turnover)
7. “gaps_and_recommendations”: For each gap, propose steps to remedy compliance
8. “summary”: Provide a compliance score (0–100) and overall verdict (Compliant / Needs remediation / Non‑compliant).

Return only valid JSON and use no free text outside the JSON structure.'''

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
