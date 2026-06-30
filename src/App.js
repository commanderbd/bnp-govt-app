import { useState, useEffect } from "react";
import { supabase } from "./supabase";

export default function App() {
  const [activeTab, setActiveTab] = useState("news");
  const [search, setSearch] = useState("");
  const [ministers, setMinisters] = useState([]);
  const [news, setNews] = useState([]);
  const [mps, setMps] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

useEffect(() => {
  fetchData();

  const channel = supabase
    .channel("realtime-updates")
    .on("postgres_changes", { event: "*", schema: "public", table: "ministers" }, fetchData)
    .on("postgres_changes", { event: "*", schema: "public", table: "news" }, fetchData)
    .on("postgres_changes", { event: "*", schema: "public", table: "mps" }, fetchData)
    .on("postgres_changes", { event: "*", schema: "public", table: "projects" }, fetchData)
    .subscribe((status) => {
      console.log("Realtime status:", status);
    });

  return () => {
    supabase.removeChannel(channel);
  };
}, []);

  async function fetchData() {
    setLoading(true);
    setError(null);

    const [ministerRes, newsRes, mpRes, projectRes] = await Promise.all([
      supabase.from("ministers").select("*").order("id"),
      supabase.from("news").select("*").order("id", { ascending: false }),
      supabase.from("mps").select("*").order("id"),
      supabase.from("projects").select("*").order("id"),
    ]);

    if (ministerRes.error || newsRes.error || mpRes.error || projectRes.error) {
      setError("ডেটাবেস সংযোগে সমস্যা হয়েছে।");
    } else {
      setMinisters(ministerRes.data || []);
      setNews(newsRes.data || []);
      setMps(mpRes.data || []);
      setProjects(projectRes.data || []);
    }

    setLoading(false);
  }

  const filteredMinisters = ministers.filter(m =>
    m.name.includes(search) || m.ministry.includes(search)
  );

  const filteredMps = mps.filter(m =>
    m.name.includes(search) || m.constituency.includes(search) || m.district.includes(search)
  );

  const tabs = [
    { id: "news", label: "📰 সংবাদ" },
    { id: "ministers", label: "👥 মন্ত্রিসভা" },
    { id: "mps", label: "🏅 এমপি তালিকা" },
    { id: "projects", label: "🔨 প্রকল্প" },
  ];

  return (
    <div style={{ fontFamily: "sans-serif", background: "#0D1B2A", minHeight: "100vh", color: "#F5F0E8" }}>

      {/* হেডার */}
      <div style={{ background: "#006A4E", borderBottom: "3px solid #C9A84C", padding: "16px 20px" }}>
        <div style={{ fontSize: 18, fontWeight: "bold" }}>
          🇧🇩 গণপ্রজাতন্ত্রী বাংলাদেশ সরকার
        </div>
        <div style={{ fontSize: 12, color: "#C9A84C", marginTop: 4 }}>
          ত্রয়োদশ জাতীয় সংসদ · বিএনপি সরকার ২০২৬
        </div>
      </div>

      {/* ট্যাব মেনু */}
      <div style={{ display: "flex", background: "#0a1520", borderBottom: "2px solid #1a2e40", overflowX: "auto" }}>
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => { setActiveTab(tab.id); setSearch(""); }} style={{
            background: activeTab === tab.id ? "rgba(201,168,76,0.15)" : "transparent",
            border: "none",
            borderBottom: activeTab === tab.id ? "3px solid #C9A84C" : "3px solid transparent",
            color: activeTab === tab.id ? "#C9A84C" : "#6a8a9a",
            padding: "12px 18px",
            cursor: "pointer",
            fontSize: 13,
            whiteSpace: "nowrap",
            fontFamily: "sans-serif"
          }}>
            {tab.label}
          </button>
        ))}
      </div>

      {error && (
        <div style={{ background: "#3a1010", border: "1px solid #c0392b", borderRadius: 8, margin: 20, padding: 16, color: "#ff8a8a" }}>
          ⚠️ {error}
        </div>
      )}

      {loading && (
        <div style={{ textAlign: "center", padding: 60, color: "#C9A84C", fontSize: 16 }}>
          ⏳ তথ্য লোড হচ্ছে...
        </div>
      )}

      {!loading && !error && (
        <div style={{ padding: 20, maxWidth: 700, margin: "0 auto" }}>

          {/* সংবাদ */}
          {activeTab === "news" && (
            <div>
              <h2 style={{ color: "#C9A84C", borderLeft: "4px solid #006A4E", paddingLeft: 10, marginBottom: 16, fontSize: 16 }}>
                সর্বশেষ সংবাদ
              </h2>
              {news.length === 0 && <div style={{ color: "#5a7a8a", textAlign: "center", padding: 40 }}>কোনো সংবাদ নেই</div>}
              {news.map((n, i) => (
                <div key={i} style={{ background: "#112233", border: "1px solid #1e3348", borderLeft: "4px solid #006A4E", borderRadius: 8, padding: 16, marginBottom: 12 }}>
                  <div style={{ fontSize: 11, color: "#C9A84C", fontWeight: "bold", marginBottom: 6 }}>{n.source} · {n.category}</div>
                  <div style={{ fontSize: 14, lineHeight: 1.6, marginBottom: 6 }}>{n.title}</div>
                  <div style={{ fontSize: 11, color: "#5a7a8a" }}>🕐 {n.time}</div>
                </div>
              ))}
            </div>
          )}

          {/* মন্ত্রিসভা */}
          {activeTab === "ministers" && (
            <div>
              <h2 style={{ color: "#C9A84C", borderLeft: "4px solid #006A4E", paddingLeft: 10, marginBottom: 16, fontSize: 16 }}>
                মন্ত্রিসভা
              </h2>
              <input placeholder="মন্ত্রী বা মন্ত্রণালয় খুঁজুন..." value={search} onChange={e => setSearch(e.target.value)}
                style={{ width: "100%", background: "#112233", border: "1px solid #1e3348", borderRadius: 8, padding: "10px 14px", color: "#F5F0E8", fontSize: 14, marginBottom: 16, boxSizing: "border-box", outline: "none" }} />
              {filteredMinisters.length === 0 && <div style={{ color: "#5a7a8a", textAlign: "center", padding: 40 }}>কোনো ফলাফল নেই</div>}
              {filteredMinisters.map((m, i) => (
                <div key={i} style={{ background: "#112233", border: "1px solid #1e3348", borderRadius: 10, padding: 16, marginBottom: 10, display: "flex", gap: 14, alignItems: "flex-start" }}>
                  <div style={{ width: 48, height: 48, borderRadius: "50%", background: "#006A4E", border: "2px solid #C9A84C", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>{m.icon}</div>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: "bold", color: "#e8f0f5" }}>{m.name}</div>
                    <div style={{ fontSize: 12, color: "#C9A84C", marginTop: 2 }}>{m.role}</div>
                    <div style={{ fontSize: 12, color: "#6a8a9a", marginTop: 3 }}>📁 {m.ministry}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* এমপি তালিকা */}
          {activeTab === "mps" && (
            <div>
              <h2 style={{ color: "#C9A84C", borderLeft: "4px solid #006A4E", paddingLeft: 10, marginBottom: 16, fontSize: 16 }}>
                সংসদ সদস্য তালিকা
              </h2>
              <input placeholder="নাম, আসন বা জেলা দিয়ে খুঁজুন..." value={search} onChange={e => setSearch(e.target.value)}
                style={{ width: "100%", background: "#112233", border: "1px solid #1e3348", borderRadius: 8, padding: "10px 14px", color: "#F5F0E8", fontSize: 14, marginBottom: 16, boxSizing: "border-box", outline: "none" }} />
              {filteredMps.length === 0 && <div style={{ color: "#5a7a8a", textAlign: "center", padding: 40 }}>কোনো ফলাফল নেই</div>}
              {filteredMps.map((m, i) => (
                <div key={i} style={{ background: "#112233", border: "1px solid #1e3348", borderRadius: 10, padding: 16, marginBottom: 10 }}>
                  <div style={{ fontSize: 15, fontWeight: "bold", color: "#e8f0f5" }}>{m.name}</div>
                  <div style={{ fontSize: 12, color: "#C9A84C", marginTop: 4 }}>🏅 আসন: {m.constituency} · {m.district}</div>
                  <div style={{ fontSize: 12, color: "#6a8a9a", marginTop: 3 }}>📞 {m.phone}</div>
                </div>
              ))}
            </div>
          )}

          {/* উন্নয়ন প্রকল্প */}
          {activeTab === "projects" && (
            <div>
              <h2 style={{ color: "#C9A84C", borderLeft: "4px solid #006A4E", paddingLeft: 10, marginBottom: 16, fontSize: 16 }}>
                উন্নয়ন প্রকল্প
              </h2>
              {projects.length === 0 && <div style={{ color: "#5a7a8a", textAlign: "center", padding: 40 }}>কোনো প্রকল্প নেই</div>}
              {projects.map((p, i) => (
                <div key={i} style={{ background: "#112233", border: "1px solid #1e3348", borderRadius: 10, padding: 18, marginBottom: 12 }}>
                  <div style={{ fontSize: 15, fontWeight: "bold", marginBottom: 8 }}>{p.title}</div>
                  <div style={{ fontSize: 12, color: "#6a8a9a", marginBottom: 8 }}>📁 {p.ministry}</div>
                  <div style={{ height: 8, background: "#1e3348", borderRadius: 4, overflow: "hidden", marginBottom: 8 }}>
                    <div style={{ height: "100%", width: `${p.progress}%`, background: "linear-gradient(90deg, #006A4E, #C9A84C)", borderRadius: 4 }} />
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#6a8a9a" }}>
                    <span>💰 {p.budget}</span>
                    <span>{p.progress}%</span>
                    <span style={{ color: p.status === "নতুন" ? "#C9A84C" : "#4ecba0" }}>● {p.status}</span>
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