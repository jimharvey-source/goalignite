import { useState, useEffect, useRef } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://fdiitxhgfytvlbtokbok.supabase.co",
  "sb_publishable_JQMFDaTz5g-2ZlitosUTeA_C9B48-Lc"
);

const COLORS = {
  navy: "#0F2A4A", navyMid: "#1A3D6B", blue: "#2563EB", blueLight: "#EFF6FF",
  teal: "#4CAF50", tealLight: "#F1F8E9", slate: "#64748B", slateLight: "#F8FAFC",
  border: "#E2E8F0", text: "#0F172A", muted: "#64748B", white: "#FFFFFF",
  amber: "#D97706", amberLight: "#FFFBEB", red: "#DC2626", green: "#16A34A", greenLight: "#F0FDF4",
};

const GOAL_TYPE_INFO = {
  SMART: { label: "SMART Goal", icon: "🎯", desc: "Specific, Measurable, Achievable, Relevant, Timed. Best for structured thinkers and short-to-medium term goals.", color: COLORS.blue, colorLight: COLORS.blueLight },
  Descriptive: { label: "Descriptive Goal", icon: "🖼️", desc: "A vivid written vision of the desired future state. Best for creative thinkers and longer-term ambitions.", color: COLORS.teal, colorLight: COLORS.tealLight },
  NLP: { label: "NLP Outcome", icon: "🧭", desc: "Issue → Outcome → Resources → Objections. Best for people who need both vision and structured accountability.", color: "#7C3AED", colorLight: "#F5F3FF" },
};

function getChallengeZone(stretchLevel, skillLevel, confidenceLevel) {
  const highSkill = skillLevel === "High", medSkill = skillLevel === "Medium";
  const highConf = confidenceLevel === "High", medConf = confidenceLevel === "Medium", lowConf = confidenceLevel === "Low";
  const highStretch = stretchLevel === "High", medStretch = stretchLevel === "Medium";

  if (highStretch && highSkill && highConf) return { zone: "Growth Zone", color: COLORS.green, colorLight: COLORS.greenLight, icon: "🚀", summary: "High challenge, high capability. This is the ideal stretch — ambitious enough to drive real development, achievable enough to succeed with commitment.", managerGuidance: "This person is ready for a genuine stretch. Set the goal boldly, agree a clear success picture, and then give them the room to work. Your role here is available coach, not close supervisor. Check in regularly but resist the urge to direct.", supportLevel: "High support available, applied lightly." };
  if (highStretch && (medSkill || highSkill) && (medConf || highConf)) return { zone: "Growth Zone", color: COLORS.green, colorLight: COLORS.greenLight, icon: "🚀", summary: "Good capability meeting genuine stretch. Strong development territory — the goal will push them, and with the right support they will grow into it.", managerGuidance: "A real stretch for a capable person. Set the goal clearly and discuss honestly that it is meant to push them. Build in regular check-ins and make it easy to raise blockers early.", supportLevel: "Regular structured support. Weekly check-ins, clear escalation path." };
  if (highStretch && (!highSkill || !highConf)) return { zone: "Danger Zone", color: COLORS.red, colorLight: "#FEF2F2", icon: "⚠️", summary: "High stretch combined with lower skill or confidence creates real risk. Without active support, this goal is likely to damage confidence rather than build it.", managerGuidance: "Think carefully before proceeding with this level of stretch. If you do, the support structure must be intensive. Consider stepping down the stretch level and building up progressively.", supportLevel: "Intensive support required. Consider reducing stretch level first." };
  if (medStretch && (highSkill || medSkill) && (highConf || medConf)) return { zone: "Growth Zone", color: COLORS.green, colorLight: COLORS.greenLight, icon: "✅", summary: "Moderate stretch matched well to capability. Solid development goal — enough challenge to produce growth without excessive risk.", managerGuidance: "Good balance. Set the goal clearly, agree the success criteria, and give them the space to work. Regular light-touch check-ins are enough.", supportLevel: "Light-touch support. Fortnightly reviews, available on request." };
  if (!highStretch && !medStretch) return { zone: "Coasting", color: COLORS.amber, colorLight: COLORS.amberLight, icon: "😐", summary: "Low stretch for a capable person produces compliance, not growth. They may complete the goal, but they will not develop from it — and they will notice.", managerGuidance: "Raise the bar. A low-stretch goal for a capable person is a missed development opportunity and can signal that you underestimate them.", supportLevel: "Low support needed — but consider whether the goal itself needs revisiting." };
  return { zone: "Moderate Challenge", color: COLORS.teal, colorLight: COLORS.tealLight, icon: "📈", summary: "Reasonable challenge level. Not quite the growth zone but solid and productive. Consider whether you could push the stretch slightly.", managerGuidance: "A reasonable goal. Consider whether you could push the stretch level slightly without tipping into the danger zone.", supportLevel: "Moderate support. Weekly light check-ins, available for ad hoc questions." };
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
  const styles = { blue:{bg:COLORS.blueLight,text:COLORS.blue}, teal:{bg:COLORS.tealLight,text:COLORS.teal}, amber:{bg:COLORS.amberLight,text:COLORS.amber}, green:{bg:COLORS.greenLight,text:COLORS.green}, purple:{bg:"#F5F3FF",text:"#7C3AED"} };
  const s = styles[color] || styles.blue;
  return <span style={{background:s.bg,color:s.text,fontSize:11,fontWeight:600,padding:"3px 10px",borderRadius:20,letterSpacing:"0.04em",textTransform:"uppercase"}}>{children}</span>;
}

