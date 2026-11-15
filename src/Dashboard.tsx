import { useMemo, useState, type ReactNode } from "react";
import {
  Activity, ArrowDownLeft, ArrowUpRight, Bell, BookOpen, Bot, Check,
  ChevronDown, CircleHelp, Clock3, Download, Filter, Instagram, LayoutDashboard,
  LockKeyhole, LogOut, MessageCircle, MessageSquareText, MoreHorizontal,
  Plus, Plug, Search, Send, Settings, ShieldCheck, Sparkles, ToggleLeft, Users, X, Zap
} from "lucide-react";

type Props = { onBack: () => void };
type Section = "overview" | "inbox" | "accounts" | "assistant" | "knowledge" | "analytics" | "customers" | "settings";

const nav = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "inbox", label: "Inbox", icon: MessageCircle },
  { id: "accounts", label: "Instagram accounts", icon: Instagram },
  { id: "assistant", label: "AI assistant", icon: Bot },
  { id: "knowledge", label: "Knowledge base", icon: BookOpen },
  { id: "analytics", label: "Analytics", icon: Activity },
  { id: "customers", label: "Customers", icon: Users },
  { id: "settings", label: "Settings", icon: Settings },
] as const;

const sampleChats = [
  { id: 1, name: "Priya S", handle: "@priya_creates", time: "10:42 AM", text: "Hi! Can you share your pricing details?", unread: true, initials: "PS" },
  { id: 2, name: "Arun Kumar", handle: "@arun.k", time: "Yesterday", text: "Thank you for the quick response.", unread: false, initials: "AK" },
  { id: 3, name: "Meera", handle: "@meerastudio", time: "Yesterday", text: "Do you provide custom packages?", unread: false, initials: "M" },
];

function Badge({ children, tone = "muted" }: { children: ReactNode; tone?: "muted" | "green" | "amber" }) {
  return <span className={`n-badge ${tone}`}>{children}</span>;
}

