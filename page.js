"use client";

import { useEffect, useMemo, useState } from "react";

const fallbackBatches = [
  {
    id: "demo-10-up",
    name: "Class 10 UP Board",
    image: "https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=900&q=80",
    description: "Complete school preparation batch.",
    teacher: "Prep Master Faculty",
    language: "Hindi / Hinglish",
    price: "Free",
    subjects: ["Hindi", "English", "Maths", "Science", "SST"],
    content: []
  },
  {
    id: "demo-9-up",
    name: "Class 9 UP Board",
    image: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=900&q=80",
    description: "Class 9 study material and lessons.",
    teacher: "Prep Master Faculty",
    language: "Hindi / Hinglish",
    price: "Free",
    subjects: ["Hindi", "English", "Maths", "Science", "SST"],
    content: []
  }
];

function createId() {
  try {
    if (typeof globalThis !== "undefined" && globalThis.crypto?.randomUUID) {
      return globalThis.crypto.randomUUID();
    }
  } catch {}

  return `pm_${Date.now()}_${Math.random().toString(36).slice(2, 12)}`;
}

function getVisitorId() {
  if (typeof window === "undefined") return "";

  try {
    let id = window.localStorage.getItem("pm_visitor_id");

    if (!id) {
      id = createId();
      window.localStorage.setItem("pm_visitor_id", id);
    }

    return id;
  } catch {
    return createId();
  }
}

