# AgentAutopsy 🚀

**Autonomous Black-Box Flight Recorder & Telemetry Watcher for Multi-Agent AI Systems**

AgentAutopsy acts as a black-box flight recorder for AI agent systems. Built on a 3-agent LangGraph pipeline (Research ➔ Analysis ➔ Response), it automatically intercepts agent failures, generates structured, LLM-powered root-cause incident reports, caches diagnostic patterns, and logs sanitized telemetry to a secure local database.

---

## 🛠️ Project Structure

```
agentautopsy/
├── backend/            FastAPI + LangGraph + Groq + slowapi
│   ├── main.py          - API endpoints (/run, /incidents) with RBAC & Rate Limiting
│   ├── pipeline.py      - 3-agent LangGraph execution pipeline with Langfuse tracing
│   ├── monitor.py       - LLM-powered root-cause analyzer & SQLite log recorder
│   ├── sanitizer.py     - PII & API Key masking module
│   ├── test_suite.py    - Integration & Fuzz testing suite
│   ├── requirements.txt - Declared Python dependencies
│   └── autopsy.db       - SQLite database (log history & cache storage)
└── frontend/           Next.js 16 + Tailwind CSS Dashboard
    └── app/page.tsx     - Interactive sandbox, Fuzz controls, and history logs
```

---

## 🛡️ Reliability & Security Pillars

AgentAutopsy implements the five critical pillars of enterprise AI reliability:

1. **Langfuse Distributed Tracing:** Integrates the Langfuse SDK (`CallbackHandler`) to trace execution paths, model costs, token usage, and latencies across all graph agents in real-time.
2. **Failure Pattern Caching:** Caches LLM-generated incident diagnostics using SHA-256 signatures of `failed_step:error_message` in SQLite. Speeds up diagnostic latency to `<5ms` and saves API costs on recurring failure patterns (noted via the `⚡ CACHE HIT` badge in the UI).
3. **Role-Based Access Control (RBAC):** Backend verifies `X-User-Role` request headers. Unauthorized roles (e.g. `Viewer`) are blocked by `403 Forbidden` errors, while the dashboard dynamically locks Sandbox runs and Fuzz suites.
4. **Sensitive Data Sanitization:** Intercepts traces before database logging to redact Groq API keys, Langfuse keys, email addresses, IPv4 addresses, and password/secret declarations via strict regex filters.
5. **IP-Based Rate Limiting:** Enforces endpoint protection (`slowapi` integration) on the `/run` execution endpoint to prevent DDoS and API abuse (throttles to `10 requests/minute`).
6. **Self-Monitoring Fallback:** Wraps the diagnostic analyzer in a failsafe try-catch block. If the LLM analyzer fails, the system automatically falls back to a raw trace dump, ensuring zero silent crashes.

---

## 💻 Local Setup

### 1. Backend

1. Create and activate a Python virtual environment:
   ```bash
   python -m venv venv
   # On Windows:
   venv\Scripts\activate
   # On macOS/Linux:
   source venv/bin/activate
   ```
2. Install dependencies:
   ```bash
   cd backend
   pip install -r requirements.txt
   ```
3. Set up environment variables:
   Create a `.env` file in the `backend/` directory:
   ```env
   GROQ_API_KEY=gsk_...
   LANGFUSE_PUBLIC_KEY=pk-lf-...
   LANGFUSE_SECRET_KEY=sk-lf-...
   LANGFUSE_HOST=https://cloud.langfuse.com
   ```
   *(If keys are omitted, the backend runs gracefully in a simulated mock mode).*
4. Start the FastAPI server:
   ```bash
   uvicorn main:app --reload --port 8000
   ```

### 2. Frontend

1. Install Node.js packages and launch the Next.js development server:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
2. Open [http://localhost:3000](http://localhost:3000) to view the telemetry dashboard.

---

## 🧪 Testing & Fuzz Simulation

AgentAutopsy includes a local integration and failure simulation suite to audit system reliability under load.

* **Run the automated suite:**
  ```bash
  python backend/test_suite.py
  ```
* **Interactive Fuzzing:** Use the **Run System Fuzz Test** button on the Next.js dashboard to execute a success path, a research agent crash, and a response layout crash in parallel.
* **Failure Injection Flags:** Append `FAIL_RESEARCH`, `FAIL_ANALYSIS`, or `FAIL_RESPONSE` to any query in the Sandbox console to trigger step errors and generate root-cause reports.

---

## 🚀 Free Tier Deployment

### Backend ➔ Render
1. Push this repository to GitHub.
2. Create a new Web Service on [Render](https://render.com) and link it to the `backend/` subdirectory.
3. Configure settings:
   * **Build Command:** `pip install -r requirements.txt`
   * **Start Command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`
4. Add environment variables: `GROQ_API_KEY`, `LANGFUSE_PUBLIC_KEY`, `LANGFUSE_SECRET_KEY`, and `LANGFUSE_HOST`.

### Frontend ➔ Vercel
1. Import this repository on [Vercel](https://vercel.com).
2. Set the root directory to `frontend/`.
3. Add the Environment Variable `NEXT_PUBLIC_API_URL` pointing to your Render backend web service.
4. Deploy!
