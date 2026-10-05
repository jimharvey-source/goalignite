import { useState, useEffect, useRef } from "react";

// The way back to the app, from the header and from the end of every result.
const DASHBOARD_URL = "https://app.management-ignition.com/";
// PDF file names: tool, person, then what the work is about, so a saved file says what it is.
const pdfName = (...parts) => parts
  .map(s => String(s || "").replace(/[\\/:*?"<>|]+/g, " ").replace(/\s+/g, " ").trim().slice(0, 60).trim())
  .filter(Boolean).join(" - ") + ".pdf";

import {
  createSuiteClient,
  personIdFromUrl,
  loadPerson,
  hasSuiteAccess,
  saveToolSession,
  parseSharpened,
} from "./mi-session.js";

const supabase = createSuiteClient({
  url: "https://fdiitxhgfytvlbtokbok.supabase.co",
  anonKey: "sb_publishable_JQMFDaTz5g-2ZlitosUTeA_C9B48-Lc",
});

// Management Ignition design system, 4 October 2026. Same names, new values.
// Teal (accent) is the method speaking: never a button fill, never a link.
// The tool colour is an identity mark only: the 3px top line.
const COLORS = {
  navy: "#1b2a4a",        // ink: headlines, primary buttons
  navyMid: "#2a3d63",     // ink-2: body copy
  blue: "#2a3d63",
  blueLight: "#eef2f6",
  teal: "#0e7c7b",        // accent (was Goal green)
  tealLight: "#e9f3f3",   // accent-soft; text on it is ink
  slate: "#5d6b7f",
  slateLight: "#f6f8fb",  // canvas
  border: "#e2e7ee",      // rule
  text: "#1b2a4a",
  muted: "#5d6b7f",
  white: "#ffffff",
  amber: "#8a5300",       // warn
  amberLight: "#fff3e0",
  red: "#b3261e",         // danger
  green: "#1e6b45",
  greenLight: "#e8f4ec",
  canvas: "#f6f8fb",
  sunk: "#eef2f6",
  tool: "#4caf50",        // Goal Ignite
};

// Names arrive as typed. "joyce adams" shows as "Joyce Adams". Display only.
const displayName = (s) => String(s || "").trim().split(/\s+/).map(w => w ? w.charAt(0).toUpperCase() + w.slice(1) : w).join(" ");

const FONT = {
  sans: '"Instrument Sans", -apple-system, "SF Pro Text", "Segoe UI", Helvetica, Arial, sans-serif',
  spoken: 'Fraunces, "Iowan Old Style", Georgia, serif',
};
const SHADOW = "0 1px 2px rgba(27,42,74,0.05), 0 18px 44px -28px rgba(27,42,74,0.30)";

const GOAL_TYPE_INFO = {
  SMART: { label: "SMART Goal", icon: "", desc: "Specific, Measurable, Achievable, Relevant, Timed. Best for structured thinkers and short-to-medium term goals.", color: COLORS.blue, colorLight: COLORS.blueLight },
  Descriptive: { label: "Descriptive Goal", icon: "", desc: "A vivid written vision of the desired future state. Best for creative thinkers and longer-term ambitions.", color: COLORS.teal, colorLight: COLORS.tealLight },
  NLP: { label: "NLP Outcome", icon: "", desc: "Issue → Outcome → Resources → Objections. Best for people who need both vision and structured accountability.", color: COLORS.navyMid, colorLight: COLORS.sunk },
};

function getChallengeZone(stretchLevel, skillLevel, confidenceLevel) {
  const highSkill = skillLevel === "High", medSkill = skillLevel === "Medium";
  const highConf = confidenceLevel === "High", medConf = confidenceLevel === "Medium", lowConf = confidenceLevel === "Low";
  const highStretch = stretchLevel === "High", medStretch = stretchLevel === "Medium";

  if (highStretch && highSkill && highConf) return { zone: "Growth Zone", color: COLORS.green, colorLight: COLORS.greenLight, icon: "", summary: "High challenge, high capability. This is the ideal stretch — ambitious enough to drive real development, achievable enough to succeed with commitment.", managerGuidance: "This person is ready for a genuine stretch. Set the goal boldly, agree a clear success picture, and then give them the room to work. Your role here is available coach, not close supervisor. Check in regularly but resist the urge to direct.", supportLevel: "High support available, applied lightly." };
  if (highStretch && (medSkill || highSkill) && (medConf || highConf)) return { zone: "Growth Zone", color: COLORS.green, colorLight: COLORS.greenLight, icon: "", summary: "Good capability meeting genuine stretch. Strong development territory — the goal will push them, and with the right support they will grow into it.", managerGuidance: "A real stretch for a capable person. Set the goal clearly and discuss honestly that it is meant to push them. Build in regular check-ins and make it easy to raise blockers early.", supportLevel: "Regular structured support. Weekly check-ins, clear escalation path." };
  if (highStretch && (!highSkill || !highConf)) return { zone: "Danger Zone", color: COLORS.red, colorLight: "#FEF2F2", icon: "", summary: "High stretch combined with lower skill or confidence creates real risk. Without active support, this goal is likely to damage confidence rather than build it.", managerGuidance: "Think carefully before proceeding with this level of stretch. If you do, the support structure must be intensive. Consider stepping down the stretch level and building up progressively.", supportLevel: "Intensive support required. Consider reducing stretch level first." };
  if (medStretch && (highSkill || medSkill) && (highConf || medConf)) return { zone: "Growth Zone", color: COLORS.green, colorLight: COLORS.greenLight, icon: "", summary: "Moderate stretch matched well to capability. Solid development goal — enough challenge to produce growth without excessive risk.", managerGuidance: "Good balance. Set the goal clearly, agree the success criteria, and give them the space to work. Regular light-touch check-ins are enough.", supportLevel: "Light-touch support. Fortnightly reviews, available on request." };
  if (!highStretch && !medStretch) return { zone: "Coasting", color: COLORS.amber, colorLight: COLORS.amberLight, icon: "", summary: "Low stretch for a capable person produces compliance, not growth. They may complete the goal, but they will not develop from it — and they will notice.", managerGuidance: "Raise the bar. A low-stretch goal for a capable person is a missed development opportunity and can signal that you underestimate them.", supportLevel: "Low support needed — but consider whether the goal itself needs revisiting." };
  return { zone: "Moderate Challenge", color: COLORS.teal, colorLight: COLORS.tealLight, icon: "", summary: "Reasonable challenge level. Not quite the growth zone but solid and productive. Consider whether you could push the stretch slightly.", managerGuidance: "A reasonable goal. Consider whether you could push the stretch level slightly without tipping into the danger zone.", supportLevel: "Moderate support. Weekly light check-ins, available for ad hoc questions." };
}

function getCadenceGuidance(stretchLevel, skillLevel, confidenceLevel, goalTimeframe) {
  const highStretch = stretchLevel === "High", medStretch = stretchLevel === "Medium";
  const highSkill = skillLevel === "High", lowSkill = skillLevel === "Low";
  const lowConf = confidenceLevel === "Low", medConf = confidenceLevel === "Medium", highConf = confidenceLevel === "High";
  const longTerm = goalTimeframe === "Long-term (6+ months)", medTerm = goalTimeframe === "Medium-term (1–6 months)";

  if (highStretch && lowSkill) return { frequency: "Weekly coaching conversations", format: "Structured 30-minute session with agreed action points and written log", rationale: "High stretch with developing skill requires active, close coaching. Weekly contact catches problems early and builds capability progressively.", managerNote: "Hold weekly 30-minute coaching sessions. Come prepared with 2-3 questions: what progress has been made, what obstacles have emerged, what is the next decision to face. Keep a simple written log of actions agreed.", delegateeNote: "I would like us to meet weekly to work through this goal together — 30 minutes, with a short written update from you beforehand covering progress, blockers, and anything you would like to think through." };
  if (highStretch && (medConf || lowConf)) return { frequency: "Weekly check-in with mid-week availability", format: "Weekly structured conversation plus an open channel for ad hoc contact", rationale: "A stretch goal with lower confidence needs consistent contact to prevent the self-doubt spiral before it starts.", managerNote: "Schedule weekly check-ins and make it explicit that you are available between sessions. Proactively reach out if you have not heard from them.", delegateeNote: "Let us keep weekly check-ins in place while you are working on this. I am also available between sessions if you want to think something through." };
  if (highStretch && highSkill && highConf) return { frequency: "Fortnightly review with monthly deep review", format: "Brief written update fortnightly, 45-minute development conversation monthly", rationale: "A capable, confident person on a stretch goal does not need close oversight but does need space to reflect and connect the work back to their development.", managerNote: "Trust them to work and check in fortnightly with a brief written update. Once a month have a proper development conversation — not just how is it going but what are they learning and how are they growing.", delegateeNote: "I would like a brief written update every fortnight. Then once a month let us have a proper conversation about how things are going and what you are learning." };
  if (medStretch && longTerm) return { frequency: "Monthly structured review", format: "30-minute progress review with written summary and actions", rationale: "A medium-stretch long-term goal needs a regular rhythm to prevent drift. Monthly is enough to maintain momentum without creating overhead.", managerNote: "Monthly reviews — 30 minutes, structured. Ask about progress against milestones, obstacles encountered, and what support is needed.", delegateeNote: "Let us keep a monthly review in the diary for this. Come with an update on milestones, any obstacles you have hit, and what you need from me." };
  if (medStretch && medTerm) return { frequency: "Every 3 weeks", format: "Structured progress conversation with milestone check", rationale: "Three-weekly contact balances momentum with autonomy — close enough to catch drift, light enough not to crowd the person.", managerNote: "A session every three weeks — focused on milestones and blockers. Ask one good question: what is the thing most likely to get in the way between now and when we next speak?", delegateeNote: "Let us check in every three weeks. Come with a milestone update and any blockers. If something significant comes up between sessions, just flag it." };
  if (!highStretch && highSkill && highConf) return { frequency: "At key milestones only", format: "Brief update at each milestone, conversation at completion", rationale: "A capable, confident person on a lower-stretch goal does not need managing. A milestone structure keeps you informed without implying oversight they do not need.", managerNote: "Set the milestones at the outset and ask for a brief update at each one. Stay available but do not manufacture contact.", delegateeNote: "I would like a brief update at each milestone. Otherwise this is yours to run. If anything significant shifts, just let me know." };
  return { frequency: "Monthly check-in", format: "Brief structured conversation or written update", rationale: "Regular monthly contact keeps the goal alive and visible without adding unnecessary overhead.", managerNote: "A monthly check-in — keep it focused. Progress, blockers, what is needed. Stay available for ad hoc contact if something comes up.", delegateeNote: "Let us keep a monthly check-in in place. Brief and purposeful — progress, anything that is getting in the way, anything you need from me." };
}

function generateICS({ goalTitle, personName, managerName, cadence }) {
  const freq = cadence.frequency.toLowerCase();
  let rrule = "RRULE:FREQ=MONTHLY", durationMins = 30;
  if (freq.includes("every 3 weeks")) { rrule = "RRULE:FREQ=WEEKLY;INTERVAL=3"; }
  else if (freq.includes("fortnightly")) { rrule = "RRULE:FREQ=WEEKLY;INTERVAL=2"; }
  else if (freq.includes("weekly")) { rrule = "RRULE:FREQ=WEEKLY"; }
  const now = new Date(), start = new Date(now);
  start.setDate(now.getDate() + 7);
  const day = start.getDay();
  if (day === 0) start.setDate(start.getDate() + 1);
  if (day === 6) start.setDate(start.getDate() + 2);
  start.setHours(9, 0, 0, 0);
  const end = new Date(start.getTime() + durationMins * 60000);
  const pad = (n) => String(n).padStart(2, "0");
  const fmt = (d) => `${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;
  const lines = ["BEGIN:VCALENDAR","VERSION:2.0","PRODID:-//The Message Business//GoalIgnite//EN","CALSCALE:GREGORIAN","METHOD:PUBLISH","BEGIN:VEVENT",`UID:goalignite-${Date.now()}@themessagebusiness.com`,`SUMMARY:Goal review: ${goalTitle} — ${personName}`,`DTSTART:${fmt(start)}`,`DTEND:${fmt(end)}`,`DESCRIPTION:${cadence.managerNote.replace(/\n/g,"\\n")}`,`ORGANIZER;CN=${managerName}:mailto:organizer@goalignite.app`,rrule,"STATUS:CONFIRMED","BEGIN:VALARM","TRIGGER:-PT15M","ACTION:DISPLAY","DESCRIPTION:Reminder","END:VALARM","END:VEVENT","END:VCALENDAR"].join("\r\n");
  const blob = new Blob([lines], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = `goalignite-${personName.replace(/\s+/g,"-").toLowerCase()}.ics`;
  document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
}

function getUsageCount() { try { return parseInt(localStorage.getItem("gi_usage") || "0"); } catch { return 0; } }
function incrementUsage() { try { localStorage.setItem("gi_usage", String(getUsageCount() + 1)); } catch {} }
function getSavedGoals() { try { return JSON.parse(localStorage.getItem("gi_saved") || "[]"); } catch { return []; } }
function saveLocalGoal(data) { try { const s = getSavedGoals(); s.unshift({...data, id: Date.now(), date: new Date().toLocaleDateString("en-GB")}); localStorage.setItem("gi_saved", JSON.stringify(s.slice(0,20))); } catch {} }

const FREE_LIMIT = 3;

function Badge({ color, children }) {
  const styles = { blue:{bg:COLORS.sunk,text:COLORS.navyMid}, teal:{bg:COLORS.tealLight,text:COLORS.navy}, amber:{bg:COLORS.amberLight,text:COLORS.amber}, green:{bg:COLORS.greenLight,text:COLORS.green}, purple:{bg:COLORS.sunk,text:COLORS.navyMid} };
  const s = styles[color] || styles.blue;
  return <span style={{background:s.bg,color:s.text,fontSize:12,fontWeight:600,padding:"3px 10px",borderRadius:999,letterSpacing:"0.01em",fontFamily:FONT.sans}}>{children}</span>;
}

function OutputBox({ title, content, badge, spoken }) {
  const [copied, setCopied] = useState(false);
  const [text, setText] = useState(content);
  useEffect(() => { setText(content); }, [content]);
  const copy = () => { navigator.clipboard.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); }); };
  const emailIt = () => { const s=encodeURIComponent(`Goal Ignite: ${title}`), b=encodeURIComponent(text), a=document.createElement("a"); a.href=`mailto:?subject=${s}&body=${b}`; a.target="_blank"; document.body.appendChild(a); a.click(); document.body.removeChild(a); };
  const shareIt = async () => { if (navigator.share) { try { await navigator.share({title:`Goal Ignite: ${title}`,text}); } catch { emailIt(); } } else { emailIt(); } };
  return (
    <div style={{background:COLORS.white,border:`1px solid ${COLORS.border}`,borderRadius:10,overflow:"hidden",marginBottom:16}}>
      <div style={{padding:"14px 20px",borderBottom:`1px solid ${COLORS.border}`,display:"flex",justifyContent:"space-between",alignItems:"center",gap:12,flexWrap:"wrap",background:COLORS.white}}>
        <div style={{display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
          <span style={{fontSize:16,fontWeight:600,color:COLORS.navy}}>{title}</span>
          {badge && <Badge color={badge.color}>{badge.label}</Badge>}
        </div>
        <div style={{display:"flex",gap:8}}>
          <button onClick={copy} style={{fontSize:13,minHeight:36,padding:"0 14px",border:`1px solid ${COLORS.border}`,borderRadius:10,background:copied?COLORS.greenLight:COLORS.white,color:copied?COLORS.green:COLORS.navy,cursor:"pointer",fontWeight:500,fontFamily:FONT.sans}}>{copied?"Copied":"Copy"}</button>
          <button onClick={shareIt} style={{fontSize:13,minHeight:36,padding:"0 14px",border:`1px solid ${COLORS.border}`,borderRadius:10,background:COLORS.white,color:COLORS.navy,cursor:"pointer",fontWeight:500,fontFamily:FONT.sans}}>Share</button>
        </div>
      </div>
      <textarea value={text} onChange={e=>setText(e.target.value)} style={spoken
        ? {width:"100%",minHeight:320,padding:"24px 28px",border:"none",outline:"none",resize:"vertical",fontSize:19,lineHeight:"30px",color:COLORS.navy,fontFamily:FONT.spoken,fontVariationSettings:'"SOFT" 0, "WONK" 0',fontWeight:400,boxSizing:"border-box",background:COLORS.white}
        : {width:"100%",minHeight:280,padding:"20px 24px",border:"none",outline:"none",resize:"vertical",fontSize:15,lineHeight:1.65,color:COLORS.navyMid,fontFamily:FONT.sans,boxSizing:"border-box",background:COLORS.white}} />
    </div>
  );
}

function TextField({ label, value, onChange, placeholder, multiline, required }) {
  const style = {width:"100%",minHeight:44,padding:"10px 16px",border:`1px solid ${COLORS.border}`,borderRadius:10,fontSize:15,color:COLORS.text,background:COLORS.white,boxSizing:"border-box",fontFamily:FONT.sans};
  return (
    <div style={{marginBottom:16}}>
      {label && <label style={{display:"block",fontSize:13,fontWeight:600,letterSpacing:"0.01em",color:COLORS.muted,marginBottom:8}}>{label}{required && <span style={{color:COLORS.red}}> *</span>}</label>}
      {multiline ? <textarea value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} rows={3} style={{...style,resize:"vertical"}} /> : <input type="text" value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} style={style} />}
    </div>
  );
}

function ToggleGroup({ label, value, onChange, options }) {
  return (
    <div style={{marginBottom:16}}>
      <label style={{display:"block",fontSize:13,fontWeight:600,letterSpacing:"0.01em",color:COLORS.muted,marginBottom:8}}>{label}</label>
      <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
        {options.map(o => (
          <button key={o.value} onClick={() => onChange(o.value)} aria-pressed={value===o.value} style={{minHeight:40,padding:"0 18px",border:`1px solid ${value===o.value?COLORS.navy:COLORS.border}`,boxShadow:value===o.value?`inset 0 0 0 1px ${COLORS.navy}`:"none",borderRadius:10,background:value===o.value?COLORS.sunk:COLORS.white,color:COLORS.navy,fontSize:14,fontWeight:value===o.value?600:400,cursor:"pointer",fontFamily:FONT.sans,transition:"all 0.15s"}}>{o.label}</button>
        ))}
      </div>
    </div>
  );
}

function AuthModal({ onClose }) {
  const [email, setEmail] = useState(""), [sent, setSent] = useState(false), [loading, setLoading] = useState(false), [error, setError] = useState("");
  const send = async () => { if (!email.trim()) { setError("Please enter your email."); return; } setLoading(true); setError(""); const {error:e} = await supabase.auth.signInWithOtp({email:email.trim(),options:{emailRedirectTo:window.location.origin}}); if(e){setError(e.message);setLoading(false);return;} setSent(true); setLoading(false); };
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(27,42,74,0.55)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000,padding:20}}>
      <div style={{background:COLORS.white,borderRadius:22,boxShadow:SHADOW,padding:"40px 36px",maxWidth:420,width:"100%"}}>
        {!sent ? (<>
          <div style={{textAlign:"center",marginBottom:24}}>
            <h2 style={{fontSize:20,fontWeight:700,color:COLORS.navy,margin:"0 0 8px",fontFamily:FONT.sans}}>Sign in to Goal Ignite</h2>
            <p style={{fontSize:14,color:COLORS.muted,margin:0,fontFamily:FONT.sans,lineHeight:1.6}}>Enter your email and we will send you a magic link. No password needed.</p>
          </div>
          <input type="email" value={email} onChange={e=>setEmail(e.target.value)} onKeyDown={e=>e.key==="Enter"&&send()} placeholder="your@email.com" style={{width:"100%",minHeight:44,padding:"10px 16px",border:`1px solid ${COLORS.border}`,borderRadius:10,fontSize:15,color:COLORS.text,boxSizing:"border-box",fontFamily:FONT.sans,marginBottom:12}} />
          {error && <p style={{fontSize:13,color:COLORS.red,margin:"0 0 10px",fontFamily:FONT.sans}}>{error}</p>}
          <button onClick={send} disabled={loading} style={{width:"100%",minHeight:44,padding:"0 24px",background:COLORS.navy,color:"#fff",border:"none",borderRadius:10,fontSize:15,fontWeight:600,cursor:loading?"not-allowed":"pointer",fontFamily:FONT.sans,marginBottom:10}}>{loading?"Sending...":"Send magic link"}</button>
          <button onClick={onClose} style={{width:"100%",background:"none",border:"none",color:COLORS.muted,fontSize:13,cursor:"pointer",padding:4,fontFamily:FONT.sans}}>Cancel</button>
        </>) : (
          <div style={{textAlign:"center"}}>
            <h2 style={{fontSize:20,fontWeight:700,color:COLORS.navy,margin:"0 0 10px",fontFamily:FONT.sans}}>Check your email</h2>
            <p style={{fontSize:14,color:COLORS.muted,lineHeight:1.6,margin:"0 0 20px",fontFamily:FONT.sans}}>We sent a magic link to <strong>{email}</strong>.</p>
            <button onClick={onClose} style={{background:"none",border:"none",color:COLORS.muted,fontSize:13,cursor:"pointer",fontFamily:FONT.sans}}>Close</button>
          </div>
        )}
      </div>
    </div>
  );
}

function UpgradeModal({ onClose, triggered }) {
  const [loadingPlan, setLoadingPlan] = useState(null), [checkoutError, setCheckoutError] = useState("");
  const plans = [{id:"monthly",name:"Monthly",price:"£4.99",period:"/month",desc:"Full access, cancel anytime.",highlight:false},{id:"annual",name:"Annual",price:"£59.99",period:"/year",desc:"Best value: two months free.",highlight:true},{id:"lifetime",name:"Lifetime",price:"£49.99",period:"one-off",desc:"Pay once, use forever.",highlight:false}];
  const handleCheckout = async (planId) => { setLoadingPlan(planId); setCheckoutError(""); try { const r=await fetch("/api/stripe-checkout",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({plan:planId,origin:window.location.origin})}); const d=await r.json(); if(d.url){window.location.href=d.url;}else{setCheckoutError("Something went wrong.");setLoadingPlan(null);} } catch { setCheckoutError("Something went wrong.");setLoadingPlan(null); } };
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(27,42,74,0.55)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000,padding:20}}>
      <div style={{background:COLORS.white,borderRadius:22,boxShadow:SHADOW,padding:"40px 36px",maxWidth:520,width:"100%"}}>
        <div style={{textAlign:"center",marginBottom:28}}>
          <h2 style={{fontSize:22,fontWeight:700,color:COLORS.navy,margin:"0 0 8px",fontFamily:FONT.sans}}>{triggered==="limit"?"You have used your 3 free goals":triggered==="pdf"?"Download this as a branded PDF":"Goal Ignite Pro"}</h2>
          <p style={{fontSize:14,color:COLORS.muted,margin:0,lineHeight:1.6,fontFamily:FONT.sans}}>{triggered==="pdf"?"Pro lets you download the complete goal, inputs, challenge zone, cadence, and both the advice and the brief, as a branded PDF for your records.":"Unlimited goals, challenge zone analysis, calendar integration, and full coaching guides."}</p>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:20}}>
          {plans.map(plan => (
            <div key={plan.id} style={{border:`1px solid ${plan.highlight?COLORS.navy:COLORS.border}`,boxShadow:plan.highlight?`inset 0 0 0 1px ${COLORS.navy}`:"none",borderRadius:10,padding:"14px 18px",display:"flex",alignItems:"center",justifyContent:"space-between",background:COLORS.white,gap:12,flexWrap:"wrap"}}>
              <div style={{flex:1}}>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:2}}><span style={{fontSize:14,fontWeight:700,color:COLORS.navy,fontFamily:FONT.sans}}>{plan.name}</span>{plan.highlight&&<Badge color="teal">Most popular</Badge>}</div>
                <p style={{fontSize:12.5,color:COLORS.muted,margin:0,fontFamily:FONT.sans}}>{plan.desc}</p>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:12,flexShrink:0}}>
                <div style={{textAlign:"right"}}><span style={{fontSize:18,fontWeight:700,color:COLORS.navy,fontFamily:FONT.sans}}>{plan.price}</span><span style={{fontSize:12,color:COLORS.muted,fontFamily:FONT.sans}}> {plan.period}</span></div>
                <button onClick={()=>handleCheckout(plan.id)} disabled={!!loadingPlan} style={{minHeight:40,padding:"0 18px",background:plan.highlight?COLORS.navy:COLORS.white,color:plan.highlight?"#fff":COLORS.navy,border:`1px solid ${plan.highlight?COLORS.navy:COLORS.border}`,borderRadius:10,fontSize:13,fontWeight:600,cursor:loadingPlan?"not-allowed":"pointer",fontFamily:FONT.sans,opacity:loadingPlan&&loadingPlan!==plan.id?0.5:1,minWidth:80}}>{loadingPlan===plan.id?"...":"Select"}</button>
              </div>
            </div>
          ))}
        </div>
        {checkoutError && <p style={{fontSize:13,color:COLORS.red,textAlign:"center",margin:"0 0 12px",fontFamily:FONT.sans}}>{checkoutError}</p>}
        <div style={{borderTop:`1px solid ${COLORS.border}`,paddingTop:16,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <p style={{fontSize:12,color:COLORS.muted,margin:0,fontFamily:FONT.sans}}>Secure payment by Stripe. Cancel anytime.</p>
          <button onClick={onClose} style={{background:"none",border:"none",color:COLORS.muted,fontSize:13,cursor:"pointer",padding:4,fontFamily:FONT.sans}}>Maybe later</button>
        </div>
      </div>
    </div>
  );
}

function HistoryPanel({ items, onClose }) {
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(27,42,74,0.45)",display:"flex",alignItems:"flex-start",justifyContent:"flex-end",zIndex:1000}}>
      <div style={{background:COLORS.white,width:"100%",maxWidth:460,height:"100vh",overflowY:"auto",padding:"28px 24px"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24}}>
          <h3 style={{fontSize:18,fontWeight:700,color:COLORS.navy,margin:0}}>Saved goals</h3>
          <button onClick={onClose} aria-label="Close" style={{background:"none",border:"none",fontSize:24,minWidth:44,minHeight:44,cursor:"pointer",color:COLORS.navy,fontFamily:FONT.sans}}>×</button>
        </div>
        {items.length===0 ? <p style={{color:COLORS.muted,fontSize:14}}>No saved goals yet.</p> : items.map(item => (
          <div key={item.id} style={{border:`1px solid ${COLORS.border}`,borderRadius:10,padding:"14px 16px",marginBottom:12}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
              <span style={{fontSize:14,fontWeight:600,color:COLORS.navy}}>{item.goalTitle||"Untitled goal"}</span>
              <span style={{fontSize:12,color:COLORS.muted}}>{item.date||new Date(item.created_at).toLocaleDateString("en-GB")}</span>
            </div>
            <p style={{fontSize:13,color:COLORS.muted,margin:"0 0 6px"}}>{item.managerName} to {item.personName}</p>
            {item.goalType && <Badge color="teal">{item.goalType}</Badge>}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function GoalIgnite() {
  const [form, setForm] = useState({ managerName:"", personName:"", goalTitle:"", goalDescription:"", successCriteria:"", deadline:"", goalTimeframe:"", stretchLevel:"", skillLevel:"", confidenceLevel:"", goalType:"", saveLocally:false });
  const [result, setResult] = useState(null);
  const [person, setPerson] = useState(null);
  const [saveState, setSaveState] = useState("idle");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [upgradeTrigger, setUpgradeTrigger] = useState("manual");
  const [showHistory, setShowHistory] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [usageCount, setUsageCount] = useState(getUsageCount());
  const [history, setHistory] = useState(getSavedGoals());
  const [isPro, setIsPro] = useState(() => { try { return localStorage.getItem("gi_pro")==="true"; } catch { return false; } });
  const [showSuccessBanner, setShowSuccessBanner] = useState(false);
  const [user, setUser] = useState(null);
  const [goalCheck, setGoalCheck] = useState(null);
  const [sharpenedGoal, setSharpenedGoal] = useState("");
  const [goalAccepted, setGoalAccepted] = useState(false);
  const [challengeZone, setChallengeZone] = useState(null);
  const [cadence, setCadence] = useState(null);
  const resultsRef = useRef(null);
  const f = (k) => (v) => setForm(p => ({...p, [k]:v}));

  useEffect(() => {
    supabase.auth.getSession().then(({data:{session}}) => { if(session?.user){setUser(session.user);} });
    const {data:{subscription}} = supabase.auth.onAuthStateChange((_,session) => { if(session?.user){setUser(session.user);}else{setUser(null);} });
    return () => subscription.unsubscribe();
  }, []);

  // The suite. Who is signed in, do they have access, and which person are
  // they working on. Entitlement is one call now, replacing the local flag.
  useEffect(() => {
    if (!user) { setPerson(null); return; }
    let cancelled = false;

    (async () => {
      const paid = await hasSuiteAccess(supabase);
      if (!cancelled && paid) setIsPro(true);

      const p = await loadPerson(supabase, personIdFromUrl());
      if (cancelled || !p) return;
      setPerson(p);

      setForm(prev => ({
        ...prev,
        personName: prev.personName
          || [p.first_name, p.last_name].filter(Boolean).join(" "),
      }));
    })();

    return () => { cancelled = true; };
  }, [user]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if(params.get("session_id")){try{localStorage.setItem("gi_pro","true");}catch{} setIsPro(true);setShowSuccessBanner(true);window.history.replaceState({},"","/");setTimeout(()=>setShowSuccessBanner(false),6000);}
    if(params.get("cancelled")) window.history.replaceState({},"","/");
  }, []);

  useEffect(() => {
    if(form.stretchLevel&&form.skillLevel&&form.confidenceLevel){
      setChallengeZone(getChallengeZone(form.stretchLevel,form.skillLevel,form.confidenceLevel));
      setCadence(getCadenceGuidance(form.stretchLevel,form.skillLevel,form.confidenceLevel,form.goalTimeframe));
    } else { setChallengeZone(null); setCadence(null); }
  }, [form.stretchLevel,form.skillLevel,form.confidenceLevel,form.goalTimeframe]);

  const validate = () => {
    if(!form.managerName.trim()) return "Manager name is required.";
    if(!form.personName.trim()) return "Person name is required.";
    if(!form.goalTitle.trim()) return "Goal title is required.";
    if(!form.goalDescription.trim()) return "Goal description is required.";
    if(!form.stretchLevel) return "Please select a stretch level.";
    if(!form.skillLevel) return "Please select a skill level.";
    if(!form.confidenceLevel) return "Please select a confidence level.";
    return null;
  };

  const buildCheckPrompt = () => `You are reviewing a manager's goal description before they generate a goal-setting guide.

GOAL TITLE: ${form.goalTitle}
GOAL DESCRIPTION: ${form.goalDescription}
SUCCESS CRITERIA: ${form.successCriteria||"Not specified"}

Decide whether the goal is specific enough to produce useful guidance.

A goal is TOO VAGUE if it describes intention rather than outcome, has no measurable success criteria, or could apply to almost anyone.
A goal is SPECIFIC ENOUGH if it describes a clear outcome and has some indication of what success looks like.

Respond in EXACTLY this format:

STATUS: [PASS or FAIL]
REASON: [One plain sentence.]
SHARPENED: [If FAIL, rewrite as outcome-focused. If PASS, repeat original unchanged. Give it as a single short paragraph and write nothing after it.]`;

  const buildPrompt = (desc) => {
    const zone = getChallengeZone(form.stretchLevel,form.skillLevel,form.confidenceLevel);
    const c = getCadenceGuidance(form.stretchLevel,form.skillLevel,form.confidenceLevel,form.goalTimeframe);
    const gtInfo = GOAL_TYPE_INFO[form.goalType]||null;
    return `You are an expert goal-setting coach. Generate detailed, practical goal-setting guidance.

INPUTS:
- Manager: ${form.managerName}
- Person: ${form.personName}
- Goal title: ${form.goalTitle}
- Goal description: ${desc}
- Success criteria: ${form.successCriteria||"Not specified"}
- Deadline: ${form.deadline||"Not specified"}
- Goal timeframe: ${form.goalTimeframe||"Not specified"}
- Stretch level: ${form.stretchLevel}
- Skill level: ${form.skillLevel}
- Confidence level: ${form.confidenceLevel}
- Preferred goal type: ${form.goalType||"Not specified — recommend one"}

CHALLENGE ZONE:
- Zone: ${zone.zone}
- Summary: ${zone.summary}
- Manager guidance: ${zone.managerGuidance}
- Support level: ${zone.supportLevel}

REVIEW CADENCE (use exactly):
- Frequency: ${c.frequency}
- Format: ${c.format}
- Rationale: ${c.rationale}
- Manager note: ${c.managerNote}
- Person note: ${c.delegateeNote}

GOAL TYPES:
- SMART: Specific, Measurable, Achievable, Relevant, Timed. Best for structured thinkers.
- Descriptive: Vivid written vision of the desired future state, written as if already achieved. Best for creative thinkers and bigger ambitions.
- NLP: Issue → Outcome → Resources → Objections. Best for people who need both vision and accountability.

${gtInfo?`Manager requested: ${gtInfo.label}`:"Recommend the most appropriate goal type."}

COACHING MODES: Direct (low skill/confidence), Coaching (developing skill/confidence), Supporting (high skill/lower confidence), Delegating (high skill/high confidence).

FIVE STEPS:
1. Right goal for this person — one step beyond current capability
2. Right goal type — match format to thinking style
3. Set it together, not to them
4. Make support explicit before it is needed
5. Build in honest feedback from the start

OUTPUT RULES (apply to every section below, without exception):
- Plain text only. No markdown of any kind. No asterisks for bold or emphasis, no ## or ### headings, no hyphen, asterisk, or bullet lists, no backticks. If you need to separate points, use short paragraphs, or a numbered list written inline as "1. ... 2. ... 3. ...".
- No exclamation marks anywhere.
- No rallying-cry or cheerleading closings. Do not end on lines like "you've got this", "you'll smash it", "this is your chance to shine", or "I believe in you". Close on something concrete and useful: the next step, the first action, or the date you will next speak. Confidence comes from the substance of the plan, not from encouragement bolted on the end.
- UK English throughout. Plain, direct, warm. Active voice.
- Do not use em dashes in the output: use a comma, a colon, or a full stop instead. Do not use the words "leverage", "empower", "unlock", "journey", "delve", "robust", "seamless", "inspire", or the phrase "moving forward".
- Write to and about ${form.personName} by first name. Do not feed evaluative ratings back to the reader: never write "your low confidence" or "given your medium skill". Write the implication instead (for example, "this goal will stretch you, so we will keep the check-ins close at first").

YOUR RESPONSE MUST USE EXACTLY THIS FORMAT:

GOAL_TYPE: [SMART, Descriptive, or NLP — one word]

COACHING_MODE: [Direct, Coaching, Supporting, or Delegating — one word]

GOAL_SETTING_ADVICE:
[Practical guidance for ${form.managerName} using the five steps above. Include goal type rationale, challenge zone implications, coaching mode application, and cadence woven naturally in. Minimum 400 words.]

GOAL_BRIEF:
[Written goal brief for ${form.personName}. First-person manager voice. Include goal in appropriate format, what success looks like, timeframe, level of challenge, support structure, and what to do if obstacles arise. Warm and plain. The warmth comes from being specific about the support on offer and honest about the challenge, not from praise or encouragement. Minimum 350 words.]

GOAL_TEMPLATE:
[Write the goal itself — fully drafted in the recommended format (SMART, Descriptive, or NLP Outcome). Fill in everything you can from the inputs above: the title, the description, the deadline, the timeframe, the success criteria, and anything else already supplied. Only leave a gap, shown as [square brackets], where the answer genuinely depends on something the person must supply themselves — a personal measure, their own motivation, a commitment only they can make, a specific milestone date not yet agreed. Do not leave a bracket where the input already gives you the answer. The gaps that remain should be the ones worth discussing together. If the recommended format is SMART, write the five elements as a numbered list, each one starting with its label and a colon in plain text, exactly like this: "1. Specific: ..." then "2. Measurable: ..." and so on. Never put asterisks, bold, or any other markup around the labels — the label is plain text followed by a colon. Begin with a brief note (one or two sentences, plain text, no markdown) explaining what the template is and how to use it. The template should feel like a working document — something the manager can take into the goal-setting conversation and complete together with ${form.personName}.]`;
  };

  const generate = async () => {
    const err = validate(); if(err){setError(err);return;}
    if(!isPro&&usageCount>=FREE_LIMIT){setUpgradeTrigger("limit");setShowUpgrade(true);return;}
    setError("");
    if(!goalAccepted){
      setLoading(true); setGoalCheck(null);
      try {
        const r=await fetch("/api/generate",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({messages:[{role:"user",content:buildCheckPrompt()}]})});
        const d=await r.json(); const text=d.choices?.[0]?.message?.content||"";
        const status=(text.match(/STATUS:\s*(PASS|FAIL)/i)?.[1]||"PASS").toUpperCase();
        const reason=text.match(/REASON:\s*(.+)/i)?.[1]?.trim()||"";
        const sharpened=parseSharpened(text, form.goalDescription);
        if(status==="PASS"){setSharpenedGoal(form.goalDescription);setGoalAccepted(true);await runGenerate(form.goalDescription);}
        else{setGoalCheck({reason,sharpened});setSharpenedGoal(sharpened);setLoading(false);}
      } catch { setError("Something went wrong. Please try again."); setLoading(false); }
      return;
    }
    await runGenerate(sharpenedGoal||form.goalDescription);
  };

  const runGenerate = async (desc) => {
    setLoading(true); setResult(null);
    try {
      const r=await fetch("/api/generate",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({messages:[{role:"user",content:buildPrompt(desc)}]})});
      const d=await r.json(); const text=d.choices?.[0]?.message?.content||"";
      const goalType=text.match(/GOAL_TYPE:\s*(\w+)/i)?.[1]||form.goalType||"SMART";
      const coachingMode=text.match(/COACHING_MODE:\s*(\w+)/i)?.[1]||"Coaching";
      const adviceStart=text.search(/GOAL_SETTING_ADVICE:/i);
      const briefStart=text.search(/GOAL_BRIEF:/i);
      const templateStart=text.search(/GOAL_TEMPLATE:/i);
      let advice="", brief="", goalTemplate="";
      if(adviceStart!==-1&&briefStart!==-1&&briefStart>adviceStart){
        advice=text.slice(adviceStart+"GOAL_SETTING_ADVICE:".length,briefStart).trim();
        if(templateStart!==-1&&templateStart>briefStart){
          brief=text.slice(briefStart+"GOAL_BRIEF:".length,templateStart).trim();
          goalTemplate=text.slice(templateStart+"GOAL_TEMPLATE:".length).trim();
        } else {
          brief=text.slice(briefStart+"GOAL_BRIEF:".length).trim();
        }
      } else if(adviceStart!==-1){advice=text.slice(adviceStart+"GOAL_SETTING_ADVICE:".length).trim();}
      else{advice=text.trim();}
      const parsed = { goalType, coachingMode, advice:advice||text, brief, goalTemplate, goalTitle:form.goalTitle, managerName:form.managerName, personName:form.personName, cadence:getCadenceGuidance(form.stretchLevel,form.skillLevel,form.confidenceLevel,form.goalTimeframe), challengeZone:getChallengeZone(form.stretchLevel,form.skillLevel,form.confidenceLevel) };
      setResult(parsed);
      if(!isPro){incrementUsage();setUsageCount(getUsageCount());}
      if(form.saveLocally){saveLocalGoal({goalTitle:parsed.goalTitle,managerName:parsed.managerName,personName:parsed.personName,goalType:parsed.goalType});setHistory(getSavedGoals());}
      setTimeout(()=>resultsRef.current?.scrollIntoView({behavior:"smooth"}),100);
    } catch { setError("Something went wrong. Please try again."); }
    finally { setLoading(false); }
  };

  const resetAll = () => { setGoalCheck(null);setSharpenedGoal("");setGoalAccepted(false);setResult(null);window.scrollTo({top:0,behavior:"smooth"}); };

  const saveToPerson = async () => {
    if (!result || !person) return;
    setSaveState("saving");

    const { error: saveError } = await saveToolSession(supabase, {
      tool: "goal",
      personId: person.id,
      title: result.goalTitle,
      inputs: form,
      outputs: {
        advice: result.advice,
        brief: result.brief,
        goalTemplate: result.goalTemplate,
        goalType: result.goalType,
        coachingMode: result.coachingMode,
        cadence: result.cadence,
        challengeZone: result.challengeZone,
      },
    });

    if (saveError) {
      setSaveState("idle");
      setError("That could not be saved to the person record.");
      return;
    }
    setSaveState("saved");
  };

  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const downloadPdf = async () => {
    if (!result) return;
    if (!isPro) { setUpgradeTrigger("pdf"); setShowUpgrade(true); return; }
    setDownloadingPdf(true);
    try {
      const res = await fetch("/api/generate-pdf", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tool: "goal", form, result }) });
      if (!res.ok) throw new Error("PDF generation failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = pdfName("Goal Ignite", result.personName || form.personName, form.goalTitle);
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError("The PDF could not be generated. Please try again.");
    } finally {
      setDownloadingPdf(false);
    }
  };
  const signOut = async () => { await supabase.auth.signOut();setUser(null);setIsPro(false);try{localStorage.removeItem("gi_pro");}catch{} };
  const remaining = isPro?null:Math.max(0,FREE_LIMIT-usageCount);

  return (
    <div style={{fontFamily:FONT.sans,background:COLORS.canvas,color:COLORS.text,minHeight:"100vh"}}>
      {showUpgrade && <UpgradeModal onClose={()=>setShowUpgrade(false)} triggered={upgradeTrigger} />}
      {showHistory && <HistoryPanel items={history} onClose={()=>setShowHistory(false)} />}
      {showAuth && <AuthModal onClose={()=>setShowAuth(false)} />}
      {showSuccessBanner && <div style={{background:COLORS.tealLight,padding:"12px 24px",textAlign:"center"}}><p style={{fontSize:14,fontWeight:600,color:COLORS.navy,margin:0,fontFamily:FONT.sans}}>Payment successful. You now have unlimited access to Goal Ignite Pro.</p></div>}

      {/* Header */}
      <div style={{height:3,background:COLORS.tool}} />
      <div style={{background:COLORS.canvas,borderBottom:`1px solid ${COLORS.border}`,padding:"0 24px"}}>
        <div style={{maxWidth:800,margin:"0 auto",display:"flex",justifyContent:"space-between",alignItems:"center",minHeight:68,gap:12,flexWrap:"wrap",padding:"10px 0"}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <img src="/mi-mark.svg" alt="" width="26" height="26" style={{display:"block"}} />
            <span style={{fontSize:18,fontWeight:600,color:COLORS.navy,letterSpacing:"-0.02em"}}>Goal Ignite</span>
            <Badge color={isPro?"green":"blue"}>{isPro?"Pro":"Beta"}</Badge>
          </div>
          <div style={{display:"flex",gap:10,alignItems:"center",flexWrap:"wrap"}}>
            <a href={DASHBOARD_URL} style={{background:"none",border:"none",color:COLORS.navyMid,fontSize:14,fontWeight:500,cursor:"pointer",padding:"8px 6px",fontFamily:FONT.sans,textDecoration:"none"}}>Back to dashboard</a>
            <button onClick={()=>setShowHistory(true)} style={{background:"none",border:"none",color:COLORS.navyMid,fontSize:14,fontWeight:500,cursor:"pointer",padding:"8px 6px",fontFamily:FONT.sans}}>History</button>
            {user?(<><span style={{fontSize:13,color:COLORS.muted,fontFamily:FONT.sans}}>{user.email}</span><button onClick={signOut} style={{background:COLORS.white,border:`1px solid ${COLORS.border}`,borderRadius:10,minHeight:36,padding:"0 14px",fontSize:14,color:COLORS.navy,fontFamily:FONT.sans,cursor:"pointer"}}>Sign out</button></>):(<button onClick={()=>setShowAuth(true)} style={{background:COLORS.white,border:`1px solid ${COLORS.border}`,borderRadius:10,minHeight:36,padding:"0 14px",fontSize:14,color:COLORS.navy,fontFamily:FONT.sans,cursor:"pointer"}}>Sign in</button>)}
            {!isPro&&(<><span style={{background:COLORS.sunk,borderRadius:999,padding:"4px 12px",fontSize:13,color:COLORS.navyMid,fontFamily:FONT.sans}}>{remaining} free {remaining===1?"use":"uses"} left</span><button onClick={()=>{setUpgradeTrigger("manual");setShowUpgrade(true);}} style={{background:COLORS.navy,border:"none",borderRadius:10,minHeight:36,padding:"0 16px",fontSize:14,color:"#fff",fontFamily:FONT.sans,fontWeight:600,cursor:"pointer"}}>Upgrade</button></>)}
          </div>
        </div>
      </div>

      {/* Hero */}
      <div style={{background:COLORS.canvas}}>
        <div style={{maxWidth:800,margin:"0 auto",padding:"48px 24px 8px"}}>
          <h1 style={{fontSize:"clamp(32px, 6vw, 40px)",fontWeight:600,color:COLORS.navy,margin:"0 0 12px",lineHeight:1.1,letterSpacing:"-0.03em"}}>Set better goals.<br/>Every time.</h1>
          <p style={{fontSize:18,lineHeight:"28px",color:COLORS.navyMid,margin:0,maxWidth:"40rem",fontFamily:FONT.sans}}>Match the goal to the person. Get a practical goal-setting guide and a ready-to-use goal brief in seconds.</p>
        </div>
      </div>

      <div style={{maxWidth:800,margin:"0 auto",padding:"28px 24px 60px"}}>

        {/* Form */}
        <div style={{background:COLORS.white,borderRadius:22,boxShadow:SHADOW,padding:"clamp(24px, 5vw, 48px)",marginBottom:32}}>
          <h2 style={{fontSize:20,fontWeight:600,letterSpacing:"-0.01em",color:COLORS.navy,margin:"0 0 24px",fontFamily:FONT.sans}}>The goal</h2>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit, minmax(220px, 1fr))",gap:"0 20px"}}>
            <TextField label="Manager name" value={form.managerName} onChange={f("managerName")} placeholder="Your name" required />
            <TextField label="Person's name" value={form.personName} onChange={f("personName")} placeholder="Their name" required />
          </div>
          <TextField label="Goal title" value={form.goalTitle} onChange={f("goalTitle")} placeholder="e.g. Lead the Q3 client review process independently" required />
          <TextField label="Goal description" value={form.goalDescription} onChange={f("goalDescription")} placeholder="What does this goal involve? What change or achievement are you aiming for?" multiline required />
          <TextField label="What does success look like?" value={form.successCriteria} onChange={f("successCriteria")} placeholder="How will you and they know the goal has been achieved?" multiline />
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit, minmax(220px, 1fr))",gap:"0 20px"}}>
            <TextField label="Deadline or target date" value={form.deadline} onChange={f("deadline")} placeholder="e.g. End of Q3 / 30 September" />
            <div style={{marginBottom:16}}>
              <label style={{display:"block",fontSize:13,fontWeight:600,letterSpacing:"0.01em",color:COLORS.muted,marginBottom:8}}>Goal timeframe</label>
              <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                {["Short-term (< 1 month)","Medium-term (1–6 months)","Long-term (6+ months)"].map(o=>(
                  <button key={o} onClick={()=>f("goalTimeframe")(o)} aria-pressed={form.goalTimeframe===o} style={{minHeight:40,padding:"0 18px",border:`1px solid ${form.goalTimeframe===o?COLORS.navy:COLORS.border}`,boxShadow:form.goalTimeframe===o?`inset 0 0 0 1px ${COLORS.navy}`:"none",borderRadius:10,background:form.goalTimeframe===o?COLORS.sunk:COLORS.white,color:COLORS.navy,fontSize:14,fontWeight:form.goalTimeframe===o?600:400,cursor:"pointer",fontFamily:FONT.sans,transition:"all 0.15s"}}>{o}</button>
                ))}
              </div>
            </div>
          </div>

          <div style={{borderTop:`1px solid ${COLORS.border}`,paddingTop:20,marginTop:4}}>
            <h3 style={{fontSize:17,fontWeight:600,color:COLORS.navy,margin:"0 0 16px",fontFamily:FONT.sans}}>Goal profile</h3>
            <ToggleGroup label="Stretch level" value={form.stretchLevel} onChange={f("stretchLevel")} options={[{value:"Low",label:"Low"},{value:"Medium",label:"Medium"},{value:"High",label:"High"}]} />
            <div style={{marginBottom:16}}>
              <label style={{display:"block",fontSize:13,fontWeight:600,letterSpacing:"0.01em",color:COLORS.muted,marginBottom:8}}>Goal type <span style={{fontWeight:400}}>(optional: we'll recommend one if you leave it)</span></label>
              <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                {[{value:"",label:"Recommend for me"},{value:"SMART",label:"SMART"},{value:"Descriptive",label:"Descriptive"},{value:"NLP",label:"NLP Outcome"}].map(o=>(
                  <button key={o.value} onClick={()=>f("goalType")(o.value)} aria-pressed={form.goalType===o.value} style={{minHeight:40,padding:"0 18px",border:`1px solid ${form.goalType===o.value?COLORS.navy:COLORS.border}`,boxShadow:form.goalType===o.value?`inset 0 0 0 1px ${COLORS.navy}`:"none",borderRadius:10,background:form.goalType===o.value?COLORS.sunk:COLORS.white,color:COLORS.navy,fontSize:14,fontWeight:form.goalType===o.value?600:400,cursor:"pointer",fontFamily:FONT.sans,transition:"all 0.15s"}}>{o.label}</button>
                ))}
              </div>
            </div>
          </div>

          <div style={{borderTop:`1px solid ${COLORS.border}`,paddingTop:20,marginTop:4}}>
            <h3 style={{fontSize:17,fontWeight:600,color:COLORS.navy,margin:"0 0 16px",fontFamily:FONT.sans}}>About {form.personName||"the person"}</h3>
            <ToggleGroup label="Skill level for this type of goal" value={form.skillLevel} onChange={f("skillLevel")} options={[{value:"Low",label:"Low"},{value:"Medium",label:"Medium"},{value:"High",label:"High"}]} />
            <ToggleGroup label="Confidence level" value={form.confidenceLevel} onChange={f("confidenceLevel")} options={[{value:"Low",label:"Low"},{value:"Medium",label:"Medium"},{value:"High",label:"High"}]} />
          </div>

          {challengeZone && (
            <div style={{borderTop:`1px solid ${COLORS.border}`,paddingTop:20,marginTop:4}}>
              <h3 style={{fontSize:17,fontWeight:600,color:COLORS.navy,margin:"0 0 12px",fontFamily:FONT.sans}}>Challenge assessment</h3>
              <div style={{background:challengeZone.colorLight,borderRadius:10,padding:"16px 20px"}}>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}><span aria-hidden="true" style={{width:10,height:10,borderRadius:999,background:challengeZone.color,flexShrink:0}} /><p style={{fontSize:15,fontWeight:600,color:COLORS.navy,margin:0,fontFamily:FONT.sans}}>{challengeZone.zone}</p></div>
                <p style={{fontSize:13,color:COLORS.text,margin:"0 0 6px",fontFamily:FONT.sans,lineHeight:1.5}}>{challengeZone.summary}</p>
                <p style={{fontSize:13,color:COLORS.navyMid,margin:0,fontFamily:FONT.sans,lineHeight:1.5}}>{challengeZone.supportLevel}</p>
              </div>
            </div>
          )}

          {cadence && (
            <div style={{borderTop:`1px solid ${COLORS.border}`,paddingTop:20,marginTop:4}}>
              <h3 style={{fontSize:17,fontWeight:600,color:COLORS.navy,margin:"0 0 12px",fontFamily:FONT.sans}}>Suggested review cadence</h3>
              <div style={{background:COLORS.tealLight,borderRadius:10,padding:"16px 20px"}}>
                <p style={{fontSize:15,fontWeight:600,color:COLORS.navy,margin:"0 0 4px",fontFamily:FONT.sans}}>{cadence.frequency}</p>
                <p style={{fontSize:13,color:COLORS.text,margin:"0 0 6px",fontFamily:FONT.sans}}>{cadence.format}</p>
                <p style={{fontSize:13,color:COLORS.navyMid,margin:0,fontFamily:FONT.sans,lineHeight:1.5}}>{cadence.rationale}</p>
              </div>
            </div>
          )}

          <div style={{borderTop:`1px solid ${COLORS.border}`,paddingTop:16,marginTop:16,display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:12}}>
            <label style={{display:"flex",alignItems:"center",gap:10,cursor:"pointer",fontSize:14,color:COLORS.navyMid,fontFamily:FONT.sans}}>
              <input type="checkbox" checked={form.saveLocally} onChange={e=>setForm(p=>({...p,saveLocally:e.target.checked}))} style={{width:18,height:18,accentColor:COLORS.navy}} />
              Save this goal to history
            </label>
            {error && <p style={{fontSize:13,color:COLORS.red,margin:0,fontFamily:FONT.sans}}>{error}</p>}
          </div>

          <button onClick={generate} disabled={loading} style={{width:"100%",marginTop:20,minHeight:52,padding:"0 24px",background:COLORS.navy,opacity:loading?0.7:1,color:"#fff",border:"none",borderRadius:10,fontSize:16,fontWeight:600,cursor:loading?"not-allowed":"pointer",fontFamily:FONT.sans,transition:"opacity 0.2s"}}>
            {loading?"Generating your goal-setting guide...":"Generate goal-setting guide"}
          </button>
          {!isPro&&remaining<=1&&!loading&&(<p style={{textAlign:"center",fontSize:12,color:COLORS.amber,marginTop:10,fontFamily:FONT.sans}}>{remaining===0?"You've used all free goals.":"Last free goal."}{" "}<span style={{textDecoration:"underline",cursor:"pointer"}} onClick={()=>{setUpgradeTrigger("limit");setShowUpgrade(true);}}>Upgrade for unlimited access.</span></p>)}
        </div>

        {/* Goal sharpening */}
        {goalCheck && !goalAccepted && (
          <div style={{background:COLORS.amberLight,borderRadius:10,padding:"24px 28px",marginBottom:24}}>
            <div style={{display:"flex",alignItems:"flex-start",gap:14,marginBottom:16}}>
              <div><p style={{fontSize:14,fontWeight:700,color:COLORS.navy,margin:"0 0 4px",fontFamily:FONT.sans}}>Your goal needs sharpening</p><p style={{fontSize:13,color:COLORS.text,margin:0,fontFamily:FONT.sans,lineHeight:1.6}}>{goalCheck.reason}</p></div>
            </div>
            <div style={{marginBottom:16}}>
              <label style={{display:"block",fontSize:13,fontWeight:600,color:COLORS.navy,marginBottom:8,fontFamily:FONT.sans}}>Suggested rewrite. Edit it if you need to.</label>
              <textarea value={sharpenedGoal} onChange={e=>setSharpenedGoal(e.target.value)} rows={4} style={{width:"100%",padding:"12px 16px",border:`1px solid ${COLORS.border}`,borderRadius:10,fontSize:15,lineHeight:1.6,color:COLORS.text,fontFamily:FONT.sans,boxSizing:"border-box",background:COLORS.white,resize:"vertical"}} />
            </div>
            <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
              <button onClick={()=>{setGoalAccepted(true);runGenerate(sharpenedGoal);}} style={{minHeight:44,padding:"0 24px",background:COLORS.navy,color:"#fff",border:"none",borderRadius:10,fontSize:15,fontWeight:600,cursor:"pointer",fontFamily:FONT.sans}}>Use this and generate the guide</button>
              <button onClick={()=>{setGoalCheck(null);setGoalAccepted(true);setSharpenedGoal(form.goalDescription);runGenerate(form.goalDescription);}} style={{minHeight:44,padding:"0 24px",background:COLORS.white,color:COLORS.navy,border:`1px solid ${COLORS.border}`,borderRadius:10,fontSize:15,fontWeight:500,cursor:"pointer",fontFamily:FONT.sans}}>Keep my original wording</button>
            </div>
          </div>
        )}

        {/* Results */}
        {result && (
          <div ref={resultsRef}>
            <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:20,flexWrap:"wrap"}}>
              <h2 style={{fontSize:28,fontWeight:600,letterSpacing:"-0.02em",color:COLORS.navy,margin:0,fontFamily:FONT.sans}}>Your goal-setting guide</h2>
              <Badge color="green">Ready to use</Badge>
            </div>

            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit, minmax(220px, 1fr))",gap:12,marginBottom:20}}>
              <div style={{background:COLORS.white,border:`1px solid ${COLORS.border}`,borderRadius:10,padding:"20px 24px"}}>
                <p style={{fontSize:13,fontWeight:600,color:COLORS.muted,letterSpacing:"0.01em",margin:"0 0 4px",fontFamily:FONT.sans}}>Goal type</p>
                <p style={{fontSize:18,fontWeight:600,color:COLORS.navy,margin:"0 0 4px"}}>{GOAL_TYPE_INFO[result.goalType]?.label||result.goalType}</p>
                <p style={{fontSize:14,color:COLORS.navyMid,margin:0,fontFamily:FONT.sans,lineHeight:"20px"}}>{GOAL_TYPE_INFO[result.goalType]?.desc}</p>
              </div>
              <div style={{background:COLORS.white,border:`1px solid ${COLORS.border}`,borderRadius:10,padding:"20px 24px"}}>
                <p style={{fontSize:13,fontWeight:600,color:COLORS.muted,letterSpacing:"0.01em",margin:"0 0 4px",fontFamily:FONT.sans}}>Coaching mode</p>
                <p style={{fontSize:18,fontWeight:600,color:COLORS.navy,margin:"0 0 4px"}}>{result.coachingMode}</p>
                <p style={{fontSize:14,color:COLORS.navyMid,margin:0,fontFamily:FONT.sans,lineHeight:"20px"}}>{{Direct:"Clear guidance and close involvement.",Coaching:"Questions that build their thinking.",Supporting:"Encouragement and evidence of capability.",Delegating:"Clear goal, agreed freedom, then trust."}[result.coachingMode]||""}</p>
              </div>
            </div>

            <div style={{background:result.challengeZone.colorLight,borderRadius:10,padding:"20px 24px",marginBottom:20}}>
              <div style={{marginBottom:10}}>
                <p style={{fontSize:13,fontWeight:600,color:COLORS.navy,letterSpacing:"0.01em",margin:"0 0 2px"}}>Challenge assessment</p>
                <div style={{display:"flex",alignItems:"center",gap:8}}><span aria-hidden="true" style={{width:10,height:10,borderRadius:999,background:result.challengeZone.color,flexShrink:0}} /><p style={{fontSize:16,fontWeight:700,color:COLORS.navy,margin:0}}>{result.challengeZone.zone}</p></div>
              </div>
              <p style={{fontSize:13,color:COLORS.text,lineHeight:1.6,margin:"0 0 6px",fontFamily:FONT.sans}}>{result.challengeZone.summary}</p>
              <p style={{fontSize:13,color:COLORS.navyMid,lineHeight:1.5,margin:0,fontFamily:FONT.sans}}>{result.challengeZone.supportLevel}</p>
            </div>

            <div style={{background:COLORS.tealLight,borderRadius:10,padding:"20px 24px",marginBottom:20}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12,flexWrap:"wrap",gap:10}}>
                <div style={{display:"flex",alignItems:"center",gap:10}}>
                  <div><p style={{fontSize:13,fontWeight:600,color:COLORS.navy,letterSpacing:"0.01em",margin:"0 0 2px"}}>Recommended review cadence</p><p style={{fontSize:16,fontWeight:700,color:COLORS.navy,margin:0}}>{result.cadence.frequency}</p></div>
                </div>
                {!result.cadence.frequency.toLowerCase().includes("milestone")&&(
                  <button onClick={()=>generateICS({goalTitle:result.goalTitle,personName:result.personName,managerName:result.managerName,cadence:result.cadence})} style={{display:"flex",alignItems:"center",minHeight:40,padding:"0 18px",background:COLORS.navy,color:"#fff",border:"none",borderRadius:10,fontSize:14,fontWeight:600,cursor:"pointer",fontFamily:FONT.sans,whiteSpace:"nowrap"}}>Add to calendar</button>
                )}
              </div>
              <p style={{fontSize:13,color:COLORS.text,lineHeight:1.6,margin:"0 0 8px",fontFamily:FONT.sans}}><strong>Format:</strong> {result.cadence.format}</p>
              <p style={{fontSize:13,color:COLORS.navyMid,lineHeight:1.6,margin:0,fontFamily:FONT.sans}}>{result.cadence.rationale}</p>
            </div>

            <OutputBox title="Advice for the manager" content={result.advice} badge={{color:"blue",label:"Manager only"}} />
            <OutputBox title={`Goal brief for ${displayName(result.personName)}`} content={result.brief} badge={{color:"teal",label:"Share with your person"}} spoken />
            {result.goalTemplate && <OutputBox title="Goal template" content={result.goalTemplate} badge={{color:"purple",label:"Use in your conversation"}} spoken />}

            <div style={{background:COLORS.white,borderRadius:10,padding:"16px 20px",border:`1px solid ${COLORS.border}`,display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:12}}>
              <p style={{fontSize:14,color:COLORS.navyMid,margin:0,fontFamily:FONT.sans}}>Every output is editable. Adjust it to fit your voice before sharing.</p>
              <div style={{display:"flex",gap:10,alignItems:"center",flexWrap:"wrap"}}>
                {person && (
                  <button onClick={saveToPerson} disabled={saveState !== "idle"} style={{ fontSize: 14, minHeight: 44, padding: "0 20px", background: saveState === "saved" ? COLORS.greenLight : COLORS.navy, border: saveState === "saved" ? `1px solid ${COLORS.green}` : "none", borderRadius: 10, color: saveState === "saved" ? COLORS.green : COLORS.white, cursor: saveState === "idle" ? "pointer" : "default", fontFamily: FONT.sans, fontWeight: 600 }}>
                    {saveState === "saved" ? `Saved to ${person.first_name}'s record` : saveState === "saving" ? "Saving..." : `Save to ${person.first_name}'s record`}
                  </button>
                )}
                <button onClick={downloadPdf} disabled={downloadingPdf} style={{fontSize:14,minHeight:44,padding:"0 20px",background:COLORS.white,border:`1px solid ${COLORS.border}`,borderRadius:10,color:COLORS.navy,cursor:downloadingPdf?"default":"pointer",fontFamily:FONT.sans,fontWeight:600,opacity:downloadingPdf?0.7:1}}>{downloadingPdf?"Preparing PDF...":(isPro?"Download PDF":"Download PDF (Pro)")}</button>
                <a href={DASHBOARD_URL} style={{fontSize:14,minHeight:44,padding:"0 20px",background:COLORS.white,border:`1px solid ${COLORS.border}`,borderRadius:10,color:COLORS.navy,cursor: "pointer",fontFamily:FONT.sans,fontWeight:600, display: "inline-flex", alignItems: "center", textDecoration: "none" }}>Back to dashboard</a>
                <button onClick={resetAll} style={{fontSize:14,minHeight:44,padding:"0 20px",background:COLORS.white,border:`1px solid ${COLORS.border}`,borderRadius:10,color:COLORS.navy,cursor:"pointer",fontFamily:FONT.sans,fontWeight:500}}>New goal</button>
              </div>
            </div>
          </div>
        )}

        {!result && !loading && (
          <div style={{marginTop:8}}>
            <h3 style={{fontSize:13,fontWeight:600,color:COLORS.muted,letterSpacing:"0.01em",margin:"0 0 16px",fontFamily:FONT.sans}}>How it works</h3>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit, minmax(200px, 1fr))",gap:12}}>
              {[{n:"1",title:"Describe the goal",desc:"Tell us what you are aiming for and for whom."},{n:"2",title:"Profile the person",desc:"Skill, confidence, and stretch level shape the right approach."},{n:"3",title:"Get your guide",desc:"Receive a goal-setting plan and a ready goal brief."}].map(s=>(
                <div key={s.n} style={{background:COLORS.white,border:`1px solid ${COLORS.border}`,borderRadius:10,padding:"20px 22px"}}>
                  <div style={{fontSize:20,fontWeight:600,color:COLORS.teal,marginBottom:8,fontFamily:FONT.sans}}>{s.n}</div>
                  <p style={{fontSize:15,fontWeight:600,color:COLORS.navy,margin:"0 0 4px",fontFamily:FONT.sans}}>{s.title}</p>
                  <p style={{fontSize:14,color:COLORS.navyMid,margin:0,lineHeight:"20px",fontFamily:FONT.sans}}>{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{borderTop:`1px solid ${COLORS.border}`,marginTop:40,paddingTop:20,textAlign:"center"}}>
          <p style={{fontSize:13,color:COLORS.muted,margin:0,fontFamily:FONT.sans}}>
            Goal Ignite, part of <a href="https://management-ignition.com" style={{color:COLORS.navyMid,textUnderlineOffset:4}}>Management Ignition</a>
            {!isPro&&<> · {remaining} free {remaining===1?"use":"uses"} remaining · <span style={{textDecoration:"underline",textUnderlineOffset:4,cursor:"pointer",color:COLORS.navyMid}} onClick={()=>{setUpgradeTrigger("manual");setShowUpgrade(true);}}>Upgrade to Pro</span></>}
            {isPro&&<> · <span style={{color:COLORS.green,fontWeight:600}}>Pro, unlimited access</span></>}
          </p>
        </div>
      </div>
    </div>
  );
}