export default function PrepMasterApp() {
  const [tab, setTab] = useState("batches");
  const [menu, setMenu] = useState(false);
  const [theme, setTheme] = useState("light");
  const [batches, setBatches] = useState(fallbackBatches);
  const [batchPage, setBatchPage] = useState(1);
  const [totalBatchPages, setTotalBatchPages] = useState(1);
  const [loadingBatches, setLoadingBatches] = useState(false);
  const [myBatches, setMyBatches] = useState([]);
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState("");
  const [community, setCommunity] = useState([]);
  const [message, setMessage] = useState("");
  const [aiMessages, setAiMessages] = useState([]);
  const [aiInput, setAiInput] = useState("");
  const [loadingAI, setLoadingAI] = useState(false);

  const visitorId = useMemo(() => getVisitorId(), []);

  useEffect(() => {
    try {
      const savedTheme = window.localStorage.getItem("pm_theme");
      if (savedTheme === "light" || savedTheme === "dark") {
        setTheme(savedTheme);
      }
    } catch {}
    loadBatches(1, true);
    refreshMyBatches();
    refreshCommunity();
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      window.localStorage.setItem("pm_theme", theme);
    } catch {}
  }, [theme]);

  async function loadBatches(page = 1, replace = false) {
    if (loadingBatches) return;
    setLoadingBatches(true);
    try {
      const r = await fetch(`/api/batches?page=${page}`, { cache: "no-store" });
      if (!r.ok) return;
      const result = await r.json();
      const incoming = Array.isArray(result.data) ? result.data : [];

      // Keep the built-in demo batches if the external API is empty.
      setBatches(prev => {
        const combined = replace && incoming.length ? incoming : [...prev, ...incoming];
        const seen = new Set();
        return combined.filter(b => {
          if (!b.id || seen.has(b.id)) return false;
          seen.add(b.id);
          return true;
        });
      });
      setBatchPage(result.page || page);
      setTotalBatchPages(result.totalPages || 1);
    } catch {}
    finally { setLoadingBatches(false); }
  }

  async function refreshMyBatches() {
    if (!visitorId) return;
    try {
      const r = await fetch("/api/my-batches", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({ visitorId })
      });
      if (r.ok) setMyBatches(await r.json());
    } catch {}
  }

  async function refreshCommunity() {
    try {
      const r = await fetch("/api/community");
      if (r.ok) setCommunity(await r.json());
    } catch {}
  }

  async function enroll(batch) {
    try {
      const r = await fetch("/api/enroll", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({ visitorId, batchId: batch.id })
      });
      if (r.ok) {
        await refreshMyBatches();
        alert("Batch My Batches me add ho gaya.");
      } else {
        alert("Database configure hone ke baad enrollment save hoga.");
      }
    } catch {
      alert("Backend unavailable.");
    }
  }

  async function sendMessage(e) {
    e.preventDefault();
    if (!message.trim()) return;
    const local = {
      id: createId(),
      username: "Student",
      text: message.trim(),
      createdAt: new Date().toISOString()
    };
    setCommunity(x => [...x, local]);
    setMessage("");
    try {
      await fetch("/api/community", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({ visitorId, username: "Student", text: local.text })
      });
      refreshCommunity();
    } catch {}
  }

  async function askAI(e) {
    e.preventDefault();
    const text = aiInput.trim();
    if (!text || loadingAI) return;
    const next = [...aiMessages, { role: "user", content: text }];
    setAiMessages(next);
    setAiInput("");
    setLoadingAI(true);
    try {
      const r = await fetch("/api/ai", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({ messages: next })
      });
      const data = await r.json();
      setAiMessages([...next, { role: "assistant", content: data.reply || data.error || "No response." }]);
    } catch {
      setAiMessages([...next, { role: "assistant", content: "AI backend abhi configured nahi hai." }]);
    } finally {
      setLoadingAI(false);
    }
  }

  const filtered = batches.filter((b) =>
    String(b?.name || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <div className="brand">Prep Master</div>
          <div className="tagline">Learn. Practice. Grow.</div>
        </div>
        <button className="icon-btn" aria-label="Menu" onClick={() => setMenu(true)}>⋮</button>
      </header>

      {tab === "batches" && (
        <main className="page">
          <div className="hero">
            <div>
              <span className="eyebrow">YOUR LEARNING SPACE</span>
              <h1>Choose your batch</h1>
              <p>Study with organized courses, notes and lessons.</p>
            </div>
          </div>

          <div className="search">
            <span>⌕</span>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search batches" />
          </div>

          <section>
            <div className="section-title">All Batches</div>
            <div className="grid">
              {filtered.map(batch => (
                <BatchCard key={batch.id} batch={batch}
                  enrolled={myBatches.some(x => x.id === batch.id)}
                  onStudy={() => setSelected(batch)}
                  onEnroll={() => enroll(batch)} />
              ))}
            </div>
            {batchPage < totalBatchPages && (
              <div style={{display:"flex",justifyContent:"center",margin:"24px 0"}}>
                <button className="primary" disabled={loadingBatches} onClick={() => loadBatches(batchPage + 1)}>
                  {loadingBatches ? "Loading..." : `Load More (${batchPage}/${totalBatchPages})`}
                </button>
              </div>
            )}
          </section>
        </main>
      )}

      {tab === "my" && (
        <main className="page">
          <div className="page-heading"><span className="eyebrow">YOUR COURSES</span><h1>My Batches</h1></div>
          {myBatches.length ? (
            <div className="grid">{myBatches.map(batch =>
              <BatchCard key={batch.id} batch={batch} enrolled onStudy={() => setSelected(batch)} onEnroll={() => {}} />
            )}</div>
          ) : (
            <Empty text="Abhi koi batch enrolled nahi hai. Batches se ek batch enroll karo." />
          )}
        </main>
      )}

      {tab === "community" && (
        <main className="page community-page">
          <div className="page-heading"><span className="eyebrow">STUDENTS COMMUNITY</span><h1>Community</h1><p>Text-only community chat. Media posting is reserved for admin.</p></div>
          <div className="chat">
            <div className="messages">
              {community.length ? community.map(m => (
                <div className="bubble" key={m.id}><strong>{m.username}</strong><p>{m.text}</p></div>
              )) : <Empty text="Community me pehla message tum bhejo." />}
            </div>
            <form className="chat-form" onSubmit={sendMessage}>
              <input value={message} onChange={e => setMessage(e.target.value)} placeholder="Write a message..." maxLength={1000}/>
              <button>Send</button>
            </form>
          </div>
        </main>
      )}

      {tab === "ai" && (
        <main className="page ai-page">
          <div className="page-heading"><span className="eyebrow">STUDY ASSISTANT</span><h1>🤖 Prep Master AI</h1><p>Ask your study doubt in Hindi, Hinglish or English.</p></div>
          <div className="ai-chat">
            <div className="ai-messages">
              {!aiMessages.length && <div className="ai-welcome"><b>👋 Hello!</b><p>Apna study doubt poochho. Main Prep Master AI hoon.</p></div>}
              {aiMessages.map((m, i) => <div key={i} className={"ai-bubble " + m.role}><b>{m.role === "user" ? "You" : "Prep Master AI"}</b><p>{m.content}</p></div>)}
              {loadingAI && <div className="ai-bubble assistant"><b>Prep Master AI</b><p>Thinking…</p></div>}
            </div>
            <form className="ai-form" onSubmit={askAI}><input value={aiInput} onChange={e => setAiInput(e.target.value)} placeholder="Ask your doubt..." /><button>➤</button></form>
          </div>
        </main>
      )}

      <nav className="bottom-nav">
        <NavButton active={tab === "community"} icon="👥" label="Community" onClick={() => setTab("community")} />
        <NavButton active={tab === "my"} icon="🎓" label="My Batches" onClick={() => setTab("my")} />
        <NavButton active={tab === "batches"} icon="📚" label="Batches" onClick={() => setTab("batches")} />
        <NavButton active={tab === "ai"} icon="🤖" label="AI Doubts" onClick={() => setTab("ai")} />
      </nav>

      {selected && <BatchDetail batch={selected} onClose={() => setSelected(null)} onEnroll={() => enroll(selected)} enrolled={myBatches.some(x => x.id === selected.id)} />}

      {menu && (
        <div className="overlay" onClick={() => setMenu(false)}>
          <aside className="drawer" onClick={e => e.stopPropagation()}>
            <div className="drawer-head"><b>Prep Master</b><button className="icon-btn" onClick={() => setMenu(false)}>×</button></div>
            <button onClick={() => {setTab("batches");setMenu(false)}}>📚 <span>Batches</span></button>
            <button onClick={() => {setTab("my");setMenu(false)}}>🎓 <span>My Batches</span></button>
            <a href="https://t.me/prepmaster0" target="_blank" rel="noreferrer">✈️ <span>Join Telegram</span></a>
            <a href="https://t.me/Subhanali011" target="_blank" rel="noreferrer">👨‍💻 <span>Contact Owner</span></a>
            <div className="drawer-divider"/>
            <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>◐ <span>{theme === "dark" ? "Light Mode" : "Dark Mode"}</span></button>
          </aside>
        </div>
      )}
    </div>
  );
}

