import { useState, useEffect } from "react";
import { supabase } from "./supabase";

export default function AdminPanel({ onLogout, isDark, T }) {
  const [activeSection, setActiveSection] = useState("dashboard");
  const [ministers, setMinisters] = useState([]);
  const [news, setNews] = useState([]);
  const [mps, setMps] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  const [newMinister, setNewMinister] = useState({ name: "", role: "মন্ত্রী", ministry: "", icon: "👤" });
  const [newNews, setNewNews] = useState({ title: "", source: "", category: "সরকারি", time: "" });
  const [newProject, setNewProject] = useState({ title: "", ministry: "", budget: "", progress: 0, status: "চলমান" });
  const [decisions, setDecisions] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [newDecision, setNewDecision] = useState({ title: "", description: "", date: "", category: "সরকারি সিদ্ধান্ত" });
  const [newDocument, setNewDocument] = useState({ title: "", description: "", file_url: "", category: "সরকারি দলিল", date: "" });

  useEffect(() => { fetchAll(); }, []);

  async function fetchAll() {
    setLoading(true);
    const [m, n, mp, p] = await Promise.all([
      supabase.from("ministers").select("*").order("id"),
      supabase.from("news").select("*").order("created_at", { ascending: false }).limit(30),
      supabase.from("mps").select("*").eq("government_id", 1).order("id").limit(100),
      supabase.from("projects").select("*").order("id"),
    ]);
    setMinisters(m.data || []);
    setNews(n.data || []);
    setMps(mp.data || []);
    setProjects(p.data || []);
    setLoading(false);
    const dec = await supabase.from("decisions").select("*").order("created_at", { ascending: false });
    const doc = await supabase.from("documents").select("*").order("created_at", { ascending: false });
    setDecisions(dec.data || []);
    setDocuments(doc.data || []);
  }

  function showMessage(text, type = "success") {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 3000);
  }

  async function addMinister() {
    if (!newMinister.name || !newMinister.ministry) return showMessage("নাম ও মন্ত্রণালয় আবশ্যক", "error");
    setSaving(true);
    const { error } = await supabase.from("ministers").insert(newMinister);
    if (error) showMessage("সমস্যা হয়েছে: " + error.message, "error");
    else { showMessage("মন্ত্রী যোগ হয়েছে!"); setNewMinister({ name: "", role: "মন্ত্রী", ministry: "", icon: "👤" }); fetchAll(); }
    setSaving(false);
  }

  async function deleteMinister(id) {
    if (!window.confirm("এই মন্ত্রীর তথ্য মুছবেন?")) return;
    await supabase.from("ministers").delete().eq("id", id);
    showMessage("মুছে ফেলা হয়েছে");
    fetchAll();
  }

  async function addNews() {
    if (!newNews.title || !newNews.source) return showMessage("শিরোনাম ও সূত্র আবশ্যক", "error");
    setSaving(true);
    const { error } = await supabase.from("news").insert({ ...newNews, time: newNews.time || new Date().toLocaleDateString("bn-BD") });
    if (error) showMessage("সমস্যা হয়েছে", "error");
    else { showMessage("সংবাদ যোগ হয়েছে!"); setNewNews({ title: "", source: "", category: "সরকারি", time: "" }); fetchAll(); }
    setSaving(false);
  }

  async function deleteNews(id) {
    if (!window.confirm("এই সংবাদ মুছবেন?")) return;
    await supabase.from("news").delete().eq("id", id);
    showMessage("মুছে ফেলা হয়েছে");
    fetchAll();
  }

  async function addProject() {
    if (!newProject.title || !newProject.ministry) return showMessage("শিরোনাম ও মন্ত্রণালয় আবশ্যক", "error");
    setSaving(true);
    const { error } = await supabase.from("projects").insert(newProject);
    if (error) showMessage("সমস্যা হয়েছে", "error");
    else { showMessage("প্রকল্প যোগ হয়েছে!"); setNewProject({ title: "", ministry: "", budget: "", progress: 0, status: "চলমান" }); fetchAll(); }
    setSaving(false);
  }

  async function deleteProject(id) {
    if (!window.confirm("এই প্রকল্প মুছবেন?")) return;
    await supabase.from("projects").delete().eq("id", id);
    showMessage("মুছে ফেলা হয়েছে");
    fetchAll();
  }

  async function updateProgress(id, progress) {
    await supabase.from("projects").update({ progress: Number(progress) }).eq("id", id);
    fetchAll();
  }

  const inputStyle = { width: "100%", background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: "10px 14px", color: T.text, fontSize: 14, boxSizing: "border-box", outline: "none", marginBottom: 10, fontFamily: "sans-serif" };
  const btnStyle = { background: "#006A4E", color: "#fff", border: "none", borderRadius: 8, padding: "10px 20px", cursor: "pointer", fontSize: 14, fontWeight: "bold", width: "100%" };
  const deleteBtnStyle = { background: "transparent", border: "1px solid #c0392b", color: "#c0392b", borderRadius: 6, padding: "4px 10px", cursor: "pointer", fontSize: 12 };

