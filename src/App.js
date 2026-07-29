import { useState, useEffect, useCallback } from "react";
import { supabase } from "./supabase";
import AdminPanel from "./AdminPanel";
import { translations } from "./translations";
import FeedbackSection from "./FeedbackSection";
import AuthModal from "./AuthModal";
import CommentsSection from "./CommentsSection";
import { registerServiceWorker, requestNotificationPermission, showLocalNotification } from "./notifications";

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
  .card-hover { transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease !important; }
  .card-hover:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.3); border-color: #C9A84C !important; cursor: pointer; }
  .btn-hover { transition: all 0.2s ease !important; }
  .btn-hover:hover { opacity: 0.85; transform: scale(0.98); }
  .btn-hover:active { transform: scale(0.95); }
  button:focus-visible, a:focus-visible, input:focus-visible, textarea:focus-visible, select:focus-visible { outline: 2px solid #C9A84C !important; outline-offset: 2px !important; }
  @media (max-width: 480px) { .grid-2col { grid-template-columns: 1fr !important; } .hide-mobile { display: none !important; } }
`;

const THEMES = {
  dark: { bg: "#0D1B2A", card: "#112233", border: "#1e3348", text: "#F5F0E8", textMuted: "#6a8a9a", textSecondary: "#a0c0d0", navBg: "#0a1520", navBorder: "#1a2e40", sidebarBg: "#0a1520" },
  light: { bg: "#F0F4F8", card: "#FFFFFF", border: "#D0DCE8", text: "#1A2A3A", textMuted: "#5A7A8A", textSecondary: "#3A5A6A", navBg: "#E0EAF4", navBorder: "#C0D4E4", sidebarBg: "#EAF0F8" }
};

const BNP_LOGO = "https://jeygimupxuzalqnkeddf.supabase.co/storage/v1/object/public/images/bnp-logo.png";

function formatBanglaDate(dateStr) {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString("bn-BD", { year: "numeric", month: "long", day: "numeric", timeZone: "Asia/Dhaka" });
  } catch { return dateStr; }
}

function SkeletonCard() {
  return (
    <div style={{ background: "#112233", border: "1px solid #1e3348", borderRadius: 10, padding: 16, marginBottom: 12, overflow: "hidden", position: "relative" }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.04), transparent)", animation: "shimmer 1.5s infinite" }} />
      <div style={{ height: 12, background: "#1e3348", borderRadius: 4, width: "40%", marginBottom: 10 }} />
      <div style={{ height: 12, background: "#1e3348", borderRadius: 4, width: "90%", marginBottom: 8 }} />
      <div style={{ height: 12, background: "#1e3348", borderRadius: 4, width: "60%" }} />
    </div>
  );
}

function SkeletonStat() {
  return (
    <div style={{ background: "#112233", border: "1px solid #1e3348", borderRadius: 10, padding: 16, textAlign: "center", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.04), transparent)", animation: "shimmer 1.5s infinite" }} />
      <div style={{ height: 28, width: 28, background: "#1e3348", borderRadius: "50%", margin: "0 auto 8px" }} />
      <div style={{ height: 20, background: "#1e3348", borderRadius: 4, width: "50%", margin: "0 auto 8px" }} />
      <div style={{ height: 10, background: "#1e3348", borderRadius: 4, width: "70%", margin: "0 auto" }} />
    </div>
  );
}

function BarChart({ data, title }) {
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div style={{ marginBottom: 20 }}>
      <h3 style={{ fontSize: 13, color: "#C9A84C", marginBottom: 12, paddingLeft: 4 }}>{title}</h3>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 120, padding: "0 4px" }}>
        {data.map((d, i) => (
          <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
            <div style={{ fontSize: 10, color: "#C9A84C", fontWeight: "bold" }}>{d.value}</div>
            <div style={{ width: "100%", borderRadius: "4px 4px 0 0", height: `${(d.value / max) * 80}px`, background: `linear-gradient(180deg, ${d.color || "#006A4E"}, ${d.color ? d.color + "88" : "#004d38"})`, minHeight: 4, transition: "height 0.6s ease" }} />
            <div style={{ fontSize: 9, color: "#8aaabb", textAlign: "center", lineHeight: 1.3, width: "100%" }}>{d.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function DonutChart({ value, max, label, color }) {
  const pct = Math.min((value / max) * 100, 100);
  const r = 36;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
      <div style={{ position: "relative", width: 88, height: 88 }}>
        <svg width="88" height="88" viewBox="0 0 88 88">
          <circle cx="44" cy="44" r={r} fill="none" stroke="#1e3348" strokeWidth="10" />
          <circle cx="44" cy="44" r={r} fill="none" stroke={color || "#006A4E"} strokeWidth="10" strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" transform="rotate(-90 44 44)" style={{ transition: "stroke-dasharray 0.8s ease" }} />
        </svg>
        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", textAlign: "center" }}>
          <div style={{ fontSize: 14, fontWeight: "bold", color: color || "#006A4E" }}>{Math.round(pct)}%</div>
        </div>
      </div>
      <div style={{ fontSize: 11, color: "#8aaabb", textAlign: "center" }}>{label}</div>
      <div style={{ fontSize: 12, color: "#C9A84C", fontWeight: "bold" }}>{value}/{max}</div>
    </div>
  );
}

function HorizontalBar({ label, value, max, color }) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
        <span style={{ color: "#e8f0f5" }}>{label}</span>
        <span style={{ color: color || "#C9A84C", fontWeight: "bold" }}>{value}%</span>
      </div>
      <div style={{ height: 8, background: "#1e3348", borderRadius: 4, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: `linear-gradient(90deg, ${color || "#006A4E"}, #C9A84C)`, borderRadius: 4, transition: "width 0.8s ease" }} />
      </div>
    </div>
  );
}

