import { useState } from "react";
import { supabase } from "./supabase";

export default function AuthModal({ onClose, onSuccess, T, isDark }) {
  const [step, setStep] = useState("choose");
  const [method, setMethod] = useState("email");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [otpSent, setOtpSent] = useState(false);

  const inputStyle = {
    width: "100%", background: T.bg,
    border: `1px solid ${T.border}`, borderRadius: 8,
    padding: "12px 14px", color: T.text,
    fontSize: 14, boxSizing: "border-box",
    outline: "none", fontFamily: "sans-serif",
    marginBottom: 10
  };

  async function sendOTP() {
    if (!name.trim()) return setError("নাম লিখুন");
    setLoading(true);
    setError("");
    try {
      if (method === "email") {
        if (!email.includes("@")) return setError("সঠিক ইমেইল লিখুন");
        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: { data: { full_name: name } }
        });
        if (error) throw error;
        setOtpSent(true);
        setStep("otp");
      }
    } catch (err) {
      setError(err.message || "সমস্যা হয়েছে, আবার চেষ্টা করুন");
    }
    setLoading(false);
  }

  async function verifyOTP() {
    if (!otp.trim()) return setError("OTP লিখুন");
    setLoading(true);
    setError("");
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: "email"
      });
      if (error) throw error;
      if (data.user) {
        await supabase.auth.updateUser({ data: { full_name: name } });
        onSuccess(data.user);
        onClose();
      }
    } catch (err) {
      setError("OTP ভুল হয়েছে, আবার চেষ্টা করুন");
    }
    setLoading(false);
  }

  return (
    <div onClick={onClose} style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.75)", zIndex: 500, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: T.card, border: "2px solid #006A4E", borderRadius: 16, width: "100%", maxWidth: 380 }}>

        {/* হেডার */}
        <div style={{ background: "linear-gradient(135deg, #006A4E, #004d38)", padding: "16px 20px", borderRadius: "14px 14px 0 0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: "bold", color: "#fff" }}>🇧🇩 অ্যাকাউন্ট তৈরি / লগইন</div>
            <div style={{ fontSize: 11, color: "#C9A84C", marginTop: 3 }}>মন্তব্য করতে লগইন করুন</div>
          </div>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,0.15)", border: "none", borderRadius: "50%", width: 30, height: 30, cursor: "pointer", color: "#fff", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
        </div>

        <div style={{ padding: 20 }}>
          {step === "choose" && (
            <div>
              <div style={{ fontSize: 13, color: T.textMuted, marginBottom: 16, textAlign: "center" }}>
                আপনার নাম ও ইমেইল দিয়ে সহজেই অ্যাকাউন্ট তৈরি করুন
              </div>

              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 12, color: T.textMuted, marginBottom: 6 }}>আপনার নাম *</div>
                <input placeholder="আপনার নাম লিখুন" value={name} onChange={e => setName(e.target.value)} style={inputStyle} />
              </div>

              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 12, color: T.textMuted, marginBottom: 6 }}>ইমেইল ঠিকানা *</div>
                <input type="email" placeholder="example@email.com" value={email} onChange={e => setEmail(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && sendOTP()}
                  style={inputStyle} />
              </div>

              {error && <div style={{ color: "#ff8a8a", fontSize: 12, marginBottom: 10, textAlign: "center" }}>⚠️ {error}</div>}

              <button onClick={sendOTP} disabled={loading} style={{ width: "100%", background: "#006A4E", color: "#fff", border: "none", borderRadius: 8, padding: "12px", cursor: "pointer", fontSize: 14, fontWeight: "bold", fontFamily: "sans-serif" }}>
                {loading ? "⏳ পাঠানো হচ্ছে..." : "📧 OTP পাঠান"}
              </button>

              <div style={{ fontSize: 11, color: T.textMuted, textAlign: "center", marginTop: 12, lineHeight: 1.6 }}>
                আপনার ইমেইলে একটি ৬ সংখ্যার কোড পাঠানো হবে।<br/>নতুন অ্যাকাউন্ট স্বয়ংক্রিয়ভাবে তৈরি হবে।
              </div>
            </div>
          )}

          {step === "otp" && (
            <div>
              <div style={{ textAlign: "center", marginBottom: 20 }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>📧</div>
                <div style={{ fontSize: 14, fontWeight: "bold", color: T.text, marginBottom: 6 }}>OTP যাচাই করুন</div>
                <div style={{ fontSize: 12, color: T.textMuted }}>
                  <span style={{ color: "#C9A84C" }}>{email}</span> এ একটি ৬ সংখ্যার কোড পাঠানো হয়েছে
                </div>
              </div>

              <input placeholder="৬ সংখ্যার কোড লিখুন" value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                onKeyDown={e => e.key === "Enter" && verifyOTP()}
                style={{ ...inputStyle, textAlign: "center", fontSize: 20, letterSpacing: 8, fontWeight: "bold" }} />

              {error && <div style={{ color: "#ff8a8a", fontSize: 12, marginBottom: 10, textAlign: "center" }}>⚠️ {error}</div>}

              <button onClick={verifyOTP} disabled={loading || otp.length < 6} style={{ width: "100%", background: otp.length === 6 ? "#006A4E" : "#1e3348", color: "#fff", border: "none", borderRadius: 8, padding: "12px", cursor: otp.length === 6 ? "pointer" : "default", fontSize: 14, fontWeight: "bold", fontFamily: "sans-serif", marginBottom: 10 }}>
                {loading ? "⏳ যাচাই হচ্ছে..." : "✅ যাচাই করুন"}
              </button>

              <button onClick={() => { setStep("choose"); setOtp(""); setError(""); }} style={{ width: "100%", background: "transparent", border: `1px solid ${T.border}`, borderRadius: 8, padding: "10px", cursor: "pointer", fontSize: 13, color: T.textMuted, fontFamily: "sans-serif" }}>
                ← পেছনে যান
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}