const sections = [
  { id: "dashboard", label: "📊 ড্যাশবোর্ড" },
  { id: "ministers", label: "👥 মন্ত্রিসভা" },
  { id: "news", label: "📰 সংবাদ" },
  { id: "projects", label: "🔨 প্রকল্প" },
  { id: "decisions", label: "⚖️ সিদ্ধান্ত" },
  { id: "documents", label: "📄 দলিল" },
];

  return (
    <div style={{ fontFamily: "sans-serif", background: T.bg, minHeight: "100vh", color: T.text }}>

      {/* অ্যাডমিন হেডার */}
      <div style={{ background: "#C0392B", borderBottom: "3px solid #C9A84C", padding: "12px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: "bold", color: "#fff" }}>🔐 অ্যাডমিন প্যানেল</div>
          <div style={{ fontSize: 11, color: "#ffcccc", marginTop: 2 }}>গণপ্রজাতন্ত্রী বাংলাদেশ সরকার</div>
        </div>
        <button onClick={onLogout} style={{ background: "rgba(255,255,255,0.15)", border: "none", borderRadius: 20, padding: "6px 14px", color: "#fff", cursor: "pointer", fontSize: 13 }}>
          🚪 লগআউট
        </button>
      </div>

      {/* সেকশন মেনু */}
      <div style={{ display: "flex", background: T.navBg, borderBottom: `2px solid ${T.navBorder}`, overflowX: "auto" }}>
        {sections.map(s => (
          <button key={s.id} onClick={() => setActiveSection(s.id)} style={{ background: activeSection === s.id ? "rgba(201,168,76,0.15)" : "transparent", border: "none", borderBottom: activeSection === s.id ? "3px solid #C9A84C" : "3px solid transparent", color: activeSection === s.id ? "#C9A84C" : T.textMuted, padding: "12px 18px", cursor: "pointer", fontSize: 13, whiteSpace: "nowrap", fontFamily: "sans-serif" }}>
            {s.label}
          </button>
        ))}
      </div>

      {/* সফলতা/ত্রুটি বার্তা */}
      {message && (
        <div style={{ background: message.type === "error" ? "#3a1010" : "#0a2a1a", border: `1px solid ${message.type === "error" ? "#c0392b" : "#006A4E"}`, borderRadius: 8, margin: "12px 20px", padding: "10px 16px", color: message.type === "error" ? "#ff8a8a" : "#4ecba0", fontSize: 13 }}>
          {message.type === "error" ? "⚠️" : "✅"} {message.text}
        </div>
      )}

      {loading && <div style={{ textAlign: "center", padding: 40, color: "#C9A84C" }}>⏳ লোড হচ্ছে...</div>}

      {!loading && (
        <div style={{ padding: 20, maxWidth: 800, margin: "0 auto" }}>

          {/* ড্যাশবোর্ড সেকশন */}
          {activeSection === "dashboard" && (
            <div>
              <h2 style={{ color: "#C9A84C", borderLeft: "4px solid #C0392B", paddingLeft: 10, marginBottom: 16, fontSize: 16 }}>📊 সারসংক্ষেপ</h2>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12, marginBottom: 24 }}>
                {[
                  { label: "মন্ত্রী", value: ministers.length, icon: "👥", color: "#006A4E" },
                  { label: "সংবাদ", value: news.length, icon: "📰", color: "#C9A84C" },
                  { label: "এমপি", value: mps.length, icon: "🏅", color: "#3B8BD4" },
                  { label: "প্রকল্প", value: projects.length, icon: "🔨", color: "#9F5DCF" },
                ].map((s, i) => (
                  <div key={i} style={{ background: T.card, border: `1px solid ${s.color}`, borderRadius: 10, padding: 16, textAlign: "center" }}>
                    <div style={{ fontSize: 26 }}>{s.icon}</div>
                    <div style={{ fontSize: 24, fontWeight: "bold", color: s.color, margin: "6px 0" }}>{s.value}</div>
                    <div style={{ fontSize: 12, color: T.textMuted }}>{s.label}</div>
                  </div>
                ))}
              </div>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16 }}>
                <div style={{ fontSize: 13, color: T.textSecondary, lineHeight: 1.8 }}>
                  <div>✅ অ্যাডমিন প্যানেলে স্বাগতম</div>
                  <div>📝 উপরের মেনু থেকে মন্ত্রিসভা, সংবাদ বা প্রকল্প ম্যানেজ করুন</div>
                  <div>🔄 যেকোনো পরিবর্তন সাথে সাথে অ্যাপে দেখা যাবে</div>
                  <div>🔐 কাজ শেষে লগআউট করুন</div>
                </div>
              </div>
            </div>
          )}

          {/* মন্ত্রিসভা সেকশন */}
          {activeSection === "ministers" && (
            <div>
              <h2 style={{ color: "#C9A84C", borderLeft: "4px solid #C0392B", paddingLeft: 10, marginBottom: 16, fontSize: 16 }}>👥 নতুন মন্ত্রী যোগ করুন</h2>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16, marginBottom: 20 }}>
                <input placeholder="মন্ত্রীর নাম *" value={newMinister.name} onChange={e => setNewMinister({ ...newMinister, name: e.target.value })} style={inputStyle} />
                <select value={newMinister.role} onChange={e => setNewMinister({ ...newMinister, role: e.target.value })} style={inputStyle}>
                  <option>মন্ত্রী</option>
                  <option>প্রধানমন্ত্রী</option>
                  <option>সিনিয়র মন্ত্রী</option>
                  <option>প্রতিমন্ত্রী</option>
                  <option>উপমন্ত্রী</option>
                  <option>মন্ত্রী (টেকনোক্র্যাট)</option>
                </select>
                <input placeholder="মন্ত্রণালয় *" value={newMinister.ministry} onChange={e => setNewMinister({ ...newMinister, ministry: e.target.value })} style={inputStyle} />
                <input placeholder="আইকন (ইমোজি, যেমন: 🏛️)" value={newMinister.icon} onChange={e => setNewMinister({ ...newMinister, icon: e.target.value })} style={{ ...inputStyle, marginBottom: 14 }} />
                <button onClick={addMinister} disabled={saving} style={btnStyle}>{saving ? "যোগ হচ্ছে..." : "✅ মন্ত্রী যোগ করুন"}</button>
              </div>

              <h2 style={{ color: "#C9A84C", borderLeft: "4px solid #C0392B", paddingLeft: 10, marginBottom: 12, fontSize: 15 }}>বর্তমান মন্ত্রিসভা ({ministers.length} জন)</h2>
              {ministers.map((m, i) => (
                <div key={i} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 12, marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: "bold", color: T.text }}>{m.icon} {m.name}</div>
                    <div style={{ fontSize: 12, color: "#C9A84C", marginTop: 2 }}>{m.role} · {m.ministry}</div>
                  </div>
                  <button onClick={() => deleteMinister(m.id)} style={deleteBtnStyle}>🗑️ মুছুন</button>
                </div>
              ))}
            </div>
          )}

          {/* সংবাদ সেকশন */}
          {activeSection === "news" && (
            <div>
              <h2 style={{ color: "#C9A84C", borderLeft: "4px solid #C0392B", paddingLeft: 10, marginBottom: 16, fontSize: 16 }}>📰 নতুন সংবাদ যোগ করুন</h2>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16, marginBottom: 20 }}>
                <textarea placeholder="সংবাদের শিরোনাম *" value={newNews.title} onChange={e => setNewNews({ ...newNews, title: e.target.value })} rows={3} style={{ ...inputStyle, resize: "vertical" }} />
                <input placeholder="সূত্র (যেমন: প্রথম আলো) *" value={newNews.source} onChange={e => setNewNews({ ...newNews, source: e.target.value })} style={inputStyle} />
                <select value={newNews.category} onChange={e => setNewNews({ ...newNews, category: e.target.value })} style={inputStyle}>
                  <option>সরকারি</option>
                  <option>অর্থনীতি</option>
                  <option>সংসদ</option>
                  <option>শিক্ষা</option>
                  <option>আইনশৃঙ্খলা</option>
                  <option>উন্নয়ন</option>
                  <option>পররাষ্ট্র</option>
                </select>
                <input placeholder="তারিখ (যেমন: ২০ জুলাই ২০২৬)" value={newNews.time} onChange={e => setNewNews({ ...newNews, time: e.target.value })} style={{ ...inputStyle, marginBottom: 14 }} />
                <button onClick={addNews} disabled={saving} style={btnStyle}>{saving ? "যোগ হচ্ছে..." : "✅ সংবাদ যোগ করুন"}</button>
              </div>

              <h2 style={{ color: "#C9A84C", borderLeft: "4px solid #C0392B", paddingLeft: 10, marginBottom: 12, fontSize: 15 }}>সর্বশেষ সংবাদ ({news.length}টি)</h2>
              {news.map((n, i) => (
                <div key={i} style={{ background: T.card, border: `1px solid ${T.border}`, borderLeft: "4px solid #006A4E", borderRadius: 8, padding: 12, marginBottom: 8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 11, color: "#C9A84C", marginBottom: 4 }}>{n.source} · {n.category}</div>
                      <div style={{ fontSize: 13, color: T.text, lineHeight: 1.5 }}>{n.title}</div>
                      <div style={{ fontSize: 11, color: T.textMuted, marginTop: 4 }}>🕐 {n.time}</div>
                    </div>
                    <button onClick={() => deleteNews(n.id)} style={deleteBtnStyle}>🗑️</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* প্রকল্প সেকশন */}
          {activeSection === "projects" && (
            <div>
              <h2 style={{ color: "#C9A84C", borderLeft: "4px solid #C0392B", paddingLeft: 10, marginBottom: 16, fontSize: 16 }}>🔨 নতুন প্রকল্প যোগ করুন</h2>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16, marginBottom: 20 }}>
                <input placeholder="প্রকল্পের নাম *" value={newProject.title} onChange={e => setNewProject({ ...newProject, title: e.target.value })} style={inputStyle} />
                <input placeholder="মন্ত্রণালয় *" value={newProject.ministry} onChange={e => setNewProject({ ...newProject, ministry: e.target.value })} style={inputStyle} />
                <input placeholder="বাজেট (যেমন: ৫,০০০ কোটি টাকা)" value={newProject.budget} onChange={e => setNewProject({ ...newProject, budget: e.target.value })} style={inputStyle} />
                <div style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: 13, color: T.textMuted, marginBottom: 6 }}>অগ্রগতি: {newProject.progress}%</div>
                  <input type="range" min="0" max="100" value={newProject.progress} onChange={e => setNewProject({ ...newProject, progress: Number(e.target.value) })} style={{ width: "100%" }} />
                </div>
                <select value={newProject.status} onChange={e => setNewProject({ ...newProject, status: e.target.value })} style={{ ...inputStyle, marginBottom: 14 }}>
                  <option>চলমান</option>
                  <option>নতুন</option>
                  <option>সম্পন্ন</option>
                  <option>স্থগিত</option>
                </select>
                <button onClick={addProject} disabled={saving} style={btnStyle}>{saving ? "যোগ হচ্ছে..." : "✅ প্রকল্প যোগ করুন"}</button>
              </div>

              <h2 style={{ color: "#C9A84C", borderLeft: "4px solid #C0392B", paddingLeft: 10, marginBottom: 12, fontSize: 15 }}>বর্তমান প্রকল্প ({projects.length}টি)</h2>
              {projects.map((p, i) => (
                <div key={i} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 14, marginBottom: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: "bold", color: T.text }}>{p.title}</div>
                      <div style={{ fontSize: 12, color: T.textMuted, marginTop: 2 }}>📁 {p.ministry} · 💰 {p.budget}</div>
                    </div>
                    <button onClick={() => deleteProject(p.id)} style={deleteBtnStyle}>🗑️</button>
                  </div>
                  <div style={{ fontSize: 12, color: T.textMuted, marginBottom: 4 }}>অগ্রগতি: {p.progress}%</div>
                  <input type="range" min="0" max="100" value={p.progress}
                    onChange={e => updateProgress(p.id, e.target.value)}
                    style={{ width: "100%", marginBottom: 6 }}
                  />
                  <div style={{ height: 6, background: T.border, borderRadius: 3, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${p.progress}%`, background: "linear-gradient(90deg, #006A4E, #C9A84C)", borderRadius: 3 }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
{/* সিদ্ধান্ত সেকশন */}
{activeSection === "decisions" && (
  <div>
    <h2 style={{ color: "#C9A84C", borderLeft: "4px solid #C0392B", paddingLeft: 10, marginBottom: 16, fontSize: 16 }}>⚖️ নতুন সিদ্ধান্ত যোগ করুন</h2>
    <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16, marginBottom: 20 }}>
      <input placeholder="সিদ্ধান্তের শিরোনাম *" value={newDecision.title} onChange={e => setNewDecision({ ...newDecision, title: e.target.value })} style={inputStyle} />
      <textarea placeholder="বিস্তারিত বিবরণ" value={newDecision.description} onChange={e => setNewDecision({ ...newDecision, description: e.target.value })} rows={3} style={{ ...inputStyle, resize: "vertical" }} />
      <input placeholder="তারিখ (যেমন: ১৫ জুলাই ২০২৬)" value={newDecision.date} onChange={e => setNewDecision({ ...newDecision, date: e.target.value })} style={inputStyle} />
      <select value={newDecision.category} onChange={e => setNewDecision({ ...newDecision, category: e.target.value })} style={inputStyle}>
        <option>সরকারি সিদ্ধান্ত</option>
        <option>প্রযুক্তি</option>
        <option>শিক্ষা</option>
        <option>আইন</option>
        <option>কৃষি</option>
        <option>অর্থনীতি</option>
        <option>স্বাস্থ্য</option>
        <option>পররাষ্ট্র</option>
      </select>
      <button onClick={async () => {
        if (!newDecision.title) return showMessage("শিরোনাম আবশ্যক", "error");
        setSaving(true);
        const { error } = await supabase.from("decisions").insert(newDecision);
        if (error) showMessage("সমস্যা হয়েছে", "error");
        else { showMessage("সিদ্ধান্ত যোগ হয়েছে!"); setNewDecision({ title: "", description: "", date: "", category: "সরকারি সিদ্ধান্ত" }); fetchAll(); }
        setSaving(false);
      }} disabled={saving} style={btnStyle}>
        {saving ? "যোগ হচ্ছে..." : "✅ সিদ্ধান্ত যোগ করুন"}
      </button>
    </div>

    <h2 style={{ color: "#C9A84C", borderLeft: "4px solid #C0392B", paddingLeft: 10, marginBottom: 12, fontSize: 15 }}>সিদ্ধান্ত তালিকা ({decisions.length}টি)</h2>
    {decisions.map((d, i) => (
      <div key={i} style={{ background: T.card, border: `1px solid ${T.border}`, borderLeft: "4px solid #C9A84C", borderRadius: 8, padding: 12, marginBottom: 8 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, color: "#C9A84C", marginBottom: 4 }}>{d.category} · {d.date}</div>
            <div style={{ fontSize: 14, fontWeight: "bold", color: T.text }}>{d.title}</div>
            <div style={{ fontSize: 12, color: T.textMuted, marginTop: 4 }}>{d.description}</div>
          </div>
          <button onClick={async () => {
            if (!window.confirm("মুছবেন?")) return;
            await supabase.from("decisions").delete().eq("id", d.id);
            showMessage("মুছে ফেলা হয়েছে");
            fetchAll();
          }} style={deleteBtnStyle}>🗑️</button>
        </div>
      </div>
    ))}
  </div>
)}

{/* দলিল সেকশন */}
{activeSection === "documents" && (
  <div>
    <h2 style={{ color: "#C9A84C", borderLeft: "4px solid #C0392B", paddingLeft: 10, marginBottom: 16, fontSize: 16 }}>📄 নতুন দলিল যোগ করুন</h2>
    <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16, marginBottom: 20 }}>
      <input placeholder="দলিলের শিরোনাম *" value={newDocument.title} onChange={e => setNewDocument({ ...newDocument, title: e.target.value })} style={inputStyle} />
      <textarea placeholder="বিস্তারিত বিবরণ" value={newDocument.description} onChange={e => setNewDocument({ ...newDocument, description: e.target.value })} rows={2} style={{ ...inputStyle, resize: "vertical" }} />
      <input placeholder="ফাইল লিংক (PDF URL)" value={newDocument.file_url} onChange={e => setNewDocument({ ...newDocument, file_url: e.target.value })} style={inputStyle} />
      <input placeholder="তারিখ" value={newDocument.date} onChange={e => setNewDocument({ ...newDocument, date: e.target.value })} style={inputStyle} />
      <select value={newDocument.category} onChange={e => setNewDocument({ ...newDocument, category: e.target.value })} style={inputStyle}>
        <option>সরকারি দলিল</option>
        <option>বাজেট</option>
        <option>সংসদ</option>
        <option>পরিকল্পনা</option>
        <option>গেজেট</option>
        <option>আইন</option>
        <option>চুক্তি</option>
      </select>
      <button onClick={async () => {
        if (!newDocument.title) return showMessage("শিরোনাম আবশ্যক", "error");
        setSaving(true);
        const { error } = await supabase.from("documents").insert(newDocument);
        if (error) showMessage("সমস্যা হয়েছে", "error");
        else { showMessage("দলিল যোগ হয়েছে!"); setNewDocument({ title: "", description: "", file_url: "", category: "সরকারি দলিল", date: "" }); fetchAll(); }
        setSaving(false);
      }} disabled={saving} style={btnStyle}>
        {saving ? "যোগ হচ্ছে..." : "✅ দলিল যোগ করুন"}
      </button>
    </div>

    <h2 style={{ color: "#C9A84C", borderLeft: "4px solid #C0392B", paddingLeft: 10, marginBottom: 12, fontSize: 15 }}>দলিল তালিকা ({documents.length}টি)</h2>
    {documents.map((d, i) => (
      <div key={i} style={{ background: T.card, border: `1px solid ${T.border}`, borderLeft: "4px solid #3B8BD4", borderRadius: 8, padding: 12, marginBottom: 8 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, color: "#3B8BD4", marginBottom: 4 }}>{d.category} · {d.date}</div>
            <div style={{ fontSize: 14, fontWeight: "bold", color: T.text }}>{d.title}</div>
            {d.file_url && <div style={{ fontSize: 11, color: "#4ecba0", marginTop: 4 }}>🔗 ফাইল লিংক আছে</div>}
          </div>
          <button onClick={async () => {
            if (!window.confirm("মুছবেন?")) return;
            await supabase.from("documents").delete().eq("id", d.id);
            showMessage("মুছে ফেলা হয়েছে");
            fetchAll();
          }} style={deleteBtnStyle}>🗑️</button>
        </div>
      </div>
    ))}
  </div>
)}