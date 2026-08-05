import { useState, useEffect } from "react";
import { supabase } from "./supabase";

async function translateToEnglish(text) {
    if (!text) return "";
    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 500,
          messages: [{ role: "user", content: "Translate this Bengali text to English. Return ONLY the translation, nothing else:\n\n" + text }]
        })
      });
      const data = await response.json();
      return data.content?.[0]?.text || text;
    } catch { return text; }
  }

export default function AdminPanel({ onLogout, isDark, T }) {
  const [activeSection, setActiveSection] = useState("dashboard");
  const [ministers, setMinisters] = useState([]);
  const [news, setNews] = useState([]);
  const [mps, setMps] = useState([]);
  const [projects, setProjects] = useState([]);
  const [decisions, setDecisions] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);
  const [activistPosts, setActivistPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  const [newMinister, setNewMinister] = useState({ name: "", role: "মন্ত্রী", ministry: "", icon: "👤" });
  const [newNews, setNewNews] = useState({ title: "", source: "", category: "সরকারি", time: "", content: "", link: "" });
  const [newProject, setNewProject] = useState({ title: "", ministry: "", budget: "", progress: 0, status: "চলমান" });
  const [newDecision, setNewDecision] = useState({ title: "", description: "", date: "", category: "সরকারি সিদ্ধান্ত" });
  const [newDocument, setNewDocument] = useState({ title: "", description: "", file_url: "", category: "সরকারি দলিল", date: "" });
  const [newPost, setNewPost] = useState({ author_name: "", author_fb_url: "", author_photo: "", content: "", fb_post_url: "", image_url: "" });

  useEffect(() => { fetchAll(); }, []);

  async function fetchAll() {
    setLoading(true);
    const [m, n, mp, p, dec, doc, fb, ap] = await Promise.all([
      supabase.from("ministers").select("*").order("id"),
      supabase.from("news").select("*").order("created_at", { ascending: false }).limit(30),
      supabase.from("mps").select("*").eq("government_id", 1).order("id").limit(100),
      supabase.from("projects").select("*").order("id"),
      supabase.from("decisions").select("*").order("created_at", { ascending: false }),
      supabase.from("documents").select("*").order("created_at", { ascending: false }),
      supabase.from("feedback").select("*").order("created_at", { ascending: false }),
      supabase.from("activist_posts").select("*").order("created_at", { ascending: false }),
    ]);
    setMinisters(m.data || []);
    setNews(n.data || []);
    setMps(mp.data || []);
    setProjects(p.data || []);
    setDecisions(dec.data || []);
    setDocuments(doc.data || []);
    setFeedbacks(fb.data || []);
    setActivistPosts(ap.data || []);
    setLoading(false);
  }

  function showMessage(text, type = "success") {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 3000);
  }

  const inputStyle = {
    width: "100%", background: T.bg,
    border: "1px solid " + T.border,
    borderRadius: 8, padding: "10px 14px",
    color: T.text, fontSize: 14,
    boxSizing: "border-box", outline: "none",
    marginBottom: 10, fontFamily: "sans-serif"
  };

  const btnStyle = {
    background: "#006A4E", color: "#fff",
    border: "none", borderRadius: 8,
    padding: "10px 20px", cursor: "pointer",
    fontSize: 14, fontWeight: "bold", width: "100%"
  };

  const deleteBtnStyle = {
    background: "transparent",
    border: "1px solid #c0392b",
    color: "#c0392b", borderRadius: 6,
    padding: "4px 10px", cursor: "pointer", fontSize: 12
  };

  const sections = [
    { id: "dashboard", label: "📊 ড্যাশবোর্ড" },
    { id: "ministers", label: "👥 মন্ত্রিসভা" },
    { id: "news", label: "📰 সংবাদ" },
    { id: "projects", label: "🔨 প্রকল্প" },
    { id: "decisions", label: "⚖️ সিদ্ধান্ত" },
    { id: "documents", label: "📄 দলিল" },
    { id: "feedback", label: "💬 ফিডব্যাক" },
    { id: "activists", label: "📣 অ্যাক্টিভিস্ট" },
  ];

  async function deleteItem(table, id, label) {
    if (!window.confirm(label + " মুছবেন?")) return;
    const { error } = await supabase.from(table).delete().eq("id", id);
    if (error) showMessage("মুছতে সমস্যা: " + error.message, "error");
    else { showMessage("মুছে ফেলা হয়েছে"); fetchAll(); }
  }

  async function updateField(table, id, field, value) {
    await supabase.from(table).update({ [field]: value }).eq("id", id);
  }

  return (
    <div style={{ fontFamily: "sans-serif", background: T.bg, minHeight: "100vh", color: T.text }}>

      <div style={{ background: "#C0392B", borderBottom: "3px solid #C9A84C", padding: "12px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: "bold", color: "#fff" }}>🔐 অ্যাডমিন প্যানেল</div>
          <div style={{ fontSize: 11, color: "#ffcccc", marginTop: 2 }}>গণপ্রজাতন্ত্রী বাংলাদেশ সরকার</div>
        </div>
        <button onClick={onLogout} style={{ background: "rgba(255,255,255,0.15)", border: "none", borderRadius: 20, padding: "6px 14px", color: "#fff", cursor: "pointer", fontSize: 13 }}>🚪 লগআউট</button>
      </div>

      <div style={{ display: "flex", background: T.navBg, borderBottom: "2px solid " + T.navBorder, overflowX: "auto" }}>
        {sections.map(s => (
          <button key={s.id} onClick={() => setActiveSection(s.id)} style={{ background: activeSection === s.id ? "rgba(201,168,76,0.15)" : "transparent", border: "none", borderBottom: activeSection === s.id ? "3px solid #C9A84C" : "3px solid transparent", color: activeSection === s.id ? "#C9A84C" : T.textMuted, padding: "12px 14px", cursor: "pointer", fontSize: 12, whiteSpace: "nowrap", fontFamily: "sans-serif" }}>
            {s.label}
          </button>
        ))}
      </div>

      {message && (
        <div style={{ background: message.type === "error" ? "#3a1010" : "#0a2a1a", border: "1px solid " + (message.type === "error" ? "#c0392b" : "#006A4E"), borderRadius: 8, margin: "12px 20px", padding: "10px 16px", color: message.type === "error" ? "#ff8a8a" : "#4ecba0", fontSize: 13 }}>
          {message.type === "error" ? "⚠️" : "✅"} {message.text}
        </div>
      )}

      {loading && <div style={{ textAlign: "center", padding: 40, color: "#C9A84C" }}>⏳ লোড হচ্ছে...</div>}

      {!loading && (
        <div style={{ padding: 20, maxWidth: 800, margin: "0 auto" }}>

          {/* ড্যাশবোর্ড */}
          {activeSection === "dashboard" && (
            <div>
              <h2 style={{ color: "#C9A84C", borderLeft: "4px solid #C0392B", paddingLeft: 10, marginBottom: 16, fontSize: 16 }}>📊 সারসংক্ষেপ</h2>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12, marginBottom: 24 }}>
                {[
                  { label: "মন্ত্রী", value: ministers.length, icon: "👥", color: "#006A4E" },
                  { label: "সংবাদ", value: news.length, icon: "📰", color: "#C9A84C" },
                  { label: "এমপি", value: mps.length, icon: "🏅", color: "#3B8BD4" },
                  { label: "প্রকল্প", value: projects.length, icon: "🔨", color: "#9F5DCF" },
                  { label: "সিদ্ধান্ত", value: decisions.length, icon: "⚖️", color: "#E8593C" },
                  { label: "ফিডব্যাক", value: feedbacks.length, icon: "💬", color: "#4ecba0" },
                ].map((s, i) => (
                  <div key={i} style={{ background: T.card, border: "1px solid " + s.color, borderRadius: 10, padding: 16, textAlign: "center" }}>
                    <div style={{ fontSize: 24 }}>{s.icon}</div>
                    <div style={{ fontSize: 22, fontWeight: "bold", color: s.color, margin: "6px 0" }}>{s.value}</div>
                    <div style={{ fontSize: 12, color: T.textMuted }}>{s.label}</div>
                  </div>
                ))}
              </div>
              <div style={{ background: T.card, border: "1px solid " + T.border, borderRadius: 10, padding: 16 }}>
                <div style={{ fontSize: 13, color: T.textSecondary, lineHeight: 1.8 }}>
                  <div>✅ অ্যাডমিন প্যানেলে স্বাগতম</div>
                  <div>📝 উপরের মেনু থেকে যেকোনো বিভাগ ম্যানেজ করুন</div>
                  <div>🔄 যেকোনো পরিবর্তন সাথে সাথে অ্যাপে দেখা যাবে</div>
                  <div>🔗 গোপন লিংক: https://bnp-govt-app.vercel.app/#admin-login-2026</div>
                </div>
              </div>
            </div>
          )}

          {/* মন্ত্রিসভা */}
          {activeSection === "ministers" && (
            <div>
              <h2 style={{ color: "#C9A84C", borderLeft: "4px solid #C0392B", paddingLeft: 10, marginBottom: 16, fontSize: 16 }}>👥 নতুন মন্ত্রী যোগ করুন</h2>
              <div style={{ background: T.card, border: "1px solid " + T.border, borderRadius: 10, padding: 16, marginBottom: 20 }}>
                <input placeholder="মন্ত্রীর নাম *" value={newMinister.name} onChange={e => setNewMinister({ ...newMinister, name: e.target.value })} style={inputStyle} />
                <select value={newMinister.role} onChange={e => setNewMinister({ ...newMinister, role: e.target.value })} style={inputStyle}>
                  <option>মন্ত্রী</option><option>প্রধানমন্ত্রী</option><option>সিনিয়র মন্ত্রী</option>
                  <option>প্রতিমন্ত্রী</option><option>উপমন্ত্রী</option><option>মন্ত্রী (টেকনোক্র্যাট)</option>
                </select>
                <input placeholder="মন্ত্রণালয় *" value={newMinister.ministry} onChange={e => setNewMinister({ ...newMinister, ministry: e.target.value })} style={inputStyle} />
                <input placeholder="আইকন (ইমোজি)" value={newMinister.icon} onChange={e => setNewMinister({ ...newMinister, icon: e.target.value })} style={{ ...inputStyle, marginBottom: 14 }} />
                <button onClick={async () => {
                  if (!newMinister.name || !newMinister.ministry) return showMessage("নাম ও মন্ত্রণালয় আবশ্যক", "error");
                  setSaving(true);
                  const { error } = await supabase.from("ministers").insert(newMinister);
                  if (error) showMessage("সমস্যা: " + error.message, "error");
                  else { showMessage("মন্ত্রী যোগ হয়েছে!"); setNewMinister({ name: "", role: "মন্ত্রী", ministry: "", icon: "👤" }); fetchAll(); }
                  setSaving(false);
                }} disabled={saving} style={btnStyle}>{saving ? "যোগ হচ্ছে..." : "✅ মন্ত্রী যোগ করুন"}</button>
              </div>

              <h2 style={{ color: "#C9A84C", borderLeft: "4px solid #C0392B", paddingLeft: 10, marginBottom: 12, fontSize: 15 }}>বর্তমান মন্ত্রিসভা ({ministers.length} জন)</h2>
              {ministers.map((minister, i) => (
                <div key={i} style={{ background: T.card, border: "1px solid " + T.border, borderRadius: 8, padding: 12, marginBottom: 8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: "bold", color: T.text }}>{minister.icon} {minister.name}</div>
                      <div style={{ fontSize: 12, color: "#C9A84C", marginTop: 2 }}>{minister.role} · {minister.ministry}</div>
                    </div>
                    <button onClick={() => deleteItem("ministers", minister.id, "এই মন্ত্রী")} style={deleteBtnStyle}>🗑️ মুছুন</button>
                  </div>
                  <textarea
                    placeholder="সংক্ষিপ্ত পরিচিতি (bio)"
                    defaultValue={minister.bio || ""}
                    onBlur={async e => {
                      const bio = e.target.value.trim();
                      if (bio !== (minister.bio || "")) {
                        await updateField("ministers", minister.id, "bio", bio);
                        showMessage(minister.name + "-এর bio আপডেট হয়েছে");
                      }
                    }}
                    rows={2}
                    style={{ width: "100%", background: T.bg, border: "1px solid " + T.border, borderRadius: 6, padding: "6px 10px", color: T.text, fontSize: 12, resize: "vertical", fontFamily: "sans-serif", marginTop: 6, boxSizing: "border-box" }}
                  />
                  <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
                    <input
                      placeholder="ফোন"
                      defaultValue={minister.phone || ""}
                      onBlur={async e => {
                        const phone = e.target.value.trim();
                        if (phone !== (minister.phone || "")) await updateField("ministers", minister.id, "phone", phone);
                      }}
                      style={{ flex: 1, background: T.bg, border: "1px solid " + T.border, borderRadius: 6, padding: "5px 8px", color: T.text, fontSize: 11, fontFamily: "sans-serif" }}
                    />
                    <input
                      placeholder="ইমেইল"
                      defaultValue={minister.email || ""}
                      onBlur={async e => {
                        const email = e.target.value.trim();
                        if (email !== (minister.email || "")) await updateField("ministers", minister.id, "email", email);
                      }}
                      style={{ flex: 1, background: T.bg, border: "1px solid " + T.border, borderRadius: 6, padding: "5px 8px", color: T.text, fontSize: 11, fontFamily: "sans-serif" }}
                    />
                  </div>
                  <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
                    <input
                      placeholder="Name (English)"
                      defaultValue={minister.name_en || ""}
                      onBlur={async e => {
                        const val = e.target.value.trim();
                        if (val !== (minister.name_en || "")) await updateField("ministers", minister.id, "name_en", val);
                      }}
                      style={{ flex: 1, background: T.bg, border: "1px solid " + T.border, borderRadius: 6, padding: "5px 8px", color: T.text, fontSize: 11, fontFamily: "sans-serif" }}
                    />
                    <input
                      placeholder="Role (English)"
                      defaultValue={minister.role_en || ""}
                      onBlur={async e => {
                        const val = e.target.value.trim();
                        if (val !== (minister.role_en || "")) await updateField("ministers", minister.id, "role_en", val);
                      }}
                      style={{ flex: 1, background: T.bg, border: "1px solid " + T.border, borderRadius: 6, padding: "5px 8px", color: T.text, fontSize: 11, fontFamily: "sans-serif" }}
                    />
                    <input
                      placeholder="Ministry (English)"
                      defaultValue={minister.ministry_en || ""}
                      onBlur={async e => {
                        const val = e.target.value.trim();
                        if (val !== (minister.ministry_en || "")) await updateField("ministers", minister.id, "ministry_en", val);
                      }}
                      style={{ flex: 1, background: T.bg, border: "1px solid " + T.border, borderRadius: 6, padding: "5px 8px", color: T.text, fontSize: 11, fontFamily: "sans-serif" }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          <button onClick={async () => {
            if (!newMinister.name || !newMinister.ministry) return showMessage("নাম ও মন্ত্রণালয় আবশ্যক", "error");
            setSaving(true);
            
            // স্বয়ংক্রিয় ইংরেজি অনুবাদ
            showMessage("অনুবাদ হচ্ছে...", "success");
            const [name_en, role_en, ministry_en] = await Promise.all([
              translateToEnglish(newMinister.name),
              translateToEnglish(newMinister.role),
              translateToEnglish(newMinister.ministry),
            ]);
            
            const { error } = await supabase.from("ministers").insert({
              ...newMinister, name_en, role_en, ministry_en
            });
            if (error) showMessage("সমস্যা: " + error.message, "error");
            else { showMessage("মন্ত্রী যোগ ও অনুবাদ সম্পন্ন!"); setNewMinister({ name: "", role: "মন্ত্রী", ministry: "", icon: "👤" }); fetchAll(); }
            setSaving(false);
          }} disabled={saving} style={btnStyle}>
            {saving ? "⏳ অনুবাদ ও সেভ হচ্ছে..." : "✅ মন্ত্রী যোগ করুন"}
          </button>

          {/* সংবাদ */}
          {activeSection === "news" && (
            <div>
              <h2 style={{ color: "#C9A84C", borderLeft: "4px solid #C0392B", paddingLeft: 10, marginBottom: 16, fontSize: 16 }}>📰 নতুন সংবাদ যোগ করুন</h2>
              <div style={{ background: T.card, border: "1px solid " + T.border, borderRadius: 10, padding: 16, marginBottom: 20 }}>
                <textarea placeholder="সংবাদের শিরোনাম *" value={newNews.title} onChange={e => setNewNews({ ...newNews, title: e.target.value })} rows={2} style={{ ...inputStyle, resize: "vertical" }} />
                <input placeholder="সূত্র *" value={newNews.source} onChange={e => setNewNews({ ...newNews, source: e.target.value })} style={inputStyle} />
                <select value={newNews.category} onChange={e => setNewNews({ ...newNews, category: e.target.value })} style={inputStyle}>
                  <option>সরকারি</option><option>অর্থনীতি</option><option>সংসদ</option>
                  <option>শিক্ষা</option><option>আইনশৃঙ্খলা</option><option>উন্নয়ন</option>
                  <option>পররাষ্ট্র</option><option>মন্ত্রিসভা</option>
                </select>
                <input placeholder="তারিখ" value={newNews.time} onChange={e => setNewNews({ ...newNews, time: e.target.value })} style={inputStyle} />
                <textarea placeholder="সম্পূর্ণ সংবাদ (ঐচ্ছিক)" value={newNews.content} onChange={e => setNewNews({ ...newNews, content: e.target.value })} rows={5} style={{ ...inputStyle, resize: "vertical" }} />
                <input placeholder="মূল সংবাদের লিংক" value={newNews.link} onChange={e => setNewNews({ ...newNews, link: e.target.value })} style={{ ...inputStyle, marginBottom: 14 }} />
                <button onClick={async () => {
                  if (!newNews.title || !newNews.source) return showMessage("শিরোনাম ও সূত্র আবশ্যক", "error");
                  setSaving(true);
                  const { error } = await supabase.from("news").insert({ ...newNews, time: newNews.time || new Date().toLocaleDateString("bn-BD") });
                  if (error) showMessage("সমস্যা: " + error.message, "error");
                  else { showMessage("সংবাদ যোগ হয়েছে!"); setNewNews({ title: "", source: "", category: "সরকারি", time: "", content: "", link: "" }); fetchAll(); }
                  setSaving(false);
                }} disabled={saving} style={btnStyle}>{saving ? "যোগ হচ্ছে..." : "✅ সংবাদ যোগ করুন"}</button>
              </div>

              <h2 style={{ color: "#C9A84C", borderLeft: "4px solid #C0392B", paddingLeft: 10, marginBottom: 12, fontSize: 15 }}>সর্বশেষ সংবাদ ({news.length}টি)</h2>
              {news.map((newsItem, i) => (
                <div key={i} style={{ background: T.card, border: "1px solid " + T.border, borderLeft: "4px solid #006A4E", borderRadius: 8, padding: 12, marginBottom: 8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, marginBottom: 8 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 11, color: "#C9A84C", marginBottom: 4 }}>{newsItem.source} · {newsItem.category}</div>
                      <div style={{ fontSize: 13, color: T.text, lineHeight: 1.5 }}>{newsItem.title}</div>
                      <div style={{ fontSize: 11, color: T.textMuted, marginTop: 3 }}>🕐 {newsItem.time}</div>
                    </div>
                    <button onClick={async () => {
                      if (!newNews.title || !newNews.source) return showMessage("শিরোনাম ও সূত্র আবশ্যক", "error");
                      setSaving(true);
                      showMessage("অনুবাদ হচ্ছে...", "success");
                      
                      const [title_en, content_en] = await Promise.all([
                        translateToEnglish(newNews.title),
                        newNews.content ? translateToEnglish(newNews.content) : Promise.resolve(""),
                      ]);
                      
                      const { error } = await supabase.from("news").insert({
                        ...newNews,
                        title_en,
                        content_en,
                        time: newNews.time || new Date().toLocaleDateString("bn-BD")
                      });
                      if (error) showMessage("সমস্যা: " + error.message, "error");
                      else { showMessage("সংবাদ যোগ ও অনুবাদ সম্পন্ন!"); setNewNews({ title: "", source: "", category: "সরকারি", time: "", content: "", link: "" }); fetchAll(); }
                      setSaving(false);
                    }} disabled={saving} style={btnStyle}>
                      {saving ? "⏳ অনুবাদ হচ্ছে..." : "✅ সংবাদ যোগ করুন"}
                    </button>
                    <button onClick={() => deleteItem("news", newsItem.id, "এই সংবাদ")} style={deleteBtnStyle}>🗑️</button>
                  </div>
                  <textarea
                    placeholder="সম্পূর্ণ সংবাদ লিখুন..."
                    defaultValue={newsItem.content || ""}
                    onBlur={async e => {
                      const content = e.target.value.trim();
                      if (content !== (newsItem.content || "")) {
                        await updateField("news", newsItem.id, "content", content);
                        showMessage("সংবাদ আপডেট হয়েছে");
                      }
                    }}
                    rows={3}
                    style={{ width: "100%", background: T.bg, border: "1px solid " + T.border, borderRadius: 6, padding: "6px 10px", color: T.text, fontSize: 12, resize: "vertical", fontFamily: "sans-serif", marginBottom: 6, boxSizing: "border-box" }}
                  />
                  <input
                    placeholder="মূল সংবাদের লিংক"
                    defaultValue={newsItem.link || ""}
                    onBlur={async e => {
                      const link = e.target.value.trim();
                      if (link !== (newsItem.link || "")) {
                        await updateField("news", newsItem.id, "link", link);
                        showMessage("লিংক আপডেট হয়েছে");
                      }
                    }}
                    style={{ width: "100%", background: T.bg, border: "1px solid " + T.border, borderRadius: 6, padding: "6px 10px", color: T.text, fontSize: 12, fontFamily: "sans-serif", boxSizing: "border-box" }}
                  />
                </div>
              ))}
            </div>
          )}

<button onClick={async () => {
  if (!newNews.title || !newNews.source) return showMessage("শিরোনাম ও সূত্র আবশ্যক", "error");
  setSaving(true);
  showMessage("অনুবাদ হচ্ছে...", "success");
  
  const [title_en, content_en] = await Promise.all([
    translateToEnglish(newNews.title),
    newNews.content ? translateToEnglish(newNews.content) : Promise.resolve(""),
  ]);
  
  const { error } = await supabase.from("news").insert({
    ...newNews,
    title_en,
    content_en,
    time: newNews.time || new Date().toLocaleDateString("bn-BD")
  });
  if (error) showMessage("সমস্যা: " + error.message, "error");
  else { showMessage("সংবাদ যোগ ও অনুবাদ সম্পন্ন!"); setNewNews({ title: "", source: "", category: "সরকারি", time: "", content: "", link: "" }); fetchAll(); }
  setSaving(false);
}} disabled={saving} style={btnStyle}>
  {saving ? "⏳ অনুবাদ হচ্ছে..." : "✅ সংবাদ যোগ করুন"}
</button>

          {/* প্রকল্প */}
          {activeSection === "projects" && (
            <div>
              <h2 style={{ color: "#C9A84C", borderLeft: "4px solid #C0392B", paddingLeft: 10, marginBottom: 16, fontSize: 16 }}>🔨 নতুন প্রকল্প যোগ করুন</h2>
              <div style={{ background: T.card, border: "1px solid " + T.border, borderRadius: 10, padding: 16, marginBottom: 20 }}>
                <input placeholder="প্রকল্পের নাম *" value={newProject.title} onChange={e => setNewProject({ ...newProject, title: e.target.value })} style={inputStyle} />
                <input placeholder="মন্ত্রণালয় *" value={newProject.ministry} onChange={e => setNewProject({ ...newProject, ministry: e.target.value })} style={inputStyle} />
                <input placeholder="বাজেট" value={newProject.budget} onChange={e => setNewProject({ ...newProject, budget: e.target.value })} style={inputStyle} />
                <div style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: 13, color: T.textMuted, marginBottom: 6 }}>অগ্রগতি: {newProject.progress}%</div>
                  <input type="range" min="0" max="100" value={newProject.progress} onChange={e => setNewProject({ ...newProject, progress: Number(e.target.value) })} style={{ width: "100%" }} />
                </div>
                <select value={newProject.status} onChange={e => setNewProject({ ...newProject, status: e.target.value })} style={{ ...inputStyle, marginBottom: 14 }}>
                  <option>চলমান</option><option>নতুন</option><option>সম্পন্ন</option><option>স্থগিত</option>
                </select>
                <button onClick={async () => {
                  if (!newProject.title || !newProject.ministry) return showMessage("শিরোনাম ও মন্ত্রণালয় আবশ্যক", "error");
                  setSaving(true);
                  const { error } = await supabase.from("projects").insert(newProject);
                  if (error) showMessage("সমস্যা: " + error.message, "error");
                  else { showMessage("প্রকল্প যোগ হয়েছে!"); setNewProject({ title: "", ministry: "", budget: "", progress: 0, status: "চলমান" }); fetchAll(); }
                  setSaving(false);
                }} disabled={saving} style={btnStyle}>{saving ? "যোগ হচ্ছে..." : "✅ প্রকল্প যোগ করুন"}</button>
              </div>

              <h2 style={{ color: "#C9A84C", borderLeft: "4px solid #C0392B", paddingLeft: 10, marginBottom: 12, fontSize: 15 }}>বর্তমান প্রকল্প ({projects.length}টি)</h2>
              {projects.map((project, i) => (
                <div key={i} style={{ background: T.card, border: "1px solid " + T.border, borderRadius: 8, padding: 14, marginBottom: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: "bold", color: T.text }}>{project.title}</div>
                      <div style={{ fontSize: 12, color: T.textMuted, marginTop: 2 }}>📁 {project.ministry} · 💰 {project.budget}</div>
                    </div>
                    <button onClick={() => deleteItem("projects", project.id, "এই প্রকল্প")} style={deleteBtnStyle}>🗑️</button>
                  </div>
                  <div style={{ fontSize: 12, color: T.textMuted, marginBottom: 4 }}>অগ্রগতি: {project.progress}%</div>
                  <input type="range" min="0" max="100" value={project.progress}
                    onChange={async e => {
                      await updateField("projects", project.id, "progress", Number(e.target.value));
                      fetchAll();
                    }}
                    style={{ width: "100%", marginBottom: 6 }}
                  />
                  <div style={{ height: 6, background: T.border, borderRadius: 3, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: project.progress + "%", background: "linear-gradient(90deg, #006A4E, #C9A84C)", borderRadius: 3 }} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* সিদ্ধান্ত */}
          {activeSection === "decisions" && (
            <div>
              <h2 style={{ color: "#C9A84C", borderLeft: "4px solid #C0392B", paddingLeft: 10, marginBottom: 16, fontSize: 16 }}>⚖️ নতুন সিদ্ধান্ত যোগ করুন</h2>
              <div style={{ background: T.card, border: "1px solid " + T.border, borderRadius: 10, padding: 16, marginBottom: 20 }}>
                <input placeholder="সিদ্ধান্তের শিরোনাম *" value={newDecision.title} onChange={e => setNewDecision({ ...newDecision, title: e.target.value })} style={inputStyle} />
                <textarea placeholder="বিস্তারিত বিবরণ" value={newDecision.description} onChange={e => setNewDecision({ ...newDecision, description: e.target.value })} rows={3} style={{ ...inputStyle, resize: "vertical" }} />
                <input placeholder="তারিখ (যেমন: ১৫ জুলাই ২০২৬)" value={newDecision.date} onChange={e => setNewDecision({ ...newDecision, date: e.target.value })} style={inputStyle} />
                <select value={newDecision.category} onChange={e => setNewDecision({ ...newDecision, category: e.target.value })} style={{ ...inputStyle, marginBottom: 14 }}>
                  <option>সরকারি সিদ্ধান্ত</option><option>প্রযুক্তি</option><option>শিক্ষা</option>
                  <option>আইন</option><option>কৃষি</option><option>অর্থনীতি</option><option>স্বাস্থ্য</option><option>পররাষ্ট্র</option>
                </select>
                <button onClick={async () => {
                  if (!newDecision.title) return showMessage("শিরোনাম আবশ্যক", "error");
                  setSaving(true);
                  const { error } = await supabase.from("decisions").insert(newDecision);
                  if (error) showMessage("সমস্যা: " + error.message, "error");
                  else { showMessage("সিদ্ধান্ত যোগ হয়েছে!"); setNewDecision({ title: "", description: "", date: "", category: "সরকারি সিদ্ধান্ত" }); fetchAll(); }
                  setSaving(false);
                }} disabled={saving} style={btnStyle}>{saving ? "যোগ হচ্ছে..." : "✅ সিদ্ধান্ত যোগ করুন"}</button>
              </div>

              <h2 style={{ color: "#C9A84C", borderLeft: "4px solid #C0392B", paddingLeft: 10, marginBottom: 12, fontSize: 15 }}>সিদ্ধান্ত তালিকা ({decisions.length}টি)</h2>
              {decisions.map((decision, i) => (
                <div key={i} style={{ background: T.card, border: "1px solid " + T.border, borderLeft: "4px solid #C9A84C", borderRadius: 8, padding: 12, marginBottom: 8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 11, color: "#C9A84C", marginBottom: 4 }}>{decision.category} · {decision.date}</div>
                      <div style={{ fontSize: 14, fontWeight: "bold", color: T.text }}>{decision.title}</div>
                      <div style={{ fontSize: 12, color: T.textMuted, marginTop: 4 }}>{decision.description}</div>
                    </div>
                    <button onClick={() => deleteItem("decisions", decision.id, "এই সিদ্ধান্ত")} style={deleteBtnStyle}>🗑️</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* দলিল */}
          {activeSection === "documents" && (
            <div>
              <h2 style={{ color: "#C9A84C", borderLeft: "4px solid #C0392B", paddingLeft: 10, marginBottom: 16, fontSize: 16 }}>📄 নতুন দলিল যোগ করুন</h2>
              <div style={{ background: T.card, border: "1px solid " + T.border, borderRadius: 10, padding: 16, marginBottom: 20 }}>
                <input placeholder="দলিলের শিরোনাম *" value={newDocument.title} onChange={e => setNewDocument({ ...newDocument, title: e.target.value })} style={inputStyle} />
                <textarea placeholder="বিস্তারিত বিবরণ" value={newDocument.description} onChange={e => setNewDocument({ ...newDocument, description: e.target.value })} rows={2} style={{ ...inputStyle, resize: "vertical" }} />
                <input placeholder="ফাইল লিংক (PDF URL)" value={newDocument.file_url} onChange={e => setNewDocument({ ...newDocument, file_url: e.target.value })} style={inputStyle} />
                <input placeholder="তারিখ" value={newDocument.date} onChange={e => setNewDocument({ ...newDocument, date: e.target.value })} style={inputStyle} />
                <select value={newDocument.category} onChange={e => setNewDocument({ ...newDocument, category: e.target.value })} style={{ ...inputStyle, marginBottom: 14 }}>
                  <option>সরকারি দলিল</option><option>বাজেট</option><option>সংসদ</option>
                  <option>পরিকল্পনা</option><option>গেজেট</option><option>আইন</option><option>চুক্তি</option>
                </select>
                <button onClick={async () => {
                  if (!newDocument.title) return showMessage("শিরোনাম আবশ্যক", "error");
                  setSaving(true);
                  const { error } = await supabase.from("documents").insert(newDocument);
                  if (error) showMessage("সমস্যা: " + error.message, "error");
                  else { showMessage("দলিল যোগ হয়েছে!"); setNewDocument({ title: "", description: "", file_url: "", category: "সরকারি দলিল", date: "" }); fetchAll(); }
                  setSaving(false);
                }} disabled={saving} style={btnStyle}>{saving ? "যোগ হচ্ছে..." : "✅ দলিল যোগ করুন"}</button>
              </div>

              <h2 style={{ color: "#C9A84C", borderLeft: "4px solid #C0392B", paddingLeft: 10, marginBottom: 12, fontSize: 15 }}>দলিল তালিকা ({documents.length}টি)</h2>
              {documents.map((doc, i) => (
                <div key={i} style={{ background: T.card, border: "1px solid " + T.border, borderLeft: "4px solid #3B8BD4", borderRadius: 8, padding: 12, marginBottom: 8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 11, color: "#3B8BD4", marginBottom: 4 }}>{doc.category} · {doc.date}</div>
                      <div style={{ fontSize: 14, fontWeight: "bold", color: T.text }}>{doc.title}</div>
                      {doc.file_url && <div style={{ fontSize: 11, color: "#4ecba0", marginTop: 4 }}>🔗 ফাইল লিংক আছে</div>}
                    </div>
                    <button onClick={() => deleteItem("documents", doc.id, "এই দলিল")} style={deleteBtnStyle}>🗑️</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ফিডব্যাক */}
          {activeSection === "feedback" && (
            <div>
              <h2 style={{ color: "#C9A84C", borderLeft: "4px solid #C0392B", paddingLeft: 10, marginBottom: 16, fontSize: 16 }}>💬 ফিডব্যাক মডারেশন ({feedbacks.length}টি)</h2>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 20 }}>
                {[
                  { label: "মোট", value: feedbacks.length, color: "#C9A84C" },
                  { label: "অনুমোদিত", value: feedbacks.filter(f => f.status === "approved").length, color: "#4ecba0" },
                  { label: "বিচারাধীন", value: feedbacks.filter(f => f.status === "pending").length, color: "#E8593C" },
                ].map((s, i) => (
                  <div key={i} style={{ background: T.card, border: "1px solid " + T.border, borderRadius: 8, padding: 12, textAlign: "center" }}>
                    <div style={{ fontSize: 22, fontWeight: "bold", color: s.color }}>{s.value}</div>
                    <div style={{ fontSize: 11, color: T.textMuted, marginTop: 4 }}>{s.label}</div>
                  </div>
                ))}
              </div>
              {feedbacks.map((fb, i) => (
                <div key={i} style={{ background: T.card, border: "1px solid " + (fb.status === "pending" ? "#E8593C" : T.border), borderLeft: "4px solid " + (fb.status === "approved" ? "#4ecba0" : "#E8593C"), borderRadius: 8, padding: 14, marginBottom: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: "bold", color: T.text }}>{fb.name}</div>
                      <div style={{ fontSize: 11, color: "#C9A84C", marginTop: 2 }}>{fb.category} · {"★".repeat(fb.rating)}</div>
                    </div>
                    <div style={{ display: "flex", gap: 6 }}>
                      {fb.status === "pending" && (
                        <button onClick={async () => {
                          await supabase.from("feedback").update({ status: "approved" }).eq("id", fb.id);
                          showMessage("অনুমোদন হয়েছে!");
                          fetchAll();
                        }} style={{ background: "#006A4E", color: "#fff", border: "none", borderRadius: 6, padding: "4px 10px", cursor: "pointer", fontSize: 12 }}>✅</button>
                      )}
                      <button onClick={() => deleteItem("feedback", fb.id, "এই ফিডব্যাক")} style={deleteBtnStyle}>🗑️</button>
                    </div>
                  </div>
                  <div style={{ fontSize: 13, color: T.textSecondary, lineHeight: 1.6, borderTop: "1px solid " + T.border, paddingTop: 8 }}>"{fb.message}"</div>
                  <div style={{ fontSize: 11, color: T.textMuted, marginTop: 6 }}>
                    {new Date(fb.created_at).toLocaleDateString("bn-BD")} ·
                    <span style={{ color: fb.status === "approved" ? "#4ecba0" : "#E8593C", marginLeft: 4 }}>
                      {fb.status === "approved" ? "✅ অনুমোদিত" : "⏳ বিচারাধীন"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* অ্যাক্টিভিস্ট */}
          {activeSection === "activists" && (
            <div>
              <h2 style={{ color: "#C9A84C", borderLeft: "4px solid #C0392B", paddingLeft: 10, marginBottom: 16, fontSize: 16 }}>📣 নতুন পোস্ট যোগ করুন</h2>
              <div style={{ background: T.card, border: "1px solid " + T.border, borderRadius: 10, padding: 16, marginBottom: 20 }}>
                <input placeholder="অ্যাক্টিভিস্টের নাম *" value={newPost.author_name} onChange={e => setNewPost({ ...newPost, author_name: e.target.value })} style={inputStyle} />
                <input placeholder="Facebook প্রোফাইল URL" value={newPost.author_fb_url} onChange={e => setNewPost({ ...newPost, author_fb_url: e.target.value })} style={inputStyle} />
                <input placeholder="প্রোফাইল ছবির URL" value={newPost.author_photo} onChange={e => setNewPost({ ...newPost, author_photo: e.target.value })} style={inputStyle} />
                <textarea placeholder="পোস্টের বিষয়বস্তু *" value={newPost.content} onChange={e => setNewPost({ ...newPost, content: e.target.value })} rows={4} style={{ ...inputStyle, resize: "vertical" }} />
                <input placeholder="মূল Facebook পোস্টের লিংক" value={newPost.fb_post_url} onChange={e => setNewPost({ ...newPost, fb_post_url: e.target.value })} style={inputStyle} />
                <input placeholder="পোস্টের ছবির URL" value={newPost.image_url} onChange={e => setNewPost({ ...newPost, image_url: e.target.value })} style={{ ...inputStyle, marginBottom: 14 }} />
                <button onClick={async () => {
                  if (!newPost.author_name || !newPost.content) return showMessage("নাম ও পোস্ট আবশ্যক", "error");
                  setSaving(true);
                  const { error } = await supabase.from("activist_posts").insert({ ...newPost, status: "approved" });
                  if (error) showMessage("সমস্যা: " + error.message, "error");
                  else { showMessage("পোস্ট যোগ হয়েছে!"); setNewPost({ author_name: "", author_fb_url: "", author_photo: "", content: "", fb_post_url: "", image_url: "" }); fetchAll(); }
                  setSaving(false);
                }} disabled={saving} style={btnStyle}>{saving ? "যোগ হচ্ছে..." : "✅ পোস্ট যোগ করুন"}</button>
              </div>

              <h2 style={{ color: "#C9A84C", borderLeft: "4px solid #C0392B", paddingLeft: 10, marginBottom: 12, fontSize: 15 }}>পোস্ট তালিকা ({activistPosts.length}টি)</h2>
              {activistPosts.map((post, i) => (
                <div key={i} style={{ background: T.card, border: "1px solid " + T.border, borderRadius: 8, padding: 12, marginBottom: 8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: "bold", color: T.text }}>{post.author_name}</div>
                      <div style={{ fontSize: 12, color: T.textMuted, marginTop: 4, lineHeight: 1.6 }}>{post.content.slice(0, 120)}...</div>
                    </div>
                    <button onClick={() => deleteItem("activist_posts", post.id, "এই পোস্ট")} style={deleteBtnStyle}>🗑️</button>
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