function OutputBox({ title, content, badge }) {
  const [copied, setCopied] = useState(false);
  const [text, setText] = useState(content);
  useEffect(() => { setText(content); }, [content]);
  const copy = () => { navigator.clipboard.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); }); };
  const emailIt = () => { const s=encodeURIComponent(`GoalIgnite: ${title}`), b=encodeURIComponent(text), a=document.createElement("a"); a.href=`mailto:?subject=${s}&body=${b}`; a.target="_blank"; document.body.appendChild(a); a.click(); document.body.removeChild(a); };
  const shareIt = async () => { if (navigator.share) { try { await navigator.share({title:`GoalIgnite: ${title}`,text}); } catch { emailIt(); } } else { emailIt(); } };
  return (
    <div style={{background:COLORS.white,border:`1px solid ${COLORS.border}`,borderRadius:12,overflow:"hidden",marginBottom:16}}>
      <div style={{padding:"14px 20px",borderBottom:`1px solid ${COLORS.border}`,display:"flex",justifyContent:"space-between",alignItems:"center",background:COLORS.slateLight}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <span style={{fontSize:14,fontWeight:600,color:COLORS.navy}}>{title}</span>
          {badge && <Badge color={badge.color}>{badge.label}</Badge>}
        </div>
        <div style={{display:"flex",gap:8}}>
          <button onClick={copy} style={{fontSize:12,padding:"5px 12px",border:`1px solid ${COLORS.border}`,borderRadius:6,background:copied?COLORS.greenLight:COLORS.white,color:copied?COLORS.green:COLORS.slate,cursor:"pointer",fontWeight:500}}>{copied?"Copied":"Copy"}</button>
          <button onClick={shareIt} style={{fontSize:12,padding:"5px 12px",border:`1px solid ${COLORS.border}`,borderRadius:6,background:COLORS.white,color:COLORS.slate,cursor:"pointer",fontWeight:500}}>Share</button>
        </div>
      </div>
      <textarea value={text} onChange={e=>setText(e.target.value)} style={{width:"100%",minHeight:280,padding:"16px 20px",border:"none",outline:"none",resize:"vertical",fontSize:13.5,lineHeight:1.7,color:COLORS.text,fontFamily:"Georgia, serif",boxSizing:"border-box",background:COLORS.white}} />
    </div>
  );
}

function TextField({ label, value, onChange, placeholder, multiline, required }) {
  const style = {width:"100%",padding:"9px 12px",border:`1px solid ${COLORS.border}`,borderRadius:8,fontSize:14,color:COLORS.text,background:COLORS.white,outline:"none",boxSizing:"border-box",fontFamily:"inherit"};
  return (
    <div style={{marginBottom:16}}>
      <label style={{display:"block",fontSize:13,fontWeight:600,color:COLORS.navy,marginBottom:6}}>{label}{required && <span style={{color:COLORS.red}}> *</span>}</label>
      {multiline ? <textarea value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} rows={3} style={{...style,resize:"vertical"}} /> : <input type="text" value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} style={style} />}
    </div>
  );
}

function ToggleGroup({ label, value, onChange, options }) {
  return (
    <div style={{marginBottom:16}}>
      <label style={{display:"block",fontSize:13,fontWeight:600,color:COLORS.navy,marginBottom:8}}>{label}</label>
      <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
        {options.map(o => (
          <button key={o.value} onClick={() => onChange(o.value)} style={{padding:"7px 16px",border:`1.5px solid ${value===o.value?COLORS.blue:COLORS.border}`,borderRadius:8,background:value===o.value?COLORS.blueLight:COLORS.white,color:value===o.value?COLORS.blue:COLORS.slate,fontSize:13,fontWeight:value===o.value?600:400,cursor:"pointer",transition:"all 0.15s"}}>{o.label}</button>
        ))}
      </div>
    </div>
  );
}

