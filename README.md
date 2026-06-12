# AgentAutopsy

**Black-Box Flight Recorder for AI Agent Systems**

A 3-agent LangGraph pipeline (Research → Analysis → Response). When any agent
fails, AgentAutopsy automatically generates a human-readable root-cause
incident report — like a flight recorder for AI systems.

---

## Project Structure

```
agentautopsy/
├── backend/        FastAPI + LangGraph + Groq
│   ├── main.py      API endpoints (/run, /incidents)
│   ├── pipeline.py  3-agent LangGraph pipeline
│   ├── monitor.py   Root-cause analyzer + SQLite storage
│   └── requirements.txt
└── frontend/       Next.js dashboard
    └── app/page.tsx
```

---

## 1. Local Setup

### Backend

```bash
cd backend
pip install -r requirements.txt
cp .env.example .env
# Add your free Groq API key (https://console.groq.com) to .env
uvicorn main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
cp .env.local.example .env.local
npm run dev
```

Open http://localhost:3000

---

## 2. Demo Instructions

- Type a normal query → pipeline runs successfully, shows final response.
- Type a query containing `FAIL_RESEARCH`, `FAIL_ANALYSIS`, or `FAIL_RESPONSE`
  → that step fails on purpose, and AgentAutopsy auto-generates an incident
  report explaining the root cause.
- Past incidents are saved and shown in "Incident History".

---

## 3. Deployment (Free)

### Backend → Render
1. Push this repo to GitHub.
2. Create new Web Service on render.com, point to `backend/` folder.
3. Build command: `pip install -r requirements.txt`
4. Start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
5. Add environment variable `GROQ_API_KEY`.

### Frontend → Vercel
1. Import the repo on vercel.com, set root directory to `frontend/`.
2. Add env variable `NEXT_PUBLIC_API_URL` = your Render backend URL.
3. Deploy.

---

## Tech Stack

- **Agent Framework:** LangGraph
- **LLM:** Groq (Llama 3.3 70B) — free tier
- **Backend:** FastAPI
- **Database:** SQLite
- **Frontend:** Next.js + Tailwind CSS
- **Deploy:** Render (backend) + Vercel (frontend)

---

## Why AgentAutopsy?

Debugging multi-agent AI pipelines is manual and slow — developers dig
through logs for hours to find which agent failed and why. AgentAutopsy
automates this: it traces every agent call, detects failures, and produces
a clear incident report (Summary, Root Cause, Impact, Recommended Fix)
automatically.