export default function Dashboard({ onBack }: Props) {
  const [section, setSection] = useState<Section>("overview");
  const [search, setSearch] = useState("");
  const [selectedChat, setSelectedChat] = useState(1);
  const [reply, setReply] = useState("");
  const [autoReply, setAutoReply] = useState(false);
  const [approval, setApproval] = useState(true);
  const [tone, setTone] = useState("Friendly and professional");
  const [language, setLanguage] = useState("English");
  const [knowledge, setKnowledge] = useState(["Business introduction", "Pricing and packages", "Frequently asked questions"]);
  const [newKnowledge, setNewKnowledge] = useState("");
  const [notice, setNotice] = useState("");
  const [period, setPeriod] = useState("Last 7 days");

  const filteredChats = useMemo(() => sampleChats.filter(c => (c.name + c.handle + c.text).toLowerCase().includes(search.toLowerCase())), [search]);
  const activeChat = sampleChats.find(c => c.id === selectedChat) ?? sampleChats[0];
  const notify = (message: string) => { setNotice(message); window.setTimeout(() => setNotice(""), 3600); };

  const heading = nav.find(n => n.id === section)?.label ?? "Overview";
  return <main className="n-dashboard">
    <aside className="n-sidebar">
      <button className="n-brand" onClick={onBack}><span className="n-brand-mark">N</span><span>NATHA <small>META OS</small></span></button>
      <div className="n-workspace"><span className="n-workspace-icon">G</span><span><b>GKFXL Workspace</b><small>Starter workspace</small></span><ChevronDown size={15}/></div>
      <div className="n-nav-label">WORKSPACE</div>
      <nav className="n-side-nav">{nav.map(item => <button key={item.id} className={section === item.id ? "selected" : ""} onClick={() => setSection(item.id)}><item.icon size={17}/>{item.label}{item.id === "inbox" && <i>3</i>}</button>)}</nav>
      <div className="n-sidebar-bottom">
        <div className="n-plan"><Sparkles size={17}/><b>Build your workspace</b><p>Connect Meta and unlock live conversations.</p><button onClick={() => { setSection("accounts"); notify("Meta OAuth is not configured yet. No account connection was started."); }}>View setup</button></div>
        <button className="n-profile" onClick={() => setSection("settings")}><span className="n-avatar">G</span><span><b>Workspace admin</b><small>Admin setup required</small></span><MoreHorizontal size={17}/></button>
      </div>
    </aside>

    <section className="n-main">
      <header className="n-topbar"><div className="n-breadcrumb">Workspace <span>/</span> {heading}</div><div className="n-top-actions"><Badge tone="amber">PREVIEW MODE</Badge><button className="n-icon-button" onClick={() => notify("No notifications yet.")}><Bell size={18}/></button><button className="n-help" onClick={onBack}><CircleHelp size={17}/> Website</button></div></header>
      <div className="n-content">
        <div className="n-preview-alert"><ShieldCheck size={17}/><span><b>Preview environment</b> — this dashboard currently uses sample content. Login, Meta OAuth, and live customer data are not connected. No messages are sent from this screen.</span></div>
        {section === "overview" && <>
          <div className="n-page-title"><div><div className="n-eyebrow">YOUR WORKSPACE AT A GLANCE</div><h1>Good day, Admin</h1><p>Here’s what’s happening across your customer conversations.</p></div><button className="n-button secondary" onClick={() => setSection("accounts")}><Plus size={16}/> Connect account</button></div>
          <div className="n-stat-grid">
            <Stat label="Connected accounts" value="0" note="No Meta accounts connected" icon={<Instagram/>}/>
            <Stat label="Open conversations" value="—" note="Waiting for live inbox" icon={<MessageSquareText/>}/>
            <Stat label="AI-assisted replies" value="—" note="Assistant not connected" icon={<Bot/>}/>
            <Stat label="Response time" value="—" note="No activity data yet" icon={<Clock3/>}/>
          </div>
          <div className="n-overview-grid">
            <div className="n-panel"><div className="n-panel-head"><div><h3>Conversation activity</h3><p>Sample layout · real metrics appear after connection</p></div><select value={period} onChange={e => setPeriod(e.target.value)}><option>Last 7 days</option><option>Last 30 days</option><option>This month</option></select></div><div className="n-chart-placeholder"><div className="n-chart-lines"><i/><i/><i/><i/></div><div className="n-chart-empty"><Activity size={24}/><b>No analytics yet</b><span>Connect Instagram to start collecting activity.</span></div><div className="n-chart-days"><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span></div></div></div>
            <div className="n-panel n-setup-panel"><div className="n-panel-head"><div><h3>Getting started</h3><p>Complete these steps to launch</p></div><Badge tone="amber">0 / 4</Badge></div><SetupRow title="Secure admin authentication" detail="Protect your workspace" onClick={() => setSection("settings")}/><SetupRow title="Connect Instagram with Meta" detail="Authorize a professional account" onClick={() => setSection("accounts")}/><SetupRow title="Set up your AI assistant" detail="Choose tone and response rules" onClick={() => setSection("assistant")}/><SetupRow title="Add business knowledge" detail="Teach the assistant about your business" onClick={() => setSection("knowledge")}/></div>
          </div>
          <div className="n-panel"><div className="n-panel-head"><div><h3>Recent conversations</h3><p>Your latest Instagram messages will appear here.</p></div><button className="n-link" onClick={() => setSection("inbox")}>Open inbox <ArrowUpRight size={15}/></button></div><div className="n-empty-row"><MessageCircle size={20}/> No live conversations yet</div></div>
        </>}

        {section === "inbox" && <><PageTitle eyebrow="CUSTOMER MESSAGES" title="Inbox" subtitle="Review and respond to Instagram conversations."/><div className="n-inbox-layout"><div className="n-panel n-chat-list"><div className="n-search"><Search size={16}/><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search conversations"/></div><div className="n-filter-row"><button className="active"><Filter size={14}/> All messages</button><button onClick={() => notify("Unread filter will be available with live inbox data.")}>Unread</button></div>{filteredChats.map(c => <button key={c.id} className={selectedChat === c.id ? "n-chat-item active" : "n-chat-item"} onClick={() => setSelectedChat(c.id)}><span className="n-chat-avatar">{c.initials}</span><span className="n-chat-info"><b>{c.name}</b><small>{c.text}</small></span><span className="n-chat-meta">{c.time}{c.unread && <i/>}</span></button>)}{filteredChats.length === 0 && <div className="n-empty-row">No matching sample chats</div>}</div><div className="n-panel n-chat-detail"><div className="n-chat-header"><span className="n-chat-avatar">{activeChat.initials}</span><span><b>{activeChat.name}</b><small>{activeChat.handle} · Sample conversation</small></span><Badge>Sample</Badge></div><div className="n-chat-messages"><div className="n-date-separator">TODAY · SAMPLE DATA</div><div className="n-message incoming">{activeChat.text}<small>{activeChat.time}</small></div><div className="n-message outgoing">Thanks for reaching out! Our team will be happy to help you.<small>Example reply · not sent</small></div></div><div className="n-reply-box"><textarea value={reply} onChange={e => setReply(e.target.value)} placeholder="Type a reply (demo only)…"/><div><span>Sending is disabled in preview mode.</span><button disabled={!reply.trim()} onClick={() => { setReply(""); notify("Demo only: this message was not sent to Instagram."); }}><Send size={15}/> Send</button></div></div></div></div></>}

        {section === "accounts" && <><PageTitle eyebrow="META INTEGRATION" title="Instagram accounts" subtitle="Manage the professional accounts authorized for this workspace."/><div className="n-connect-card"><div className="n-connect-icon"><Instagram size={30}/></div><div className="n-connect-copy"><Badge tone="amber">NOT CONNECTED</Badge><h2>Connect your Instagram professional account</h2><p>Meta OAuth needs to be configured on the secure backend before accounts can be connected. Your Instagram password should never be entered here.</p><ul><li><Check size={15}/> Business or Creator account</li><li><Check size={15}/> Linked Facebook Page or supported Meta setup</li><li><Check size={15}/> Approved messaging permissions and webhook subscription</li></ul><button className="n-button primary" onClick={() => notify("Connection is safely disabled until Meta OAuth credentials and redirect URL are configured.")}><LockKeyhole size={16}/> Meta connection setup required</button></div></div><div className="n-panel"><h3>Account connection checklist</h3><SetupRow title="Meta developer app" detail="App ID configured on server" done={false}/><SetupRow title="OAuth redirect URL" detail="Registered in Meta developer settings" done={false}/><SetupRow title="Messaging permissions" detail="App Review and access requirements" done={false}/><SetupRow title="Webhook subscription" detail="messages field and account subscription" done={false}/></div></>}

        {section === "assistant" && <><PageTitle eyebrow="AUTOMATION CONTROLS" title="AI assistant" subtitle="Configure how the assistant should respond. These settings are local preview only."/><div className="n-assistant-grid"><div className="n-panel"><div className="n-panel-head"><div><h3><Bot size={18}/> Reply behavior</h3><p>Choose when the assistant may prepare replies.</p></div><Badge tone="amber">Not connected</Badge></div><SettingToggle title="AI reply assistance" detail="Enable AI reply generation after backend integration." value={autoReply} onChange={setAutoReply}/><SettingToggle title="Require approval before sending" detail="Keep a human review step before customer messages are sent." value={approval} onChange={setApproval}/><div className="n-form-field"><label>Assistant tone</label><select value={tone} onChange={e => setTone(e.target.value)}><option>Friendly and professional</option><option>Formal and concise</option><option>Warm and conversational</option></select></div><div className="n-form-field"><label>Default language</label><select value={language} onChange={e => setLanguage(e.target.value)}><option>English</option><option>Tamil</option><option>English and Tamil</option><option>Hindi</option></select></div><button className="n-button secondary" onClick={() => notify("Preview preferences updated locally. They are not saved to a server.")}>Save preview preferences</button></div><div className="n-panel"><h3><Sparkles size={18}/> Safety rules</h3><p className="n-muted">Recommended defaults for a responsible messaging assistant.</p><div className="n-safety-item"><ShieldCheck/><span><b>Human approval</b><small>Keep approval enabled until replies are tested.</small></span></div><div className="n-safety-item"><LockKeyhole/><span><b>No sensitive requests</b><small>Escalate payment, password, or account-security questions.</small></span></div><div className="n-safety-item"><Users/><span><b>Respect customer context</b><small>Do not message users outside Meta's allowed messaging window.</small></span></div></div></div></>}

        {section === "knowledge" && <><PageTitle eyebrow="BUSINESS CONTEXT" title="Knowledge base" subtitle="Organize approved information the assistant can use when answering customers."/><div className="n-panel"><div className="n-panel-head"><div><h3>Knowledge sources</h3><p>Local preview list; content is not uploaded or stored remotely.</p></div><Badge>{knowledge.length} items</Badge></div><div className="n-add-row"><input value={newKnowledge} onChange={e => setNewKnowledge(e.target.value)} placeholder="Add a knowledge topic…"/><button className="n-button primary" disabled={!newKnowledge.trim()} onClick={() => {setKnowledge([...knowledge,newKnowledge.trim()]);setNewKnowledge("");}}> <Plus size={15}/> Add topic</button></div>{knowledge.map((k,i)=><div className="n-knowledge-row" key={k}><span className="n-file-icon"><BookOpen size={17}/></span><span><b>{k}</b><small>Topic placeholder · content not added</small></span><button onClick={()=>setKnowledge(knowledge.filter((_,j)=>i!==j))} aria-label="Remove topic"><X size={16}/></button></div>)}</div><div className="n-info-note"><CircleHelp size={17}/> Next integration: upload and parse approved FAQs, product details, service policies and business documents securely.</div></>}

        {section === "analytics" && <><PageTitle eyebrow="PERFORMANCE" title="Analytics" subtitle="Track message volume, response quality and assistant performance."/><div className="n-stat-grid"><Stat label="Messages received" value="—" note="No live data" icon={<ArrowDownLeft/>}/><Stat label="Replies sent" value="—" note="No live data" icon={<ArrowUpRight/>}/><Stat label="Average response time" value="—" note="No live data" icon={<Clock3/>}/><Stat label="Resolution rate" value="—" note="No live data" icon={<Check/>}/></div><div className="n-panel n-analytics-empty"><Activity size={30}/><h3>Analytics will appear after connection</h3><p>Connect an Instagram account and receive real webhook events to populate verified reports. Sample figures are intentionally not shown as real results.</p></div></>}

        {section === "customers" && <><PageTitle eyebrow="MULTI-TENANT MANAGEMENT" title="Customers & workspaces" subtitle="Manage organizations with isolated accounts, settings and permissions."/><div className="n-panel"><div className="n-panel-head"><div><h3>Customer workspaces</h3><p>Multi-customer authentication and tenant storage are not configured yet.</p></div><Badge tone="amber">Not active</Badge></div><div className="n-analytics-empty"><Users size={30}/><h3>No customer workspaces</h3><p>Customer registration, invitations, roles and tenant isolation will be enabled after database and authentication setup.</p></div></div></>}

        {section === "settings" && <><PageTitle eyebrow="WORKSPACE CONFIGURATION" title="Settings" subtitle="Manage security, team access and connected services."/><div className="n-settings-grid"><div className="n-panel"><h3><LockKeyhole size={18}/> Admin security</h3><p>Authentication is not enabled. Do not treat this preview as a private admin console.</p><Badge tone="amber">Setup required</Badge><SetupRow title="Admin sign-in" detail="Secure identity provider and session cookies" done={false}/><SetupRow title="Role-based access" detail="Owner, admin and agent roles" done={false}/><SetupRow title="Audit log" detail="Track sensitive configuration changes" done={false}/></div><div className="n-panel"><h3><Plug size={18}/> Services</h3><ServiceRow name="NATHA AI Worker" status="Health endpoint is checked separately" tone="muted"/><ServiceRow name="Meta Instagram API" status="Not connected" tone="amber"/><ServiceRow name="Database" status="No D1 database configured" tone="amber"/><ServiceRow name="Customer authentication" status="Not configured" tone="amber"/></div></div></>}
      </div>
    </section>
    {notice && <div className="n-toast"><ShieldCheck size={17}/>{notice}<button onClick={()=>setNotice("")}><X size={15}/></button></div>}
  </main>;
}

function Stat({label,value,note,icon}:{label:string;value:string;note:string;icon:React.ReactNode}){return <div className="n-stat"><div className="n-stat-top"><span>{label}</span><i>{icon}</i></div><strong>{value}</strong><small>{note}</small></div>}
function PageTitle({eyebrow,title,subtitle}:{eyebrow:string;title:string;subtitle:string}){return <div className="n-page-title"><div><div className="n-eyebrow">{eyebrow}</div><h1>{title}</h1><p>{subtitle}</p></div></div>}
function SetupRow({title,detail,done=false,onClick}:{title:string;detail:string;done?:boolean;onClick?:()=>void}){return <button className="n-setup-row" onClick={onClick}><span className={done?"n-check done":"n-check"}>{done?<Check size={13}/>:<span/>}</span><span><b>{title}</b><small>{detail}</small></span><ArrowUpRight size={15}/></button>}
function SettingToggle({title,detail,value,onChange}:{title:string;detail:string;value:boolean;onChange:(v:boolean)=>void}){return <div className="n-toggle-row"><span><b>{title}</b><small>{detail}</small></span><button className={value?"n-switch on":"n-switch"} onClick={()=>onChange(!value)} aria-pressed={value}><i/></button></div>}
function ServiceRow({name,status,tone}:{name:string;status:string;tone:"muted"|"amber"}){return <div className="n-service-row"><span><b>{name}</b><small>{status}</small></span><Badge tone={tone}>{tone==="amber"?"Pending":"Configured"}</Badge></div>}