function AuthModal({ onClose }) {
  const [email, setEmail] = useState(""), [sent, setSent] = useState(false), [loading, setLoading] = useState(false), [error, setError] = useState("");
  const send = async () => { if (!email.trim()) { setError("Please enter your email."); return; } setLoading(true); setError(""); const {error:e} = await supabase.auth.signInWithOtp({email:email.trim(),options:{emailRedirectTo:window.location.origin}}); if(e){setError(e.message);setLoading(false);return;} setSent(true); setLoading(false); };
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(15,42,74,0.85)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000,padding:20}}>
      <div style={{background:COLORS.white,borderRadius:16,padding:"36px 32px",maxWidth:420,width:"100%"}}>
        {!sent ? (<>
          <div style={{textAlign:"center",marginBottom:24}}>
            <div style={{width:52,height:52,background:COLORS.tealLight,borderRadius:12,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 16px",fontSize:22}}>✉️</div>
            <h2 style={{fontSize:20,fontWeight:700,color:COLORS.navy,margin:"0 0 8px",fontFamily:"sans-serif"}}>Sign in to GoalIgnite</h2>
            <p style={{fontSize:14,color:COLORS.muted,margin:0,fontFamily:"sans-serif",lineHeight:1.6}}>Enter your email and we will send you a magic link. No password needed.</p>
          </div>
          <input type="email" value={email} onChange={e=>setEmail(e.target.value)} onKeyDown={e=>e.key==="Enter"&&send()} placeholder="your@email.com" style={{width:"100%",padding:"10px 14px",border:`1px solid ${COLORS.border}`,borderRadius:8,fontSize:14,color:COLORS.text,outline:"none",boxSizing:"border-box",fontFamily:"sans-serif",marginBottom:12}} />
          {error && <p style={{fontSize:13,color:COLORS.red,margin:"0 0 10px",fontFamily:"sans-serif"}}>{error}</p>}
          <button onClick={send} disabled={loading} style={{width:"100%",padding:"11px",background:COLORS.navy,color:"#fff",border:"none",borderRadius:8,fontSize:14,fontWeight:600,cursor:loading?"not-allowed":"pointer",fontFamily:"sans-serif",marginBottom:10}}>{loading?"Sending...":"Send magic link"}</button>
          <button onClick={onClose} style={{width:"100%",background:"none",border:"none",color:COLORS.muted,fontSize:13,cursor:"pointer",padding:4,fontFamily:"sans-serif"}}>Cancel</button>
        </>) : (
          <div style={{textAlign:"center"}}>
            <div style={{fontSize:40,marginBottom:16}}>📬</div>
            <h2 style={{fontSize:20,fontWeight:700,color:COLORS.navy,margin:"0 0 10px",fontFamily:"sans-serif"}}>Check your email</h2>
            <p style={{fontSize:14,color:COLORS.muted,lineHeight:1.6,margin:"0 0 20px",fontFamily:"sans-serif"}}>We sent a magic link to <strong>{email}</strong>.</p>
            <button onClick={onClose} style={{background:"none",border:"none",color:COLORS.muted,fontSize:13,cursor:"pointer",fontFamily:"sans-serif"}}>Close</button>
          </div>
        )}
      </div>
    </div>
  );
}

function UpgradeModal({ onClose, triggered }) {
  const [loadingPlan, setLoadingPlan] = useState(null), [checkoutError, setCheckoutError] = useState("");
  const plans = [{id:"monthly",name:"Monthly",price:"£4.99",period:"/month",desc:"Full access, cancel anytime.",highlight:false},{id:"annual",name:"Annual",price:"£59.99",period:"/year",desc:"Best value — two months free.",highlight:true},{id:"lifetime",name:"Lifetime",price:"£49.99",period:"one-off",desc:"Pay once, use forever.",highlight:false}];
  const handleCheckout = async (planId) => { setLoadingPlan(planId); setCheckoutError(""); try { const r=await fetch("/api/stripe-checkout",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({plan:planId,origin:window.location.origin})}); const d=await r.json(); if(d.url){window.location.href=d.url;}else{setCheckoutError("Something went wrong.");setLoadingPlan(null);} } catch { setCheckoutError("Something went wrong.");setLoadingPlan(null); } };
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(15,42,74,0.85)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000,padding:20}}>
      <div style={{background:COLORS.white,borderRadius:16,padding:"36px 32px",maxWidth:520,width:"100%"}}>
        <div style={{textAlign:"center",marginBottom:28}}>
          <div style={{width:52,height:52,background:COLORS.amberLight,borderRadius:12,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 16px",fontSize:22}}>★</div>
          <h2 style={{fontSize:22,fontWeight:700,color:COLORS.navy,margin:"0 0 8px",fontFamily:"sans-serif"}}>{triggered==="limit"?"You have used your 3 free goals":"Unlock GoalIgnite"}</h2>
          <p style={{fontSize:14,color:COLORS.muted,margin:0,lineHeight:1.6,fontFamily:"sans-serif"}}>Unlimited goals, challenge zone analysis, calendar integration, and full coaching guides.</p>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:20}}>
          {plans.map(plan => (
            <div key={plan.id} style={{border:`${plan.highlight?2:1}px solid ${plan.highlight?COLORS.teal:COLORS.border}`,borderRadius:10,padding:"14px 18px",display:"flex",alignItems:"center",justifyContent:"space-between",background:plan.highlight?COLORS.tealLight:COLORS.white,gap:12,flexWrap:"wrap"}}>
              <div style={{flex:1}}>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:2}}><span style={{fontSize:14,fontWeight:700,color:COLORS.navy,fontFamily:"sans-serif"}}>{plan.name}</span>{plan.highlight&&<Badge color="teal">Most popular</Badge>}</div>
                <p style={{fontSize:12.5,color:COLORS.muted,margin:0,fontFamily:"sans-serif"}}>{plan.desc}</p>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:12,flexShrink:0}}>
                <div style={{textAlign:"right"}}><span style={{fontSize:18,fontWeight:700,color:COLORS.navy,fontFamily:"sans-serif"}}>{plan.price}</span><span style={{fontSize:12,color:COLORS.muted,fontFamily:"sans-serif"}}> {plan.period}</span></div>
                <button onClick={()=>handleCheckout(plan.id)} disabled={!!loadingPlan} style={{padding:"8px 18px",background:plan.highlight?COLORS.teal:COLORS.navy,color:"#fff",border:"none",borderRadius:8,fontSize:13,fontWeight:600,cursor:loadingPlan?"not-allowed":"pointer",fontFamily:"sans-serif",opacity:loadingPlan&&loadingPlan!==plan.id?0.5:1,minWidth:80}}>{loadingPlan===plan.id?"...":"Select"}</button>
              </div>
            </div>
          ))}
        </div>
        {checkoutError && <p style={{fontSize:13,color:COLORS.red,textAlign:"center",margin:"0 0 12px",fontFamily:"sans-serif"}}>{checkoutError}</p>}
        <div style={{borderTop:`1px solid ${COLORS.border}`,paddingTop:16,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <p style={{fontSize:12,color:COLORS.muted,margin:0,fontFamily:"sans-serif"}}>Secure payment by Stripe. Cancel anytime.</p>
          <button onClick={onClose} style={{background:"none",border:"none",color:COLORS.muted,fontSize:13,cursor:"pointer",padding:4,fontFamily:"sans-serif"}}>Maybe later</button>
        </div>
      </div>
    </div>
  );
}