function PersonModal({ person, type, onClose, T, isDark }) {
  if (!person) return null;
  return (
    <div onClick={onClose} style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.75)", zIndex: 500, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: T.card, border: "2px solid #C9A84C", borderRadius: 16, width: "100%", maxWidth: 480, maxHeight: "85vh", overflowY: "auto" }}>
        <div style={{ background: "linear-gradient(135deg, #006A4E, #004d38)", padding: "20px", borderRadius: "14px 14px 0 0", position: "relative" }}>
          <button onClick={onClose} style={{ position: "absolute", top: 12, right: 12, background: "rgba(255,255,255,0.15)", border: "none", borderRadius: "50%", width: 30, height: 30, cursor: "pointer", color: "#fff", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
          <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
            <div style={{ width: 64, height: 64, borderRadius: "50%", border: "3px solid #C9A84C", overflow: "hidden", background: "#006A4E", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, flexShrink: 0 }}>
              {person.photo_url ? <img src={person.photo_url} alt={person.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={e => e.target.style.display = "none"} /> : type === "minister" ? (person.icon || "👤") : "🏅"}
            </div>
            <div>
              <div style={{ fontSize: 18, fontWeight: "bold", color: "#fff", marginBottom: 4 }}>{person.name}</div>
              <div style={{ fontSize: 12, color: "#C9A84C" }}>{type === "minister" ? person.role : person.constituency}</div>
              {type === "minister" && person.ministry && <div style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", marginTop: 2 }}>📁 {person.ministry}</div>}
              {type === "mp" && person.district && <div style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", marginTop: 2 }}>📍 {person.district}</div>}
            </div>
          </div>
        </div>
        <div style={{ padding: 20 }}>
          <div style={{ background: isDark ? "rgba(0,106,78,0.15)" : "rgba(0,106,78,0.08)", border: "1px solid rgba(0,106,78,0.3)", borderRadius: 8, padding: "8px 14px", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
            <span>🌾</span>
            <span style={{ fontSize: 13, color: "#4ecba0" }}>{person.party || "বাংলাদেশ জাতীয়তাবাদী দল"}</span>
          </div>
          {person.bio ? (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, color: "#C9A84C", fontWeight: "bold", marginBottom: 8 }}>📋 সংক্ষিপ্ত পরিচিতি</div>
              <div style={{ fontSize: 13, color: T.textSecondary, lineHeight: 1.8, background: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)", borderRadius: 8, padding: 12 }}>{person.bio}</div>
            </div>
          ) : (
            <div style={{ background: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)", borderRadius: 8, padding: 16, marginBottom: 16, textAlign: "center" }}>
              <div style={{ fontSize: 24, marginBottom: 6 }}>📝</div>
              <div style={{ fontSize: 13, color: T.textMuted }}>বিস্তারিত তথ্য শীঘ্রই যোগ করা হবে</div>
            </div>
          )}
          {(person.phone || person.email || person.constituency) && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, color: "#C9A84C", fontWeight: "bold", marginBottom: 8 }}>📞 যোগাযোগ</div>
              <div style={{ background: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)", borderRadius: 8, padding: 12 }}>
                {person.constituency && <div style={{ display: "flex", gap: 8, marginBottom: 8 }}><span>📍</span><div><div style={{ fontSize: 11, color: T.textMuted }}>ঠিকানা</div><div style={{ fontSize: 13, color: T.text }}>{person.constituency}</div></div></div>}
                {person.phone && <div style={{ display: "flex", gap: 8, marginBottom: 8 }}><span>📱</span><div><div style={{ fontSize: 11, color: T.textMuted }}>ফোন</div><a href={`tel:${person.phone}`} style={{ fontSize: 13, color: "#4ecba0", textDecoration: "none" }}>{person.phone}</a></div></div>}
                {person.email && <div style={{ display: "flex", gap: 8 }}><span>📧</span><div><div style={{ fontSize: 11, color: T.textMuted }}>ইমেইল</div><a href={`mailto:${person.email}`} style={{ fontSize: 13, color: "#4ecba0", textDecoration: "none" }}>{person.email}</a></div></div>}
              </div>
            </div>
          )}
          <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: 14 }}>
            <div style={{ fontSize: 12, color: T.textMuted, marginBottom: 8 }}>শেয়ার করুন</div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}&quote=${encodeURIComponent(person.name)}`} target="_blank" rel="noreferrer" style={{ background: "#1877F2", color: "#fff", borderRadius: 6, padding: "6px 12px", fontSize: 12, textDecoration: "none" }}>Facebook</a>
              <a href={`https://wa.me/?text=${encodeURIComponent(person.name + "\n" + window.location.href)}`} target="_blank" rel="noreferrer" style={{ background: "#25D366", color: "#fff", borderRadius: 6, padding: "6px 12px", fontSize: 12, textDecoration: "none" }}>WhatsApp</a>
              <button onClick={() => { navigator.clipboard.writeText(person.name + "\n" + window.location.href); alert("কপি হয়েছে!"); }} style={{ background: isDark ? "#1e3348" : "#D0DCE8", color: isDark ? "#F5F0E8" : "#1A2A3A", border: "none", borderRadius: 6, padding: "6px 12px", fontSize: 12, cursor: "pointer" }}>🔗 কপি</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function NewsModal({ news, onClose, T, isDark, currentUser, onLoginRequest }) {
  if (!news) return null;
  return (
    <div onClick={onClose} style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.75)", zIndex: 500, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: T.card, border: "2px solid #C9A84C", borderRadius: 16, width: "100%", maxWidth: 560, maxHeight: "88vh", overflowY: "auto" }}>
        <div style={{ background: "linear-gradient(135deg, #006A4E, #004d38)", padding: "16px 20px", borderRadius: "14px 14px 0 0", position: "sticky", top: 0, zIndex: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 8, flexWrap: "wrap" }}>
                <span style={{ fontSize: 11, color: "#C9A84C", fontWeight: "bold" }}>{news.source}</span>
                <span style={{ fontSize: 10, background: "rgba(201,168,76,0.2)", color: "#C9A84C", padding: "2px 8px", borderRadius: 10 }}>{news.category}</span>
              </div>
              <div style={{ fontSize: 15, fontWeight: "bold", color: "#fff", lineHeight: 1.5 }}>{news.title}</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", marginTop: 6 }}>🕐 {formatBanglaDate(news.time)}</div>
            </div>
            <button onClick={onClose} style={{ background: "rgba(255,255,255,0.15)", border: "none", borderRadius: "50%", width: 30, height: 30, cursor: "pointer", color: "#fff", fontSize: 16, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
          </div>
        </div>
        <div style={{ padding: 20 }}>
          {news.content && news.content !== "সম্পূর্ণ সংবাদ শীঘ্রই যোগ করা হবে।"
            ? <div style={{ fontSize: 14, color: T.text, lineHeight: 1.9, whiteSpace: "pre-wrap" }}>{news.content}</div>
            : (
              <div style={{ textAlign: "center", padding: "20px 0" }}>
                <div style={{ fontSize: 32, marginBottom: 10 }}>📰</div>
                <div style={{ fontSize: 14, color: T.textMuted, marginBottom: 6 }}>সম্পূর্ণ সংবাদ এখনো যোগ করা হয়নি</div>
                {news.link && <a href={news.link} target="_blank" rel="noreferrer" style={{ display: "inline-block", background: "#006A4E", color: "#fff", borderRadius: 8, padding: "8px 20px", fontSize: 13, textDecoration: "none", marginTop: 8 }}>🔗 মূল সংবাদ পড়ুন</a>}
              </div>
            )
          }
          {news.link && (
            <div style={{ borderTop: `1px solid ${T.border}`, marginTop: 16, paddingTop: 14 }}>
              <a href={news.link} target="_blank" rel="noreferrer" style={{ display: "flex", alignItems: "center", gap: 8, color: "#4ecba0", fontSize: 13, textDecoration: "none" }}>🔗 মূল সংবাদ পড়ুন — {news.source}</a>
            </div>
          )}
          <div style={{ borderTop: `1px solid ${T.border}`, marginTop: 14, paddingTop: 14 }}>
            <div style={{ fontSize: 12, color: T.textMuted, marginBottom: 8 }}>শেয়ার করুন</div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.origin + "/#news-" + news.id)}&quote=${encodeURIComponent(news.title)}`} target="_blank" rel="noreferrer" style={{ background: "#1877F2", color: "#fff", borderRadius: 6, padding: "6px 12px", fontSize: 12, textDecoration: "none" }}>Facebook</a>
              <a href={`https://wa.me/?text=${encodeURIComponent(news.title + "\n" + window.location.origin + "/#news-" + news.id)}`} target="_blank" rel="noreferrer" style={{ background: "#25D366", color: "#fff", borderRadius: 6, padding: "6px 12px", fontSize: 12, textDecoration: "none" }}>WhatsApp</a>
              <button onClick={() => { navigator.clipboard.writeText(news.title + "\n" + window.location.origin + "/#news-" + news.id); alert("কপি হয়েছে!"); }} style={{ background: isDark ? "#1e3348" : "#D0DCE8", color: isDark ? "#F5F0E8" : "#1A2A3A", border: "none", borderRadius: 6, padding: "6px 12px", fontSize: 12, cursor: "pointer" }}>🔗 কপি</button>
            </div>
          </div>
          <CommentsSection newsId={news.id} user={currentUser} onLoginRequest={onLoginRequest} T={T} isDark={isDark} />
        </div>
      </div>
    </div>
  );
}

function LeaderModal({ leader, onClose, T, isDark }) {
  if (!leader) return null;
  return (
    <div onClick={onClose} style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.8)", zIndex: 500, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: T.card, border: "2px solid #C9A84C", borderRadius: 16, width: "100%", maxWidth: 520, maxHeight: "88vh", overflowY: "auto" }}>
        <div style={{ background: "linear-gradient(135deg, #006A4E, #004d38)", padding: "20px", borderRadius: "14px 14px 0 0", position: "sticky", top: 0, zIndex: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
              <div style={{ width: 56, height: 56, borderRadius: "50%", border: "3px solid #C9A84C", overflow: "hidden", background: "rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, flexShrink: 0 }}>
                {leader.photo_url ? <img src={leader.photo_url} alt={leader.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : "👤"}
              </div>
              <div>
                <div style={{ fontSize: 16, fontWeight: "bold", color: "#fff" }}>{leader.name}</div>
                <div style={{ fontSize: 11, color: "#C9A84C", marginTop: 3 }}>{leader.title}</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", marginTop: 2 }}>{leader.born}{leader.died ? " — " + leader.died : " — বর্তমান"}</div>
              </div>
            </div>
            <button onClick={onClose} style={{ background: "rgba(255,255,255,0.15)", border: "none", borderRadius: "50%", width: 30, height: 30, cursor: "pointer", color: "#fff", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
          </div>
        </div>
        <div style={{ padding: 20 }}>
          <div style={{ background: isDark ? "rgba(201,168,76,0.1)" : "rgba(201,168,76,0.08)", border: "1px solid rgba(201,168,76,0.3)", borderRadius: 8, padding: "8px 14px", marginBottom: 16 }}>
            <span style={{ fontSize: 13, color: "#C9A84C" }}>📅 শাসনকাল: {leader.period}</span>
          </div>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12, color: "#C9A84C", fontWeight: "bold", marginBottom: 8 }}>📖 জীবনী</div>
            <div style={{ fontSize: 13, color: T.textSecondary, lineHeight: 1.9 }}>{leader.full_bio || leader.short_bio}</div>
          </div>
          {leader.achievements && (
            <div>
              <div style={{ fontSize: 12, color: "#C9A84C", fontWeight: "bold", marginBottom: 10 }}>🏆 উল্লেখযোগ্য অবদান</div>
              {leader.achievements.map((ach, i) => (
                <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 8 }}>
                  <span style={{ color: "#4ecba0", fontSize: 14, flexShrink: 0 }}>✓</span>
                  <span style={{ fontSize: 13, color: T.text, lineHeight: 1.6 }}>{ach}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [activeTab, setActiveTab] = useState("home");
  const [search, setSearch] = useState("");
  const [mpDistrict, setMpDistrict] = useState("সব");
  const [mpDivision, setMpDivision] = useState("সব");
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
  const [decisions, setDecisions] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [leaders, setLeaders] = useState([]);
  const [activistPosts, setActivistPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDark, setIsDark] = useState(() => { try { return localStorage.getItem("theme") !== "light"; } catch { return true; } });
  const [lang, setLang] = useState(() => { try { return localStorage.getItem("lang") || "bn"; } catch { return "bn"; } });
  const [showSearch, setShowSearch] = useState(false);
  const [globalSearch, setGlobalSearch] = useState("");
  const [newsCategory, setNewsCategory] = useState("সব");
  const [newsPage, setNewsPage] = useState(1);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [notifEnabled, setNotifEnabled] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [personType, setPersonType] = useState(null);
  const [selectedNews, setSelectedNews] = useState(null);
  const [selectedLeader, setSelectedLeader] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showDecisions, setShowDecisions] = useState(false);
  const [showDocuments, setShowDocuments] = useState(false);

  const NEWS_PER_PAGE = 10;
  const T = isDark ? THEMES.dark : THEMES.light;
  const t = translations[lang];

  const toggleTheme = useCallback(() => {
    const newMode = !isDark;
    setIsDark(newMode);
    try { localStorage.setItem("theme", newMode ? "dark" : "light"); } catch {}
  }, [isDark]);

  const toggleLang = useCallback(() => {
    const newLang = lang === "bn" ? "en" : "bn";
    setLang(newLang);
    try { localStorage.setItem("lang", newLang); } catch {}
  }, [lang]);

  const handleLogin = useCallback(async () => {
    setLoginLoading(true);
    setLoginError("");
    const { error } = await supabase.auth.signInWithPassword({ email: loginEmail, password: loginPassword });
    if (error) setLoginError("ইমেইল বা পাসওয়ার্ড ভুল");
    else { setIsAdmin(true); setShowLogin(false); }
    setLoginLoading(false);
  }, [loginEmail, loginPassword]);

  const handleLogout = useCallback(async () => {
    await supabase.auth.signOut();
    setIsAdmin(false);
  }, []);

  const downloadPDF = useCallback((title, rows, columns) => {
    const printWindow = window.open("", "_blank");
    const tableRows = rows.map(row => "<tr>" + columns.map(col => "<td style='padding:8px;border:1px solid #ddd;font-size:12px'>" + (row[col.key] || "-") + "</td>").join("") + "</tr>").join("");
    const tableHeaders = columns.map(col => "<th style='padding:8px;border:1px solid #ddd;background:#006A4E;color:#fff;font-size:12px'>" + col.label + "</th>").join("");
    printWindow.document.write("<!DOCTYPE html><html><head><meta charset='UTF-8'><title>" + title + "</title><style>body{font-family:Arial,sans-serif;padding:20px}h1{color:#006A4E}table{width:100%;border-collapse:collapse}@media print{button{display:none}}</style></head><body><h1>" + title + "</h1><p>" + new Date().toLocaleDateString("bn-BD") + "</p><button onclick='window.print()' style='background:#006A4E;color:#fff;border:none;padding:8px 16px;cursor:pointer;margin-bottom:16px'>প্রিন্ট / PDF</button><table><thead><tr>" + tableHeaders + "</tr></thead><tbody>" + tableRows + "</tbody></table></body></html>");
    printWindow.document.close();
  }, []);

  function SocialShare({ title, newsId }) {
    const shareUrl = newsId ? window.location.origin + "/#news-" + newsId : window.location.href;
    const waText = encodeURIComponent(title + "\n" + shareUrl);
    const fbUrl = "https://www.facebook.com/sharer/sharer.php?u=" + encodeURIComponent(shareUrl) + "&quote=" + encodeURIComponent(title);
    return (
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
        <a href={fbUrl} target="_blank" rel="noreferrer"
        style={{ background: "#1877F2", color: "#fff", borderRadius: 6, padding: "5px 12px", fontSize: 12, textDecoration: "none", display: "flex", alignItems: "center", gap: 4 }}>
        📘 Facebook
        </a>
        <a href={"whatsapp://send?text=" + waText}
        style={{ background: "#25D366", color: "#fff", borderRadius: 6, padding: "5px 12px", fontSize: 12, textDecoration: "none", display: "flex", alignItems: "center", gap: 4 }}>
        💬 WhatsApp
        </a>
        <a href={"https://wa.me/?text=" + waText} target="_blank" rel="noreferrer"
        style={{ background: "#128C7E", color: "#fff", borderRadius: 6, padding: "5px 12px", fontSize: 12, textDecoration: "none", display: "flex", alignItems: "center", gap: 4 }}>
        🌐 WA Web
        </a>
        <button onClick={() => navigator.clipboard.writeText(title + "\n" + shareUrl).then(() => alert("কপি!"))}
        style={{ background: isDark ? "#1e3348" : "#D0DCE8", color: isDark ? "#F5F0E8" : "#1A2A3A", border: "none", borderRadius: 6, padding: "5px 12px", fontSize: 12, cursor: "pointer" }}>
        🔗 {t.copyLink}
        </button>
      </div>
    );
  }

  const searchResults = globalSearch.trim().length < 2 ? [] : [
    ...ministers.filter(m => m.name.includes(globalSearch) || m.ministry.includes(globalSearch)).slice(0, 3).map(m => ({ type: "মন্ত্রী", icon: "👥", title: m.name, subtitle: m.ministry, tab: "ministers" })),
    ...mps.filter(m => Number(m.government_id) === 1 && (
      m.name.includes(globalSearch) ||
      (m.constituency && m.constituency.includes(globalSearch)) ||
      (m.district && m.district.includes(globalSearch)) ||
      (m.party && m.party.includes(globalSearch))
    )).slice(0, 5).map(m => ({ type: "এমপি", icon: "🏅", title: m.name, subtitle: m.constituency + " · " + m.district, tab: "mps" })),
    ...news.filter(n => n.title.includes(globalSearch) || (n.source && n.source.includes(globalSearch))).slice(0, 3).map(n => ({ type: "সংবাদ", icon: "📰", title: n.title, subtitle: n.source, tab: "news" })),
    ...projects.filter(p => p.title.includes(globalSearch) || (p.ministry && p.ministry.includes(globalSearch))).slice(0, 3).map(p => ({ type: "প্রকল্প", icon: "🔨", title: p.title, subtitle: p.ministry, tab: "projects" })),
  ];

  const newsCategories = ["সব", "সরকারি", "অর্থনীতি", "সংসদ", "শিক্ষা", "আইনশৃঙ্খলা", "উন্নয়ন", "পররাষ্ট্র", "মন্ত্রিসভা"];
  const filteredNews = newsCategory === "সব" ? news : news.filter(n => n.category === newsCategory);
  const paginatedNews = filteredNews.slice(0, newsPage * NEWS_PER_PAGE);
  const hasMore = paginatedNews.length < filteredNews.length;
  const filteredMinisters = ministers.filter(m => m.name.includes(search) || m.ministry.includes(search));
  const divisions = ["সব", "ঢাকা", "চট্টগ্রাম", "রাজশাহী", "খুলনা", "বরিশাল", "সিলেট", "রংপুর", "ময়মনসিংহ"];

  const districtsByDivision = {
  "ঢাকা": ["ঢাকা", "গাজীপুর", "নারায়ণগঞ্জ", "মানিকগঞ্জ", "মুন্সীগঞ্জ", "নরসিংদী", "কিশোরগঞ্জ", "টাঙ্গাইল", "ফরিদপুর", "গোপালগঞ্জ", "মাদারীপুর", "রাজবাড়ী", "শরীয়তপুর"],
  "চট্টগ্রাম": ["চট্টগ্রাম", "কক্সবাজার", "কুমিল্লা", "ব্রাহ্মণবাড়িয়া", "চাঁদপুর", "ফেনী", "লক্ষ্মীপুর", "নোয়াখালী", "খাগড়াছড়ি", "রাঙামাটি", "বান্দরবান"],
  "রাজশাহী": ["রাজশাহী", "বগুড়া", "চাঁপাইনবাবগঞ্জ", "জয়পুরহাট", "নওগাঁ", "নাটোর", "পাবনা", "সিরাজগঞ্জ"],
  "খুলনা": ["খুলনা", "বাগেরহাট", "চুয়াডাঙ্গা", "যশোর", "ঝিনাইদহ", "কুষ্টিয়া", "মাগুরা", "মেহেরপুর", "নড়াইল", "সাতক্ষীরা"],
  "বরিশাল": ["বরিশাল", "ভোলা", "ঝালকাঠি", "পটুয়াখালী", "পিরোজপুর", "বরগুনা"],
  "সিলেট": ["সিলেট", "হবিগঞ্জ", "মৌলভীবাজার", "সুনামগঞ্জ"],
  "রংপুর": ["রংপুর", "দিনাজপুর", "গাইবান্ধা", "কুড়িগ্রাম", "লালমনিরহাট", "নীলফামারী", "পঞ্চগড়", "ঠাকুরগাঁও"],
  "ময়মনসিংহ": ["ময়মনসিংহ", "জামালপুর", "নেত্রকোণা", "শেরপুর"],
};

const districts = mpDivision === "সব"
  ? ["সব", ...new Set(mps.filter(m => Number(m.government_id) === 1).map(m => m.district).filter(Boolean).sort())]
  : ["সব", ...(districtsByDivision[mpDivision] || [])];

const filteredMps = mps.filter(m =>
  Number(m.government_id) === 1 &&
  (m.name.includes(search) || (m.constituency && m.constituency.includes(search)) || (m.district && m.district.includes(search))) &&
  (mpDistrict === "সব" || m.district === mpDistrict) &&
  (mpDivision === "সব" || (districtsByDivision[mpDivision] || []).includes(m.district))
);
  const currentGovtMinisters = selectedGovt ? histMinisters.filter(m => Number(m.government_id) === Number(selectedGovt.id)) : [];
  const currentGovtAchievements = selectedGovt ? achievements.filter(a => Number(a.government_id) === Number(selectedGovt.id)) : [];

  const tabs = [
    { id: "home", label: t.home },
    { id: "news", label: t.news },
    { id: "ministers", label: t.ministers },
    { id: "mps", label: t.mps },
    { id: "projects", label: t.projects },
    { id: "activists", label: t.activists },
    { id: "history", label: t.history },
    { id: "feedback", label: t.feedback },
  ];

  const govtTabs = [
    { id: "ministers", label: t.ministers },
    { id: "mps", label: t.mps },
    { id: "achievements", label: t.achievements },
  ];  

  useEffect(() => {
    registerServiceWorker();
    if ("Notification" in window) setNotifEnabled(Notification.permission === "granted");
  }, []);

  useEffect(() => {
    const hash = window.location.hash;
    if (hash === "#admin-secret-2026") { setShowLogin(true); window.location.hash = ""; }
  }, []);

  useEffect(() => {
    function handleHash() {
      const hash = window.location.hash;
      if (hash.startsWith("#news-")) {
        const newsId = Number(hash.replace("#news-", ""));
        setActiveTab("news"); setSelectedGovt(null);
        setTimeout(() => { const el = document.getElementById("news-" + newsId); if (el) el.scrollIntoView({ behavior: "smooth", block: "center" }); }, 800);
      }
    }
    handleHash();
    window.addEventListener("hashchange", handleHash);
    return () => window.removeEventListener("hashchange", handleHash);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setCurrentUser(session?.user || null));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => setCurrentUser(session?.user || null));
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!selectedGovt) return;
    async function fetchGovtMps() {
      const { data } = await supabase.from("mps").select("*").eq("government_id", selectedGovt.id).order("id").limit(500);
      if (data) setMps(prev => [...prev.filter(m => m.government_id !== selectedGovt.id), ...data]);
    }
    fetchGovtMps();
  }, [selectedGovt]);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const [m, n, mp, p, g, hm, a, dec, doc, ld, ap] = await Promise.all([
        supabase.from("ministers").select("*").order("id"),
        supabase.from("news").select("*").order("created_at", { ascending: false }).limit(50),
        supabase.from("mps").select("*").order("id").limit(5000),
        supabase.from("projects").select("*").order("id"),
        supabase.from("governments").select("*").order("id"),
        supabase.from("historical_ministers").select("*").order("id"),
        supabase.from("achievements").select("*").order("id"),
        supabase.from("decisions").select("*").order("created_at", { ascending: false }),
        supabase.from("documents").select("*").order("created_at", { ascending: false }),
        supabase.from("leaders").select("*").order("sort_order"),
        supabase.from("activist_posts").select("*").eq("status", "approved").order("created_at", { ascending: false }).limit(50),
      ]);
      setMinisters(m.data || []);
      setNews(n.data || []);
      setMps(mp.data || []);
      setProjects(p.data || []);
      setGovernments(g.data || []);
      setHistMinisters(hm.data || []);
      setAchievements(a.data || []);
      setDecisions(dec.data || []);
      setDocuments(doc.data || []);
      setLeaders(ld.data || []);
      setActivistPosts(ap.data || []);
      setLoading(false);
      if (notifEnabled && n.data && n.data.length > 0) {
        const latest = n.data[0];
        const stored = sessionStorage.getItem("lastNewsId");
        if (stored && latest.id > Number(stored)) showLocalNotification("🇧🇩 নতুন সংবাদ", latest.title, "/");
        sessionStorage.setItem("lastNewsId", latest.id);
      }
    }
    fetchData();
    const channel = supabase.channel("realtime-updates")
      .on("postgres_changes", { event: "*", schema: "public", table: "ministers" }, fetchData)
      .on("postgres_changes", { event: "*", schema: "public", table: "news" }, fetchData)
      .on("postgres_changes", { event: "*", schema: "public", table: "mps" }, fetchData)
      .on("postgres_changes", { event: "*", schema: "public", table: "projects" }, fetchData)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [notifEnabled]);

  if (isAdmin) return <AdminPanel onLogout={handleLogout} isDark={isDark} T={T} />;

  return (
    <>
      <style>{shimmerStyle}</style>
      <div style={{ fontFamily: "'Hind Siliguri', 'Noto Sans Bengali', sans-serif", background: T.bg, minHeight: "100vh", color: T.text, fontSize: 16, lineHeight: 1.7 }}>

        {selectedPerson && <PersonModal person={selectedPerson} type={personType} onClose={() => { setSelectedPerson(null); setPersonType(null); }} T={T} isDark={isDark} />}
        {selectedNews && <NewsModal news={selectedNews} onClose={() => setSelectedNews(null)} T={T} isDark={isDark} currentUser={currentUser} onLoginRequest={() => { setSelectedNews(null); setShowAuthModal(true); }} />}
        {selectedLeader && <LeaderModal leader={selectedLeader} onClose={() => setSelectedLeader(null)} T={T} isDark={isDark} />}
        {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} onSuccess={user => setCurrentUser(user)} T={T} isDark={isDark} />}

        {sidebarOpen && <div onClick={() => setSidebarOpen(false)} style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.6)", zIndex: 200 }} />}

        <div style={{ position: "fixed", top: 0, left: sidebarOpen ? 0 : -320, width: 300, height: "100vh", background: T.sidebarBg, borderRight: "2px solid #C9A84C", zIndex: 300, transition: "left 0.3s ease", overflowY: "auto" }}>
          <div style={{ background: "#006A4E", padding: "16px 20px", borderBottom: "2px solid #C9A84C" }}>
            <div style={{ fontSize: 14, fontWeight: "bold", color: "#fff" }}>🏛️ বিএনপি সরকার সমূহ</div>
            <div style={{ fontSize: 11, color: "#C9A84C", marginTop: 3 }}>ইতিহাস ও তথ্যভান্ডার</div>
          </div>
          <div style={{ padding: 12 }}>
            {governments.map((g, i) => (
              <div key={i} onClick={() => { setSelectedGovt(g); setSidebarOpen(false); setGovtTab("ministers"); setSearch(""); setShowDecisions(false); setShowDocuments(false); }}
                style={{ background: selectedGovt?.id === g.id ? "rgba(201,168,76,0.2)" : T.card, border: "1px solid " + (selectedGovt?.id === g.id ? "#C9A84C" : T.border), borderLeft: "4px solid " + (g.is_current ? "#006A4E" : "#C9A84C"), borderRadius: 8, padding: 14, marginBottom: 10, cursor: "pointer" }}>
                <div style={{ fontSize: 14, fontWeight: "bold", color: T.text }}>
                  {g.is_current && <span style={{ background: "#006A4E", color: "#fff", fontSize: 10, padding: "2px 6px", borderRadius: 4, marginRight: 6 }}>বর্তমান</span>}
                  {g.prime_minister}
                </div>
                <div style={{ fontSize: 12, color: "#C9A84C", marginTop: 4 }}>{g.name}</div>
                <div style={{ fontSize: 11, color: T.textMuted, marginTop: 3 }}>📅 {g.period}</div>
              </div>
            ))}
            <div style={{ height: 1, background: T.border, margin: "8px 0" }} />
            <div onClick={() => { setShowDecisions(true); setShowDocuments(false); setSidebarOpen(false); setSelectedGovt(null); setActiveTab("home"); }} style={{ background: showDecisions ? "rgba(201,168,76,0.2)" : T.card, border: "1px solid " + (showDecisions ? "#C9A84C" : T.border), borderLeft: "4px solid #C9A84C", borderRadius: 8, padding: 14, marginBottom: 10, cursor: "pointer" }}>
              <div style={{ fontSize: 13, fontWeight: "bold", color: T.text }}>⚖️ উল্লেখযোগ্য সিদ্ধান্ত</div>
              <div style={{ fontSize: 11, color: T.textMuted, marginTop: 3 }}>গুরুত্বপূর্ণ সরকারি সিদ্ধান্তসমূহ</div>
            </div>
            <div onClick={() => { setShowDocuments(true); setShowDecisions(false); setSidebarOpen(false); setSelectedGovt(null); setActiveTab("home"); }} style={{ background: showDocuments ? "rgba(201,168,76,0.2)" : T.card, border: "1px solid " + (showDocuments ? "#C9A84C" : T.border), borderLeft: "4px solid #3B8BD4", borderRadius: 8, padding: 14, marginBottom: 10, cursor: "pointer" }}>
              <div style={{ fontSize: 13, fontWeight: "bold", color: T.text }}>📄 গুরুত্বপূর্ণ দলিল</div>
              <div style={{ fontSize: 11, color: T.textMuted, marginTop: 3 }}>সরকারি গেজেট ও দলিলসমূহ</div>
            </div>
            <div style={{ height: 1, background: T.border, margin: "8px 0" }} />
            <div onClick={() => { setSelectedGovt(null); setSidebarOpen(false); setSearch(""); setShowDecisions(false); setShowDocuments(false); }} style={{ background: (!selectedGovt && !showDecisions && !showDocuments) ? "rgba(0,106,78,0.2)" : "transparent", border: "1px solid " + ((!selectedGovt && !showDecisions && !showDocuments) ? "#006A4E" : T.border), borderRadius: 8, padding: 12, marginTop: 8, cursor: "pointer", textAlign: "center", fontSize: 13, color: "#4ecba0" }}>
              🏠 মূল ড্যাশবোর্ডে ফিরুন
            </div>
          </div>
        </div>

        <div style={{ background: "#006A4E", borderBottom: "3px solid #C9A84C", padding: "12px 20px", display: "flex", alignItems: "center", gap: 10, position: "sticky", top: 0, zIndex: 100 }}>
          <button aria-label="মেনু" onClick={() => setSidebarOpen(!sidebarOpen)} style={{ background: "transparent", border: "none", cursor: "pointer", padding: 4, display: "flex", flexDirection: "column", gap: 5, flexShrink: 0 }}>
            <span style={{ display: "block", width: 24, height: 2, background: "#fff", borderRadius: 2 }} />
            <span style={{ display: "block", width: 24, height: 2, background: "#fff", borderRadius: 2 }} />
            <span style={{ display: "block", width: 24, height: 2, background: "#fff", borderRadius: 2 }} />
          </button>
          {/* FIX: this wrapper was never closed in the original file (missing `</div>` right
              after the subtitle line). That left one JSX tag unterminated, which is exactly
              what caused the build's "Unterminated JSX contents." error. Added the closing
              tag below so the title/subtitle are grouped and the wrapper properly closes
              before the logo/buttons that follow as siblings. */}
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: "bold", color: "#fff" }}>{selectedGovt ? "🏛️ " + selectedGovt.name : "🇧🇩 " + t.appTitle}</div>
            <div style={{ fontSize: 11, color: "#C9A84C", marginTop: 2 }}>{selectedGovt ? "📅 " + selectedGovt.period : t.appSubtitle}</div>
          </div>

          {!selectedGovt && <img src={BNP_LOGO} alt="বিএনপি লোগো" style={{ width: 32, height: 32, borderRadius: 4, objectFit: "contain", background: "#fff", padding: 2, flexShrink: 0 }} onError={e => e.target.style.display = "none"} />}
          {currentUser ? (
            <button onClick={async () => { if (window.confirm("লগআউট করবেন?")) { await supabase.auth.signOut(); setCurrentUser(null); } }} style={{ background: "rgba(255,255,255,0.2)", border: "1px solid rgba(255,255,255,0.3)", borderRadius: 20, padding: "4px 10px", cursor: "pointer", color: "#fff", fontSize: 12, flexShrink: 0, fontFamily: "sans-serif", display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 20, height: 20, borderRadius: "50%", background: "#C9A84C", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: "bold", color: "#0D1B2A" }}>{(currentUser.user_metadata?.full_name || currentUser.email || "U")[0].toUpperCase()}</span>
              <span style={{ maxWidth: 60, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{currentUser.user_metadata?.full_name || currentUser.email?.split("@")[0]}</span>
            </button>
          ) : (
            <button onClick={() => setShowAuthModal(true)} style={{ background: "rgba(255,255,255,0.15)", border: "none", borderRadius: 20, padding: "5px 10px", cursor: "pointer", color: "#fff", fontSize: 12, flexShrink: 0, fontFamily: "sans-serif" }}>👤 লগইন</button>
          )}
          <button aria-label="সার্চ" onClick={() => { setShowSearch(!showSearch); setGlobalSearch(""); }} style={{ background: "rgba(255,255,255,0.15)", border: "none", borderRadius: 20, padding: "5px 10px", cursor: "pointer", color: "#fff", fontSize: 15, flexShrink: 0 }}>🔍</button>
          <button aria-label="থিম" onClick={toggleTheme} style={{ background: "rgba(255,255,255,0.15)", border: "none", borderRadius: 20, padding: "5px 10px", cursor: "pointer", color: "#fff", fontSize: 15, flexShrink: 0 }}>{isDark ? "☀️" : "🌙"}</button>
          <button aria-label="ভাষা" onClick={toggleLang} style={{ background: "rgba(255,255,255,0.15)", border: "none", borderRadius: 20, padding: "5px 10px", cursor: "pointer", color: "#fff", fontSize: 12, fontWeight: "bold", flexShrink: 0, fontFamily: "sans-serif" }}>{lang === "bn" ? "EN" : "বাং"}</button>
          <button aria-label="নোটিফিকেশন" onClick={async () => {
            if (notifEnabled) { setNotifEnabled(false); return; }
            const result = await requestNotificationPermission();
            if (result === "granted") { setNotifEnabled(true); showLocalNotification("🇧🇩 বাংলাদেশ সরকার", "Notification চালু হয়েছে!"); }
          }} style={{ background: notifEnabled ? "rgba(0,255,128,0.2)" : "rgba(255,255,255,0.15)", border: "1px solid " + (notifEnabled ? "#4ecba0" : "transparent"), borderRadius: 20, padding: "5px 10px", cursor: "pointer", color: "#fff", fontSize: 15, flexShrink: 0 }}>
            {notifEnabled ? "🔔" : "🔕"}
          </button>
        </div>

        {showSearch && (
          <div style={{ background: isDark ? "#0a1520" : "#E8F0F8", borderBottom: "2px solid #C9A84C", padding: "12px 20px", position: "sticky", top: 56, zIndex: 90 }}>
            <div style={{ maxWidth: 700, margin: "0 auto", position: "relative" }}>
              <label htmlFor="global-search" style={{ display: "none" }}>সার্চ</label>
              <input id="global-search" autoFocus placeholder="মন্ত্রী, এমপি, সংবাদ বা প্রকল্প খুঁজুন..." value={globalSearch} onChange={e => setGlobalSearch(e.target.value)} style={{ width: "100%", background: T.card, border: "1px solid #C9A84C", borderRadius: 8, padding: "10px 40px 10px 14px", color: T.text, fontSize: 14, boxSizing: "border-box", outline: "none" }} />
              {globalSearch && <button onClick={() => setGlobalSearch("")} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "transparent", border: "none", color: T.textMuted, cursor: "pointer", fontSize: 16 }}>✕</button>}
            </div>
            {searchResults.length > 0 && (
              <div style={{ maxWidth: 700, margin: "8px auto 0", background: T.card, border: "1px solid " + T.border, borderRadius: 8, overflow: "hidden" }}>
                {searchResults.map((result, i) => (
                  <div key={i} onClick={() => { setActiveTab(result.tab); setShowSearch(false); setGlobalSearch(""); setSelectedGovt(null); }} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", borderBottom: i < searchResults.length - 1 ? "1px solid " + T.border : "none", cursor: "pointer" }}
                    onMouseEnter={e => e.currentTarget.style.background = isDark ? "#162840" : "#EAF2FB"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                    <span style={{ fontSize: 18 }}>{result.icon}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: "bold", color: T.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{result.title}</div>
                      <div style={{ fontSize: 11, color: T.textMuted, marginTop: 2 }}>{result.subtitle}</div>
                    </div>
                    <span style={{ fontSize: 10, color: "#C9A84C", background: "rgba(201,168,76,0.15)", padding: "2px 8px", borderRadius: 10, whiteSpace: "nowrap" }}>{result.type}</span>
                  </div>
                ))}
              </div>
            )}
            {globalSearch.trim().length >= 2 && searchResults.length === 0 && (
              <div style={{ maxWidth: 700, margin: "8px auto 0", background: T.card, border: "1px solid " + T.border, borderRadius: 8, padding: 16, textAlign: "center", color: T.textMuted, fontSize: 13 }}>কোনো ফলাফল পাওয়া যায়নি</div>
            )}
          </div>
        )}

        <div style={{ display: "flex", background: T.navBg, borderBottom: "2px solid " + T.navBorder, overflowX: "auto" }}>
          {(selectedGovt ? govtTabs : tabs).map(tab => (
            <button key={tab.id} onClick={() => { selectedGovt ? setGovtTab(tab.id) : setActiveTab(tab.id); setSearch(""); setShowDecisions(false); setShowDocuments(false); }}
              style={{ background: (selectedGovt ? govtTab : activeTab) === tab.id ? "rgba(201,168,76,0.15)" : "transparent", border: "none", borderBottom: (selectedGovt ? govtTab : activeTab) === tab.id ? "3px solid #C9A84C" : "3px solid transparent", color: (selectedGovt ? govtTab : activeTab) === tab.id ? "#C9A84C" : T.textMuted, padding: "14px 18px", cursor: "pointer", fontSize: 14, whiteSpace: "nowrap", fontFamily: "'Hind Siliguri', sans-serif", fontWeight: (selectedGovt ? govtTab : activeTab) === tab.id ? "600" : "400" }}>
              {tab.label}
            </button>
          ))}
        </div>

        {showLogin && (
          <div onClick={() => setShowLogin(false)} style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.7)", zIndex: 400, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div onClick={e => e.stopPropagation()} style={{ background: T.card, border: "2px solid #C9A84C", borderRadius: 12, padding: 28, width: 320, maxWidth: "90vw" }}>
              <div style={{ fontSize: 18, fontWeight: "bold", color: "#C9A84C", marginBottom: 20, textAlign: "center" }}>🔐 অ্যাডমিন লগইন</div>
              <input placeholder="ইমেইল" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} style={{ width: "100%", background: T.bg, border: "1px solid " + T.border, borderRadius: 8, padding: "10px 14px", color: T.text, fontSize: 14, boxSizing: "border-box", outline: "none", marginBottom: 10, fontFamily: "sans-serif" }} />
              <input type="password" placeholder="পাসওয়ার্ড" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} onKeyDown={e => e.key === "Enter" && handleLogin()} style={{ width: "100%", background: T.bg, border: "1px solid " + T.border, borderRadius: 8, padding: "10px 14px", color: T.text, fontSize: 14, boxSizing: "border-box", outline: "none", marginBottom: 14, fontFamily: "sans-serif" }} />
              {loginError && <div style={{ color: "#ff8a8a", fontSize: 12, marginBottom: 10, textAlign: "center" }}>⚠️ {loginError}</div>}
              <button onClick={handleLogin} disabled={loginLoading} style={{ background: "#006A4E", color: "#fff", border: "none", borderRadius: 8, padding: "12px", cursor: "pointer", fontSize: 14, fontWeight: "bold", width: "100%" }}>
                {loginLoading ? "লগইন হচ্ছে..." : "লগইন করুন"}
              </button>
            </div>
          </div>
        )}

        {loading && (
          <div style={{ padding: 20, maxWidth: 700, margin: "0 auto" }}>
            <div style={{ height: 80, background: "#112233", border: "1px solid #1e3348", borderRadius: 12, marginBottom: 20, position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.04), transparent)", animation: "shimmer 1.5s infinite" }} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12, marginBottom: 20 }}>
              <SkeletonStat /><SkeletonStat /><SkeletonStat /><SkeletonStat />
            </div>
            <SkeletonCard /><SkeletonCard /><SkeletonCard />
          </div>
        )}

        {!loading && (
          <div className="fade-in" style={{ padding: 20, maxWidth: 700, margin: "0 auto", paddingBottom: 90 }}>

            {selectedGovt && (
              <div>
                <div style={{ background: T.card, border: "1px solid " + T.border, borderLeft: "4px solid #C9A84C", borderRadius: 8, padding: 16, marginBottom: 20 }}>
                  <div style={{ fontSize: 13, color: T.textSecondary, lineHeight: 1.7 }}>{selectedGovt.description}</div>
                </div>

                {govtTab === "ministers" && (
                  <div>
                    <h2 style={{ color: "#C9A84C", borderLeft: "4px solid #006A4E", paddingLeft: 10, marginBottom: 16, fontSize: 16 }}>👥 {t.cabinet}</h2>
                    {currentGovtMinisters.length === 0
                      ? <div style={{ color: T.textMuted, textAlign: "center", padding: 40 }}>এই সরকারের মন্ত্রিসভার তথ্য এখনো যোগ করা হয়নি।</div>
                      : currentGovtMinisters.map((m, i) => (
                        <div key={i} className="card-hover" style={{ background: T.card, border: "1px solid " + T.border, borderRadius: 10, padding: 16, marginBottom: 10, display: "flex", gap: 14, alignItems: "flex-start" }}>
                          <div style={{ width: 48, height: 48, borderRadius: "50%", border: "2px solid #C9A84C", flexShrink: 0, overflow: "hidden", background: "#006A4E", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>
                            {m.photo_url ? <img src={m.photo_url} alt={m.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : m.icon || "👤"}
                          </div>
                          <div>
                            <div style={{ fontSize: 15, fontWeight: "bold", color: T.text }}>{m.name}</div>
                            <div style={{ fontSize: 12, color: "#C9A84C", marginTop: 2 }}>{m.role}</div>
                            <div style={{ fontSize: 12, color: T.textMuted, marginTop: 3 }}>📁 {m.ministry}</div>
                          </div>
                        </div>
                      ))}
                  </div>
                )}

                {govtTab === "mps" && (
                  <div>
                    <h2 style={{ color: "#C9A84C", borderLeft: "4px solid #006A4E", paddingLeft: 10, marginBottom: 16, fontSize: 16 }}>🏅 সংসদ সদস্য তালিকা</h2>
                    <input placeholder="নাম, আসন বা জেলা..." value={search} onChange={e => setSearch(e.target.value)} style={{ width: "100%", background: T.card, border: "1px solid " + T.border, borderRadius: 8, padding: "10px 14px", color: T.text, fontSize: 14, marginBottom: 16, boxSizing: "border-box", outline: "none" }} />
                    {mps.filter(m => Number(m.government_id) === Number(selectedGovt.id) && (m.name.includes(search) || (m.constituency && m.constituency.includes(search)) || (m.district && m.district.includes(search)))).length === 0
                      ? <div style={{ color: T.textMuted, textAlign: "center", padding: 40 }}>এই সরকারের এমপি তালিকা এখনো যোগ করা হয়নি।</div>
                      : mps.filter(m => Number(m.government_id) === Number(selectedGovt.id) && (m.name.includes(search) || (m.constituency && m.constituency.includes(search)) || (m.district && m.district.includes(search)))).map((m, i) => (
                        <div key={i} className="card-hover" style={{ background: T.card, border: "1px solid " + T.border, borderRadius: 10, padding: 16, marginBottom: 10, display: "flex", gap: 14, alignItems: "flex-start" }}>
                          <div style={{ width: 48, height: 48, borderRadius: "50%", border: "2px solid #C9A84C", flexShrink: 0, overflow: "hidden", background: "#006A4E", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, cursor: "pointer" }} onClick={() => { setSelectedPerson(m); setPersonType("mp"); }}>
                            {m.photo_url ? <img src={m.photo_url} alt={m.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : "🏅"}
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 15, fontWeight: "bold", color: T.text }}>{m.name}</div>
                            <div style={{ fontSize: 12, color: "#C9A84C", marginTop: 4 }}>🏅 {m.constituency} · {m.district}</div>
                            <div style={{ fontSize: 12, color: T.textMuted, marginTop: 3 }}>🌾 {m.party}</div>
                            <button onClick={() => { setSelectedPerson(m); setPersonType("mp"); }} style={{ marginTop: 8, background: "transparent", border: "1px solid #C9A84C", borderRadius: 16, padding: "4px 12px", cursor: "pointer", fontSize: 11, color: "#C9A84C", fontFamily: "sans-serif" }}>বিস্তারিত দেখুন →</button>
                          </div>
                        </div>
                      ))}
                  </div>
                )}

                {govtTab === "achievements" && (
                  <div>
                    <h2 style={{ color: "#C9A84C", borderLeft: "4px solid #006A4E", paddingLeft: 10, marginBottom: 16, fontSize: 16 }}>🏆 উল্লেখযোগ্য সাফল্য</h2>
                    {currentGovtAchievements.length === 0
                      ? <div style={{ color: T.textMuted, textAlign: "center", padding: 40 }}>এই সরকারের সাফল্যের তথ্য এখনো যোগ করা হয়নি।</div>
                      : currentGovtAchievements.map((a, i) => (
                        <div key={i} className="card-hover" style={{ background: T.card, border: "1px solid " + T.border, borderLeft: "4px solid #C9A84C", borderRadius: 8, padding: 16, marginBottom: 12 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6, flexWrap: "wrap", gap: 4 }}>
                            <div style={{ fontSize: 11, color: "#C9A84C", fontWeight: "bold" }}>🏆 {a.category}</div>
                            {(a.date || a.year) && <div style={{ fontSize: 10, color: T.textMuted, background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)", padding: "2px 8px", borderRadius: 10 }}>📅 {a.date || a.year}</div>}
                          </div>
                          <div style={{ fontSize: 15, fontWeight: "bold", color: T.text, marginBottom: 6 }}>{a.title}</div>
                          <div style={{ fontSize: 13, color: T.textSecondary, lineHeight: 1.6 }}>{a.description}</div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            )}

            {!selectedGovt && (
              <div>
                {showDecisions && (
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                      <h2 style={{ color: "#C9A84C", borderLeft: "4px solid #C9A84C", paddingLeft: 10, fontSize: 16, margin: 0 }}>⚖️ উল্লেখযোগ্য সিদ্ধান্ত</h2>
                      <button onClick={() => setShowDecisions(false)} style={{ background: "transparent", border: "1px solid " + T.border, borderRadius: 6, padding: "4px 12px", color: T.textMuted, cursor: "pointer", fontSize: 12, fontFamily: "sans-serif" }}>✕ বন্ধ</button>
                    </div>
                    {decisions.length === 0
                      ? <div style={{ color: T.textMuted, textAlign: "center", padding: 40 }}>কোনো সিদ্ধান্ত পাওয়া যায়নি</div>
                      : decisions.map((d, i) => (
                        <div key={i} className="card-hover" style={{ background: T.card, border: "1px solid " + T.border, borderLeft: "4px solid #C9A84C", borderRadius: 8, padding: 16, marginBottom: 12 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                            <div style={{ fontSize: 11, color: "#C9A84C", fontWeight: "bold" }}>{d.category}</div>
                            <div style={{ fontSize: 11, color: T.textMuted }}>📅 {d.date}</div>
                          </div>
                          <div style={{ fontSize: 14, fontWeight: "bold", color: T.text, marginBottom: 6 }}>{d.title}</div>
                          <div style={{ fontSize: 13, color: T.textSecondary, lineHeight: 1.6 }}>{d.description}</div>
                        </div>
                      ))}
                  </div>
                )}

                {showDocuments && (
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                      <h2 style={{ color: "#C9A84C", borderLeft: "4px solid #3B8BD4", paddingLeft: 10, fontSize: 16, margin: 0 }}>📄 গুরুত্বপূর্ণ দলিল</h2>
                      <button onClick={() => setShowDocuments(false)} style={{ background: "transparent", border: "1px solid " + T.border, borderRadius: 6, padding: "4px 12px", color: T.textMuted, cursor: "pointer", fontSize: 12, fontFamily: "sans-serif" }}>✕ বন্ধ</button>
                    </div>
                    {documents.length === 0
                      ? <div style={{ color: T.textMuted, textAlign: "center", padding: 40 }}>কোনো দলিল পাওয়া যায়নি</div>
                      : documents.map((d, i) => (
                        <div key={i} className="card-hover" style={{ background: T.card, border: "1px solid " + T.border, borderLeft: "4px solid #3B8BD4", borderRadius: 8, padding: 16, marginBottom: 12 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                            <div style={{ fontSize: 11, color: "#3B8BD4", fontWeight: "bold" }}>{d.category}</div>
                            <div style={{ fontSize: 11, color: T.textMuted }}>📅 {d.date}</div>
                          </div>
                          <div style={{ fontSize: 14, fontWeight: "bold", color: T.text, marginBottom: 6 }}>{d.title}</div>
                          {d.description && <div style={{ fontSize: 13, color: T.textSecondary, lineHeight: 1.6, marginBottom: 8 }}>{d.description}</div>}
                          {d.file_url
                            ? <a href={d.file_url} target="_blank" rel="noreferrer" style={{ display: "inline-block", background: "#3B8BD4", color: "#fff", borderRadius: 6, padding: "6px 14px", fontSize: 12, textDecoration: "none" }}>📥 ডাউনলোড করুন</a>
                            : <span style={{ fontSize: 11, color: T.textMuted }}>ফাইল শীঘ্রই যোগ হবে</span>}
                        </div>
                      ))}
                  </div>
                )}

                {!showDecisions && !showDocuments && activeTab === "home" && (
                  <div>
                    <div style={{ background: "#006A4E", border: "1px solid #C9A84C", borderRadius: 12, padding: 20, marginBottom: 20, textAlign: "center" }}>
                      <div style={{ fontSize: 22, fontWeight: "bold", color: "#fff", marginBottom: 6 }}>🇧🇩 {t.welcome}</div>
                      <div style={{ fontSize: 13, color: "#C9A84C" }}>{t.welcomeSubtitle}</div>
                    </div>

                    {!notifEnabled && (
                      <div style={{ background: isDark ? "rgba(201,168,76,0.1)" : "rgba(201,168,76,0.08)", border: "1px solid #C9A84C", borderRadius: 10, padding: 14, marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: "bold", color: "#C9A84C", marginBottom: 3 }}>🔔 Notification চালু করুন</div>
                          <div style={{ fontSize: 12, color: T.textMuted }}>নতুন সংবাদ ও আপডেটে সাথে সাথে জানুন</div>
                        </div>
                        <button onClick={async () => { const r = await requestNotificationPermission(); if (r === "granted") { setNotifEnabled(true); showLocalNotification("🇧🇩 বাংলাদেশ সরকার", "Notification চালু হয়েছে!"); } }} style={{ background: "#C9A84C", color: "#0D1B2A", border: "none", borderRadius: 8, padding: "8px 16px", cursor: "pointer", fontSize: 13, fontWeight: "bold", whiteSpace: "nowrap", fontFamily: "sans-serif" }}>চালু করুন</button>
                      </div>
                    )}

                    <div className="grid-2col" style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12, marginBottom: 20 }}>
                      {[
                        { label: t.totalMinisters, value: ministers.length, icon: "👥", color: "#006A4E", tab: "ministers", bg: isDark ? "rgba(0,106,78,0.15)" : "rgba(0,106,78,0.08)" },
                        { label: t.mpCount, value: mps.filter(m => Number(m.government_id) === 1).length, icon: "🏅", color: "#C9A84C", tab: "mps", bg: isDark ? "rgba(201,168,76,0.1)" : "rgba(201,168,76,0.06)" },
                        { label: t.projectCount, value: projects.length, icon: "🔨", color: "#3B8BD4", tab: "projects", bg: isDark ? "rgba(59,139,212,0.1)" : "rgba(59,139,212,0.06)" },
                        { label: t.newsCount, value: news.length, icon: "📰", color: "#9F5DCF", tab: "news", bg: isDark ? "rgba(159,93,207,0.1)" : "rgba(159,93,207,0.06)" },
                      ].map((stat, i) => (
                        <div key={i} className="card-hover" onClick={() => setActiveTab(stat.tab)} style={{ background: stat.bg, border: "2px solid " + stat.color + "44", borderRadius: 12, padding: "20px 16px", cursor: "pointer", textAlign: "center", position: "relative", overflow: "hidden" }}>
                          <div style={{ fontSize: 32, marginBottom: 8 }}>{stat.icon}</div>
                          <div style={{ fontSize: 36, fontWeight: "700", color: stat.color, lineHeight: 1, marginBottom: 6 }}>{stat.value}</div>
                          <div style={{ fontSize: 13, color: T.textMuted, fontWeight: "500" }}>{stat.label}</div>
                          <div style={{ position: "absolute", bottom: 8, right: 10, fontSize: 10, color: stat.color, opacity: 0.7 }}>দেখুন →</div>
                        </div>
                      ))}
                    </div>

                    {ministers.length > 0 && (
                      <div style={{ background: T.card, border: "1px solid " + T.border, borderRadius: 10, padding: 16, marginBottom: 20 }}>
                        <BarChart title="📊 মন্ত্রিসভার বিভাগ অনুযায়ী বিতরণ" data={[
                          { label: "পূর্ণ মন্ত্রী", value: ministers.filter(m => m.role === "মন্ত্রী" || m.role === "প্রধানমন্ত্রী" || m.role === "সিনিয়র মন্ত্রী").length, color: "#006A4E" },
                          { label: "প্রতিমন্ত্রী", value: ministers.filter(m => m.role === "প্রতিমন্ত্রী").length, color: "#C9A84C" },
                          { label: "টেকনোক্র্যাট", value: ministers.filter(m => m.role && m.role.includes("টেকনোক্র্যাট")).length, color: "#3B8BD4" },
                          { label: "উপমন্ত্রী", value: ministers.filter(m => m.role === "উপমন্ত্রী").length, color: "#9F5DCF" },
                        ]} />
                      </div>
                    )}

                    {projects.length > 0 && (
                      <div style={{ background: T.card, border: "1px solid " + T.border, borderRadius: 10, padding: 16, marginBottom: 20 }}>
                        <h3 style={{ fontSize: 13, color: "#C9A84C", marginBottom: 16 }}>🎯 প্রকল্প অগ্রগতি</h3>
                        <div style={{ display: "flex", justifyContent: "space-around", flexWrap: "wrap", gap: 12 }}>
                          {projects.slice(0, 4).map((p, i) => (
                            <DonutChart key={i} value={p.progress} max={100} label={p.title.length > 12 ? p.title.slice(0, 12) + "..." : p.title} color={["#006A4E", "#C9A84C", "#3B8BD4", "#9F5DCF"][i % 4]} />
                          ))}
                        </div>
                      </div>
                    )}

                    <h2 style={{ color: "#C9A84C", borderLeft: "4px solid #006A4E", paddingLeft: 10, marginBottom: 14, fontSize: 15 }}>🔨{t.ongoingProjects}</h2>
                    {projects.filter(p => p.status === "চলমান").slice(0, 3).map((p, i) => (
                      <div key={i} className="card-hover" style={{ background: T.card, border: "1px solid " + T.border, borderRadius: 8, padding: 14, marginBottom: 10 }}>
                        <div style={{ fontSize: 13, fontWeight: "bold", color: T.text, marginBottom: 6 }}>{p.title}</div>
                        <div style={{ height: 6, background: T.border, borderRadius: 3, overflow: "hidden", marginBottom: 6 }}>
                          <div style={{ height: "100%", width: p.progress + "%", background: "linear-gradient(90deg, #006A4E, #C9A84C)", borderRadius: 3 }} />
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: T.textMuted }}>
                          <span>💰 {p.budget}</span>
                          <span style={{ color: "#4ecba0" }}>{p.progress}% সম্পন্ন</span>
                        </div>
                      </div>
                    ))}

                    <h2 style={{ color: "#C9A84C", borderLeft: "4px solid #006A4E", paddingLeft: 10, margin: "20px 0 14px", fontSize: 15 }}>📰 t.newsCount</h2>
                    {news.slice(0, 3).map((n, i) => (
                      <div key={i} className="card-hover" style={{ background: T.card, border: "1px solid " + T.border, borderLeft: "4px solid #006A4E", borderRadius: 8, padding: 14, marginBottom: 10 }}>
                        <div style={{ fontSize: 11, color: "#C9A84C", fontWeight: "bold", marginBottom: 4 }}>{n.source} · {n.category}</div>
                        <div onClick={() => setSelectedNews(n)} style={{ fontSize: 13, color: T.text, lineHeight: 1.6, marginBottom: 4, cursor: "pointer" }}>{n.title}</div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
                          <div style={{ fontSize: 11, color: T.textMuted }}>🕐 {formatBanglaDate(n.time)}</div>
                          <SocialShare title={n.title} newsId={n.id} />
                        </div>
                      </div>
                    ))}
                    <div onClick={() => setActiveTab("news")} style={{ background: "transparent", border: "1px solid #006A4E", borderRadius: 8, padding: "10px 16px", textAlign: "center", cursor: "pointer", color: "#4ecba0", fontSize: 13, marginTop: 4 }}>সব সংবাদ দেখুন →</div>

                    <h2 style={{ color: "#C9A84C", borderLeft: "4px solid #006A4E", paddingLeft: 10, margin: "20px 0 14px", fontSize: 15 }}>🏛️ {t.govtList}</h2>
                    {governments.map((g, i) => (
                      <div key={i} className="card-hover" onClick={() => { setSelectedGovt(g); setGovtTab("ministers"); }} style={{ background: T.card, border: "1px solid " + (g.is_current ? "#006A4E" : T.border), borderLeft: "4px solid " + (g.is_current ? "#006A4E" : "#C9A84C"), borderRadius: 8, padding: 14, marginBottom: 10, cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: "bold", color: T.text }}>
                            {g.is_current && <span style={{ background: "#006A4E", color: "#fff", fontSize: 10, padding: "2px 6px", borderRadius: 4, marginRight: 6 }}>বর্তমান</span>}
                            {g.prime_minister}
                          </div>
                          <div style={{ fontSize: 12, color: "#C9A84C", marginTop: 3 }}>{g.name}</div>
                          <div style={{ fontSize: 11, color: T.textMuted, marginTop: 2 }}>📅 {g.period}</div>
                        </div>
                        <div style={{ color: T.textMuted, fontSize: 18 }}>›</div>
                      </div>
                    ))}
                  </div>
                )}

                {!showDecisions && !showDocuments && activeTab === "news" && (
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                      <h2 style={{ color: "#C9A84C", borderLeft: "4px solid #006A4E", paddingLeft: 10, fontSize: 16, margin: 0 }}>t.newsCount</h2>
                      <span style={{ fontSize: 12, color: T.textMuted }}>{filteredNews.length}টি সংবাদ</span>
                    </div>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
                      {newsCategories.map(cat => (
                        <button key={cat} onClick={() => { setNewsCategory(cat); setNewsPage(1); }} style={{ background: newsCategory === cat ? "#006A4E" : "transparent", border: "1px solid " + (newsCategory === cat ? "#006A4E" : T.border), borderRadius: 20, padding: "5px 12px", cursor: "pointer", fontSize: 12, color: newsCategory === cat ? "#fff" : T.textMuted, fontFamily: "sans-serif" }}>
                          {cat}
                        </button>
                      ))}
                    </div>
                    {filteredNews.length === 0 && <div style={{ color: T.textMuted, textAlign: "center", padding: 40 }}>এই ক্যাটাগরিতে কোনো সংবাদ নেই</div>}
                    {paginatedNews.map((n, i) => (
                      <div key={i} id={"news-" + n.id} className="card-hover" style={{ background: T.card, border: "1px solid " + T.border, borderLeft: "4px solid #006A4E", borderRadius: 8, padding: 16, marginBottom: 12, scrollMarginTop: 80 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                          <div style={{ fontSize: 11, color: "#C9A84C", fontWeight: "bold" }}>{n.source}</div>
                          <span style={{ fontSize: 10, color: "#006A4E", background: isDark ? "rgba(0,106,78,0.2)" : "rgba(0,106,78,0.1)", padding: "2px 8px", borderRadius: 10, whiteSpace: "nowrap", marginLeft: 8 }}>{n.category}</span>
                        </div>
                        <div onClick={() => setSelectedNews(n)} style={{ fontSize: 14, color: T.text, lineHeight: 1.6, marginBottom: 8, cursor: "pointer" }}>{n.title}</div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
                          <div style={{ fontSize: 11, color: T.textMuted }}>🕐 {formatBanglaDate(n.time)}</div>
                          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                            <button onClick={() => setSelectedNews(n)} style={{ background: "transparent", border: "1px solid " + T.border, borderRadius: 16, padding: "3px 10px", cursor: "pointer", fontSize: 11, color: T.textMuted, fontFamily: "sans-serif" }}>পড়ুন →</button>
                            <SocialShare title={n.title} newsId={n.id} />
                          </div>
                        </div>
                      </div>
                    ))}
                    {hasMore && <button onClick={() => setNewsPage(prev => prev + 1)} style={{ width: "100%", background: "transparent", border: "1px solid #006A4E", borderRadius: 8, padding: "12px", cursor: "pointer", color: "#4ecba0", fontSize: 14, fontFamily: "sans-serif", marginTop: 4 }}>আরো {Math.min(NEWS_PER_PAGE, filteredNews.length - paginatedNews.length)}টি সংবাদ দেখুন</button>}
                    {!hasMore && filteredNews.length > 0 && <div style={{ textAlign: "center", fontSize: 12, color: T.textMuted, padding: "12px 0" }}>সব {filteredNews.length}টি সংবাদ দেখানো হয়েছে</div>}
                  </div>
                )}

                {!showDecisions && !showDocuments && activeTab === "ministers" && (
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                      <h2 style={{ color: "#C9A84C", borderLeft: "4px solid #006A4E", paddingLeft: 10, fontSize: 16, margin: 0 }}>{t.cabinet}</h2>
                      <button onClick={() => downloadPDF("মন্ত্রিসভা তালিকা", ministers, [{ key: "name", label: "নাম" }, { key: "role", label: "পদবি" }, { key: "ministry", label: "মন্ত্রণালয়" }])} style={{ background: "#006A4E", color: "#fff", border: "none", borderRadius: 6, padding: "6px 14px", cursor: "pointer", fontSize: 12 }}>📥 PDF</button>
                    </div>
                    <input placeholder="মন্ত্রী বা মন্ত্রণালয় খুঁজুন..." value={search} onChange={e => setSearch(e.target.value)} style={{ width: "100%", background: T.card, border: "1px solid " + T.border, borderRadius: 8, padding: "10px 14px", color: T.text, fontSize: 14, marginBottom: 16, boxSizing: "border-box", outline: "none" }} />
                    {filteredMinisters.map((m, i) => (
                      <div key={i} className="card-hover" style={{ background: T.card, border: "1px solid " + T.border, borderRadius: 10, padding: 16, marginBottom: 10, display: "flex", gap: 14, alignItems: "flex-start" }}>
                        <div style={{ width: 52, height: 52, borderRadius: "50%", border: "2px solid #C9A84C", flexShrink: 0, overflow: "hidden", background: "#006A4E", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, cursor: "pointer" }} onClick={() => { setSelectedPerson(m); setPersonType("minister"); }}>
                          {m.photo_url ? <img src={m.photo_url} alt={m.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={e => e.target.style.display = "none"} /> : m.icon || "👤"}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 15, fontWeight: "bold", color: T.text }}>{m.name}</div>
                          <div style={{ fontSize: 12, color: "#C9A84C", marginTop: 2 }}>{m.role}</div>
                          <div style={{ fontSize: 12, color: T.textMuted, marginTop: 3 }}>📁 {m.ministry}</div>
                          <button onClick={() => { setSelectedPerson(m); setPersonType("minister"); }} style={{ marginTop: 8, background: "transparent", border: "1px solid #C9A84C", borderRadius: 16, padding: "4px 12px", cursor: "pointer", fontSize: 11, color: "#C9A84C", fontFamily: "sans-serif" }}>বিস্তারিত দেখুন →</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {!showDecisions && !showDocuments && activeTab === "mps" && (
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                      <h2 style={{ color: "#C9A84C", borderLeft: "4px solid #006A4E", paddingLeft: 10, fontSize: 16, margin: 0 }}>সংসদ সদস্য তালিকা</h2>
                      <button onClick={() => downloadPDF("সংসদ সদস্য তালিকা", filteredMps, [{ key: "name", label: "নাম" }, { key: "constituency", label: "আসন" }, { key: "district", label: "জেলা" }, { key: "party", label: "দল" }])} style={{ background: "#006A4E", color: "#fff", border: "none", borderRadius: 6, padding: "6px 14px", cursor: "pointer", fontSize: 12 }}>📥 PDF</button>
                    </div>
                    {/* বিভাগ ফিল্টার বাটন */}
                    <div style={{ marginBottom: 12 }}>
                      <div style={{ fontSize: 12, color: T.textMuted, marginBottom: 8 }}>🗺️ বিভাগ অনুযায়ী ফিল্টার</div>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        {divisions.map(div => (
                          <button key={div} onClick={() => { setMpDivision(div); setMpDistrict("সব"); }}
                            style={{ background: mpDivision === div ? "#006A4E" : "transparent", border: "1px solid " + (mpDivision === div ? "#006A4E" : T.border), borderRadius: 20, padding: "5px 12px", cursor: "pointer", fontSize: 12, color: mpDivision === div ? "#fff" : T.textMuted, fontFamily: "sans-serif", transition: "all 0.2s" }}>
                            {div === "সব" ? "🇧🇩 সব" : div}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* জেলা ফিল্টার — বিভাগ নির্বাচিত হলে দেখাবে */}
                    {mpDivision !== "সব" && (
                      <div style={{ marginBottom: 12 }}>
                        <div style={{ fontSize: 12, color: T.textMuted, marginBottom: 8 }}>📍 জেলা অনুযায়ী ফিল্টার ({mpDivision} বিভাগ)</div>
                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                          {districts.map(dist => (
                            <button key={dist} onClick={() => setMpDistrict(dist)}
                              style={{ background: mpDistrict === dist ? "#C9A84C" : "transparent", border: "1px solid " + (mpDistrict === dist ? "#C9A84C" : T.border), borderRadius: 20, padding: "4px 10px", cursor: "pointer", fontSize: 11, color: mpDistrict === dist ? "#0D1B2A" : T.textMuted, fontFamily: "sans-serif", transition: "all 0.2s" }}>
                              {dist === "সব" ? "সব জেলা" : dist}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* সার্চ বক্স */}
                    <input placeholder="নাম বা আসন দিয়ে খুঁজুন..." value={search} onChange={e => setSearch(e.target.value)}
                      style={{ width: "100%", background: T.card, border: "1px solid " + T.border, borderRadius: 8, padding: "10px 14px", color: T.text, fontSize: 14, marginBottom: 10, boxSizing: "border-box", outline: "none" }} />

                    {/* Active ফিল্টার ট্যাগ */}
                    {(mpDivision !== "সব" || mpDistrict !== "সব" || search) && (
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12, alignItems: "center" }}>
                        <span style={{ fontSize: 12, color: T.textMuted }}>ফিল্টার:</span>
                        {mpDivision !== "সব" && (
                          <span style={{ background: "rgba(0,106,78,0.15)", border: "1px solid #006A4E", borderRadius: 20, padding: "3px 10px", fontSize: 12, color: "#4ecba0", display: "flex", alignItems: "center", gap: 4 }}>
                            🗺️ {mpDivision}
                            <button onClick={() => { setMpDivision("সব"); setMpDistrict("সব"); }} style={{ background: "transparent", border: "none", color: "#4ecba0", cursor: "pointer", fontSize: 13, padding: 0 }}>✕</button>
                          </span>
                        )}
                        {mpDistrict !== "সব" && (
                          <span style={{ background: "rgba(201,168,76,0.15)", border: "1px solid #C9A84C", borderRadius: 20, padding: "3px 10px", fontSize: 12, color: "#C9A84C", display: "flex", alignItems: "center", gap: 4 }}>
                            📍 {mpDistrict}
                            <button onClick={() => setMpDistrict("সব")} style={{ background: "transparent", border: "none", color: "#C9A84C", cursor: "pointer", fontSize: 13, padding: 0 }}>✕</button>
                          </span>
                        )}
                        <button onClick={() => { setMpDivision("সব"); setMpDistrict("সব"); setSearch(""); }}
                          style={{ background: "transparent", border: "1px solid " + T.border, borderRadius: 20, padding: "3px 10px", fontSize: 11, color: T.textMuted, cursor: "pointer", fontFamily: "sans-serif" }}>
                          সব সরান
                        </button>
                      </div>
                    )}

                    {/* ফলাফল সংখ্যা */}
                    <div style={{ fontSize: 12, color: T.textMuted, marginBottom: 12, display: "flex", justifyContent: "space-between" }}>
                      <span>{filteredMps.length}জন সংসদ সদস্য</span>
                      {mpDivision !== "সব" && <span style={{ color: "#C9A84C" }}>{mpDivision} বিভাগ</span>}
                    </div>        

                    <input placeholder="নাম, আসন বা জেলা..." value={search} onChange={e => setSearch(e.target.value)} style={{ width: "100%", background: T.card, border: "1px solid " + T.border, borderRadius: 8, padding: "10px 14px", color: T.text, fontSize: 14, marginBottom: 16, boxSizing: "border-box", outline: "none" }} />
                    {filteredMps.map((m, i) => (
                      <div key={i} className="card-hover" style={{ background: T.card, border: "1px solid " + T.border, borderRadius: 10, padding: 16, marginBottom: 10, display: "flex", gap: 14, alignItems: "flex-start" }}>
                        <div style={{ width: 48, height: 48, borderRadius: "50%", border: "2px solid #C9A84C", flexShrink: 0, overflow: "hidden", background: "#006A4E", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, cursor: "pointer" }} onClick={() => { setSelectedPerson(m); setPersonType("mp"); }}>
                          {m.photo_url ? <img src={m.photo_url} alt={m.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={e => e.target.style.display = "none"} /> : "🏅"}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 15, fontWeight: "bold", color: T.text }}>{m.name}</div>
                          <div style={{ fontSize: 12, color: "#C9A84C", marginTop: 4 }}>🏅 {m.constituency} · {m.district}</div>
                          <div style={{ fontSize: 12, color: T.textMuted, marginTop: 3 }}>🌾 {m.party}</div>
                          <button onClick={() => { setSelectedPerson(m); setPersonType("mp"); }} style={{ marginTop: 8, background: "transparent", border: "1px solid #C9A84C", borderRadius: 16, padding: "4px 12px", cursor: "pointer", fontSize: 11, color: "#C9A84C", fontFamily: "sans-serif" }}>বিস্তারিত দেখুন →</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {!showDecisions && !showDocuments && activeTab === "projects" && (
                  <div>
                    <h2 style={{ color: "#C9A84C", borderLeft: "4px solid #006A4E", paddingLeft: 10, marginBottom: 16, fontSize: 16 }}>t.projectCount</h2>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 20 }}>
                      {[
                        { label: "চলমান", value: projects.filter(p => p.status === "চলমান").length, color: "#4ecba0" },
                        { label: "নতুন", value: projects.filter(p => p.status === "নতুন").length, color: "#C9A84C" },
                        { label: "সম্পন্ন", value: projects.filter(p => p.status === "সম্পন্ন").length, color: "#3B8BD4" },
                      ].map((s, i) => (
                        <div key={i} style={{ background: T.card, border: "1px solid " + T.border, borderRadius: 8, padding: 12, textAlign: "center" }}>
                          <div style={{ fontSize: 22, fontWeight: "bold", color: s.color }}>{s.value}</div>
                          <div style={{ fontSize: 11, color: T.textMuted, marginTop: 4 }}>{s.label}</div>
                        </div>
                      ))}
                    </div>
                    <div style={{ background: T.card, border: "1px solid " + T.border, borderRadius: 10, padding: 16, marginBottom: 20 }}>
                      <h3 style={{ fontSize: 13, color: "#C9A84C", marginBottom: 14 }}>📈 প্রকল্পের অগ্রগতি তুলনা</h3>
                      {projects.map((p, i) => (
                        <HorizontalBar key={i} label={p.title.length > 20 ? p.title.slice(0, 20) + "..." : p.title} value={p.progress} max={100} color={["#006A4E", "#C9A84C", "#3B8BD4", "#9F5DCF", "#E8593C"][i % 5]} />
                      ))}
                    </div>
                    {projects.map((p, i) => (
                      <div key={i} className="card-hover" style={{ background: T.card, border: "1px solid " + T.border, borderRadius: 10, padding: 18, marginBottom: 12 }}>
                        <div style={{ fontSize: 15, fontWeight: "bold", color: T.text, marginBottom: 8 }}>{p.title}</div>
                        <div style={{ fontSize: 12, color: T.textMuted, marginBottom: 8 }}>📁 {p.ministry}</div>
                        <div style={{ height: 8, background: T.border, borderRadius: 4, overflow: "hidden", marginBottom: 8 }}>
                          <div style={{ height: "100%", width: p.progress + "%", background: "linear-gradient(90deg, #006A4E, #C9A84C)", borderRadius: 4 }} />
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: T.textMuted }}>
                          <span>💰 {p.budget}</span>
                          <span>{p.progress}%</span>
                          <span style={{ color: p.status === "নতুন" ? "#C9A84C" : "#4ecba0" }}>● {p.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {!showDecisions && !showDocuments && activeTab === "activists" && (
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                      <h2 style={{ color: "#C9A84C", borderLeft: "4px solid #006A4E", paddingLeft: 10, fontSize: 16, margin: 0 }}>📣 অ্যাক্টিভিস্ট ভয়েস</h2>
                      <span style={{ fontSize: 12, color: T.textMuted }}>{activistPosts.length}টি পোস্ট</span>
                    </div>
                    <div style={{ background: isDark ? "rgba(0,106,78,0.1)" : "rgba(0,106,78,0.06)", border: "1px solid rgba(0,106,78,0.3)", borderRadius: 10, padding: 14, marginBottom: 16 }}>
                      <div style={{ fontSize: 13, color: T.textMuted }}>🇧🇩 বিএনপিপন্থী অনলাইন অ্যাক্টিভিস্টদের পোস্ট ও মতামত</div>
                    </div>
                    {activistPosts.length === 0 && <div style={{ color: T.textMuted, textAlign: "center", padding: 40 }}>কোনো পোস্ট নেই</div>}
                    {activistPosts.map((post, i) => (
                      <div key={i} className="card-hover" style={{ background: T.card, border: "1px solid " + T.border, borderRadius: 12, padding: 16, marginBottom: 14 }}>
                        <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 12 }}>
                          <div style={{ width: 44, height: 44, borderRadius: "50%", background: "#006A4E", border: "2px solid #C9A84C", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>
                            {post.author_photo ? <img src={post.author_photo} alt={post.author_name} style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={e => e.target.style.display = "none"} /> : "👤"}
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 14, fontWeight: "bold", color: T.text }}>{post.author_name}</div>
                            <div style={{ fontSize: 11, color: T.textMuted }}>{new Date(post.created_at).toLocaleDateString("bn-BD")}</div>
                          </div>
                          {post.author_fb_url && <a href={post.author_fb_url} target="_blank" rel="noreferrer" style={{ background: "#1877F2", color: "#fff", borderRadius: 6, padding: "4px 10px", fontSize: 11, textDecoration: "none" }}>Facebook</a>}
                        </div>
                        <div style={{ fontSize: 14, color: T.text, lineHeight: 1.8, marginBottom: 12 }}>{post.content}</div>
                        {post.image_url && <img src={post.image_url} alt="পোস্ট ছবি" style={{ width: "100%", borderRadius: 8, marginBottom: 12, maxHeight: 300, objectFit: "cover" }} onError={e => e.target.style.display = "none"} />}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid " + T.border, paddingTop: 10 }}>
                          <div style={{ fontSize: 12, color: T.textMuted }}>❤️ {post.likes} জন পছন্দ করেছেন</div>
                          {post.fb_post_url && <a href={post.fb_post_url} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: "#1877F2", textDecoration: "none" }}>মূল পোস্ট দেখুন →</a>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {!showDecisions && !showDocuments && activeTab === "history" && (
                  <div>
                    <h2 style={{ color: "#C9A84C", borderLeft: "4px solid #006A4E", paddingLeft: 10, marginBottom: 20, fontSize: 16 }}>🏛️ বিএনপির ইতিহাস ও নেতৃত্ব</h2>
                    <div style={{ background: T.card, border: "1px solid " + T.border, borderRadius: 12, padding: 16, marginBottom: 24 }}>
                      <h3 style={{ color: "#C9A84C", fontSize: 14, marginBottom: 16 }}>📊 নেতৃত্বের কালপঞ্জি</h3>
                      <div style={{ position: "relative", paddingLeft: 20 }}>
                        <div style={{ position: "absolute", left: 8, top: 0, bottom: 0, width: 2, background: "linear-gradient(180deg, #C9A84C, #006A4E, #C9A84C)" }} />
                        {[
                          { year: "১৯৭৮", event: "বিএনপি প্রতিষ্ঠা", leader: "জিয়াউর রহমান", color: "#C9A84C" },
                          { year: "১৯৭৯", event: "দ্বিতীয় জাতীয় সংসদ নির্বাচনে বিজয়", leader: "জিয়াউর রহমান", color: "#C9A84C" },
                          { year: "১৯৮১", event: "শাহাদত বরণ", leader: "জিয়াউর রহমান", color: "#E8593C" },
                          { year: "১৯৯১", event: "পঞ্চম জাতীয় সংসদ নির্বাচনে বিজয়", leader: "খালেদা জিয়া", color: "#006A4E" },
                          { year: "১৯৯৬", event: "তত্ত্বাবধায়ক সরকার ব্যবস্থা প্রবর্তন", leader: "খালেদা জিয়া", color: "#006A4E" },
                          { year: "২০০১", event: "অষ্টম জাতীয় সংসদ নির্বাচনে বিজয়", leader: "খালেদা জিয়া", color: "#006A4E" },
                          { year: "২০২৬", event: "ত্রয়োদশ জাতীয় সংসদ নির্বাচনে নিরঙ্কুশ বিজয়", leader: "তারেক রহমান", color: "#3B8BD4" },
                        ].map((item, i) => (
                          <div key={i} style={{ display: "flex", gap: 14, marginBottom: 14, position: "relative" }}>
                            <div style={{ position: "absolute", left: -16, top: 4, width: 12, height: 12, borderRadius: "50%", background: item.color, border: "2px solid " + T.card, zIndex: 1 }} />
                            <div style={{ flex: 1, background: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)", borderRadius: 8, padding: "10px 12px" }}>
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 4 }}>
                                <div style={{ fontSize: 13, fontWeight: "bold", color: T.text }}>{item.event}</div>
                                <div style={{ fontSize: 10, color: item.color, background: isDark ? "rgba(0,0,0,0.3)" : "rgba(0,0,0,0.06)", padding: "2px 8px", borderRadius: 10, whiteSpace: "nowrap" }}>{item.year}</div>
                              </div>
                              <div style={{ fontSize: 11, color: T.textMuted, marginTop: 3 }}>👤 {item.leader}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <h3 style={{ color: "#C9A84C", fontSize: 14, marginBottom: 14 }}>👑 শীর্ষ নেতৃত্ব</h3>
                    {leaders.map((leader, i) => (
                      <div key={i} style={{ background: T.card, border: "1px solid " + T.border, borderRadius: 12, marginBottom: 16, overflow: "hidden" }}>
                        <div style={{ background: "linear-gradient(135deg, " + ["#8B6914", "#2D5A3D", "#1A3A5C"][i % 3] + ", " + ["#C9A84C", "#006A4E", "#3B8BD4"][i % 3] + ")", padding: "16px 20px" }}>
                          <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
                            <div style={{ width: 60, height: 60, borderRadius: "50%", border: "3px solid rgba(255,255,255,0.4)", overflow: "hidden", background: "rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, flexShrink: 0 }}>
                              {leader.photo_url ? <img src={leader.photo_url} alt={leader.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={e => e.target.style.display = "none"} /> : ["🎖️", "👩‍💼", "🏛️"][i % 3]}
                            </div>
                            <div>
                              <div style={{ fontSize: 16, fontWeight: "bold", color: "#fff" }}>{leader.name}</div>
                              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.8)", marginTop: 3 }}>{leader.title}</div>
                              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", marginTop: 2 }}>📅 {leader.born}{leader.died ? " — " + leader.died : " — বর্তমান"}</div>
                            </div>
                          </div>
                        </div>
                        <div style={{ padding: "14px 20px" }}>
                          <div style={{ fontSize: 13, color: T.textSecondary, lineHeight: 1.8, marginBottom: 14 }}>{leader.short_bio}</div>
                          {leader.achievements && leader.achievements.length > 0 && (
                            <div style={{ marginBottom: 14 }}>
                              <div style={{ fontSize: 12, color: "#C9A84C", fontWeight: "bold", marginBottom: 8 }}>🏆 উল্লেখযোগ্য অবদান</div>
                              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                                {leader.achievements.map((ach, j) => (
                                  <span key={j} style={{ fontSize: 11, background: isDark ? "rgba(0,106,78,0.2)" : "rgba(0,106,78,0.08)", color: "#4ecba0", border: "1px solid rgba(0,106,78,0.3)", borderRadius: 16, padding: "3px 10px" }}>✓ {ach}</span>
                                ))}
                              </div>
                            </div>
                          )}
                          <button onClick={() => setSelectedLeader(leader)} style={{ background: "transparent", border: "1px solid #C9A84C", borderRadius: 20, padding: "6px 16px", cursor: "pointer", fontSize: 12, color: "#C9A84C", fontFamily: "sans-serif" }}>বিস্তারিত জীবনী পড়ুন →</button>
                        </div>
                      </div>
                    ))}

                    <div style={{ background: T.card, border: "1px solid " + T.border, borderRadius: 12, padding: 16 }}>
                      <h3 style={{ color: "#C9A84C", fontSize: 14, marginBottom: 14 }}>🏛️ বিএনপির সরকারসমূহ</h3>
                      {governments.map((g, i) => (
                        <div key={i} className="card-hover" onClick={() => { setSelectedGovt(g); setGovtTab("ministers"); }} style={{ background: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)", border: "1px solid " + (g.is_current ? "#006A4E" : T.border), borderLeft: "4px solid " + (g.is_current ? "#006A4E" : "#C9A84C"), borderRadius: 8, padding: 12, marginBottom: 8, cursor: "pointer" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <div>
                              <div style={{ fontSize: 13, fontWeight: "bold", color: T.text }}>
                                {g.is_current && <span style={{ background: "#006A4E", color: "#fff", fontSize: 9, padding: "1px 6px", borderRadius: 4, marginRight: 6 }}>বর্তমান</span>}
                                {g.name}
                              </div>
                              <div style={{ fontSize: 11, color: T.textMuted, marginTop: 2 }}>📅 {g.period} · 👤 {g.prime_minister}</div>
                            </div>
                            <span style={{ color: T.textMuted, fontSize: 16 }}>›</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {!showDecisions && !showDocuments && activeTab === "feedback" && (
                  <FeedbackSection T={T} isDark={isDark} t={t} />
                )}

                {!showDecisions && !showDocuments && activeTab === "privacy" && (
                  <div>
                    <h2 style={{ color: "#C9A84C", borderLeft: "4px solid #006A4E", paddingLeft: 10, marginBottom: 20, fontSize: 16 }}>🔒 গোপনীয়তা নীতি</h2>
                    {[
                      { title: "তথ্য সংগ্রহ", content: "আমরা শুধুমাত্র আপনার নাম ও ইমেইল ঐচ্ছিকভাবে সংগ্রহ করি। মন্তব্য ও ফিডব্যাক জমা দিতে এই তথ্য ব্যবহৃত হয়।" },
                      { title: "তথ্য ব্যবহার", content: "সংগৃহীত তথ্য শুধুমাত্র অ্যাপের সেবা উন্নয়নে ব্যবহার করা হয়। কোনো তৃতীয় পক্ষের সাথে শেয়ার করা হয় না।" },
                      { title: "তথ্য সুরক্ষা", content: "Supabase-এর নিরাপদ অবকাঠামোতে সকল তথ্য সংরক্ষিত। SSL এনক্রিপশন ব্যবহার করা হয়।" },
                      { title: "কুকি", content: "আমরা শুধুমাত্র ব্যবহারকারীর থিম ও ভাষা পছন্দ সংরক্ষণে localStorage ব্যবহার করি।" },
                      { title: "তথ্য মুছে ফেলা", content: "আপনার অ্যাকাউন্ট ও তথ্য মুছে ফেলতে admin@commanderbd.com এ যোগাযোগ করুন।" },
                      { title: "যোগাযোগ", content: "গোপনীয়তা সংক্রান্ত যেকোনো প্রশ্নে Commander Enterprise BD, Agrabad, Chittagong এ যোগাযোগ করুন।" },
                    ].map((item, i) => (
                      <div key={i} style={{ background: T.card, border: "1px solid " + T.border, borderLeft: "4px solid #006A4E", borderRadius: 8, padding: 16, marginBottom: 12 }}>
                        <div style={{ fontSize: 14, fontWeight: "bold", color: "#C9A84C", marginBottom: 8 }}>🔹 {item.title}</div>
                        <div style={{ fontSize: 13, color: T.textSecondary, lineHeight: 1.8 }}>{item.content}</div>
                      </div>
                    ))}
                    <div style={{ background: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)", borderRadius: 8, padding: 14, marginTop: 16, textAlign: "center" }}>
                      <div style={{ fontSize: 12, color: T.textMuted }}>সর্বশেষ আপডেট: জুলাই ২০২৬ · Commander Enterprise BD</div>
                    </div>
                  </div>
                )}

              </div>
            )}
          </div>
        )}

        {/* মোবাইল বটম নেভিগেশন */}
        <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: isDark ? "#0a1520" : "#E0EAF4", borderTop: "2px solid #C9A84C", display: "flex", justifyContent: "space-around", padding: "8px 0 12px", zIndex: 150, boxShadow: "0 -4px 20px rgba(0,0,0,0.3)" }}>
          {[
            { id: "home", icon: "🏠", label: "হোম" },
            { id: "news", icon: "📰", label: "সংবাদ" },
            { id: "ministers", icon: "👥", label: "মন্ত্রিসভা" },
            { id: "feedback", icon: "💬", label: "মতামত" },
            { id: "search", icon: "🔍", label: "সার্চ" },
          ].map(item => (
            <button key={item.id} onClick={() => {
              if (item.id === "search") { setShowSearch(true); setGlobalSearch(""); }
              else { setActiveTab(item.id); setSelectedGovt(null); setShowDecisions(false); setShowDocuments(false); window.scrollTo({ top: 0, behavior: "smooth" }); }
            }} style={{ background: "transparent", border: "none", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 3, padding: "4px 12px", opacity: activeTab === item.id ? 1 : 0.6, transition: "opacity 0.2s" }}>
              <span style={{ fontSize: 22 }}>{item.icon}</span>
              <span style={{ fontSize: 11, fontFamily: "sans-serif", color: activeTab === item.id ? "#C9A84C" : T.textMuted, fontWeight: activeTab === item.id ? "bold" : "normal" }}>{item.label}</span>
              {activeTab === item.id && <div style={{ width: 4, height: 4, borderRadius: "50%", background: "#C9A84C" }} />}
            </button>
          ))}
        </div>

        {/* Footer */}
        <div style={{ background: isDark ? "#070f18" : "#E0EAF4", borderTop: "2px solid #C9A84C", padding: "20px", marginTop: 40 }}>
          <div style={{ maxWidth: 700, margin: "0 auto" }}>
            <div style={{ textAlign: "center", marginBottom: 16 }}>
              <div style={{ fontSize: 16, fontWeight: "bold", color: "#C9A84C", marginBottom: 4 }}>🇧🇩 গণপ্রজাতন্ত্রী বাংলাদেশ সরকার</div>
              <div style={{ fontSize: 12, color: T.textMuted }}>ত্রয়োদশ জাতীয় সংসদ · বিএনপি সরকার ২০২৬</div>
            </div>
            <div style={{ display: "flex", justifyContent: "center", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
              {[
                { label: "🏠 হোম", tab: "home" },
                { label: "📰 সংবাদ", tab: "news" },
                { label: "👥 মন্ত্রিসভা", tab: "ministers" },
                { label: "🏅 এমপি", tab: "mps" },
                { label: "💬 ফিডব্যাক", tab: "feedback" },
                { label: "🔒 গোপনীয়তা", tab: "privacy" },
              ].map((item, i) => (
                <button key={i} onClick={() => { setActiveTab(item.tab); setSelectedGovt(null); setShowDecisions(false); setShowDocuments(false); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                  style={{ background: "transparent", border: "1px solid " + T.border, borderRadius: 20, padding: "4px 12px", cursor: "pointer", fontSize: 12, color: T.textMuted, fontFamily: "sans-serif" }}>
                  {item.label}
                </button>
              ))}
            </div>
            <div style={{ height: 1, background: T.border, margin: "12px 0" }} />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
              <div style={{ fontSize: 11, color: T.textMuted }}>© ২০২৬ Commander Enterprise BD · সর্বস্বত্ব সংরক্ষিত</div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => { setActiveTab("feedback"); window.scrollTo({ top: 0, behavior: "smooth" }); }} style={{ background: "transparent", border: "1px solid " + T.border, borderRadius: 6, padding: "4px 10px", cursor: "pointer", fontSize: 11, color: T.textMuted, fontFamily: "sans-serif" }}>💬 ফিডব্যাক</button>
                <button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} style={{ background: "#006A4E", border: "none", borderRadius: 6, padding: "4px 10px", cursor: "pointer", fontSize: 11, color: "#fff", fontFamily: "sans-serif" }}>↑ উপরে যান</button>
              </div>
            </div>
            <div style={{ fontSize: 10, color: T.textMuted, textAlign: "center", marginTop: 10, opacity: 0.7 }}>এই অ্যাপটি সরকারিভাবে অনুমোদিত নয় — তথ্য সংকলনমূলক উদ্যোগ</div>
          </div>
        </div>

      </div>
    </>
  );
}