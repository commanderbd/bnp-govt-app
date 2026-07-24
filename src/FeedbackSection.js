import { useState, useEffect } from "react";
import { supabase } from "./supabase";

function StarRating({ value, onChange, readOnly = false }) {
  const [hover, setHover] = useState(0);
  return (
    <div style={{ display: "flex", gap: 4 }}>
      {[1, 2, 3, 4, 5].map(star => (
        <span key={star}
          onClick={() => !readOnly && onChange(star)}
          onMouseEnter={() => !readOnly && setHover(star)}
          onMouseLeave={() => !readOnly && setHover(0)}
          style={{
            fontSize: readOnly ? 16 : 28,
            cursor: readOnly ? "default" : "pointer",
            color: star <= (hover || value) ? "#C9A84C" : "#1e3348",
            transition: "color 0.1s"
          }}>★</span>
      ))}
    </div>
  );
}

export default function FeedbackSection({ T, isDark, t }) {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [activeTab, setActiveTab] = useState("view");

  const [form, setForm] = useState({
    name: "",
    category: "সাধারণ মতামত",
    rating: 0,
    message: ""
  });
  const [errors, setErrors] = useState({});

  const categories = [
    "সাধারণ মতামত", "সরকারি সেবা", "উন্নয়ন প্রকল্প",
    "সংবাদ", "মন্ত্রিসভা", "সংসদ", "অর্থনীতি", "অন্যান্য"
  ];

  useEffect(() => { fetchFeedback(); }, []);

  async function fetchFeedback() {
    setLoading(true);
    const { data } = await supabase
      .from("feedback")
      .select("*")
      .eq("status", "approved")
      .order("created_at", { ascending: false })
      .limit(20);
    setFeedbacks(data || []);
    setLoading(false);
  }

  function validate() {
    const e = {};
    if (!form.message.trim()) e.message = "মতামত লিখুন";
    if (form.rating === 0) e.rating = "রেটিং দিন";
    if (form.message.trim().length < 10) e.message = "কমপক্ষে ১০টি অক্ষর লিখুন";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;
    setSubmitting(true);
    const { error } = await supabase.from("feedback").insert({
      name: form.name.trim() || "নাম প্রকাশে অনিচ্ছুক",
      category: form.category,
      rating: form.rating,
      message: form.message.trim(),
      status: "pending"
    });
    if (!error) {
      setSubmitted(true);
      setForm({ name: "", category: "সাধারণ মতামত", rating: 0, message: "" });
    }
    setSubmitting(false);
  }

  const avgRating = feedbacks.length > 0
    ? (feedbacks.reduce((sum, f) => sum + f.rating, 0) / feedbacks.length).toFixed(1)
    : "০";

  const ratingCounts = [5, 4, 3, 2, 1].map(star => ({
    star,
    count: feedbacks.filter(f => f.rating === star).length,
    pct: feedbacks.length > 0
      ? Math.round((feedbacks.filter(f => f.rating === star).length / feedbacks.length) * 100)
      : 0
  }));

  const inputStyle = {
    width: "100%", background: T.bg,
    border: `1px solid ${T.border}`, borderRadius: 8,
    padding: "10px 14px", color: T.text,
    fontSize: 14, boxSizing: "border-box",
    outline: "none", fontFamily: "sans-serif",
    marginBottom: 10
  };

  return (
    <div>
      <h2 style={{ color: "#C9A84C", borderLeft: "4px solid #006A4E", paddingLeft: 10, marginBottom: 16, fontSize: 16 }}>
        💬 নাগরিক ফিডব্যাক
      </h2>

      {/* রেটিং সারসংক্ষেপ */}
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 16, marginBottom: 20 }}>
        <div style={{ display: "flex", gap: 20, alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 48, fontWeight: "bold", color: "#C9A84C", lineHeight: 1 }}>{avgRating}</div>
            <StarRating value={Math.round(Number(avgRating))} readOnly />
            <div style={{ fontSize: 12, color: T.textMuted, marginTop: 4 }}>{feedbacks.length}টি মতামত</div>
          </div>
          <div style={{ flex: 1, minWidth: 200 }}>
            {ratingCounts.map(({ star, count, pct }) => (
              <div key={star} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <span style={{ fontSize: 12, color: T.textMuted, width: 16 }}>{star}</span>
                <span style={{ color: "#C9A84C", fontSize: 12 }}>★</span>
                <div style={{ flex: 1, height: 8, background: T.border, borderRadius: 4, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${pct}%`, background: "#C9A84C", borderRadius: 4, transition: "width 0.6s ease" }} />
                </div>
                <span style={{ fontSize: 12, color: T.textMuted, width: 24, textAlign: "right" }}>{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ট্যাব */}
      <div style={{ display: "flex", gap: 4, marginBottom: 16 }}>
        {[
          { id: "view", label: "💬 মতামত দেখুন" },
          { id: "submit", label: "✍️ মতামত দিন" },
        ].map(tab => (
          <button key={tab.id} onClick={() => { setActiveTab(tab.id); setSubmitted(false); }} style={{
            background: activeTab === tab.id ? "#006A4E" : "transparent",
            border: `1px solid ${activeTab === tab.id ? "#006A4E" : T.border}`,
            borderRadius: 20, padding: "6px 16px",
            cursor: "pointer", fontSize: 13,
            color: activeTab === tab.id ? "#fff" : T.textMuted,
            fontFamily: "sans-serif"
          }}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* মতামত দেখুন */}
      {activeTab === "view" && (
        <div>
          {loading && <div style={{ color: T.textMuted, textAlign: "center", padding: 30 }}>⏳ লোড হচ্ছে...</div>}
          {!loading && feedbacks.length === 0 && (
            <div style={{ color: T.textMuted, textAlign: "center", padding: 40 }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>💬</div>
              এখনো কোনো মতামত নেই
            </div>
          )}
          {feedbacks.map((f, i) => (
            <div key={i} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16, marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: "bold", color: T.text }}>{f.name}</div>
                  <div style={{ fontSize: 11, color: "#C9A84C", marginTop: 2 }}>{f.category}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <StarRating value={f.rating} readOnly />
                  <div style={{ fontSize: 11, color: T.textMuted, marginTop: 2 }}>
                    {new Date(f.created_at).toLocaleDateString("bn-BD")}
                  </div>
                </div>
              </div>
              <div style={{ fontSize: 13, color: T.textSecondary, lineHeight: 1.7, borderTop: `1px solid ${T.border}`, paddingTop: 8 }}>
                "{f.message}"
              </div>
            </div>
          ))}
        </div>
      )}

      {/* মতামত দিন */}
      {activeTab === "submit" && (
        <div>
          {submitted ? (
            <div style={{ background: "rgba(0,106,78,0.15)", border: "1px solid #006A4E", borderRadius: 12, padding: 30, textAlign: "center" }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
              <div style={{ fontSize: 16, fontWeight: "bold", color: "#4ecba0", marginBottom: 8 }}>ধন্যবাদ!</div>
              <div style={{ fontSize: 13, color: T.textMuted, marginBottom: 16 }}>
                আপনার মতামত সফলভাবে জমা হয়েছে।<br/>
                অনুমোদনের পর এখানে দেখানো হবে।
              </div>
              <button onClick={() => { setSubmitted(false); setActiveTab("view"); }}
                style={{ background: "#006A4E", color: "#fff", border: "none", borderRadius: 8, padding: "10px 24px", cursor: "pointer", fontSize: 14, fontFamily: "sans-serif" }}>
                মতামত দেখুন
              </button>
            </div>
          ) : (
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>

              {/* নাম */}
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 13, color: T.textMuted, marginBottom: 6 }}>আপনার নাম (ঐচ্ছিক)</div>
                <input placeholder="নাম না দিলে 'নাম প্রকাশে অনিচ্ছুক' থাকবে"
                  value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                  style={inputStyle} />
              </div>

              {/* ক্যাটাগরি */}
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 13, color: T.textMuted, marginBottom: 6 }}>বিষয়</div>
                <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
                  style={inputStyle}>
                  {categories.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>

              {/* রেটিং */}
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 13, color: T.textMuted, marginBottom: 8 }}>
                  রেটিং দিন <span style={{ color: "#c0392b" }}>*</span>
                </div>
                <StarRating value={form.rating} onChange={v => setForm({ ...form, rating: v })} />
                {errors.rating && <div style={{ color: "#ff8a8a", fontSize: 12, marginTop: 4 }}>⚠️ {errors.rating}</div>}
              </div>

              {/* মতামত */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 13, color: T.textMuted, marginBottom: 6 }}>
                  আপনার মতামত <span style={{ color: "#c0392b" }}>*</span>
                </div>
                <textarea placeholder="সরকারের কার্যক্রম, অ্যাপ বা যেকোনো বিষয়ে আপনার মতামত লিখুন..."
                  value={form.message} onChange={e => setForm({ ...form, message: e.target.value })}
                  rows={4} style={{ ...inputStyle, resize: "vertical", marginBottom: 0 }} />
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
                  {errors.message
                    ? <div style={{ color: "#ff8a8a", fontSize: 12 }}>⚠️ {errors.message}</div>
                    : <div />}
                  <div style={{ fontSize: 12, color: T.textMuted }}>{form.message.length} অক্ষর</div>
                </div>
              </div>

              <button onClick={handleSubmit} disabled={submitting} style={{
                width: "100%", background: "#006A4E", color: "#fff",
                border: "none", borderRadius: 8, padding: "12px",
                cursor: submitting ? "wait" : "pointer",
                fontSize: 14, fontWeight: "bold", fontFamily: "sans-serif"
              }}>
                {submitting ? "⏳ জমা হচ্ছে..." : "✅ মতামত জমা দিন"}
              </button>

              <div style={{ fontSize: 11, color: T.textMuted, textAlign: "center", marginTop: 10 }}>
                মতামত পর্যালোচনার পর প্রকাশিত হবে
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}