function HistoryPanel({ items, onClose }) {
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(15,42,74,0.7)",display:"flex",alignItems:"flex-start",justifyContent:"flex-end",zIndex:1000}}>
      <div style={{background:COLORS.white,width:"100%",maxWidth:460,height:"100vh",overflowY:"auto",padding:"28px 24px"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24}}>
          <h3 style={{fontSize:18,fontWeight:700,color:COLORS.navy,margin:0}}>Saved goals</h3>
          <button onClick={onClose} style={{background:"none",border:"none",fontSize:20,cursor:"pointer",color:COLORS.slate}}>×</button>
        </div>
        {items.length===0 ? <p style={{color:COLORS.muted,fontSize:14}}>No saved goals yet.</p> : items.map(item => (
          <div key={item.id} style={{border:`1px solid ${COLORS.border}`,borderRadius:10,padding:"14px 16px",marginBottom:12}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
              <span style={{fontSize:14,fontWeight:600,color:COLORS.navy}}>{item.goalTitle||"Untitled goal"}</span>
              <span style={{fontSize:12,color:COLORS.muted}}>{item.date||new Date(item.created_at).toLocaleDateString("en-GB")}</span>
            </div>
            <p style={{fontSize:13,color:COLORS.muted,margin:"0 0 6px"}}>{item.managerName} ➜ {item.personName}</p>
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
SHARPENED: [If FAIL, rewrite as outcome-focused. If PASS, repeat original unchanged.]`;

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

YOUR RESPONSE MUST USE EXACTLY THIS FORMAT:

GOAL_TYPE: [SMART, Descriptive, or NLP — one word]

COACHING_MODE: [Direct, Coaching, Supporting, or Delegating — one word]

GOAL_SETTING_ADVICE:
[Practical guidance for ${form.managerName} using the five steps above. Include goal type rationale, challenge zone implications, coaching mode application, and cadence woven naturally in. Minimum 400 words.]

GOAL_BRIEF:
[Written goal brief for ${form.personName}. First-person manager voice. Include goal in appropriate format, what success looks like, timeframe, level of challenge, support structure, and what to do if obstacles arise. Warm and confidence-building. Minimum 350 words.]

GOAL_TEMPLATE:
[Write the goal itself — fully drafted in the recommended format (SMART, Descriptive, or NLP Outcome) — but with gaps shown as [square brackets] wherever the manager needs to either ask ${form.personName} for their input, or add more specifics themselves before the goal is finalised. These gaps should be genuinely useful: specific measures, personal motivations, timelines, milestones, resources, or personal commitments that only the person themselves can supply. Add a brief note in italics before the template explaining what it is and how to use it. The template should feel like a working document — something the manager can take into the goal-setting conversation and complete together with ${form.personName}.]`;
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
        const sharpened=text.match(/SHARPENED:\s*([\s\S]+)/i)?.[1]?.trim()||form.goalDescription;
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
  const signOut = async () => { await supabase.auth.signOut();setUser(null);setIsPro(false);try{localStorage.removeItem("gi_pro");}catch{} };
  const remaining = isPro?null:Math.max(0,FREE_LIMIT-usageCount);

  return (
    <div style={{fontFamily:"'Georgia', serif",background:"#F8FAFC",minHeight:"100vh"}}>
      {showUpgrade && <UpgradeModal onClose={()=>setShowUpgrade(false)} triggered={upgradeTrigger} />}
      {showHistory && <HistoryPanel items={history} onClose={()=>setShowHistory(false)} />}
      {showAuth && <AuthModal onClose={()=>setShowAuth(false)} />}
      {showSuccessBanner && <div style={{background:COLORS.green,padding:"12px 24px",textAlign:"center"}}><p style={{fontSize:14,fontWeight:600,color:"#fff",margin:0,fontFamily:"sans-serif"}}>Payment successful — welcome to GoalIgnite Pro.</p></div>}

      {/* Header */}
      <div style={{background:"#ffffff",borderBottom:"1px solid #e8e8f0",padding:"0 24px",position:"sticky",top:0,zIndex:100}}>
        <div style={{maxWidth:820,margin:"0 auto",display:"flex",justifyContent:"space-between",alignItems:"center",height:68}}>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <div style={{width:36,height:36,background:"#4CAF50",borderRadius:9,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
              <svg viewBox="0 0 24 24" fill="none" style={{width:18,height:18}}>
                <circle cx="12" cy="12" r="3" fill="white" opacity="0.9"/>
                <path d="M12 3 L12 7 M12 17 L12 21 M3 12 L7 12 M17 12 L21 12" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.7"/>
                <path d="M6.3 6.3 L9.2 9.2 M14.8 14.8 L17.7 17.7 M6.3 17.7 L9.2 14.8 M14.8 9.2 L17.7 6.3" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.5"/>
              </svg>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:1}}>
              <span style={{fontFamily:"'Fraunces', Georgia, serif",fontSize:"1.25rem",fontWeight:600,color:"#1a1a2e",letterSpacing:"-0.02em",lineHeight:1.1}}>Goal <span style={{color:"#4CAF50"}}>Ignite</span></span>
              <span style={{fontFamily:"system-ui, sans-serif",fontSize:"0.65rem",fontWeight:400,color:"#9b9bb0",letterSpacing:"0.08em",textTransform:"uppercase"}}>Part of the Management Ignition Suite</span>
            </div>
            <Badge color={isPro?"green":"amber"}>{isPro?"Pro":"Beta"}</Badge>
          </div>
          <div style={{display:"flex",gap:12,alignItems:"center"}}>
            <button onClick={()=>setShowHistory(true)} style={{background:"none",border:"none",color:"#6b6b85",fontSize:13,cursor:"pointer",padding:0,fontFamily:"system-ui, sans-serif"}}>History</button>
            {user?(<><span style={{fontSize:12,color:"#9b9bb0",fontFamily:"system-ui, sans-serif"}}>{user.email}</span><button onClick={signOut} style={{background:"none",border:"1px solid #d0d0e0",borderRadius:20,padding:"4px 12px",fontSize:12,color:"#6b6b85",fontFamily:"system-ui, sans-serif",cursor:"pointer"}}>Sign out</button></>):(<button onClick={()=>setShowAuth(true)} style={{background:"none",border:"1px solid #d0d0e0",borderRadius:20,padding:"4px 12px",fontSize:12,color:"#6b6b85",fontFamily:"system-ui, sans-serif",cursor:"pointer"}}>Sign in</button>)}
            {!isPro&&(<><div style={{background:"#f0f8ff",borderRadius:20,padding:"4px 12px",fontSize:12,color:"#3d3d56",fontFamily:"system-ui, sans-serif"}}>{remaining} free {remaining===1?"use":"uses"} left</div><button onClick={()=>{setUpgradeTrigger("manual");setShowUpgrade(true);}} style={{background:"#4CAF50",border:"none",borderRadius:20,padding:"5px 14px",fontSize:12,color:"#fff",fontFamily:"system-ui, sans-serif",fontWeight:600,cursor:"pointer"}}>Upgrade</button></>)}
          </div>
        </div>
      </div>

      {/* Hero */}
      <div style={{background:COLORS.navy,borderBottom:`3px solid ${COLORS.teal}`,paddingBottom:32}}>
        <div style={{maxWidth:800,margin:"0 auto",padding:"28px 24px 0"}}>
          <h1 style={{fontSize:30,fontWeight:700,color:"#fff",margin:"0 0 10px",lineHeight:1.25,letterSpacing:"-0.02em"}}>Set better goals.<br/>Every time.</h1>
          <p style={{fontSize:16,color:"rgba(255,255,255,0.7)",margin:0,lineHeight:1.6,fontFamily:"sans-serif"}}>Match the goal to the person. Get a practical goal-setting guide and a ready-to-use goal brief in seconds.</p>
        </div>
      </div>

      <div style={{maxWidth:800,margin:"0 auto",padding:"28px 24px 60px"}}>

        {/* Form */}
        <div style={{background:COLORS.white,borderRadius:14,border:`1px solid ${COLORS.border}`,padding:"28px 28px",marginBottom:24}}>
          <h2 style={{fontSize:16,fontWeight:700,color:COLORS.navy,margin:"0 0 22px",fontFamily:"sans-serif",borderBottom:`1px solid ${COLORS.border}`,paddingBottom:14}}>The goal</h2>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 20px"}}>
            <TextField label="Manager name" value={form.managerName} onChange={f("managerName")} placeholder="Your name" required />
            <TextField label="Person's name" value={form.personName} onChange={f("personName")} placeholder="Their name" required />
          </div>
          <TextField label="Goal title" value={form.goalTitle} onChange={f("goalTitle")} placeholder="e.g. Lead the Q3 client review process independently" required />
          <TextField label="Goal description" value={form.goalDescription} onChange={f("goalDescription")} placeholder="What does this goal involve? What change or achievement are you aiming for?" multiline required />
          <TextField label="What does success look like?" value={form.successCriteria} onChange={f("successCriteria")} placeholder="How will you and they know the goal has been achieved?" multiline />
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 20px"}}>
            <TextField label="Deadline or target date" value={form.deadline} onChange={f("deadline")} placeholder="e.g. End of Q3 / 30 September" />
            <div style={{marginBottom:16}}>
              <label style={{display:"block",fontSize:13,fontWeight:600,color:COLORS.navy,marginBottom:8}}>Goal timeframe</label>
              <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                {["Short-term (< 1 month)","Medium-term (1–6 months)","Long-term (6+ months)"].map(o=>(
                  <button key={o} onClick={()=>f("goalTimeframe")(o)} style={{padding:"7px 10px",border:`1.5px solid ${form.goalTimeframe===o?COLORS.blue:COLORS.border}`,borderRadius:8,background:form.goalTimeframe===o?COLORS.blueLight:COLORS.white,color:form.goalTimeframe===o?COLORS.blue:COLORS.slate,fontSize:11.5,fontWeight:form.goalTimeframe===o?600:400,cursor:"pointer"}}>{o}</button>
                ))}
              </div>
            </div>
          </div>

          <div style={{borderTop:`1px solid ${COLORS.border}`,paddingTop:20,marginTop:4}}>
            <h3 style={{fontSize:14,fontWeight:700,color:COLORS.navy,margin:"0 0 16px",fontFamily:"sans-serif"}}>Goal profile</h3>
            <ToggleGroup label="Stretch level" value={form.stretchLevel} onChange={f("stretchLevel")} options={[{value:"Low",label:"Low"},{value:"Medium",label:"Medium"},{value:"High",label:"High"}]} />
            <div style={{marginBottom:16}}>
              <label style={{display:"block",fontSize:13,fontWeight:600,color:COLORS.navy,marginBottom:6}}>Goal type <span style={{fontSize:12,fontWeight:400,color:COLORS.muted}}>(optional — we'll recommend one if not set)</span></label>
              <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                {[{value:"",label:"Recommend for me"},{value:"SMART",label:"SMART"},{value:"Descriptive",label:"Descriptive"},{value:"NLP",label:"NLP Outcome"}].map(o=>(
                  <button key={o.value} onClick={()=>f("goalType")(o.value)} style={{padding:"7px 14px",border:`1.5px solid ${form.goalType===o.value?COLORS.blue:COLORS.border}`,borderRadius:8,background:form.goalType===o.value?COLORS.blueLight:COLORS.white,color:form.goalType===o.value?COLORS.blue:COLORS.slate,fontSize:13,fontWeight:form.goalType===o.value?600:400,cursor:"pointer"}}>{o.label}</button>
                ))}
              </div>
            </div>
          </div>

          <div style={{borderTop:`1px solid ${COLORS.border}`,paddingTop:20,marginTop:4}}>
            <h3 style={{fontSize:14,fontWeight:700,color:COLORS.navy,margin:"0 0 16px",fontFamily:"sans-serif"}}>About {form.personName||"the person"}</h3>
            <ToggleGroup label="Skill level for this type of goal" value={form.skillLevel} onChange={f("skillLevel")} options={[{value:"Low",label:"Low"},{value:"Medium",label:"Medium"},{value:"High",label:"High"}]} />
            <ToggleGroup label="Confidence level" value={form.confidenceLevel} onChange={f("confidenceLevel")} options={[{value:"Low",label:"Low"},{value:"Medium",label:"Medium"},{value:"High",label:"High"}]} />
          </div>

          {challengeZone && (
            <div style={{borderTop:`1px solid ${COLORS.border}`,paddingTop:20,marginTop:4}}>
              <h3 style={{fontSize:14,fontWeight:700,color:COLORS.navy,margin:"0 0 12px",fontFamily:"sans-serif"}}>Challenge assessment</h3>
              <div style={{background:challengeZone.colorLight,border:`1px solid ${challengeZone.color}`,borderRadius:10,padding:"14px 18px"}}>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}><span style={{fontSize:16}}>{challengeZone.icon}</span><p style={{fontSize:14,fontWeight:700,color:challengeZone.color,margin:0,fontFamily:"sans-serif"}}>{challengeZone.zone}</p></div>
                <p style={{fontSize:13,color:COLORS.text,margin:"0 0 4px",fontFamily:"sans-serif",lineHeight:1.5}}>{challengeZone.summary}</p>
                <p style={{fontSize:12.5,color:COLORS.muted,margin:0,fontStyle:"italic",fontFamily:"sans-serif"}}>{challengeZone.supportLevel}</p>
              </div>
            </div>
          )}

          {cadence && (
            <div style={{borderTop:`1px solid ${COLORS.border}`,paddingTop:20,marginTop:4}}>
              <h3 style={{fontSize:14,fontWeight:700,color:COLORS.navy,margin:"0 0 12px",fontFamily:"sans-serif"}}>Suggested review cadence</h3>
              <div style={{background:COLORS.tealLight,border:`1px solid ${COLORS.teal}`,borderRadius:10,padding:"14px 18px"}}>
                <p style={{fontSize:14,fontWeight:700,color:COLORS.teal,margin:"0 0 4px",fontFamily:"sans-serif"}}>{cadence.frequency}</p>
                <p style={{fontSize:13,color:COLORS.text,margin:"0 0 6px",fontFamily:"sans-serif"}}>{cadence.format}</p>
                <p style={{fontSize:12.5,color:COLORS.muted,margin:0,fontStyle:"italic",fontFamily:"sans-serif",lineHeight:1.5}}>{cadence.rationale}</p>
              </div>
            </div>
          )}

          <div style={{borderTop:`1px solid ${COLORS.border}`,paddingTop:16,marginTop:16,display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:12}}>
            <label style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer",fontSize:13,color:COLORS.muted,fontFamily:"sans-serif"}}>
              <input type="checkbox" checked={form.saveLocally} onChange={e=>setForm(p=>({...p,saveLocally:e.target.checked}))} style={{width:15,height:15}} />
              Save this goal to history
            </label>
            {error && <p style={{fontSize:13,color:COLORS.red,margin:0,fontFamily:"sans-serif"}}>{error}</p>}
          </div>

          <button onClick={generate} disabled={loading} style={{width:"100%",marginTop:16,padding:"14px",background:loading?COLORS.slate:COLORS.navy,color:"#fff",border:"none",borderRadius:10,fontSize:15,fontWeight:600,cursor:loading?"not-allowed":"pointer",fontFamily:"sans-serif",letterSpacing:"0.01em",transition:"background 0.2s"}}>
            {loading?"Generating your goal-setting guide...":"Generate goal-setting guide"}
          </button>
          {!isPro&&remaining<=1&&!loading&&(<p style={{textAlign:"center",fontSize:12,color:COLORS.amber,marginTop:10,fontFamily:"sans-serif"}}>{remaining===0?"You've used all free goals.":"Last free goal."}{" "}<span style={{textDecoration:"underline",cursor:"pointer"}} onClick={()=>{setUpgradeTrigger("limit");setShowUpgrade(true);}}>Upgrade for unlimited access.</span></p>)}
        </div>

        {/* Goal sharpening */}
        {goalCheck && !goalAccepted && (
          <div style={{background:COLORS.amberLight,border:`1px solid ${COLORS.amber}`,borderRadius:14,padding:"24px 28px",marginBottom:24}}>
            <div style={{display:"flex",alignItems:"flex-start",gap:14,marginBottom:16}}>
              <div style={{fontSize:20,lineHeight:1,flexShrink:0}}>⚠️</div>
              <div><p style={{fontSize:14,fontWeight:700,color:COLORS.navy,margin:"0 0 4px",fontFamily:"sans-serif"}}>Your goal needs sharpening</p><p style={{fontSize:13,color:COLORS.text,margin:0,fontFamily:"sans-serif",lineHeight:1.6}}>{goalCheck.reason}</p></div>
            </div>
            <div style={{marginBottom:16}}>
              <label style={{display:"block",fontSize:13,fontWeight:600,color:COLORS.navy,marginBottom:6,fontFamily:"sans-serif"}}>Suggested rewrite — edit if needed:</label>
              <textarea value={sharpenedGoal} onChange={e=>setSharpenedGoal(e.target.value)} rows={4} style={{width:"100%",padding:"10px 14px",border:`1.5px solid ${COLORS.amber}`,borderRadius:8,fontSize:13.5,lineHeight:1.6,color:COLORS.text,fontFamily:"Georgia, serif",boxSizing:"border-box",background:COLORS.white,outline:"none",resize:"vertical"}} />
            </div>
            <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
              <button onClick={()=>{setGoalAccepted(true);runGenerate(sharpenedGoal);}} style={{padding:"10px 20px",background:COLORS.navy,color:"#fff",border:"none",borderRadius:8,fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"sans-serif"}}>Use this — generate guide</button>
              <button onClick={()=>{setGoalCheck(null);setGoalAccepted(true);setSharpenedGoal(form.goalDescription);runGenerate(form.goalDescription);}} style={{padding:"10px 20px",background:COLORS.white,color:COLORS.navy,border:`1px solid ${COLORS.border}`,borderRadius:8,fontSize:13,fontWeight:500,cursor:"pointer",fontFamily:"sans-serif"}}>Keep my original wording</button>
            </div>
          </div>
        )}

        {/* Results */}
        {result && (
          <div ref={resultsRef}>
            <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:20}}>
              <h2 style={{fontSize:18,fontWeight:700,color:COLORS.navy,margin:0,fontFamily:"sans-serif"}}>Your goal-setting guide</h2>
              <Badge color="green">Ready to use</Badge>
            </div>

            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:20}}>
              <div style={{background:COLORS.blueLight,border:`1px solid ${COLORS.blue}`,borderRadius:10,padding:"14px 18px"}}>
                <p style={{fontSize:11,fontWeight:600,color:COLORS.blue,textTransform:"uppercase",letterSpacing:"0.06em",margin:"0 0 4px",fontFamily:"sans-serif"}}>Goal type</p>
                <p style={{fontSize:16,fontWeight:700,color:COLORS.navy,margin:"0 0 2px"}}>{GOAL_TYPE_INFO[result.goalType]?.icon} {GOAL_TYPE_INFO[result.goalType]?.label||result.goalType}</p>
                <p style={{fontSize:12,color:COLORS.muted,margin:0,fontFamily:"sans-serif",lineHeight:1.4}}>{GOAL_TYPE_INFO[result.goalType]?.desc}</p>
              </div>
              <div style={{background:"#F5F3FF",border:"1px solid #7C3AED",borderRadius:10,padding:"14px 18px"}}>
                <p style={{fontSize:11,fontWeight:600,color:"#7C3AED",textTransform:"uppercase",letterSpacing:"0.06em",margin:"0 0 4px",fontFamily:"sans-serif"}}>Coaching mode</p>
                <p style={{fontSize:16,fontWeight:700,color:COLORS.navy,margin:"0 0 2px"}}>{result.coachingMode}</p>
                <p style={{fontSize:12,color:COLORS.muted,margin:0,fontFamily:"sans-serif",lineHeight:1.4}}>{{Direct:"Clear guidance and close involvement.",Coaching:"Questions that build their thinking.",Supporting:"Encouragement and evidence of capability.",Delegating:"Clear goal, agreed freedom, then trust."}[result.coachingMode]||""}</p>
              </div>
            </div>

            <div style={{background:result.challengeZone.colorLight,border:`1px solid ${result.challengeZone.color}`,borderRadius:12,padding:"18px 22px",marginBottom:20}}>
              <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
                <span style={{fontSize:20}}>{result.challengeZone.icon}</span>
                <div><p style={{fontSize:11,fontWeight:600,color:result.challengeZone.color,textTransform:"uppercase",letterSpacing:"0.06em",margin:0}}>Challenge assessment</p><p style={{fontSize:16,fontWeight:700,color:COLORS.navy,margin:0}}>{result.challengeZone.zone}</p></div>
              </div>
              <p style={{fontSize:13,color:COLORS.text,lineHeight:1.6,margin:"0 0 6px",fontFamily:"sans-serif"}}>{result.challengeZone.summary}</p>
              <p style={{fontSize:12.5,color:COLORS.muted,fontStyle:"italic",lineHeight:1.5,margin:0,fontFamily:"sans-serif"}}>{result.challengeZone.supportLevel}</p>
            </div>

            <div style={{background:COLORS.tealLight,border:`1px solid ${COLORS.teal}`,borderRadius:12,padding:"18px 22px",marginBottom:20}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12,flexWrap:"wrap",gap:10}}>
                <div style={{display:"flex",alignItems:"center",gap:10}}>
                  <div style={{width:32,height:32,background:COLORS.teal,borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",fontSize:15}}>🔁</div>
                  <div><p style={{fontSize:11,fontWeight:600,color:COLORS.teal,textTransform:"uppercase",letterSpacing:"0.06em",margin:0}}>Recommended review cadence</p><p style={{fontSize:16,fontWeight:700,color:COLORS.navy,margin:0}}>{result.cadence.frequency}</p></div>
                </div>
                {!result.cadence.frequency.toLowerCase().includes("milestone")&&(
                  <button onClick={()=>generateICS({goalTitle:result.goalTitle,personName:result.personName,managerName:result.managerName,cadence:result.cadence})} style={{display:"flex",alignItems:"center",gap:6,padding:"7px 14px",background:COLORS.teal,color:"#fff",border:"none",borderRadius:8,fontSize:12.5,fontWeight:600,cursor:"pointer",fontFamily:"sans-serif",whiteSpace:"nowrap"}}><span style={{fontSize:14}}>📅</span> Add to calendar</button>
                )}
              </div>
              <p style={{fontSize:13,color:COLORS.text,lineHeight:1.6,margin:"0 0 8px",fontFamily:"sans-serif"}}><strong>Format:</strong> {result.cadence.format}</p>
              <p style={{fontSize:13,color:COLORS.muted,lineHeight:1.6,margin:0,fontStyle:"italic",fontFamily:"sans-serif"}}>{result.cadence.rationale}</p>
            </div>

            <OutputBox title="Advice for the manager" content={result.advice} badge={{color:"blue",label:"Manager only"}} />
            <OutputBox title={`Goal brief for ${result.personName}`} content={result.brief} badge={{color:"teal",label:"Share with your person"}} />
            {result.goalTemplate && <OutputBox title="Goal template" content={result.goalTemplate} badge={{color:"purple",label:"Use in your conversation"}} />}

            <div style={{background:COLORS.slateLight,borderRadius:10,padding:"14px 18px",border:`1px solid ${COLORS.border}`,display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:10}}>
              <p style={{fontSize:13,color:COLORS.muted,margin:0,fontFamily:"sans-serif"}}>Both outputs are editable. Adjust to fit your voice before sharing.</p>
              <button onClick={resetAll} style={{fontSize:13,padding:"7px 16px",background:COLORS.white,border:`1px solid ${COLORS.border}`,borderRadius:8,color:COLORS.navy,cursor:"pointer",fontFamily:"sans-serif",fontWeight:500}}>New goal</button>
            </div>
          </div>
        )}

        {!result && !loading && (
          <div style={{marginTop:8}}>
            <h3 style={{fontSize:13,fontWeight:600,color:COLORS.muted,textTransform:"uppercase",letterSpacing:"0.06em",margin:"0 0 16px",fontFamily:"sans-serif"}}>How it works</h3>
            <div style={{display:"grid",gridTemplateColumns:"repeat(3, 1fr)",gap:12}}>
              {[{n:"1",title:"Describe the goal",desc:"Tell us what you are aiming for and for whom."},{n:"2",title:"Profile the person",desc:"Skill, confidence, and stretch level shape the right approach."},{n:"3",title:"Get your guide",desc:"Receive a goal-setting plan and a ready goal brief."}].map(s=>(
                <div key={s.n} style={{background:COLORS.white,border:`1px solid ${COLORS.border}`,borderRadius:10,padding:"16px 18px"}}>
                  <div style={{width:28,height:28,background:COLORS.navy,borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:700,color:"#fff",marginBottom:10,fontFamily:"sans-serif"}}>{s.n}</div>
                  <p style={{fontSize:13,fontWeight:600,color:COLORS.navy,margin:"0 0 4px",fontFamily:"sans-serif"}}>{s.title}</p>
                  <p style={{fontSize:12.5,color:COLORS.muted,margin:0,lineHeight:1.5,fontFamily:"sans-serif"}}>{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{borderTop:`1px solid ${COLORS.border}`,marginTop:40,paddingTop:20,textAlign:"center"}}>
          <p style={{fontSize:12,color:COLORS.muted,margin:0,fontFamily:"sans-serif"}}>
            GoalIgnite by <a href="https://themessagebusiness.com" style={{color:COLORS.teal,textDecoration:"none"}}>The Message Business</a>
            {!isPro&&<> · {remaining} free {remaining===1?"use":"uses"} remaining · <span style={{textDecoration:"underline",cursor:"pointer",color:COLORS.blue}} onClick={()=>{setUpgradeTrigger("manual");setShowUpgrade(true);}}>Upgrade to Pro</span></>}
            {isPro&&<> · <span style={{color:COLORS.green,fontWeight:600}}>Pro — unlimited access</span></>}
          </p>
        </div>
      </div>
    </div>
  );
}
