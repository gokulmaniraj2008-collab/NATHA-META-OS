import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity, BarChart3, Bot, CheckCircle2, ChevronRight, Command, FileImage,
  Instagram, LayoutDashboard, LockKeyhole, LogOut, Menu, MessageCircle, Eye, EyeOff,
  MessageSquareText, RefreshCw, Settings, ShieldCheck, X, Users
} from "lucide-react";
import {
  AuthSession, AuthUser, DbRow, backendUrl, clearSession, dbRequest,
  ensureWorkspace, getSession, getUser, saveSession, signIn, signOut, signUp
} from "./lib/supabase";

type Section = "Overview" | "Instagram accounts" | "DM Inbox" | "AI Assistant" | "Approval Centre" | "Content Studio" | "Analytics" | "System Monitor" | "Settings";
type Account = { id:string; username:string; instagram_user_id:string; status:string };
type Conversation = { id:string; username:string|null; ig_scoped_user_id:string; status:string; last_message_at:string|null };
type Message = { id:string; conversation_id:string; body:string|null; direction:string; delivery_status:string; created_at:string };
type Approval = { id:string; kind:string; payload:Record<string,unknown>; status:string; recipient_id:string|null; created_at:string; instagram_account_id:string; conversation_id:string|null };
type SettingsRow = { id:string; auto_reply_enabled:boolean; require_approval:boolean; instructions:string|null };
type Workspace = { accounts:Account[]; conversations:Conversation[]; messages:Message[]; approvals:Approval[]; settings:SettingsRow[] };