function NavButton({active, icon, label, onClick}) {
  return <button className={"nav-item " + (active ? "active" : "")} onClick={onClick}><span>{icon}</span><small>{label}</small></button>;
}

function BatchCard({batch, enrolled, onStudy, onEnroll}) {
  return <article className="batch-card">
    <img
      src={batch.image || "https://placehold.co/900x500?text=Prep+Master"}
      alt=""
      onError={(e) => {
        e.currentTarget.onerror = null;
        e.currentTarget.src = "https://placehold.co/900x500?text=Prep+Master";
      }}
    />
    <div className="card-body">
      <h3>{String(batch.name || "Unnamed Batch")}</h3>
      <div className="meta"><span>{batch.language || "All Languages"}</span><span>{batch.price || "Free"}</span></div>
      {batch.teacher && <p className="teacher">{String(batch.teacher)}</p>}
      <div className="card-actions">
        <button className="secondary" onClick={onStudy}>Study</button>
        <button className="primary" disabled={enrolled} onClick={onEnroll}>{enrolled ? "✓ Enrolled" : "Enroll"}</button>
      </div>
    </div>
  </article>;
}

function BatchDetail({batch, onClose, onEnroll, enrolled}) {
  return <div className="modal-wrap"><div className="modal">
    <button className="close" onClick={onClose}>×</button>
    <img
      className="detail-image"
      src={batch.image || "https://placehold.co/900x500?text=Prep+Master"}
      alt=""
      onError={(e) => {
        e.currentTarget.onerror = null;
        e.currentTarget.src = "https://placehold.co/900x500?text=Prep+Master";
      }}
    />
    <div className="detail-content">
      <span className="eyebrow">BATCH</span><h2>{String(batch.name || "Unnamed Batch")}</h2>
      <p>{String(batch.description || "Study material and lessons for this batch.")}</p>
      <div className="detail-grid"><div><b>Teacher</b><span>{String(batch.teacher || "Prep Master Faculty")}</span></div><div><b>Language</b><span>{String(batch.language || "All languages")}</span></div><div><b>Price</b><span>{String(batch.price || "Free")}</span></div></div>
      <h3>Subjects</h3><div className="chips">{(Array.isArray(batch.subjects) ? batch.subjects : []).map((subject, i) => (
        <span key={`${String(subject)}-${i}`}>{String(subject)}</span>
      ))}</div>
      <h3>Study Content</h3>
      {(batch.content || []).length ? <div className="content-list">{batch.content.map((c, i) => {
        const title =
          c && typeof c === "object"
            ? c.title || c.name || "Lesson"
            : String(c || "Lesson");
        return <div key={i}>📘 {String(title)}</div>;
      })}</div> : <p className="muted">Content admin panel se add kiya ja sakta hai.</p>}
      <button className="primary wide" disabled={enrolled} onClick={onEnroll}>{enrolled ? "✓ Enrolled" : "Enroll in this Batch"}</button>
    </div>
  </div></div>;
}

function Empty({text}) { return <div className="empty"><div>📚</div><p>{text}</p></div>; }