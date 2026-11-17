import { useEffect, useMemo, useState } from "react";
import {
  ArrowDownUp,
  ArrowRight,
  BarChart3,
  Check,
  ChevronDown,
  CircleHelp,
  Copy,
  ExternalLink,
  Link2,
  LoaderCircle,
  MoreHorizontal,
  Plus,
  Search,
  Sparkles,
  Trash2,
  Zap,
} from "lucide-react";

const STORAGE_KEY = "snip-links-v1";
const API_BASE = "";

function getStoredLinks() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
}

function getShortCode(shortUrl) {
  try {
    return new URL(shortUrl).pathname.replace(/^\/+/, "");
  } catch {
    return shortUrl.split("/").filter(Boolean).pop() || "";
  }
}

function formatDate(value) {
  if (!value) return "Just now";
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function truncateUrl(value, maxLength = 47) {
  if (!value || value.length <= maxLength) return value;
  return `${value.slice(0, maxLength - 1)}…`;
}

async function request(path, options) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  let body;
  try {
    body = await response.json();
  } catch {
    throw new Error("The server returned an invalid response.");
  }

  if (!response.ok) {
    throw new Error(body.message || "Something went wrong. Please try again.");
  }
  return body;
}

function App() {
  const [links, setLinks] = useState(getStoredLinks);
  const [destination, setDestination] = useState("");
  const [customAlias, setCustomAlias] = useState("");
  const [search, setSearch] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [copiedId, setCopiedId] = useState("");
  const [activeMenu, setActiveMenu] = useState("");

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(links));
  }, [links]);

  const filteredLinks = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return links;
    return links.filter((link) =>
      `${link.originalUrl} ${link.shortUrl}`.toLowerCase().includes(query),
    );
  }, [links, search]);

  const totalClicks = links.reduce((total, link) => total + (link.clicks || 0), 0);

  async function createLink(event) {
    event.preventDefault();
    setError("");

    const normalizedUrl = destination.trim();
    if (!/^https?:\/\//i.test(normalizedUrl)) {
      setError("Add a complete URL beginning with http:// or https://.");
      return;
    }

    setIsSubmitting(true);
    try {
      const body = { url: normalizedUrl };
      if (customAlias.trim()) body.customAlias = customAlias.trim();

      const result = await request("/api/create", {
        method: "POST",
        body: JSON.stringify(body),
      });

      const shortUrl = result.message;
      if (!shortUrl || typeof shortUrl !== "string") {
        throw new Error("The server returned an invalid short link.");
      }

      const newLink = {
        id: `${Date.now()}-${getShortCode(shortUrl)}`,
        code: getShortCode(shortUrl),
        originalUrl: normalizedUrl,
        shortUrl,
        clicks: 0,
        createdAt: new Date().toISOString(),
      };
      setLinks((current) => [newLink, ...current]);
      setDestination("");
      setCustomAlias("");
      await copyLink(newLink);
    } catch (requestError) {
      setError(requestError.message || "Unable to create your short link.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function copyLink(link) {
    try {
      await navigator.clipboard.writeText(link.shortUrl);
      setCopiedId(link.id);
      window.setTimeout(() => setCopiedId(""), 1800);
    } catch {
      setError("Clipboard access is unavailable. You can still select and copy the link.");
    }
  }

  async function refreshStats(link) {
    setActiveMenu("");
    try {
      const result = await request(`/api/stats/${encodeURIComponent(link.code)}`);
      const stats = result.data;
      setLinks((current) =>
        current.map((item) =>
          item.id === link.id
            ? {
                ...item,
                clicks: stats.clicks ?? item.clicks,
                originalUrl: stats.full_url || item.originalUrl,
                createdAt: stats.createdAt || item.createdAt,
              }
            : item,
        ),
      );
    } catch (requestError) {
      setError(requestError.message || "Unable to load link stats.");
    }
  }

  async function deleteLink(link) {
    setActiveMenu("");
    try {
      await request(`/api/${encodeURIComponent(link.code)}`, { method: "DELETE" });
      setLinks((current) => current.filter((item) => item.id !== link.id));
    } catch (requestError) {
      setError(requestError.message || "Unable to delete this link.");
    }
  }

  return (
    <div className="min-h-screen bg-[#f7f8fc] text-ink">
      <header className="sticky top-0 z-20 border-b border-[#ececf3] bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex h-[72px] max-w-[1320px] items-center justify-between px-5 sm:px-8">
          <a className="flex items-center gap-2.5" href="#" aria-label="Snip home">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-violet text-white shadow-[0_6px_14px_rgba(104,87,232,0.28)]">
              <Link2 size={19} strokeWidth={2.5} />
            </span>
            <span className="text-[20px] font-extrabold tracking-[-0.06em]">snip<span className="text-violet">.</span></span>
          </a>

          <nav className="hidden items-center gap-8 text-[13px] font-semibold text-[#777b8f] sm:flex">
            <a className="text-ink" href="#links">My links</a>
            <a className="transition hover:text-ink" href="#create">Create link</a>
          </nav>

          <a
            href="#create"
            className="flex h-10 items-center gap-2 rounded-xl bg-[#f1efff] px-4 text-[13px] font-bold text-violet transition hover:bg-[#e8e4ff]"
          >
            <Sparkles size={15} />
            <span className="hidden sm:inline">Keep it simple</span>
            <span className="sm:hidden">New link</span>
          </a>
        </div>
      </header>

      <main className="mx-auto max-w-[1120px] px-5 pb-16 pt-10 sm:px-8 sm:pt-14">
        <section className="mb-9 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#e9e6ff] bg-white px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-violet">
              <span className="h-1.5 w-1.5 rounded-full bg-[#8475f1]" />
              Your link workspace
            </div>
            <h1 className="text-[34px] font-extrabold leading-tight tracking-[-0.055em] sm:text-[42px]">
              Make every link <span className="text-violet">count.</span>
            </h1>
            <p className="mt-2 max-w-[500px] text-[14px] leading-6 text-muted">
              Shorten, share, and keep an eye on the links that matter.
            </p>
          </div>
          <div className="flex items-center gap-2 text-[12px] font-medium text-[#9295a6]">
            <span className="h-2 w-2 rounded-full bg-[#55c99b]" />
            Your workspace is ready
          </div>
        </section>

        <section
          id="create"
          className="relative overflow-hidden rounded-[24px] bg-[#201d3a] px-5 py-7 shadow-[0_20px_55px_rgba(34,28,73,0.16)] sm:px-9 sm:py-9"
        >
          <div className="pointer-events-none absolute -right-20 -top-32 h-72 w-72 rounded-full bg-[#6555dc]/20 blur-[2px]" />
          <div className="pointer-events-none absolute -bottom-36 right-[25%] h-64 w-64 rounded-full bg-[#a276ff]/10 blur-[2px]" />
          <div className="relative">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <div className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.15em] text-[#aaa4ec]">
                  <Zap size={14} fill="currentColor" />
                  Link in, link out
                </div>
                <h2 className="text-[22px] font-bold tracking-[-0.035em] text-white sm:text-[25px]">Shorten a long URL</h2>
                <p className="mt-1 text-[13px] text-[#aaa8c1]">Make it easier to share anywhere.</p>
              </div>
              <div className="hidden h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.06] text-[#c5bcff] sm:flex">
                <Link2 size={22} />
              </div>
            </div>

            <form onSubmit={createLink}>
              <label className="mb-2 block text-[12px] font-semibold text-[#d3d0e3]" htmlFor="destination">
                Paste your destination URL
              </label>
              <div className="flex flex-col gap-3 sm:flex-row">
                <div className="flex h-[54px] min-w-0 flex-1 items-center gap-3 rounded-[13px] border border-white/10 bg-white px-4 focus-within:ring-4 focus-within:ring-violet/30">
                  <Link2 className="shrink-0 text-[#9b9baa]" size={17} />
                  <input
                    id="destination"
                    type="url"
                    value={destination}
                    onChange={(event) => setDestination(event.target.value)}
                    placeholder="https://your-very-long-link.com/goes-here"
                    className="h-full min-w-0 flex-1 bg-transparent text-[13px] text-ink outline-none placeholder:text-[#aaaab5]"
                    required
                  />
                </div>
                <button
                  className="flex h-[54px] shrink-0 items-center justify-center gap-2 rounded-[13px] bg-[#7869ee] px-6 text-[13px] font-bold text-white shadow-[0_7px_18px_rgba(92,75,208,0.35)] transition hover:bg-[#8779f5] disabled:cursor-not-allowed disabled:opacity-70"
                  type="submit"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? <LoaderCircle size={17} className="animate-spin" /> : <Sparkles size={16} />}
                  {isSubmitting ? "Shortening…" : "Shorten URL"}
                  {!isSubmitting && <ArrowRight size={16} />}
                </button>
              </div>
              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <label className="flex h-10 items-center gap-2.5 rounded-xl border border-white/10 bg-white/[0.06] px-3 text-[12px] text-[#b8b5ca] focus-within:border-white/25 sm:w-[290px]">
                  <span className="whitespace-nowrap">snip.link/</span>
                  <input
                    aria-label="Optional custom alias"
                    value={customAlias}
                    onChange={(event) => setCustomAlias(event.target.value)}
                    placeholder="custom-alias"
                    maxLength={30}
                    className="min-w-0 flex-1 bg-transparent text-white outline-none placeholder:text-[#77748d]"
                  />
                </label>
                <div className="flex items-center gap-1.5 text-[11px] text-[#9d9ab4]">
                  <CircleHelp size={13} />
                  Optional: use 3–30 letters, numbers, - or _
                </div>
              </div>
              {error && (
                <p role="alert" className="mt-4 rounded-lg border border-[#ff9393]/20 bg-[#ff7676]/10 px-3 py-2 text-[12px] text-[#ffc3c3]">
                  {error}
                </p>
              )}
            </form>
          </div>
        </section>

        <section className="mt-7 grid gap-4 sm:grid-cols-2">
          <div className="flex min-h-[112px] items-center justify-between rounded-[18px] border border-[#edecf3] bg-white px-5 py-5 shadow-card sm:px-6">
            <div>
              <p className="text-[12px] font-medium text-[#898c9e]">Links created</p>
              <p className="mt-2 text-[28px] font-extrabold leading-none tracking-[-0.05em]">{links.length}</p>
            </div>
            <div className="grid h-11 w-11 place-items-center rounded-[14px] bg-[#f2efff] text-violet">
              <Link2 size={19} />
            </div>
          </div>
          <div className="flex min-h-[112px] items-center justify-between rounded-[18px] border border-[#edecf3] bg-white px-5 py-5 shadow-card sm:px-6">
            <div>
              <p className="text-[12px] font-medium text-[#898c9e]">Total clicks</p>
              <p className="mt-2 text-[28px] font-extrabold leading-none tracking-[-0.05em]">{totalClicks.toLocaleString()}</p>
            </div>
            <div className="grid h-11 w-11 place-items-center rounded-[14px] bg-[#eaf9f4] text-[#36aa7f]">
              <BarChart3 size={19} />
            </div>
          </div>
        </section>

        <section id="links" className="mt-10">
          <div className="mb-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <h2 className="text-[20px] font-bold tracking-[-0.04em]">Your links <span className="ml-1 text-[13px] font-semibold text-[#a2a4b2]">{links.length}</span></h2>
              <p className="mt-1 text-[12px] text-muted">A little history goes a long way.</p>
            </div>
            <div className="flex items-center gap-2">
              <label className="flex h-10 min-w-0 flex-1 items-center gap-2 rounded-xl border border-[#e9e8ef] bg-white px-3 text-[#9a9cab] sm:w-[230px]">
                <Search size={15} />
                <input
                  aria-label="Search links"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search links"
                  className="min-w-0 flex-1 bg-transparent text-[12px] text-ink outline-none placeholder:text-[#a6a7b3]"
                />
              </label>
              <button
                type="button"
                onClick={() => setLinks((current) => [...current].reverse())}
                className="flex h-10 items-center gap-2 rounded-xl border border-[#e9e8ef] bg-white px-3 text-[12px] font-semibold text-[#777b8e] transition hover:border-[#d7d4ee]"
              >
                <ArrowDownUp size={14} />
                <span className="hidden sm:inline">Newest</span>
                <ChevronDown size={13} />
              </button>
            </div>
          </div>

          {filteredLinks.length ? (
            <div className="overflow-visible rounded-[18px] border border-[#edecf3] bg-white shadow-card">
              <div className="hidden grid-cols-[minmax(190px,1.3fr)_minmax(190px,1.6fr)_90px_110px_40px] gap-4 border-b border-[#f0eff5] px-5 py-3.5 text-[10px] font-bold uppercase tracking-[0.1em] text-[#a0a2b0] md:grid">
                <span>Short link</span>
                <span>Destination</span>
                <span>Clicks</span>
                <span>Created</span>
                <span />
              </div>
              <div className="divide-y divide-[#f1f0f5]">
                {filteredLinks.map((link) => (
                  <article key={link.id} className="grid gap-3 px-4 py-4 sm:px-5 md:grid-cols-[minmax(190px,1.3fr)_minmax(190px,1.6fr)_90px_110px_40px] md:items-center md:gap-4">
                    <div className="min-w-0">
                      <p className="mb-1 text-[9px] font-bold uppercase tracking-[0.1em] text-[#aaaaba] md:hidden">Short link</p>
                      <a className="block truncate text-[13px] font-bold text-violet hover:underline" href={link.shortUrl} target="_blank" rel="noreferrer">
                        {link.shortUrl}
                      </a>
                    </div>
                    <div className="min-w-0">
                      <p className="mb-1 text-[9px] font-bold uppercase tracking-[0.1em] text-[#aaaaba] md:hidden">Destination</p>
                      <a className="flex min-w-0 items-center gap-1.5 text-[12px] text-[#777b8e] hover:text-ink" href={link.originalUrl} target="_blank" rel="noreferrer" title={link.originalUrl}>
                        <span className="truncate">{truncateUrl(link.originalUrl)}</span>
                        <ExternalLink size={12} className="shrink-0 text-[#b4b5c2]" />
                      </a>
                    </div>
                    <div className="flex items-center gap-2 md:block">
                      <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-[#aaaaba] md:hidden">Clicks</p>
                      <span className="text-[12px] font-semibold text-[#45485d]">{(link.clicks || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-2 md:block">
                      <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-[#aaaaba] md:hidden">Created</p>
                      <span className="text-[11px] text-[#8c8fa0]">{formatDate(link.createdAt)}</span>
                    </div>
                    <div className="relative flex justify-end">
                      <button
                        type="button"
                        aria-label={`Actions for ${link.shortUrl}`}
                        onClick={() => setActiveMenu(activeMenu === link.id ? "" : link.id)}
                        className="grid h-8 w-8 place-items-center rounded-lg text-[#9b9dad] transition hover:bg-[#f5f4fa] hover:text-ink"
                      >
                        <MoreHorizontal size={18} />
                      </button>
                      {activeMenu === link.id && (
                        <div className="absolute right-0 top-9 z-10 w-44 rounded-xl border border-[#ecebf2] bg-white p-1.5 shadow-[0_12px_30px_rgba(30,31,55,0.14)]">
                          <button
                            type="button"
                            onClick={() => refreshStats(link)}
                            className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-[12px] text-[#56596d] hover:bg-[#f7f6fb]"
                          >
                            <BarChart3 size={14} /> Refresh stats
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteLink(link)}
                            className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-[12px] text-[#d45361] hover:bg-[#fff3f4]"
                          >
                            <Trash2 size={14} /> Delete link
                          </button>
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => copyLink(link)}
                        aria-label="Copy short link"
                        className="ml-1 grid h-8 w-8 place-items-center rounded-lg text-[#9b9dad] transition hover:bg-[#f5f4fa] hover:text-violet"
                      >
                        {copiedId === link.id ? <Check size={15} className="text-[#35ad82]" /> : <Copy size={15} />}
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          ) : (
            <div className="rounded-[18px] border border-dashed border-[#dddce8] bg-white px-5 py-12 text-center">
              <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-[#f2efff] text-violet">
                {search ? <Search size={20} /> : <Plus size={21} />}
              </div>
              <h3 className="mt-4 text-[14px] font-bold">{search ? "No links found" : "Your first link starts here"}</h3>
              <p className="mx-auto mt-1 max-w-[330px] text-[12px] leading-5 text-muted">
                {search ? "Try a different search term." : "Create a short link above and it will show up here."}
              </p>
              {!search && (
                <a href="#create" className="mt-4 inline-flex items-center gap-1.5 text-[12px] font-bold text-violet hover:underline">
                  Create a link <ArrowRight size={14} />
                </a>
              )}
            </div>
          )}
        </section>
        <footer className="mt-10 flex flex-col items-center justify-between gap-2 border-t border-[#e9e8ef] pt-5 text-[11px] text-[#a0a2b0] sm:flex-row">
          <span>Small links. Big possibilities.</span>
          <span>Made for sharing ✦</span>
        </footer>
      </main>
    </div>
  );
}

export default App;
