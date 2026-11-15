import { useEffect, useState } from "react";
import { Activity, Bot, CheckCircle2, ChevronRight, CircleHelp, Command, FileImage, Gauge, Instagram, LayoutDashboard, LockKeyhole, Menu, MessageCircle, MessageSquareText, Settings, ShieldCheck, Sparkles, Users, X, Zap, Clock3, BarChart3, Send, Plug } from "lucide-react";

type Section = "Overview" | "Instagram accounts" | "DM Inbox" | "AI Assistant" | "Approval Centre" | "Content Studio" | "Analytics" | "System Monitor" | "Settings";
type BackendStatus = "checking" | "online" | "offline";
const API = "https://natha-ai.gokulmaniraj2008.workers.dev";
const nav: {name:Section; icon:typeof LayoutDashboard; desc:string}[] = [
 {name:"Overview",icon:LayoutDashboard,desc:"Your workspace at a glance"},
 {name:"Instagram accounts",icon:Instagram,desc:"Connect and manage accounts"},
 {name:"DM Inbox",icon:MessageCircle,desc:"Review customer conversations"},
 {name:"AI Assistant",icon:Bot,desc:"Configure response behaviour"},
 {name:"Approval Centre",icon:CheckCircle2,desc:"Review before anything is sent"},
 {name:"Content Studio",icon:FileImage,desc:"Prepare posts and campaigns"},
 {name:"Analytics",icon:BarChart3,desc:"Measure account performance"},
 {name:"System Monitor",icon:Activity,desc:"Backend and integration health"},
 {name:"Settings",icon:Settings,desc:"Workspace preferences and security"}
];
function App(){
 const [section,setSection]=useState<Section>("Overview");
 const [mobile,setMobile]=useState(false);
 const [status,setStatus]=useState<BackendStatus>("checking");
 const [ai,setAi]=useState(false);
 const [notice,setNotice]=useState("");
 const [approval,setApproval]=useState(true);
 const notify=(s:string)=>{setNotice(s);window.setTimeout(()=>setNotice(""),4000)};
 const check=async()=>{setStatus("checking");try{const r=await fetch(API+"/health");if(!r.ok)throw Error();const d=await r.json();if(d?.bot!=="NATHA AI"||d?.status!=="online")throw Error();setAi(Boolean(d.ai_enabled));setStatus("online")}catch{setStatus("offline");setAi(false)}};
 useEffect(()=>{void check()},[]);
 const select=(s:Section)=>{setSection(s);setMobile(false)};
 const current=nav.find(n=>n.name===section)!;
 return <div className="os-shell">
  <aside className={mobile?"os-sidebar open":"os-sidebar"}>
   <div className="os-brand"><span className="os-mark"><Command size={19}/></span><span>NATHA <i>META OS</i></span><button className="os-close" onClick={()=>setMobile(false)}><X/></button></div>
   <div className="os-workspace"><span className="os-avatar">G</span><span><b>GKFXL Workspace</b><small>Instagram operations</small></span><ChevronRight size={15}/></div>
   <div className="os-nav-label">WORKSPACE</div>
   {nav.slice(0,7).map(n=><button key={n.name} className={section===n.name?"os-nav active":"os-nav"} onClick={()=>select(n.name)}><n.icon size={17}/>{n.name}{n.name==="Approval Centre"?<em>Manual</em>:null}</button>)}
   <div className="os-nav-label">ADMINISTRATION</div>
   {nav.slice(7).map(n=><button key={n.name} className={section===n.name?"os-nav active":"os-nav"} onClick={()=>select(n.name)}><n.icon size={17}/>{n.name}</button>)}
   <div className="os-sidebar-bottom"><ShieldCheck size={17}/><span><b>Approval-first mode</b><small>Sending requires your approval</small></span></div>
  </aside>
  {mobile&&<button className="os-scrim" onClick={()=>setMobile(false)} aria-label="Close menu"/>}
  <main className="os-main">
   <header className="os-top"><button className="os-menu" onClick={()=>setMobile(true)}><Menu/></button><div className="os-breadcrumb">NATHA META OS <span>/</span> {section}</div><div className="os-top-right"><span className={"os-status "+status}><i/>{status==="checking"?"Checking":status==="online"?"Backend online":"Backend offline"}</span><button className="os-help" onClick={()=>notify("Setup guidance will appear here as integrations are enabled.")}><CircleHelp size={18}/></button><span className="os-avatar">G</span></div></header>
   <div className="os-content">
    <div className="os-page-head"><div><div className="os-kicker">GKFXL · CONTROL CENTER</div><h1>{section}</h1><p>{current.desc}</p></div><div className="os-live-pill"><span/> WORKSPACE PREVIEW</div></div>
    {section==="Overview"?<>
      <div className="os-welcome"><div><div className="os-kicker">YOUR BUSINESS, ONE WORKSPACE</div><h2>Good to see you.</h2><p>Connect your Instagram account to start managing conversations and content.</p></div><button className="os-primary" onClick={()=>select("Instagram accounts")}><Instagram size={17}/> Connect Instagram</button></div>
      <div className="os-stats">{[{label:"Connected accounts",value:"—",sub:"Awaiting Meta OAuth",icon:Instagram},{label:"Open conversations",value:"—",sub:"No live inbox data yet",icon:MessageCircle},{label:"Pending approvals",value:"—",sub:"Approval queue not connected",icon:CheckCircle2},{label:"AI replies sent",value:"—",sub:"No sending without approval",icon:Bot}].map(x=><div className="os-stat" key={x.label}><div>{x.label}<x.icon size={17}/></div><strong>{x.value}</strong><small>{x.sub}</small></div>)}</div>
      <div className="os-grid"><section className="os-panel"><div className="os-panel-head"><div><h3>Get started</h3><p>Complete these steps to activate your workspace</p></div><span className="os-count">0 / 4</span></div>{[{t:"Connect Instagram with Meta",d:"Authorize GKFXL securely",ic:Instagram,s:"Instagram accounts" as Section},{t:"Configure your AI assistant",d:"Set tone, language and reply rules",ic:Bot,s:"AI Assistant" as Section},{t:"Review approval settings",d:"Keep sending under your control",ic:ShieldCheck,s:"Approval Centre" as Section},{t:"Prepare your first post",d:"Create content for review",ic:FileImage,s:"Content Studio" as Section}].map(x=><button className="os-task" key={x.t} onClick={()=>select(x.s)}><span><x.ic size={18}/></span><div><b>{x.t}</b><small>{x.d}</small></div><ChevronRight size={17}/></button>)}</section><section className="os-panel"><div className="os-panel-head"><div><h3>System health</h3><p>Live checks from your backend</p></div><button className="os-refresh" onClick={()=>void check()}>Refresh</button></div><div className="os-health-row"><span>Cloudflare Worker</span><b className={status}>{status==="online"?"Online":status==="checking"?"Checking":"Offline"}</b></div><div className="os-health-row"><span>NATHA AI</span><b>{ai?"Enabled":"Not confirmed"}</b></div><div className="os-health-row"><span>Meta OAuth</span><b className="pending">Not connected</b></div><div className="os-health-row"><span>Supabase account link</span><b className="pending">Not verified</b></div><p className="os-note">Statuses are only shown when verified; unavailable integrations are not presented as active.</p></section></div>
    </>:null}
    {section==="Instagram accounts"? <div className="os-panel os-feature"><span className="os-feature-icon"><Instagram size={27}/></span><div className="os-kicker">OFFICIAL META AUTHORIZATION</div><h2>Connect your Instagram professional account</h2><p>Use Meta Login to authorize GKFXL. The connection will be completed only after the OAuth callback, state validation, token exchange and secure storage are implemented and tested.</p><div className="os-health-row"><span>Account connection</span><b className="pending">Not connected</b></div><div className="os-health-row"><span>OAuth callback</span><b className="pending">Implementation pending</b></div><button className="os-primary" disabled onClick={()=>notify("OAuth is not ready yet. This button stays disabled until the callback is tested.")}><LockKeyhole size={16}/> Connect securely · Coming soon</button><p className="os-note">Never paste your App Secret or access token into this page or a public repository.</p></div>:null}
    {section==="DM Inbox"? <div className="os-panel os-empty"><MessageSquareText size={32}/><h2>Your conversations will appear here</h2><p>Inbox access requires a connected Instagram account and approved messaging permissions.</p><button className="os-secondary" onClick={()=>select("Instagram accounts")}>Set up Instagram first</button></div>:null}
    {section==="AI Assistant"? <div className="os-grid"><section className="os-panel"><h3>Assistant configuration</h3><p>Define how NATHA should help with customer messages.</p><div className="os-health-row"><span>Backend AI status</span><b>{ai?"Enabled":"Not confirmed"}</b></div><div className="os-health-row"><span>Auto-send</span><b className="pending">Disabled by default</b></div><div className="os-health-row"><span>Human approval</span><b className="good">Required</b></div></section><section className="os-panel"><h3>Response rules</h3><p>These controls will become editable when the assistant settings API is connected.</p><div className="os-note">No automatic replies are enabled from this dashboard preview.</div></section></div>:null}
    {section==="Approval Centre"? <div className="os-panel os-feature"><span className="os-feature-icon"><ShieldCheck size={27}/></span><div className="os-kicker">HUMAN-IN-THE-LOOP CONTROL</div><h2>Nothing goes out without your approval</h2><p>Review proposed DM replies and posts before sending or publishing. This preview does not yet load live approval records.</p><label className="os-toggle-row"><span><b>Require approval before sending</b><small>Keep automatic sending disabled until verified</small></span><input type="checkbox" checked={approval} onChange={e=>setApproval(e.target.checked)}/></label><div className="os-note">{approval?"Approval-first preference is enabled in this preview.":"This preview preference is off; backend enforcement is not configured."}</div></div>:null}
    {section==="Content Studio"? <div className="os-panel os-empty"><FileImage size={32}/><h2>Create and review content</h2><p>Draft posts, attach media and send them to the approval queue. Publishing will remain disabled until Meta permissions and approval enforcement are ready.</p><button className="os-secondary" onClick={()=>select("Approval Centre")}>View approval controls</button></div>:null}
    {section==="Analytics"? <div className="os-panel os-empty"><BarChart3 size={32}/><h2>Insights will appear here</h2><p>Account reach, engagement and content performance will load after Meta Insights permission is connected.</p></div>:null}
    {section==="System Monitor"? <div className="os-panel"><h3>Integration status</h3><div className="os-health-row"><span>Cloudflare Worker health endpoint</span><b className={status}>{status==="online"?"Online":status==="checking"?"Checking":"Offline"}</b></div><div className="os-health-row"><span>AI feature flag</span><b>{ai?"Enabled":"Unavailable"}</b></div><div className="os-health-row"><span>Instagram OAuth</span><b className="pending">Not implemented</b></div><div className="os-health-row"><span>Supabase organization mapping</span><b className="pending">Not verified</b></div><button className="os-secondary" onClick={()=>void check()}>Run health check</button></div>:null}
    {section==="Settings"? <div className="os-grid"><section className="os-panel"><h3>Workspace</h3><div className="os-health-row"><span>Workspace name</span><b>GKFXL</b></div><div className="os-health-row"><span>Mode</span><b>Preview</b></div><div className="os-health-row"><span>Publishing</span><b className="pending">Approval required</b></div></section><section className="os-panel"><h3>Security</h3><div className="os-health-row"><span>Secret handling</span><b className="good">Server-side only</b></div><div className="os-health-row"><span>Meta App ID</span><b>Configured (reported)</b></div><div className="os-health-row"><span>App Secret value</span><b className="pending">Not exposed / not verified</b></div></section></div>:null}
    <footer className="os-footer"><span><Command size={14}/> NATHA META OS</span><span>Secure conversations · Your control</span><span>© 2026</span></footer>
   </div>
  </main>
  {notice&&<div className="os-toast"><ShieldCheck size={17}/>{notice}<button onClick={()=>setNotice("")}><X size={15}/></button></div>}
 </div>
}
export default App;
