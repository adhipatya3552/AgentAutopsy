"""
AgentAutopsy - Integration & Simulation Test Suite
Runs the pipeline with normal and failure-injected queries,
verifying that traces are tracked, database logs are recorded,
and incident reports are correctly compiled.
"""

import sys
import os
from unittest.mock import MagicMock

# Ensure we can import from local directory
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

is_mock_mode = not os.getenv("GROQ_API_KEY")
if is_mock_mode:
    os.environ["GROQ_API_KEY"] = "mock_key"

import pipeline
import monitor

if is_mock_mode:
    pipeline.llm = MagicMock()
    pipeline.llm.invoke.return_value = MagicMock(content="[Simulation Mock Response] Process executed successfully.")
    
    monitor.llm = MagicMock()
    monitor.llm.invoke.return_value = MagicMock(content="""1. Summary: Simulated pipeline agent crash.
2. Root Cause: Injected crash flag triggered simulated failure logic.
3. Impact: Downstream steps skipped and state marked as failed.
4. Recommended Fix: Check the query syntax and remove custom failure flags.""")


def print_banner(title: str):
    print("=" * 60)
    print(f" {title.center(58)} ")
    print("=" * 60)


def run_test_case(name: str, query: str, expected_success: bool):
    print(f"\n[RUN] Running Test: {name}")
    print(f"  Query: '{query}'")
    
    # Check if Groq key exists (mock/skip warning if missing)
    if not os.getenv("GROQ_API_KEY"):
        print("  [WARNING] GROQ_API_KEY is not set. Requests to LLM may fail. Running in simulation mode.")
    
    try:
        state = pipeline.run_pipeline(query)
        success = not bool(state["failed_step"])
        
        print(f"  Status: {'SUCCESS' if success else 'FAILED (Expected)'}")
        print("  Trace Summary:")
        for t in state["trace"]:
            latency = t.get("latency_ms", 0)
            tokens = t.get("tokens", {}).get("total_tokens", 0)
            print(f"    - Step: {t['step']:<16} | Status: {t['status']:<8} | Latency: {latency:>4}ms | Tokens: {tokens:>3}")
        
        if success != expected_success:
            print(f"  [FAIL] Expected success={expected_success}, got success={success}")
            return False
            
        if not success:
            report, cached_hit = monitor.generate_incident_report(state)
            monitor.save_incident(state, report)
            print(f"  Incident logged successfully. Cache Hit: {cached_hit}")
            
        print("  [PASS]")
        return True
    except Exception as e:
        print(f"  [CRITICAL ERROR] during execution: {e}")
        return False


def test_sqlite_persistence():
    print("\n[RUN] Verifying SQLite DB persistence...")
    try:
        incidents = monitor.get_all_incidents()
        print(f"  Current logged incidents count: {len(incidents)}")
        if len(incidents) > 0:
            print("  Sample Incident:")
            sample = incidents[0]
            print(f"    - ID: {sample['id']}")
            print(f"    - Failed Step: {sample['failed_step']}")
            print(f"    - Query: '{sample['query']}'")
            print(f"    - Error: '{sample['error_message']}'")
        print("  [PASS] SQLite Check PASS")
        return True
    except Exception as e:
        print(f"  [FAIL] SQLite Check FAIL: {e}")
        return False


def main():
    print_banner("AGENTAUTOPSY TEST & SIMULATION SUITE")
    
    test_cases = [
        ("Success Path", "Explain multi-agent systems in one sentence.", True),
        ("Research Agent Failure Injection", "Analyze blockchain FAIL_RESEARCH", False),
        ("Analysis Agent Failure Injection", "Synthesize findings FAIL_ANALYSIS", False),
        ("Response Agent Failure Injection", "Generate summary FAIL_RESPONSE", False),
    ]
    
    results = []
    for tc in test_cases:
        results.append(run_test_case(*tc))
        
    results.append(test_sqlite_persistence())
    
    print_banner("SUMMARY REPORT")
    passed = results.count(True)
    total = len(results)
    print(f" Passed: {passed}/{total}")
    print(f" Status: {'ALL TESTS PASSED' if passed == total else 'SOME TESTS FAILED'}")
    print("=" * 60)
    
    if passed != total:
        sys.exit(1)


if __name__ == "__main__":
    main()
