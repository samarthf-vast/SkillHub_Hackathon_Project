"use client";

import { useState, useEffect } from "react";
import { Search, Sparkles, Loader2, Lightbulb, ArrowRight, MapPin, Briefcase, X, Clock, ClipboardCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { scoreColor, scoreBarColor } from "@/lib/utils";
import SkillBadge from "@/components/SkillBadge";
import Link from "next/link";
import type { SearchResult, PendingSearchResult } from "@/types";

function buildExamples(skills: string[], designations: string[]): string[] {
  if (skills.length < 2) return [];
  const s = skills;
  const d = designations;
  const examples: string[] = [
    `Who has experience with ${s[0]} and ${s[1]}?`,
    `Find me someone skilled in ${s[0]} who is currently available`,
    `${d[0] ?? "Developer"} with ${s[1]} and ${s[2] ?? s[0]} expertise`,
    `Who can work on a project requiring ${s[0]} knowledge?`,
    `Senior ${d[1] ?? "engineer"} who knows ${s[2] ?? s[1]}`,
    `Experienced ${s[3] ?? s[0]} developer who is unallocated`,
  ];
  return examples.slice(0, 6);
}

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [pendingResults, setPendingResults] = useState<PendingSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);
  const [lastQuery, setLastQuery] = useState("");
  const [examples, setExamples] = useState<string[]>([]);

  useEffect(() => {
    fetch("/api/skills")
      .then((r) => r.json())
      .then((data) => {
        const skillNames: string[] = (data.skills ?? []).map((s: any) => s.name).filter(Boolean);
        const designations: string[] = data.designations ?? [];
        setExamples(buildExamples(skillNames, designations));
      })
      .catch(() => {});
  }, []);

  const doSearch = async (q: string) => {
    const searchQuery = q.trim();
    if (!searchQuery) return;
    setLoading(true); setError(""); setLastQuery(searchQuery); setQuery(searchQuery);
    try {
      const res = await fetch("/api/search", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ query: searchQuery }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Search failed");
      setResults(data.results ?? []);
      setPendingResults(data.pendingResults ?? []);
      setSearched(true);
    } catch (err: any) { setError(err.message); }
    finally { setLoading(false); }
  };

  const reset = () => { setSearched(false); setResults([]); setPendingResults([]); setQuery(""); setError(""); };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Find Talent</h1>
        <p className="mt-1 text-sm text-gray-500">Ask anything in natural language — AI understands context, ranks candidates, and explains why</p>
      </div>

      {/* Search box */}
      <div className="rounded-2xl border-2 border-indigo-200 bg-white shadow-sm overflow-hidden focus-within:border-indigo-400 focus-within:shadow-md transition-all">
        <div className="flex items-start gap-3 p-4 pb-0">
          <div className="mt-1 rounded-lg bg-indigo-100 p-2 flex-shrink-0">
            <Sparkles className="h-4 w-4 text-indigo-600" />
          </div>
          <textarea
            placeholder='Ask anything — e.g. "Who is available and skilled in our top technology?"'
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) doSearch(query); }}
            rows={2}
            className="flex-1 resize-none border-0 bg-transparent py-1 text-base text-gray-900 placeholder:text-gray-400 focus:outline-none"
          />
          {query && (
            <button onClick={reset} className="mt-1 text-gray-400 hover:text-gray-600 flex-shrink-0">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <div className="flex items-center justify-between px-4 py-3 bg-gray-50/50 border-t border-gray-100">
          <p className="text-xs text-gray-400">⌘↵ to search</p>
          <Button onClick={() => doSearch(query)} disabled={loading || !query.trim()} size="sm" className="gap-2">
            {loading ? <><Loader2 className="h-3.5 w-3.5 animate-spin" />Searching...</> : <><Search className="h-3.5 w-3.5" />Search with AI</>}
          </Button>
        </div>
      </div>

      {/* Example queries — dynamically generated from real DB skills */}
      {!searched && !loading && examples.length > 0 && (
        <div>
          <div className="mb-3 flex items-center gap-1.5">
            <Lightbulb className="h-4 w-4 text-amber-500" />
            <p className="text-sm font-medium text-gray-700">Try these based on your team&apos;s skills</p>
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {examples.map((q) => (
              <button key={q} onClick={() => doSearch(q)} className="group flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-left text-sm text-gray-600 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700 transition-all">
                <span className="flex-1 leading-relaxed">{q}</span>
                <ArrowRight className="h-4 w-4 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Error */}
      {error && <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>}

      {/* Loading skeleton */}
      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-2xl border border-gray-200 bg-white p-5 animate-pulse">
              <div className="flex gap-4">
                <div className="h-12 w-12 rounded-full bg-gray-200 flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-1/3" />
                  <div className="h-3 bg-gray-100 rounded w-1/2" />
                  <div className="h-8 bg-indigo-50 rounded w-full mt-2" />
                </div>
                <div className="text-right space-y-1">
                  <div className="h-8 w-12 bg-gray-200 rounded mx-auto" />
                  <div className="h-2 w-16 bg-gray-100 rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Results */}
      {searched && !loading && (
        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-gray-900">
                {results.length > 0 ? `${results.length} approved candidate${results.length > 1 ? "s" : ""} found` : "No approved matches"}
                {pendingResults.length > 0 && <span className="ml-2 text-amber-600">· {pendingResults.length} pending</span>}
              </h2>
              <p className="text-sm text-gray-400 mt-0.5">"{lastQuery}"</p>
            </div>
            <Button variant="outline" size="sm" onClick={reset}>New Search</Button>
          </div>

          {/* Approved candidates */}
          {results.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-300 p-12 text-center">
              <Search className="mx-auto h-10 w-10 text-gray-200 mb-3" />
              <p className="font-medium text-gray-500">No approved candidates match this query</p>
              <p className="text-sm text-gray-400 mt-1">Check the pending section below or broaden your query</p>
            </div>
          ) : (
            <div className="space-y-3">
              {results.map((result, i) => {
                const { employee: emp, matchScore, reasoning } = result;
                const topSkills = emp.skills.slice(0, 5);
                return (
                  <div key={emp.id} className="group rounded-2xl border border-gray-200 bg-white shadow-sm hover:shadow-md hover:border-indigo-200 transition-all overflow-hidden">
                    <div className="flex">
                      <div className="flex w-[72px] flex-shrink-0 flex-col items-center justify-center bg-gradient-to-b from-gray-50 to-white border-r border-gray-100 py-5">
                        <span className="text-xs font-bold text-gray-300 mb-1">#{i + 1}</span>
                        <span className={`text-2xl font-black ${scoreColor(matchScore)}`}>{matchScore}</span>
                        <div className="mt-2 w-10">
                          <div className="h-1.5 w-full rounded-full bg-gray-200">
                            <div className={`h-1.5 rounded-full ${scoreBarColor(matchScore)}`} style={{ width: `${matchScore}%` }} />
                          </div>
                        </div>
                        <span className="text-xs text-gray-400 mt-1">match</span>
                      </div>
                      <div className="flex-1 p-5">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-3">
                            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 text-white font-bold text-sm">
                              {emp.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <Link href={`/hr/employees/${emp.id}`} className="font-semibold text-gray-900 hover:text-indigo-600 transition-colors">
                                {emp.name}
                              </Link>
                              <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                                {emp.designation && <span className="flex items-center gap-1"><Briefcase className="h-3 w-3" />{emp.designation}</span>}
                                {emp.location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{emp.location}</span>}
                              </div>
                            </div>
                          </div>
                          {emp.currentProject
                            ? <span className="flex-shrink-0 rounded-full bg-amber-50 border border-amber-200 px-2.5 py-1 text-xs font-medium text-amber-700">On project</span>
                            : <span className="flex-shrink-0 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-1 text-xs font-medium text-emerald-700">Available</span>
                          }
                        </div>
                        <div className="mt-3 flex items-start gap-2 rounded-xl bg-indigo-50 border border-indigo-100 px-3.5 py-2.5">
                          <Sparkles className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-indigo-500" />
                          <p className="text-sm text-indigo-800 leading-relaxed">{reasoning}</p>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {topSkills.map((s) => (
                            <SkillBadge key={s.skill.name} name={s.skill.name} proficiency={s.proficiency} yearsExp={s.yearsExp} inferred={s.inferred} size="sm" />
                          ))}
                          {emp.skills.length > 5 && (
                            <span className="rounded-md bg-gray-100 px-2 py-0.5 text-xs text-gray-500">+{emp.skills.length - 5} more</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pending candidates section */}
          {pendingResults.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-amber-500" />
                  <h3 className="font-semibold text-gray-900">
                    Pending Review — {pendingResults.length} potential match{pendingResults.length > 1 ? "es" : ""}
                  </h3>
                </div>
                <Link href="/hr/review-queue">
                  <Button size="sm" variant="outline" className="gap-1.5 border-amber-300 text-amber-700 hover:bg-amber-50">
                    <ClipboardCheck className="h-3.5 w-3.5" /> Go to Review Queue
                  </Button>
                </Link>
              </div>
              <p className="text-xs text-gray-400 mb-3">These profiles haven&apos;t been approved yet. Approve them to make them searchable and available for assignment.</p>
              <div className="space-y-3">
                {pendingResults.map((result, i) => {
                  const skills = result.extractedData.skills ?? [];
                  const topSkills = skills.slice(0, 5);
                  return (
                    <div key={result.profileId} className="group rounded-2xl border border-amber-200 bg-amber-50/40 shadow-sm overflow-hidden">
                      <div className="flex">
                        {/* Score sidebar */}
                        <div className="flex w-[72px] flex-shrink-0 flex-col items-center justify-center bg-amber-50 border-r border-amber-100 py-5">
                          <span className="text-xs font-bold text-amber-300 mb-1">#{i + 1}</span>
                          <span className={`text-2xl font-black ${scoreColor(result.matchScore)}`}>{result.matchScore}</span>
                          <div className="mt-2 w-10">
                            <div className="h-1.5 w-full rounded-full bg-amber-200">
                              <div className={`h-1.5 rounded-full ${scoreBarColor(result.matchScore)}`} style={{ width: `${result.matchScore}%` }} />
                            </div>
                          </div>
                          <span className="text-xs text-amber-400 mt-1">match</span>
                        </div>

                        {/* Content */}
                        <div className="flex-1 p-5">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex items-start gap-3">
                              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-400 text-white font-bold text-sm">
                                {result.employeeName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                              </div>
                              <div>
                                <p className="font-semibold text-gray-900">{result.employeeName}</p>
                                <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                                  {result.designation && <span className="flex items-center gap-1"><Briefcase className="h-3 w-3" />{result.designation}</span>}
                                  {result.location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{result.location}</span>}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <span className="rounded-full bg-amber-100 border border-amber-300 px-2.5 py-1 text-xs font-medium text-amber-800 flex items-center gap-1">
                                <Clock className="h-3 w-3" /> Awaiting Approval
                              </span>
                              <Link href="/hr/review-queue">
                                <span className="rounded-full bg-indigo-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-indigo-700 transition-colors flex items-center gap-1">
                                  <ClipboardCheck className="h-3 w-3" /> Review
                                </span>
                              </Link>
                            </div>
                          </div>

                          {/* AI Reasoning */}
                          <div className="mt-3 flex items-start gap-2 rounded-xl bg-white border border-amber-100 px-3.5 py-2.5">
                            <Sparkles className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-amber-500" />
                            <p className="text-sm text-gray-700 leading-relaxed">{result.reasoning}</p>
                          </div>

                          {/* Skills from extracted data */}
                          <div className="mt-3 flex flex-wrap gap-1.5">
                            {topSkills.map((s) => (
                              <SkillBadge key={s.name} name={s.name} proficiency={s.proficiency} yearsExp={s.yearsExp} size="sm" />
                            ))}
                            {skills.length > 5 && (
                              <span className="rounded-md bg-amber-100 px-2 py-0.5 text-xs text-amber-700">+{skills.length - 5} more</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