const nav:{name:Section;icon:typeof LayoutDashboard;desc:string}[]=[
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

const emptyWorkspace:Workspace={accounts:[],conversations:[],messages:[],approvals:[],settings:[]};
function messageOf(error:unknown){return error instanceof Error?error.message:"Something went wrong. Please try again."}
function stamp(value:string){return new Date(value).toLocaleString(undefined,{dateStyle:"medium",timeStyle:"short"});}

function AuthGate({onAuthenticated}:{onAuthenticated:(session:AuthSession)=>Promise<void>}){
 const [mode,setMode]=useState<"signin"|"signup">("signin");
 const [email,setEmail]=useState("");
 const [password,setPassword]=useState("");
 const [showPassword,setShowPassword]=useState(false);
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState("");
 const [info,setInfo]=useState("");
 const submit=async(e:FormEvent)=>{e.preventDefault();setBusy(true);setError("");setInfo("");try{
   if(mode==="signin"){const s=await signIn(email.trim(),password);saveSession(s);await onAuthenticated(s);}
   else {const result=await signUp(email.trim(),password);if(result.access_token&&result.refresh_token){const s=result as AuthSession;saveSession(s);await onAuthenticated(s);}else{setInfo("Account created. Check your email to confirm it, then sign in.");setMode("signin");}}
  }catch(err){setError(messageOf(err));clearSession();}finally{setBusy(false);}};
 return <div className="auth-shell"><div className="auth-card">
  <div className="os-brand auth-brand"><span className="os-mark"><Command size={19}/></span><span>NATHA <i>META OS</i></span></div>
  <div className="os-kicker">GKFXL · SECURE WORKSPACE</div><h1>{mode==="signin"?"Welcome back":"Create your workspace login"}</h1>
  <p>Sign in to manage your Instagram workspace. Your account data is protected by Supabase authentication and organization-level access rules.</p>
  <form onSubmit={submit} className="auth-form">
   <label>Email address<input type="email" autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" required/></label>
   <label>Password<div className="password-input-wrap"><input type={showPassword?"text":"password"} autoComplete={mode==="signin"?"current-password":"new-password"} value={password} onChange={e=>setPassword(e.target.value)} minLength={8} placeholder="At least 8 characters" required/><button type="button" className="password-visibility" onClick={()=>setShowPassword(v=>!v)} aria-label={showPassword?"Hide password":"Show password"} aria-pressed={showPassword}>{showPassword?<EyeOff size={17}/>:<Eye size={17}/>}</button></div></label>
   {error&&<div className="auth-error" role="alert">{error}</div>}{info&&<div className="auth-info" role="status">{info}</div>}
   <button className="os-primary auth-submit" disabled={busy}>{busy?"Please wait…":mode==="signin"?"Sign in securely":"Create account"}</button>
  </form>
  <button className="auth-switch" onClick={()=>{setMode(mode==="signin"?"signup":"signin");setError("");setInfo("");}}>{mode==="signin"?"New to NATHA? Create an account":"Already have an account? Sign in"}</button>
  <div className="auth-foot"><LockKeyhole size={14}/> Secure sign-in · No Instagram token stored in this browser</div>
 </div></div>;
}

function App(){
 const [section,setSection]=useState<Section>("Overview");
 const [mobile,setMobile]=useState(false);
 const [session,setSession]=useState<AuthSession|null>(null);
 const [user,setUser]=useState<AuthUser|null>(null);
 const [organizationId,setOrganizationId]=useState("");
 const [workspace,setWorkspace]=useState<Workspace>(emptyWorkspace);
 const [loading,setLoading]=useState(true);
 const [dataLoading,setDataLoading]=useState(false);
 const [backend,setBackend]=useState<"checking"|"online"|"offline">("checking");
 const [notice,setNotice]=useState("");
 const [error,setError]=useState("");
 const [selectedConversation,setSelectedConversation]=useState("");
 const [instructions,setInstructions]=useState("");
 const [requireApproval,setRequireApproval]=useState(true);
 const [draftCaption,setDraftCaption]=useState("");
 const [authMessage,setAuthMessage]=useState("");
 const [oauthBusy,setOauthBusy]=useState(false);
 const [manualUsername,setManualUsername]=useState("");
 const [manualInstagramId,setManualInstagramId]=useState("");
 const [manualAccessToken,setManualAccessToken]=useState("");
 const [manualBusy,setManualBusy]=useState(false);

 const notify=(value:string)=>{setNotice(value);window.setTimeout(()=>setNotice(""),4500);};
 const activate=useCallback(async(s:AuthSession)=>{
   const u=await getUser(s);
   const org=await ensureWorkspace(s,u);
   setSession(s);setUser(u);setOrganizationId(org);setAuthMessage("");
 },[]);

 const refreshWorkspace=useCallback(async()=>{
   if(!session||!organizationId)return;
   setDataLoading(true);setError("");
   try{
    const filter={select:"*",organization_id:`eq.${organizationId}`};
    const [accounts,conversations,messages,approvals,settings]=await Promise.all([
     dbRequest<Account[]>("natha_instagram_accounts",{...filter,order:"created_at.desc"},session),
     dbRequest<Conversation[]>("natha_conversations",{...filter,order:"last_message_at.desc.nullslast",limit:"100"},session),
     dbRequest<Message[]>("natha_messages",{...filter,order:"created_at.desc",limit:"200"},session),
     dbRequest<Approval[]>("natha_approvals",{...filter,order:"created_at.desc",limit:"100"},session),
     dbRequest<SettingsRow[]>("natha_automation_settings",{...filter,order:"updated_at.desc",limit:"10"},session)
    ]);
    setWorkspace({accounts,conversations,messages,approvals,settings});
    const setting=settings[0];setRequireApproval(setting?.require_approval??true);setInstructions(setting?.instructions??"");
   }catch(err){setError(messageOf(err));}
   finally{setDataLoading(false);}
 },[session,organizationId]);

 useEffect(()=>{let active=true;(async()=>{try{const s=await getSession();if(s&&active)await activate(s);}catch(err){clearSession();if(active)setAuthMessage(messageOf(err));}finally{if(active)setLoading(false);}})();return()=>{active=false;};},[activate]);
 useEffect(()=>{if(session&&organizationId)void refreshWorkspace();},[session,organizationId,refreshWorkspace]);
 useEffect(()=>{let active=true;fetch(backendUrl+"/health").then(r=>{if(!r.ok)throw Error();return r.json();}).then(d=>{if(active&&d?.bot==="NATHA AI"&&d?.status==="online")setBackend("online");else if(active)setBackend("offline");}).catch(()=>{if(active)setBackend("offline");});return()=>{active=false;};},[]);
 useEffect(()=>{const params=new URLSearchParams(window.location.search);const result=params.get("instagram_oauth");if(!result)return;if(result==="connected"){notify("Instagram account connected successfully.");void refreshWorkspace();}else{const reason=params.get("reason")||"unknown";setError("Instagram connection could not be completed ("+reason+"). Check the Meta app OAuth settings and try again.");}const clean=new URL(window.location.href);clean.searchParams.delete("instagram_oauth");clean.searchParams.delete("accounts");clean.searchParams.delete("reason");window.history.replaceState(window.history.state,"",clean.pathname+clean.search+clean.hash);},[]);

 // Keep workspace navigation in browser history so Android's Back button
 // returns to the previously opened NATHA section instead of leaving the app.
 useEffect(()=>{
  const validSections=nav.map(item=>item.name) as Section[];
  const currentState=window.history.state;
  if(!currentState?.nathaMetaOs){
   window.history.replaceState({nathaMetaOs:true,section:"Overview"},"");
  }
  const handlePopState=(event:PopStateEvent)=>{
   const previous=event.state?.nathaMetaOs&&validSections.includes(event.state.section)
    ? event.state.section as Section
    : "Overview";
   setSection(previous);
   setMobile(false);
  };
  window.addEventListener("popstate",handlePopState);
  return()=>window.removeEventListener("popstate",handlePopState);
 },[]);
 const current=nav.find(n=>n.name===section)!;
 const select=(s:Section)=>{
  if(s!==section){
   window.history.pushState({nathaMetaOs:true,section:s},"");
   setSection(s);
  }
  setMobile(false);
 };
 const pending=useMemo(()=>workspace.approvals.filter(a=>a.status==="pending"),[workspace.approvals]);
 const activeConversation=workspace.conversations.find(c=>c.id===selectedConversation)||workspace.conversations[0];
 const activeMessages=workspace.messages.filter(m=>m.conversation_id===activeConversation?.id).slice().reverse();

 const reviewApproval=async(item:Approval,status:"approved"|"rejected")=>{
  if(!session||!user)return;
  try{
   const updated=await dbRequest<Approval[]>("natha_approvals",{id:`eq.${item.id}`,status:"eq.pending" },session,"PATCH",{status,reviewed_by:user.id,reviewed_at:new Date().toISOString()});
   if(!updated.length)throw Error("This item has already been reviewed or you do not have permission.");
   notify(status==="approved"?"Draft approved. Sending remains paused until the secure sender is connected.":"Draft rejected.");
   await refreshWorkspace();
  }catch(err){setError(messageOf(err));}
 };

 const saveAssistant=async()=>{
  if(!session||!user)return;
  try{
   const current=workspace.settings[0];
   if(current) await dbRequest("natha_automation_settings",{id:`eq.${current.id}`},session,"PATCH",{instructions,require_approval:true,auto_reply_enabled:false,updated_by:user.id,updated_at:new Date().toISOString()});
   else await dbRequest("natha_automation_settings",{select:"id"},session,"POST",{organization_id:organizationId,auto_reply_enabled:false,require_approval:true,instructions,updated_by:user.id});
   setRequireApproval(true);notify("Assistant settings saved. Human approval remains mandatory.");await refreshWorkspace();
  }catch(err){setError(messageOf(err));}
 };

 const createDraft=async(e:FormEvent)=>{
  e.preventDefault();if(!session||!workspace.accounts[0])return;
  try{
   await dbRequest("natha_approvals",{select:"id"},session,"POST",{organization_id:organizationId,instagram_account_id:workspace.accounts[0].id,kind:"feed_post",payload:{caption:draftCaption.trim()},status:"pending",created_by:user?.id});
   setDraftCaption("");notify("Post draft added to the approval queue.");await refreshWorkspace();select("Approval Centre");
  }catch(err){setError(messageOf(err));}
 };

 const connectInstagram=async()=>{
  if(!session||!organizationId)return;
  setOauthBusy(true);setError("");
  try{
   const response=await fetch(backendUrl+"/oauth/start",{method:"POST",headers:{"Content-Type":"application/json",Authorization:"Bearer "+session.access_token},body:JSON.stringify({organization_id:organizationId})});
   const data=await response.json().catch(()=>({}));
   if(!response.ok||!data.authorization_url)throw new Error(data.error||"Could not open Meta authorization.");
   window.location.assign(data.authorization_url);
  }catch(err){setError(messageOf(err));setOauthBusy(false);}
 };
 const connectInstagramManually=async(e:FormEvent)=>{
  e.preventDefault();
  if(!session||!organizationId)return;
  setManualBusy(true);setError("");
  try{
   const response=await fetch(backendUrl+"/instagram/manual-connect",{method:"POST",headers:{"Content-Type":"application/json",Authorization:"Bearer "+session.access_token},body:JSON.stringify({organization_id:organizationId,username:manualUsername.trim().replace(/^@/,""),instagram_user_id:manualInstagramId.trim(),access_token:manualAccessToken.trim()})});
   const data=await response.json().catch(()=>({}));
   if(!response.ok||!data.connected)throw new Error(data.error||"Manual connection service is not available yet. Your token was not saved.");
   setManualAccessToken("");setManualInstagramId("");setManualUsername("");
   notify("Instagram account verified and connected.");await refreshWorkspace();
  }catch(err){setError(messageOf(err));}
  finally{setManualBusy(false);}
 };
 const logout=async()=>{if(session)await signOut(session);setSession(null);setUser(null);setOrganizationId("");setWorkspace(emptyWorkspace);setSection("Overview");};
 if(loading)return <div className="auth-shell"><div className="auth-loading"><span className="os-mark"><Command size={19}/></span><p>Opening your secure workspace…</p></div></div>;
 if(!session||!user)return <AuthGate onAuthenticated={activate}/>;

 return <div className="os-shell">
  <aside className={mobile?"os-sidebar open":"os-sidebar"}>
   <div className="os-brand"><span className="os-mark"><Command size={19}/></span><span>NATHA <i>META OS</i></span><button className="os-close" onClick={()=>setMobile(false)} aria-label="Close menu"><X/></button></div>
   <div className="os-workspace"><span className="os-avatar">G</span><span><b>GKFXL Workspace</b><small>{user?.email||"Signed-in workspace"}</small></span><ChevronRight size={15}/></div>
   <div className="os-nav-label">WORKSPACE</div>
   {nav.slice(0,7).map(n=><button key={n.name} className={section===n.name?"os-nav active":"os-nav"} onClick={()=>select(n.name)}><n.icon size={17}/>{n.name}{n.name==="Approval Centre"?<em>{pending.length}</em>:null}</button>)}
   <div className="os-nav-label">ADMINISTRATION</div>
   {nav.slice(7).map(n=><button key={n.name} className={section===n.name?"os-nav active":"os-nav"} onClick={()=>select(n.name)}><n.icon size={17}/>{n.name}</button>)}
   <div className="os-sidebar-bottom"><ShieldCheck size={17}/><span><b>Approval-first mode</b><small>All outbound actions need review</small></span></div>
  </aside>
  {mobile&&<button className="os-scrim" onClick={()=>setMobile(false)} aria-label="Close menu"/>}
  <main className="os-main">
   <header className="os-top"><button className="os-menu" onClick={()=>setMobile(true)} aria-label="Open menu"><Menu/></button><div className="os-breadcrumb">NATHA META OS <span>/</span> {section}</div><div className="os-top-right"><span className={"os-status "+backend}><i/>{backend==="checking"?"Checking":backend==="online"?"Backend online":"Backend offline"}</span><button className="os-help" onClick={()=>notify("Use the setup steps shown on each integration page.")}><Users size={17}/></button><span className="os-avatar">G</span></div></header>
   <div className="os-content">
    <div className="os-page-head"><div><div className="os-kicker">GKFXL · CONTROL CENTER</div><h1>{section}</h1><p>{current.desc}</p></div><div className="os-live-pill"><span/> AUTHENTICATED WORKSPACE</div></div>
    {error&&<div className="os-error" role="alert">{error}<button onClick={()=>setError("")}><X size={14}/></button></div>}
    {authMessage&&<div className="os-note">{authMessage}</div>}
    {section==="Overview"&&<>
      <div className="os-welcome"><div><div className="os-kicker">YOUR BUSINESS, ONE WORKSPACE</div><h2>Good to see you.</h2><p>Your workspace is authenticated. Connect an Instagram professional account to activate messaging and insights.</p></div><button className="os-primary" onClick={()=>select("Instagram accounts")}><Instagram size={17}/> Connect Instagram</button></div>
      <div className="os-stats">{[
       {label:"Connected accounts",value:workspace.accounts.filter(a=>a.status==="connected").length,sub:"Instagram professional accounts",icon:Instagram},
       {label:"Open conversations",value:workspace.conversations.filter(c=>c.status==="open").length,sub:"From your connected accounts",icon:MessageCircle},
       {label:"Pending approvals",value:pending.length,sub:"Waiting for your review",icon:CheckCircle2},
       {label:"Messages stored",value:workspace.messages.length,sub:"Latest 200 workspace messages",icon:MessageSquareText}
      ].map(x=><div className="os-stat" key={x.label}><div>{x.label}<x.icon size={17}/></div><strong>{x.value}</strong><small>{x.sub}</small></div>)}</div>
      <div className="os-grid"><section className="os-panel"><div className="os-panel-head"><div><h3>Get started</h3><p>Activate your workspace in order</p></div><span className="os-count">{workspace.accounts.length? "1":"0"} / 4</span></div>
       {[{t:"Connect Instagram with Meta",d:"Authorize your professional account",ic:Instagram,s:"Instagram accounts" as Section},{t:"Configure your AI assistant",d:"Set response rules and tone",ic:Bot,s:"AI Assistant" as Section},{t:"Review pending approvals",d:"Approve or reject suggested content",ic:ShieldCheck,s:"Approval Centre" as Section},{t:"Prepare your first post",d:"Create a draft for review",ic:FileImage,s:"Content Studio" as Section}].map(x=><button className="os-task" key={x.t} onClick={()=>select(x.s)}><span><x.ic size={18}/></span><div><b>{x.t}</b><small>{x.d}</small></div><ChevronRight size={17}/></button>)}
      </section><section className="os-panel"><div className="os-panel-head"><div><h3>System health</h3><p>Live service checks</p></div><button className="os-refresh" onClick={()=>void refreshWorkspace()}><RefreshCw size={13}/> Refresh</button></div>
       <div className="os-health-row"><span>Cloudflare Worker</span><b className={backend}>{backend==="online"?"Online":backend==="checking"?"Checking":"Offline"}</b></div>
       <div className="os-health-row"><span>Supabase session</span><b className="good">Authenticated</b></div>
       <div className="os-health-row"><span>Instagram OAuth</span><b className="pending">{workspace.accounts.length?"Account record found":"Not connected"}</b></div>
       <div className="os-health-row"><span>Outbound automation</span><b className="pending">Paused pending approval API</b></div>
       <p className="os-note">Data is loaded from your authenticated workspace, not preview placeholders.</p>
      </section></div>
    </>}
    {section==="Instagram accounts"&&<>
     <div className="os-panel os-feature"><span className="os-feature-icon"><Instagram size={27}/></span><div className="os-kicker">OFFICIAL META AUTHORIZATION</div><h2>Instagram professional accounts</h2><p>Connect with Meta, or enter an Instagram Business Account ID and a valid Meta access token below. Credentials are sent to the secure backend for verification and encryption; they are not saved in this browser.</p>
      {workspace.accounts.length?workspace.accounts.map(a=><div className="os-health-row" key={a.id}><span>@{a.username}</span><b className={a.status==="connected"?"good":"pending"}>{a.status}</b></div>):<div className="os-empty-inline">No Instagram account is connected yet.</div>}
      <button className="os-primary" onClick={()=>void connectInstagram()} disabled={oauthBusy}><LockKeyhole size={16}/>{oauthBusy?" Opening Meta…":" Connect with Meta"}</button>
      <p className="os-note">Meta authorization is recommended. Manual connection requires an eligible token with the permissions needed for the Instagram Graph API.</p>
     </div>
     <div className="os-panel os-feature">
      <div className="os-kicker">MANUAL CONNECTION</div><h2>Enter Instagram API details</h2>
      <p>Use your Instagram professional account ID and a Meta access token. Do not enter your Instagram password. The token will be sent directly to the backend and cleared from this form after a successful verification.</p>
      <form className="os-draft-form" onSubmit={connectInstagramManually}>
       <label className="os-field">Instagram username<input value={manualUsername} onChange={e=>setManualUsername(e.target.value)} placeholder="@GKFXL" autoComplete="off" required/></label>
       <label className="os-field">Instagram Business Account ID<input value={manualInstagramId} onChange={e=>setManualInstagramId(e.target.value)} placeholder="Numeric Instagram account ID" inputMode="numeric" autoComplete="off" required/></label>
       <label className="os-field">Meta access token<input type="password" value={manualAccessToken} onChange={e=>setManualAccessToken(e.target.value)} placeholder="Paste access token" autoComplete="new-password" required/></label>
       <button className="os-primary" disabled={manualBusy||!manualUsername.trim()||!manualInstagramId.trim()||!manualAccessToken.trim()}><LockKeyhole size={16}/>{manualBusy?" Verifying securely…":" Verify and connect account"}</button>
      </form>
      <p className="os-note">Connection is shown as active only after the backend verifies the token against Meta and stores it encrypted. Never paste the token into chat or a public repository.</p>
     </div>
    </>}
    {section==="DM Inbox"&&<div className="os-inbox-layout"><section className="os-panel"><div className="os-panel-head"><div><h3>Conversations</h3><p>{workspace.conversations.length} stored conversations</p></div><button className="os-refresh" onClick={()=>void refreshWorkspace()}>Refresh</button></div>
     {workspace.conversations.length?workspace.conversations.map(c=><button key={c.id} className={"os-conversation "+((activeConversation?.id===c.id)?"selected":"")} onClick={()=>setSelectedConversation(c.id)}><b>{c.username||c.ig_scoped_user_id}</b><small>{c.last_message_at?stamp(c.last_message_at):"No recent message"}</small></button>):<div className="os-empty-inline">Your inbox is empty. Connect Instagram and configure webhooks to receive messages.</div>}
    </section><section className="os-panel os-chat-panel"><h3>{activeConversation?.username||"Message thread"}</h3><p>Conversation history</p>{activeMessages.length?activeMessages.map(m=><div key={m.id} className={"os-message "+m.direction}><span>{m.body||"Attachment"}</span><small>{stamp(m.created_at)}</small></div>):<div className="os-empty-inline">Select a conversation to read its messages.</div>}<p className="os-note">Reply sending is disabled until the backend approval sender is fully connected.</p></section></div>}
    {section==="AI Assistant"&&<div className="os-panel os-feature"><span className="os-feature-icon"><Bot size={27}/></span><div className="os-kicker">ASSISTANT CONFIGURATION</div><h2>Response behaviour</h2><p>Set the guidance NATHA uses to draft responses. Automatic replies are disabled while the approval workflow is being completed.</p>
     <label className="os-field">Assistant instructions<textarea value={instructions} onChange={e=>setInstructions(e.target.value)} rows={5} placeholder="Reply in the customer's language. Keep responses concise. Never invent order or payment details."/></label>
     <div className="os-health-row"><span>Require human approval</span><b className="good">Always on</b></div><div className="os-health-row"><span>Automatic sending</span><b className="pending">Disabled</b></div>
     <button className="os-primary" onClick={()=>void saveAssistant()} >Save assistant settings</button>
    </div>}
    {section==="Approval Centre"&&<section className="os-panel"><div className="os-panel-head"><div><h3>Approval queue</h3><p>Review AI reply and content drafts before anything is sent</p></div><span className="os-count">{pending.length} pending</span></div>
     {workspace.approvals.length?workspace.approvals.map(item=><article className="os-approval" key={item.id}><div className="os-approval-head"><span className="os-kind">{item.kind.replace("_"," ")}</span><b className={"approval-status "+item.status}>{item.status}</b></div><p>{String(item.payload?.message||item.payload?.caption||"No preview text")}</p><small>{stamp(item.created_at)}</small>{item.status==="pending"&&<div className="os-approval-actions"><button className="os-secondary" onClick={()=>void reviewApproval(item,"rejected")}>Reject</button><button className="os-primary" onClick={()=>void reviewApproval(item,"approved")}>Approve draft</button></div>}{item.status==="approved"&&<div className="os-note">Approved. Sending remains paused until the secure sender is enabled.</div>}</article>):<div className="os-empty-inline">No pending approvals. New DM suggestions and post drafts will appear here.</div>}
    </section>}
    {section==="Content Studio"&&<div className="os-panel os-feature"><span className="os-feature-icon"><FileImage size={27}/></span><div className="os-kicker">CONTENT DRAFTS</div><h2>Prepare a post for review</h2><p>Create a caption draft and send it to the approval queue. Publishing stays disabled until Meta publishing permissions and the approval sender are verified.</p>
     <form onSubmit={createDraft} className="os-draft-form"><label className="os-field">Post caption<textarea rows={5} value={draftCaption} onChange={e=>setDraftCaption(e.target.value)} placeholder="Write your Instagram caption…" required/></label><button className="os-primary" disabled={!workspace.accounts.some(a=>a.status==="connected")||!draftCaption.trim()}><ShieldCheck size={16}/> Save as pending draft</button></form>
     {!workspace.accounts.some(a=>a.status==="connected")&&<p className="os-note">Connect an Instagram account before creating a publishing draft.</p>}
    </div>}
    {section==="Analytics"&&<><div className="os-stats"><div className="os-stat"><div>Conversations<Users size={17}/></div><strong>{workspace.conversations.length}</strong><small>Stored in this workspace</small></div><div className="os-stat"><div>Inbound messages<MessageCircle size={17}/></div><strong>{workspace.messages.filter(m=>m.direction==="inbound").length}</strong><small>Latest 200 messages</small></div><div className="os-stat"><div>Outbound messages<MessageSquareText size={17}/></div><strong>{workspace.messages.filter(m=>m.direction==="outbound").length}</strong><small>Latest 200 messages</small></div><div className="os-stat"><div>Approved drafts<CheckCircle2 size={17}/></div><strong>{workspace.approvals.filter(a=>a.status==="approved").length}</strong><small>Awaiting send integration</small></div></div><div className="os-panel os-empty"><BarChart3 size={32}/><h2>Meta Insights not connected</h2><p>Reach, impressions and engagement will be shown after Instagram OAuth and Insights permissions are approved.</p></div></>}
    {section==="System Monitor"&&<div className="os-panel"><h3>Integration status</h3><div className="os-health-row"><span>Cloudflare Worker health endpoint</span><b className={backend}>{backend==="online"?"Online":"Unavailable"}</b></div><div className="os-health-row"><span>Supabase authentication</span><b className="good">Connected</b></div><div className="os-health-row"><span>Organization membership</span><b className="good">Active</b></div><div className="os-health-row"><span>Instagram OAuth callback</span><b className="pending">Ready for Meta authorization</b></div><div className="os-health-row"><span>Approval sender</span><b className="pending">Paused</b></div><div className="os-health-row"><span>Automatic DM replies</span><b className="good">Disabled</b></div><button className="os-secondary" onClick={()=>void refreshWorkspace()}>Refresh workspace data</button></div>}
    {section==="Settings"&&<div className="os-grid"><section className="os-panel"><h3>Workspace</h3><div className="os-health-row"><span>Workspace</span><b>GKFXL Workspace</b></div><div className="os-health-row"><span>Account email</span><b>{user?.email}</b></div><div className="os-health-row"><span>Approval mode</span><b className="good">Required</b></div></section><section className="os-panel"><h3>Security</h3><div className="os-health-row"><span>Authentication</span><b className="good">Supabase Auth</b></div><div className="os-health-row"><span>Session storage</span><b>Current browser tab</b></div><div className="os-health-row"><span>Secret handling</span><b className="good">Server-side only</b></div><button className="os-secondary os-logout" onClick={()=>void logout()}><LogOut size={15}/> Sign out</button></section></div>}
    <footer className="os-footer"><span><Command size={14}/> NATHA META OS</span><span>Approval-first · GKFXL</span><span>© 2026</span></footer>
   </div>
  </main>
  {notice&&<div className="os-toast"><ShieldCheck size={17}/>{notice}<button onClick={()=>setNotice("")}><X size={15}/></button></div>}
 </div>;
}
export default App;
