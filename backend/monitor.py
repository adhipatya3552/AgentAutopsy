"""
AgentAutopsy - Monitor & Root Cause Analyzer
When a pipeline run fails, this module analyzes the trace
and generates a human-readable incident report.
"""

import os
import json
import sqlite3
from datetime import datetime
from langchain_groq import ChatGroq
from dotenv import load_dotenv

load_dotenv()

key = os.getenv("GROQ_API_KEY")
if not key or key == "mock_key" or not key.startswith("gsk_"):
    class MockLLM:
        def invoke(self, prompt: str):
            class MockResult:
                content = """1. Summary: An intentional simulation failure occurred in the pipeline.
2. Root Cause: The user query injected a specific failure flag (FAIL_RESEARCH / FAIL_ANALYSIS / FAIL_RESPONSE).
3. Impact: Downstream steps were skipped and pipeline halted.
4. Recommended Fix: Remove the failure injection flags from the query input."""
                response_metadata = {"token_usage": {"prompt_tokens": 150, "completion_tokens": 120, "total_tokens": 270}}
            return MockResult()
    llm = MockLLM()
else:
    llm = ChatGroq(model="llama-3.3-70b-versatile", api_key=key)

DB_PATH = os.path.join(os.path.dirname(__file__), "autopsy.db")


def init_db():
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    cur.execute("""
        CREATE TABLE IF NOT EXISTS incidents (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            query TEXT,
            failed_step TEXT,
            error_message TEXT,
            trace TEXT,
            report TEXT,
            created_at TEXT
        )
    """)
    conn.commit()
    conn.close()


def generate_incident_report(state: dict) -> str:
    """Use LLM to reason about the failure and produce a root-cause report."""
    trace_summary = "\n".join(
        f"- Step: {t['step']} | Status: {t['status']} | Detail: {t['detail']}"
        for t in state["trace"]
    )

    prompt = f"""You are AgentAutopsy, an AI incident analyst for multi-agent systems.

A pipeline run FAILED. Here is the execution trace:

{trace_summary}

Failed step: {state['failed_step']}
Error message: {state['error_message']}
Original user query: {state['query']}

Write a clear, structured incident report with these sections:
1. Summary (1-2 sentences, what went wrong)
2. Root Cause (which agent/step failed and why)
3. Impact (what downstream steps were skipped)
4. Recommended Fix (concrete suggestion to prevent recurrence)

Keep it concise and professional."""

    result = llm.invoke(prompt)
    return result.content


def save_incident(state: dict, report: str):
    init_db()
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    cur.execute(
        "INSERT INTO incidents (query, failed_step, error_message, trace, report, created_at) VALUES (?, ?, ?, ?, ?, ?)",
        (
            state["query"],
            state["failed_step"],
            state["error_message"],
            json.dumps(state["trace"]),
            report,
            datetime.utcnow().isoformat(),
        ),
    )
    conn.commit()
    conn.close()


def get_all_incidents():
    init_db()
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    cur.execute("SELECT id, query, failed_step, error_message, report, created_at FROM incidents ORDER BY id DESC")
    rows = cur.fetchall()
    conn.close()
    return [
        {
            "id": r[0],
            "query": r[1],
            "failed_step": r[2],
            "error_message": r[3],
            "report": r[4],
            "created_at": r[5],
        }
        for r in rows
    ]
