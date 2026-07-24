import { useState, useEffect } from "react";
import { supabase } from "./supabase";

export default function CommentsSection({ newsId, user, onLoginRequest, T, isDark }) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (newsId) fetchComments();
  }, [newsId]);

  async function fetchComments() {
    setLoading(true);
    const { data } = await supabase
      .from("comments")
      .select("*")
      .eq("news_id", newsId)
      .eq("status", "approved")
      .order("created_at", { ascending: true });
    setComments(data || []);
    setLoading(false);
  }

  async function submitComment() {
    if (!message.trim()) return setError("মন্তব্য লিখুন");
    if (message.trim().length < 3) return setError("কমপক্ষে ৩টি অক্ষর লিখুন");
    if (!user) return onLoginRequest();
    setSubmitting(true);
    setError("");
    const { error } = await supabase.from("comments").insert({
      news_id: newsId,
      user_id: user.id,
      user_name: user.user_metadata?.full_name || user.email?.split("@")[0] || "ব্যবহারকারী",
      user_email: user.email,
      message: message.trim(),
      status: "approved"
    });
    if (error) {
      setError("মন্তব্য করতে সমস্যা হয়েছে");
    } else {
      setMessage("");
      fetchComments();
    }
    setSubmitting(false);
  }

  async function deleteComment(id) {
    if (!window.confirm("মন্তব্য মুছবেন?")) return;
    await supabase.from("comments").delete().eq("id", id);
    fetchComments();
  }

  function timeAgo(dateStr) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(mins / 60);
    const days = Math.floor(hours / 24);
    if (days > 0) return `${days} দিন আগে`;
    if (hours > 0) return `${hours} ঘণ্টা আগে`;
    if (mins > 0) return `${mins} মিনিট আগে`;
    return "এইমাত্র";
  }

  return (
    <div style={{ borderTop: `1px solid ${T.border}`, marginTop: 16, paddingTop: 16 }}>
      <div style={{ fontSize: 13, fontWeight: "bold", color: T.text, marginBottom: 14 }}>
        💬 মন্তব্য {comments.length > 0 && <span style={{ color: T.textMuted, fontWeight: "normal" }}>({comments.length}টি)</span>}
      </div>

      {/* মন্তব্য লেখার বক্স */}
      {user ? (
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
            <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#006A4E", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, color: "#fff", flexShrink: 0, fontWeight: "bold" }}>
              {(user.user_metadata?.full_name || user.email || "U")[0].toUpperCase()}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, color: "#C9A84C", marginBottom: 6 }}>
                {user.user_metadata?.full_name || user.email?.split("@")[0]}
              </div>
              <textarea
                placeholder="আপনার মন্তব্য লিখুন..."
                value={message}
                onChange={e => setMessage(e.target.value)}
                rows={3}
                style={{ width: "100%", background: T.bg, border: `1px solid ${error ? "#c0392b" : T.border}`, borderRadius: 8, padding: "10px 12px", color: T.text, fontSize: 13, resize: "none", fontFamily: "sans-serif", boxSizing: "border-box", outline: "none" }}
              />
              {error && <div style={{ color: "#ff8a8a", fontSize: 11, marginTop: 4 }}>⚠️ {error}</div>}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
                <span style={{ fontSize: 11, color: T.textMuted }}>{message.length} অক্ষর</span>
                <button onClick={submitComment} disabled={submitting || !message.trim()}
                  style={{ background: message.trim() ? "#006A4E" : "#1e3348", color: "#fff", border: "none", borderRadius: 8, padding: "7px 16px", cursor: message.trim() ? "pointer" : "default", fontSize: 12, fontFamily: "sans-serif" }}>
                  {submitting ? "⏳" : "মন্তব্য করুন"}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div style={{ background: isDark ? "rgba(0,106,78,0.1)" : "rgba(0,106,78,0.06)", border: "1px solid rgba(0,106,78,0.3)", borderRadius: 10, padding: 14, marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
          <div style={{ fontSize: 13, color: T.textMuted }}>💬 মন্তব্য করতে লগইন করুন</div>
          <button onClick={onLoginRequest}
            style={{ background: "#006A4E", color: "#fff", border: "none", borderRadius: 8, padding: "7px 16px", cursor: "pointer", fontSize: 13, whiteSpace: "nowrap", fontFamily: "sans-serif" }}>
            লগইন করুন
          </button>
        </div>
      )}

      {/* মন্তব্য তালিকা */}
      {loading && <div style={{ color: T.textMuted, fontSize: 13, textAlign: "center", padding: 16 }}>⏳ লোড হচ্ছে...</div>}

      {!loading && comments.length === 0 && (
        <div style={{ textAlign: "center", padding: 20, color: T.textMuted, fontSize: 13 }}>
          এখনো কোনো মন্তব্য নেই — প্রথম মন্তব্য করুন!
        </div>
      )}

      {comments.map((c, i) => (
        <div key={i} style={{ display: "flex", gap: 10, marginBottom: 14 }}>
          <div style={{ width: 34, height: 34, borderRadius: "50%", background: `hsl(${c.user_name.charCodeAt(0) * 13 % 360}, 50%, 40%)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, color: "#fff", flexShrink: 0, fontWeight: "bold" }}>
            {c.user_name[0].toUpperCase()}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)", borderRadius: "0 10px 10px 10px", padding: "10px 12px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                <div style={{ fontSize: 12, fontWeight: "bold", color: T.text }}>{c.user_name}</div>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <div style={{ fontSize: 10, color: T.textMuted }}>{timeAgo(c.created_at)}</div>
                  {user && user.id === c.user_id && (
                    <button onClick={() => deleteComment(c.id)} style={{ background: "transparent", border: "none", color: "#c0392b", cursor: "pointer", fontSize: 11, padding: 0 }}>🗑️</button>
                  )}
                </div>
              </div>
              <div style={{ fontSize: 13, color: T.textSecondary, lineHeight: 1.6 }}>{c.message}</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}