"""
AgentAutopsy - FastAPI Backend
Endpoints:
  POST /run       - run the agent pipeline with a query (rate-limited, RBAC-protected)
  GET  /incidents - get all past incident reports
"""

import json
from fastapi import FastAPI, Header, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from pipeline import run_pipeline
from monitor import generate_incident_report, save_incident, get_all_incidents, init_db

# Rate limiter: keyed by client IP address
limiter = Limiter(key_func=get_remote_address)

app = FastAPI(title="AgentAutopsy API")
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

init_db()


class RunRequest(BaseModel):
    query: str


@app.get("/")
def root():
    return {"status": "AgentAutopsy backend running"}


@app.post("/run")
@limiter.limit("10/minute")
def run(request: Request, req: RunRequest, x_user_role: str = Header("viewer")):
    # Enforce role-based access control (RBAC) on the sandbox pipeline runner
    if x_user_role.lower() not in ["developer", "admin"]:
        raise HTTPException(
            status_code=403,
            detail="RBAC Denied: Only users with 'developer' or 'admin' role can run the pipeline sandbox."
        )

    state = run_pipeline(req.query)

    response = {
        "query": state["query"],
        "trace": state["trace"],
        "success": not bool(state["failed_step"]),
        "cached_hit": False
    }

    if state["failed_step"]:
        # Self-monitoring: if the analyzer itself crashes, fall back to raw trace dump
        try:
            report, cached_hit = generate_incident_report(state)
        except Exception as e:
            # Fallback: build a raw trace dump report so the user never gets a silent failure
            trace_dump = "\n".join(
                f"- {t['step']}: {t['status']} — {t['detail']}"
                for t in state["trace"]
            )
            report = (
                f"⚠️ Analyzer Fallback: The root-cause analyzer failed ({type(e).__name__}: {e}).\n\n"
                f"Raw Trace Dump:\n{trace_dump}\n\n"
                f"Failed Step: {state['failed_step']}\n"
                f"Error: {state['error_message']}"
            )
            cached_hit = False

        save_incident(state, report)
        response["failed_step"] = state["failed_step"]
        response["error_message"] = state["error_message"]
        response["incident_report"] = report
        response["cached_hit"] = cached_hit
    else:
        response["final_response"] = state["final_response"]

    return response


@app.get("/incidents")
def incidents():
    return get_all_incidents()

