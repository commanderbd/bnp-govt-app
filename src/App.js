import { useState, useEffect } from "react";
import { supabase } from "./supabase";

function formatBanglaDate(dateStr) {
  try {
    const date = new Date(dateStr);
    const options = { year: "numeric", month: "long", day: "numeric", timeZone: "Asia/Dhaka" };
    return date.toLocaleDateString("bn-BD", options);
  } catch {
    return dateStr;
  }
}

function SkeletonCard({ height = 80 }) {
  const shimmerStyle = `
  @keyframes shimmer {
    0% { transform: translateX(-100%); }
    100% { transform: translateX(100%); }
  }
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(8px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .fade-in { animation: fadeIn 0.3s ease forwards; }
`;
  return (
    <style>{shimmerStyle}</style>
    <div style={{
      background: "#112233",
      border: "1px solid #1e3348",
      borderRadius: 10,
      padding: 16,
      marginBottom: 12,
      overflow: "hidden",
      position: "relative"
    }}>
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
        background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.04) 50%, transparent 100%)",
        animation: "shimmer 1.5s infinite"
      }} />
      <div style={{ height: 12, background: "#1e3348", borderRadius: 4, width: "40%", marginBottom: 10 }} />
      <div style={{ height: 12, background: "#1e3348", borderRadius: 4, width: "90%", marginBottom: 8 }} />
      <div style={{ height: 12, background: "#1e3348", borderRadius: 4, width: "60%" }} />
    </div>
  );
}

function SkeletonStat() {
  return (
    <div style={{
      background: "#112233", border: "1px solid #1e3348",
      borderRadius: 10, padding: 16, textAlign: "center",
      position: "relative", overflow: "hidden"
    }}>
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
        background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.04) 50%, transparent 100%)",
        animation: "shimmer 1.5s infinite"
      }} />
      <div style={{ height: 28, width: 28, background: "#1e3348", borderRadius: "50%", margin: "0 auto 8px" }} />
      <div style={{ height: 20, background: "#1e3348", borderRadius: 4, width: "50%", margin: "0 auto 8px" }} />
      <div style={{ height: 10, background: "#1e3348", borderRadius: 4, width: "70%", margin: "0 auto" }} />
    </div>
  );
}

const BNP_LOGO = "https://jeygimupxuzalqnkeddf.supabase.co/storage/v1/object/public/images/election-frame-photo(1).png";
export default function App() {
  const [activeTab, setActiveTab] = useState("home");
  const [search, setSearch] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedGovt, setSelectedGovt] = useState(null);
  const [govtTab, setGovtTab] = useState("ministers");

  const [ministers, setMinisters] = useState([]);
  const [news, setNews] = useState([]);
  const [mps, setMps] = useState([]);
  const [projects, setProjects] = useState([]);
  const [governments, setGovernments] = useState([]);
  const [histMinisters, setHistMinisters] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
  if (!selectedGovt) return;

  async function fetchGovtMps() {
    const { data } = await supabase
      .from("mps")
      .select("*")
      .eq("government_id", selectedGovt.id)
      .order("id")
      .limit(500);
    if (data) setMps(prev => {
      const otherMps = prev.filter(m => m.government_id !== selectedGovt.id);
      return [...otherMps, ...data];
    });
  }

  fetchGovtMps();
}, [selectedGovt]);

useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const [m, n, mp, p, g, hm, a] = await Promise.all([
        supabase.from("ministers").select("*").order("id"),
        supabase.from("news").select("*").order("created_at", { ascending: false }).limit(50),
        supabase.from("mps").select("*").order("id").limit(5000),
        supabase.from("projects").select("*").order("id"),
        supabase.from("governments").select("*").order("id"),
        supabase.from("historical_ministers").select("*").order("id"),
        supabase.from("achievements").select("*").order("id"),
      ]);
      setMinisters(m.data || []);
      setNews(n.data || []);
      console.log("MPS DATA:", mp.data);
      setMps(mp.data || []);
      setProjects(p.data || []);
      setGovernments(g.data || []);
      setHistMinisters(hm.data || []);
      setAchievements(a.data || []);
      setLoading(false);
    }

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

    return () => { supabase.removeChannel(channel); };
  }, []);


  const filteredMinisters = ministers.filter(m =>
    m.name.includes(search) || m.ministry.includes(search)
  );
  const filteredMps = mps.filter(m =>
    m.government_id === 1 &&
    (m.name.includes(search) || (m.constituency && m.constituency.includes(search)) || (m.district && m.district.includes(search)))
  );

  const tabs = [
    { id: "home", label: "🏠 হোম" },
    { id: "news", label: "📰 সংবাদ" },
    { id: "ministers", label: "👥 মন্ত্রিসভা" },
    { id: "mps", label: "🏅 এমপি তালিকা" },
    { id: "projects", label: "🔨 প্রকল্প" },
  ];

  const govtTabs = [
    { id: "ministers", label: "👥 মন্ত্রিসভা" },
    { id: "mps", label: "🏅 এমপি তালিকা" },
    { id: "achievements", label: "🏆 সাফল্য" },
  ];

  const currentGovtMinisters = selectedGovt
    ? histMinisters.filter(m => Number(m.government_id) === Number(selectedGovt.id))
    : [];
  const currentGovtAchievements = selectedGovt
    ? achievements.filter(a => a.government_id === selectedGovt.id)
    : [];

  return (
    <div style={{ fontFamily: "sans-serif", background: "#0D1B2A", minHeight: "100vh", color: "#F5F0E8" }}>

      {/* Sidebar Overlay */}
      {sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)} style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(0,0,0,0.6)", zIndex: 200
        }} />
      )}

      {/* Sidebar */}
      <div style={{
        position: "fixed", top: 0, left: sidebarOpen ? 0 : -320,
        width: 300, height: "100vh", background: "#0a1520",
        borderRight: "2px solid #C9A84C", zIndex: 300,
        transition: "left 0.3s ease", overflowY: "auto"
      }}>
        <div style={{ background: "#006A4E", padding: "16px 20px", borderBottom: "2px solid #C9A84C" }}>
          <div style={{ fontSize: 14, fontWeight: "bold", color: "#fff" }}>🏛️ বিএনপি সরকার সমূহ</div>
          <div style={{ fontSize: 11, color: "#C9A84C", marginTop: 3 }}>ইতিহাস ও তথ্যভান্ডার</div>
        </div>

        <div style={{ padding: 12 }}>
          {governments.map((g, i) => (
            <div key={i} onClick={() => {
              setSelectedGovt(g);
              setSidebarOpen(false);
              setGovtTab("ministers");
              setSearch("");
            }} style={{
              background: selectedGovt?.id === g.id ? "rgba(201,168,76,0.2)" : "#112233",
              border: `1px solid ${selectedGovt?.id === g.id ? "#C9A84C" : "#1e3348"}`,
              borderLeft: `4px solid ${g.is_current ? "#006A4E" : "#C9A84C"}`,
              borderRadius: 8, padding: 14, marginBottom: 10, cursor: "pointer"
            }}>
              <div style={{ fontSize: 14, fontWeight: "bold", color: "#e8f0f5" }}>
                {g.is_current && (
                  <span style={{ background: "#006A4E", color: "#fff", fontSize: 10, padding: "2px 6px", borderRadius: 4, marginRight: 6 }}>
                    বর্তমান
                  </span>
                )}
                {g.prime_minister}
              </div>
              <div style={{ fontSize: 12, color: "#C9A84C", marginTop: 4 }}>{g.name}</div>
              <div style={{ fontSize: 11, color: "#5a7a8a", marginTop: 3 }}>📅 {g.period}</div>
            </div>
          ))}

          <div onClick={() => { setSelectedGovt(null); setSidebarOpen(false); setSearch(""); }}
            style={{
              background: !selectedGovt ? "rgba(0,106,78,0.2)" : "transparent",
              border: `1px solid ${!selectedGovt ? "#006A4E" : "#1e3348"}`,
              borderRadius: 8, padding: 12, marginTop: 8,
              cursor: "pointer", textAlign: "center",
              fontSize: 13, color: "#4ecba0"
            }}>
            🏠 মূল ড্যাশবোর্ডে ফিরুন
          </div>
        </div>
      </div>

      {/* হেডার */}
      <div style={{
        background: "#006A4E", borderBottom: "3px solid #C9A84C",
        padding: "12px 20px", display: "flex", alignItems: "center",
        gap: 16, position: "sticky", top: 0, zIndex: 100
      }}>
        {/* থ্রি লাইন */}
        <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{
          background: "transparent", border: "none", cursor: "pointer",
          padding: 4, display: "flex", flexDirection: "column", gap: 5, flexShrink: 0
        }}>
          <span style={{ display: "block", width: 24, height: 2, background: "#fff", borderRadius: 2 }} />
          <span style={{ display: "block", width: 24, height: 2, background: "#fff", borderRadius: 2 }} />
          <span style={{ display: "block", width: 24, height: 2, background: "#fff", borderRadius: 2 }} />
        </button>

        {/* শিরোনাম */}
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 16, fontWeight: "bold" }}>
            {selectedGovt ? `🏛️ ${selectedGovt.name}` : "🇧🇩 গণপ্রজাতন্ত্রী বাংলাদেশ সরকার"}
          </div>
          <div style={{ fontSize: 11, color: "#C9A84C", marginTop: 3 }}>
            {selectedGovt ? `📅 ${selectedGovt.period}` : "ত্রয়োদশ জাতীয় সংসদ · বিএনপি সরকার ২০২৬"}
          </div>
        </div>

        {/* লোগো ও ছবি */}
        {!selectedGovt && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
            <img src={BNP_LOGO} alt="বিএনপি লোগো"
              style={{ width: 36, height: 36, borderRadius: 4, objectFit: "contain", background: "#fff", padding: 2 }}
              onError={e => e.target.style.display = "none"}  
            />
          </div>
        )}
      </div>

      {/* ট্যাব মেনু */}
      <div style={{ display: "flex", background: "#0a1520", borderBottom: "2px solid #1a2e40", overflowX: "auto" }}>
        {(selectedGovt ? govtTabs : tabs).map(tab => (
          <button key={tab.id} onClick={() => {
            selectedGovt ? setGovtTab(tab.id) : setActiveTab(tab.id);
            setSearch("");
          }} style={{
            background: (selectedGovt ? govtTab : activeTab) === tab.id ? "rgba(201,168,76,0.15)" : "transparent",
            border: "none",
            borderBottom: (selectedGovt ? govtTab : activeTab) === tab.id ? "3px solid #C9A84C" : "3px solid transparent",
            color: (selectedGovt ? govtTab : activeTab) === tab.id ? "#C9A84C" : "#6a8a9a",
            padding: "12px 18px", cursor: "pointer",
            fontSize: 13, whiteSpace: "nowrap", fontFamily: "sans-serif"
          }}>
            {tab.label}
          </button>
        ))}
      </div>

      {loading && (
  {!loading && (
  <div className="fade-in" style={{ padding: 20, maxWidth: 700, margin: "0 auto" }}>
    {/* স্ট্যাট কার্ড স্কেলেটন */}
    <div style={{ height: 80, background: "#112233", border: "1px solid #1e3348", borderRadius: 12, marginBottom: 20, position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.04), transparent)", animation: "shimmer 1.5s infinite" }} />
    </div>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12, marginBottom: 20 }}>
      <SkeletonStat /><SkeletonStat /><SkeletonStat /><SkeletonStat />
    </div>
    <SkeletonCard />
    <SkeletonCard />
    <SkeletonCard />
  </div>
)}

      {!loading && (
        <div style={{ padding: 20, maxWidth: 700, margin: "0 auto" }}>

          {/* পূর্ববর্তী সরকার ভিউ */}
          {selectedGovt && (
            <div>
              <div style={{ background: "#112233", border: "1px solid #1e3348", borderLeft: "4px solid #C9A84C", borderRadius: 8, padding: 16, marginBottom: 20 }}>
                <div style={{ fontSize: 13, color: "#a0c0d0", lineHeight: 1.7 }}>{selectedGovt.description}</div>
              </div>

              {govtTab === "ministers" && (
                <div>
                  <h2 style={{ color: "#C9A84C", borderLeft: "4px solid #006A4E", paddingLeft: 10, marginBottom: 16, fontSize: 16 }}>👥 মন্ত্রিসভা</h2>
                  {currentGovtMinisters.length === 0 ? (
                    <div style={{ color: "#5a7a8a", textAlign: "center", padding: 40 }}>
                      এই সরকারের মন্ত্রিসভার তথ্য এখনো যোগ করা হয়নি।
                    </div>
                  ) : currentGovtMinisters.map((m, i) => (
                    <div key={i} style={{ background: "#112233", border: "1px solid #1e3348", borderRadius: 10, padding: 16, marginBottom: 10, display: "flex", gap: 14, alignItems: "flex-start" }}>
                      <div style={{ width: 48, height: 48, borderRadius: "50%", background: "#006A4E", border: "2px solid #C9A84C", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>
                        {m.icon || "👤"}
                      </div>
                      <div>
                        <div style={{ fontSize: 15, fontWeight: "bold", color: "#e8f0f5" }}>{m.name}</div>
                        <div style={{ fontSize: 12, color: "#C9A84C", marginTop: 2 }}>{m.role}</div>
                        <div style={{ fontSize: 12, color: "#6a8a9a", marginTop: 3 }}>📁 {m.ministry}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {govtTab === "mps" && (
                <div>
                  <h2 style={{ color: "#C9A84C", borderLeft: "4px solid #006A4E", paddingLeft: 10, marginBottom: 16, fontSize: 16 }}>🏅 সংসদ সদস্য তালিকা</h2>
                  <input placeholder="নাম, আসন বা জেলা দিয়ে খুঁজুন..." value={search}
                    onChange={e => setSearch(e.target.value)}
                    style={{ width: "100%", background: "#112233", border: "1px solid #1e3348", borderRadius: 8, padding: "10px 14px", color: "#F5F0E8", fontSize: 14, marginBottom: 16, boxSizing: "border-box", outline: "none" }}
                  />
                  {mps.filter(m => Number(m.government_id) === Number(selectedGovt.id) &&
                    (m.name.includes(search) || (m.constituency && m.constituency.includes(search)) || (m.district && m.district.includes(search)))
                  ).length === 0 ? (
                    <div style={{ color: "#5a7a8a", textAlign: "center", padding: 40 }}>
                      এই সরকারের এমপি তালিকা এখনো যোগ করা হয়নি।
                    </div>
                  ) : mps.filter(m => Number(m.government_id) === Number(selectedGovt.id) &&
                    (m.name.includes(search) || (m.constituency && m.constituency.includes(search)) || (m.district && m.district.includes(search)))
                  ).map((m, i) => (
                    <div key={i} style={{ background: "#112233", border: "1px solid #1e3348", borderRadius: 10, padding: 16, marginBottom: 10 }}>
                      <div style={{ fontSize: 15, fontWeight: "bold", color: "#e8f0f5" }}>{m.name}</div>
                      <div style={{ fontSize: 12, color: "#C9A84C", marginTop: 4 }}>🏅 আসন: {m.constituency} · {m.district}</div>
                      <div style={{ fontSize: 12, color: "#6a8a9a", marginTop: 3 }}>🌾 {m.party}</div>
                    </div>
                  ))}
                </div>
              )}

              {govtTab === "achievements" && (
                <div>
                  <h2 style={{ color: "#C9A84C", borderLeft: "4px solid #006A4E", paddingLeft: 10, marginBottom: 16, fontSize: 16 }}>🏆 উল্লেখযোগ্য সাফল্য</h2>
                  {currentGovtAchievements.length === 0 ? (
                    <div style={{ color: "#5a7a8a", textAlign: "center", padding: 40 }}>
                      এই সরকারের সাফল্যের তথ্য এখনো যোগ করা হয়নি।
                    </div>
                  ) : currentGovtAchievements.map((a, i) => (
                    <div key={i} style={{ background: "#112233", border: "1px solid #1e3348", borderLeft: "4px solid #C9A84C", borderRadius: 8, padding: 16, marginBottom: 12 }}>
                      <div style={{ fontSize: 11, color: "#C9A84C", fontWeight: "bold", marginBottom: 6 }}>🏆 {a.category}</div>
                      <div style={{ fontSize: 15, fontWeight: "bold", marginBottom: 6 }}>{a.title}</div>
                      <div style={{ fontSize: 13, color: "#a0c0d0", lineHeight: 1.6 }}>{a.description}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* মূল ড্যাশবোর্ড ভিউ */}
          {!selectedGovt && (
            <div>
              {/* হোম ড্যাশবোর্ড */}
{activeTab === "home" && (
  <div>
    {/* স্বাগত বার্তা */}
    <div style={{
      background: "linear-gradient(135deg, #006A4E 0%, #004d38 100%)",
      border: "1px solid #C9A84C",
      borderRadius: 12, padding: 20, marginBottom: 20, textAlign: "center"
    }}>
      <div style={{ fontSize: 22, fontWeight: "bold", marginBottom: 6 }}>
        🇧🇩 স্বাগতম
      </div>
      <div style={{ fontSize: 13, color: "#C9A84C" }}>
        গণপ্রজাতন্ত্রী বাংলাদেশ সরকার — ত্রয়োদশ জাতীয় সংসদ
      </div>
    </div>

    {/* পরিসংখ্যান কার্ড */}
    <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12, marginBottom: 20 }}>
      {[
        { label: "মোট মন্ত্রী", value: ministers.length, icon: "👥", color: "#006A4E", tab: "ministers" },
        { label: "সংসদ সদস্য", value: mps.filter(m => m.government_id === 1).length, icon: "🏅", color: "#C9A84C", tab: "mps" },
        { label: "উন্নয়ন প্রকল্প", value: projects.length, icon: "🔨", color: "#3B8BD4", tab: "projects" },
        { label: "সর্বশেষ সংবাদ", value: news.length, icon: "📰", color: "#9F5DCF", tab: "news" },
      ].map((stat, i) => (
        <div key={i} onClick={() => setActiveTab(stat.tab)} style={{
          background: "#112233",
          border: `1px solid ${stat.color}`,
          borderRadius: 10, padding: 16, cursor: "pointer",
          textAlign: "center", transition: "transform 0.2s"
        }}>
          <div style={{ fontSize: 28 }}>{stat.icon}</div>
          <div style={{ fontSize: 26, fontWeight: "bold", color: stat.color, margin: "6px 0" }}>
            {stat.value}
          </div>
          <div style={{ fontSize: 12, color: "#8aaabb" }}>{stat.label}</div>
        </div>
      ))}
    </div>

    {/* চলমান প্রকল্প অগ্রগতি */}
    <h2 style={{ color: "#C9A84C", borderLeft: "4px solid #006A4E", paddingLeft: 10, marginBottom: 14, fontSize: 15 }}>
      🔨 চলমান প্রকল্প
    </h2>
    {projects.filter(p => p.status === "চলমান").slice(0, 3).map((p, i) => (
      <div key={i} style={{ background: "#112233", border: "1px solid #1e3348", borderRadius: 8, padding: 14, marginBottom: 10 }}>
        <div style={{ fontSize: 13, fontWeight: "bold", marginBottom: 6 }}>{p.title}</div>
        <div style={{ height: 6, background: "#1e3348", borderRadius: 3, overflow: "hidden", marginBottom: 6 }}>
          <div style={{ height: "100%", width: `${p.progress}%`, background: "linear-gradient(90deg, #006A4E, #C9A84C)", borderRadius: 3 }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#6a8a9a" }}>
          <span>💰 {p.budget}</span>
          <span style={{ color: "#4ecba0" }}>{p.progress}% সম্পন্ন</span>
        </div>
      </div>
    ))}

    {/* সর্বশেষ ৩টি সংবাদ */}
    <h2 style={{ color: "#C9A84C", borderLeft: "4px solid #006A4E", paddingLeft: 10, margin: "20px 0 14px", fontSize: 15 }}>
      📰 সর্বশেষ সংবাদ
    </h2>
    {news.slice(0, 3).map((n, i) => (
      <div key={i} style={{
        background: "#112233", border: "1px solid #1e3348",
        borderLeft: "4px solid #006A4E", borderRadius: 8,
        padding: 14, marginBottom: 10
      }}>
        <div style={{ fontSize: 11, color: "#C9A84C", fontWeight: "bold", marginBottom: 4 }}>
          {n.source} · {n.category}
        </div>
        <div style={{ fontSize: 13, lineHeight: 1.6, marginBottom: 4 }}>{n.title}</div>
        <div style={{ fontSize: 11, color: "#5a7a8a" }}>🕐 {formatBanglaDate(n.time)}</div>
      </div>
    ))}

    {/* সব সংবাদ দেখুন বাটন */}
    <div onClick={() => setActiveTab("news")} style={{
      background: "transparent", border: "1px solid #006A4E",
      borderRadius: 8, padding: "10px 16px", textAlign: "center",
      cursor: "pointer", color: "#4ecba0", fontSize: 13, marginTop: 4
    }}>
      সব সংবাদ দেখুন →
    </div>

    {/* সরকার তথ্য */}
    <h2 style={{ color: "#C9A84C", borderLeft: "4px solid #006A4E", paddingLeft: 10, margin: "20px 0 14px", fontSize: 15 }}>
      🏛️ বিএনপি সরকারসমূহ
    </h2>
    {governments.map((g, i) => (
      <div key={i} onClick={() => { setSelectedGovt(g); setGovtTab("ministers"); }} style={{
        background: "#112233", border: `1px solid ${g.is_current ? "#006A4E" : "#1e3348"}`,
        borderLeft: `4px solid ${g.is_current ? "#006A4E" : "#C9A84C"}`,
        borderRadius: 8, padding: 14, marginBottom: 10, cursor: "pointer",
        display: "flex", justifyContent: "space-between", alignItems: "center"
      }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: "bold", color: "#e8f0f5" }}>
            {g.is_current && <span style={{ background: "#006A4E", color: "#fff", fontSize: 10, padding: "2px 6px", borderRadius: 4, marginRight: 6 }}>বর্তমান</span>}
            {g.prime_minister}
          </div>
          <div style={{ fontSize: 12, color: "#C9A84C", marginTop: 3 }}>{g.name}</div>
          <div style={{ fontSize: 11, color: "#5a7a8a", marginTop: 2 }}>📅 {g.period}</div>
        </div>
        <div style={{ color: "#4a6a7a", fontSize: 18 }}>›</div>
      </div>
    ))}
  </div>
)}
              {activeTab === "news" && (
                <div>
                  <h2 style={{ color: "#C9A84C", borderLeft: "4px solid #006A4E", paddingLeft: 10, marginBottom: 16, fontSize: 16 }}>সর্বশেষ সংবাদ</h2>
                  {news.length === 0 && <div style={{ color: "#5a7a8a", textAlign: "center", padding: 40 }}>কোনো সংবাদ নেই</div>}
                  {news.map((n, i) => (
                    <div key={i} style={{ background: "#112233", border: "1px solid #1e3348", borderLeft: "4px solid #006A4E", borderRadius: 8, padding: 16, marginBottom: 12 }}>
                      <div style={{ fontSize: 11, color: "#C9A84C", fontWeight: "bold", marginBottom: 6 }}>{n.source} · {n.category}</div>
                      <div style={{ fontSize: 14, lineHeight: 1.6, marginBottom: 6 }}>{n.title}</div>
                      <div style={{ fontSize: 11, color: "#5a7a8a" }}>🕐 {formatBanglaDate(n.time)}</div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === "ministers" && (
                <div>
                  <h2 style={{ color: "#C9A84C", borderLeft: "4px solid #006A4E", paddingLeft: 10, marginBottom: 16, fontSize: 16 }}>মন্ত্রিসভা</h2>
                  <input placeholder="মন্ত্রী বা মন্ত্রণালয় খুঁজুন..." value={search}
                    onChange={e => setSearch(e.target.value)}
                    style={{ width: "100%", background: "#112233", border: "1px solid #1e3348", borderRadius: 8, padding: "10px 14px", color: "#F5F0E8", fontSize: 14, marginBottom: 16, boxSizing: "border-box", outline: "none" }}
                  />
                  {filteredMinisters.map((m, i) => (
                    <div key={i} style={{ background: "#112233", border: "1px solid #1e3348", borderRadius: 10, padding: 16, marginBottom: 10, display: "flex", gap: 14, alignItems: "flex-start" }}>
                      <div style={{ width: 48, height: 48, borderRadius: "50%", background: "#006A4E", border: "2px solid #C9A84C", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>
                        {m.icon}
                      </div>
                      <div>
                        <div style={{ fontSize: 15, fontWeight: "bold", color: "#e8f0f5" }}>{m.name}</div>
                        <div style={{ fontSize: 12, color: "#C9A84C", marginTop: 2 }}>{m.role}</div>
                        <div style={{ fontSize: 12, color: "#6a8a9a", marginTop: 3 }}>📁 {m.ministry}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === "mps" && (
                <div>
                  <h2 style={{ color: "#C9A84C", borderLeft: "4px solid #006A4E", paddingLeft: 10, marginBottom: 16, fontSize: 16 }}>সংসদ সদস্য তালিকা</h2>
                  <input placeholder="নাম, আসন বা জেলা দিয়ে খুঁজুন..." value={search}
                    onChange={e => setSearch(e.target.value)}
                    style={{ width: "100%", background: "#112233", border: "1px solid #1e3348", borderRadius: 8, padding: "10px 14px", color: "#F5F0E8", fontSize: 14, marginBottom: 16, boxSizing: "border-box", outline: "none" }}
                  />
                  {filteredMps.map((m, i) => (
                    <div key={i} style={{ background: "#112233", border: "1px solid #1e3348", borderRadius: 10, padding: 16, marginBottom: 10 }}>
                      <div style={{ fontSize: 15, fontWeight: "bold", color: "#e8f0f5" }}>{m.name}</div>
                      <div style={{ fontSize: 12, color: "#C9A84C", marginTop: 4 }}>🏅 আসন: {m.constituency} · {m.district}</div>
                      <div style={{ fontSize: 12, color: "#6a8a9a", marginTop: 3 }}>🌾 {m.party}</div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === "projects" && (
                <div>
                  <h2 style={{ color: "#C9A84C", borderLeft: "4px solid #006A4E", paddingLeft: 10, marginBottom: 16, fontSize: 16 }}>উন্নয়ন প্রকল্প</h2>
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
      )}
    </div>
  );
}