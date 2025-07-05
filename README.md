# AI Compliance Agent

## Requirements
- Python 3.11 (for backend)
- Node.js (v18+ recommended, for frontend)

## Backend Setup (FastAPI)

1. **Create and activate a virtual environment** (recommended):
   
   **On Windows:**
   ```sh
   python -m venv venv
   venv\Scripts\activate
   ```
   
   **On macOS/Linux:**
   ```sh
   python3 -m venv venv
   source venv/bin/activate
   ```

2. **Install the dependencies:**
   ```sh
   pip install -r requirements.txt
   ```

3. **Run the FastAPI server:**
   ```sh
   uvicorn agent_web_scraper:app --host 0.0.0.0 --port 8000 --loop asyncio
   ```
   - The server will be available at [http://localhost:8000](http://localhost:8000)
   - Make sure you run the command from the directory containing `agent_web_scraper.py`

---

## Frontend Setup (React/Vite)

1. **Navigate to the frontend directory:**
   ```sh
   cd compliance-insight-generator-main
   ```

2. **Install frontend dependencies:**
   ```sh
   npm install
   ```

3. **Run the frontend development server:**
   ```sh
   npm run dev
   ```
   - The frontend will usually be available at [http://localhost:5173](http://localhost:5173) (check your terminal for the actual port)

---

You can now access the backend API at port 8000 and the frontend UI at port 5173 (or as shown in your terminal). Make sure both servers are running for full functionality.