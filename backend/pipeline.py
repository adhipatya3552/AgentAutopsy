"""
AgentAutopsy - Core Pipeline
A 3-agent LangGraph pipeline: Research -> Analysis -> Response
Each step is wrapped with tracing for failure detection.
"""

import os
import random
import time
from typing import TypedDict, List
from langgraph.graph import StateGraph, END
from langchain_groq import ChatGroq
from dotenv import load_dotenv

load_dotenv()

# Initialize Langfuse callback handler if environment credentials exist
langfuse_callback = None
if os.getenv("LANGFUSE_PUBLIC_KEY") and os.getenv("LANGFUSE_SECRET_KEY"):
    try:
        from langfuse.langchain import CallbackHandler
        langfuse_callback = CallbackHandler()
        print("[Langfuse] CallbackHandler initialized successfully.")
    except Exception as e:
        print(f"[Langfuse] Warning: Failed to initialize callback handler: {e}")

key = os.getenv("GROQ_API_KEY")
if not key or key == "mock_key" or not key.startswith("gsk_"):
    class MockLLM:
        def invoke(self, prompt: str, **kwargs):
            class MockResult:
                content = f"[Mock response for prompt: '{prompt[:40]}...']"
                response_metadata = {"token_usage": {"prompt_tokens": 45, "completion_tokens": 55, "total_tokens": 100}}
            return MockResult()
    llm = MockLLM()
else:
    llm = ChatGroq(model="llama-3.3-70b-versatile", api_key=key)


class PipelineState(TypedDict):
    query: str
    research_output: str
    analysis_output: str
    final_response: str
    trace: List[dict]
    failed_step: str
    error_message: str


def log_step(state: PipelineState, step_name: str, status: str, detail: str = "", latency_ms: int = 0, tokens: dict = None):
    """Append a trace entry for this step."""
    state["trace"].append({
        "step": step_name,
        "status": status,
        "detail": detail,
        "timestamp": time.time(),
        "latency_ms": latency_ms,
        "tokens": tokens or {"prompt_tokens": 0, "completion_tokens": 0, "total_tokens": 0}
    })


def estimate_tokens(prompt: str, response_content: str) -> dict:
    prompt_tokens = len(prompt) // 4
    completion_tokens = len(response_content) // 4
    return {
        "prompt_tokens": max(1, prompt_tokens),
        "completion_tokens": max(1, completion_tokens),
        "total_tokens": max(2, prompt_tokens + completion_tokens),
    }


def get_token_usage(result, prompt: str) -> dict:
    try:
        if hasattr(result, "response_metadata") and "token_usage" in result.response_metadata:
            usage = result.response_metadata["token_usage"]
            return {
                "prompt_tokens": usage.get("prompt_tokens", 0),
                "completion_tokens": usage.get("completion_tokens", 0),
                "total_tokens": usage.get("total_tokens", 0)
            }
    except Exception:
        pass
    return estimate_tokens(prompt, getattr(result, "content", ""))


def research_agent(state: PipelineState) -> PipelineState:
    step = "research_agent"
    start_time = time.time()
    prompt = f"Research this topic briefly (2-3 sentences): {state['query']}"
    try:
        # Simulate occasional failure (e.g. bad input data)
        if "FAIL_RESEARCH" in state["query"]:
            raise ValueError("Research data source returned empty result set")

        config = {"callbacks": [langfuse_callback]} if langfuse_callback else {}
        result = llm.invoke(prompt, config=config)
        state["research_output"] = result.content
        latency_ms = int((time.time() - start_time) * 1000)
        tokens = get_token_usage(result, prompt)
        log_step(state, step, "success", f"Researched: {state['query'][:50]}", latency_ms, tokens)

    except Exception as e:
        state["failed_step"] = step
        state["error_message"] = str(e)
        latency_ms = int((time.time() - start_time) * 1000)
        tokens = estimate_tokens(prompt, "")
        log_step(state, step, "failed", str(e), latency_ms, tokens)

    return state


def analysis_agent(state: PipelineState) -> PipelineState:
    step = "analysis_agent"
    start_time = time.time()
    # Skip if previous step failed
    if state.get("failed_step"):
        log_step(state, step, "skipped", "Previous step failed", 0, None)
        return state

    prompt = f"Analyze this research and extract 2 key insights:\n{state['research_output']}"
    try:
        if "FAIL_ANALYSIS" in state["query"]:
            raise TimeoutError("Analysis model call timed out after 30s")

        config = {"callbacks": [langfuse_callback]} if langfuse_callback else {}
        result = llm.invoke(prompt, config=config)
        state["analysis_output"] = result.content
        latency_ms = int((time.time() - start_time) * 1000)
        tokens = get_token_usage(result, prompt)
        log_step(state, step, "success", "Analysis complete", latency_ms, tokens)

    except Exception as e:
        state["failed_step"] = step
        state["error_message"] = str(e)
        latency_ms = int((time.time() - start_time) * 1000)
        tokens = estimate_tokens(prompt, "")
        log_step(state, step, "failed", str(e), latency_ms, tokens)

    return state


def response_agent(state: PipelineState) -> PipelineState:
    step = "response_agent"
    start_time = time.time()
    if state.get("failed_step"):
        log_step(state, step, "skipped", "Previous step failed", 0, None)
        return state

    prompt = f"Write a final concise answer based on this analysis:\n{state['analysis_output']}"
    try:
        if "FAIL_RESPONSE" in state["query"]:
            raise RuntimeError("Response formatting agent crashed - invalid output schema")

        config = {"callbacks": [langfuse_callback]} if langfuse_callback else {}
        result = llm.invoke(prompt, config=config)
        state["final_response"] = result.content
        latency_ms = int((time.time() - start_time) * 1000)
        tokens = get_token_usage(result, prompt)
        log_step(state, step, "success", "Response generated", latency_ms, tokens)

    except Exception as e:
        state["failed_step"] = step
        state["error_message"] = str(e)
        latency_ms = int((time.time() - start_time) * 1000)
        tokens = estimate_tokens(prompt, "")
        log_step(state, step, "failed", str(e), latency_ms, tokens)

    return state


def build_pipeline():
    graph = StateGraph(PipelineState)
    graph.add_node("research", research_agent)
    graph.add_node("analysis", analysis_agent)
    graph.add_node("response", response_agent)

    graph.set_entry_point("research")
    graph.add_edge("research", "analysis")
    graph.add_edge("analysis", "response")
    graph.add_edge("response", END)

    return graph.compile()


pipeline = build_pipeline()


def run_pipeline(query: str) -> PipelineState:
    initial_state: PipelineState = {
        "query": query,
        "research_output": "",
        "analysis_output": "",
        "final_response": "",
        "trace": [],
        "failed_step": "",
        "error_message": "",
    }
    config = {}
    if langfuse_callback:
        config["callbacks"] = [langfuse_callback]
    result = pipeline.invoke(initial_state, config=config)
    return result
