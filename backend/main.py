"""
AgentAutopsy - FastAPI Backend
Endpoints:
  POST /run       - run the agent pipeline with a query
  GET  /incidents - get all past incident reports
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from pipeline import run_pipeline
from monitor import generate_incident_report, save_incident, get_all_incidents, init_db

app = FastAPI(title="AgentAutopsy API")

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
def run(req: RunRequest):
    state = run_pipeline(req.query)

    response = {
        "query": state["query"],
        "trace": state["trace"],
        "success": not bool(state["failed_step"]),
    }

    if state["failed_step"]:
        report = generate_incident_report(state)
        save_incident(state, report)
        response["failed_step"] = state["failed_step"]
        response["error_message"] = state["error_message"]
        response["incident_report"] = report
    else:
        response["final_response"] = state["final_response"]

    return response


@app.get("/incidents")
def incidents():
    return get_all_incidents()
