"use client";

import { useState, useEffect } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface TokenBreakdown {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

interface TraceEntry {
  step: string;
  status: string;
  detail: string;
  timestamp: number;
  latency_ms?: number;
  tokens?: TokenBreakdown;
}

interface RunResult {
  query: string;
  trace: TraceEntry[];
  success: boolean;
  final_response?: string;
  failed_step?: string;
  error_message?: string;
  incident_report?: string;
  query_label?: string;
}

interface Incident {
  id: number;
  query: string;
  failed_step: string;
  error_message: string;
  report: string;
  created_at: string;
}

export default function Home() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeStep, setActiveStep] = useState<string | null>(null);
  const [result, setResult] = useState<RunResult | null>(null);
  const [incidents, setIncidents] = useState<Incident[]>([]);

  // Simulation / Fuzzing states
  const [simulating, setSimulating] = useState(false);
  const [simResults, setSimResults] = useState<RunResult[]>([]);

  const fetchIncidents = async () => {
    try {
      const res = await fetch(`${API_URL}/incidents`);
      const data = await res.json();
      setIncidents(data);
    } catch (e) {
      console.error("Failed to fetch incidents", e);
    }
  };

  useEffect(() => {
    fetchIncidents();
  }, []);

  const runPipeline = async (customQuery?: string) => {
    const q = customQuery !== undefined ? customQuery : query;
    if (!q.trim()) return;

    setLoading(true);
    setResult(null);
    setSimResults([]);
    setActiveStep("Initializing LangGraph Engine...");

    const steps = [
      { name: "Invoking Research Agent...", delay: 600 },
      { name: "Invoking Analysis Agent...", delay: 1800 },
      { name: "Invoking Response Agent...", delay: 3200 },
      { name: "Running failure diagnostic analysis...", delay: 4500 }
    ];

    const timers = steps.map(s => 
      setTimeout(() => setActiveStep(s.name), s.delay)
    );

    try {
      const res = await fetch(`${API_URL}/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q }),
      });
      const data = await res.json();
      setResult(data);
      fetchIncidents();
    } catch (e) {
      console.error(e);
      setActiveStep("API Connection Error");
    } finally {
      timers.forEach(clearTimeout);
      setActiveStep(null);
      setLoading(false);
    }
  };

  const runFuzzTest = async () => {
    setSimulating(true);
    setSimResults([]);
    setResult(null);
    
    const testCases = [
      { label: "Successful Request", query: "Explain quantum computing in simple terms." },
      { label: "Research Failure Injection", query: "Research historical market data FAIL_RESEARCH" },
      { label: "Response Crash Injection", query: "Format survey response values FAIL_RESPONSE" }
    ];

    try {
      const promises = testCases.map(async (tc) => {
        const res = await fetch(`${API_URL}/run`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: tc.query }),
        });
        const data = await res.json();
        return { ...data, query_label: tc.label };
      });

      const results = await Promise.all(promises);
      setSimResults(results);
      fetchIncidents();
    } catch (e) {
      console.error(e);
    } finally {
      setSimulating(false);
    }
  };

  const getCost = (tokens?: TokenBreakdown) => {
    if (!tokens) return "$0.000000";
    const promptCost = (tokens.prompt_tokens / 1_000_000) * 0.59;
    const completionCost = (tokens.completion_tokens / 1_000_000) * 0.79;
    return `$${(promptCost + completionCost).toFixed(6)}`;
  };

  const statusStyle = (status: string) => {
    if (status === "success") return "text-emerald-400 border-emerald-500/20 bg-emerald-500/5";
    if (status === "failed") return "text-rose-400 border-rose-500/20 bg-rose-500/5";
    return "text-zinc-500 border-zinc-700/20 bg-zinc-800/5";
  };

  return (
    <main className="min-h-screen bg-[#07070a] text-zinc-100 font-sans p-6 sm:p-12 selection:bg-purple-500/30">
      {/* Background Decorative Glow */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl -z-10 pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl -z-10 pointer-events-none" />

      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-zinc-800/60 pb-6 gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-purple-400 via-violet-400 to-indigo-400 bg-clip-text text-transparent">
                AgentAutopsy
              </h1>
              <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/20">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                Flight Watcher Active
              </span>
            </div>
            <p className="text-zinc-400 text-sm mt-1">
              Autonomous Black-Box Telemetry & Crash Diagnosis for AI Agent Pipelines
            </p>
          </div>
        </header>

        {/* Controls Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Query Console */}
          <div className="lg:col-span-2 bg-[#0e0e15] border border-zinc-800/80 rounded-2xl p-6 shadow-xl relative overflow-hidden">
            <h2 className="text-base font-semibold text-zinc-200 mb-3 flex items-center gap-2">
              <span className="w-1.5 h-3 bg-purple-500 rounded-sm" />
              Developer Pipeline Sandbox
            </h2>
            <p className="text-xs text-zinc-500 mb-4">
              Enter any query to trigger the LangGraph pipeline normally, or inject a crash test pattern using these flags:
              <span className="block mt-1 space-x-2">
                <button onClick={() => setQuery("Analyze stock data FAIL_RESEARCH")} className="text-purple-400/80 hover:text-purple-300 font-mono bg-purple-950/20 border border-purple-500/10 px-1.5 py-0.5 rounded text-[10px]">FAIL_RESEARCH</button>
                <button onClick={() => setQuery("Summarize papers FAIL_ANALYSIS")} className="text-purple-400/80 hover:text-purple-300 font-mono bg-purple-950/20 border border-purple-500/10 px-1.5 py-0.5 rounded text-[10px]">FAIL_ANALYSIS</button>
                <button onClick={() => setQuery("Format results FAIL_RESPONSE")} className="text-purple-400/80 hover:text-purple-300 font-mono bg-purple-950/20 border border-purple-500/10 px-1.5 py-0.5 rounded text-[10px]">FAIL_RESPONSE</button>
              </span>
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                className="flex-1 bg-[#050508] border border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-200 outline-none focus:border-purple-500/80 focus:ring-1 focus:ring-purple-500/40 transition font-mono"
                placeholder="Ask something... (or click a fail flag above)"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && runPipeline()}
              />
              <button
                onClick={() => runPipeline()}
                disabled={loading || simulating}
                className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-40 text-white px-8 py-3 rounded-xl font-medium transition text-sm shadow-lg shadow-purple-950/20"
              >
                {loading ? "Running Pipeline..." : "Execute Query"}
              </button>
            </div>
          </div>

          {/* Test / Sim Card */}
          <div className="bg-[#0e0e15] border border-zinc-800/80 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
            <div>
              <h2 className="text-base font-semibold text-zinc-200 mb-2 flex items-center gap-2">
                <span className="w-1.5 h-3 bg-indigo-500 rounded-sm" />
                Fuzz Test Suite
              </h2>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Run system integrations tests simultaneously. Fuzz tests spin up a successful agent pipeline, a mid-process pipeline error, and a downstream formatter crash in parallel.
              </p>
            </div>
            <button
              onClick={runFuzzTest}
              disabled={loading || simulating}
              className="mt-6 w-full border border-zinc-700 bg-zinc-900/40 hover:bg-zinc-800/80 text-zinc-300 disabled:opacity-40 py-3 rounded-xl font-medium transition text-sm flex items-center justify-center gap-2"
            >
              {simulating ? (
                <>
                  <span className="w-4 h-4 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin" />
                  Running Fuzz Suite...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                  Run System Fuzz Test
                </>
              )}
            </button>
          </div>

        </div>

        {/* Live Loading Overlay */}
        {loading && activeStep && (
          <div className="bg-[#0e0e15] border border-purple-500/20 rounded-2xl p-8 text-center space-y-4 animate-pulse shadow-xl">
            <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <div className="space-y-1">
              <p className="text-zinc-200 text-sm font-mono tracking-wide">{activeStep}</p>
              <p className="text-zinc-500 text-xs">Capturing step traces, latency, and telemetry payload logs...</p>
            </div>
          </div>
        )}

        {/* Query Result Section */}
        {result && (
          <section className="bg-[#0e0e15] border border-zinc-800/80 rounded-2xl p-6 shadow-xl space-y-6">
            
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-zinc-200 flex items-center gap-2">
                Pipeline Tracing Logs & Telemetry
              </h3>
              <span className={`text-xs px-3 py-1 rounded-full font-bold border ${
                result.success
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                  : "bg-rose-500/10 text-rose-400 border-rose-500/20"
              }`}>
                {result.success ? "PIPELINE COMPLETED" : "CRITICAL CRASH DETECTED"}
              </span>
            </div>

            {/* Trace Step Nodes */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {result.trace.map((t, idx) => (
                <div key={idx} className={`border rounded-xl p-4 flex flex-col justify-between space-y-3 ${statusStyle(t.status)}`}>
                  <div>
                    <div className="flex justify-between items-center">
                      <span className="font-mono text-xs font-semibold uppercase tracking-wider opacity-80">{t.step.replace("_", " ")}</span>
                      <span className="text-[10px] uppercase font-bold tracking-widest">{t.status}</span>
                    </div>
                    <p className="text-xs mt-1.5 opacity-70 leading-relaxed font-mono truncate">{t.detail}</p>
                  </div>
                  
                  {/* Telemetry Footer inside Node */}
                  {t.status !== "skipped" && (
                    <div className="pt-2 border-t border-zinc-800/30 flex justify-between items-center text-[10px] font-mono text-zinc-500">
                      <span>Latency: <strong className="text-zinc-300">{t.latency_ms ?? 0}ms</strong></span>
                      <span>Usage: <strong className="text-zinc-300">{t.tokens?.total_tokens ?? 0} tokens</strong></span>
                      <span>Cost: <strong className="text-zinc-300">{getCost(t.tokens)}</strong></span>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Response Output */}
            {result.success && result.final_response && (
              <div className="bg-[#050508] border border-zinc-800 rounded-xl p-5 space-y-2">
                <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-widest">Pipeline Final Output</span>
                <p className="text-sm text-zinc-200 leading-relaxed whitespace-pre-wrap">{result.final_response}</p>
              </div>
            )}

            {/* Incident Analysis Card */}
            {!result.success && result.incident_report && (
              <div className="bg-rose-950/10 border border-rose-500/20 rounded-xl p-5 space-y-3">
                <div className="flex items-center gap-2 text-rose-400 text-xs font-mono font-bold uppercase tracking-wider">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                  AgentAutopsy Root-Cause Report
                </div>
                <div className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap border-l-2 border-rose-500/30 pl-4 py-1 font-mono text-[13px]">
                  {result.incident_report}
                </div>
              </div>
            )}

          </section>
        )}

        {/* Fuzz Test Results Feed */}
        {simResults.length > 0 && (
          <section className="space-y-4">
            <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">Fuzz Suite Results</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {simResults.map((sim, index) => (
                <div key={index} className="bg-[#0e0e15] border border-zinc-800/80 rounded-2xl p-5 flex flex-col justify-between space-y-4 shadow-lg">
                  <div>
                    <div className="flex justify-between items-start gap-2 mb-2">
                      <h4 className="text-sm font-bold text-zinc-200">{sim.query_label}</h4>
                      <span className={`text-[9px] px-2 py-0.5 rounded font-extrabold border font-mono ${
                        sim.success ? "text-emerald-400 border-emerald-500/20 bg-emerald-500/5" : "text-rose-400 border-rose-500/20 bg-rose-500/5"
                      }`}>
                        {sim.success ? "PASS" : "FAIL"}
                      </span>
                    </div>
                    <p className="text-[11px] font-mono text-zinc-500 truncate mb-3">Query: "{sim.query}"</p>
                    
                    {/* Short Diagnostics list */}
                    <div className="space-y-1.5">
                      {sim.trace.map((tr, idx) => (
                        <div key={idx} className="flex justify-between text-[11px] font-mono bg-zinc-950/40 px-2 py-1 rounded border border-zinc-900">
                          <span className="text-zinc-400">{tr.step.replace("_agent", "")}</span>
                          <span className={tr.status === "success" ? "text-emerald-500" : tr.status === "failed" ? "text-rose-500" : "text-zinc-600"}>
                            {tr.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {!sim.success && sim.incident_report && (
                    <div className="text-[11px] font-mono border-t border-zinc-800/40 pt-3 text-rose-300 leading-normal line-clamp-4">
                      <strong>Diagnosis:</strong> {sim.incident_report}
                    </div>
                  )}
                  {sim.success && sim.final_response && (
                    <div className="text-[11px] font-mono border-t border-zinc-800/40 pt-3 text-emerald-300 leading-normal line-clamp-4">
                      <strong>Result:</strong> {sim.final_response}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Database Incident History List */}
        <section className="bg-[#0e0e15] border border-zinc-800/80 rounded-2xl p-6 shadow-xl">
          <h3 className="text-base font-semibold text-zinc-200 mb-4 flex items-center gap-2">
            <span className="w-1.5 h-3 bg-red-500 rounded-sm" />
            Flight Recorder Database Logs ({incidents.length})
          </h3>
          {incidents.length === 0 ? (
            <p className="text-sm text-zinc-500">No agent crashes logged in local SQLite history.</p>
          ) : (
            <div className="space-y-3 max-h-[360px] overflow-y-auto pr-2 custom-scrollbar">
              {incidents.map((inc) => (
                <details
                  key={inc.id}
                  className="group bg-[#050508] border border-zinc-900 rounded-xl p-4 transition duration-200 hover:border-zinc-800 overflow-hidden"
                >
                  <summary className="cursor-pointer flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-sm outline-none">
                    <div className="flex items-center gap-2">
                      <span className="text-xs px-2 py-0.5 rounded font-mono font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                        {inc.failed_step}
                      </span>
                      <span className="text-zinc-300 font-medium truncate max-w-xs sm:max-w-md">"{inc.query}"</span>
                    </div>
                    <span className="text-zinc-600 text-[10px] font-mono">{new Date(inc.created_at).toLocaleString()}</span>
                  </summary>
                  <div className="mt-4 pt-4 border-t border-zinc-900 text-xs font-mono text-zinc-400 leading-relaxed whitespace-pre-wrap">
                    {inc.report}
                  </div>
                </details>
              ))}
            </div>
          )}
        </section>

      </div>
    </main>
  );
}
