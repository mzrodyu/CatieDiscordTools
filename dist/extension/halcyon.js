/*! Halcyon v0.7.30 — https://github.com/mzrodyu/CatieDiscordTools */
"use strict";var Halcyon=(()=>{var ec={debug:10,info:20,warn:30,error:40},jp={debug:"#8E8E93",info:"#0A84FF",warn:"#FF9F0A",error:"#FF453A"},zp=500,sr=[],ci=new Set,Bp=ec.info;function ar(e,t,n){let r={time:Date.now(),level:e,scope:t,parts:n};sr.push(r),sr.length>zp&&sr.shift();for(let s of ci)try{s(r)}catch{}if(ec[e]<Bp)return;let i=`background:${jp[e]};color:#fff;border-radius:4px;padding:0 6px;font-weight:600`;(e==="error"?console.error:e==="warn"?console.warn:console.log)(`%cHalcyon%c ${t}`,i,"color:inherit;font-weight:600",...n)}function g(e){return{debug:(...t)=>ar("debug",e,t),info:(...t)=>ar("info",e,t),warn:(...t)=>ar("warn",e,t),error:(...t)=>ar("error",e,t),child:t=>g(`${e}:${t}`)}}function li(){return sr.slice()}function tc(e){return ci.add(e),()=>ci.delete(e)}var Se=g("modules"),nc="webpackChunkdiscord_app",Fe,sn=!1,rc=!1,cr=new Set,di=[],oc=()=>{};function ac(e){oc=e,globalThis.__halcyon_self__=t=>oc(t)}function sc(e){di.push({index:1,count:1,optional:!1,...e,applied:!1,hits:0,seen:0})}function Y(){return di.map(({pluginId:e,label:t,applied:n,hits:r,seen:i,index:a,count:s,optional:c})=>({pluginId:e,label:t,applied:n,hits:r,seen:i,index:a,count:s,optional:c}))}function ui(){if(rc)return;rc=!0;let e=globalThis,t=e[nc]??[],n=a=>function(...s){try{ic(s[0])}catch(c){Se.error("failed to instrument chunk",c)}return a.apply(this??t,s)},r=t.push,i=typeof r=="function"&&r!==Array.prototype.push?n(r.bind(t)):Array.prototype.push.bind(t);try{Object.defineProperty(t,"push",{configurable:!0,get:()=>i,set:a=>{i=n(a)}})}catch(a){Se.error("could not install chunk interceptor",a);return}e[nc]=t;for(let a of t)try{ic(a)}catch{}t.push([[Symbol("halcyon.require")],{},a=>{Fe=a;try{Up(a)}catch(s){Se.error("failed to wrap pre-existing factories",s)}}])}function Up(e){let t=e?.m;if(!t||typeof t!="object")return;let n=0,r=0;for(let i of Object.keys(t)){let a=t[i];if(!(typeof a!="function"||a.__halcyon__)){if(e.c&&e.c[i]){r++;continue}t[i]=lc(i,a),n++}}(n||r)&&Se.info(`swept pre-existing factories: wrapped ${n}, skipped ${r} already-executed`)}function cc(){return new Promise(e=>{ui(),Yp(t=>mt(t),()=>{sn||(sn=!0,Se.info("core runtime detected"),e())}),setTimeout(()=>{sn||(Se.warn("core module not seen within grace period; continuing degraded"),sn=!0,e())},15e3)})}function ic(e){let t=e?.[1];if(!(!t||typeof t!="object"))for(let n of Object.keys(t)){let r=t[n];typeof r!="function"||r.__halcyon__||(t[n]=lc(n,r))}}function lc(e,t){let n,r=function(i,a,s){if(!n){let c=di.filter(l=>Kp(l.find,t));for(let l of c)l.seen++;n=c.length?Gp(e,t,c,r):t}n.call(this,i,a,s);try{Wp(i)}catch(c){Se.error("module observer threw for",e,c)}};return r.toString=()=>t.toString(),r.__halcyon__=!0,r}function Gp(e,t,n,r){let i=String(t),a=!1;for(let s of n){let c=i,l=qp(s.replace,s.pluginId);if(i=s.all?i.replace(new RegExp(s.match.source,Fp(s.match.flags)),l):i.replace(s.match,l),i===c){Se.warn(`patch "${s.label}"${s.count>1?` \u7B2C ${s.index}/${s.count} \u5904`:""} (${s.pluginId}) matched module ${e} but changed nothing`);continue}s.applied=!0,s.hits++,a=!0,Se.debug(`applied patch "${s.label}" (${s.pluginId}) to module ${e}`)}if(a&&r)try{r.__halcyon_patched_source__=i}catch{}try{return(0,eval)(`(${Hp(i)})`)}catch(s){return Se.error(`patched module ${e} failed to compile; using original`,s),t}}function Hp(e){let t=e.trimStart();if(/^(async\s+)?function[\s*(]/.test(t)||/^(async\s+)?(\([^)]*\)|[\w$]+)\s*=>/.test(t))return t;let n=t.match(/^(async\s+)?(\*\s*)?(?:\[[^\]]*\]|[\w$]+)\s*\(/);if(n){let r=n[1]?"async ":"",i=n[2]?"*":"";return`${r}function${i}${t.slice(n[0].length-1)}`}return t}function Fp(e){return e.includes("g")?e:e+"g"}function qp(e,t){let n=`__halcyon_self__(${JSON.stringify(t)})`;return typeof e=="string"?e.split("$self").join(n):(...r)=>e(...r).split("$self").join(n)}function Kp(e,t){let n=t.toString();return typeof e=="string"?n.includes(e):e.test(n)}var Vp=40;function hi(e,t,n){try{if(t(e,n))return e}catch{}if(typeof e!="object"&&typeof e!="function")return;let r;try{r=Object.keys(e)}catch{return}if(!(r.length>Vp))for(let i of r){let a;try{a=e[i]}catch{continue}if(!(a==null||typeof a!="object"&&typeof a!="function"))try{if(t(a,n))return a}catch{}}}function Wp(e){if(!cr.size)return;let t=e.exports;if(t!=null)for(let n of cr){let r=hi(t,n.filter,{id:e.id,module:e});r!==void 0&&(cr.delete(n),n.resolve(r))}}function P(e){if(Fe)for(let t of Object.keys(Fe.c)){let n=Fe.c[t],r=n?.exports;if(r==null||r===globalThis)continue;let i=hi(r,e,{id:t,module:n});if(i!==void 0)return i}}function pi(e){let t=[];if(!Fe)return t;for(let n of Object.keys(Fe.c)){let r=Fe.c[n],i=r?.exports;if(i==null||i===globalThis)continue;let a=hi(i,e,{id:n,module:r});a!==void 0&&t.push(a)}return t}function Me(...e){return P(t=>typeof t?.__halcyon_probe__>"u"&&e.every(n=>t[n]!==void 0))}function lr(...e){return P(t=>{if(typeof t!="function")return!1;let n;try{n=Function.prototype.toString.call(t)}catch{return!1}return e.every(r=>n.includes(r))})}function fi(e){return P(t=>t?.getName?.()===e||t?.constructor?.displayName===e)}function mi(){let e=P(t=>typeof t?.Store=="function"&&typeof t.Store.getAll=="function");if(e)try{let t=e.Store.getAll();if(Array.isArray(t)&&t.length>0)return t}catch{}return pi(t=>typeof t?.getName=="function"&&typeof t?.addChangeListener=="function"&&typeof t?.__halcyon_probe__>"u")}function cn(){let e=new Set;for(let t of mi())try{let n=t?.getName?.();typeof n=="string"&&n&&e.add(n)}catch{}return[...e].sort()}function qe(e){let t=fi(e);if(t)return t;for(let n of mi())try{if(n?.getName?.()===e||n?.constructor?.displayName===e)return n}catch{}}function dc(...e){for(let t of mi())try{if(e.every(n=>typeof t?.[n]=="function"))return t}catch{}}function Yp(e,t){let n=P(e);if(n!==void 0){t(n);return}cr.add({filter:e,resolve:t})}function T(e){let t,n=()=>t??=P(e);return new Proxy({},{get(r,i){let a=n();if(a==null)return;let s=a[i];return typeof s=="function"?s.bind(a):s},has(r,i){let a=n();return a!=null&&i in a}})}function uc(...e){let t,n=()=>t??=e.map(r=>qe(r)).find(Boolean);return new Proxy({},{get(r,i){let a=n();if(a==null)return;let s=a[i];return typeof s=="function"?s.bind(a):s},has(r,i){let a=n();return a!=null&&i in a}})}function hc(){let e={};try{e.storeNamesWithQuest=cn().filter(c=>/quest/i.test(c))}catch{}let t=qe("QuestStore")??qe("QuestsStore");if(e.found=!!t,!t)return e;let n=c=>c instanceof Map?`Map(${c.size})`:Array.isArray(c)?`Array(${c.length})`:typeof c,r=new Set;for(let c=t;c&&c!==Object.prototype;c=Object.getPrototypeOf(c))for(let l of Object.getOwnPropertyNames(c))if(l!=="constructor")try{typeof t[l]=="function"&&r.add(l)}catch{}e.questMethods=[...r].filter(c=>/quest/i.test(c));let i;try{let c=t.quests;e.questsGetter=n(c),(c instanceof Map||Array.isArray(c))&&(i=c)}catch(c){e.questsGetter="err:"+c?.message}for(let c of["getQuests","getAllQuests"])try{let l=typeof t[c]=="function"?t[c]():void 0;l!==void 0&&(e[`fn:${c}`]=n(l)),!i&&(l instanceof Map||Array.isArray(l))&&(i=l)}catch{}let a=i instanceof Map?[...i.values()]:Array.isArray(i)?i:[];e.questCount=a.length;let s=a[0];return e.firstQuest=s?{keys:Object.keys(s),userStatus:s.userStatus==null?s.userStatus:Object.keys(s.userStatus),completedAt:s.userStatus?.completedAt,enrolledAt:s.userStatus?.enrolledAt,expiresAt:s.config?.expiresAt,expiresAtType:typeof s.config?.expiresAt}:null,e}function pc(){return sn}function mt(e){return e!=null&&typeof e.__halcyon_probe__>"u"&&typeof e.dispatch=="function"&&typeof e.subscribe=="function"&&(typeof e._actionHandlers<"u"||typeof e._subscriptions<"u"||typeof e._waitQueue<"u"||typeof e.isDispatching=="function"||typeof e.wait=="function")}function dr(e,t=300){let n=Fe?.m;if(!n)return"<webpack require not ready \u2014 open the target UI first>";let r=[];for(let i of Object.keys(n)){let a,s=!1;try{let u=n[i]?.__halcyon_patched_source__;typeof u=="string"?(a=u,s=!0):a=String(n[i])}catch{continue}if(!a.includes(e))continue;let c=[],l=a.indexOf(e),d=0;for(;l>=0&&d<4;)c.push(a.slice(Math.max(0,l-t),l+e.length+t)),l=a.indexOf(e,l+e.length),d++;r.push(`===== module ${i} (${d} hit${d===1?"":"s"}${s?", PATCHED source":""}) =====
${c.join(`
  ...  
`)}`)}return r.length?r.join(`

`):`<no loaded factory contains "${e}">`}function fc(){let e=Y(),t={embedRendered:typeof document<"u"&&!!document.querySelector(".hc-embed"),halcyonMounted:typeof document<"u"&&!!document.querySelector(".halcyon")};try{let n=null,r=document.querySelectorAll("*");for(let m=0;m<r.length&&!n;m++){let b=r[m],E=Object.keys(b).find(z=>z.startsWith("__reactFiber$"));E&&(n=b[E])}if(!n)return JSON.stringify({error:"no React fiber found in DOM",patches:e,dom:t},null,2);let i=n;for(;i.return;)i=i.return;let a=m=>{try{if(typeof m=="function")return Function.prototype.toString.call(m);if(m&&typeof m=="object"){let b=m.type||m.render;if(typeof b=="function")return Function.prototype.toString.call(b)}}catch{}return""},s=m=>m&&(m.displayName||m.name)||m&&m.type&&(m.type.displayName||m.type.name)||"",c=[i],l=0,d=[],u=[],h=new Set,f=new Set;for(;c.length&&l<4e4;){let m=c.shift();l++;let b=m.type;if(b&&(typeof b=="function"||typeof b=="object")){let E=a(b),z=s(b)||"anon",we=E.includes("__halcyon_self__");E.includes("buildLayout")&&d.push({name:z,patched:we}),E.includes("getPredicateSections")&&u.push({name:z,patched:we}),(E.includes("renderSidebar")||E.includes("SETTINGS_SIDEBAR"))&&h.add(z),/settings/i.test(z)&&f.add(z)}m.child&&c.push(m.child),m.sibling&&c.push(m.sibling)}let v=e.find(m=>m.label==="user-settings-layout"),x=e.find(m=>m.label==="user-settings-sidebar"),L=t.embedRendered?"embed rendered \u2014 Halcyon section is on screen":v?.applied||x?.applied?"patch applied at load but section not seen \u2014 open user settings, then re-run":"no settings patch matched this build \u2014 run dumpSource('buildLayout') and share the output";return JSON.stringify({verdict:L,dom:t,patches:e,walked:l,buildLayoutHits:d,gpsHits:u,sidebarComps:[...h].slice(0,25),settingsNamed:[...f].slice(0,40)},null,2)}catch(n){return JSON.stringify({error:String(n),patches:e,dom:t},null,2)}}function mc(e){let t,n=()=>t??=e();return new Proxy(function(){},{get:(r,i)=>n()?.[i],set:(r,i,a)=>{let s=n();return s&&(s[i]=a),!0},has:(r,i)=>{let a=n();return a!=null&&i in a},ownKeys:()=>Reflect.ownKeys(n()??{}),getOwnPropertyDescriptor:(r,i)=>Reflect.getOwnPropertyDescriptor(n()??{},i),apply:(r,i,a)=>n().apply(i,a),construct:(r,i)=>new(n())(...i)})}function ln(...e){return t=>e.every(n=>typeof t[n]=="function")&&typeof t.__halcyon_probe__>"u"}var o=mc(()=>P(ln("createElement","useState","useEffect","useMemo"))),ur=mc(()=>P(ln("createPortal","flushSync"))??P(ln("createPortal")));function Jp(){let e=P(ln("createRoot","hydrateRoot"))??P(ln("createRoot"));return e?.createRoot?.bind(e)}function X(e,t){let n=Jp();if(n){let r=n(t);return r.render(e),()=>{try{r.unmount()}catch{}}}return ur.render(e,t),()=>{try{ur.unmountComponentAtNode(t)}catch{}}}function Rp(e){if(e==null||typeof e!="object")return null;try{for(let t of Object.getOwnPropertyNames(e))if(t.startsWith("__reactFiber$")||t.startsWith("__reactInternalInstance$"))return e[t]}catch{}return null}function ye(e,t=30){let n=[],r=Rp(e);for(let i=0;r!=null&&i<t;i++)try{let a=r.memoizedProps??r.pendingProps;a!=null&&typeof a=="object"&&n.push(a),r=r.return}catch{break}return n}var y=(...e)=>o.useState(...e),C=(...e)=>o.useEffect(...e),hr=(...e)=>o.useMemo(...e);var se=(...e)=>o.useRef(...e);var Xp="halcyon:ext:main",Qp="halcyon:ext:bridge",dn=new Map,gi=!1,gc,Zp=0,pr=new Map,yc=new Promise(e=>{gc=e});function bc(){gi||(gi=!0,gc())}function un(e,t){try{window.postMessage({channel:Xp,kind:e,...t},"*")}catch{}}window.addEventListener("message",e=>{if(e.source!==window)return;let t=e.data;if(!(!t||t.channel!==Qp)){if(t.kind==="hydrate"&&t.entries&&typeof t.entries=="object"){for(let[n,r]of Object.entries(t.entries))typeof r=="string"&&dn.set(n,r);bc()}else if(t.kind==="fetch-result"&&typeof t.id=="number"){let n=pr.get(t.id);n&&(pr.delete(t.id),n(typeof t.text=="string"?t.text:null))}}});var ef={read:e=>dn.has(e)?dn.get(e):null,write:(e,t)=>{dn.set(e,t),un("write",{key:e,value:t})},remove:e=>{dn.delete(e),un("remove",{key:e})}},vc=globalThis.HalcyonNative??={};vc.storage=ef;vc.fetchText=e=>new Promise(t=>{let n=++Zp;pr.set(n,t),un("fetch",{id:n,url:e}),setTimeout(()=>{pr.delete(n)&&t(null)},8e3)});un("hydrate");setTimeout(()=>{gi||un("hydrate")},120);setTimeout(bc,2e3);var vi=g("settings"),yi="halcyon:";function tf(){let e=globalThis.HalcyonNative?.storage;if(e&&typeof e.read=="function"&&typeof e.write=="function")return e;try{let n=globalThis.localStorage;if(n)return{read:r=>n.getItem(r),write:(r,i)=>n.setItem(r,i),remove:r=>n.removeItem(r)}}catch{}vi.warn("no persistent storage backend; settings will not survive a restart");let t=new Map;return{read:n=>t.get(n)??null,write:(n,r)=>void t.set(n,r),remove:n=>void t.delete(n)}}var bi=tf();function Ke(e){let t=bi.read(yi+e);if(!t)return{};try{let n=JSON.parse(t);return n&&typeof n=="object"?n:{}}catch{let n=new Date().toISOString().replace(/[:.]/g,"-");try{bi.write(`${yi}${e}.corrupt-${n}`,t)}catch{}return vi.warn(`stored settings for "${e}" were unreadable; reset to defaults (backup kept)`),{}}}function $t(e,t){try{bi.write(yi+e,JSON.stringify(t))}catch(n){vi.error(`could not persist settings for "${e}"`,n)}}var Lt;try{Lt=globalThis.localStorage}catch{Lt=void 0}var _c="halcyon:hint:";function xc(e){try{if(!Lt)return;let t=Lt.getItem(_c+e);if(!t)return;let n=JSON.parse(t);return n&&typeof n=="object"?n:void 0}catch{return}}function _i(e,t){try{if(!Lt)return;Lt.setItem(_c+e,JSON.stringify(t))}catch{}}var Ve=g("runtime"),Dt="core.enabled",xi=class{records=new Map;enabledMap={};bootPatched=new Set;listeners=new Set;prepared=!1;booted=!1;register(t){if(this.records.has(t.id)){Ve.warn(`duplicate plugin id "${t.id}" ignored`);return}this.records.set(t.id,{plugin:t,state:"disabled"}),t.settings?.__bind(t.id)}registerAll(t){for(let n of t)this.register(n)}prepare(){if(this.prepared)return;this.prepared=!0,ac(r=>this.records.get(r)?.plugin);let t=xc(Dt)??{},n=Ke(Dt)??{};this.enabledMap={...t,...n},this.registerBootPatches(),ui()}async boot(){if(this.booted)return;this.booted=!0,this.prepare(),this.enabledMap=Ke(Dt)??{},_i(Dt,this.enabledMap);for(let{plugin:r}of this.records.values())r.settings?.__bind(r.id);this.registerBootPatches(),await cc();for(let r of this.startOrder())this.shouldRun(r)&&this.startPlugin(r);this.emit(),Ve.info(`runtime up \u2014 v0.7.30 (build 2026-11-19 12:06:23), ${this.runningCount()} plugin(s) active`)}isEnabled(t){let n=this.records.get(t);return n?n.plugin.required?!0:this.enabledMap[t]===!0:!1}enable(t){let n=this.records.get(t);if(n){for(let r of n.plugin.dependencies??[])this.isEnabled(r)||this.enable(r);this.enabledMap[t]=!0,this.persistEnabledState(),this.booted&&pc()&&this.startPlugin(t),this.emit()}}disable(t){let n=this.records.get(t);if(n){if(n.plugin.required){Ve.warn(`"${t}" is required and cannot be disabled`);return}for(let[r,i]of this.records)i.plugin.dependencies?.includes(t)&&this.isEnabled(r)&&this.disable(r);this.enabledMap[t]=!1,this.persistEnabledState(),this.stopPlugin(t),this.emit()}}toggle(t){return this.isEnabled(t)?(this.disable(t),!1):(this.enable(t),!0)}needsRestart(t){return this.records.get(t)?.plugin.patches?.length?this.isEnabled(t)!==this.bootPatched.has(t):!1}getPlugin(t){return this.records.get(t)?.plugin}list(){return[...this.records.values()].map(({plugin:t,state:n,error:r})=>({id:t.id,name:t.name,description:t.description,category:t.category,authors:t.authors,required:t.required??!1,hidden:t.hidden??!1,enabled:this.isEnabled(t.id),state:n,error:r,hasSettings:t.settings!=null,hasPage:t.page!=null,needsRestart:this.needsRestart(t.id)}))}onChange(t){return this.listeners.add(t),()=>this.listeners.delete(t)}shouldRun(t){if(!this.isEnabled(t))return!1;let n=this.records.get(t);return n?(n.plugin.dependencies??[]).every(r=>this.isEnabled(r)):!1}registerBootPatches(){for(let{plugin:t}of this.records.values())this.shouldRun(t.id)&&t.patches?.length&&!this.bootPatched.has(t.id)&&(this.registerPatches(t),this.bootPatched.add(t.id))}registerPatches(t){for(let n of t.patches??[]){let r=Array.isArray(n.replacement)?n.replacement:[n.replacement];r.forEach((i,a)=>{sc({pluginId:t.id,label:n.label,find:n.find,match:i.match,replace:i.replace,all:n.all??!1,index:a+1,count:r.length,optional:n.optional??!1})})}}startPlugin(t){let n=this.records.get(t);if(!(!n||n.state==="running"||n.state==="starting")){n.state="starting";try{n.plugin.start?.(),n.state="running",n.error=void 0,Ve.debug(`started "${t}"`)}catch(r){n.state="errored",n.error=r,this.enabledMap[t]=!1,this.persistEnabledState(),Ve.error(`plugin "${t}" threw during start; it has been disabled`,r)}this.emit()}}stopPlugin(t){let n=this.records.get(t);if(!(!n||n.state!=="running"&&n.state!=="errored")){n.state="stopping";try{n.plugin.stop?.(),Ve.debug(`stopped "${t}"`)}catch(r){Ve.error(`plugin "${t}" threw during stop; state may be inconsistent`,r)}finally{n.state="disabled",this.emit()}}}startOrder(){let t=[],n=new Set,r=(i,a)=>{if(n.has(i))return;if(a.has(i)){Ve.error(`dependency cycle involving "${i}"; breaking it`);return}a.add(i);let s=this.records.get(i);for(let c of s?.plugin.dependencies??[])this.records.has(c)&&r(c,a);a.delete(i),n.add(i),t.push(i)};for(let i of this.records.keys())r(i,new Set);return t}runningCount(){let t=0;for(let n of this.records.values())n.state==="running"&&t++;return t}persistEnabledState(){$t(Dt,this.enabledMap),_i(Dt,this.enabledMap)}emit(){for(let t of this.listeners)try{t()}catch{}}},K=new xi;var nf=Symbol.for("halcyon.plugin"),rf=/^[a-z0-9]+(?:-[a-z0-9]+)*$/;function N(e){if(!rf.test(e.id))throw new Error(`Halcyon: invalid plugin id "${e.id}" \u2014 use lowercase words separated by single dashes.`);if(!e.authors?.length)throw new Error(`Halcyon: plugin "${e.id}" must list at least one author.`);return Object.assign(e,{[nf]:!0})}var wc=`/*
 * Design tokens.
 *
 * Every color, size, radius, and duration used anywhere in Halcyon resolves to
 * one of these variables. Components never hardcode raw values. The palette is
 * flat by design: solid fills only, no gradients.
 *
 * Values mirror docs/ui-design-guide.md. If the two ever disagree, the guide
 * is the source of truth and this file is the bug.
 */

.halcyon {
  /* Accent */
  --hc-accent: #0a84ff;
  --hc-accent-pressed: #0768cc;

  /* Semantic */
  --hc-red: #ff453a;
  --hc-orange: #ff9f0a;
  --hc-yellow: #ffd60a;
  --hc-green: #30d158;
  --hc-teal: #64d2ff;
  --hc-indigo: #5e5ce6;
  --hc-pink: #ff375f;

  /* Neutral surfaces */
  --hc-bg-primary: #000000;
  --hc-bg-secondary: #1c1c1e;
  --hc-bg-tertiary: #2c2c2e;
  --hc-bg-elevated: #2c2c2e;

  /* Fills */
  --hc-fill-primary: rgba(120, 120, 128, 0.36);
  --hc-fill-secondary: rgba(120, 120, 128, 0.24);

  /* Separators */
  --hc-separator: rgba(84, 84, 88, 0.65);
  --hc-separator-opaque: #38383a;

  /* Labels */
  --hc-label-primary: #ffffff;
  --hc-label-secondary: rgba(235, 235, 245, 0.6);
  --hc-label-tertiary: rgba(235, 235, 245, 0.3);
  --hc-label-quaternary: rgba(235, 235, 245, 0.16);

  /* Spacing (8pt grid) */
  --hc-space-1: 4px;
  --hc-space-2: 8px;
  --hc-space-3: 12px;
  --hc-space-4: 16px;
  --hc-space-5: 20px;
  --hc-space-6: 24px;
  --hc-space-8: 32px;
  --hc-space-10: 40px;

  /* Radii */
  --hc-radius-xs: 4px;
  --hc-radius-sm: 6px;
  --hc-radius-md: 10px;
  --hc-radius-lg: 12px;
  --hc-radius-xl: 16px;
  --hc-radius-2xl: 22px;
  --hc-radius-pill: 999px;

  /* Elevation */
  --hc-elev-1: 0 1px 2px rgba(0, 0, 0, 0.24);
  --hc-elev-2: 0 4px 12px rgba(0, 0, 0, 0.32);
  --hc-elev-3: 0 12px 32px rgba(0, 0, 0, 0.44);

  /* Type scale \u2014 sizes paired with absolute line heights */
  --hc-text-title1: 28px;
  --hc-lh-title1: 34px;
  --hc-text-title2: 22px;
  --hc-lh-title2: 28px;
  --hc-text-title3: 20px;
  --hc-lh-title3: 25px;
  --hc-text-headline: 17px;
  --hc-lh-headline: 22px;
  --hc-text-body: 17px;
  --hc-lh-body: 22px;
  --hc-text-callout: 16px;
  --hc-lh-callout: 21px;
  --hc-text-subhead: 15px;
  --hc-lh-subhead: 20px;
  --hc-text-footnote: 13px;
  --hc-lh-footnote: 18px;
  --hc-text-caption1: 12px;
  --hc-lh-caption1: 16px;
  --hc-text-caption2: 11px;
  --hc-lh-caption2: 13px;

  /* Motion */
  --hc-ease: cubic-bezier(0.32, 0.72, 0, 1);
  --hc-duration-fast: 200ms;
  --hc-duration-slow: 300ms;

  /* Font stack */
  --hc-font: -apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display",
    "PingFang SC", "Microsoft YaHei", "Segoe UI", Roboto, sans-serif;
  --hc-font-mono: "SF Mono", ui-monospace, "JetBrains Mono", "Cascadia Code",
    Menlo, Consolas, monospace;
}
`;var Sc=`/*
 * Component styles.
 *
 * Class-based, scoped under \`.halcyon\`. All values reference tokens.css; there
 * are no raw colors or sizes here. Interaction states use flat fills and
 * opacity, never gradients.
 */

.halcyon,
.halcyon * {
  box-sizing: border-box;
}

.halcyon {
  font-family: var(--hc-font);
  color: var(--hc-label-primary);
  -webkit-font-smoothing: antialiased;
}

/* --- Typographic helpers ------------------------------------------------- */

.hc-title2 {
  font-size: var(--hc-text-title2);
  line-height: var(--hc-lh-title2);
  font-weight: 700;
}

.hc-title3 {
  font-size: var(--hc-text-title3);
  line-height: var(--hc-lh-title3);
  font-weight: 600;
}

.hc-headline {
  font-size: var(--hc-text-headline);
  line-height: var(--hc-lh-headline);
  font-weight: 600;
}

.hc-body {
  font-size: var(--hc-text-body);
  line-height: var(--hc-lh-body);
  font-weight: 400;
}

.hc-callout {
  font-size: var(--hc-text-callout);
  line-height: var(--hc-lh-callout);
}

.hc-footnote {
  font-size: var(--hc-text-footnote);
  line-height: var(--hc-lh-footnote);
  color: var(--hc-label-secondary);
}

.hc-muted {
  color: var(--hc-label-secondary);
}

/* --- Button -------------------------------------------------------------- */

.hc-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--hc-space-2);
  border: none;
  cursor: pointer;
  font-family: inherit;
  font-size: var(--hc-text-body);
  line-height: var(--hc-lh-body);
  font-weight: 600;
  border-radius: var(--hc-radius-md);
  padding: 0 var(--hc-space-4);
  height: 40px;
  transition: background-color var(--hc-duration-fast) var(--hc-ease),
    opacity var(--hc-duration-fast) var(--hc-ease),
    transform var(--hc-duration-fast) var(--hc-ease);
  user-select: none;
  white-space: nowrap;
}

.hc-btn:active {
  transform: scale(0.98);
}

.hc-btn:disabled {
  opacity: 0.4;
  cursor: default;
  transform: none;
}

.hc-btn--sm {
  height: 32px;
  font-size: var(--hc-text-subhead);
  padding: 0 var(--hc-space-3);
}

.hc-btn--lg {
  height: 50px;
  border-radius: var(--hc-radius-lg);
}

.hc-btn--primary {
  background: var(--hc-accent);
  color: #ffffff;
}

.hc-btn--primary:hover:not(:disabled) {
  background: var(--hc-accent-pressed);
}

.hc-btn--secondary {
  background: var(--hc-fill-primary);
  color: var(--hc-label-primary);
}

.hc-btn--secondary:hover:not(:disabled) {
  background: var(--hc-fill-secondary);
}

.hc-btn--plain {
  background: transparent;
  color: var(--hc-accent);
  padding-left: var(--hc-space-2);
  padding-right: var(--hc-space-2);
}

.hc-btn--plain:hover:not(:disabled) {
  background: var(--hc-fill-secondary);
}

.hc-btn--destructive {
  background: transparent;
  color: var(--hc-red);
}

.hc-btn--destructive:hover:not(:disabled) {
  background: rgba(255, 69, 58, 0.16);
}

/* --- Toggle -------------------------------------------------------------- */

.hc-toggle {
  position: relative;
  flex: none;
  width: 51px;
  height: 31px;
  border-radius: var(--hc-radius-pill);
  background: var(--hc-fill-secondary);
  border: none;
  cursor: pointer;
  padding: 0;
  transition: background-color var(--hc-duration-fast) var(--hc-ease);
}

.hc-toggle[data-on="true"] {
  background: var(--hc-green);
}

.hc-toggle:disabled {
  opacity: 0.4;
  cursor: default;
}

.hc-toggle__knob {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 27px;
  height: 27px;
  border-radius: 50%;
  background: #ffffff;
  box-shadow: var(--hc-elev-1);
  transition: transform var(--hc-duration-fast) var(--hc-ease);
}

.hc-toggle[data-on="true"] .hc-toggle__knob {
  transform: translateX(20px);
}

/* --- Section ------------------------------------------------------------- */

.hc-section {
  margin-top: var(--hc-space-6);
}

.hc-section:first-child {
  margin-top: 0;
}

.hc-section__title {
  font-size: var(--hc-text-subhead);
  line-height: var(--hc-lh-subhead);
  color: var(--hc-label-secondary);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  padding: 0 var(--hc-space-4);
  margin-bottom: var(--hc-space-2);
}

.hc-section__body {
  background: var(--hc-bg-secondary);
  border-radius: var(--hc-radius-lg);
  overflow: hidden;
}

.hc-section__note {
  font-size: var(--hc-text-footnote);
  line-height: var(--hc-lh-footnote);
  color: var(--hc-label-secondary);
  padding: var(--hc-space-2) var(--hc-space-4) 0;
}

/* --- List row ------------------------------------------------------------ */

.hc-row {
  display: flex;
  align-items: center;
  gap: var(--hc-space-3);
  min-height: 44px;
  padding: var(--hc-space-2) var(--hc-space-4);
  position: relative;
}

.hc-row + .hc-row::before {
  content: "";
  position: absolute;
  top: 0;
  left: 56px;
  right: 0;
  height: 1px;
  background: var(--hc-separator);
  transform: scaleY(0.5);
}

.hc-row--button {
  cursor: pointer;
  transition: background-color var(--hc-duration-fast) var(--hc-ease);
}

.hc-row--button:hover {
  background: var(--hc-fill-secondary);
}

.hc-row--button:active {
  background: var(--hc-fill-primary);
}

.hc-row__icon {
  flex: none;
  width: 28px;
  height: 28px;
  border-radius: var(--hc-radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
}

.hc-row__text {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.hc-row__title {
  font-size: var(--hc-text-body);
  line-height: var(--hc-lh-body);
  color: var(--hc-label-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.hc-row__subtitle {
  font-size: var(--hc-text-footnote);
  line-height: var(--hc-lh-footnote);
  color: var(--hc-label-secondary);
}

.hc-row__accessory {
  flex: none;
  display: flex;
  align-items: center;
  gap: var(--hc-space-2);
  color: var(--hc-label-secondary);
}

.hc-row__chevron {
  color: var(--hc-label-tertiary);
}

/* --- Text input ---------------------------------------------------------- */

.hc-input {
  display: block;
  width: 100%;
  height: 40px;
  background: var(--hc-fill-primary);
  border: 2px solid transparent;
  border-radius: var(--hc-radius-md);
  padding: 0 var(--hc-space-3);
  color: var(--hc-label-primary);
  font-family: inherit;
  font-size: var(--hc-text-callout);
  line-height: var(--hc-lh-callout);
  outline: none;
  transition: border-color var(--hc-duration-fast) var(--hc-ease);
}

.hc-input::placeholder {
  color: var(--hc-label-tertiary);
}

.hc-input:focus {
  border-color: var(--hc-accent);
}

/* --- Number stepper ------------------------------------------------------ */

.hc-stepper {
  display: inline-flex;
  align-items: center;
  background: var(--hc-fill-primary);
  border-radius: var(--hc-radius-md);
  overflow: hidden;
}

.hc-stepper__btn {
  width: 36px;
  height: 32px;
  border: none;
  background: transparent;
  color: var(--hc-label-primary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color var(--hc-duration-fast) var(--hc-ease);
}

.hc-stepper__btn:hover:not(:disabled) {
  background: var(--hc-fill-secondary);
}

.hc-stepper__btn:disabled {
  color: var(--hc-label-quaternary);
  cursor: default;
}

.hc-stepper__value {
  min-width: 44px;
  text-align: center;
  font-size: var(--hc-text-callout);
  font-variant-numeric: tabular-nums;
  color: var(--hc-label-primary);
}

/* --- Select -------------------------------------------------------------- */

/* Self-drawn dropdown: pill button + floating iOS-style menu sheet. */
.hc-select {
  position: relative;
  display: inline-block;
}

.hc-select__button {
  display: inline-flex;
  align-items: center;
  gap: var(--hc-space-2);
  height: 32px;
  background: var(--hc-fill-primary);
  border: none;
  border-radius: var(--hc-radius-md);
  color: var(--hc-label-primary);
  font-family: inherit;
  font-size: var(--hc-text-callout);
  padding: 0 var(--hc-space-3);
  cursor: pointer;
  outline: none;
  white-space: nowrap;
}

.hc-select__button:hover {
  background: var(--hc-fill-secondary);
}

.hc-select__button:focus-visible {
  box-shadow: 0 0 0 2px var(--hc-accent);
}

.hc-select__chevron {
  color: var(--hc-label-tertiary);
  transition: transform 0.15s ease;
}

.hc-select__chevron[data-open="true"] {
  transform: rotate(180deg);
}

.hc-select__menu {
  /* Positioned by its portal wrapper (fixed, anchored to the button). */
  max-height: 280px;
  overflow-y: auto;
  padding: var(--hc-space-1);
  background: var(--hc-bg-elevated, #2c2c2e);
  border-radius: var(--hc-radius-lg, 12px);
  box-shadow:
    0 0 0 0.5px rgba(255, 255, 255, 0.08),
    0 10px 32px rgba(0, 0, 0, 0.45);
  animation: hc-select-pop 0.14s ease;
}

@keyframes hc-select-pop {
  from {
    opacity: 0;
    transform: translateY(-4px) scale(0.98);
  }
  to {
    opacity: 1;
    transform: none;
  }
}

.hc-select__option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--hc-space-3);
  width: 100%;
  border: none;
  background: none;
  border-radius: var(--hc-radius-md);
  color: var(--hc-label-primary);
  font-family: inherit;
  font-size: var(--hc-text-callout);
  text-align: left;
  padding: 7px var(--hc-space-3);
  cursor: pointer;
  white-space: nowrap;
}

.hc-select__option[data-active="true"] {
  background: var(--hc-fill-primary);
}

.hc-select__option[data-selected="true"] {
  color: var(--hc-accent);
}

.hc-select__check {
  flex: none;
  color: var(--hc-accent);
}

/* --- String list --------------------------------------------------------- */

.hc-strlist {
  display: flex;
  flex-direction: column;
  gap: var(--hc-space-2);
  padding: var(--hc-space-2) var(--hc-space-4) var(--hc-space-3);
}

.hc-strlist__item {
  display: flex;
  align-items: center;
  gap: var(--hc-space-2);
}

.hc-strlist__add {
  display: flex;
  gap: var(--hc-space-2);
}

.hc-iconbtn {
  flex: none;
  width: 32px;
  height: 32px;
  border-radius: var(--hc-radius-md);
  border: none;
  background: var(--hc-fill-primary);
  color: var(--hc-label-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color var(--hc-duration-fast) var(--hc-ease),
    color var(--hc-duration-fast) var(--hc-ease);
}

.hc-iconbtn:hover {
  background: var(--hc-fill-secondary);
}

.hc-iconbtn--danger:hover {
  color: var(--hc-red);
}

/* --- Badge --------------------------------------------------------------- */

.hc-badge {
  display: inline-flex;
  align-items: center;
  height: 20px;
  padding: 0 var(--hc-space-2);
  border-radius: var(--hc-radius-pill);
  font-size: var(--hc-text-caption1);
  line-height: var(--hc-lh-caption1);
  font-weight: 600;
}

.hc-badge[data-tone="neutral"] {
  background: var(--hc-fill-secondary);
  color: var(--hc-label-secondary);
}

.hc-badge[data-tone="accent"] {
  background: rgba(10, 132, 255, 0.2);
  color: var(--hc-accent);
}

.hc-badge[data-tone="green"] {
  background: rgba(48, 209, 88, 0.2);
  color: var(--hc-green);
}

.hc-badge[data-tone="red"] {
  background: rgba(255, 69, 58, 0.2);
  color: var(--hc-red);
}

.hc-badge[data-tone="orange"] {
  background: rgba(255, 159, 10, 0.2);
  color: var(--hc-orange);
}

/* --- Empty state --------------------------------------------------------- */

.hc-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: var(--hc-space-10) var(--hc-space-6);
  color: var(--hc-label-tertiary);
}

.hc-empty__title {
  font-size: var(--hc-text-headline);
  line-height: var(--hc-lh-headline);
  font-weight: 600;
  color: var(--hc-label-secondary);
  margin-top: var(--hc-space-4);
}

.hc-empty__subtitle {
  font-size: var(--hc-text-callout);
  line-height: var(--hc-lh-callout);
  color: var(--hc-label-tertiary);
  margin-top: var(--hc-space-2);
  max-width: 320px;
}

/* --- Overlay + panel (fallback entry point) ------------------------------ */

.hc-overlay {
  position: fixed;
  inset: 0;
  z-index: 10000;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.6);
  animation: hc-fade var(--hc-duration-slow) var(--hc-ease);
}

.hc-panel {
  width: min(1180px, 94vw);
  height: min(840px, 92vh);
  background: var(--hc-bg-primary);
  border-radius: var(--hc-radius-xl);
  box-shadow: var(--hc-elev-3);
  display: flex;
  overflow: hidden;
  animation: hc-rise var(--hc-duration-slow) var(--hc-ease);
}

.hc-panel__sidebar {
  width: 220px;
  flex: none;
  background: var(--hc-bg-secondary);
  border-right: 1px solid var(--hc-separator-opaque);
  padding: var(--hc-space-4) var(--hc-space-2);
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.hc-panel__brand {
  display: flex;
  align-items: center;
  gap: var(--hc-space-2);
  padding: var(--hc-space-2) var(--hc-space-3) var(--hc-space-4);
  color: var(--hc-label-primary);
}

.hc-panel__brand-name {
  font-size: var(--hc-text-headline);
  font-weight: 700;
}

.hc-navitem {
  display: flex;
  align-items: center;
  gap: var(--hc-space-2);
  padding: var(--hc-space-2) var(--hc-space-3);
  border-radius: var(--hc-radius-md);
  color: var(--hc-label-secondary);
  cursor: pointer;
  font-size: var(--hc-text-callout);
  border: none;
  background: transparent;
  text-align: left;
  width: 100%;
  transition: background-color var(--hc-duration-fast) var(--hc-ease),
    color var(--hc-duration-fast) var(--hc-ease);
}

.hc-navitem:hover {
  background: var(--hc-fill-secondary);
  color: var(--hc-label-primary);
}

.hc-navitem[data-active="true"] {
  background: var(--hc-fill-primary);
  color: var(--hc-label-primary);
}

.hc-panel__content {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.hc-panel__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--hc-space-5) var(--hc-space-6) var(--hc-space-4);
  border-bottom: 1px solid var(--hc-separator-opaque);
}

.hc-panel__scroll {
  flex: 1;
  overflow-y: auto;
  padding: var(--hc-space-5) var(--hc-space-6) var(--hc-space-8);
}

.hc-embed {
  /* When embedded in Discord's own settings pane rather than the overlay. */
  padding: var(--hc-space-2) 0 var(--hc-space-8);
}

@keyframes hc-fade {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes hc-rise {
  from {
    opacity: 0;
    transform: translateY(8px) scale(0.99);
  }
  to {
    opacity: 1;
    transform: none;
  }
}

/* Respect the OS "reduce motion" preference. */
@media (prefers-reduced-motion: reduce) {
  .hc-overlay,
  .hc-panel,
  .hc-btn,
  .hc-toggle__knob {
    animation: none;
    transition: none;
  }
}

/* --- Setting cells (schema-driven form) ---------------------------------- */

.hc-cell {
  padding: var(--hc-space-2) var(--hc-space-4);
  position: relative;
}

.hc-cell + .hc-cell::before {
  content: "";
  position: absolute;
  top: 0;
  left: var(--hc-space-4);
  right: 0;
  height: 1px;
  background: var(--hc-separator);
  transform: scaleY(0.5);
}

.hc-cell--row {
  display: flex;
  align-items: center;
  gap: var(--hc-space-3);
  min-height: 44px;
}

.hc-cell__main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.hc-cell__label {
  font-size: var(--hc-text-body);
  line-height: var(--hc-lh-body);
  color: var(--hc-label-primary);
}

.hc-cell__desc {
  font-size: var(--hc-text-footnote);
  line-height: var(--hc-lh-footnote);
  color: var(--hc-label-secondary);
}

.hc-cell__control {
  flex: none;
}

.hc-cell__stacked {
  padding-top: var(--hc-space-2);
}

/* --- Toolbar (search + actions) ------------------------------------------ */

.hc-toolbar {
  display: flex;
  align-items: center;
  gap: var(--hc-space-3);
  margin-bottom: var(--hc-space-4);
}

/* --- Server-rail button (injected under Discord's home/DM button) -------- */
/* Styled to read as a native rail icon: a 48px rounded square (not a circle)
   like Discord's own home button, on the same graphite fill, with a muted grey
   glyph. On hover it snaps to the brand color and squares off a touch \u2014 exactly
   how Discord's guild pills animate \u2014 so it belongs in the rail instead of
   standing out as a bright foreign blob. */
.hc-rail-item {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  padding: 4px 0;
}

.hc-rail-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  padding: 0;
  border: none;
  background: #000;
  color: var(--interactive-normal, #b5bac1);
  cursor: pointer;
  border-radius: 16px;
  transition: border-radius var(--hc-duration-fast) var(--hc-ease),
    background-color var(--hc-duration-fast) var(--hc-ease),
    color var(--hc-duration-fast) var(--hc-ease);
}

.hc-rail-btn:hover {
  border-radius: 14px;
  background: var(--brand-experiment, var(--hc-accent, #5865f2));
  color: #fff;
}

.hc-rail-btn:active {
  border-radius: 12px;
}

.hc-search {
  flex: 1;
  display: flex;
  align-items: center;
  gap: var(--hc-space-2);
  height: 36px;
  padding: 0 var(--hc-space-3);
  background: var(--hc-fill-primary);
  border-radius: var(--hc-radius-md);
  color: var(--hc-label-tertiary);
}

.hc-search input {
  flex: 1;
  border: none;
  background: transparent;
  outline: none;
  color: var(--hc-label-primary);
  font-family: inherit;
  font-size: var(--hc-text-callout);
}

.hc-search input::placeholder {
  color: var(--hc-label-tertiary);
}

/* --- Plugin detail header ------------------------------------------------ */

.hc-back {
  display: inline-flex;
  align-items: center;
  gap: var(--hc-space-1);
  background: transparent;
  border: none;
  color: var(--hc-accent);
  cursor: pointer;
  font-family: inherit;
  font-size: var(--hc-text-callout);
  padding: var(--hc-space-1) var(--hc-space-1) var(--hc-space-1) 0;
  margin-bottom: var(--hc-space-4);
}

.hc-detail-head {
  display: flex;
  align-items: flex-start;
  gap: var(--hc-space-3);
  margin-bottom: var(--hc-space-5);
}

.hc-detail-head__icon {
  flex: none;
  width: 44px;
  height: 44px;
  border-radius: var(--hc-radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
}

.hc-detail-head__text {
  flex: 1;
  min-width: 0;
}

.hc-detail-head__name {
  font-size: var(--hc-text-title3);
  line-height: var(--hc-lh-title3);
  font-weight: 600;
}

.hc-detail-head__desc {
  font-size: var(--hc-text-callout);
  line-height: var(--hc-lh-callout);
  color: var(--hc-label-secondary);
  margin-top: 2px;
}

.hc-detail-head__meta {
  font-size: var(--hc-text-footnote);
  color: var(--hc-label-tertiary);
  margin-top: var(--hc-space-2);
}

/* --- Log viewer ---------------------------------------------------------- */

.hc-logs {
  font-family: var(--hc-font-mono);
  font-size: var(--hc-text-footnote);
  line-height: 1.7;
  background: var(--hc-bg-secondary);
  border-radius: var(--hc-radius-lg);
  padding: var(--hc-space-3);
  overflow-x: auto;
}

.hc-logline {
  display: flex;
  gap: var(--hc-space-2);
  white-space: pre;
  padding: 1px 0;
}

.hc-logline__time {
  color: var(--hc-label-tertiary);
  flex: none;
}

.hc-logline__scope {
  color: var(--hc-label-secondary);
  flex: none;
}

.hc-logline__msg {
  color: var(--hc-label-primary);
  white-space: pre-wrap;
  word-break: break-word;
}

.hc-logline[data-level="warn"] .hc-logline__msg {
  color: var(--hc-orange);
}

.hc-logline[data-level="error"] .hc-logline__msg {
  color: var(--hc-red);
}

.hc-logline[data-level="debug"] .hc-logline__msg {
  color: var(--hc-label-secondary);
}

/* --- About --------------------------------------------------------------- */

.hc-about__row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.hc-about__value {
  color: var(--hc-label-secondary);
  font-variant-numeric: tabular-nums;
}

/* --- Generic vertical rhythm --------------------------------------------- */

.hc-stack > * + * {
  margin-top: var(--hc-space-4);
}

.hc-inline-note {
  display: flex;
  align-items: center;
  gap: var(--hc-space-2);
  color: var(--hc-orange);
  font-size: var(--hc-text-footnote);
}

.hc-inline-note--danger {
  color: var(--hc-red);
}

/* --- Detail head toggle stays top-aligned with the icon ------------------ */

.hc-detail-head > span {
  flex: none;
  padding-top: var(--hc-space-1);
}

/* --- About hero ---------------------------------------------------------- */

.hc-about-hero {
  display: flex;
  align-items: center;
  gap: var(--hc-space-3);
  padding: var(--hc-space-2) 0 var(--hc-space-4);
  color: var(--hc-label-primary);
}

.hc-about-hero__name {
  font-size: var(--hc-text-title2);
  line-height: var(--hc-lh-title2);
  font-weight: 700;
}

.hc-about-hero__ver {
  font-size: var(--hc-text-footnote);
  line-height: var(--hc-lh-footnote);
  color: var(--hc-label-secondary);
}

/* --- Tabs (used by plugin pages) ----------------------------------------- */

.hc-tabs {
  display: flex;
  align-items: center;
  gap: var(--hc-space-2);
  margin-bottom: var(--hc-space-4);
}

.hc-tabs__spacer {
  flex: 1;
}

.hc-tab {
  display: inline-flex;
  align-items: center;
  gap: var(--hc-space-2);
  height: 32px;
  padding: 0 var(--hc-space-3);
  border: none;
  border-radius: var(--hc-radius-md);
  background: transparent;
  color: var(--hc-label-secondary);
  cursor: pointer;
  font-family: inherit;
  font-size: var(--hc-text-subhead);
  font-weight: 600;
  transition: background-color var(--hc-duration-fast) var(--hc-ease),
    color var(--hc-duration-fast) var(--hc-ease);
}

.hc-tab:hover {
  color: var(--hc-label-primary);
}

.hc-tab[data-active="true"] {
  background: var(--hc-fill-primary);
  color: var(--hc-label-primary);
}

/* --- Save bar --------------------------------------------------------------- */

.hc-savebar {
  position: sticky;
  bottom: var(--hc-space-3);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--hc-space-4);
  margin-top: var(--hc-space-4);
  padding: var(--hc-space-2) var(--hc-space-2) var(--hc-space-2) var(--hc-space-4);
  background: var(--hc-bg-elevated, #2c2c2e);
  border-radius: var(--hc-radius-lg);
  box-shadow:
    0 0 0 0.5px rgba(255, 255, 255, 0.08),
    0 8px 24px rgba(0, 0, 0, 0.35);
  animation: hc-select-pop 0.14s ease;
}

.hc-savebar__label {
  font-size: var(--hc-text-subhead);
  color: var(--hc-label-secondary);
}

.hc-savebar__actions {
  display: flex;
  gap: var(--hc-space-2);
  flex: none;
}

/* --- Segmented control ------------------------------------------------------ */

.hc-segment {
  display: flex;
  gap: 2px;
  padding: 2px;
  margin-bottom: var(--hc-space-4);
  background: var(--hc-fill-primary);
  border-radius: var(--hc-radius-md);
  width: fit-content;
}

.hc-segment__item {
  border: none;
  background: transparent;
  color: var(--hc-label-secondary);
  font-family: inherit;
  font-size: var(--hc-text-subhead);
  font-weight: 600;
  height: 28px;
  padding: 0 var(--hc-space-4);
  border-radius: calc(var(--hc-radius-md) - 2px);
  cursor: pointer;
  transition: background-color var(--hc-duration-fast) var(--hc-ease),
    color var(--hc-duration-fast) var(--hc-ease);
}

.hc-segment__item:hover {
  color: var(--hc-label-primary);
}

.hc-segment__item[data-active="true"] {
  background: var(--hc-bg-elevated, #2c2c2e);
  color: var(--hc-label-primary);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.25);
}

/* --- Pager ----------------------------------------------------------------- */

.hc-pager {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--hc-space-3);
  margin-top: var(--hc-space-4);
}

.hc-pager__label {
  font-size: var(--hc-text-footnote);
  color: var(--hc-label-secondary);
  font-variant-numeric: tabular-nums;
  min-width: 96px;
  text-align: center;
}

.hc-pager .hc-tab:disabled {
  opacity: 0.4;
  cursor: default;
}

/* --- Captured message entries -------------------------------------------- */

.hc-msglist {
  display: flex;
  flex-direction: column;
  gap: var(--hc-space-2);
}

.hc-msg {
  background: var(--hc-bg-secondary);
  border-radius: var(--hc-radius-lg);
  padding: var(--hc-space-3) var(--hc-space-4);
  border-left: 2px solid var(--hc-red);
}

.hc-msg__head {
  display: flex;
  align-items: center;
  gap: var(--hc-space-2);
  margin-bottom: var(--hc-space-1);
}

.hc-msg__author {
  font-size: var(--hc-text-subhead);
  font-weight: 600;
  color: var(--hc-label-primary);
}

.hc-msg__where {
  font-size: var(--hc-text-footnote);
  color: var(--hc-label-secondary);
}

.hc-msg__guild {
  color: var(--hc-label-secondary);
  font-weight: 600;
}

.hc-msg__sep {
  color: var(--hc-label-tertiary);
  margin: 0 4px;
}

.hc-msg__time {
  margin-left: auto;
  font-size: var(--hc-text-caption1);
  color: var(--hc-label-tertiary);
  font-variant-numeric: tabular-nums;
}

/* Jump-to-message action, pinned to the right of each row's header. Keeps the
 * header on one line and doesn't steal the space the time claims via
 * margin-left:auto (which already pushes both to the right edge). */
.hc-msg__jump {
  flex: none;
  margin-left: var(--hc-space-2);
}

.hc-msg__body {
  font-size: var(--hc-text-callout);
  line-height: var(--hc-lh-callout);
  color: var(--hc-label-primary);
  white-space: pre-wrap;
  word-break: break-word;
}

.hc-msg__empty {
  color: var(--hc-label-tertiary);
  font-style: italic;
}

.hc-msg__meta {
  margin-top: var(--hc-space-1);
  font-size: var(--hc-text-footnote);
  color: var(--hc-label-secondary);
}

/* Attachment thumbnails. Constrained so wide/tall media never spills past the
 * message card \u2014 a single image caps at the content width, and the row wraps
 * when there are several. */
.hc-msg__media {
  display: flex;
  flex-wrap: wrap;
  gap: var(--hc-space-2);
  margin-top: var(--hc-space-2);
  min-width: 0;
}

.hc-msg__media a {
  color: var(--hc-accent);
  font-size: var(--hc-text-footnote);
  word-break: break-all;
}

.hc-msg__thumb {
  max-width: 100%;
  max-height: 240px;
  width: auto;
  height: auto;
  object-fit: contain;
  border-radius: var(--hc-radius-md);
  background: var(--hc-fill-secondary);
}

/* Inline custom emoji, sized to the surrounding text like Discord's own. */
.hc-emoji {
  display: inline-block;
  width: 1.375em;
  height: 1.375em;
  margin: 0 1px;
  object-fit: contain;
  vertical-align: bottom;
}

.hc-msg__versions {
  display: flex;
  flex-direction: column;
  gap: var(--hc-space-1);
}

.hc-msg__version {
  display: flex;
  gap: var(--hc-space-2);
  font-size: var(--hc-text-callout);
  line-height: var(--hc-lh-callout);
}

.hc-msg__vtag {
  flex: none;
  color: var(--hc-label-tertiary);
  font-variant-numeric: tabular-nums;
  font-size: var(--hc-text-footnote);
  padding-top: 2px;
}

.hc-msg__vbody {
  color: var(--hc-label-primary);
  white-space: pre-wrap;
  word-break: break-word;
}

/* The \`edited\` tone reuses the orange rule via a modifier. */
.hc-msg--edited {
  border-left-color: var(--hc-orange);
}

/* --- message-logger status banner ---------------------------------------- *
 * A compact warning on the log page, shown only when at least one of the
 * plugin's source patches failed to match the running Discord build. Inside
 * the .halcyon overlay/embed, so tokens are used throughout. Amber tone: the
 * feature isn't broken \u2014 records still land in the list below \u2014 but the
 * in-chat red row is off, and this is the only place a non-console user will
 * see that. */
.hc-mlog-warn {
  border: 1px solid rgba(224, 165, 63, 0.35);
  background: rgba(224, 165, 63, 0.08);
  border-radius: var(--hc-radius-md);
  padding: var(--hc-space-3) var(--hc-space-4);
  margin: var(--hc-space-3) 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.hc-mlog-warn__title {
  font-size: var(--hc-text-subhead);
  font-weight: 600;
  color: #e0a53f;
}
.hc-mlog-warn__detail {
  font-size: var(--hc-text-footnote);
  color: var(--hc-label-secondary);
  line-height: var(--hc-lh-footnote);
}
.hc-mlog-warn__list {
  margin: 2px 0 0;
  padding-left: 18px;
  font-size: var(--hc-text-footnote);
  color: var(--hc-label-secondary);
  font-variant-numeric: tabular-nums;
}

/* --- Deleted message (in-chat) ------------------------------------------- */

/*
 * Applied to Discord's own message row when a deleted message is kept in place.
 * These live outside the .halcyon scope on purpose \u2014 they decorate Discord
 * elements \u2014 so literal values, no tokens.
 *
 * The row itself only carries the stable .hc-deleted hook; the chosen style is
 * a class on <html> (hc-mlog-<style>). Splitting them lets a style change take
 * effect immediately \u2014 swap the root class and every kept message updates \u2014
 * instead of the pick only landing on rows Discord repaints after the change.
 */

/* Style: red tint (default) \u2014 flat red wash + left bar. */
.hc-mlog-tint .hc-deleted {
  background-color: rgba(255, 69, 58, 0.1);
  box-shadow: inset 2px 0 0 #ff453a;
}

/* Style: red text \u2014 content turns red, no background. */
.hc-mlog-text .hc-deleted [class*="messageContent"],
.hc-mlog-text .hc-deleted [class*="contents"] > div:not([class*="header"]) {
  color: #f04747 !important;
}
.hc-mlog-text .hc-deleted [class*="messageContent"] a {
  color: #ff6b6b !important;
}

/* Style: ghost \u2014 the whole row fades. */
.hc-mlog-ghost .hc-deleted {
  opacity: 0.45;
  filter: saturate(0.6);
}

/* Style: strike \u2014 red strikethrough over the text. */
.hc-mlog-strike .hc-deleted [class*="messageContent"] {
  text-decoration: line-through;
  text-decoration-color: rgba(255, 69, 58, 0.7);
  text-decoration-thickness: 1.5px;
}
.hc-mlog-strike .hc-deleted {
  box-shadow: inset 2px 0 0 rgba(255, 69, 58, 0.5);
}

/* "This message was deleted (\u2026)": marker row under the content. One base
 * class plus a look modifier chosen in settings. */
.hc-deleted-marker {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 2px;
  font-size: 0.8125rem;
  line-height: 1.2;
  color: #f04747;
  user-select: none;
}
.hc-deleted-marker__icon {
  flex: none;
}

/* Look: badge \u2014 pill-shaped chip on its OWN line. It used \`display: inline-flex\`,
 * which let the pill run inline with the message text so the two never wrapped
 * ("\u4E0D\u4F1A\u6362\u884C"). Inheriting the base \`display: flex\` makes it block-level (its own
 * line); \`width: fit-content\` keeps the pill only as wide as its label, and
 * \`max-width: 100%\` stops a long label from overflowing the row. */
.hc-deleted-marker--badge {
  width: fit-content;
  max-width: 100%;
  background: rgba(255, 69, 58, 0.12);
  border-radius: 9999px;
  padding: 2px 10px;
  margin-top: 4px;
}

/* Look: quote \u2014 indented behind a red bar, like a blockquote. */
.hc-deleted-marker--quote {
  border-left: 3px solid rgba(255, 69, 58, 0.7);
  padding-left: 8px;
  margin-top: 4px;
  color: rgba(240, 71, 71, 0.85);
}

/* Tone: edited \u2014 same marker layout, calmer amber so an edit doesn't read as a
 * deletion. Overrides the red the delete marker uses. */
.hc-deleted-marker--edited {
  color: #e0a53f;
}
.hc-deleted-marker--edited.hc-deleted-marker--badge {
  background: rgba(224, 165, 63, 0.14);
}
.hc-deleted-marker--edited.hc-deleted-marker--quote {
  border-left-color: rgba(224, 165, 63, 0.7);
  color: rgba(224, 165, 63, 0.9);
}

/* --- Username next to nickname (show-username plugin) --------------------- */

/*
 * Appended inside Discord's message header, so literal values, no tokens.
 * One base class plus a per-style modifier chosen in the plugin's settings.
 */
.hc-username {
  font-size: 0.75rem;
  font-weight: 500;
  vertical-align: baseline;
}

.hc-username--muted {
  color: var(--text-muted, #949ba4);
}

.hc-username--pill {
  color: var(--text-muted, #949ba4);
  background: rgba(128, 132, 142, 0.16);
  border-radius: 9999px;
  padding: 0 6px;
  line-height: 1.35;
  display: inline-block;
}

.hc-username--at {
  color: #949cf7;
}

.hc-username--paren {
  color: var(--text-muted, #949ba4);
  font-weight: 400;
}

/* --- Inline edit history (in-chat) ---------------------------------------- */

/*
 * Old versions of an edited message, rendered above the current content by the
 * message-logger content patch. Like .hc-deleted this decorates Discord's own
 * DOM, so literal values, no tokens. The base class only handles wrapping; a
 * per-style modifier (chosen in settings) sets the look. MessageExtras re-reads
 * the modifier on every render, so changing the style applies live.
 */
.hc-edit-history__version {
  word-break: break-word;
  white-space: pre-wrap;
}

/* Per-version edit time, shown inline at the end of each old-version line.
 * Muted and compact; opacity keeps it tied to whatever the version style is,
 * and text-decoration:none stops the strike style from striking the time. */
.hc-edit-history__time {
  margin-left: 6px;
  font-size: 0.72em;
  opacity: 0.55;
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
  text-decoration: none;
  vertical-align: baseline;
}

/* Media a superseded version carried \u2014 typically the picture an edit removed.
 * Thumbnails reuse .hc-deleted-media__thumb; this only stacks them beneath the
 * old-version line. */
.hc-edit-history__media {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 4px;
}

/* The old-version line mirrors the deleted-message style (tint/text/ghost/
 * strike) so both share one setting; strike stays its natural default look. */

/* Style: red strikethrough \u2014 struck out in red, like removed text. */
.hc-edit-history__version--strike {
  color: rgba(255, 69, 58, 0.75);
  text-decoration: line-through;
  text-decoration-color: rgba(255, 69, 58, 0.4);
}

/* Style: red text \u2014 red, no strikethrough. */
.hc-edit-history__version--text {
  color: rgba(255, 69, 58, 0.85);
}

/* Style: ghost \u2014 faded out, keeps the normal text color. */
.hc-edit-history__version--ghost {
  opacity: 0.45;
  filter: saturate(0.6);
}

/* Style: tint \u2014 red wash + left bar, as a quote-like block on the line. */
.hc-edit-history__version--tint {
  background-color: rgba(255, 69, 58, 0.1);
  box-shadow: inset 2px 0 0 #ff453a;
  padding: 1px 6px 1px 8px;
  border-radius: 3px;
}

/* \u2500\u2500 message-cleaner page \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
 * The self-message cleaner's operate surface. Scope/confirm reuse .hc-section
 * and .hc-cell; these rules cover the action bar, the live status line, the
 * preview list, and the stat readout. Decorates Halcyon's own panel, so every
 * value is a token. */
.hc-cleaner__actions {
  display: flex;
  gap: var(--hc-space-3);
  margin: var(--hc-space-4) 0;
}.hc-cleaner__actions .hc-btn {
  flex: 1;
}
/* Resolved guild/channel name next to the id label \u2014 muted, one line. */
.hc-cleaner__resolved {
  margin-left: var(--hc-space-2);
  font-size: var(--hc-text-caption1);
  font-weight: 400;
  color: var(--hc-accent);
  vertical-align: middle;
  display: inline-block;
  max-width: 60%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.hc-cleaner__status {
  margin: var(--hc-space-3) 0;
  padding: var(--hc-space-3) var(--hc-space-4);
  background: var(--hc-fill-secondary);
  border-radius: var(--hc-radius-md);
}
.hc-cleaner__status-state {
  font-size: var(--hc-text-subhead);
  font-weight: 600;
  color: var(--hc-label-primary);
}
.hc-cleaner__status-detail {
  margin-top: 2px;
  font-size: var(--hc-text-footnote);
  color: var(--hc-label-secondary);
  word-break: break-word;
}
.hc-cleaner__list {
  display: flex;
  flex-direction: column;
  max-height: min(520px, 60vh);
  overflow: auto;
  user-select: text;
}
.hc-cleaner__listbar {
  display: flex;
  align-items: center;
  gap: var(--hc-space-2);
  padding: var(--hc-space-2) var(--hc-space-4);
  border-bottom: 1px solid var(--hc-separator);
}
.hc-cleaner__listbar .hc-input {
  flex: 1;
  min-width: 0;
  height: 32px;
  font-size: var(--hc-text-footnote);
}
.hc-cleaner__listbar-actions {
  display: flex;
  flex-shrink: 0;
}
.hc-cleaner__listmore {
  display: flex;
  align-items: center;
  gap: var(--hc-space-2);
  padding: var(--hc-space-2) var(--hc-space-4);
  border-top: 1px solid var(--hc-separator);
  font-size: var(--hc-text-caption1);
  color: var(--hc-label-tertiary);
}
.hc-cleaner__listmore span:first-child {
  flex: 1;
}
.hc-cleaner__check {
  flex-shrink: 0;
  width: 16px;
  height: 16px;
  margin: 1px 0 0;
  accent-color: var(--hc-red);
  cursor: pointer;
}
/* Unticked = kept: dim it so what survives the flush is obvious at a glance. */
.hc-cleaner__item[data-off="true"] .hc-cleaner__item-time,
.hc-cleaner__item[data-off="true"] .hc-cleaner__item-text {
  opacity: 0.45;
}
.hc-cleaner__item-channel {
  margin-right: var(--hc-space-2);
  color: var(--hc-label-secondary);
}
.hc-cleaner__tag {
  display: inline-block;
  margin-right: var(--hc-space-2);
  padding: 0 6px;
  border-radius: 4px;
  background: var(--hc-fill-secondary);
  color: var(--hc-label-secondary);
  font-size: var(--hc-text-caption1);
}
.hc-cleaner__emoji {
  width: 1.375em;
  height: 1.375em;
  vertical-align: bottom;
  object-fit: contain;
}
.hc-cleaner__item {
  display: flex;
  align-items: flex-start;
  cursor: pointer;
  gap: var(--hc-space-3);
  padding: var(--hc-space-2) var(--hc-space-4);
  font-size: var(--hc-text-footnote);
  border-bottom: 1px solid var(--hc-separator);
}
.hc-cleaner__item:last-child {
  border-bottom: none;
}
.hc-cleaner__item-time {
  flex-shrink: 0;
  color: var(--hc-accent);
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}
.hc-cleaner__item-text {
  color: var(--hc-label-primary);
  word-break: break-word;
}
.hc-cleaner__more {
  padding: var(--hc-space-2) var(--hc-space-4);
  font-size: var(--hc-text-caption1);
  color: var(--hc-label-tertiary);
}
.hc-cleaner__stat {
  display: flex;
  justify-content: center;
  align-items: baseline;
  gap: var(--hc-space-2);
}
.hc-cleaner__stat-num {
  font-size: var(--hc-text-title1);
  font-weight: 700;
  color: var(--hc-accent);
  font-variant-numeric: tabular-nums;
}
.hc-cleaner__stat-unit {
  font-size: var(--hc-text-footnote);
  color: var(--hc-label-secondary);
}

/* Run log \u2014 the reference \u51B2\u6C34 script's console, kept monospace and scrollable
 * so a long flush stays readable without pushing the page around. */
.hc-cleaner__logbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--hc-space-2) var(--hc-space-4);
  border-bottom: 1px solid var(--hc-separator);
}
.hc-cleaner__logcount {
  font-size: var(--hc-text-caption1);
  color: var(--hc-label-tertiary);
  font-variant-numeric: tabular-nums;
}
.hc-cleaner__log {
  max-height: min(340px, 45vh);
  overflow: auto;
  padding: var(--hc-space-2) 0;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace;
  font-size: 12px;
  line-height: 1.6;
  user-select: text;
}
.hc-cleaner__log-empty {
  padding: var(--hc-space-3) var(--hc-space-4);
  color: var(--hc-label-tertiary);
}
.hc-cleaner__log-row {
  display: flex;
  gap: var(--hc-space-2);
  padding: 1px var(--hc-space-4);
  color: var(--hc-label-secondary);
  word-break: break-word;
}
.hc-cleaner__log-time {
  flex-shrink: 0;
  color: var(--hc-label-tertiary);
  font-variant-numeric: tabular-nums;
}
.hc-cleaner__log-level {
  flex-shrink: 0;
  width: 44px;
  font-weight: 600;
  color: var(--hc-accent);
}
.hc-cleaner__log-row[data-level="success"] .hc-cleaner__log-level { color: var(--hc-green); }
.hc-cleaner__log-row[data-level="warn"] .hc-cleaner__log-level { color: var(--hc-orange); }
.hc-cleaner__log-row[data-level="error"] .hc-cleaner__log-level { color: var(--hc-red); }
.hc-cleaner__log-text {
  flex: 1;
  min-width: 0;
}

/* \u2500\u2500 message-cleaner picker \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
.hc-cleaner__picker-head {
  display: flex;
  align-items: center;
  gap: var(--hc-space-3);
  padding: var(--hc-space-3) var(--hc-space-4);
  border-bottom: 1px solid var(--hc-separator);
}
.hc-cleaner__picker-title {
  flex: 1;
  text-align: center;
  font-weight: 700;
  font-size: var(--hc-text-subhead);
  color: var(--hc-label-primary);
}
.hc-cleaner__picker-list {
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  max-height: 360px;
  padding: var(--hc-space-2);
}
.hc-cleaner__picker-item {
  display: flex;
  align-items: center;
  gap: var(--hc-space-3);
  padding: var(--hc-space-2) var(--hc-space-3);
  border-radius: var(--hc-radius-md);
  cursor: pointer;
  color: var(--hc-label-primary);
  transition: background var(--hc-duration-fast) var(--hc-ease);
}
.hc-cleaner__picker-item:hover {
  background: var(--hc-fill-secondary);
}
.hc-cleaner__picker-icon {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--hc-fill-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  flex-shrink: 0;
  font-size: var(--hc-text-subhead);
  color: var(--hc-label-secondary);
}
.hc-cleaner__picker-icon img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.hc-cleaner__picker-name {
  font-size: var(--hc-text-subhead);
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.hc-cleaner__picker-empty {
  padding: var(--hc-space-5);
  text-align: center;
  font-size: var(--hc-text-footnote);
  color: var(--hc-label-tertiary);
}

/* \u2500\u2500 emote-cloner server picker \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
 * A floating modal (mounted in its own .halcyon host over Discord) shown when
 * "\u590D\u5236\u8868\u60C5/\u8D34\u7EB8\u5230\u670D\u52A1\u5668" is clicked. Sits on the shared .hc-overlay backdrop;
 * the panel is compact, with a search box and a scrollable, icon-bearing list
 * of the servers the account can add expressions to. Decorates Halcyon's own
 * surface, so every value is a token. */
.hc-emote-picker {
  width: min(440px, 92vw);
  max-height: min(560px, 82vh);
  background: var(--hc-bg-primary);
  border-radius: var(--hc-radius-xl);
  box-shadow: var(--hc-elev-3);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  animation: hc-rise var(--hc-duration-slow) var(--hc-ease);
}

.hc-emote-picker__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--hc-space-3);
  padding: var(--hc-space-4) var(--hc-space-4) var(--hc-space-3);
  border-bottom: 1px solid var(--hc-separator-opaque);
}

.hc-emote-picker__title {
  font-size: var(--hc-text-headline);
  line-height: var(--hc-lh-headline);
  font-weight: 600;
  color: var(--hc-label-primary);
}

.hc-emote-picker__close {
  flex: none;
  width: 28px;
  height: 28px;
  border: none;
  background: transparent;
  color: var(--hc-label-secondary);
  border-radius: var(--hc-radius-md);
  cursor: pointer;
  font-size: 15px;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color var(--hc-duration-fast) var(--hc-ease),
    color var(--hc-duration-fast) var(--hc-ease);
}

.hc-emote-picker__close:hover {
  background: var(--hc-fill-secondary);
  color: var(--hc-label-primary);
}

.hc-emote-picker__search {
  padding: var(--hc-space-3) var(--hc-space-4) var(--hc-space-2);
}

.hc-emote-picker__list {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: var(--hc-space-2);
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.hc-emote-picker__item {
  display: flex;
  align-items: center;
  gap: var(--hc-space-3);
  padding: var(--hc-space-2) var(--hc-space-3);
  border-radius: var(--hc-radius-md);
  cursor: pointer;
  transition: background-color var(--hc-duration-fast) var(--hc-ease);
}

.hc-emote-picker__item:hover {
  background: var(--hc-fill-secondary);
}

.hc-emote-picker__icon {
  flex: none;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--hc-fill-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  font-size: var(--hc-text-subhead);
  font-weight: 600;
  color: var(--hc-label-secondary);
}

.hc-emote-picker__icon img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.hc-emote-picker__name {
  flex: 1;
  min-width: 0;
  font-size: var(--hc-text-body);
  font-weight: 500;
  color: var(--hc-label-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.hc-emote-picker__empty {
  padding: var(--hc-space-8) var(--hc-space-6);
  text-align: center;
  color: var(--hc-label-tertiary);
  font-size: var(--hc-text-footnote);
}

/* Thin, subtle scrollbar for the picker list. Our overlay mounts in its own
 * .halcyon host, which Discord's global scrollbar styling doesn't reach, so
 * without this the list falls back to the chunky default OS scrollbar. */
.hc-emote-picker__list::-webkit-scrollbar {
  width: 8px;
}

.hc-emote-picker__list::-webkit-scrollbar-track {
  background: transparent;
}

.hc-emote-picker__list::-webkit-scrollbar-thumb {
  background: var(--hc-fill-secondary);
  border-radius: 9999px;
  border: 2px solid transparent;
  background-clip: padding-box;
}

.hc-emote-picker__list::-webkit-scrollbar-thumb:hover {
  background: var(--hc-label-tertiary);
  background-clip: padding-box;
}

/* Post-pick status view (copying / done / error), shown in place of the list
 * so a clone never looks like "nothing happened" even when the toast module
 * isn't present on this build. */
.hc-emote-picker__status {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  gap: var(--hc-space-3);
  padding: var(--hc-space-8) var(--hc-space-6);
}

.hc-emote-picker__status-icon {
  font-size: 32px;
  line-height: 1;
}

.hc-emote-picker__status[data-state="done"] .hc-emote-picker__status-icon {
  color: var(--hc-green);
}

.hc-emote-picker__status[data-state="error"] .hc-emote-picker__status-icon {
  color: var(--hc-red);
}

.hc-emote-picker__status-title {
  font-size: var(--hc-text-headline);
  line-height: var(--hc-lh-headline);
  font-weight: 600;
  color: var(--hc-label-primary);
}

.hc-emote-picker__status-detail {
  font-size: var(--hc-text-footnote);
  line-height: var(--hc-lh-footnote);
  color: var(--hc-label-secondary);
  max-width: 340px;
  word-break: break-word;
}

/* --- Quest indicator badge ------------------------------------------------ */
/* Small count badge on the quest rail button. Positioned at top-right; blurple
   rather than the notification red, and it shows the exact count (no "9+" cap),
   so min-width + padding let it grow for two digits. */
.hc-quest-btn {
  position: relative;
}

.hc-quest-badge {
  position: absolute;
  top: -4px;
  right: -4px;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  border-radius: 9px;
  background: #5865f2;
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  line-height: 18px;
  text-align: center;
  box-shadow: 0 0 0 3px var(--background-tertiary, #1e1f22);
}

/* --- Member count chip (member-count plugin) ------------------------------ */
/*
 * Inserted into Discord's channel header toolbar or above its member list, so
 * literal values and Discord's own CSS variables \u2014 the \`--hc-*\` tokens are
 * scoped to \`.halcyon\` and do not reach this far into the client's tree.
 * The host is inert: an empty chip (a DM, or a guild with no numbers yet)
 * occupies nothing.
 */
.hc-membercount-host {
  display: contents;
}
.hc-membercount {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 24px;
  padding: 0 8px;
  margin-right: 8px;
  border-radius: 8px;
  background: rgba(128, 132, 142, 0.12);
  color: var(--interactive-normal, #b5bac1);
  font-size: 13px;
  font-weight: 500;
  line-height: 24px;
  white-space: nowrap;
  cursor: default;
  user-select: none;
}
.hc-membercount__icon {
  flex: 0 0 auto;
  opacity: 0.75;
}
.hc-membercount__part {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
.hc-membercount__dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #23a55a;
}
.hc-membercount__label {
  color: var(--text-muted, #949ba4);
  font-weight: 400;
}
.hc-membercount__value {
  font-variant-numeric: tabular-nums;
}
.hc-membercount__sep {
  color: var(--text-muted, #949ba4);
  opacity: 0.6;
}
/* Above the member list, the chip sits inside the scroller (before the first
 * group header), so it flows as a natural roster line rather than floating in
 * empty space above everything. Layout is the same pill as the header variant;
 * only the outer margin changes so it doesn't hug the aside's edge. */
.hc-membercount--list {
  margin: 8px 12px 4px;
}

/* --- Reactor list card (who-reacted plugin) ------------------------------- */
/*
 * Our own floating surface on document.body, hosted inside a \`.halcyon\`
 * element, so this one does use the design tokens. Non-interactive by design:
 * pointer-events stay off so the card can never eat the click that toggles a
 * reaction.
 */
.hc-whoreacted-host {
  position: fixed;
  top: 0;
  left: 0;
  z-index: 4000;
  pointer-events: none;
}
.hc-whoreacted {
  min-width: 180px;
  max-width: 280px;
  padding: var(--hc-space-2) 0;
  border-radius: var(--hc-radius-md);
  background: var(--hc-bg-elevated);
  box-shadow: var(--hc-elev-2);
  font-size: var(--hc-text-footnote);
  line-height: var(--hc-lh-footnote);
}
.hc-whoreacted__head {
  display: flex;
  align-items: center;
  gap: var(--hc-space-2);
  padding: var(--hc-space-1) var(--hc-space-3) var(--hc-space-2);
  border-bottom: 1px solid var(--hc-separator);
  margin-bottom: var(--hc-space-2);
}
.hc-whoreacted__emoji-img {
  flex: 0 0 auto;
  width: 18px;
  height: 18px;
  object-fit: contain;
}
.hc-whoreacted__emoji-char {
  flex: 0 0 auto;
  font-size: 16px;
  line-height: 18px;
}
.hc-whoreacted__title {
  flex: 1;
  min-width: 0;
  font-weight: 600;
  color: var(--hc-label-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.hc-whoreacted__count {
  flex: 0 0 auto;
  padding: 0 6px;
  border-radius: var(--hc-radius-pill);
  background: var(--hc-fill-secondary);
  color: var(--hc-label-secondary);
  font-size: var(--hc-text-caption2);
  font-variant-numeric: tabular-nums;
}
.hc-whoreacted__hint {
  padding: var(--hc-space-1) var(--hc-space-3) var(--hc-space-2);
  color: var(--hc-label-secondary);
}
.hc-whoreacted__hint--error {
  color: var(--hc-red);
}
.hc-whoreacted__list {
  max-height: 260px;
  overflow: hidden;
}
.hc-whoreacted__row {
  display: flex;
  align-items: center;
  gap: var(--hc-space-2);
  padding: 3px var(--hc-space-3);
}
.hc-whoreacted__avatar {
  flex: 0 0 auto;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  object-fit: cover;
}
.hc-whoreacted__name {
  flex: 1;
  min-width: 0;
  color: var(--hc-label-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.hc-whoreacted__tag {
  flex: 0 0 auto;
  padding: 0 4px;
  border-radius: var(--hc-radius-xs);
  background: var(--hc-accent);
  color: #fff;
  font-size: var(--hc-text-caption2);
  font-weight: 600;
  line-height: 14px;
}
.hc-whoreacted__id {
  flex: 0 0 auto;
  color: var(--hc-label-tertiary);
  font-family: var(--hc-font-mono);
  font-size: var(--hc-text-caption2);
}
.hc-whoreacted__more {
  padding: var(--hc-space-1) var(--hc-space-3) 0;
  color: var(--hc-label-tertiary);
}

/* --- Platform indicators (platform-indicators plugin) --------------------- */
/*
 * Inline glyphs appended inside Discord's message header and member rows, so
 * literal values, no tokens. \`vertical-align: middle\` keeps them on the name's
 * baseline; the status colors match Discord's own presence dots.
 */
.hc-platform-host {
  display: inline;
}
.hc-platform {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  margin-left: 5px;
  vertical-align: middle;
}
.hc-platform__item {
  display: inline-flex;
  align-items: center;
}
.hc-platform__item--online {
  color: #23a55a;
}
.hc-platform__item--idle {
  color: #f0b232;
}
.hc-platform__item--dnd {
  color: #f23f43;
}
.hc-platform__item--offline,
.hc-platform__item--muted {
  color: var(--text-muted, #949ba4);
}




/* --- Inline reactor avatars (who-reacted plugin) -------------------------- */
/*
 * Reactor faces inside every reaction pill \u2014 the primary surface. Meant to
 * blend with Discord's own count layout: same vertical center, small enough
 * that a pill with 3 avatars is only a little wider than one without, and no
 * background of our own so the pill's own tint (blue for reactionMe, grey
 * otherwise) shows through.
 *
 * Attached inside \`.reactionInner__\u2026\` as its last child. Sits after the count
 * with a small margin, so it reads as an appended detail rather than a
 * standalone widget.
 */
.hc-inline-reactors {
  display: inline-flex;
  align-items: center;
  margin-left: 4px;
  gap: 0;
  line-height: 1;
  /* Not interactive: this must never eat the click that toggles your own
   * reaction on the pill it's inside. */
  pointer-events: none;
}
.hc-inline-reactors__avatar {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  object-fit: cover;
  /* A slim rim in the pill's background color visually separates overlapping
   * avatars from each other without adding a foreign block color. */
  border: 1.5px solid var(--background-secondary, #2b2d31);
  background: var(--background-tertiary, #1e1f22);
  /* Overlap each next avatar over the previous one; the first stands alone. */
  margin-left: -4px;
}
.hc-inline-reactors__avatar:first-child {
  margin-left: 0;
}
.hc-inline-reactors__more {
  margin-left: 4px;
  font-size: 11px;
  font-weight: 600;
  color: var(--interactive-normal, #b5bac1);
  font-variant-numeric: tabular-nums;
}
/* When the pill is the "I reacted" variant Discord tints the whole pill blue,
 * so switch the avatar rim to that darker inner tone (approximation \u2014 no exact
 * token exists for the "reactionMe" background) so avatars don't rim in a
 * conflicting color. Falls back to the default rim on builds without that
 * class. */
[class*="reactionMe"] .hc-inline-reactors__avatar {
  border-color: rgba(88, 101, 242, 0.35);
}


/* --- Recovered media on a deleted message (message-logger, in-chat) ------- */
/*
 * Discord strips a deleted message's attachments/embeds from its render, so we
 * paint the recovered thumbnails back in beneath the "\u6B64\u6D88\u606F\u5DF2\u5220\u9664" marker. Sits
 * inside Discord's own message row, so literal values, no tokens.
 */
.hc-deleted-media {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 4px;
}
.hc-deleted-media__thumb {
  max-width: 240px;
  max-height: 200px;
  width: auto;
  height: auto;
  object-fit: contain;
  border-radius: 8px;
  background: rgba(0, 0, 0, 0.2);
}
.hc-deleted-media__file {
  color: #00a8fc;
  font-size: 0.8125rem;
  word-break: break-all;
}
/* Recovered thumbnails are our own <img>s \u2014 Discord's click handlers don't
 * know them, so the link wrapping them is ours too. */
.hc-media-open {
  display: inline-block;
  line-height: 0;
  cursor: zoom-in;
  border-radius: 8px;
}
.hc-media-open:hover {
  filter: brightness(1.08);
}

/* --- Recovered-media viewer (message-logger) ----------------------------- */
/*
 * Our own full-size viewer for thumbnails the recorder painted back. Mounted on
 * document.body above Discord's layer stack, so literal values, no tokens.
 * (The client's internal media-modal action proved unreliable across builds \u2014
 * a wrong signature no-ops silently \u2014 hence a viewer we own.)
 */
.hc-media-overlay {
  position: fixed;
  inset: 0;
  z-index: 10000;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.82);
  cursor: zoom-out;
}
.hc-media-overlay__img {
  max-width: 92vw;
  max-height: 92vh;
  width: auto;
  height: auto;
  object-fit: contain;
  border-radius: 8px;
  background: rgba(0, 0, 0, 0.2);
  box-shadow: 0 12px 48px rgba(0, 0, 0, 0.55);
  cursor: default;
}
.hc-media-overlay__hint {
  position: fixed;
  bottom: 18px;
  left: 50%;
  transform: translateX(-50%);
  color: rgba(255, 255, 255, 0.65);
  font-size: 12px;
  user-select: none;
  pointer-events: none;
}


/* --- Message-log button in the channel header toolbar -------------------- */
/*
 * Sits among Discord's own header icons (pin, members, \u2026), so it must read as
 * one of them: same 24px hit target, muted normal color, brighter on hover.
 * Decorates Discord's toolbar, so literal values + Discord CSS variables.
 */
.hc-mlog-toolbtn-host {
  display: inline-flex;
  align-items: center;
}
.hc-mlog-toolbtn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  margin: 0 8px;
  padding: 0;
  border: none;
  background: transparent;
  color: var(--interactive-normal, #b5bac1);
  cursor: pointer;
  transition: color 0.15s ease;
}
.hc-mlog-toolbtn:hover {
  color: var(--interactive-hover, #dbdee1);
}
.hc-mlog-toolbtn:active {
  color: var(--interactive-active, #fff);
}


/* --- Message-cleaner button in the channel header toolbar ---------------- */
/* Same treatment as the message-log button: reads as one of Discord's own
 * header icons, 24px hit target, muted until hover. Decorates Discord's
 * toolbar, so literal values + Discord CSS variables. */
.hc-cleaner-toolbtn-host {
  display: inline-flex;
  align-items: center;
}
.hc-cleaner-toolbtn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  margin: 0 8px;
  padding: 0;
  border: none;
  background: transparent;
  color: var(--interactive-normal, #b5bac1);
  cursor: pointer;
  transition: color 0.15s ease;
}
.hc-cleaner-toolbtn:hover {
  color: var(--interactive-hover, #dbdee1);
}
.hc-cleaner-toolbtn:active {
  color: var(--interactive-active, #fff);
}

/* Message-range picking mode: the settings surface is hidden and the user
 * clicks a message in Discord's chat. Lives outside .halcyon, so literals. */
body.hc-cleaner-picking [id^="chat-messages-"] {
  cursor: crosshair !important;
}
body.hc-cleaner-picking [id^="chat-messages-"]:hover {
  outline: 2px solid #ff453a;
  outline-offset: -2px;
  background: rgba(255, 69, 58, 0.12);
}
.hc-cleaner-pickhint {
  position: fixed;
  top: 16px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10001;
  padding: 10px 18px;
  border-radius: 999px;
  background: #ff453a;
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
  pointer-events: none;
}


/* --- Message-log search box ---------------------------------------------- */
/* Inside the .halcyon panel, so design tokens throughout. Mirrors the plugin
 * browser's search field but on its own row above the list. */
.hc-mlog-search {
  display: flex;
  align-items: center;
  gap: var(--hc-space-2);
  height: 36px;
  margin: var(--hc-space-2) 0 var(--hc-space-3);
  padding: 0 var(--hc-space-3);
  border-radius: var(--hc-radius-md);
  background: var(--hc-fill-secondary);
  color: var(--hc-label-secondary);
}
.hc-mlog-search input {
  flex: 1;
  min-width: 0;
  border: none;
  background: transparent;
  outline: none;
  color: var(--hc-label-primary);
  font-size: var(--hc-text-callout);
  font-family: var(--hc-font);
}
.hc-mlog-search input::placeholder {
  color: var(--hc-label-tertiary);
}
.hc-mlog-search__clear {
  flex: none;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border: none;
  border-radius: var(--hc-radius-pill);
  background: var(--hc-fill-primary);
  color: var(--hc-label-secondary);
  font-size: 15px;
  line-height: 1;
  cursor: pointer;
}
.hc-mlog-search__clear:hover {
  color: var(--hc-label-primary);
}

/* --- Thin scrollbars for Halcyon's own scroll areas ---------------------- */
/*
 * The settings panel and embedded views scroll with the OS default scrollbar,
 * which is a chunky light bar that reads as foreign inside the dark iOS-styled
 * panel. Give those containers the same slim, self-colored bar the emote picker
 * uses. Our surfaces mount in their own .halcyon host, outside Discord's global
 * scrollbar styling, so these rules are needed here.
 */
.hc-panel__scroll,
.hc-embed,
.hc-msglist {
  scrollbar-width: thin;
  scrollbar-color: var(--hc-fill-primary) transparent;
}
.hc-panel__scroll::-webkit-scrollbar,
.hc-embed::-webkit-scrollbar,
.hc-msglist::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}
.hc-panel__scroll::-webkit-scrollbar-track,
.hc-embed::-webkit-scrollbar-track,
.hc-msglist::-webkit-scrollbar-track {
  background: transparent;
}
.hc-panel__scroll::-webkit-scrollbar-thumb,
.hc-embed::-webkit-scrollbar-thumb,
.hc-msglist::-webkit-scrollbar-thumb {
  background: var(--hc-fill-secondary);
  border-radius: 9999px;
  border: 2px solid transparent;
  background-clip: padding-box;
}
.hc-panel__scroll::-webkit-scrollbar-thumb:hover,
.hc-embed::-webkit-scrollbar-thumb:hover,
.hc-msglist::-webkit-scrollbar-thumb:hover {
  background: var(--hc-label-tertiary);
  background-clip: padding-box;
}


/* --- Send preview -------------------------------------------------------- */
/* One composer button plus a floating panel above the input. The panel is
 * body-mounted and positioned from JS, so only the box styling lives here. */
.hc-preview-btn-host {
  display: inline-flex;
  align-items: center;
}
.hc-preview-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  margin: 0 4px;
  padding: 0;
  border: none;
  border-radius: var(--hc-radius-sm);
  background: transparent;
  color: var(--interactive-normal, #b5bac1);
  cursor: pointer;
  transition: color var(--hc-duration-fast) var(--hc-ease);
}
.hc-preview-btn:hover {
  color: var(--interactive-hover, #dbdee1);
}
.hc-preview-btn:active {
  color: var(--interactive-active, #fff);
}

.hc-preview-host {
  position: fixed;
  top: 0;
  left: 0;
  z-index: 4000;
}
.hc-preview {
  padding: var(--hc-space-3);
  border-radius: var(--hc-radius-lg);
  background: var(--hc-bg-elevated);
  box-shadow: var(--hc-elev-2);
  font-size: var(--hc-text-subhead);
  line-height: var(--hc-lh-subhead);
  max-height: 40vh;
  overflow-y: auto;
}
.hc-preview__empty {
  color: var(--hc-label-tertiary);
  font-size: var(--hc-text-footnote);
  line-height: var(--hc-lh-footnote);
}
.hc-preview__row {
  display: flex;
  gap: var(--hc-space-3);
  align-items: flex-start;
}
.hc-preview__avatar {
  flex: 0 0 auto;
  width: 40px;
  height: 40px;
  border-radius: var(--hc-radius-pill);
  object-fit: cover;
}
.hc-preview__avatar--blank {
  background: var(--hc-fill-secondary);
}
.hc-preview__main {
  min-width: 0;
  flex: 1 1 auto;
}
.hc-preview__head {
  display: flex;
  align-items: baseline;
  gap: var(--hc-space-2);
}
.hc-preview__name {
  color: var(--hc-label-primary);
  font-size: var(--hc-text-callout);
  line-height: var(--hc-lh-callout);
  font-weight: 600;
}
.hc-preview__time {
  color: var(--hc-label-quaternary);
  font-size: var(--hc-text-caption2);
  line-height: var(--hc-lh-caption);
}
.hc-preview__body {
  margin-top: 2px;
  color: var(--hc-label-primary);
  white-space: pre-wrap;
  word-break: break-word;
}
/* Custom emoji from the fallback renderer only. When Discord's own parser is
 * used, its markup container class styles the emoji it produced \u2014 overriding
 * those here would fight the very styling we borrow it for. */
.hc-preview__body .hc-emoji {
  vertical-align: -0.3em;
  width: 1.375em;
  height: 1.375em;
  object-fit: contain;
}
.hc-preview__raw {
  margin-top: var(--hc-space-3);
  padding-top: var(--hc-space-3);
  border-top: 1px solid var(--hc-separator);
}
.hc-preview__raw-title {
  color: var(--hc-label-tertiary);
  font-size: var(--hc-text-caption1);
  line-height: var(--hc-lh-caption);
  margin-bottom: var(--hc-space-1);
}
.hc-preview__raw-text {
  display: block;
  color: var(--hc-label-secondary);
  font-family: var(--hc-font-mono);
  font-size: var(--hc-text-caption1);
  line-height: var(--hc-lh-caption);
  word-break: break-all;
  white-space: pre-wrap;
}


/* --- Message-log search: filters + hit highlighting ---------------------- */
.hc-mlog-search__filters {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  width: 28px;
  height: 28px;
  padding: 0;
  border: none;
  border-radius: var(--hc-radius-sm);
  background: transparent;
  color: var(--hc-label-tertiary);
  cursor: pointer;
  transition: color var(--hc-duration-fast) var(--hc-ease),
    background var(--hc-duration-fast) var(--hc-ease);
}
.hc-mlog-search__filters:hover {
  color: var(--hc-label-secondary);
  background: var(--hc-fill-secondary);
}
.hc-mlog-search__filters[data-active="true"] {
  color: var(--hc-accent);
}

.hc-mlog-filters {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: var(--hc-space-3);
  align-items: end;
  margin: var(--hc-space-3) 0;
  padding: var(--hc-space-4);
  border-radius: var(--hc-radius-lg);
  background: var(--hc-bg-secondary);
}
.hc-mlog-filters__field {
  display: flex;
  flex-direction: column;
  gap: var(--hc-space-1);
  min-width: 0;
}
.hc-mlog-filters__field > span {
  color: var(--hc-label-tertiary);
  font-size: var(--hc-text-caption1);
  line-height: var(--hc-lh-caption);
}
.hc-mlog-filters__field input,
.hc-mlog-filters__field select {
  width: 100%;
  min-width: 0;
  padding: 6px 8px;
  border: 1px solid var(--hc-separator);
  border-radius: var(--hc-radius-sm);
  background: var(--hc-bg-primary);
  color: var(--hc-label-primary);
  font-family: var(--hc-font);
  font-size: var(--hc-text-footnote);
  line-height: var(--hc-lh-footnote);
}
.hc-mlog-filters__field input:focus,
.hc-mlog-filters__field select:focus {
  outline: none;
  border-color: var(--hc-accent);
}
.hc-mlog-filters__actions {
  display: flex;
  align-items: flex-end;
  justify-content: flex-end;
}
.hc-mlog-filters__error {
  margin: var(--hc-space-2) 0;
  color: var(--hc-orange);
  font-size: var(--hc-text-caption1);
  line-height: var(--hc-lh-caption);
}

/* A search hit inside a rendered message body. Tinted rather than the browser
 * default yellow, which fights every dark theme. */
.hc-hit {
  padding: 0 1px;
  border-radius: 3px;
  background: color-mix(in srgb, var(--hc-accent) 34%, transparent);
  color: inherit;
}


/* --- Message-log search hits & filters ------------------------------------ */
.hc-hit {
  background: color-mix(in srgb, var(--hc-orange) 35%, transparent);
  color: inherit;
  border-radius: 3px;
  padding: 0 1px;
}
.hc-mlog-search__filters {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  flex: 0 0 auto;
  border: none;
  border-radius: var(--hc-radius-sm);
  background: transparent;
  color: var(--hc-label-tertiary);
  cursor: pointer;
}
.hc-mlog-search__filters[data-active="true"] {
  color: var(--hc-accent);
  background: var(--hc-fill-secondary);
}
.hc-mlog-filters {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
  gap: var(--hc-space-2) var(--hc-space-3);
  margin: var(--hc-space-2) 0 var(--hc-space-3);
  padding: var(--hc-space-3);
  border-radius: var(--hc-radius-md);
  background: var(--hc-bg-secondary);
}
.hc-mlog-filters__field {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}
.hc-mlog-filters__field > span {
  color: var(--hc-label-tertiary);
  font-size: var(--hc-text-caption1);
  line-height: var(--hc-lh-caption);
}
.hc-mlog-filters__field input,
.hc-mlog-filters__field select {
  min-width: 0;
  padding: 6px 8px;
  border: 1px solid var(--hc-separator);
  border-radius: var(--hc-radius-sm);
  background: var(--hc-bg-primary);
  color: var(--hc-label-primary);
  font-family: inherit;
  font-size: var(--hc-text-footnote);
  line-height: var(--hc-lh-footnote);
}
.hc-mlog-filters__field input:focus,
.hc-mlog-filters__field select:focus {
  outline: none;
  border-color: var(--hc-accent);
}
.hc-mlog-filters__actions {
  display: flex;
  align-items: flex-end;
}
.hc-mlog-filters__error {
  margin: 0 0 var(--hc-space-2);
  color: var(--hc-orange);
  font-size: var(--hc-text-caption1);
  line-height: var(--hc-lh-caption);
}


/* --- Image zoom lens ----------------------------------------------------- */
/* Body-mounted, follows the cursor, never intercepts a click. Position, size
 * and backdrop are all set from JS; only the chrome lives here. */
.hc-zoom-lens {
  position: fixed;
  display: none;
  z-index: 4200;
  pointer-events: none;
  background-repeat: no-repeat;
  background-color: var(--hc-bg-elevated);
  box-shadow: var(--hc-elev-2), 0 0 0 2px rgba(255, 255, 255, 0.14) inset;
  border: 1px solid rgba(0, 0, 0, 0.35);
  image-rendering: auto;
}
`;var kc="halcyon-styles",Ec=!1;function B(){if(Ec)return;let e=document.getElementById(kc),t=e instanceof HTMLStyleElement?e:document.createElement("style");t.id=kc,t.textContent=`${wc}
${Sc}`,e||document.head.appendChild(t),Ec=!0}function M({size:e=20,className:t,filled:n,children:r,...i}){let a=i["aria-label"];return(typeof e!="number"||!Number.isFinite(e))&&(e=20),o.createElement("svg",{className:t,width:e,height:e,viewBox:"0 0 24 24",fill:n?"currentColor":"none",stroke:n?"none":"currentColor",strokeWidth:1.5,strokeLinecap:"round",strokeLinejoin:"round",role:a?"img":void 0,"aria-label":a,"aria-hidden":a?void 0:!0},r)}function fr(e){return o.createElement(M,{...e},o.createElement("rect",{x:"3.25",y:"3.25",width:"17.5",height:"17.5",rx:"5"}),o.createElement("path",{d:"M6.5 13.2c1.4-2.5 2.9-2.5 4.3 0s2.9 2.5 4.3 0 2.9-2.5 2.9-2.5"}))}function mr(e){return o.createElement(M,{...e},o.createElement("path",{d:"M9 6l6 6-6 6"}))}function gr(e){return o.createElement(M,{...e},o.createElement("circle",{cx:"12",cy:"12",r:"8.25"}),o.createElement("path",{d:"M12 7.5V12l3 2"}))}function ce(e){return o.createElement(M,{...e},o.createElement("path",{d:"M4.5 7h15"}),o.createElement("path",{d:"M9.25 7V5.5A1.5 1.5 0 0110.75 4h2.5A1.5 1.5 0 0114.75 5.5V7"}),o.createElement("path",{d:"M6.5 7l.85 11.1A2 2 0 009.34 20h5.32a2 2 0 001.99-1.9L17.5 7"}),o.createElement("path",{d:"M10 11v5.5M14 11v5.5"}))}function wi(e){return o.createElement(M,{...e},o.createElement("path",{d:"M13.5 6.5l4 4"}),o.createElement("path",{d:"M4.5 19.5l1-4L15.5 5.5a2 2 0 013 3L8.5 18.5l-4 1z"}))}function Ic(e){return o.createElement(M,{...e},o.createElement("path",{d:"M12 3.5l7 2.6v5c0 4.4-3 7.3-7 8.9-4-1.6-7-4.5-7-8.9v-5l7-2.6z"}),o.createElement("path",{d:"M9 12l2 2 4-4"}))}function Nc(e){return o.createElement(M,{...e},o.createElement("path",{d:"M5 5.5h14a1.5 1.5 0 011.5 1.5v8a1.5 1.5 0 01-1.5 1.5H9.5L5.5 20v-3H5A1.5 1.5 0 013.5 15.5V7A1.5 1.5 0 015 5.5z"}))}function Pe(e){return o.createElement(M,{...e},o.createElement("circle",{cx:"11",cy:"11",r:"6.25"}),o.createElement("path",{d:"M20 20l-3.8-3.8"}))}function yr(e){return o.createElement(M,{...e},o.createElement("path",{d:"M6.5 6.5l11 11M17.5 6.5l-11 11"}))}function hn(e){return o.createElement(M,{...e},o.createElement("path",{d:"M5 5.5h14a1.5 1.5 0 011.5 1.5v8a1.5 1.5 0 01-1.5 1.5H9.5L5.5 20v-3H5A1.5 1.5 0 013.5 15.5V7A1.5 1.5 0 015 5.5z"}),o.createElement("path",{d:"M8.5 11l2.25 2.25L15.5 8.5"}))}function We(e){return o.createElement(M,{...e},o.createElement("path",{d:"M4.5 8h9M17 8h2.5M4.5 16h2.5M10.5 16h9"}),o.createElement("circle",{cx:"15",cy:"8",r:"2.25"}),o.createElement("circle",{cx:"9",cy:"16",r:"2.25"}))}function Cc(e){return o.createElement(M,{...e},o.createElement("path",{d:"M4.5 9.5v5H7l4.5 3.5V6L7 9.5H4.5z"}),o.createElement("path",{d:"M15 9a4 4 0 010 6"}),o.createElement("path",{d:"M17.5 6.5a7.5 7.5 0 010 11"}))}function Tc(e){return o.createElement(M,{...e},o.createElement("circle",{cx:"12",cy:"12",r:"8.25"}),o.createElement("path",{d:"M12 3.75a8.25 8.25 0 010 16.5z",fill:"currentColor",stroke:"none"}))}function Ac(e){return o.createElement(M,{...e},o.createElement("path",{d:"M8.5 8L4.5 12l4 4"}),o.createElement("path",{d:"M15.5 8l4 4-4 4"}),o.createElement("path",{d:"M13.5 5.5l-3 13"}))}function Mc(e){return o.createElement(M,{...e,filled:!0},o.createElement("circle",{cx:"5.5",cy:"12",r:"1.6"}),o.createElement("circle",{cx:"12",cy:"12",r:"1.6"}),o.createElement("circle",{cx:"18.5",cy:"12",r:"1.6"}))}function Pc(e){return o.createElement(M,{...e},o.createElement("path",{d:"M12 4v10"}),o.createElement("path",{d:"M8 10.5l4 4 4-4"}),o.createElement("path",{d:"M5 19.5h14"}))}function br(e){return o.createElement(M,{...e},o.createElement("path",{d:"M12 5v14M5 12h14"}))}function Ot(e){return o.createElement(M,{...e},o.createElement("circle",{cx:"12",cy:"12",r:"8.25"}),o.createElement("path",{d:"M12 11v5"}),o.createElement("path",{d:"M12 7.75h.01"}))}function Ye(e){return o.createElement(M,{...e},o.createElement("path",{d:"M12 4.5L3.5 19h17L12 4.5z"}),o.createElement("path",{d:"M12 10v4"}),o.createElement("path",{d:"M12 16.75h.01"}))}function Je(e){return o.createElement(M,{...e},o.createElement("path",{d:"M8.5 7h11M8.5 12h11M8.5 17h11"}),o.createElement("path",{d:"M4.5 7h.01M4.5 12h.01M4.5 17h.01"}))}function Lc(e){return o.createElement(M,{...e},o.createElement("path",{d:"M5 12h14"}))}function gt(e){return o.createElement(M,{...e},o.createElement("path",{d:"M19 8.5a7.5 7.5 0 10.9 6"}),o.createElement("path",{d:"M19 4v4.5h-4.5"}))}function vr(e){return o.createElement(M,{...e},o.createElement("path",{d:"M15 6l-6 6 6 6"}))}function _r(e){return o.createElement(M,{...e},o.createElement("rect",{x:"4",y:"4",width:"16",height:"6",rx:"2"}),o.createElement("rect",{x:"4",y:"14",width:"16",height:"6",rx:"2"}),o.createElement("path",{d:"M8 7h.01M8 17h.01"}))}function $c(e){return o.createElement(M,{...e},o.createElement("circle",{cx:"12",cy:"12",r:"2"}),o.createElement("path",{d:"M8.5 8.5a5 5 0 000 7M15.5 8.5a5 5 0 010 7"}),o.createElement("path",{d:"M6 6a9 9 0 000 12M18 6a9 9 0 010 12"}))}function Dc(e){return o.createElement(M,{...e,filled:!0},o.createElement("path",{d:"M7.5 21.7a8.95 8.95 0 0 1 9 0 1 1 0 0 0 1-1.73c-.6-.35-1.24-.64-1.9-.87.54-.3 1.05-.65 1.52-1.07a3.98 3.98 0 0 0 5.49-1.8.77.77 0 0 0-.24-.95 3.98 3.98 0 0 0-2.02-.76A4 4 0 0 0 23 10.47a.76.76 0 0 0-.71-.71 4.06 4.06 0 0 0-1.6.22 3.99 3.99 0 0 0 .54-5.35.77.77 0 0 0-.95-.24c-.75.36-1.37.95-1.77 1.67V6a4 4 0 0 0-4.9-3.9.77.77 0 0 0-.6.72 4 4 0 0 0 3.7 4.17c.89 1.3 1.3 2.95 1.3 4.51 0 3.66-2.75 6.5-6 6.5s-6-2.84-6-6.5c0-1.56.41-3.21 1.3-4.51A4 4 0 0 0 11 2.82a.77.77 0 0 0-.6-.72 4.01 4.01 0 0 0-4.9 3.96A4.02 4.02 0 0 0 3.73 4.4a.77.77 0 0 0-.95.24 3.98 3.98 0 0 0 .55 5.35 4 4 0 0 0-1.6-.22.76.76 0 0 0-.72.71l-.01.28a4 4 0 0 0 2.65 3.77c-.75.06-1.45.33-2.02.76-.3.22-.4.62-.24.95a4 4 0 0 0 5.49 1.8c.47.42.98.78 1.53 1.07-.67.23-1.3.52-1.91.87a1 1 0 1 0 1 1.73Z"}))}function Oc(e){return o.createElement(M,{...e},o.createElement("circle",{cx:"9",cy:"8.25",r:"3.25"}),o.createElement("path",{d:"M3.5 19.5c0-2.9 2.46-5.25 5.5-5.25s5.5 2.35 5.5 5.25"}),o.createElement("path",{d:"M16 5.4a3.25 3.25 0 010 6.2"}),o.createElement("path",{d:"M17.2 14.6c2.03.6 3.3 2.4 3.3 4.9"}))}function jc(e){return o.createElement(M,{...e},o.createElement("rect",{x:"3",y:"4.5",width:"18",height:"11.5",rx:"2"}),o.createElement("path",{d:"M9 19.5h6M12 16v3.5"}))}function zc(e){return o.createElement(M,{...e},o.createElement("rect",{x:"7",y:"2.75",width:"10",height:"18.5",rx:"2.5"}),o.createElement("path",{d:"M10.75 18.25h2.5"}))}function Bc(e){return o.createElement(M,{...e},o.createElement("circle",{cx:"12",cy:"12",r:"8.25"}),o.createElement("path",{d:"M3.75 12h16.5"}),o.createElement("path",{d:"M12 3.75c2.2 2.3 3.3 5.05 3.3 8.25S14.2 17.95 12 20.25c-2.2-2.3-3.3-5.05-3.3-8.25S9.8 6.05 12 3.75z"}))}function Uc(e){return o.createElement(M,{...e},o.createElement("path",{d:"M7.5 7.5h9a5 5 0 014.9 6l-.5 2.6A2.5 2.5 0 0118.45 18c-.9 0-1.73-.48-2.17-1.26L15.5 15.5h-7l-.78 1.24A2.5 2.5 0 015.55 18a2.5 2.5 0 01-2.45-1.9l-.5-2.6a5 5 0 014.9-6z"}),o.createElement("path",{d:"M8.25 10.5v2.25M7.12 11.6h2.26"}),o.createElement("path",{d:"M15.25 11h.01M17 12.75h.01"}))}function Gc(e){return o.createElement(M,{...e},o.createElement("circle",{cx:"12",cy:"12",r:"8.25"}),o.createElement("path",{d:"M9 9.75h.01M15 9.75h.01"}),o.createElement("path",{d:"M8.5 14.25a4.2 4.2 0 007 0"}))}function Hc(e){return o.createElement(M,{...e},o.createElement("path",{d:"M2.75 12s3.4-5.75 9.25-5.75S21.25 12 21.25 12s-3.4 5.75-9.25 5.75S2.75 12 2.75 12z"}),o.createElement("circle",{cx:"12",cy:"12",r:"2.75"}))}function Z({checked:e,onChange:t,disabled:n,...r}){return o.createElement("button",{type:"button",role:"switch","aria-checked":e,"aria-label":r["aria-label"],className:"hc-toggle","data-on":e,disabled:n,onClick:()=>{n||t(!e)}},o.createElement("span",{className:"hc-toggle__knob"}))}function Si({icon:e,iconBackground:t,title:n,subtitle:r,accessory:i,onClick:a,showChevron:s}){let c=typeof a=="function";return o.createElement("div",{className:c?"hc-row hc-row--button":"hc-row",onClick:a,role:c?"button":void 0,tabIndex:c?0:void 0,onKeyDown:c?l=>{(l.key==="Enter"||l.key===" ")&&(l.preventDefault(),a?.())}:void 0},e&&o.createElement("div",{className:"hc-row__icon",style:t?{background:t}:void 0},e),o.createElement("div",{className:"hc-row__text"},o.createElement("div",{className:"hc-row__title"},n),r!=null&&r!==!1&&o.createElement("div",{className:"hc-row__subtitle"},r)),i!=null&&i!==!1&&o.createElement("div",{className:"hc-row__accessory"},i),s&&o.createElement(mr,{size:20,className:"hc-row__chevron"}))}function Re({tone:e="neutral",children:t}){return o.createElement("span",{className:"hc-badge","data-tone":e},t)}function de({icon:e,title:t,subtitle:n,action:r}){return o.createElement("div",{className:"hc-empty"},e,o.createElement("div",{className:"hc-empty__title"},t),n&&o.createElement("div",{className:"hc-empty__subtitle"},n),r&&o.createElement("div",{style:{marginTop:"var(--hc-space-5)"}},r))}function Fc(e,t,n){return t!=null&&e<t?t:n!=null&&e>n?n:e}function ki({value:e,onChange:t,min:n,max:r,step:i=1}){let a=n!=null&&e<=n,s=r!=null&&e>=r;return o.createElement("div",{className:"hc-stepper"},o.createElement("button",{type:"button",className:"hc-stepper__btn",onClick:()=>t(Fc(e-i,n,r)),disabled:a,"aria-label":"\u51CF\u5C11"},o.createElement(Lc,{size:16})),o.createElement("span",{className:"hc-stepper__value"},e),o.createElement("button",{type:"button",className:"hc-stepper__btn",onClick:()=>t(Fc(e+i,n,r)),disabled:s,"aria-label":"\u589E\u52A0"},o.createElement(br,{size:16})))}function J({value:e,onChange:t,className:n,...r}){return o.createElement("input",{className:n?`hc-input ${n}`:"hc-input",value:e,onChange:i=>t(i.currentTarget.value),...r})}function pn({value:e,options:t,onChange:n,...r}){let[i,a]=y(!1),[s,c]=y(-1),l=se(null),d=se(null),[u,h]=y(null),f=t.find(m=>m.value===e);C(()=>{if(!i)return;let m=b=>{let E=b.target;l.current?.contains(E)||d.current?.contains(E)||a(!1)};return document.addEventListener("pointerdown",m,!0),()=>document.removeEventListener("pointerdown",m,!0)},[i]),C(()=>{if(!i)return;let m=b=>{d.current&&b.target instanceof Node&&d.current.contains(b.target)||a(!1)};return window.addEventListener("scroll",m,!0),window.addEventListener("resize",m),()=>{window.removeEventListener("scroll",m,!0),window.removeEventListener("resize",m)}},[i]);let v=()=>{let m=l.current?.getBoundingClientRect();if(m){let b=Math.min(280,t.length*36+10),E=m.bottom+6,z=E+b>window.innerHeight-8?Math.max(8,m.top-6-b):E;h({top:z,right:Math.max(8,window.innerWidth-m.right),width:m.width})}c(Math.max(0,t.findIndex(b=>b.value===e))),a(!0)},x=m=>{a(!1),m!==e&&n(m)},L=m=>{if(!i){(m.key==="Enter"||m.key===" "||m.key==="ArrowDown")&&(m.preventDefault(),v());return}m.key==="Escape"?(m.preventDefault(),a(!1)):m.key==="ArrowDown"?(m.preventDefault(),c(b=>Math.min(t.length-1,b+1))):m.key==="ArrowUp"?(m.preventDefault(),c(b=>Math.max(0,b-1))):m.key==="Enter"||m.key===" "?(m.preventDefault(),s>=0&&s<t.length&&x(t[s].value)):m.key==="Tab"&&a(!1)};return o.createElement("div",{className:"hc-select",ref:l,onKeyDown:L},o.createElement("button",{type:"button",className:"hc-select__button","aria-haspopup":"listbox","aria-expanded":i,"aria-label":r["aria-label"],onClick:()=>i?a(!1):v()},o.createElement("span",{className:"hc-select__value"},f?.label??e),o.createElement("svg",{className:"hc-select__chevron",width:"12",height:"12",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:2.5,strokeLinecap:"round",strokeLinejoin:"round","aria-hidden":!0,"data-open":i},o.createElement("path",{d:"M6 9l6 6 6-6"}))),i&&u&&ur.createPortal(o.createElement("div",{className:"halcyon",ref:d,style:{position:"fixed",top:u.top,right:u.right,zIndex:1e4},onKeyDown:L},o.createElement("div",{className:"hc-select__menu",role:"listbox",style:{minWidth:u.width}},t.map((m,b)=>o.createElement("button",{type:"button",key:m.value,role:"option","aria-selected":m.value===e,className:"hc-select__option","data-active":b===s,"data-selected":m.value===e,onPointerEnter:()=>c(b),onClick:()=>x(m.value)},o.createElement("span",{className:"hc-select__optlabel"},m.label),m.value===e&&o.createElement("svg",{className:"hc-select__check",width:"14",height:"14",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:2.5,strokeLinecap:"round",strokeLinejoin:"round","aria-hidden":!0},o.createElement("path",{d:"M5 12.5l4.5 4.5L19 7"})))))),document.body))}function Ei(e,t,n){let r=e.slice();return r[t]=n,r}function Ii(e,t){return e.filter((n,r)=>r!==t)}function qc(e,t){if(t<0||t>=e.length)return e.slice();let n=(e[t]??"").trim(),r=e.filter((i,a)=>a!==t).map(i=>i.trim());return!n||r.includes(n)?Ii(e,t):n===e[t]?e.slice():Ei(e,t,n)}function Kc(e,t){let n=t.trim();return!n||e.includes(n)?null:[...e,n]}function Ni({value:e,onChange:t,itemPlaceholder:n}){let[r,i]=y(""),a=()=>{let s=Kc(e,r);s&&t(s),i("")};return o.createElement("div",{className:"hc-strlist"},e.map((s,c)=>o.createElement("div",{className:"hc-strlist__item",key:c},o.createElement(J,{value:s,onChange:l=>t(Ei(e,c,l)),onBlur:()=>t(qc(e,c)),placeholder:n}),o.createElement("button",{type:"button",className:"hc-iconbtn hc-iconbtn--danger",onClick:()=>t(Ii(e,c)),"aria-label":"\u79FB\u9664"},o.createElement(ce,{size:18})))),o.createElement("div",{className:"hc-strlist__add"},o.createElement(J,{value:r,onChange:i,placeholder:n??"\u6DFB\u52A0\u4E00\u9879",onKeyDown:s=>{s.key==="Enter"&&(s.preventDefault(),a())}}),o.createElement("button",{type:"button",className:"hc-iconbtn",onClick:a,"aria-label":"\u6DFB\u52A0",disabled:!r.trim()},o.createElement(br,{size:18}))))}function k({variant:e="secondary",size:t="md",icon:n,className:r,children:i,type:a="button",...s}){let c=["hc-btn",`hc-btn--${e}`];return t!=="md"&&c.push(`hc-btn--${t}`),r&&c.push(r),o.createElement("button",{type:a,className:c.join(" "),...s},n,i!=null&&i!==!1&&o.createElement("span",null,i))}function xr(){let[e,t]=y(()=>K.list());return C(()=>{let n=()=>t(K.list());return n(),K.onChange(n)},[]),e}function Vc(e){let[,t]=y(0);return C(()=>{let n=Object.keys(e.schema).map(r=>e.subscribe(r,()=>t(i=>i+1)));return()=>{for(let r of n)r()}},[e]),e.store}function Wc(e){return e===null||typeof e!="object"?e:JSON.parse(JSON.stringify(e))}function sf(e,t){if(e===t)return!0;try{return JSON.stringify(e)===JSON.stringify(t)}catch{return!1}}function Yc({settings:e}){let t=Vc(e),n=hr(()=>Object.keys(e.schema).filter(d=>!e.schema[d].hidden),[e]),[r,i]=y(()=>Ci(t,n));if(C(()=>{i(Ci(t,n))},[e]),n.length===0)return null;let a=n.filter(d=>!sf(r[d],t[d])),s=()=>{for(let d of a)t[d]=Wc(r[d])},c=()=>i(Ci(t,n)),l=[];for(let d of n){let u=e.schema[d].group??"\u8BBE\u7F6E",h=l[l.length-1];h&&h.title===u?h.keys.push(d):l.push({title:u,keys:[d]})}return o.createElement(o.Fragment,null,l.map((d,u)=>o.createElement("div",{className:"hc-section",key:`${d.title}-${u}`},o.createElement("div",{className:"hc-section__title"},d.title),o.createElement("div",{className:"hc-section__body"},d.keys.map(h=>o.createElement(cf,{key:h,def:e.schema[h],value:r[h],onChange:f=>i(v=>({...v,[h]:f}))}))))),a.length>0&&o.createElement("div",{className:"hc-savebar"},o.createElement("span",{className:"hc-savebar__label"},"\u6709 ",a.length," \u9879\u672A\u4FDD\u5B58\u7684\u4FEE\u6539"),o.createElement("div",{className:"hc-savebar__actions"},o.createElement(k,{size:"sm",variant:"plain",onClick:c},"\u653E\u5F03"),o.createElement(k,{size:"sm",variant:"primary",onClick:s},"\u4FDD\u5B58"))))}function Ci(e,t){let n={};for(let r of t)n[r]=Wc(e[r]);return n}function cf({def:e,value:t,onChange:n}){let r=o.createElement("div",{className:"hc-cell__main"},o.createElement("div",{className:"hc-cell__label"},e.label),e.description&&o.createElement("div",{className:"hc-cell__desc"},e.description));switch(e.type){case"boolean":return o.createElement("div",{className:"hc-cell hc-cell--row"},r,o.createElement(Z,{checked:t===!0,onChange:i=>n(i),disabled:e.disabled?.(),"aria-label":e.label}));case"number":return o.createElement("div",{className:"hc-cell hc-cell--row"},r,o.createElement(ki,{value:typeof t=="number"?t:e.default,onChange:i=>n(i),min:e.min,max:e.max,step:e.step}));case"select":return o.createElement("div",{className:"hc-cell hc-cell--row"},r,o.createElement(pn,{value:typeof t=="string"?t:e.default,onChange:i=>n(i),options:e.options}));case"string":return o.createElement("div",{className:"hc-cell"},o.createElement("div",{className:"hc-cell--row"},r),o.createElement("div",{className:"hc-cell__control"},o.createElement(J,{value:typeof t=="string"?t:"",onChange:i=>n(i),placeholder:e.placeholder,maxLength:e.maxLength})));case"string-list":return o.createElement("div",{className:"hc-cell"},r,o.createElement("div",{className:"hc-cell__control"},o.createElement(Ni,{value:Array.isArray(t)?t:[],onChange:i=>n(i),itemPlaceholder:e.itemPlaceholder})));case"custom":{let i=e.component;return o.createElement("div",{className:"hc-cell"},r,o.createElement("div",{className:"hc-cell__control"},o.createElement(i,{value:t,onChange:n})))}default:return null}}var wr={utility:{label:"\u5B9E\u7528\u5DE5\u5177",color:"var(--hc-accent)",Icon:We},chat:{label:"\u804A\u5929",color:"var(--hc-green)",Icon:Nc},voice:{label:"\u8BED\u97F3",color:"var(--hc-indigo)",Icon:Cc},appearance:{label:"\u5916\u89C2",color:"var(--hc-pink)",Icon:Tc},privacy:{label:"\u9690\u79C1",color:"var(--hc-teal)",Icon:Ic},developer:{label:"\u5F00\u53D1\u8005",color:"var(--hc-orange)",Icon:Ac},misc:{label:"\u5176\u4ED6",color:"var(--hc-fill-primary)",Icon:Mc}},Jc=["utility","chat","voice","appearance","privacy","developer","misc"];function Rc({initialSelectedId:e}={}){let t=xr().filter(d=>!d.hidden),[n,r]=y(e??null),[i,a]=y(""),s=n?t.find(d=>d.id===n):void 0;if(s)return o.createElement(df,{view:s,onBack:()=>r(null)});let c=i.trim().toLowerCase(),l=c?t.filter(d=>d.name.toLowerCase().includes(c)||d.description.toLowerCase().includes(c)):t;return o.createElement("div",null,o.createElement("div",{className:"hc-toolbar"},o.createElement("div",{className:"hc-search"},o.createElement(Pe,{size:20}),o.createElement("input",{value:i,onChange:d=>a(d.currentTarget.value),placeholder:"\u641C\u7D22\u63D2\u4EF6","aria-label":"\u641C\u7D22\u63D2\u4EF6"}))),l.length===0?o.createElement(de,{icon:o.createElement(Pe,{size:48}),title:"\u6CA1\u6709\u5339\u914D\u7684\u63D2\u4EF6",subtitle:"\u6362\u4E2A\u5173\u952E\u8BCD\u518D\u8BD5\u8BD5\u3002"}):Jc.map(d=>{let u=l.filter(f=>f.category===d);if(u.length===0)return null;let h=wr[d];return o.createElement("div",{className:"hc-section",key:d},o.createElement("div",{className:"hc-section__title"},h.label),o.createElement("div",{className:"hc-section__body"},u.map(f=>o.createElement(lf,{key:f.id,view:f,onOpen:()=>r(f.id)}))))}))}function lf({view:e,onOpen:t}){let n=wr[e.category],r=n.Icon,i=e.hasSettings||e.hasPage;return o.createElement(Si,{icon:o.createElement(r,{size:18}),iconBackground:n.color,title:e.name,subtitle:e.description,onClick:i?t:void 0,showChevron:i,accessory:o.createElement(o.Fragment,null,e.needsRestart&&o.createElement(Re,{tone:"orange"},o.createElement(gt,{size:12})," \u5F85\u91CD\u542F"),e.state==="errored"&&o.createElement(Re,{tone:"red"},o.createElement(Ye,{size:12})," \u51FA\u9519"),o.createElement("span",{onClick:a=>a.stopPropagation(),onKeyDown:a=>a.stopPropagation()},o.createElement(Z,{checked:e.enabled,disabled:e.required,onChange:()=>K.toggle(e.id),"aria-label":`\u542F\u7528 ${e.name}`})))})}function df({view:e,onBack:t}){let n=K.getPlugin(e.id),r=wr[e.category],i=r.Icon,a=!!(n?.settings&&Object.values(n.settings.schema).some(d=>!d.hidden)),s=!!n?.page&&a,[c,l]=y("page");return o.createElement("div",null,o.createElement("button",{type:"button",className:"hc-back",onClick:t},o.createElement(vr,{size:20}),"\u63D2\u4EF6"),o.createElement("div",{className:"hc-detail-head"},o.createElement("div",{className:"hc-detail-head__icon",style:{background:r.color}},o.createElement(i,{size:26})),o.createElement("div",{className:"hc-detail-head__text"},o.createElement("div",{className:"hc-detail-head__name"},e.name),o.createElement("div",{className:"hc-detail-head__desc"},e.description),o.createElement("div",{className:"hc-detail-head__meta"},e.authors.map(d=>d.name).join("\u3001"))),o.createElement("span",{onClick:d=>d.stopPropagation(),onKeyDown:d=>d.stopPropagation()},o.createElement(Z,{checked:e.enabled,disabled:e.required,onChange:()=>K.toggle(e.id),"aria-label":`\u542F\u7528 ${e.name}`}))),e.needsRestart&&o.createElement("div",{className:"hc-inline-note"},o.createElement(gt,{size:18}),o.createElement("span",null,"\u8FD9\u4E2A\u63D2\u4EF6\u5305\u542B\u52A0\u8F7D\u671F\u8865\u4E01\uFF0C\u9700\u8981\u91CD\u542F Discord \u624D\u80FD\u5B8C\u5168\u751F\u6548\u3002")),e.state==="errored"&&o.createElement("div",{className:"hc-inline-note hc-inline-note--danger"},o.createElement(Ye,{size:18}),o.createElement("span",null,"\u63D2\u4EF6\u542F\u52A8\u65F6\u629B\u51FA\u5F02\u5E38\uFF0C\u5DF2\u88AB\u81EA\u52A8\u505C\u7528\uFF0C\u8BE6\u60C5\u89C1\u65E5\u5FD7\u3002")),s&&o.createElement("div",{className:"hc-segment"},o.createElement("button",{type:"button",className:"hc-segment__item","data-active":c==="page",onClick:()=>l("page")},n.page.title||"\u8BB0\u5F55"),o.createElement("button",{type:"button",className:"hc-segment__item","data-active":c==="settings",onClick:()=>l("settings")},"\u8BBE\u7F6E")),n?.page&&(!s||c==="page")?o.createElement(n.page.component,null):n?.settings?o.createElement(Yc,{settings:n.settings}):o.createElement(de,{title:"\u6CA1\u6709\u53EF\u914D\u7F6E\u9879",subtitle:"\u8FD9\u4E2A\u63D2\u4EF6\u5F00\u7BB1\u5373\u7528\uFF0C\u65E0\u9700\u8BBE\u7F6E\u3002"}))}var Xc=500,Ti=100;function Qc(){let[e,t]=y(()=>li().slice()),[n,r]=y(0),i=se(null);C(()=>(t(li().slice()),tc(d=>{t(u=>{let h=u.concat(d);return h.length>Xc?h.slice(h.length-Xc):h})})),[]);let a=Math.max(1,Math.ceil(e.length/Ti)),s=Math.min(n,a-1),c=e.length-s*Ti,l=e.slice(Math.max(0,c-Ti),c);return C(()=>{if(s!==0)return;let d=i.current;d&&(d.scrollTop=d.scrollHeight)},[e,s]),e.length===0?o.createElement(de,{icon:o.createElement(Je,{size:48}),title:"\u6682\u65E0\u65E5\u5FD7",subtitle:"\u8FD0\u884C\u65F6\u548C\u63D2\u4EF6\u7684\u8F93\u51FA\u4F1A\u5B9E\u65F6\u51FA\u73B0\u5728\u8FD9\u91CC\u3002"}):o.createElement("div",{className:"hc-stack"},o.createElement("div",{className:"hc-logs",ref:i},l.map((d,u)=>o.createElement("div",{className:"hc-logline","data-level":d.level,key:`${d.time}-${u}`},o.createElement("span",{className:"hc-logline__time"},uf(d.time)),o.createElement("span",{className:"hc-logline__scope"},d.scope),o.createElement("span",{className:"hc-logline__msg"},d.parts.map(hf).join(" "))))),a>1&&o.createElement("div",{className:"hc-pager"},o.createElement("button",{type:"button",className:"hc-tab",disabled:s>=a-1,onClick:()=>r(Math.min(a-1,s+1))},"\u2190 \u66F4\u65E9"),o.createElement("span",{className:"hc-pager__label"},s===0?"\u5B9E\u65F6":`\u7B2C ${a-s} / ${a} \u9875`),o.createElement("button",{type:"button",className:"hc-tab",disabled:s===0,onClick:()=>r(Math.max(0,s-1))},"\u66F4\u65B0 \u2192")))}function uf(e){let t=new Date(e);return`${t.toLocaleTimeString(void 0,{hour12:!1})}.${String(t.getMilliseconds()).padStart(3,"0")}`}function hf(e){if(typeof e=="string")return e;if(e instanceof Error)return e.stack??e.message;try{return JSON.stringify(e)}catch{return String(e)}}function R({title:e,note:t,children:n}){return o.createElement("div",{className:"hc-section"},e&&o.createElement("div",{className:"hc-section__title"},e),o.createElement("div",{className:"hc-section__body"},n),t&&o.createElement("div",{className:"hc-section__note"},t))}var Ai=g("update"),el="mzrodyu/CatieDiscordTools",pf=`https://raw.githubusercontent.com/${el}/main/package.json`,tl=`https://github.com/${el}`,mn=null,fn=null;function ff(){return"0.7.30"}function nl(){return mn}function Zc(e){return String(e).trim().replace(/^v/i,"").split(/[.+-]/).map(t=>parseInt(t,10)).filter(t=>Number.isFinite(t))}function mf(e,t){let n=Zc(e),r=Zc(t),i=Math.max(n.length,r.length);for(let a=0;a<i;a++){let s=n[a]??0,c=r[a]??0;if(s!==c)return s>c}return!1}async function gf(e){let t=globalThis.HalcyonNative;if(t&&typeof t.fetchText=="function")try{let n=await t.fetchText(e);if(typeof n=="string")return n}catch{}try{let n=await fetch(e,{cache:"no-store"});if(n.ok)return await n.text()}catch{}return null}async function rl(e=!1){return!e&&mn&&mn.status!=="unknown"?mn:fn||(fn=(async()=>{let t=ff(),n=await gf(pf),r;if(n==null)r={status:"unknown",current:t,latest:null};else{let i=null;try{let a=JSON.parse(n);i=typeof a?.version=="string"&&a.version?a.version:null}catch{i=null}i?t==="dev"?r={status:"current",current:t,latest:i}:r={status:mf(i,t)?"outdated":"current",current:t,latest:i}:r={status:"unknown",current:t,latest:null}}return r.status==="outdated"?Ai.info(`update available: ${r.current} \u2192 ${r.latest}`):r.status==="unknown"?Ai.info("could not determine the latest version (CSP or offline) \u2014 skipping notice"):Ai.info(`up to date (${r.current})`),mn=r,fn=null,r})(),fn)}function yf(e,t){if(t)return"\u68C0\u67E5\u4E2D\u2026";if(!e)return"\u5C1A\u672A\u68C0\u67E5";switch(e.status){case"current":return"\u5DF2\u662F\u6700\u65B0\u7248\u672C";case"outdated":return`\u53D1\u73B0\u65B0\u7248\u672C ${e.latest}`;case"unknown":return"\u65E0\u6CD5\u68C0\u67E5\u66F4\u65B0";default:return"\u68C0\u67E5\u4E2D\u2026"}}function ol(){let e=xr().filter(u=>!u.hidden),t=e.filter(u=>u.enabled).length,n="0.7.30",[r,i]=o.useState(nl),[a,s]=o.useState(!1),c=o.useRef(!0),l=o.useCallback(u=>{s(!0),rl(u).then(h=>{c.current&&i(h)}).finally(()=>{c.current&&s(!1)})},[]);o.useEffect(()=>(c.current=!0,l(!1),()=>{c.current=!1}),[l]);let d=r?.status==="outdated";return o.createElement("div",{className:"hc-stack"},o.createElement("div",{className:"hc-about-hero"},o.createElement(fr,{size:32}),o.createElement("div",null,o.createElement("div",{className:"hc-about-hero__name"},"Halcyon"),o.createElement("div",{className:"hc-about-hero__ver"},"\u7248\u672C ",n,d&&"\uFF0C\u6709\u65B0\u7248\u672C\u53EF\u7528"))),o.createElement(R,{title:"\u66F4\u65B0",note:r?.status==="unknown"?"\u65E0\u6CD5\u8BBF\u95EE GitHub \u2014\u2014 \u53EF\u80FD\u88AB\u7F51\u7EDC\u6216\u5BA2\u6237\u7AEF\u7B56\u7565\u62E6\u622A\uFF0C\u7A0D\u540E\u518D\u8BD5\u3002":void 0},o.createElement("div",{className:"hc-cell hc-cell--row"},o.createElement("div",{className:"hc-cell__main"},o.createElement("div",{className:"hc-cell__label"},"\u7248\u672C ",n),o.createElement("div",{className:"hc-cell__desc"},yf(r,a))),o.createElement(k,{variant:"secondary",size:"sm",disabled:a,onClick:()=>l(!0)},a?"\u68C0\u67E5\u4E2D\u2026":"\u68C0\u67E5\u66F4\u65B0")),d&&o.createElement("div",{className:"hc-cell hc-cell--row"},o.createElement("div",{className:"hc-cell__main"},o.createElement("div",{className:"hc-cell__label"},"\u53D1\u73B0\u65B0\u7248\u672C ",r?.latest)),o.createElement(k,{variant:"primary",size:"sm",onClick:()=>window.open(tl,"_blank","noopener,noreferrer")},"\u524D\u5F80\u4E0B\u8F7D"))),o.createElement(R,{title:"\u6982\u89C8"},o.createElement(Sr,{label:"\u63D2\u4EF6\u603B\u6570",value:String(e.length)}),o.createElement(Sr,{label:"\u5DF2\u542F\u7528",value:String(t)})),o.createElement(R,{title:"\u9879\u76EE",note:"\u4FEE\u6539 Discord \u5BA2\u6237\u7AEF\u8FDD\u53CD\u5176\u670D\u52A1\u6761\u6B3E\uFF0C\u7531\u6B64\u4EA7\u751F\u7684\u4EFB\u4F55\u540E\u679C\u7531\u4F7F\u7528\u8005\u81EA\u884C\u627F\u62C5\u3002\u672C\u9879\u76EE\u4EC5\u4F9B\u6280\u672F\u7814\u7A76\u4E0E\u4E2A\u4EBA\u4F7F\u7528\u3002"},o.createElement(Sr,{label:"\u4F5C\u8005",value:"caitemm (mzrodyu)"}),o.createElement(Sr,{label:"\u8BB8\u53EF\u534F\u8BAE",value:"GPL-3.0-or-later"})))}function Sr({label:e,value:t}){return o.createElement("div",{className:"hc-cell hc-cell--row"},o.createElement("div",{className:"hc-cell__main"},o.createElement("div",{className:"hc-cell__label"},e)),o.createElement("span",{className:"hc-about__value"},t))}var Mi=[{id:"plugins",label:"\u63D2\u4EF6",title:"\u63D2\u4EF6",Icon:We},{id:"logs",label:"\u65E5\u5FD7",title:"\u65E5\u5FD7",Icon:Je},{id:"about",label:"\u5173\u4E8E",title:"\u5173\u4E8E Halcyon",Icon:Ot}];function il(e,t){switch(e){case"plugins":return o.createElement(Rc,{initialSelectedId:t});case"logs":return o.createElement(Qc,null);case"about":return o.createElement(ol,null)}}function al({onClose:e,initial:t}){let[n,r]=y(t?.tab??"plugins"),[i]=y(t?.pluginId),a=Mi.find(s=>s.id===n)??Mi[0];return o.createElement("div",{className:"halcyon hc-panel"},o.createElement("nav",{className:"hc-panel__sidebar"},o.createElement("div",{className:"hc-panel__brand"},o.createElement(fr,{size:24}),o.createElement("span",{className:"hc-panel__brand-name"},"Halcyon")),Mi.map(s=>o.createElement("button",{key:s.id,type:"button",className:"hc-navitem","data-active":s.id===n,onClick:()=>r(s.id)},o.createElement(s.Icon,{size:18}),s.label))),o.createElement("section",{className:"hc-panel__content"},o.createElement("header",{className:"hc-panel__header"},o.createElement("span",{className:"hc-title2"},a.title),e&&o.createElement("button",{type:"button",className:"hc-iconbtn",onClick:e,"aria-label":"\u5173\u95ED"},o.createElement(yr,{size:20}))),o.createElement("div",{className:"hc-panel__scroll"},il(n,n==="plugins"?i:void 0))))}function kr({tab:e}){return o.createElement("div",{className:"halcyon hc-embed"},il(e))}var bf=g("settings"),Xe=null,Er=null,gn=null;function Qe(e){if(B(),!Xe){Xe=document.createElement("div"),Xe.className="halcyon",document.body.appendChild(Xe),gn=t=>{t.key==="Escape"&&Le()},document.addEventListener("keydown",gn);try{Er=X(o.createElement(vf,{onClose:Le,target:e}),Xe)}catch(t){bf.error("could not open settings overlay",t),Le()}}}function Le(){gn&&(document.removeEventListener("keydown",gn),gn=null),Er&&(Er(),Er=null),Xe&&(Xe.remove(),Xe=null)}function vf({onClose:e,target:t}){return o.createElement("div",{className:"hc-overlay",role:"dialog","aria-modal":"true","aria-label":"Halcyon \u8BBE\u7F6E",onMouseDown:n=>{n.target===n.currentTarget&&e()}},o.createElement(al,{onClose:e,initial:t}))}var be=g("settings-host");function dl(){return o.createElement(kr,{tab:"plugins"})}function ul(){return o.createElement(kr,{tab:"logs"})}function hl(){return o.createElement(kr,{tab:"about"})}function _f(e){return function(){return o.createElement(e,{size:20})}}var sl="halcyon-section",xf=[{key:"halcyon-plugins",title:"\u63D2\u4EF6",Component:dl,Icon:We},{key:"halcyon-logs",title:"\u65E5\u5FD7",Component:ul,Icon:Je},{key:"halcyon-about",title:"\u5173\u4E8E",Component:hl,Icon:Ot}],Nr=!1,wf=!0,Pi={SECTION:1,SIDEBAR_ITEM:2,PANEL:3,CATEGORY:5,CUSTOM:20},Ir=null;function Sf(){if(Ir)return Ir;try{let e=Me("SECTION","SIDEBAR_ITEM","PANEL","CUSTOM");if(e&&typeof e.SECTION=="number")return Ir={SECTION:e.SECTION,SIDEBAR_ITEM:e.SIDEBAR_ITEM,PANEL:e.PANEL,CATEGORY:typeof e.CATEGORY=="number"?e.CATEGORY:Pi.CATEGORY,CUSTOM:e.CUSTOM},Ir}catch(e){be.warn("could not resolve settings layout types; using fallback values",e)}return Pi}function Ze(e){try{if(e&&typeof e.buildLayout=="function"){let t=e.buildLayout();if(Array.isArray(t))return t}}catch{}return[]}function pl(e){let t={...Pi};try{let n=Array.isArray(e)?e[0]:void 0;n&&typeof n.type=="number"&&(t.SECTION=n.type);for(let r of e)for(let i of Ze(r))if(typeof i?.type=="number"){t.SIDEBAR_ITEM=i.type;for(let a of Ze(i))if(typeof a?.type=="number"){t.PANEL=a.type;for(let s of Ze(a))if(typeof s?.type=="number"){t.CATEGORY=s.type;for(let c of Ze(s))if(c&&typeof c.type=="number"&&"Component"in c)return t.CUSTOM=c.type,t}}}}catch(n){be.warn("could not read layout types from the live tree; using fallbacks",n)}return t}function kf(e,t){let n={key:`${t.key}-panel`,type:e.PANEL,useTitle:()=>t.title,buildLayout:()=>[{key:`${t.key}-category`,type:e.CATEGORY,buildLayout:()=>[{key:`${t.key}-custom`,type:e.CUSTOM,Component:t.Component,useSearchTerms:()=>[t.title]}]}]};return{key:t.key,type:e.SIDEBAR_ITEM,useTitle:()=>t.title,icon:_f(t.Icon),buildLayout:()=>[n]}}function yn(e){let t={};if(e&&typeof e=="object")for(let n of Object.keys(e)){let r=e[n];typeof r=="function"&&(t[n]=String(r).replace(/\s+/g," ").slice(0,400))}return t}function fl(e,t){if(!e||typeof e!="object")return{raw:typeof e};let n={key:e.key,type:e.type,fields:Object.keys(e)};if(t>0&&typeof e.buildLayout=="function")try{let r=e.buildLayout();Array.isArray(r)&&(n.children=r.slice(0,6).map(i=>fl(i,t-1)))}catch(r){n.childrenError=String(r)}return n}function Ef(e){if(!Nr){Nr=!0;try{let t=e[0],n=Ze(t)[0],r=Ze(n)[0],i=Ze(r)[0],a=Ze(i)[0],s={resolvedTypesFromEnum:Sf(),resolvedTypesFromLive:pl(e),topLevelCount:e.length,sampleSources:{section:yn(t),sidebarItem:yn(n),panel:yn(r),category:yn(i),leaf:yn(a)},layout:e.slice(0,12).map(c=>fl(c,2))};globalThis.__halcyonLayoutProbe=JSON.stringify(s,null,2),be.info("[embed-probe] captured Discord's settings layout shape. In the console run  copy(__halcyonLayoutProbe)  and paste the result back.")}catch(t){be.warn("[embed-probe] failed to capture layout shape",t)}}}function If(){return[{section:"HEADER",label:"HALCYON"},{section:"halcyon-plugins",label:"\u63D2\u4EF6",element:dl},{section:"halcyon-logs",label:"\u65E5\u5FD7",element:ul},{section:"halcyon-about",label:"\u5173\u4E8E",element:hl}]}var Nf=["my account","user_section","privacy & safety","authorized apps","voice & video","keybinds"];function Cf(e){return e.some(t=>{let n=typeof t?.section=="string"?t.section.trim().toLowerCase():"";return n!==""&&Nf.includes(n)})}var cl=!1,ll=!1,bn=null,ml=N({id:"halcyon-settings",name:"Halcyon \u8BBE\u7F6E",description:"Halcyon \u81EA\u8EAB\u7684\u8BBE\u7F6E\u754C\u9762\u5BBF\u4E3B\u3002",authors:[{name:"caitemm"}],category:"misc",required:!0,hidden:!0,patches:[{label:"user-settings-layout",find:".buildLayout().map",replacement:{match:/([A-Za-z_$][\w$]*)\.buildLayout\(\)(?=\.map)/,replace:"$self.buildLayout($1)"}},{label:"user-settings-sidebar",find:"getPredicateSections",replacement:{match:/getPredicateSections\(\)(\{(?:[^{}]|\{(?:[^{}]|\{[^{}]*\})*\})*\})/,replace:(e,t)=>`getPredicateSections(){return $self.injectSections((()=>${t})())}`}}],buildLayout(e){let t=e.buildLayout();try{if(!e||e.key!=="$Root"||!Array.isArray(t))return t;let n=t.findIndex(c=>c?.key==="billing_section"),r=t.findIndex(c=>c?.key==="user_section");if(n<0&&r<0)return cl||(cl=!0,be.info(`[settings-scope] layout left untouched (${t.length} nodes: ${t.map(c=>String(c?.key)).slice(0,12).join(", ")})`)),t;if(Ef(t),!wf||t.some(c=>c?.key===sl))return t;let i=pl(t),a={key:sl,type:i.SECTION,useTitle:()=>"HALCYON",buildLayout:()=>xf.map(c=>kf(i,c))},s=n>=0?n:r;return t.splice(s,0,a),be.info(`native settings embed active \u2014 section inserted at index ${s}/${t.length}`),t}catch(n){return be.error("failed to inject settings section into layout",n),t}},injectSections(e){try{if(!Array.isArray(e)||e.some(i=>i?.section==="halcyon-plugins"))return e;if(!Cf(e))return ll||(ll=!0,be.info(`[settings-scope] legacy sidebar left untouched (${e.length} sections: ${e.map(i=>i?.section).filter(Boolean).slice(0,12).join(", ")})`)),e;let t=If(),n=e.slice(),r=n.findIndex(i=>i&&i.section==="DIVIDER");return r>=0?n.splice(r+1,0,...t):n.push({section:"DIVIDER"},...t),Nr||(Nr=!0,be.info(`native settings embed active (legacy) \u2014 ${e.length} base sections`)),n}catch(t){return be.error("failed to inject settings sections",t),e}},start(){B(),bn=e=>{(e.ctrlKey||e.metaKey)&&e.shiftKey&&e.code==="KeyH"&&(e.preventDefault(),Qe())},window.addEventListener("keydown",bn),be.info("settings host ready \u2014 open with Ctrl/Cmd+Shift+H")},stop(){bn&&(window.removeEventListener("keydown",bn),bn=null),Le()}});var gl=g("context-menu"),vn=new Map,vl=null,yl=!1;function Tf(){yl||typeof document>"u"||(yl=!0,document.addEventListener("contextmenu",e=>{vl=e.target??null},!0))}function Cr(){return vl}var Li=null;function jt(){return Li}function $i(e){for(let t of e){if(t==null)continue;if(Array.isArray(t)){let i=$i(t);if(i)return i}let n=t.props;if(t.type&&n&&typeof n.id=="string"&&(n.action!=null||n.label!=null||n.render!=null||n.onClick!=null||n.subtext!=null))return t.type;let r=n?.children;if(r){let i=$i(Array.isArray(r)?r:[r]);if(i)return i}}return null}function zt(e,t){Tf();let n=Array.isArray(e)?e:[e];for(let r of n){let i=vn.get(r);i||(i=new Set,vn.set(r,i)),i.add(t)}return()=>{for(let r of n)vn.get(r)?.delete(t)}}function _l(e,t){let n=Array.isArray(e)?e:[e];for(let r of n)vn.get(r)?.delete(t)}function bl(e){return Array.isArray(e)?e.slice():e==null?[]:[e]}function xl(e){try{if(!e||typeof e.navId!="string")return e;!Li&&e.children!=null&&(Li=$i(bl(e.children)));let t=vn.get(e.navId);if(!t||t.size===0)return e;let n={...e,children:bl(e.children)};for(let r of t)try{r(n.children)}catch(i){gl.error(`context-menu patch for "${e.navId}" threw`,i)}return n}catch(t){return gl.error("failed to apply context-menu patches",t),e}}var wl=N({id:"context-menu-api",name:"\u53F3\u952E\u83DC\u5355 API",description:"\u4E3A\u5176\u4ED6\u63D2\u4EF6\u63D0\u4F9B\u5411 Discord \u53F3\u952E\u83DC\u5355\u6CE8\u5165\u83DC\u5355\u9879\u7684\u80FD\u529B\u3002",authors:[{name:"Vencord"},{name:"caitemm"}],category:"misc",required:!0,hidden:!0,patches:[{label:"context-menu central handler",find:"Menu API only allows Items",replacement:{match:/(?=let\{navId:)(?<=function [A-Za-z_$][\w$]*\(([A-Za-z_$][\w$]*)\).+?)/,replace:"$1=$self._usePatchContextMenu($1);"}}],_usePatchContextMenu(e){return xl(e)}});var _n=g("patcher"),Tr=Symbol("halcyon.patch");function Af(e,t){let n=e[t];if(n&&n[Tr])return n[Tr];if(typeof n!="function")throw new TypeError(`cannot patch "${t}": not a function`);let r={before:new Set,instead:new Set,after:new Set,original:n},i=function(...a){let s={args:a,result:void 0,self:this,callOriginal:()=>r.original.apply(this,s.args)};for(let c of r.before)try{c(s)}catch(l){_n.error(`before-hook on "${t}" threw`,l)}if(r.instead.size){let c,l=!1;for(let d of r.instead)try{c=d(s),l=!0}catch(u){_n.error(`instead-hook on "${t}" threw; falling back to original`,u),c=s.callOriginal(),l=!0}s.result=l?c:s.callOriginal()}else try{s.result=r.original.apply(this,s.args)}catch(c){throw c}for(let c of r.after)try{c(s)}catch(l){_n.error(`after-hook on "${t}" threw`,l)}return s.result};return Object.defineProperty(i,"name",{value:n.name,configurable:!0}),Object.defineProperty(i,"length",{value:n.length,configurable:!0}),i.toString=()=>r.original.toString(),i[Tr]=r,Object.assign(i,n),e[t]=i,r}function Mf(e,t,n){n.before.size||n.instead.size||n.after.size||e[t]&&e[t][Tr]===n&&(e[t]=n.original)}function Di(e,t,n,r){if(t==null)return _n.error(`refusing to patch "${n}" on a null target`),()=>{};let i;try{i=Af(t,n)}catch(s){return _n.error(s),()=>{}}i[e].add(r);let a=!0;return()=>{a&&(a=!1,i[e].delete(r),Mf(t,n,i))}}var ue={before(e,t,n){return Di("before",e,t,n)},after(e,t,n){return Di("after",e,t,n)},instead(e,t,n){return Di("instead",e,t,n)}};var Tx=T(mt);function he(){for(let e of[V,ve,Ut])try{let t=e?._dispatcher;if(mt(t))return t}catch{}return P(mt)}var Bt=T(e=>e?.getName?.()==="MessageStore"||typeof e?.getMessage=="function"&&typeof e?.getMessages=="function"&&typeof e?.__halcyon_probe__>"u"),Ax=T(e=>typeof e?.sendMessage=="function"&&typeof e?.editMessage=="function"&&typeof e?.deleteMessage=="function"&&typeof e?.__halcyon_probe__>"u"),ee=T(e=>e?.getName?.()==="UserStore"||typeof e?.getCurrentUser=="function"&&typeof e?.getUser=="function"&&typeof e?.__halcyon_probe__>"u"),ve=T(e=>e?.getName?.()==="ChannelStore"||e?.constructor?.displayName==="ChannelStore"),le=T(e=>e?.getName?.()==="SelectedChannelStore"||typeof e?.getChannelId=="function"&&typeof e?.getLastSelectedChannelId=="function"&&typeof e?.__halcyon_probe__>"u"),V=T(e=>e?.getName?.()==="GuildStore"||e?.constructor?.displayName==="GuildStore"),yt=T(e=>e?.getName?.()==="GuildChannelStore"),Oi=T(e=>typeof e?.subscribeToGuild=="function"||typeof e?.subscribeToChannel=="function"),Mx=T(e=>typeof e=="function"&&typeof e?.locale=="function"&&typeof e?.utc=="function"),Ar=T(e=>typeof e?.transitionTo=="function"&&(typeof e?.replaceWith=="function"||typeof e?.transitionToGuild=="function"||typeof e?.back=="function")&&typeof e?.__halcyon_probe__>"u");function xn(e){try{let n=Ar;if(typeof n?.transitionTo=="function")return n.transitionTo(e),!0}catch{}let t;try{if(t=P(n=>typeof n?.transitionTo=="function"&&typeof n?.__halcyon_probe__>"u"),typeof t?.transitionTo=="function")return t.transitionTo(e),!0}catch{}try{let n=[Ar,t];try{n.push(P(r=>typeof r?.getHistory=="function"&&typeof r?.__halcyon_probe__>"u"))}catch{}for(let r of n)try{let i=r?.getHistory?.();if(i&&typeof i.push=="function")return i.push(e),!0}catch{}}catch{}return!1}var ji=T(e=>typeof e?.popLayer=="function"&&typeof e?.pushLayer=="function"&&typeof e?.__halcyon_probe__>"u"),Mr=T(e=>typeof e?.jumpToMessage=="function"&&typeof e?.__halcyon_probe__>"u"),Q=T(e=>typeof e=="object"&&typeof e?.del=="function"&&typeof e?.put=="function"&&typeof e?.__halcyon_probe__>"u"),Pr=T(e=>e?.getName?.()==="PermissionStore"&&typeof e?.can=="function"),wn=T(e=>e?.getName?.()==="EmojiStore"),Lr=T(e=>typeof e?.Endpoints?.GUILD_STICKER_PACKS=="function"),Sl=T(e=>e?.getName?.()==="StickersStore"),kl=uc("QuestStore","QuestsStore"),Ut=T(e=>e?.getName?.()==="ReadStateStore"),zi=T(e=>e?.getName?.()==="ActiveJoinedThreadsStore"),Pf=T(e=>typeof e?.showToast=="function"&&typeof e?.createToast=="function"&&typeof e?.__halcyon_probe__>"u");function te(e,t="info"){try{let n=Pf,r=n?.Type??{},i=t==="success"?r.SUCCESS??1:t==="failure"?r.FAILURE??2:r.MESSAGE??r.INFO??0;typeof n?.showToast=="function"&&typeof n?.createToast=="function"&&n.showToast(n.createToast(e,i))}catch{}}var El=g("settings");function Bi(e){return e===null||typeof e!="object"?e:JSON.parse(JSON.stringify(e))}function D(e){let t=new Map,n=null,r={};for(let c of Object.keys(e))r[c]=Bi(e[c].default);let i=()=>{n&&$t(n,r)},a=(c,l,d)=>{let u=t.get(c);if(u)for(let h of u)try{h(l,d)}catch(f){El.error(`settings listener for "${c}" threw`,f)}},s=new Proxy(r,{get:(c,l)=>c[l],set:(c,l,d)=>{if(!(l in e))return El.warn(`ignoring write to unknown setting "${l}"`),!0;let u=c[l];return Object.is(u,d)||(c[l]=d,i(),a(l,d,u)),!0}});return{schema:e,store:s,subscribe(c,l){let d=c,u=t.get(d);return u||(u=new Set,t.set(d,u)),u.add(l),()=>void u.delete(l)},reset(c){if(c!=null){s[c]=Bi(e[c].default);return}for(let l of Object.keys(e))s[l]=Bi(e[l].default)},__bind(c){n=c;let l=Ke(c);for(let d of Object.keys(e))Object.prototype.hasOwnProperty.call(l,d)&&(r[d]=l[d])}}}var H=D({keepDeletedInChat:{group:"\u8BB0\u5F55",type:"boolean",default:!0,label:"\u5728\u804A\u5929\u4E2D\u4FDD\u7559\u88AB\u5220\u6D88\u606F",description:"\u88AB\u5220\u9664\u7684\u6D88\u606F\u4E0D\u518D\u6D88\u5931\uFF0C\u800C\u662F\u6807\u8BB0\u4FDD\u7559\u5728\u539F\u4F4D\u3002\u9700\u8981\u5BA2\u6237\u7AEF\u8865\u4E01\u751F\u6548\u3002"},toolbarButton:{group:"\u8BB0\u5F55",type:"boolean",default:!0,label:"\u9891\u9053\u9876\u680F\u52A0\u300C\u6D88\u606F\u8BB0\u5F55\u300D\u6309\u94AE",description:"\u5728\u9891\u9053\u53F3\u4E0A\u89D2\u5DE5\u5177\u6761\u653E\u4E00\u4E2A\u56FE\u6807\uFF0C\u70B9\u4E00\u4E0B\u76F4\u63A5\u6253\u5F00\u6D88\u606F\u8BB0\u5F55\u9875\uFF0C\u4E0D\u7528\u7FFB\u8BBE\u7F6E\u3002"},logEdits:{group:"\u8BB0\u5F55",type:"boolean",default:!0,label:"\u8BB0\u5F55\u7F16\u8F91\u5386\u53F2",description:"\u4FDD\u5B58\u6BCF\u6761\u6D88\u606F\u88AB\u7F16\u8F91\u524D\u7684\u5185\u5BB9\u3002"},retention:{group:"\u8BB0\u5F55",type:"number",default:50,label:"\u6BCF\u9891\u9053\u4FDD\u7559\u6761\u6570",description:"0 \u8868\u793A\u4E0D\u9650\u5236\u3002\u4E0A\u9650 500\u3002",min:0,max:500,step:10},deleteStyle:{group:"\u5916\u89C2",type:"select",default:"tint",label:"\u5220\u9664 / \u7F16\u8F91\u6837\u5F0F",description:"\u88AB\u5220\u6D88\u606F\u3001\u4EE5\u53CA\u7F16\u8F91\u6D88\u606F\u4E0A\u65B9\u65E7\u7248\u672C\u5185\u5BB9\u5728\u804A\u5929\u4E2D\u7684\u5448\u73B0\u65B9\u5F0F\u3002",options:[{value:"tint",label:"\u7EA2\u8272\u5E95\u7EB9 + \u5DE6\u4FA7\u7EA2\u6761"},{value:"text",label:"\u6B63\u6587\u53D8\u7EA2"},{value:"ghost",label:"\u534A\u900F\u660E\u6DE1\u51FA"},{value:"strike",label:"\u7EA2\u8272\u5220\u9664\u7EBF"}]},showDeletedMarker:{group:"\u5916\u89C2",type:"boolean",default:!0,label:"\u663E\u793A\u5220\u9664\u6807\u8BB0\u884C",description:"\u5728\u88AB\u5220\u6D88\u606F\u4E0B\u65B9\u663E\u793A\u201C\u6B64\u6D88\u606F\u5DF2\u5220\u9664\u201D\u4E0E\u5220\u9664\u65F6\u95F4\u3002"},showEditedMarker:{group:"\u5916\u89C2",type:"boolean",default:!0,label:"\u663E\u793A\u7F16\u8F91\u6807\u8BB0\u884C",description:"\u5728\u7F16\u8F91\u8FC7\u7684\u6D88\u606F\u65C1\u663E\u793A\u201C\u6B64\u6D88\u606F\u5DF2\u7F16\u8F91\u201D\u4E0E\u7F16\u8F91\u65F6\u95F4\uFF08\u6CBF\u7528\u4E0B\u65B9\u6807\u8BB0\u7684\u56FE\u6807 / \u5916\u89C2 / \u65F6\u95F4\u8BBE\u7F6E\uFF09\u3002"},markerIcon:{group:"\u5916\u89C2",type:"select",default:"trash",label:"\u6807\u8BB0\u56FE\u6807",description:"\u6807\u8BB0\u884C\u524D\u7684\u56FE\u6807\uFF08\u5220\u9664 / \u7F16\u8F91\u901A\u7528\uFF09\u3002",options:[{value:"trash",label:"\u{1F5D1} \u5783\u573E\u6876"},{value:"shield",label:"\u{1F6E1} \u76FE\u724C"},{value:"warning",label:"\u26A0 \u8B66\u544A\u4E09\u89D2"},{value:"none",label:"\u65E0\u56FE\u6807"}]},markerLook:{group:"\u5916\u89C2",type:"select",default:"plain",label:"\u6807\u8BB0\u5916\u89C2",description:"\u6807\u8BB0\u884C\u7684\u5448\u73B0\u65B9\u5F0F\uFF08\u5220\u9664 / \u7F16\u8F91\u901A\u7528\uFF09\u3002",options:[{value:"plain",label:"\u7EAF\u6587\u5B57"},{value:"badge",label:"\u5706\u89D2\u5FBD\u7AE0"},{value:"quote",label:"\u5F15\u7528\u5757\uFF08\u5DE6\u4FA7\u7AD6\u6761\uFF09"}]},markerTime:{group:"\u5916\u89C2",type:"select",default:"time",label:"\u6807\u8BB0\u65F6\u95F4\u683C\u5F0F",description:"\u6807\u8BB0\u884C\u91CC\u65F6\u95F4\u7684\u663E\u793A\u65B9\u5F0F\u3002",options:[{value:"time",label:"\u4EC5\u65F6\u95F4\uFF0803:19:42\uFF09"},{value:"datetime",label:"\u65E5\u671F + \u65F6\u95F4"},{value:"none",label:"\u4E0D\u663E\u793A\u65F6\u95F4"}]},ignoreBots:{group:"\u5C4F\u853D\u5BF9\u8C61",type:"boolean",default:!1,label:"\u5C4F\u853D\u673A\u5668\u4EBA",description:"\u673A\u5668\u4EBA\u7684\u6D88\u606F\u4E0D\u8BB0\u5F55\u3001\u4E0D\u5728\u804A\u5929\u4E2D\u4FDD\u7559\u3002"},ignoreSelf:{group:"\u5C4F\u853D\u5BF9\u8C61",type:"boolean",default:!1,label:"\u5C4F\u853D\u81EA\u5DF1",description:"\u4F60\u81EA\u5DF1\u5220\u9664\u6216\u7F16\u8F91\u7684\u6D88\u606F\u4E0D\u8BB0\u5F55\u3001\u4E0D\u5728\u804A\u5929\u4E2D\u4FDD\u7559\u3002"},ignoredUsers:{group:"\u5C4F\u853D\u5BF9\u8C61",type:"string-list",default:[],label:"\u5C4F\u853D\u7684\u7528\u6237",description:"\u8FD9\u4E9B\u7528\u6237\u7684\u6D88\u606F\u4E0D\u8BB0\u5F55\u3001\u4E0D\u5728\u804A\u5929\u4E2D\u4FDD\u7559\u3002",itemPlaceholder:"\u7528\u6237 ID"},ignoredChannels:{group:"\u5C4F\u853D\u5BF9\u8C61",type:"string-list",default:[],label:"\u5C4F\u853D\u7684\u9891\u9053",description:"\u8FD9\u4E9B\u9891\u9053\u91CC\u7684\u6D88\u606F\u4E0D\u8BB0\u5F55\u3001\u4E0D\u5728\u804A\u5929\u4E2D\u4FDD\u7559\u3002",itemPlaceholder:"\u9891\u9053 ID"}});var Ui=g("message-logger"),Gi="message-logger.log";function $e(e){return(e??[]).map(t=>t?.id??t?.filename??t?.url??t?.proxy_url??"").join("|")}var Lf=500,$f=3e3,$r=1e6,Hi=class{deleted=[];edited=[];retention=0;listeners=new Set;saveTimer;deletedIndex=new Set;channelCounts=new Map;deferredSince;userCleared=!1;lastPruneNote="";load(){let t=Ke(Gi);this.deleted=Array.isArray(t.deleted)?t.deleted:[],this.edited=Array.isArray(t.edited)?t.edited:[],this.userCleared=!1,this.reindex()}isDeleted(t,n){return this.deletedIndex.has(`${t}:${n}`)}findDeleted(t,n){if(this.isDeleted(t,n))return this.deleted.find(r=>r.channelId===t&&r.id===n)}setRetention(t){let n=Math.max(0,t|0);n!==this.retention&&(this.retention=n,this.trimDeleted()&&this.reindex(),this.scheduleSave(),this.emit())}recordDeleted(t){this.deletedIndex.has(`${t.channelId}:${t.id}`)||(this.deleted.unshift(t),this.deletedIndex.add(`${t.channelId}:${t.id}`),this.channelCounts.set(t.channelId,(this.channelCounts.get(t.channelId)??0)+1),this.retention>0&&(this.channelCounts.get(t.channelId)??0)>this.retention&&this.trimDeleted()&&this.reindex(),this.scheduleSave(),this.emit())}recordEdit(t,n,r,i,a,s){let c=Date.now(),l=this.edited.find(u=>u.id===t),d={content:i,at:c,...s&&s.length?{attachments:s}:{}};if(!l)l={id:t,channelId:n,guildId:a,author:r,history:[d],updatedAt:c},this.edited.unshift(l);else{let u=l.history[l.history.length-1];if(u?.content===i&&$e(u.attachments)===$e(d.attachments))return;l.history.push(d),l.updatedAt=c}this.edited.length>300&&(this.edited.length=300),this.scheduleSave(),this.emit()}getDeleted(){return this.deleted}getEdited(){return this.edited}counts(){return{deleted:this.deleted.length,edited:this.edited.length}}clear(t="all"){t!=="edited"&&(this.deleted=[]),t!=="deleted"&&(this.edited=[]),this.userCleared=this.deleted.length===0&&this.edited.length===0,this.reindex(),this.scheduleSave(),this.emit()}toJSON(){return JSON.stringify({deleted:this.deleted,edited:this.edited},null,2)}subscribe(t){return this.listeners.add(t),()=>void this.listeners.delete(t)}flush(){this.saveTimer!==void 0&&(clearTimeout(this.saveTimer),this.saveTimer=void 0),this.save()}trimDeleted(){if(this.retention<=0)return!1;let t=new Map;for(let r of this.deleted){let i=t.get(r.channelId);i||t.set(r.channelId,i=[]),i.push(r)}let n=new Set;for(let r of t.values()){if(r.length<=this.retention)continue;let i=r.slice().sort((a,s)=>s.deletedAt-a.deletedAt||(a.id<s.id?1:a.id>s.id?-1:0));for(let a of i.slice(this.retention))n.add(a)}return n.size===0?!1:(this.deleted=this.deleted.filter(r=>!n.has(r)),this.recount(),!0)}recount(){this.channelCounts.clear();for(let t of this.deleted)this.channelCounts.set(t.channelId,(this.channelCounts.get(t.channelId)??0)+1)}reindex(){this.deletedIndex=new Set(this.deleted.map(t=>`${t.channelId}:${t.id}`)),this.recount()}emit(){for(let t of this.listeners)try{t()}catch{}}scheduleSave(){if(this.deferredSince===void 0&&(this.deferredSince=Date.now()),Date.now()-this.deferredSince>=$f){this.flush();return}this.saveTimer!==void 0&&clearTimeout(this.saveTimer),this.saveTimer=setTimeout(()=>this.save(),Lf)}save(){this.saveTimer=void 0,this.deferredSince=void 0;try{if(this.deleted.length===0&&this.edited.length===0&&!this.userCleared){let n=Ke(Gi);if(Array.isArray(n.deleted)&&n.deleted.length>0||Array.isArray(n.edited)&&n.edited.length>0){Ui.warn("\u8DF3\u8FC7\u4E00\u6B21\u4FDD\u5B58\uFF1A\u5185\u5B58\u4E2D\u7684\u8BB0\u5F55\u4E3A\u7A7A\uFF0C\u4F46\u78C1\u76D8\u4E0A\u6709\u8BB0\u5F55\uFF0C\u62D2\u7EDD\u8986\u76D6\uFF08\u5B58\u50A8\u5C1A\u672A\u5C31\u7EEA\uFF1F\uFF09");return}}let t=this.withinBudget();$t(Gi,{deleted:t.deleted,edited:t.edited})}catch(t){Ui.error("failed to persist message log",t)}}withinBudget(){let t=this.edited,n=JSON.stringify({deleted:[],edited:t}).length,r=this.deleted.map(d=>JSON.stringify(d).length+1),i=n+r.reduce((d,u)=>d+u,0);if(i<=$r)return this.lastPruneNote="",{deleted:this.deleted,edited:t};let a=this.deleted.slice(),s=0;for(let d=a.length-1;d>=0&&i>$r;d--){let u=a[d];if(!u.embeds?.length)continue;let h={...u,embeds:void 0},f=JSON.stringify(h).length+1;i-=r[d]-f,r[d]=f,a[d]=h,s++}let c=0;for(;a.length>1&&i>$r;)i-=r[r.length-1],r.pop(),a.pop(),c++;let l=`${s}/${c}`;return l!==this.lastPruneNote&&(this.lastPruneNote=l,Ui.warn(`\u6D88\u606F\u8BB0\u5F55\u8D85\u51FA\u5B58\u50A8\u9884\u7B97\uFF08${Math.round($r/1024)}KB\uFF09\uFF0C\u5DF2\u88C1\u526A\u540E\u4FDD\u5B58\uFF1A\u4E22\u5F03 ${s} \u6761\u65E7\u8BB0\u5F55\u7684 embed\uFF0C\u5220\u9664 ${c} \u6761\u6700\u65E7\u8BB0\u5F55\u3002\u5185\u5B58\u4E2D\u4ECD\u4FDD\u7559 ${this.deleted.length} \u6761\uFF1B\u5982\u9700\u957F\u671F\u4FDD\u7559\u8BF7\u8C03\u4F4E\u300C\u6BCF\u9891\u9053\u4FDD\u7559\u6761\u6570\u300D\u6216\u5B9A\u671F\u5BFC\u51FA\u3002`)),{deleted:a,edited:t}}},O=new Hi;var Il=[16,20,22,24,28,32,40,44,48,56,60,64,80,96,100,128,160,240,256,300,320,480,512,600,640,1024,2048,4096];function Fi(e,t){let n=Number(e);if(!Number.isFinite(n)||n<=0)return t;let r=Il[0];for(let i of Il)Math.abs(i-n)<Math.abs(r-n)&&(r=i);return r}function De(e,t,n){let i=`size=${Fi(n,48)}${t?"&animated=true":""}`;return`https://cdn.discordapp.com/emojis/${e}.webp?${i}`}var qi={PNG:1,APNG:2,LOTTIE:3,GIF:4};function Nl(e,t,n){let r=Fi(n,160),i=t===qi.GIF?"gif":"png";return`https://media.discordapp.net/stickers/${e}.${i}?size=${r}`}function Df(e){let t=0;try{t=Number((BigInt(e)>>22n)%6n)}catch{t=0}return`https://cdn.discordapp.com/embed/avatars/${t}.png`}function Dr(e,t,n){if(typeof t!="string"||t.length===0)return Df(e);let r=Fi(n,32),i=t.startsWith("a_")?"gif":"webp";return`https://cdn.discordapp.com/avatars/${e}/${t}.${i}?size=${r}`}var Ki={query:"",mode:"contains",author:"",location:"",from:"",to:"",sort:"newest"};function Tl(e){return!!(e.query.trim()||e.author.trim()||e.location.trim()||e.from||e.to)}function Cl(e){return e.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")}var Of={test:()=>!0,highlight:null};function Al(e,t){let n=e.trim();if(!n)return Of;if(t==="regex")try{let i=new RegExp(n,"i");return{test:a=>i.test(a),highlight:new RegExp(n,"gi")}}catch(i){return{test:()=>!1,highlight:null,error:i?.message??"\u65E0\u6548\u7684\u6B63\u5219"}}if(t==="phrase"){let i=n.toLowerCase();return{test:a=>a.toLowerCase().includes(i),highlight:new RegExp(Cl(n),"gi")}}let r=n.split(/\s+/).filter(Boolean).map(i=>i.toLowerCase());return{test:i=>{let a=i.toLowerCase();return r.every(s=>a.includes(s))},highlight:new RegExp(r.map(Cl).join("|"),"gi")}}function jf(e,t,n){let r=[e.author?.name??""];if(t&&r.push(t),n&&r.push(n),"content"in e&&typeof e.content=="string"&&r.push(e.content),"history"in e&&Array.isArray(e.history))for(let i of e.history){i?.content&&r.push(i.content);for(let a of i?.attachments??[])a?.filename&&r.push(a.filename)}if("stickers"in e&&Array.isArray(e.stickers))for(let i of e.stickers)i?.name&&r.push(i.name);return"attachments"in e&&Array.isArray(e.attachments)&&r.push(...e.attachments),r.join(`
`)}function Sn(e){let t=("deletedAt"in e?e.deletedAt:void 0)??("updatedAt"in e?e.updatedAt:void 0)??("sentAt"in e?e.sentAt:void 0);return typeof t=="number"&&Number.isFinite(t)?t:0}function Ml(e){let t=/^(\d{4})-(\d{2})-(\d{2})$/.exec(e.trim());if(!t)return null;let n=new Date(Number(t[1]),Number(t[2])-1,Number(t[3]),0,0,0,0);return Number.isNaN(n.getTime())?null:n.getTime()}function zf(e){let t=Ml(e);return t===null?null:t+24*60*60*1e3-1}function Pl(e,t,n,r){let i=t.author.trim().toLowerCase();if(i&&!(e.author?.name??"").toLowerCase().includes(i))return!1;let a=t.location.trim().toLowerCase();if(a&&!`${r.guild??""}
${r.channel??""}`.toLowerCase().includes(a))return!1;let s=Sn(e),c=t.from?Ml(t.from):null;if(c!==null&&s<c)return!1;let l=t.to?zf(t.to):null;return l!==null&&s>l?!1:t.query.trim()?n.test(jf(e,r.guild,r.channel)):!0}function Ll(e,t){let n=e.slice();return n.sort((r,i)=>t==="newest"?Sn(i)-Sn(r):Sn(r)-Sn(i)),n}function $l(e,t){if(!t||!e)return[{text:e,hit:!1}];let n=new RegExp(t.source,t.flags.includes("g")?t.flags:`${t.flags}g`),r=[],i=0;for(let a=n.exec(e);a;a=n.exec(e)){if(a[0].length===0){n.lastIndex++;continue}a.index>i&&r.push({text:e.slice(i,a.index),hit:!1}),r.push({text:a[0],hit:!0}),i=a.index+a[0].length}return i<e.length&&r.push({text:e.slice(i),hit:!1}),r.length?r:[{text:e,hit:!1}]}var Vi=/<(a)?:([A-Za-z0-9_]+):(\d+)>/g;function Dl(e,t,n){return t?$l(e,t).map((r,i)=>r.hit?o.createElement("mark",{key:`${n}-${i}`,className:"hc-hit"},r.text):o.createElement("span",{key:`${n}-${i}`},r.text)):[o.createElement("span",{key:n},e)]}function bt(e,t){let n=[],r=0,i=0;Vi.lastIndex=0;for(let a=Vi.exec(e);a;a=Vi.exec(e)){a.index>r&&n.push(...Dl(e.slice(r,a.index),t,i++));let[,s,c,l]=a;n.push(o.createElement("img",{key:i++,className:"hc-emoji",src:De(l,!!s,48),alt:`:${c}:`,title:`:${c}:`,draggable:!1,loading:"lazy"})),r=a.index+a[0].length}return n.length===0&&!t?e:(r<e.length&&n.push(...Dl(e.slice(r),t,i++)),n)}function Ol(e,t,n,r,i){let a=Math.max(1,e.width*i),s=Math.max(1,e.height*i),c=Math.min(Math.max(t-e.left,0),e.width),l=Math.min(Math.max(n-e.top,0),e.height),d=r/2,u=d-c*i,h=d-l*i;return u=a<=r?(r-a)/2:Math.min(0,Math.max(r-a,u)),h=s<=r?(r-s)/2:Math.min(0,Math.max(r-s,h)),{bgWidth:a,bgHeight:s,bgX:u,bgY:h}}function jl(e,t,n,r){let i=e+(t<0?.5:-.5);return Math.round(Math.min(r,Math.max(n,i))*10)/10}function zl(e,t){let n=e+(t<0?40:-40);return Math.min(800,Math.max(120,Math.round(n)))}var Bf=/(^|\.)(discordapp\.com|discordapp\.net|discord\.com)$/i;function Uf(e){try{return new URL(e)}catch{}try{let t=typeof location<"u"?location.href:"https://discord.com/";return new URL(e,t)}catch{return null}}function Or(e){let t=Uf(e);if(!t||!Bf.test(t.hostname))return e;for(let n of["width","height","size","quality","format"])t.searchParams.delete(n);return t.toString()}function Bl(e,t){if(!(e instanceof HTMLImageElement)||!e.currentSrc&&!e.src)return!1;let n=e.getBoundingClientRect();return!(n.width<t||n.height<t||e.closest(".halcyon")!==null)}var Ul="hc-media-overlay";function Gf(){let e=document.getElementById(Ul);e&&e.remove()}function Gt(e){if(!e)return;let t=e;try{t=Or(e)}catch{}try{Gf();let n=document.createElement("div");n.id=Ul,n.className="hc-media-overlay",n.setAttribute("role","dialog"),n.setAttribute("aria-modal","true");let r=document.createElement("img");r.className="hc-media-overlay__img",r.src=t,r.alt="",r.draggable=!1,r.addEventListener("click",c=>c.stopPropagation());let i=document.createElement("div");i.className="hc-media-overlay__hint",i.textContent="\u70B9\u51FB\u7A7A\u767D\u5904\u6216\u6309 Esc \u5173\u95ED";let a=c=>{c.key==="Escape"&&(c.stopPropagation(),s())},s=()=>{document.removeEventListener("keydown",a,!0),n.remove()};n.addEventListener("click",s),document.addEventListener("keydown",a,!0),n.appendChild(r),n.appendChild(i),document.body.appendChild(n)}catch{}}var Hf=g("message-logger"),Ff=60*60*1e3,qf=["/attachments/","/ephemeral-attachments/"];function Kf(){let e=new Set(["cdn.discordapp.com","media.discordapp.net"]);try{let t=globalThis.GLOBAL_ENV;t?.CDN_HOST&&e.add(String(t.CDN_HOST).replace(/^\/\//,"")),t?.MEDIA_PROXY_ENDPOINT&&e.add(String(t.MEDIA_PROXY_ENDPOINT).replace(/^\/\//,""))}catch{}return e}function jr(e,t=Date.now()){if(!e)return!1;let n;try{n=new URL(e)}catch{return!1}if(!Kf().has(n.hostname)||!qf.some(i=>n.pathname.startsWith(i)))return!1;let r=parseInt(n.searchParams.get("ex")??"",16);return Number.isNaN(r)?!0:r*1e3<=t+Ff}function Vf(e){try{let t=new URL(e);for(let n of["ex","is","hm"])t.searchParams.delete(n);return t.toString()}catch{return e}}var Gl=25,Yi=new Map,Wi=new Set;function Ji(e){let t=Yi.get(e);if(t&&!jr(t))return t;t&&Yi.delete(t)}async function Hl(e){let t=new Map,n=Array.from(new Set(e.filter(r=>r&&jr(r)&&!Wi.has(r))));if(n.length===0)return t;for(let r of n)Wi.add(r);try{for(let r=0;r<n.length;r+=Gl){let i=n.slice(r,r+Gl);try{let s=(await Q.post({url:"/attachments/refresh-urls",body:{attachment_urls:i.map(Vf)}}))?.body?.refreshed_urls;if(!Array.isArray(s))continue;s.forEach((c,l)=>{let d=typeof c?.refreshed=="string"?c.refreshed:void 0;if(!d)return;let u=i[l];u&&(Yi.set(u,d),t.set(u,d))})}catch(a){Hf.debug("\u5237\u65B0\u9644\u4EF6\u7B7E\u540D\u5931\u8D25\uFF08\u8BE5\u9644\u4EF6\u53EF\u80FD\u5DF2\u88AB\u5F7B\u5E95\u6E05\u9664\uFF09",a)}}}finally{for(let r of n)Wi.delete(r)}return t}var Ht=g("message-logger");function Wf(){let[e,t]=y(()=>({deleted:O.getDeleted(),edited:O.getEdited()}));return C(()=>{let n=()=>t({deleted:O.getDeleted(),edited:O.getEdited()});return n(),O.subscribe(n)},[]),e}var Ri=25;function Yf(){let[e,t]=y(()=>Y().filter(s=>s.pluginId==="message-logger"));if(C(()=>{let s=()=>t(Y().filter(l=>l.pluginId==="message-logger"));s();let c=setInterval(s,3e3);return()=>clearInterval(c)},[]),e.length===0)return null;let n=e.filter(s=>!s.applied);if(n.length===0)return null;let r=n.find(s=>s.label==="keep deleted message in store");return o.createElement("div",{className:"hc-mlog-warn"},o.createElement("div",{className:"hc-mlog-warn__title"},r?"\u804A\u5929\u4E2D\u7684\u7EA2\u8272\u5360\u4F4D\u672A\u751F\u6548":"\u90E8\u5206\u804A\u5929\u5185\u8865\u4E01\u672A\u5339\u914D\u5F53\u524D Discord \u7248\u672C"),o.createElement("div",{className:"hc-mlog-warn__detail"},r?"\u88AB\u5220\u9664\u7684\u6D88\u606F\u4ECD\u7136\u8BB0\u5F55\u5728\u4E0B\u65B9\u5217\u8868\uFF0C\u4F46\u5728\u804A\u5929\u91CC\u4F1A\u76F4\u63A5\u6D88\u5931\u3002\u6838\u5FC3\u8865\u4E01 keep-deleted \u672A\u5339\u914D\u5F53\u524D Discord \u7248\u672C\u3002":"\u8BB0\u5F55\u529F\u80FD\u6B63\u5E38\uFF0C\u4F46\u804A\u5929\u4E2D\u7684\u7F16\u8F91\u5386\u53F2 / \u5220\u9664\u6807\u8BB0\u53EF\u80FD\u65E0\u6CD5\u663E\u793A\u3002"),o.createElement("ul",{className:"hc-mlog-warn__list"},n.map(s=>o.createElement("li",{key:s.label},"\u201C",s.label,"\u201D"))),o.createElement("div",{className:"hc-mlog-warn__detail"},"\u8BF7\u628A\u6B64\u5904\u4EE5\u53CA\u65E5\u5FD7\u9875\u91CC \u201CHalcyon modules\u201D \u76F8\u5173\u7684\u8F93\u51FA\u53D1\u7ED9\u5F00\u53D1\u8005\u5B9A\u4F4D\u3002"))}function Jf(e){let[,t]=y(0),n=e.map(r=>`${r.channelId}-${r.id}`).join(",");return C(()=>{let r=[];for(let s of e){let c="attachmentsRich"in s?s.attachmentsRich:void 0;if(c)for(let l of c)l.proxy_url&&r.push(l.proxy_url),l.url&&r.push(l.url);if("attachments"in s&&Array.isArray(s.attachments)&&r.push(...s.attachments),"history"in s&&Array.isArray(s.history))for(let l of s.history)for(let d of l.attachments??[])d.proxy_url&&r.push(d.proxy_url),d.url&&r.push(d.url)}let i=r.filter(s=>jr(s)&&!Ji(s));if(i.length===0)return;let a=!0;return Hl(i).then(s=>{a&&s.size>0&&t(c=>c+1)}).catch(()=>{}),()=>{a=!1}},[n]),r=>r?Ji(r)??r:void 0}function Fl(){let{deleted:e,edited:t}=Wf(),[n,r]=y("deleted"),[i,a]=y({deleted:0,edited:0}),[s,c]=y(Ki),[l,d]=y(!1),u=Al(s.query,s.mode),h=Tl(s),f=I=>{let fe=h?I.filter(ie=>Pl(ie,s,u,Kl(ie.channelId,ie.guildId))):I.slice();return Ll(fe,s.sort)},v=f(e),x=f(t),L=n==="deleted"?e:t,m=n==="deleted"?v:x,b=Math.max(1,Math.ceil(m.length/Ri)),E=Math.min(i[n],b-1),z=m.slice(E*Ri,(E+1)*Ri),we=I=>a(fe=>({...fe,[n]:Math.max(0,Math.min(b-1,I))})),U=Jf(z),q=I=>{c(fe=>({...fe,...I})),a({deleted:0,edited:0})},ht=I=>q({query:I});return o.createElement("div",null,o.createElement(Yf,null),o.createElement("div",{className:"hc-tabs"},o.createElement("button",{type:"button",className:"hc-tab","data-active":n==="deleted",onClick:()=>r("deleted")},o.createElement(ce,{size:16})," \u5DF2\u5220\u9664",e.length>0&&o.createElement(Re,{tone:"red"},h?`${v.length}/${e.length}`:e.length)),o.createElement("button",{type:"button",className:"hc-tab","data-active":n==="edited",onClick:()=>r("edited")},o.createElement(wi,{size:16})," \u5DF2\u7F16\u8F91",t.length>0&&o.createElement(Re,{tone:"orange"},h?`${x.length}/${t.length}`:t.length)),o.createElement("div",{className:"hc-tabs__spacer"}),o.createElement(k,{size:"sm",variant:"plain",icon:o.createElement(Pc,{size:16}),onClick:tm},"\u5BFC\u51FA"),o.createElement(k,{size:"sm",variant:"destructive",onClick:()=>O.clear(n),disabled:L.length===0,title:n==="deleted"?"\u6E05\u7A7A\u300C\u5DF2\u5220\u9664\u300D\u8BB0\u5F55":"\u6E05\u7A7A\u300C\u5DF2\u7F16\u8F91\u300D\u8BB0\u5F55"},"\u6E05\u7A7A",n==="deleted"?"\u5DF2\u5220\u9664":"\u5DF2\u7F16\u8F91")),o.createElement("div",{className:"hc-mlog-search"},o.createElement(Pe,{size:18}),o.createElement("input",{value:s.query,onChange:I=>ht(I.currentTarget.value),placeholder:s.mode==="regex"?"\u6B63\u5219\uFF0C\u4F8B\u5982 ^\u5582|\u518D\u89C1$":s.mode==="phrase"?"\u7CBE\u786E\u77ED\u8BED\uFF0C\u7A7A\u683C\u4E5F\u7B97":"\u641C\u7D22\u4F5C\u8005\u3001\u5185\u5BB9\u3001\u670D\u52A1\u5668 / \u9891\u9053\uFF08\u7A7A\u683C\u5206\u9694\uFF1D\u90FD\u8981\u6709\uFF09","aria-label":"\u641C\u7D22\u6D88\u606F\u8BB0\u5F55"}),s.query&&o.createElement("button",{type:"button",className:"hc-mlog-search__clear","aria-label":"\u6E05\u9664\u641C\u7D22",onClick:()=>ht("")},"\xD7"),o.createElement("button",{type:"button",className:"hc-mlog-search__filters","data-active":l||h,"aria-label":"\u7B5B\u9009",title:"\u6309\u4F5C\u8005 / \u4F4D\u7F6E / \u65F6\u95F4\u7B5B\u9009",onClick:()=>d(I=>!I)},o.createElement(We,{size:18}))),u.error&&o.createElement("div",{className:"hc-mlog-filters__error"},"\u6B63\u5219\u8FD8\u6CA1\u5199\u5B8C\uFF1A",u.error),l&&o.createElement("div",{className:"hc-mlog-filters"},o.createElement("label",{className:"hc-mlog-filters__field"},o.createElement("span",null,"\u5339\u914D\u65B9\u5F0F"),o.createElement("select",{value:s.mode,onChange:I=>q({mode:I.currentTarget.value})},o.createElement("option",{value:"contains"},"\u5305\u542B\u5168\u90E8\u8BCD"),o.createElement("option",{value:"phrase"},"\u7CBE\u786E\u77ED\u8BED"),o.createElement("option",{value:"regex"},"\u6B63\u5219"))),o.createElement("label",{className:"hc-mlog-filters__field"},o.createElement("span",null,"\u4F5C\u8005"),o.createElement("input",{value:s.author,onChange:I=>q({author:I.currentTarget.value}),placeholder:"\u540D\u5B57\u7684\u4E00\u90E8\u5206"})),o.createElement("label",{className:"hc-mlog-filters__field"},o.createElement("span",null,"\u670D\u52A1\u5668 / \u9891\u9053"),o.createElement("input",{value:s.location,onChange:I=>q({location:I.currentTarget.value}),placeholder:"\u540D\u5B57\u7684\u4E00\u90E8\u5206"})),o.createElement("label",{className:"hc-mlog-filters__field"},o.createElement("span",null,"\u8D77\u59CB\u65E5\u671F"),o.createElement("input",{type:"date",value:s.from,onChange:I=>q({from:I.currentTarget.value})})),o.createElement("label",{className:"hc-mlog-filters__field"},o.createElement("span",null,"\u7ED3\u675F\u65E5\u671F"),o.createElement("input",{type:"date",value:s.to,onChange:I=>q({to:I.currentTarget.value})})),o.createElement("label",{className:"hc-mlog-filters__field"},o.createElement("span",null,"\u6392\u5E8F"),o.createElement("select",{value:s.sort,onChange:I=>q({sort:I.currentTarget.value})},o.createElement("option",{value:"newest"},"\u6700\u65B0\u5728\u524D"),o.createElement("option",{value:"oldest"},"\u6700\u65E9\u5728\u524D"))),o.createElement("div",{className:"hc-mlog-filters__actions"},o.createElement(k,{size:"sm",variant:"plain",onClick:()=>q(Ki),disabled:!h},"\u91CD\u7F6E\u7B5B\u9009"))),L.length===0?n==="deleted"?o.createElement(de,{icon:o.createElement(ce,{size:48}),title:"\u8FD8\u6CA1\u6709\u8BB0\u5F55",subtitle:"\u88AB\u5220\u9664\u7684\u6D88\u606F\u4F1A\u5728\u8FD9\u91CC\u4FDD\u7559\uFF0C\u542F\u7528\u63D2\u4EF6\u540E\u5373\u65F6\u751F\u6548\u3002"}):o.createElement(de,{icon:o.createElement(wi,{size:48}),title:"\u8FD8\u6CA1\u6709\u7F16\u8F91\u8BB0\u5F55",subtitle:"\u6D88\u606F\u88AB\u7F16\u8F91\u524D\u7684\u5185\u5BB9\u4F1A\u4FDD\u7559\u5728\u8FD9\u91CC\u3002"}):m.length===0?o.createElement(de,{icon:o.createElement(Pe,{size:48}),title:"\u6CA1\u6709\u5339\u914D\u7684\u8BB0\u5F55",subtitle:(n==="deleted"?x.length:v.length)>0?`\u8FD9\u4E00\u680F\u6CA1\u6709\uFF0C\u4F46\u300C${n==="deleted"?"\u5DF2\u7F16\u8F91":"\u5DF2\u5220\u9664"}\u300D\u91CC\u6709 ${n==="deleted"?x.length:v.length} \u6761\u5339\u914D\u3002`:"\u6362\u4E2A\u5173\u952E\u8BCD\uFF0C\u6216\u8005\u653E\u5BBD\u7B5B\u9009\u6761\u4EF6\u8BD5\u8BD5\u3002"}):o.createElement(o.Fragment,null,o.createElement("div",{className:"hc-msglist"},n==="deleted"?z.map(I=>o.createElement(Zf,{key:`${I.channelId}-${I.id}`,entry:I,highlight:u.highlight,freshUrl:U})):z.map(I=>o.createElement(em,{key:`${I.channelId}-${I.id}`,entry:I,highlight:u.highlight,freshUrl:U}))),b>1&&o.createElement(Rf,{page:E,pageCount:b,onChange:we})))}function Rf(e){let{page:t,pageCount:n,onChange:r}=e;return o.createElement("div",{className:"hc-pager"},o.createElement(k,{size:"sm",variant:"plain",onClick:()=>r(t-1),disabled:t===0},"\u4E0A\u4E00\u9875"),o.createElement("span",{className:"hc-pager__label"},"\u7B2C ",t+1," / ",n," \u9875"),o.createElement(k,{size:"sm",variant:"plain",onClick:()=>r(t+1),disabled:t>=n-1},"\u4E0B\u4E00\u9875"))}function Xf(e,t,n){Qf();let r=n;if(!r)try{let u=ve.getChannel?.(e);r=u?.guild_id??u?.guildId??void 0}catch{}let i=`/channels/${r??"@me"}/${e}/${t}`,a=()=>{try{return le.getChannelId?.()}catch{return}},s=()=>{let u=Mr;if(typeof u?.jumpToMessage=="function")try{u.jumpToMessage({channelId:e,messageId:t,flash:!0}),a()!==e&&xn(i);return}catch(h){Ht.warn("[jump] jumpToMessage threw; falling back to route",h)}xn(i)||Ht.warn("[jump] \u8DF3\u8F6C\u5931\u8D25\uFF1AJumpActions \u4E0E NavigationRouter \u5747\u672A\u89E3\u6790\u5230")},c=[80,220,450,800],l=0,d=()=>{s();let u=a(),h=u===e;Ht.info(`[jump] \u7B2C ${l+1} \u6B21 \xB7 now=${u??"?"} wanted=${e} ok=${h}`),l++,!h&&l<c.length&&setTimeout(d,c[l]-c[l-1])};setTimeout(d,c[0])}function Qf(){try{Le()}catch{}try{let e={key:"Escape",code:"Escape",keyCode:27,which:27,bubbles:!0,cancelable:!0};document.dispatchEvent(new KeyboardEvent("keydown",e)),document.dispatchEvent(new KeyboardEvent("keyup",e))}catch(e){Ht.error("[jump] escape dispatch failed",e)}try{typeof ji.popLayer=="function"?ji.popLayer():he()?.dispatch?.({type:"LAYER_POP"})}catch(e){Ht.error("[jump] layer pop failed",e)}}function ql({entry:e}){return o.createElement(k,{size:"sm",variant:"plain",className:"hc-msg__jump",icon:o.createElement(mr,{size:16}),title:"\u8DF3\u8F6C\u5230\u8BE5\u6D88\u606F\u6240\u5728\u4F4D\u7F6E",onClick:()=>Xf(e.channelId,e.id,e.guildId)},"\u8DF3\u8F6C")}function Zf({entry:e,highlight:t,freshUrl:n}){let r=i=>n?n(i):i;return o.createElement("div",{className:"hc-msg"},o.createElement("div",{className:"hc-msg__head"},o.createElement("span",{className:"hc-msg__author"},e.author.name),e.author.bot&&o.createElement(Re,{tone:"neutral"},"BOT"),o.createElement(Vl,{channelId:e.channelId,guildId:e.guildId}),o.createElement("span",{className:"hc-msg__time"},Wl(e.deletedAt)),o.createElement(ql,{entry:e})),o.createElement("div",{className:"hc-msg__body"},e.content?bt(e.content,t):e.stickers?.length?o.createElement("span",null,"\u{1F3F7}\uFE0F \u8D34\u7EB8\uFF1A",e.stickers.map(i=>i.name).join("\u3001")):e.attachmentsRich?.length||e.embeds?.length?o.createElement("span",null,"\u{1F5BC}\uFE0F \u5A92\u4F53\u6D88\u606F"):o.createElement("span",{className:"hc-msg__empty"},"\uFF08\u65E0\u6587\u672C\u5185\u5BB9\uFF09")),(e.attachmentsRich?.length??0)>0&&o.createElement("div",{className:"hc-msg__media"},e.attachmentsRich.map((i,a)=>(i.content_type??"").startsWith("image/")||(i.content_type??"").startsWith("video/")?o.createElement("a",{key:a,className:"hc-media-open",href:r(i.proxy_url??i.url)??i.url,target:"_blank",rel:"noreferrer",title:"\u70B9\u51FB\u67E5\u770B\u5927\u56FE",onClick:s=>{s.preventDefault(),Gt(i.proxy_url??i.url)}},o.createElement("img",{className:"hc-msg__thumb",src:r(i.proxy_url??i.url),alt:i.filename??"\u9644\u4EF6",loading:"lazy"})):o.createElement("a",{key:a,href:r(i.url),target:"_blank",rel:"noreferrer"},"\u{1F4CE} ",i.filename??"\u9644\u4EF6"))),!e.attachmentsRich?.length&&e.attachments.length>0&&o.createElement("div",{className:"hc-msg__meta"},"\u9644\u4EF6 ",e.attachments.length," \u4E2A"))}function em({entry:e,highlight:t,freshUrl:n}){let r=i=>n?n(i):i;return o.createElement("div",{className:"hc-msg"},o.createElement("div",{className:"hc-msg__head"},o.createElement("span",{className:"hc-msg__author"},e.author.name),o.createElement(Vl,{channelId:e.channelId,guildId:e.guildId}),o.createElement("span",{className:"hc-msg__time"},Wl(e.updatedAt)),o.createElement(ql,{entry:e})),o.createElement("div",{className:"hc-msg__versions"},e.history.map((i,a)=>o.createElement("div",{className:"hc-msg__version",key:a},o.createElement("span",{className:"hc-msg__vtag"},"v",a+1),o.createElement("span",{className:"hc-msg__vbody"},i.content?bt(i.content,t):"\uFF08\u7A7A\uFF09",i.attachments?.length?o.createElement("span",{className:"hc-msg__media"},i.attachments.map((s,c)=>(s.content_type??"").startsWith("image/")||(s.content_type??"").startsWith("video/")?o.createElement("a",{key:c,className:"hc-media-open",href:r(s.proxy_url??s.url)??s.url,target:"_blank",rel:"noreferrer",title:"\u70B9\u51FB\u67E5\u770B\u5927\u56FE",onClick:l=>{l.preventDefault(),Gt(s.proxy_url??s.url)}},o.createElement("img",{className:"hc-msg__thumb",src:r(s.proxy_url??s.url),alt:s.filename??"\u9644\u4EF6",loading:"lazy"})):o.createElement("a",{key:c,href:r(s.url),target:"_blank",rel:"noreferrer"},"\u{1F4CE} ",s.filename??"\u9644\u4EF6"))):null)))))}function Kl(e,t){let n,r=t,i=!1;try{let c=ve.getChannel?.(e);c&&(c.name&&(n=String(c.name)),r=r??c.guild_id??c.guildId??void 0,i=c.type===1||c.type===3)}catch{}let a;try{if(r){let c=V.getGuild?.(r);c?.name&&(a=String(c.name))}}catch{}let s=n?`#${n}`:i?"\u79C1\u4FE1":`#${e}`;return{guild:a,channel:s}}function Vl({channelId:e,guildId:t}){let n=Kl(e,t);return o.createElement("span",{className:"hc-msg__where"},n.guild&&o.createElement("span",{className:"hc-msg__guild"},n.guild),n.guild&&o.createElement("span",{className:"hc-msg__sep"},"\u203A"),o.createElement("span",null,n.channel))}function Wl(e){let t=new Date(e),n=r=>String(r).padStart(2,"0");return`${n(t.getMonth()+1)}-${n(t.getDate())} ${n(t.getHours())}:${n(t.getMinutes())}`}function tm(){try{let e=new Blob([O.toJSON()],{type:"application/json"}),t=URL.createObjectURL(e),n=document.createElement("a");n.href=t,n.download=`halcyon-message-log-${Date.now()}.json`,document.body.appendChild(n),n.click(),n.remove(),URL.revokeObjectURL(t)}catch(e){Ht.error("export failed",e)}}var nm=g("message-logger"),rm=['section[class*="title_"] [class*="toolbar_"]','section[class*="title"] [class*="toolbar"]','[class*="chat_"] [class*="toolbar_"]','[class*="toolbar_"]'],om=1e3,vt=null,zr=null,Br,Qi;function im(){return o.createElement("button",{type:"button",className:"hc-mlog-toolbtn","aria-label":"\u6D88\u606F\u8BB0\u5F55",title:"\u6D88\u606F\u8BB0\u5F55\uFF08\u88AB\u5220 / \u7F16\u8F91\uFF09",onClick:()=>Qe({pluginId:"message-logger"})},o.createElement(gr,{size:24}))}function am(){for(let e of rm)try{let t=document.querySelector(e);if(t)return t}catch{}return null}function Xi(){if(!H.store.toolbarButton){Zi();return}if(vt&&document.contains(vt))return;vt&&Zi();let e=am();if(!e)return;let t=document.createElement("div");t.className="hc-mlog-toolbtn-host",t.setAttribute("data-hc-plugin","message-logger");try{e.insertBefore(t,e.firstChild)}catch{return}try{let n=X(o.createElement(im),t);vt=t,zr=n}catch(n){t.remove(),nm.debug("toolbar button mount failed",n)}}function Zi(){if(zr){try{zr()}catch{}zr=null}vt&&(vt.remove(),vt=null)}function Yl(){B(),ea(),Xi(),Br=setInterval(Xi,om),Qi=H.subscribe("toolbarButton",()=>Xi())}function ea(){Br&&(clearInterval(Br),Br=void 0),Qi?.(),Qi=void 0,Zi()}var j=g("message-logger"),ta,na,ra,_t;function Gr(e){if(typeof e=="number")return e;if(typeof e=="string"){let t=Date.parse(e);return Number.isNaN(t)?Date.now():t}if(e&&typeof e.valueOf=="function"){let t=e.valueOf();if(typeof t=="number")return t}return Date.now()}function sm(e){return e?.globalName||e?.global_name||e?.username||e?.name||"\u672A\u77E5\u7528\u6237"}function ha(e){return{id:String(e?.id??"0"),name:sm(e),bot:!!e?.bot}}function id(e){if(Array.isArray(e))return e;if(e==null)return[];let t=e;if(typeof t.toArray=="function")try{let n=t.toArray();return Array.isArray(n)?n:[]}catch{return[]}if(typeof e!="string"&&typeof t[Symbol.iterator]=="function")try{return Array.from(t)}catch{return[]}return[]}function ad(e){return id(e?.attachments).map(n=>n?.filename||n?.url||"\u9644\u4EF6").slice(0,20)}function et(e){return id(e?.attachments).map(n=>({id:n?.id!=null?String(n.id):void 0,filename:n?.filename??n?.fileName??void 0,url:n?.url??void 0,proxy_url:n?.proxy_url??n?.proxyURL??n?.proxyUrl??void 0,content_type:n?.content_type??n?.contentType??void 0,width:typeof n?.width=="number"?n.width:void 0,height:typeof n?.height=="number"?n.height:void 0,size:typeof n?.size=="number"?n.size:void 0})).filter(n=>n.url||n.proxy_url).slice(0,10)}function pa(e){let t=e?.embeds;if(!Array.isArray(t)||t.length===0)return[];try{return JSON.parse(JSON.stringify(t)).slice(0,6)}catch{return[]}}function fa(e){let t=e?.sticker_items??e?.stickerItems??e?.stickers;return Array.isArray(t)?t.filter(n=>n?.id!=null).map(n=>({id:String(n.id),name:String(n.name??"\u8D34\u7EB8"),format_type:typeof n.format_type=="number"?n.format_type:n.formatType})).slice(0,4):[]}function Jl(e){if(!e)return;let t=e.message_snapshots??e.messageSnapshots;if(Array.isArray(t)&&t.length){let r=t[0]?.message??t[0],i=typeof r?.content=="string"?r.content.trim():"";return i?`\u21AA\uFE0F \u8F6C\u53D1\uFF1A${i}`:Array.isArray(r?.attachments)&&r.attachments.length?"\u21AA\uFE0F \u8F6C\u53D1\uFF08\u9644\u4EF6\uFF09":Array.isArray(r?.embeds)&&r.embeds.length?"\u21AA\uFE0F \u8F6C\u53D1\uFF08\u5D4C\u5165\u5185\u5BB9\uFF09":"\u21AA\uFE0F \u8F6C\u53D1\u6D88\u606F"}let n=e.poll;if(n){let r=typeof n.question?.text=="string"?n.question.text:typeof n.question=="string"?n.question:"",i=Array.isArray(n.answers)?n.answers.map(a=>typeof a?.poll_media?.text=="string"?a.poll_media.text:void 0).filter(Boolean):[];return`\u{1F4CA} \u6295\u7968\uFF1A${r||"\uFF08\u65E0\u9898\u76EE\uFF09"}${i.length?`\uFF08${i.join(" / ")}\uFF09`:""}`}if(Array.isArray(e.components)&&e.components.length){let r=[],i=(a,s)=>{if(!(s>4))for(let c of a)typeof c?.content=="string"&&c.content.trim()&&r.push(c.content.trim()),Array.isArray(c?.components)&&i(c.components,s+1)};if(i(e.components,0),r.length)return r.join(`
`)}}function cm(){try{return ee.getCurrentUser?.()?.id}catch{return}}var Rl=!1;function qt(e,t){let n=H.store;if(e&&n.ignoredChannels.includes(e))return!0;let r=t?.id!=null?String(t.id):"";if(r&&n.ignoredUsers.includes(r)||n.ignoreBots&&t?.bot)return!0;if(n.ignoreSelf){let i=cm();if(!Rl){Rl=!0;let a=!!(r&&i&&r===String(i));j.info(`\u5C4F\u853D\u81EA\u5DF1 \u81EA\u68C0 \u2014 \u5F00\u5173=on\uFF0C\u6D88\u606F\u4F5C\u8005id=${r||"(\u7A7A)"}\uFF0C\u5F53\u524D\u7528\u6237id=${i??"(\u53D6\u4E0D\u5230)"}\uFF0C\u5224\u5B9A=${a?"\u547D\u4E2D\u2192\u4F1A\u5C4F\u853D":"\u672A\u547D\u4E2D\u2192\u4E0D\u5C4F\u853D"}`)}if(r&&i&&r===String(i))return!0}return!1}var ke=new Map,lm=4e3;function kn(e,t,n){let r=n?.content;if(!e||!t||typeof r!="string")return;let i=`${e}:${t}`,a=ke.get(i);a&&ke.delete(i);let s=fa(n),c=et(n),l=pa(n),d=n?.attachments!=null;if(ke.set(i,{content:r,author:n?.author??a?.author,attachments:d?ad(n):a?.attachments,attachmentsRich:d?c:a?.attachmentsRich,embeds:l.length?l:a?.embeds,stickers:s.length?s:a?.stickers,sentAt:n?.timestamp!=null?Gr(n.timestamp):a?.sentAt,guildId:n?.guild_id??n?.guildId??a?.guildId}),ke.size>lm){let u=ke.keys().next().value;u!==void 0&&ke.delete(u)}}function wt(e,t){try{return Bt.getMessage(e,t)}catch{return}}var Ur,Ft,oa=!1;function ca(){try{if(typeof document>"u")return;let e=document.documentElement,t=`hc-mlog-${H.store.deleteStyle||"tint"}`;if(e&&!e.classList.contains(t)){for(let r of ma)e.classList.remove(`hc-mlog-${r}`);e.classList.add(t)}document.querySelectorAll('li[id^="chat-messages-"]').forEach(r=>{!r.classList.contains("hc-deleted")&&cd(r)&&r.classList.add("hc-deleted")})}catch{}}function sd(){oa||(oa=!0,setTimeout(()=>{oa=!1,ca()},60))}function cd(e){let t=e.id.split("-"),n=t[t.length-1],r=t.length>=4?t[t.length-2]:void 0;return r?O.isDeleted(r,n):O.getDeleted().some(i=>i.id===n)}function dm(){if(typeof MutationObserver>"u"||typeof document>"u")return;Ur=new MutationObserver(t=>{for(let n of t){let r=n.target;n.type==="attributes"&&r instanceof Element&&r.id&&r.id.startsWith("chat-messages-")&&!r.classList.contains("hc-deleted")&&cd(r)&&r.classList.add("hc-deleted")}sd()});let e=()=>{let t=document.documentElement??document.body;return t?(ca(),Ur?.observe(t,{childList:!0,subtree:!0,attributes:!0,attributeFilter:["class"]}),!0):!1};if(!e()){let t=0,n=setInterval(()=>{(e()||++t>100)&&clearInterval(n)},100)}Ft&&clearInterval(Ft),Ft=setInterval(ca,300)}function um(){Ur?.disconnect(),Ur=void 0,Ft&&(clearInterval(Ft),Ft=void 0)}function hm(e,t){try{let n=document.getElementById(`chat-messages-${e}-${t}`)||document.getElementById(`chat-messages-${t}`);n&&n.classList.add("hc-deleted")}catch{}sd()}function ld(e,t,n){try{let r=ee.getUser?.(e);if(r){let i={id:String(r.id),username:r.username??t,global_name:r.globalName??r.global_name??null,discriminator:String(r.discriminator??"0"),bot:!!r.bot,public_flags:r.publicFlags??r.public_flags??0};r.avatar!==void 0&&(i.avatar=r.avatar);let a=r.avatarDecorationData??r.avatar_decoration_data;return a!==void 0&&(i.avatar_decoration_data=a),i}}catch{}return{id:String(e||"0"),username:t,global_name:t,discriminator:"0",bot:n}}function pm(){try{let e=Y().filter(n=>n.pluginId==="message-logger");return["re-render on deleted flag","declare deleted field on message record"].every(n=>e.some(r=>r.label===n&&r.applied))}catch{return!1}}var ia=new Set;function fm(e,t){try{let n=he();if(!n||typeof n.dispatch!="function")return;let r=wt(e,t);if(!r)return;let i=r.author??{},a=f=>f==null?null:typeof f?.toISOString=="function"?f.toISOString():typeof f=="string"?f:new Date(Gr(f)).toISOString(),s=O.findDeleted(e,t),c=pa(r);(!c||c.length===0)&&s?.embeds?.length&&(c=s.embeds);let l=fa(r);l.length===0&&s?.stickers?.length&&(l=s.stickers);let d=et(r);d.length===0&&s?.attachmentsRich?.length&&(d=s.attachmentsRich);let u=typeof r.content=="string"&&r.content!==""?r.content:s?.content??"",h={id:String(t),channel_id:String(e),guild_id:r.guild_id??r.guildId??s?.guildId??null,type:typeof r.type=="number"?r.type:0,content:u,author:ld(String(i.id??s?.author.id??"0"),i.username??i.global_name??i.globalName??s?.author.name??"user",!!(i.bot??s?.author.bot)),timestamp:a(r.timestamp)??new Date().toISOString(),edited_timestamp:a(r.editedTimestamp??r.edited_timestamp),tts:!!r.tts,mention_everyone:!!(r.mentionEveryone??r.mention_everyone),mentions:[],mention_roles:[],attachments:d.map((f,v)=>({id:f.id??`${t}${v}`,filename:f.filename??"file",url:f.url??f.proxy_url,proxy_url:f.proxy_url??f.url,content_type:f.content_type,width:f.width,height:f.height,size:f.size??0})),embeds:c,sticker_items:l,pinned:!!r.pinned,flags:typeof r.flags=="number"?r.flags:0,deleted:!0};n.dispatch({type:"MESSAGE_UPDATE",message:h})}catch(n){j.debug("force row re-render failed (non-fatal)",n)}}function mm(e,t){if(pm())return;let n=`${e}:${t}`;ia.has(n)||(ia.add(n),setTimeout(()=>{fm(e,t),setTimeout(()=>ia.delete(n),1500)},0))}var aa=new Set;function gm(e){try{if(!H.store.logEdits||!e||e.deleted||e.attachments==null||typeof e.content!="string")return;let t=e.channel_id??e.channelId,n=e.id;if(!t||!n||e.edited_timestamp==null&&e.editedTimestamp==null)return;let r=String(t),i=String(n);if(O.isDeleted(r,i))return;let a=`${r}:${i}`,s=ke.get(a);if(!s?.attachmentsRich||$e(et(e))===$e(s.attachmentsRich)||aa.has(a))return;aa.add(a),setTimeout(()=>{aa.delete(a);try{let c=ke.get(a);if(!c?.attachmentsRich)return;let l=wt(r,i)??e,d=et(l);if($e(d)===$e(c.attachmentsRich))return;let u=l?.author??c.author??{};if(qt(r,u)||typeof c.content!="string")return;let h=l?.guild_id??l?.guildId??c.guildId;j.info(`edit ${i}: \u5A92\u4F53 ${c.attachmentsRich.length} \u2192 ${d.length}\uFF08\u6E32\u67D3\u65F6\u8865\u5F55\uFF09`),O.recordEdit(i,r,ha(u),c.content,h!=null?String(h):void 0,c.attachmentsRich),kn(r,i,l)}catch(c){j.debug("render-time media reconcile failed (non-fatal)",c)}},0)}catch{}}function Xl(e,t){if(!e||!t)return;let n=wt(e,t),r=ke.get(`${e}:${t}`);if(!n&&!r){j.debug(`delete of ${t} skipped: message not in cache or shadow`);return}let i=n?.author??r?.author??{};if(qt(e,i))return;let a=typeof n?.content=="string"&&n.content!==""?n.content:r?.content??"",s=n?ad(n):r?.attachments??[],c=n?et(n):[],l=c.length?c:r?.attachmentsRich??[],d=n?pa(n):[],u=d.length?d:r?.embeds??[],h=n?fa(n):[],f=h.length?h:r?.stickers??[],v=Jl(n)??Jl(r),x=a||v||"";if(O.recordDeleted({id:String(t),channelId:String(e),guildId:n?.guild_id??n?.guildId??r?.guildId??void 0,author:ha(i),content:x,attachments:s,attachmentsRich:l.length?l:void 0,embeds:u.length?u:void 0,stickers:f.length?f:void 0,sentAt:n?.timestamp!=null?Gr(n.timestamp):r?.sentAt??Date.now(),deletedAt:Date.now()}),n&&H.store.keepDeletedInChat)try{n.deleted=!0}catch{}if(H.store.keepDeletedInChat&&(hm(String(e),String(t)),mm(String(e),String(t))),H.store.keepDeletedInChat&&!nd){nd=!0;let L=String(e),m=String(t);setTimeout(()=>{let b=wt(L,m),E=typeof document<"u"?document.getElementById(`chat-messages-${L}-${m}`)||document.getElementById(`chat-messages-${m}`):null,z=!!E&&E.classList.contains("hc-deleted");b&&b.deleted===!0?j.info(`live keep-deleted \u81EA\u68C0 OK \u2014 \u88AB\u5220\u6D88\u606F\u4ECD\u7559\u5728 store \u4E14\u5DF2\u6807\u8BB0 deleted\uFF1BDOM \u884C${E?z?"\u5DF2\u76F4\u63A5\u67D3\u7EA2\uFF08\u5B9E\u65F6\u7EA2\u6761\u751F\u6548\uFF09":"\u627E\u5230\u4F46\u672A\u67D3\u7EA2\uFF0C\u8BF7\u53CD\u9988":"\u672A\u627E\u5230\uFF08\u53EF\u80FD\u5DF2\u6EDA\u51FA\u89C6\u56FE\uFF09"}`):b?j.warn("live keep-deleted \u81EA\u68C0 PARTIAL \u2014 \u6D88\u606F\u4FDD\u7559\u4F46\u672A\u6807\u8BB0 deleted\uFF0C\u6539\u7528 DOM \u76F4\u63A5\u67D3\u7EA2\u515C\u5E95"):j.error("live keep-deleted \u81EA\u68C0 FAILED \u2014 MessageStore \u5DF2\u4E22\u5F03\u88AB\u5220\u6D88\u606F\uFF0C\u8BF4\u660E \u201Ckeep deleted message in store\u201D \u8865\u4E01\u672A\u547D\u4E2D\u5F53\u524D\u6784\u5EFA\uFF1B\u88AB\u5220\u6D88\u606F\u53EA\u4F1A\u5728\u91CD\u65B0\u52A0\u8F7D\u9891\u9053\u540E\u7531 revive \u91CD\u65B0\u51FA\u73B0\uFF08\u6B63\u662F\u4F60\u8BF4\u7684\u201C\u5237\u65B0\u624D\u6709\u3001\u5B9E\u65F6\u6CA1\u6709\u201D\uFF09\u3002")},0)}}function ym(e){if(!H.store.logEdits||!e)return;let t=e.channel_id??e.channelId,n=e.id;if(!t||!n)return;let r=`${t}:${n}`,i=wt(t,n),a=ke.get(r),s=a?.content??(typeof i?.content=="string"?i.content:void 0),c=a?.attachmentsRich??et(i),l=i?.author??a?.author??e.author??{},d=e.guild_id??e.guildId??i?.guild_id??a?.guildId;setTimeout(()=>{try{let u=String(t),h=String(n),f=wt(u,h);if(f?.deleted===!0||O.isDeleted(u,h))return;let v,x;if(f&&typeof f.content=="string")v=f.content,x=et(f),kn(u,h,f);else if(typeof e.content=="string")v=e.content,x=e.attachments!=null?et(e):c,kn(u,h,e);else return;if(s===void 0){j.debug(`edit to ${h} skipped: no prior content known (message predates the recorder)`);return}let L=typeof v=="string"&&v!==s,m=$e(x)!==$e(c);if(!L&&!m||qt(u,l))return;m&&j.info(`edit ${h}: \u5A92\u4F53 ${c.length} \u2192 ${x.length}`+(L?"":"\uFF08\u4EC5\u79FB\u9664/\u66F4\u6362\u9644\u4EF6\uFF0C\u6587\u5B57\u672A\u53D8\uFF09")),O.recordEdit(h,u,ha(l),s,d!=null?String(d):void 0,m?c:void 0)}catch(u){j.debug(`post-store edit check failed for ${n}`,u)}},0)}function bm(e){let t=(e.attachmentsRich??[]).map((r,i)=>({id:r.id??`${e.id}${i}`,filename:r.filename??"attachment",url:r.url??r.proxy_url,proxy_url:r.proxy_url??r.url,content_type:r.content_type,width:r.width,height:r.height,size:r.size??0,spoiler:!1})),n=()=>{let r=typeof e.sentAt=="number"&&Number.isFinite(e.sentAt)?e.sentAt:vm(e.id),i=new Date(r);return Number.isNaN(i.getTime())?new Date().toISOString():i.toISOString()};return{id:e.id,type:0,channel_id:e.channelId,guild_id:e.guildId,sticker_items:e.stickers?.length?e.stickers:void 0,content:e.content||(t.length===0&&e.attachments.length?`\u{1F4CE} ${e.attachments.join(", ")}`:""),author:ld(e.author.id,e.author.name,e.author.bot),timestamp:n(),edited_timestamp:null,attachments:t,embeds:e.embeds??[],mentions:[],mention_roles:[],mention_everyone:!1,pinned:!1,tts:!1,flags:0}}function vm(e){try{return Number((BigInt(e)>>22n)+1420070400000n)}catch{return Date.now()}}function xt(e,t){try{let n=BigInt(e),r=BigInt(t);return n<r?-1:n>r?1:0}catch{return e<t?-1:e>t?1:0}}var Ql=new WeakSet,Zl=50;function ed(e){return e.hasMoreAfter===!0?!1:e.hasMoreAfter===!1?!0:!(e.jump?.messageId!=null||e.jumpTargetId!=null)&&e.isBefore!==!0&&e.isAfter!==!0}function _m(e){if(!H.store.keepDeletedInChat||Ql.has(e))return;Ql.add(e);let t=String(e.channelId??e.channel_id??""),n=e.messages;if(!t||!Array.isArray(n))return;let r=O.getDeleted().filter(f=>f.channelId===t);if(!r.length)return;let i=new Set(n.map(f=>String(f?.id))),a,s;for(let f of n){let v=f?.id!=null?String(f.id):void 0;v&&((a===void 0||xt(v,a)<0)&&(a=v),(s===void 0||xt(v,s)>0)&&(s=v))}if(a===void 0&&!ed(e))return;let c=ed(e),l=r.filter(f=>!(i.has(f.id)||qt(t,f.author)||a!==void 0&&xt(f.id,a)<0||!c&&s!==void 0&&xt(f.id,s)>0));if(!l.length)return;l.sort((f,v)=>-xt(f.id,v.id));let d=Math.max(0,l.length-Zl),u=d?l.slice(0,Zl):l,h=n.length>=2?xt(String(n[0].id),String(n[n.length-1].id))>0:!0;n.push(...u.map(bm)),n.sort((f,v)=>{let x=xt(String(f?.id??"0"),String(v?.id??"0"));return h?-x:x}),j.info(`revived ${u.length} deleted message(s) into ${t}`+(d?`\uFF08\u53E6\u6709 ${d} \u6761\u5728\u7A97\u53E3\u5185\u4F46\u8D85\u51FA\u5355\u9875\u4E0A\u9650\uFF0C\u4EC5\u5728\u6D88\u606F\u8BB0\u5F55\u9875\u53EF\u89C1\uFF09`:""))}function xm(e){if(!H.store.keepDeletedInChat)return;let t=String(e.channelId??e.channel_id??"");if(t)for(let n of O.getDeleted()){if(n.channelId!==t)continue;let r=wt(t,n.id);if(r&&!r.deleted)try{r.deleted=!0}catch{}}}function wm(e,t){try{if(t==="MESSAGE_CREATE"){let n=e.message;kn(n?.channel_id??n?.channelId??e.channelId,n?.id,n)}else if(t==="LOAD_MESSAGES_SUCCESS"){let n=e.channelId??e.channel_id;if(Array.isArray(e.messages))for(let r of e.messages)kn(r?.channel_id??n,r?.id,r)}}catch{}}var td=!1,la=0,nd=!1;function da(e){let t=e?.type;if(typeof t=="string"){if(ua.includes(t)&&la++,wm(e,t),t==="LOAD_MESSAGES_SUCCESS")try{_m(e),setTimeout(()=>xm(e),0)}catch(n){j.error("failed to revive deleted messages on channel load",n)}try{if(t==="MESSAGE_DELETE")Xl(e.channelId??e.channel_id,e.id??e.messageId);else if(t==="MESSAGE_DELETE_BULK"){let n=e.channelId??e.channel_id;for(let r of e.ids??[])Xl(n,r)}else if(t==="MESSAGE_UPDATE")ym(e.message);else return;td||(td=!0,j.info(`recorder saw its first ${t}`))}catch(n){j.error("recorder failed for",t,n)}}}function Sm(e){da(e.args[0])}var ua=["MESSAGE_CREATE","MESSAGE_UPDATE","MESSAGE_DELETE","MESSAGE_DELETE_BULK","LOAD_MESSAGES_SUCCESS"];function km(e,t){let n=[],r=[];if(typeof e.addInterceptor=="function")try{let i=a=>(da(a),!1);e.addInterceptor(i),n.push(()=>{let a=e._interceptors;if(Array.isArray(a)){let s=a.indexOf(i);s>=0&&a.splice(s,1)}}),r.push("interceptor")}catch{}for(let i of["dispatch","_dispatch"])if(typeof e[i]=="function"){try{n.push(ue.before(e,i,Sm)),r.push(i)}catch{}break}if(typeof e.subscribe=="function")try{let i=a=>da(a);for(let a of ua)e.subscribe(a,i);n.push(()=>{if(typeof e.unsubscribe=="function")for(let a of ua)try{e.unsubscribe(a,i)}catch{}}),r.push("subscribe")}catch{}return j.info(`recorder on dispatcher ${t}: seams [${r.join(", ")||"none"}]`),()=>n.forEach(i=>i())}var sa=6;function Em(){let e=new Set,t=[],n=!1,r=()=>{let c=[he(),...pi(mt)].filter(Boolean),l=0;for(let d of c)if(!e.has(d)){if(e.size>=sa){n||(n=!0,j.warn(`dispatcher \u5019\u9009\u8D85\u8FC7 ${sa} \u4E2A\uFF0C\u5DF2\u505C\u6B62\u7EE7\u7EED\u6302\u63A5\u3002\u591A\u51FA\u6765\u7684\u901A\u5E38\u662F shape \u76F8\u4F3C\u7684\u5047\u6A21\u5757\uFF1B\u5982\u679C\u5F55\u5236\u6CA1\u751F\u6548\u8BF7\u53CD\u9988\u8FD9\u6761\u65E5\u5FD7\u3002`));break}e.add(d),t.push(km(d,`#${e.size}`)),l++}return l},i=r();j.info(`recorder attached to ${i} dispatcher instance(s)`);let a=setInterval(()=>{if(e.size>=sa){clearInterval(a);return}let c=r();c>0&&j.info(`recorder attached to ${c} late dispatcher instance(s)`)},5e3),s=setTimeout(()=>clearInterval(a),6e4);return()=>{clearInterval(a),clearTimeout(s),t.forEach(c=>c())}}var Im={trash:()=>o.createElement(o.Fragment,null,o.createElement("path",{d:"M4.5 7h15"}),o.createElement("path",{d:"M9.25 7V5.5A1.5 1.5 0 0110.75 4h2.5a1.5 1.5 0 011.5 1.5V7"}),o.createElement("path",{d:"M6.5 7l.85 11.1A2 2 0 009.34 20h5.32a2 2 0 001.99-1.9L17.5 7"})),shield:()=>o.createElement(o.Fragment,null,o.createElement("path",{d:"M12 3.5l7 2.6v5c0 4.4-3 7.3-7 8.9-4-1.6-7-4.5-7-8.9v-5l7-2.6z"}),o.createElement("path",{d:"M9.5 12l1.8 1.8 3.2-3.6"})),warning:()=>o.createElement(o.Fragment,null,o.createElement("path",{d:"M12 4.5L3.5 19h17L12 4.5z"}),o.createElement("path",{d:"M12 10v4"}),o.createElement("path",{d:"M12 16.75h.01"}))};function dd(e,t){if(e==null||t==="none")return;let n=new Date(e);if(t==="datetime"){let r=i=>String(i).padStart(2,"0");return`${r(n.getMonth()+1)}-${r(n.getDate())} ${n.toLocaleTimeString("zh-CN",{hour12:!1})}`}return n.toLocaleTimeString("zh-CN",{hour12:!1})}function rd(e){let t=H.store,n=Im[t.markerIcon]?.(),r=dd(e.at,t.markerTime),i=`hc-deleted-marker hc-deleted-marker--${t.markerLook||"plain"}`+(e.edited?" hc-deleted-marker--edited":"");return o.createElement("div",{className:i},n&&o.createElement("svg",{className:"hc-deleted-marker__icon",width:"14",height:"14",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:2,strokeLinecap:"round",strokeLinejoin:"round","aria-hidden":!0},n),o.createElement("span",null,e.text,r?`\uFF08${r}\uFF09`:""))}var Nm=["logEdits","deleteStyle","showDeletedMarker","showEditedMarker","markerIcon","markerLook","markerTime"];function Cm(){let[,e]=y(0);C(()=>{let t=Nm.map(n=>H.subscribe(n,()=>e(r=>r+1)));return()=>t.forEach(n=>n())},[])}function Tm(){let[,e]=y(0);C(()=>O.subscribe(()=>e(t=>t+1)),[])}function ud(e,t){let n=[];for(let r of e??[]){let i=r.proxy_url??r.url;if(!i)continue;let a=r.content_type??"";n.push({url:i,kind:a.startsWith("video/")?"video":a.startsWith("image/")?"image":"file",name:r.filename})}for(let r of t??[]){let i=r?.image?.proxy_url??r?.image?.url??r?.thumbnail?.proxy_url??r?.thumbnail?.url;typeof i=="string"&&i&&n.push({url:i,kind:"image"})}return n.slice(0,6)}function Am(e){Cm(),Tm();let t=O.getEdited().find(i=>i.id===e.messageId&&i.channelId===e.channelId)?.history,n=H.store,r=[];return n.logEdits&&t&&t.length>0&&r.push(o.createElement("div",{className:"hc-edit-history",key:"hc-edit-history"},t.map((i,a)=>{let s=dd(i.at,"time"),c=i.attachments?.length?ud(i.attachments):[];return o.createElement("div",{className:`hc-edit-history__version hc-edit-history__version--${n.deleteStyle||"tint"}`,key:a},bt(i.content),s?o.createElement("span",{className:"hc-edit-history__time"},s):null,c.length>0&&o.createElement("div",{className:"hc-edit-history__media"},c.map((l,d)=>l.kind==="file"?o.createElement("a",{className:"hc-deleted-media__file",key:d,href:l.url,target:"_blank",rel:"noreferrer"},"\u{1F4CE} ",l.name??"\u9644\u4EF6"):o.createElement("a",{key:d,className:"hc-media-open",href:l.url,target:"_blank",rel:"noreferrer",title:"\u70B9\u51FB\u67E5\u770B\u5927\u56FE",onClick:u=>{u.preventDefault(),u.stopPropagation(),Gt(l.url)}},o.createElement("img",{className:"hc-deleted-media__thumb",src:l.url,alt:l.name??"",loading:"lazy"})))))}))),n.showEditedMarker&&e.isEdited&&!e.isDeleted&&r.push(o.createElement(rd,{key:"hc-edited-marker",text:"\u6B64\u6D88\u606F\u5DF2\u7F16\u8F91",at:e.editedAt,edited:!0})),n.showDeletedMarker&&e.isDeleted&&r.push(o.createElement(rd,{key:"hc-deleted-marker",text:"\u6B64\u6D88\u606F\u5DF2\u5220\u9664",at:e.deletedAt})),e.isDeleted&&e.media&&e.media.length>0&&r.push(o.createElement("div",{className:"hc-deleted-media",key:"hc-deleted-media"},e.media.map((i,a)=>i.kind==="file"?o.createElement("a",{className:"hc-deleted-media__file",key:a,href:i.url,target:"_blank",rel:"noreferrer"},"\u{1F4CE} ",i.name??"\u9644\u4EF6"):o.createElement("a",{className:"hc-media-open",key:a,href:i.url,target:"_blank",rel:"noreferrer",title:"\u70B9\u51FB\u67E5\u770B\u5927\u56FE",onClick:s=>{s.preventDefault(),s.stopPropagation(),Gt(i.url)}},o.createElement("img",{className:"hc-deleted-media__thumb",src:i.url,alt:i.name??"",loading:"lazy",referrerPolicy:"no-referrer"}))))),r.length?o.createElement(o.Fragment,null,r):null}var ma=["tint","text","ghost","strike"];function od(){try{let e=document.documentElement;if(!e)return;for(let t of ma)e.classList.remove(`hc-mlog-${t}`);e.classList.add(`hc-mlog-${H.store.deleteStyle||"tint"}`)}catch{}}function Mm(){let e=Y().filter(i=>i.pluginId==="message-logger");if(!e.length)return;for(let i of e)i.applied?j.info(`patch OK   \xB7 ${i.label} (${i.hits} hit${i.hits===1?"":"s"})`):j.warn(`patch MISS \xB7 ${i.label} \u2014 \u672A\u5339\u914D\u5F53\u524D Discord \u6784\u5EFA`);let t=e.filter(i=>!i.applied);t.length===0?j.info("in-chat patches applied \u2014 \u5168\u90E8\u547D\u4E2D"):j.warn("\u90E8\u5206 in-chat patch \u672A\u5339\u914D\u5F53\u524D Discord \u6784\u5EFA\uFF1A"+t.map(i=>`"${i.label}"`).join("\u3001")+"\u3002\u5220\u9664\u6D88\u606F\u4ECD\u4F1A\u8BB0\u5F55\u5728\u63D2\u4EF6\u9875\uFF0C\u4F46\u53EF\u80FD\u65E0\u6CD5\u5728\u804A\u5929\u5185\u4FDD\u7559 / \u53D8\u7EA2\u3002");let n=e.some(i=>i.label==="keep deleted message in store"&&!i.applied),r=e.some(i=>i.label==="declare deleted field on message record"&&!i.applied);if(n||r)try{let s=["MESSAGE_DELETE:function","MESSAGE_DELETE(","MESSAGE_DELETE_BULK"].map(l=>{let d=dr(l,220);return d.startsWith("<no loaded factory")||d.startsWith("<webpack")?"":`\u3010${l}\u3011${d}`}).filter(Boolean).join("  ||  ").replace(/\s+/g," "),c=s.length>3800?s.slice(0,3800)+" \u2026(\u622A\u65AD)":s;j.warn("MESSAGE_DELETE \u5904\u7406\u5668\u771F\u5B9E\u6E90\u7801\u5207\u7247\uFF08\u8865\u4E01\u672A\u547D\u4E2D\uFF0C\u7528\u4E8E\u4FEE\u6B63\uFF0C\u8BF7\u6574\u6BB5\u53D1\u7ED9\u5F00\u53D1\u8005\uFF09\uFF1A"+(c||"\u672A\u5728\u5DF2\u52A0\u8F7D\u6A21\u5757\u4E2D\u627E\u5230 MESSAGE_DELETE \u5904\u7406\u5668\uFF1B\u8BF7\u5148\u6253\u5F00\u4E00\u4E2A\u9891\u9053\u540E\u518D\u67E5\u770B\u65E5\u5FD7\u3002"))}catch(i){j.error("could not dump MESSAGE_DELETE handler shape",i)}}var hd=N({id:"message-logger",name:"\u6D88\u606F\u8BB0\u5F55\u5668",description:"\u4FDD\u7559\u88AB\u5220\u9664\u7684\u6D88\u606F\u4E0E\u7F16\u8F91\u5386\u53F2\uFF0C\u53EF\u6309\u7528\u6237\u6216\u9891\u9053\u5FFD\u7565\uFF0C\u652F\u6301\u5BFC\u51FA\u3002",authors:[{name:"caitemm"}],category:"utility",settings:H,page:{title:"\u6D88\u606F\u8BB0\u5F55",icon:gr,component:Fl},probe(){let e=Mr,t=Ar,n=!1;try{n=typeof P(r=>typeof r?.transitionTo=="function"&&typeof r?.__halcyon_probe__>"u")?.transitionTo=="function"}catch{n=!1}return{jumpActionsFound:e!=null,jumpToMessageIsFn:typeof e?.jumpToMessage=="function",navigationRouterFound:t!=null,transitionToIsFn:typeof t?.transitionTo=="function",scanRouterFound:n,deletedCount:O.getDeleted().length,settingsHostEmbedded:Y().some(r=>r.pluginId==="halcyon-settings"&&r.applied)}},patches:[{label:"keep deleted message in store",find:'"MessageStore"',replacement:[{match:/(?<=MESSAGE_DELETE:function\(([A-Za-z_$][\w$]*)\)\{)(?=let.{0,100}?([A-Za-z_$][\w$]*\.[A-Za-z_$][\w$]*)\.getOrCreate)/,replace:"let cache=$2.getOrCreate($1.channelId);cache=$self.handleDelete(cache,$1,!1);$2.commit(cache);return;"},{match:/(?<=MESSAGE_DELETE_BULK:function\(([A-Za-z_$][\w$]*)\)\{)(?=let.{0,100}?([A-Za-z_$][\w$]*\.[A-Za-z_$][\w$]*)\.getOrCreate)/,replace:"let cache=$2.getOrCreate($1.channelId);cache=$self.handleDelete(cache,$1,!0);$2.commit(cache);return;"}]},{label:"tint deleted message row (base)",find:"Message must not be a thread starter message",replacement:{match:/([)\w$\]])\("li",\{(.+?),className:/,replace:'$1("li",{$2,className:($self.deletedClass(arguments[0])||"")+" "+'}},{label:"tint deleted message row",find:"childrenRepliedMessage",replacement:{match:/(className:)(\w+\(\)\((?:[^()"']|"[^"]*"|'[^']*'|\([^()]*\))*\))/,replace:'$1[$2,$self.deletedClass(arguments[0])].filter(Boolean).join(" ")'}},{label:"inline edit history",find:".SEND_FAILED,",replacement:{match:/\]:[\w$]+\.isUnsupported.{0,30}?,children:\[/,replace:"$&$self.renderEdits(arguments[0]),"}},{label:"re-render on deleted flag",find:".SEND_FAILED,",replacement:{match:/((\w+)\.editedTimestamp\?\.toString\(\)===(\w+)\.editedTimestamp\?\.toString\(\))/,replace:"$1&&$2.deleted===$3.deleted"}},{label:"declare deleted field on message record",find:/\}addReaction\(|addReaction\([\w$]+\)\{/,replacement:{match:/this\.customRenderedContent=(\w+)\.customRenderedContent,/,replace:"this.customRenderedContent=$1.customRenderedContent,this.deleted=$1.deleted||!1,this.editHistory=$1.editHistory||[],this.firstEditTimestamp=$1.firstEditTimestamp||this.editedTimestamp||this.timestamp,"}},{label:"carry deleted flag through message updates",find:/\.PREMIUM_REFERRAL\s*&&\s*\(/,replacement:{match:/(?<=null!=[\w$]+\.edited_timestamp\)return )[\w$]+\([\w$]+,\{reactions:([\w$]+)\.reactions[\s\S]{0,60}?\}\)/,replace:"Object.assign($&,{deleted:$1.deleted,editHistory:$1.editHistory,firstEditTimestamp:$1.firstEditTimestamp})"}}],start(){O.load(),O.setRetention(H.store.retention),na=H.subscribe("retention",e=>O.setRetention(e)),od(),ra=H.subscribe("deleteStyle",od),ta=Em(),_t=()=>O.flush();try{window.addEventListener("pagehide",_t),window.addEventListener("beforeunload",_t)}catch{}dm(),Yl(),setTimeout(Mm,4e3),setTimeout(()=>{la>0?j.info(`recorder pulse OK \u2014 ${la} message action(s) observed so far`):j.error("recorder pulse FAILED \u2014 no message actions observed in 30s. The dispatcher hooks are not receiving events on this build. \u8BF7\u628A\u65E5\u5FD7\u9875\u91CC recorder on dispatcher \u5F00\u5934\u7684\u51E0\u884C\u53D1\u7ED9\u5F00\u53D1\u8005\u3002")},3e4)},stop(){if(ta?.(),ta=void 0,na?.(),na=void 0,ra?.(),ra=void 0,um(),ea(),_t){try{window.removeEventListener("pagehide",_t),window.removeEventListener("beforeunload",_t)}catch{}_t=void 0}try{for(let e of ma)document.documentElement?.classList.remove(`hc-mlog-${e}`)}catch{}O.flush(),j.info("stopped")},handleDelete(e,t,n){try{if(e==null||!n&&typeof e.has=="function"&&!e.has(t.id))return e;let r=H.store.keepDeletedInChat,i=64,a=s=>{let c=typeof e.get=="function"?e.get(s):void 0;if(!c)return;r&&!t.mlDeleted&&(c.flags&i)!==i&&!qt(String(t.channelId??t.channel_id??c.channel_id??""),c.author??{})?e=e.update(s,d=>d.set("deleted",!0)):e=e.remove(s)};if(n)for(let s of t.ids??[])a(s);else a(t.id)}catch(r){j.error("handleDelete failed; messages removed normally",r)}return e},deletedClass(e){try{let t=e?.message??e;if(!t)return"";let n=t.channel_id??t.channelId;return t.deleted===!0||n&&t.id&&O.isDeleted(String(n),String(t.id))?"hc-deleted":""}catch{return""}},renderEdits(e){try{let t=e?.message,n=t?.id,r=t?.channel_id??t?.channelId;if(!n||!r||qt(String(r),t?.author))return null;gm(t);let i=O.getEdited().find(h=>h.id===String(n)&&h.channelId===String(r)),a=O.findDeleted(String(r),String(n)),s=!!(i&&i.history.length>0),c=!!a||t?.deleted===!0,l=t?.edited_timestamp??t?.editedTimestamp,d=l!=null||s,u=l!=null?Gr(l):i?.updatedAt;return!s&&!c&&!d?null:o.createElement(Am,{channelId:String(r),messageId:String(n),deletedAt:a?.deletedAt,editedAt:u,isDeleted:c,isEdited:d,media:c?ud(a?.attachmentsRich,a?.embeds):void 0})}catch{return null}}});var pd=g("show-username"),fd=D({mode:{type:"select",default:"nick-user",label:"\u663E\u793A\u65B9\u5F0F",description:"\u6635\u79F0\u4E0E\u7528\u6237\u540D\u7684\u6392\u5217\u3002",options:[{value:"nick-user",label:"\u6635\u79F0\u5728\u524D\uFF0C\u7528\u6237\u540D\u5728\u540E"},{value:"user-nick",label:"\u7528\u6237\u540D\u5728\u524D\uFF0C\u6635\u79F0\u5728\u540E"},{value:"user-only",label:"\u53EA\u663E\u793A\u7528\u6237\u540D"}]},style:{type:"select",default:"muted",label:"\u7528\u6237\u540D\u6837\u5F0F",description:"\u9644\u52A0\u7684\u7528\u6237\u540D\u90E8\u5206\u7684\u89C6\u89C9\u6837\u5F0F\u3002",options:[{value:"muted",label:"\u7070\u8272\u5C0F\u5B57"},{value:"pill",label:"\u5706\u89D2\u80F6\u56CA"},{value:"at",label:"@ \u524D\u7F00"},{value:"paren",label:"\u62EC\u53F7\u5305\u88F9"}]},hideWhenSame:{type:"boolean",default:!0,label:"\u6635\u79F0\u76F8\u540C\u65F6\u9690\u85CF",description:"\u6635\u79F0\u4E0E\u7528\u6237\u540D\u4E00\u81F4\u65F6\u4E0D\u91CD\u590D\u663E\u793A\u3002"},inReplies:{type:"boolean",default:!1,label:"\u56DE\u590D\u9884\u89C8\u4E2D\u4E5F\u663E\u793A",description:"\u5728\u56DE\u590D\u5F15\u7528\u7684\u5C0F\u5B57\u6761\u4E2D\u4E5F\u9644\u52A0\u7528\u6237\u540D\u3002"}});function Pm(e){let{original:t}=e,n=fd.store,r=t.userOverride??t.message?.author,i=r?.username,a=t.author?.nick??r?.globalName??i??"",s=t.withMentionPrefix?"@":"";try{if(!i)return o.createElement(o.Fragment,null,s,a);if(t.isRepliedMessage&&!n.inReplies)return o.createElement(o.Fragment,null,s,a);if(n.hideWhenSame&&i.toLowerCase()===a.toLowerCase())return o.createElement(o.Fragment,null,s,a);let c=`hc-username hc-username--${n.style||"muted"}`,l=n.style==="at"?`@${i}`:n.style==="paren"?`\uFF08${i}\uFF09`:i;return n.mode==="user-only"?o.createElement(o.Fragment,null,s,i):n.mode==="user-nick"?o.createElement(o.Fragment,null,s,i," ",o.createElement("span",{className:c},a)):o.createElement(o.Fragment,null,s,a," ",o.createElement("span",{className:c},l))}catch(c){return pd.error("username render failed; falling back to the nick",c),o.createElement(o.Fragment,null,s,a)}}var md=N({id:"show-username",name:"\u663E\u793A\u7528\u6237\u540D",description:"\u5728\u6635\u79F0\u65C1\u8FB9\u663E\u793A\u8D26\u53F7\u7528\u6237\u540D\uFF0C\u9632\u6B62\u6539\u540D\u5192\u5145\uFF0C\u652F\u6301\u591A\u79CD\u6837\u5F0F\u3002",authors:[{name:"caitemm"}],category:"appearance",settings:fd,patches:[{label:"message header username",find:'="SYSTEM_TAG"',replacement:{match:/(?<=onContextMenu:[\w$]+,children:)([\w$]+)\?(?=.{0,100}?user[Nn]ame:)/,replace:"$self.renderUsername(arguments[0]),_hcOld:$1?"}}],start(){pd.info("appending usernames to message headers")},stop(){},renderUsername(e){try{return o.createElement(Pm,{original:e})}catch{return e?.author?.nick??null}}});var Oe=D({acknowledgedRisk:{type:"boolean",default:!1,label:"\u6211\u5DF2\u4E86\u89E3\u5C01\u53F7\u98CE\u9669",description:"\u4E3B\u52A8\u8BA2\u9605\u9891\u9053\u5C5E\u4E8E\u81EA\u52A8\u5316\u884C\u4E3A\uFF0C\u53EF\u80FD\u8FDD\u53CD Discord \u670D\u52A1\u6761\u6B3E\u5E76\u5BFC\u81F4\u8D26\u53F7\u88AB\u5C01\u3002\u4EC5\u5728\u4F60\u5B8C\u5168\u7406\u89E3\u5E76\u81EA\u613F\u627F\u62C5\u98CE\u9669\u65F6\u5F00\u542F\u3002",hidden:!0},selectedGuilds:{type:"string-list",default:[],label:"\u76D1\u63A7\u7684\u670D\u52A1\u5668",description:"\u6309\u670D\u52A1\u5668 ID \u76D1\u63A7\u3002\u5EFA\u8BAE\u4ECE\u4E0B\u65B9\u7684\u670D\u52A1\u5668\u5217\u8868\u52FE\u9009\uFF0C\u800C\u4E0D\u662F\u624B\u586B\u3002",itemPlaceholder:"\u670D\u52A1\u5668 ID",hidden:!0}});var Hr=g("guild-monitor"),Lm=5*60*1e3,En,gd=()=>[];function $m(e){try{let t=yt.getChannels(e);if(!t||typeof t!="object")return[];let n=new Set;for(let r of Object.values(t))if(Array.isArray(r))for(let i of r){let a=i?.channel??i,s=a?.id;s!=null&&(a?.type===0||a?.type===5)&&n.add(String(s))}return[...n]}catch(t){return Hr.debug(`could not read channels for guild ${e}`,t),[]}}function Dm(e){let t=Oi;if(t)try{if(typeof t.subscribeToChannel=="function"){for(let n of $m(e))t.subscribeToChannel(e,n);return}typeof t.subscribeToGuild=="function"&&t.subscribeToGuild(e)}catch(n){Hr.warn(`subscribe failed for guild ${e}`,n)}}function ya(){let e=Oi;return!!(e&&(typeof e.subscribeToChannel=="function"||typeof e.subscribeToGuild=="function"))}function ga(){let e=gd();if(e.length){for(let t of e)Dm(t);Hr.debug(`refreshed subscriptions for ${e.length} guild(s)`)}}function yd(e){if(gd=e,ba(),!ya()){Hr.warn("this Discord build exposes no guild-subscription action; monitoring is inactive");return}ga(),En=setInterval(ga,Lm)}function bd(){En&&ga()}function ba(){En&&(clearInterval(En),En=void 0)}function va(){try{let t=(fi("GuildStore")??V)?.getGuilds?.()??{};return Object.values(t).map(n=>({id:String(n?.id??""),name:String(n?.name??n?.id??"\u672A\u77E5\u670D\u52A1\u5668")})).filter(n=>n.id).sort((n,r)=>n.name.localeCompare(r.name,"zh-CN"))}catch{return[]}}function vd(){let[e,t]=y(()=>va()),[n,r]=y(()=>[...Oe.store.selectedGuilds]),[i,a]=y(()=>Oe.store.acknowledgedRisk===!0),s=ya();C(()=>{if(e.length===0){let u=setTimeout(()=>t(va()),400);return()=>clearTimeout(u)}},[e.length]);let c=u=>{r(u),Oe.store.selectedGuilds=u,bd()},l=u=>{c(n.includes(u)?n.filter(h=>h!==u):[...n,u])};return o.createElement("div",{className:"hc-stack"},o.createElement("div",{className:"hc-inline-note hc-inline-note--danger"},o.createElement(Ye,{size:18}),o.createElement("span",null,"\u4E3B\u52A8\u76D1\u63A7\u4F1A\u8BA2\u9605\u4F60\u5C1A\u672A\u6253\u5F00\u7684\u9891\u9053\uFF0C\u5C5E\u4E8E\u81EA\u52A8\u5316\u884C\u4E3A\uFF0C\u53EF\u80FD\u8FDD\u53CD Discord \u670D\u52A1\u6761\u6B3E\u5E76\u5BFC\u81F4",o.createElement("b",null,"\u8D26\u53F7\u88AB\u5C01\u7981"),"\u3002\u8BF7\u81EA\u884C\u627F\u62C5\u98CE\u9669\u3002")),o.createElement("div",{className:"hc-section"},o.createElement("div",{className:"hc-section__body"},o.createElement("div",{className:"hc-cell hc-cell--row"},o.createElement("div",{className:"hc-cell__main"},o.createElement("div",{className:"hc-cell__label"},"\u542F\u7528\u4E3B\u52A8\u76D1\u63A7"),o.createElement("div",{className:"hc-cell__desc"},"\u5F00\u542F\u540E\u624D\u80FD\u52FE\u9009\u4E0B\u65B9\u7684\u670D\u52A1\u5668\u3002")),o.createElement(Z,{checked:i,onChange:u=>{a(u),Oe.store.acknowledgedRisk=u,u||c([])},"aria-label":"\u542F\u7528\u4E3B\u52A8\u76D1\u63A7"})))),!s&&o.createElement("div",{className:"hc-inline-note"},o.createElement(Ye,{size:18}),o.createElement("span",null,"\u5F53\u524D Discord \u7248\u672C\u672A\u66B4\u9732\u53EF\u7528\u7684\u8BA2\u9605\u63A5\u53E3\uFF0C\u76D1\u63A7\u6682\u65F6\u65E0\u6CD5\u751F\u6548\u3002")),o.createElement("div",{className:"hc-section"},o.createElement("div",{className:"hc-section__title",style:{display:"flex",justifyContent:"space-between"}},o.createElement("span",null,"\u670D\u52A1\u5668\uFF08",e.length,"\uFF09"),o.createElement("button",{type:"button",className:"hc-tab",onClick:()=>t(va()),style:{height:20,padding:"0 8px",textTransform:"none"}},o.createElement(gt,{size:12})," \u5237\u65B0")),e.length===0?o.createElement(de,{icon:o.createElement(_r,{size:48}),title:"\u6CA1\u6709\u8BFB\u5230\u670D\u52A1\u5668",subtitle:"\u7B49 Discord \u52A0\u8F7D\u5B8C\u6210\u540E\u70B9\u4E0A\u9762\u7684\u5237\u65B0\uFF0C\u6216\u7A0D\u540E\u518D\u6765\u3002"}):o.createElement("div",{className:"hc-section__body",style:{opacity:i?1:.5,pointerEvents:i?"auto":"none"}},e.map(u=>o.createElement("div",{className:"hc-cell hc-cell--row",key:u.id},o.createElement("div",{className:"hc-cell__main"},o.createElement("div",{className:"hc-cell__label"},u.name),o.createElement("div",{className:"hc-cell__desc"},u.id)),o.createElement(Z,{checked:n.includes(u.id),onChange:()=>l(u.id),"aria-label":`\u76D1\u63A7 ${u.name}`}))))),n.length>0&&o.createElement("div",{className:"hc-savebar"},o.createElement("span",{className:"hc-savebar__label"},"\u6B63\u5728\u76D1\u63A7 ",n.length," \u4E2A\u670D\u52A1\u5668"),o.createElement("div",{className:"hc-savebar__actions"},o.createElement(k,{size:"sm",variant:"destructive",onClick:()=>c([])},"\u5168\u90E8\u53D6\u6D88"))))}var Om=g("guild-monitor");function _d(){if(Oe.store.acknowledgedRisk!==!0)return[];let e=Oe.store.selectedGuilds;return Array.isArray(e)?e:[]}var xd=N({id:"guild-monitor",name:"\u670D\u52A1\u5668\u76D1\u63A7",description:"\u4E3B\u52A8\u8BA2\u9605\u9009\u5B9A\u670D\u52A1\u5668\u7684\u9891\u9053\uFF0C\u6355\u6349\u672A\u6253\u5F00\u9891\u9053\u91CC\u7684\u6D88\u606F\uFF08\u6709\u5C01\u53F7\u98CE\u9669\uFF0C\u9ED8\u8BA4\u5173\u95ED\uFF09\u3002",authors:[{name:"caitemm"}],category:"privacy",settings:Oe,page:{title:"\u76D1\u63A7",icon:$c,component:vd},start(){yd(_d);let e=_d().length;e>0&&Om.info(`monitoring ${e} guild(s)`)},stop(){ba()}});var Kt=D({order:{group:"\u9ED8\u8BA4\u53C2\u6570",type:"select",default:"desc",label:"\u6E05\u7406\u65B9\u5411",description:"\u53D7\u6761\u6570\u9650\u5236\u65F6\uFF0C\u4F18\u5148\u4ECE\u54EA\u4E00\u7AEF\u5F00\u59CB\u5220\u3002",options:[{value:"desc",label:"\u4ECE\u65B0\u5230\u8001"},{value:"asc",label:"\u4ECE\u8001\u5230\u65B0"}]},limit:{group:"\u9ED8\u8BA4\u53C2\u6570",type:"number",default:100,label:"\u6700\u591A\u5904\u7406\u6761\u6570",description:"\u5355\u6B21\u9884\u89C8 / \u5220\u9664\u7684\u4E0A\u9650\u3002",min:1,max:5e3,step:50},delayMs:{group:"\u9ED8\u8BA4\u53C2\u6570",type:"number",default:1600,label:"\u5220\u9664\u95F4\u9694\uFF08\u6BEB\u79D2\uFF09",description:"\u4E24\u6B21\u5220\u9664\u4E4B\u95F4\u7684\u7B49\u5F85\uFF0C\u592A\u5FEB\u4F1A\u89E6\u53D1\u9650\u901F\uFF0C\u5EFA\u8BAE\u4E0D\u4F4E\u4E8E 1000\u3002",min:300,max:3e4,step:100}});var jm=g("message-cleaner"),zm="https://discord.com/api/v10",kd=new Set,Fr=e=>new Promise(t=>setTimeout(t,e)),Bm=1420070400000n,wd=e=>String(BigInt(e.getTime())-Bm<<22n);function wa(){try{let e=window.webpackChunkdiscord_app;if(Array.isArray(e)){let t=null;if(e.push([[Symbol()],{},n=>{for(let r of Object.keys(n.m||{}))try{for(let i of[n(r),n(r)?.default])if(i&&typeof i.getToken=="function"){let a=i.getToken();if(a&&a.length>20){t=a;return}}}catch{}}]),t)return t}}catch{}try{let e=window.localStorage.getItem("token");if(e)return e.replace(/^"|"$/g,"")}catch{}return null}async function pe(e,t,n={},r=0){let i;try{i=await fetch(zm+t,{...n,headers:{Authorization:e,"Content-Type":"application/json",...n.headers||{}}})}catch(s){if(r<5)return await Fr(3e3),pe(e,t,n,r+1);throw new Error(`\u7F51\u7EDC\u8BF7\u6C42\u5931\u8D25: ${s.message}`)}if(i.status===429){let s=await i.json().catch(()=>({})),c=s.retry_after?Math.ceil(Number(s.retry_after)*1e3):Math.pow(2,r)*1e3;if(r<5)return await Fr(c+500),pe(e,t,n,r+1);throw new Error("\u89E6\u53D1\u9650\u901F\u4E14\u91CD\u8BD5\u6B21\u6570\u8017\u5C3D\u3002")}if(!i.ok){let s=await i.text().catch(()=>"");throw new Error(`API ${i.status}: ${s.slice(0,120)}`)}if(i.status===204)return null;let a=await i.json();return i.status===202?{...a,indexing:!0}:a}async function Sa(e){let t=await pe(e,"/users/@me");if(!t?.id)throw new Error("\u65E0\u6CD5\u901A\u8FC7 Token \u83B7\u53D6\u8D26\u53F7\u4FE1\u606F\uFF0C\u8BF7\u68C0\u67E5 Token \u662F\u5426\u6709\u6548\u3002");return String(t.id)}function qr(){try{let e=location.pathname.match(/\/channels\/(\d{15,25}|@me)\/(\d{15,25})/);return e?{guildId:e[1],channelId:e[2],serverWide:!1}:null}catch{return null}}var xa=null;function Ed(e){xa=e}function Id(){let e=xa;return xa=null,e}var tt=/^\d{15,25}$/;async function Nd(e,t){if(!tt.test(t))return null;try{return(await pe(e,`/guilds/${t}`))?.name??null}catch{return null}}async function Cd(e,t){if(!tt.test(t))return null;try{let n=await pe(e,`/channels/${t}`);return n?{name:n.name||(Array.isArray(n.recipients)?n.recipients.map(i=>i.global_name||i.username).join("\u3001"):"")||"\u672A\u77E5\u9891\u9053",guildId:n.guild_id?String(n.guild_id):null}:null}catch{return null}}async function Td(e){let t=await pe(e,"/users/@me/guilds");return Array.isArray(t)?t.map(n=>({id:String(n.id),name:n.name??"\u672A\u77E5",icon:n.icon??null})):[]}async function ka(e,t){if(t==="@me"){let r=await pe(e,"/users/@me/channels");return Array.isArray(r)?r.map(i=>{let a=i.name||(Array.isArray(i.recipients)?i.recipients.map(s=>s.global_name||s.username).join("\u3001"):"")||"\u672A\u77E5\u79C1\u804A";return{id:String(i.id),name:a,type:i.type??1}}):[]}let n=await pe(e,`/guilds/${t}/channels`);return Array.isArray(n)?n.filter(r=>r.type!==4).map(r=>({id:String(r.id),name:r.name??"\u672A\u77E5",type:r.type??0})):[]}var Um=25,Sd=1200,Gm=10,Hm=3;function Fm(e){return typeof e!="number"?!0:e===0||e>=6&&e<=21}async function Ad(e,t){let n=t.guildId.trim(),r=t.channelId.trim();if(t.serverWide||!r){if(!tt.test(n))throw new Error("\u5168\u670D\u68C0\u7D22\u9700\u8981\u6709\u6548\u7684\u670D\u52A1\u5668 ID\u3002");return{path:`/guilds/${n}/messages/search`}}if(!tt.test(r))throw new Error("\u8BF7\u586B\u5199\u6709\u6548\u7684\u9891\u9053 ID\u3002");if(!n){let i=await pe(e,`/channels/${r}`);if(!i?.id)throw new Error("\u672A\u83B7\u53D6\u5230\u9891\u9053\u4FE1\u606F\uFF0C\u8BF7\u68C0\u67E5\u9891\u9053 ID\u3002");n=i.guild_id?String(i.guild_id):"@me"}if(n==="@me")return{path:`/channels/${r}/messages/search`};if(!tt.test(n))throw new Error("\u8BF7\u586B\u5199\u6709\u6548\u7684\u670D\u52A1\u5668 ID\u3002");return{path:`/guilds/${n}/messages/search`,channelId:r}}function Md(e,t){let n=new URLSearchParams({author_id:t,include_nsfw:"true"});return e.channelId&&n.set("channel_id",e.channelId),n}function Pd(e){return e?.indexing===!0||e?.code===11e4||e?.message==="Indexing"}function Ld(e){let t=e?.total_results;return typeof t=="number"&&Number.isFinite(t)&&t>=0?t:null}async function _a(e,t){for(;e>0&&!t.stopped;){let n=Math.min(e,250);await Fr(n),e-=n}}async function $d(e,t,n,r,i){let a=[];if(i.stopped)return a;if(!t.serverWide&&!t.channelId.trim())throw new Error("\u8BF7\u586B\u5199\u9891\u9053 ID\uFF0C\u6216\u5F00\u542F\u5168\u670D\u68C0\u7D22\u3002");for(let U of[t.after,t.before])if(U&&!Number.isFinite(U.getTime()))throw new Error("\u8BF7\u586B\u5199\u6709\u6548\u7684\u65F6\u95F4\u8303\u56F4\u3002");let s=t.afterId?.trim()||"",c=t.beforeId?.trim()||"";for(let U of[s,c])if(U&&!tt.test(U))throw new Error("\u6D88\u606F\u533A\u95F4\u9700\u8981\u586B\u5199\u6709\u6548\u7684\u6D88\u606F ID\u3002");let l=s?null:t.after,d=c?null:t.before,u=s?BigInt(s):l?BigInt(wd(l)):null,h=c?BigInt(c):d?BigInt(wd(d)):null;if(u!==null&&h!==null&&u>=h)throw new Error(s||c?"\u6D88\u606F\u533A\u95F4\u7684\u8D77\u70B9\u5FC5\u987B\u65E9\u4E8E\u7EC8\u70B9\u3002":"\u8D77\u59CB\u65F6\u95F4\u5FC5\u987B\u65E9\u4E8E\u7ED3\u675F\u65F6\u95F4\u3002");let f=null;if(t.pattern?.trim())try{f=new RegExp(t.pattern.trim(),"i")}catch{throw new Error("\u6B63\u5219\u8868\u8FBE\u5F0F\u65E0\u6548\uFF0C\u8BF7\u68C0\u67E5\u7B5B\u9009\u6761\u4EF6\u3002")}let v=await Ad(e,t),x=Md(v,n);t.content?.trim()&&x.set("content",t.content.trim()),t.hasLink&&x.append("has","link"),t.hasFile&&x.append("has","file"),x.set("sort_by","timestamp"),x.set("sort_order",t.order),u!==null&&x.set("min_id",String(u)),h!==null&&x.set("max_id",String(h));let L=new Set,m=t.serverWide?"":t.channelId.trim(),b=0,E=1,z=0,we=0;for(;a.length<t.limit&&!i.stopped&&(x.set("offset",String(b)),r("\u68C0\u7D22\u4E2D",`\u6B63\u5728\u8BF7\u6C42\u7B2C ${E} \u9875\uFF08offset ${b}\uFF09\uFF0C\u4EC5\u641C\u7D22\u4F60\u7684\u6D88\u606F\u2026`),!i.stopped);){let U=await pe(e,`${v.path}?${x}`);if(i.stopped)break;if(Pd(U)){if(++z>=Gm)throw new Error("\u641C\u7D22\u7D22\u5F15\u4ECD\u672A\u5C31\u7EEA\uFF0C\u8BF7\u7A0D\u540E\u91CD\u65B0\u9884\u89C8\u3002");let ie=Number(U.retry_after),$=Number.isFinite(ie)&&ie>0?Math.ceil(ie*1e3):1e3;r("\u5EFA\u7ACB\u7D22\u5F15\u4E2D",`Discord \u6B63\u5728\u5EFA\u7ACB\u641C\u7D22\u7D22\u5F15\uFF0C${($/1e3).toFixed(1)} \u79D2\u540E\u91CD\u8BD5\u2026`),await _a($,i);continue}if(z=0,!Array.isArray(U?.messages))throw new Error("\u641C\u7D22\u54CD\u5E94\u7F3A\u5C11\u6D88\u606F\u5217\u8868\uFF0C\u8BF7\u7A0D\u540E\u91CD\u65B0\u9884\u89C8\u3002");let q=Ld(U);if(U.messages.length===0&&q!==null&&b<q){if(++we>=Hm)throw new Error(`\u641C\u7D22\u547D\u4E2D ${q} \u6761\uFF0C\u4F46\u5206\u9875\u4ECD\u4E3A\u7A7A\uFF0C\u8BF7\u7A0D\u540E\u91CD\u65B0\u9884\u89C8\u3002`);r("\u7D22\u5F15\u540C\u6B65\u4E2D",`\u641C\u7D22\u547D\u4E2D ${q} \u6761\uFF0C\u5F53\u524D\u5206\u9875\u6682\u672A\u8FD4\u56DE\uFF0C\u7A0D\u540E\u81EA\u52A8\u91CD\u8BD5\u2026`),await _a(Sd,i);continue}we=0;let ht=0,I=0,fe=0;for(let ie of U.messages){if(!Array.isArray(ie))throw new Error("\u641C\u7D22\u54CD\u5E94\u7684\u6D88\u606F\u5206\u7EC4\u683C\u5F0F\u5F02\u5E38\u3002");for(let $ of ie){if($?.hit!==!0||!tt.test($.id)||(ht++,L.has($.id)))continue;L.add($.id),I++;let Mt=new Date($.timestamp).getTime();if($.author?.id!==n||!tt.test($.channel_id)||m&&$.channel_id!==m||kd.has($.id)||!Number.isFinite(Mt)||l&&Mt<l.getTime()||d&&Mt>d.getTime()||s&&BigInt($.id)<=BigInt(s)||c&&BigInt($.id)>=BigInt(c)||!Fm($.type)||$.pinned===!0&&!t.includePinned||f&&!f.test($.content??"")){fe++;continue}if(a.push({id:$.id,channelId:$.channel_id,content:$.content??"",timestamp:$.timestamp,pinned:$.pinned===!0,attachments:Array.isArray($.attachments)?$.attachments.length:0,embeds:Array.isArray($.embeds)?$.embeds.length:0,stickers:Array.isArray($.sticker_items)?$.sticker_items.map(Qo=>Qo?.name||"\u8D34\u7EB8"):[]}),a.length>=t.limit)break}if(a.length>=t.limit)break}if(ht>0&&I===0)throw new Error("\u641C\u7D22\u63A5\u53E3\u8FD4\u56DE\u91CD\u590D\u5206\u9875\uFF0C\u8BF7\u7A0D\u540E\u91CD\u65B0\u9884\u89C8\u3002");if(r("\u68C0\u7D22\u4E2D",`\u7B2C ${E} \u9875 \xB7 \u641C\u7D22\u547D\u4E2D ${q??"\u672A\u77E5"} \u6761\uFF0C\u5DF2\u627E\u5230 ${a.length} \u6761${fe?`\uFF08\u672C\u9875\u8FC7\u6EE4 ${fe} \u6761\u4E0D\u7B26\u5408\u6761\u4EF6\u7684\u7ED3\u679C\uFF09`:""}`),b+=U.messages.length,U.messages.length===0||a.length>=t.limit||(q!==null?b>=q:U.messages.length<Um))break;E++,await _a(Sd,i)}return a}async function Dd(e,t,n,r,i,a){let s=0,c=0;for(let l of t){if(i.stopped)break;let d=Date.now();try{await pe(e,`/channels/${l.channelId||n.channelId}/messages/${l.id}`,{method:"DELETE"}),s++,a?.(l,!0)}catch(h){c++,String(h?.message??"").includes("404")||kd.add(l.id),jm.warn(`skip ${l.id}: ${h?.message??h}`);let f=String(h?.message??h);a?.(l,!1,f.includes("50083")?"\u6240\u5728\u5E16\u5B50\u5DF2\u5F52\u6863\uFF0C\u65E0\u6CD5\u5220\u9664":f)}r("\u5220\u9664\u4E2D",`\u5DF2\u5220\u9664 ${s} / ${t.length}${c?`\uFF08\u8DF3\u8FC7 ${c}\uFF09`:""}`);let u=Date.now()-d;u<n.delayMs&&await Fr(n.delayMs-u)}return{deleted:s,skipped:c}}async function Od(e,t,n){let r=await Ad(e,t),i=await pe(e,`${r.path}?${Md(r,n)}`);if(Pd(i))return{total:0,indexing:!0};let a=Ld(i);if(a===null)throw new Error("\u641C\u7D22\u54CD\u5E94\u7F3A\u5C11\u53D1\u8A00\u603B\u6570\uFF0C\u8BF7\u7A0D\u540E\u91CD\u65B0\u7EDF\u8BA1\u3002");return{total:a,indexing:!1}}var jd="hc-cleaner-picking",qm='[id^="chat-messages-"], [id^="message-content-"]';function zd(e){let t=()=>{};return{promise:new Promise(r=>{let i=document.createElement("div");i.className="hc-cleaner-pickhint",i.textContent=`${e}\uFF08\u6309 Esc \u53D6\u6D88\uFF09`,document.body.appendChild(i),document.body.classList.add(jd);let a=l=>{let d=l.target?.closest?.(qm);d&&(l.preventDefault(),l.stopPropagation(),l.stopImmediatePropagation(),t(d.id.match(/(\d{15,25})$/)?.[1]??null))},s=l=>{l.key==="Escape"&&(l.preventDefault(),l.stopPropagation(),l.stopImmediatePropagation(),t(null))},c=!1;t=l=>{c||(c=!0,window.removeEventListener("click",a,!0),window.removeEventListener("keydown",s,!0),document.body.classList.remove(jd),i.remove(),r(l))},window.addEventListener("click",a,!0),window.addEventListener("keydown",s,!0)}),cancel:()=>t(null)}}var Bd=g("message-cleaner"),Ud=500;function St(e){return String(e).padStart(2,"0")}function Km(e){return`${St(e.getHours())}:${St(e.getMinutes())}:${St(e.getSeconds())}`}function Vm(e){return/失败|错误|无效|不可用/.test(e)?"error":/停止|跳过|索引|限速|重试/.test(e)?"warn":/完成|已删除|成功/.test(e)?"success":"info"}function Wm(e){let t=new Date(e);return Number.isNaN(t.getTime())?"":`${St(t.getMonth()+1)}-${St(t.getDate())} ${St(t.getHours())}:${St(t.getMinutes())}`}var In=200,Ym=/<(a?):(\w+):(\d{15,25})>/g;function Jm(e){let t=[],n=0;for(let r of e.matchAll(Ym)){let i=r.index??0;i>n&&t.push(e.slice(n,i)),t.push(o.createElement("img",{key:`${i}-${r[3]}`,className:"hc-cleaner__emoji",src:`https://cdn.discordapp.com/emojis/${r[3]}.${r[1]?"gif":"webp"}?size=32`,alt:`:${r[2]}:`,title:`:${r[2]}:`})),n=i+r[0].length}return n<e.length&&t.push(e.slice(n)),t}function Rm(e){let t=[];e.pinned&&t.push("\u7F6E\u9876"),e.attachments&&t.push(`\u9644\u4EF6\xD7${e.attachments}`);for(let n of e.stickers)t.push(`\u8D34\u7EB8 ${n}`);return e.embeds&&t.push(`\u5D4C\u5165\xD7${e.embeds}`),t}function Gd(){let[e,t]=y(""),[n,r]=y(""),[i,a]=y(""),[s,c]=y(!1),[l,d]=y(""),[u,h]=y(""),[f,v]=y(""),[x,L]=y(""),[m,b]=y(""),[E,z]=y(""),we=se(null),U=se(null),[q,ht]=y(""),[I,fe]=y(!1),[ie,$]=y(!1),[Mt,Qo]=y(!1),[Ps,fp]=y(""),[Ls,mp]=y(Kt.store.order),[Zo,Qn]=y("idle"),[pt,$s]=y([]),[ei,Zn]=y(new Set),[Ds,Os]=y(""),[er,tr]=y(In),[gp,yp]=y({}),ti=p=>{$s(p),Zn(new Set),Os(""),tr(In)},[bp,js]=y("\u5F85\u673A"),[zs,Bs]=y("\u5148\u83B7\u53D6 Token\uFF0C\u9009\u597D\u8303\u56F4\u5E76\u9884\u89C8\uFF0C\u786E\u8BA4\u540E\u518D\u5220\u9664\u3002"),[Us,ni]=y(null),[vp,ri]=y(!1),[_p,xp]=y([]),[Gs,Hs]=y([]),[oi,ii]=y("guilds"),[wp,Sp]=y(""),[Fs,kp]=y(""),[Ep,nr]=y(!1),[qs,rr]=y(""),ft=se({stopped:!1}),me=Zo!=="idle",[rn,Ks]=y([]),[Vs,Ws]=y(!0),Ip=se(0),ai=se(null),Pt=(p,_)=>{let S={id:++Ip.current,time:Km(new Date),level:p,text:_};Ks(w=>{let G=[...w,S];return G.length>Ud?G.slice(G.length-Ud):G})},A=(p,_)=>{js(p),Bs(_),p!=="\u5220\u9664\u4E2D"&&Pt(Vm(p),_?`${p} \u2014 ${_}`:p)};C(()=>{let p=ai.current;p&&Vs&&(p.scrollTop=p.scrollHeight)},[rn,Vs]);let Np=()=>{let p=ai.current;p&&Ws(p.scrollHeight-p.scrollTop-p.clientHeight<24)};C(()=>{let p=Id();p&&(r(p.guildId),a(p.channelId),c(p.serverWide));let _=wa();_?(t(_),js("\u5DF2\u83B7\u53D6 Token"),Bs(p?"\u5DF2\u586B\u5165\u5F53\u524D\u9891\u9053\uFF0C\u53EF\u76F4\u63A5\u9884\u89C8\u3002":"\u53EF\u70B9\u51FB\u300C\u5217\u8868\u300D\u9009\u62E9\u9891\u9053\uFF0C\u6216\u624B\u52A8\u586B\u5199 ID\u3002"),Pt("info",p?`\u5DF2\u83B7\u53D6 Token\uFF0C\u76EE\u6807\u9891\u9053 ${p.channelId}`:"\u5DF2\u83B7\u53D6 Token")):Pt("warn","\u672A\u81EA\u52A8\u83B7\u53D6\u5230 Token\uFF0C\u8BF7\u624B\u52A8\u7C98\u8D34\u3002")},[]),C(()=>{let p=e.trim(),_=n.trim();if(d(""),!p||!/^\d{15,25}$/.test(_))return;let S=!0,w=setTimeout(()=>{Nd(p,_).then(G=>{S&&G&&d(G)}).catch(()=>{})},400);return()=>{S=!1,clearTimeout(w)}},[e,n]),C(()=>{let p=e.trim(),_=i.trim();if(h(""),!p||!/^\d{15,25}$/.test(_))return;let S=!0,w=setTimeout(()=>{Cd(p,_).then(G=>{!S||!G||(h(G.name),G.guildId&&r(He=>He.trim()?He:G.guildId))}).catch(()=>{})},400);return()=>{S=!1,clearTimeout(w)}},[e,i]);let on=()=>{let p=e.trim();if(!p)throw new Error("\u8BF7\u5148\u83B7\u53D6\u6216\u586B\u5165 Token\u3002");return p},Ys=()=>({guildId:n.trim(),channelId:s?"":i.trim(),serverWide:s,order:Ls,limit:Kt.store.limit,delayMs:Kt.store.delayMs,after:f?new Date(f):null,before:x?new Date(x):null,content:q.trim(),hasLink:I,hasFile:ie,includePinned:Mt,pattern:Ps.trim(),afterId:m.trim(),beforeId:E.trim()});C(()=>()=>U.current?.cancel(),[]);let Js=async p=>{let _=we.current?.closest(".hc-overlay");if(!_){A("\u65E0\u6CD5\u9009\u53D6","\u5F53\u524D\u754C\u9762\u65E0\u6CD5\u4E34\u65F6\u9690\u85CF\uFF0C\u8BF7\u624B\u52A8\u7C98\u8D34\u6D88\u606F ID\uFF08\u53F3\u952E\u6D88\u606F \u2192 \u590D\u5236\u6D88\u606F ID\uFF09\u3002");return}_.style.display="none";let S=zd(p==="after"?"\u70B9\u51FB\u4E00\u6761\u6D88\u606F\uFF1A\u53EA\u6E05\u7406\u5B83\u4E4B\u540E\u7684\u6D88\u606F":"\u70B9\u51FB\u4E00\u6761\u6D88\u606F\uFF1A\u53EA\u6E05\u7406\u5B83\u4E4B\u524D\u7684\u6D88\u606F");U.current=S;let w=await S.promise;if(U.current=null,_.style.display="",!w){A("\u5DF2\u53D6\u6D88\u9009\u53D6","");return}p==="after"?b(w):z(w),A("\u5DF2\u9009\u53D6\u6D88\u606F",`${p==="after"?"\u8D77\u70B9":"\u7EC8\u70B9"}\u6D88\u606F ID ${w}\uFF08\u8BE5\u6D88\u606F\u672C\u8EAB\u4E0D\u4F1A\u88AB\u5220\u9664\uFF09`)},or=Ds.trim().toLowerCase(),Ge=or?pt.filter(p=>p.content.toLowerCase().includes(or)||p.id.includes(or)):pt,ir=pt.filter(p=>!ei.has(p.id)),Cp=p=>Zn(_=>{let S=new Set(_);return S.delete(p)||S.add(p),S}),si=p=>Zn(_=>{let S=new Set(_);for(let w of Ge)p==="none"||p==="invert"&&!_.has(w.id)?S.add(w.id):S.delete(w.id);return S}),Tp=()=>{let p=wa();p?(t(p),A("Token \u5DF2\u83B7\u53D6","\u53EF\u70B9\u51FB\u300C\u5217\u8868\u300D\u9009\u62E9\u9891\u9053\u3002")):A("\u83B7\u53D6\u5931\u8D25","\u8BF7\u624B\u52A8\u7C98\u8D34 Token\u3002")},Ap=()=>{let p=qr();if(!p){A("\u65E0\u6CD5\u8BFB\u53D6","\u5F53\u524D\u4E0D\u5728\u67D0\u4E2A\u9891\u9053/\u79C1\u4FE1\u9875\u9762\u3002");return}r(p.guildId),a(p.channelId),c(!1),A("\u5DF2\u586B\u5165\u5F53\u524D\u9891\u9053",`\u670D\u52A1\u5668 ${p.guildId} \xB7 \u9891\u9053 ${p.channelId}`)},Mp=async()=>{let p;try{p=on()}catch(_){A("\u9700\u8981 Token",_.message);return}ri(!0),ii("guilds"),Hs([]),rr(""),nr(!0);try{let _=await Td(p);xp([{id:"@me",name:"\u79C1\u4FE1\u4E0E\u7FA4\u804A (DMs)",icon:null},..._])}catch(_){rr(_.message??String(_))}finally{nr(!1)}},Rs=async p=>{let _;try{_=on()}catch(S){A("\u9700\u8981 Token",S.message);return}Sp(p.id),kp(p.name),ii("channels"),rr(""),nr(!0);try{let S=await ka(_,p.id),w=p.id==="@me"?S:[{id:"",name:"\u2500\u2500 \u5168\u670D\u626B\u63CF\uFF08\u4E0D\u9650\u9891\u9053\uFF09\u2500\u2500",type:-1},...S];Hs(w)}catch(S){rr(S.message??String(S))}finally{nr(!1)}},Xs=p=>{r(wp),ti([]),ni(null),p.id?(c(!1),a(p.id)):(c(!0),a("")),ri(!1),A("\u5DF2\u9009\u62E9",`${Fs} \u2192 ${p.name||"\u5168\u670D"}`)},Pp=()=>{let p=new Date;p.setMinutes(p.getMinutes()-p.getTimezoneOffset()),L(p.toISOString().slice(0,16))},Lp=async()=>{let p;try{p=on()}catch(w){A("\u5931\u8D25",w.message);return}let _;try{_=await Sa(p)}catch(w){A("\u5931\u8D25",w.message);return}let S=Ys();if(S.serverWide&&(!S.guildId||S.guildId==="@me")){A("\u5931\u8D25","\u5168\u670D\u626B\u63CF\u9700\u8981\u586B\u5199\u670D\u52A1\u5668 ID\u3002");return}if(!S.serverWide&&!S.channelId){A("\u5931\u8D25","\u8BF7\u586B\u5199\u9891\u9053 ID\uFF0C\u6216\u6539\u7528\u5168\u670D\u626B\u63CF\u3002");return}if(S.after&&S.before&&S.after>=S.before){A("\u5931\u8D25","\u8D77\u59CB\u65F6\u95F4\u5FC5\u987B\u65E9\u4E8E\u7ED3\u675F\u65F6\u95F4\u3002");return}ft.current={stopped:!1},Qn("previewing"),ti([]),A("\u9884\u89C8\u4E2D","\u6B63\u5728\u641C\u7D22\u4F60\u5728\u6240\u9009\u8303\u56F4\u5185\u7684\u6D88\u606F\u2026");try{let w=await $d(p,S,_,A,ft.current);ti(w),A(ft.current.stopped?"\u5DF2\u505C\u6B62":"\u9884\u89C8\u5B8C\u6210",`\u627E\u5230 ${w.length} \u6761\u4F60\u7684\u6D88\u606F\u3002\u9ED8\u8BA4\u5168\u90E8\u52FE\u9009\uFF0C\u53D6\u6D88\u52FE\u9009\u5373\u53EF\u4FDD\u7559\u3002`),S.serverWide&&w.length>0&&ka(p,S.guildId).then(G=>yp(Object.fromEntries(G.map(He=>[He.id,He.name])))).catch(()=>{})}catch(w){A("\u5931\u8D25",w.message??String(w)),Bd.error("preview failed",w)}finally{Qn("idle")}},$p=async()=>{if(pt.length===0){A("\u8BF7\u5148\u9884\u89C8","");return}let p=ir;if(p.length===0){A("\u672A\u52FE\u9009\u6D88\u606F","\u8BF7\u81F3\u5C11\u52FE\u9009\u4E00\u6761\u8981\u5220\u9664\u7684\u6D88\u606F\u3002");return}let _;try{_=on()}catch(ae){A("\u5931\u8D25",ae.message);return}let S=Ys();ft.current={stopped:!1},Qn("deleting");let w=pt.length-p.length;Pt("info",`\u5F00\u59CB\u5220\u9664\u5DF2\u52FE\u9009\u7684 ${p.length} \u6761${w?`\uFF0C\u4FDD\u7559\u672A\u52FE\u9009\u7684 ${w} \u6761`:""}\u3002`),A("\u5220\u9664\u4E2D",`0 / ${p.length}`);let G=new Set,He=new Set;try{let ae=await Dd(_,p,S,A,ft.current,(ge,an,Op)=>{let Zs=ge.content.trim().replace(/\s+/g," ").slice(0,80);an?(G.add(ge.id),Pt("success",`\u5DF2\u5220\u9664 ${ge.id}${Zs?` \xB7 ${Zs}`:"\uFF08\u65E0\u6587\u672C\uFF09"}`)):(He.add(ge.id),Pt("warn",`\u8DF3\u8FC7 ${ge.id} \xB7 ${Op??"\u672A\u77E5\u9519\u8BEF"}`))});A(ft.current.stopped?"\u5DF2\u505C\u6B62":"\u5B8C\u6210",`\u5DF2\u5220\u9664 ${ae.deleted} \u6761${ae.skipped?`\uFF0C\u8DF3\u8FC7 ${ae.skipped} \u6761`:""}${w?`\uFF0C\u4FDD\u7559 ${w} \u6761`:""}\u3002`)}catch(ae){A("\u5931\u8D25",ae.message??String(ae)),Bd.error("delete failed",ae)}finally{$s(ae=>ae.filter(ge=>!G.has(ge.id))),Zn(ae=>{let ge=new Set(ae);for(let an of G)ge.delete(an);for(let an of He)ge.add(an);return ge}),Qn("idle")}},Qs=()=>{ft.current.stopped=!0,A("\u505C\u6B62\u4E2D","\u7B49\u5F85\u5F53\u524D\u8BF7\u6C42\u7ED3\u675F\u2026")},Dp=async()=>{let p;try{p=on()}catch(w){A("\u5931\u8D25",w.message);return}let _;try{_=await Sa(p)}catch(w){A("\u5931\u8D25",w.message);return}let S={guildId:n.trim(),channelId:s?"":i.trim(),serverWide:s};ni(null),A("\u7EDF\u8BA1\u4E2D","\u8C03\u7528\u641C\u7D22\u63A5\u53E3\u2026");try{let w=await Od(p,S,_);if(w.indexing){A("\u5EFA\u7ACB\u7D22\u5F15\u4E2D","Discord \u6B63\u5728\u5EFA\u7ACB\u7D22\u5F15\uFF0C\u7A0D\u540E\u518D\u8BD5\u3002");return}ni(w.total),A("\u7EDF\u8BA1\u5B8C\u6210",`\u5171 ${w.total} \u6761\u53D1\u8A00\u3002`)}catch(w){A("\u5931\u8D25",w.message??String(w))}};return vp?o.createElement("div",{className:"hc-cleaner"},o.createElement("div",{className:"hc-cleaner__picker-head"},oi==="channels"&&o.createElement(k,{size:"sm",variant:"plain",onClick:()=>ii("guilds")},"\u2190 \u8FD4\u56DE"),o.createElement("span",{className:"hc-cleaner__picker-title"},oi==="guilds"?"\u9009\u62E9\u670D\u52A1\u5668":Fs),o.createElement(k,{size:"sm",variant:"plain",onClick:()=>ri(!1)},"\u2715")),o.createElement("div",{className:"hc-cleaner__picker-list"},Ep?o.createElement("div",{className:"hc-cleaner__picker-empty"},"\u6B63\u5728\u52A0\u8F7D\u2026"):qs?o.createElement("div",{className:"hc-cleaner__picker-empty hc-cleaner__picker-empty--error"},"\u52A0\u8F7D\u5931\u8D25\uFF1A",qs):oi==="guilds"?_p.map(p=>o.createElement("div",{key:p.id,className:"hc-cleaner__picker-item",onClick:()=>Rs(p),role:"button",tabIndex:0,onKeyDown:_=>{_.key==="Enter"&&Rs(p)}},o.createElement("div",{className:"hc-cleaner__picker-icon"},p.icon?o.createElement("img",{src:`https://cdn.discordapp.com/icons/${p.id}/${p.icon}.png?size=64`,alt:""}):p.name.charAt(0)),o.createElement("div",{className:"hc-cleaner__picker-name"},p.name))):Gs.length===0?o.createElement("div",{className:"hc-cleaner__picker-empty"},"\u6B64\u670D\u52A1\u5668\u6682\u65E0\u9891\u9053\uFF0C\u53EF\u624B\u52A8\u586B\u5199\u9891\u9053 ID\u3002"):Gs.map(p=>o.createElement("div",{key:p.id||"server-wide",className:"hc-cleaner__picker-item",onClick:()=>Xs(p),role:"button",tabIndex:0,onKeyDown:_=>{_.key==="Enter"&&Xs(p)}},o.createElement("div",{className:"hc-cleaner__picker-icon"},p.id?"#":"\u{1F310}"),o.createElement("div",{className:"hc-cleaner__picker-name"},p.name))))):o.createElement("div",{className:"hc-cleaner",ref:we},o.createElement("div",{className:"hc-inline-note hc-inline-note--danger"},o.createElement(Ye,{size:18}),o.createElement("span",null,"\u53EA\u5220\u9664",o.createElement("strong",null,"\u4F60\u81EA\u5DF1"),"\u53D1\u9001\u7684\u6D88\u606F\u3002\u5EFA\u8BAE\u5148\u9884\u89C8\uFF0C\u786E\u8BA4\u8303\u56F4\u540E\u518D\u5220\u9664\u3002")),o.createElement(R,{title:"Token"},o.createElement("div",{className:"hc-cell"},o.createElement("div",{className:"hc-cell--row"},o.createElement("div",{className:"hc-cell__main"},o.createElement("div",{className:"hc-cell__label"},"Discord Token"),o.createElement("div",{className:"hc-cell__desc"},"\u4EE3\u8868\u4F60\u7684\u8D26\u53F7\u6743\u9650\uFF0C\u4E0D\u8981\u6CC4\u9732\u7ED9\u4EFB\u4F55\u4EBA\u3002")),o.createElement(k,{size:"sm",variant:"secondary",icon:o.createElement(gt,{size:16}),onClick:Tp},"\u81EA\u52A8")),o.createElement("div",{className:"hc-cell__control"},o.createElement(J,{value:e,onChange:t,placeholder:"\u81EA\u52A8\u586B\u5165\u6216\u624B\u52A8\u7C98\u8D34",type:"password"})))),o.createElement(R,{title:"\u8303\u56F4"},o.createElement("div",{className:"hc-cell hc-cell--row"},o.createElement("div",{className:"hc-cell__main"},o.createElement("div",{className:"hc-cell__label"},"\u5168\u670D\u626B\u63CF"),o.createElement("div",{className:"hc-cell__desc"},"\u5FFD\u7565\u9891\u9053\uFF0C\u626B\u63CF\u6574\u4E2A\u670D\u52A1\u5668\uFF08\u8D70\u641C\u7D22\u63A5\u53E3\uFF0C\u8F83\u6162\uFF09\u3002")),o.createElement(Z,{checked:s,onChange:c,"aria-label":"\u5168\u670D\u626B\u63CF"})),o.createElement("div",{className:"hc-cell"},o.createElement("div",{className:"hc-cell--row"},o.createElement("div",{className:"hc-cell__main"},o.createElement("div",{className:"hc-cell__label"},"\u670D\u52A1\u5668 ID",l&&o.createElement("span",{className:"hc-cleaner__resolved"},l)))),o.createElement("div",{className:"hc-cell__control"},o.createElement(J,{value:n,onChange:r,placeholder:"\u670D\u52A1\u5668 ID"}))),!s&&o.createElement("div",{className:"hc-cell"},o.createElement("div",{className:"hc-cell--row"},o.createElement("div",{className:"hc-cell__main"},o.createElement("div",{className:"hc-cell__label"},"\u9891\u9053 ID",u&&o.createElement("span",{className:"hc-cleaner__resolved"},u)))),o.createElement("div",{className:"hc-cell__control"},o.createElement(J,{value:i,onChange:a,placeholder:"\u9891\u9053 ID"}))),o.createElement("div",{className:"hc-cell hc-cell--row",style:{gap:"var(--hc-space-2)"}},o.createElement(k,{size:"sm",variant:"secondary",icon:o.createElement(_r,{size:16}),onClick:Mp,disabled:me},"\u5217\u8868"),o.createElement(k,{size:"sm",variant:"secondary",icon:o.createElement(Je,{size:16}),onClick:Ap,disabled:me},"\u5F53\u524D"))),o.createElement(R,{title:"\u65F6\u95F4\u8303\u56F4",note:"\u53EF\u9009\u3002\u7559\u7A7A\u8868\u793A\u4E0D\u9650\u5236\u8BE5\u65B9\u5411\u3002"},o.createElement("div",{className:"hc-cell"},o.createElement("div",{className:"hc-cell--row"},o.createElement("div",{className:"hc-cell__main"},o.createElement("div",{className:"hc-cell__label"},"\u8D77\u59CB\u65F6\u95F4"))),o.createElement("div",{className:"hc-cell__control"},o.createElement("input",{className:"hc-input",type:"datetime-local",value:f,onChange:p=>v(p.currentTarget.value)}))),o.createElement("div",{className:"hc-cell"},o.createElement("div",{className:"hc-cell--row"},o.createElement("div",{className:"hc-cell__main"},o.createElement("div",{className:"hc-cell__label"},"\u7ED3\u675F\u65F6\u95F4")),o.createElement(k,{size:"sm",variant:"plain",onClick:Pp},"\u540C\u6B65\u6700\u65B0")),o.createElement("div",{className:"hc-cell__control"},o.createElement("input",{className:"hc-input",type:"datetime-local",value:x,onChange:p=>L(p.currentTarget.value)})))),o.createElement(R,{title:"\u6D88\u606F\u533A\u95F4",note:"\u53EF\u9009\u3002\u53EA\u6E05\u7406\u4E24\u6761\u6D88\u606F\u4E4B\u95F4\u7684\u5185\u5BB9\uFF0C\u6240\u9009\u7684\u4E24\u6761\u6D88\u606F\u672C\u8EAB\u4E0D\u4F1A\u88AB\u5220\u3002\u586B\u4E86\u6D88\u606F ID \u7684\u4E00\u4FA7\u4F1A\u8986\u76D6\u4E0A\u9762\u5BF9\u5E94\u7684\u65F6\u95F4\u3002"},o.createElement("div",{className:"hc-cell"},o.createElement("div",{className:"hc-cell--row"},o.createElement("div",{className:"hc-cell__main"},o.createElement("div",{className:"hc-cell__label"},"\u5728\u6B64\u6D88\u606F\u4E4B\u540E")),o.createElement(k,{size:"sm",variant:"secondary",disabled:me,onClick:()=>Js("after")},"\u9009\u53D6")),o.createElement("div",{className:"hc-cell__control"},o.createElement(J,{value:m,onChange:b,placeholder:"\u8D77\u70B9\u6D88\u606F ID\uFF0C\u7559\u7A7A\u4E0D\u9650"}))),o.createElement("div",{className:"hc-cell"},o.createElement("div",{className:"hc-cell--row"},o.createElement("div",{className:"hc-cell__main"},o.createElement("div",{className:"hc-cell__label"},"\u5728\u6B64\u6D88\u606F\u4E4B\u524D")),o.createElement(k,{size:"sm",variant:"secondary",disabled:me,onClick:()=>Js("before")},"\u9009\u53D6")),o.createElement("div",{className:"hc-cell__control"},o.createElement(J,{value:E,onChange:z,placeholder:"\u7EC8\u70B9\u6D88\u606F ID\uFF0C\u7559\u7A7A\u4E0D\u9650"})))),o.createElement(R,{title:"\u7B5B\u9009",note:"\u53EF\u9009\u3002\u53EA\u9884\u89C8 / \u5220\u9664\u7B26\u5408\u6761\u4EF6\u7684\u6D88\u606F\uFF1B\u4FEE\u6539\u540E\u9700\u91CD\u65B0\u9884\u89C8\u3002"},o.createElement("div",{className:"hc-cell"},o.createElement("div",{className:"hc-cell--row"},o.createElement("div",{className:"hc-cell__main"},o.createElement("div",{className:"hc-cell__label"},"\u5305\u542B\u6587\u672C"))),o.createElement("div",{className:"hc-cell__control"},o.createElement(J,{value:q,onChange:ht,placeholder:"\u53EA\u627E\u5305\u542B\u8FD9\u6BB5\u6587\u5B57\u7684\u6D88\u606F"}))),o.createElement("div",{className:"hc-cell hc-cell--row"},o.createElement("div",{className:"hc-cell__main"},o.createElement("div",{className:"hc-cell__label"},"\u53EA\u8981\u5E26\u94FE\u63A5\u7684")),o.createElement(Z,{checked:I,onChange:fe,"aria-label":"\u53EA\u8981\u5E26\u94FE\u63A5\u7684"})),o.createElement("div",{className:"hc-cell hc-cell--row"},o.createElement("div",{className:"hc-cell__main"},o.createElement("div",{className:"hc-cell__label"},"\u53EA\u8981\u5E26\u6587\u4EF6\u7684")),o.createElement(Z,{checked:ie,onChange:$,"aria-label":"\u53EA\u8981\u5E26\u6587\u4EF6\u7684"})),o.createElement("div",{className:"hc-cell hc-cell--row"},o.createElement("div",{className:"hc-cell__main"},o.createElement("div",{className:"hc-cell__label"},"\u5305\u542B\u7F6E\u9876\u6D88\u606F"),o.createElement("div",{className:"hc-cell__desc"},"\u5173\u95ED\u65F6\u7F6E\u9876\u6D88\u606F\u4E0D\u4F1A\u8FDB\u5165\u9884\u89C8\uFF0C\u4E5F\u4E0D\u4F1A\u88AB\u5220\u9664\u3002")),o.createElement(Z,{checked:Mt,onChange:Qo,"aria-label":"\u5305\u542B\u7F6E\u9876\u6D88\u606F"})),o.createElement("div",{className:"hc-cell"},o.createElement("div",{className:"hc-cell--row"},o.createElement("div",{className:"hc-cell__main"},o.createElement("div",{className:"hc-cell__label"},"\u6B63\u5219\u5339\u914D"),o.createElement("div",{className:"hc-cell__desc"},"\u53EA\u4FDD\u7559\u6587\u672C\u5339\u914D\u8BE5\u6B63\u5219\u7684\u6D88\u606F\uFF08\u4E0D\u533A\u5206\u5927\u5C0F\u5199\uFF09\u3002"))),o.createElement("div",{className:"hc-cell__control"},o.createElement(J,{value:Ps,onChange:fp,placeholder:"\u4F8B\u5982 ^\u54C8+$"})))),o.createElement(R,{title:"\u65B9\u5411"},o.createElement("div",{className:"hc-cell hc-cell--row"},o.createElement("div",{className:"hc-cell__main"},o.createElement("div",{className:"hc-cell__label"},"\u6E05\u7406\u65B9\u5411")),o.createElement(pn,{value:Ls,onChange:mp,options:[{value:"desc",label:"\u4ECE\u65B0\u5230\u8001"},{value:"asc",label:"\u4ECE\u8001\u5230\u65B0"}]}))),o.createElement("div",{className:"hc-cleaner__actions"},Zo==="previewing"?o.createElement(k,{variant:"destructive",onClick:Qs},"\u505C\u6B62\u9884\u89C8"):o.createElement(k,{variant:"primary",icon:o.createElement(Pe,{size:16}),disabled:me,onClick:Lp},"\u9884\u89C8"),Zo==="deleting"?o.createElement(k,{variant:"destructive",onClick:Qs},"\u505C\u6B62\u5220\u9664"):o.createElement(k,{variant:"destructive",icon:o.createElement(ce,{size:16}),disabled:me||ir.length===0,onClick:$p},"\u5220\u9664\u5DF2\u9009\uFF08",ir.length,"\uFF09")),o.createElement("div",{className:"hc-cleaner__status"},o.createElement("div",{className:"hc-cleaner__status-state"},bp),zs&&o.createElement("div",{className:"hc-cleaner__status-detail"},zs)),o.createElement(R,{title:"\u8FD0\u884C\u65E5\u5FD7",note:"\u9884\u89C8\u4E0E\u5220\u9664\u7684\u6BCF\u4E00\u6B65\u90FD\u8BB0\u5728\u8FD9\u91CC\uFF0C\u53EF\u968F\u65F6\u6E05\u7A7A\u3002"},o.createElement("div",{className:"hc-cleaner__logbar"},o.createElement("span",{className:"hc-cleaner__logcount"},rn.length," \u6761"),o.createElement(k,{size:"sm",variant:"plain",disabled:rn.length===0,onClick:()=>{Ks([]),Ws(!0)}},"\u6E05\u7A7A")),o.createElement("div",{className:"hc-cleaner__log",ref:ai,onScroll:Np,role:"log","aria-live":"polite"},rn.length===0?o.createElement("div",{className:"hc-cleaner__log-empty"},"\u6682\u65E0\u65E5\u5FD7\u3002\u70B9\u300C\u9884\u89C8\u300D\u5F00\u59CB\u3002"):rn.map(p=>o.createElement("div",{className:"hc-cleaner__log-row","data-level":p.level,key:p.id},o.createElement("span",{className:"hc-cleaner__log-time"},p.time),o.createElement("span",{className:"hc-cleaner__log-level"},p.level.toUpperCase()),o.createElement("span",{className:"hc-cleaner__log-text"},p.text))))),pt.length>0&&o.createElement(R,{title:`\u9884\u89C8\u7ED3\u679C\uFF08\u5DF2\u9009 ${ir.length} / ${pt.length}\uFF09`,note:"\u52FE\u9009\u7684\u4F1A\u88AB\u5220\u9664\uFF1B\u60F3\u4FDD\u7559\u7684\u6D88\u606F\u53D6\u6D88\u52FE\u9009\u5373\u53EF\u3002"},o.createElement("div",{className:"hc-cleaner__listbar"},o.createElement(J,{value:Ds,onChange:p=>{Os(p),tr(In)},placeholder:"\u5728\u9884\u89C8\u4E2D\u67E5\u627E\u2026"}),o.createElement("div",{className:"hc-cleaner__listbar-actions"},o.createElement(k,{size:"sm",variant:"plain",disabled:me,onClick:()=>si("all")},"\u5168\u9009"),o.createElement(k,{size:"sm",variant:"plain",disabled:me,onClick:()=>si("none")},"\u5168\u4E0D\u9009"),o.createElement(k,{size:"sm",variant:"plain",disabled:me,onClick:()=>si("invert")},"\u53CD\u9009"))),or&&o.createElement("div",{className:"hc-cleaner__more"},"\u5339\u914D ",Ge.length," \u6761\uFF0C\u5168\u9009 / \u5168\u4E0D\u9009 / \u53CD\u9009\u53EA\u4F5C\u7528\u4E8E\u8FD9\u4E9B\u5339\u914D\u9879\u3002"),o.createElement("div",{className:"hc-cleaner__list"},Ge.length===0&&o.createElement("div",{className:"hc-cleaner__more"},"\u6CA1\u6709\u5339\u914D\u7684\u6D88\u606F\u3002"),Ge.slice(0,er).map(p=>{let _=p.content.trim(),S=Rm(p),w=s?gp[p.channelId]??`\u2026${p.channelId.slice(-6)}`:"";return o.createElement("label",{className:"hc-cleaner__item","data-off":ei.has(p.id),key:p.id},o.createElement("input",{className:"hc-cleaner__check",type:"checkbox",checked:!ei.has(p.id),disabled:me,onChange:()=>Cp(p.id)}),o.createElement("span",{className:"hc-cleaner__item-time"},Wm(p.timestamp)),o.createElement("span",{className:"hc-cleaner__item-text"},w&&o.createElement("span",{className:"hc-cleaner__item-channel"},"#",w),S.map(G=>o.createElement("span",{className:"hc-cleaner__tag",key:G},G)),_?Jm(_):S.length===0&&"\uFF08\u65E0\u6587\u672C\u5185\u5BB9\uFF09"))})),Ge.length>er&&o.createElement("div",{className:"hc-cleaner__listmore"},o.createElement("span",null,"\u5DF2\u663E\u793A ",er," / ",Ge.length," \u6761"),o.createElement(k,{size:"sm",variant:"secondary",onClick:()=>tr(p=>p+In)},"\u518D\u663E\u793A ",Math.min(In,Ge.length-er)," \u6761"),o.createElement(k,{size:"sm",variant:"plain",onClick:()=>tr(Ge.length)},"\u663E\u793A\u5168\u90E8"))),o.createElement(R,{title:"\u7EDF\u8BA1",note:"\u7EDF\u8BA1\u4F60\u5728\u6240\u9009\u8303\u56F4\u5185\u7684\u5386\u53F2\u53D1\u8A00\u603B\u6570\uFF08\u8C03\u7528\u641C\u7D22\u63A5\u53E3\uFF09\u3002"},o.createElement("div",{className:"hc-cell"},o.createElement(k,{size:"sm",variant:"secondary",icon:o.createElement(Pe,{size:16}),disabled:me,onClick:Dp},"\u7EDF\u8BA1\u6211\u7684\u53D1\u8A00\u6570")),Us!=null&&o.createElement("div",{className:"hc-cell hc-cleaner__stat"},o.createElement("span",{className:"hc-cleaner__stat-num"},Us),o.createElement("span",{className:"hc-cleaner__stat-unit"},"\u6761"))))}var Xm=g("message-cleaner"),Qm=['section[class*="title_"] [class*="toolbar_"]','section[class*="title"] [class*="toolbar"]','[class*="upperContainer"] [class*="toolbar"]','[class*="chat_"] [class*="toolbar_"]','[class*="toolbar_"]'],Zm=1e3,kt=null,Kr=null,Vr;function eg(){return o.createElement("button",{type:"button",className:"hc-cleaner-toolbtn","aria-label":"\u6D88\u606F\u6E05\u7406",title:"\u51B2\u6C34\uFF08\u5220\u9664\u81EA\u5DF1\u7684\u6D88\u606F\uFF09",onClick:()=>{Ed(qr()),Qe({pluginId:"message-cleaner"})}},o.createElement(ce,{size:24}))}function tg(){for(let e of Qm)try{let t=document.querySelector(e);if(t)return t}catch{}return null}function Hd(){if(kt&&document.contains(kt))return;kt&&Fd();let e=tg();if(!e)return;let t=document.createElement("div");t.className="hc-cleaner-toolbtn-host",t.setAttribute("data-hc-plugin","message-cleaner");try{e.insertBefore(t,e.firstChild)}catch{return}try{let n=X(o.createElement(eg),t);kt=t,Kr=n}catch(n){t.remove(),Xm.debug("toolbar button mount failed",n)}}function Fd(){if(Kr){try{Kr()}catch{}Kr=null}kt&&(kt.remove(),kt=null)}function qd(){B(),Ea(),Hd(),Vr=setInterval(Hd,Zm)}function Ea(){Vr&&(clearInterval(Vr),Vr=void 0),Fd()}var ng=g("message-cleaner"),Kd=N({id:"message-cleaner",name:"\u6D88\u606F\u6E05\u7406",description:"\u6279\u91CF\u5220\u9664\u4F60\u81EA\u5DF1\u5728\u67D0\u4E2A\u9891\u9053\u6216\u6574\u4E2A\u670D\u52A1\u5668\u7684\u5386\u53F2\u6D88\u606F\uFF08\u81EA\u52A9\u51B2\u6C34\u673A\uFF09\u3002\u5148\u9884\u89C8\u518D\u5220\u9664\uFF0C\u4EC5\u9650\u672C\u4EBA\u6D88\u606F\uFF0C\u5220\u9664\u4E0D\u53EF\u6062\u590D\u3002",authors:[{name:"caitemm"},{name:"catie"}],category:"privacy",settings:Kt,page:{title:"\u6E05\u7406",icon:ce,component:Gd},start(){qd(),ng.info("message-cleaner ready")},stop(){Ea()}});var ne=g("fake-nitro"),nt=D({enableEmojiBypass:{group:"\u8868\u60C5",type:"boolean",default:!0,label:"\u7ED5\u8FC7\u8868\u60C5\u9650\u5236",description:"\u53D1\u9001\u4F60\u6CA1\u6709 Nitro \u6743\u9650\u7684\u81EA\u5B9A\u4E49\u8868\u60C5\uFF08\u8DE8\u670D / \u52A8\u6001\u8868\u60C5\uFF09\u65F6\uFF0C\u81EA\u52A8\u6539\u4E3A\u53D1\u9001\u8BE5\u8868\u60C5\u7684\u56FE\u7247\u94FE\u63A5\u3002"},emojiSize:{group:"\u8868\u60C5",type:"select",default:"48",label:"\u8868\u60C5\u56FE\u7247\u5C3A\u5BF8",description:"\u5185\u8054\u8868\u60C5\u56FE\u7247\u7684\u8FB9\u957F\uFF08\u50CF\u7D20\uFF09\u3002\u8D8A\u5927\u8D8A\u6E05\u6670\u3001\u5360\u7528\u8D8A\u5927\u300216 \u662F CDN \u7684\u4E0B\u9650\uFF0C\u518D\u5C0F\u5B83\u53EA\u4F1A\u56DE 400\uFF0C\u6240\u4EE5\u6CA1\u6709\u66F4\u5C0F\u7684\u6863\u3002",options:[{value:"16",label:"16\uFF08\u6700\u5C0F\uFF09"},{value:"20",label:"20"},{value:"24",label:"24"},{value:"32",label:"32"},{value:"48",label:"48\uFF08\u9ED8\u8BA4\uFF09"},{value:"64",label:"64"},{value:"128",label:"128"},{value:"256",label:"256"},{value:"512",label:"512"}]},enableStickerBypass:{group:"\u8D34\u7EB8",type:"boolean",default:!0,label:"\u7ED5\u8FC7\u8D34\u7EB8\u9650\u5236",description:"\u53D1\u9001\u9501\u5B9A\u7684\u8D34\u7EB8\u65F6\u6539\u4E3A\u53D1\u9001\u8D34\u7EB8\u56FE\u7247\u94FE\u63A5\u3002Lottie\uFF08\u77E2\u91CF\uFF09\u8D34\u7EB8\u65E0\u6CD5\u5185\u8054\uFF0C\u4F1A\u8DF3\u8FC7\u3002"},stickerSize:{group:"\u8D34\u7EB8",type:"select",default:"160",label:"\u8D34\u7EB8\u56FE\u7247\u5C3A\u5BF8",description:"\u5185\u8054\u8D34\u7EB8\u56FE\u7247\u7684\u8FB9\u957F\uFF08\u50CF\u7D20\uFF09\u3002\u540C\u6837\u4EE5 16 \u4E3A\u4E0B\u9650\u3002",options:[{value:"16",label:"16\uFF08\u6700\u5C0F\uFF09"},{value:"24",label:"24"},{value:"32",label:"32"},{value:"64",label:"64"},{value:"128",label:"128"},{value:"160",label:"160\uFF08\u9ED8\u8BA4\uFF09"},{value:"256",label:"256"},{value:"512",label:"512"}]},useHyperLinks:{group:"\u94FE\u63A5\u5F62\u5F0F",type:"boolean",default:!0,label:"\u7528\u8D85\u94FE\u63A5\u4EE3\u66FF\u88F8\u94FE\u63A5",description:"\u6539\u5199\u6210\u300C[\u8868\u60C5\u540D](\u94FE\u63A5)\u300D\u800C\u4E0D\u662F\u76F4\u63A5\u8D34\u4E00\u957F\u4E32 CDN \u5730\u5740\u3002\u56FE\u7247\u7167\u6837\u4F1A\u51FA\u73B0\uFF0C\u4F46\u6D88\u606F\u91CC\u90A3\u884C\u5B57\u53D8\u6210\u8868\u60C5\u540D\uFF0C\u6DF7\u5728\u53E5\u5B50\u91CC\u4E0D\u518D\u662F\u4E00\u5835\u94FE\u63A5\u5899\u3002"},hyperLinkText:{group:"\u94FE\u63A5\u5F62\u5F0F",type:"string",default:"{{NAME}}",label:"\u8D85\u94FE\u63A5\u6587\u5B57",description:"\u4E0A\u4E00\u9879\u5F00\u542F\u65F6\u94FE\u63A5\u663E\u793A\u6210\u4EC0\u4E48\uFF0C{{NAME}} \u4F1A\u66FF\u6362\u6210\u8868\u60C5 / \u8D34\u7EB8\u7684\u540D\u5B57\u3002\u60F3\u53EA\u7559\u56FE\u7247\u3001\u8FDE\u540D\u5B57\u90FD\u4E0D\u8981\uFF0C\u586B\u4E00\u4E2A\u96F6\u5BBD\u5B57\u7B26\uFF08\u5982 U+200E\uFF09\u5373\u53EF\uFF1BDiscord \u4E0D\u8BA4\u7A7A\u7684\u94FE\u63A5\u6587\u5B57\uFF0C\u771F\u7559\u7A7A\u4F1A\u9000\u56DE\u88F8\u94FE\u63A5\u3002",placeholder:"{{NAME}}",maxLength:100},enableStreamQualityBypass:{group:"\u76F4\u64AD",type:"boolean",default:!0,label:"\u89E3\u9501\u76F4\u64AD\u753B\u8D28",description:"\u5141\u8BB8\u4EE5 Nitro \u753B\u8D28\u8FDB\u884C\u5C4F\u5E55\u5171\u4EAB\u76F4\u64AD\uFF08\u9700\u91CD\u542F\u5BA2\u6237\u7AEF\u751F\u6548\uFF0C\u56E0\u4E3A\u8FD9\u662F\u6E90\u7801\u7EA7 patch\uFF09\u3002"}}),Vd=T(e=>e?.getName?.()==="EmojiStore"),rg=T(e=>e?.getName?.()==="StickersStore"),og=T(e=>e?.getName?.()==="GuildMemberStore"),ig=T(e=>e?.getName?.()==="PermissionStore"&&typeof e?.can=="function"),Wd={USE_EXTERNAL_EMOJIS:1n<<18n,USE_EXTERNAL_STICKERS:1n<<37n,EMBED_LINKS:1n<<14n},ag=qi.LOTTIE,sg=3,cg=4;function Yd(){try{return ee.getCurrentUser?.()?.premiumType??0}catch{return 0}}var lg=()=>Yd()>0,dg=()=>Yd()>1;function Jd(e,t){try{let n=ve.getChannel?.(e);return!n||n.isPrivate?.()?!0:ig.can?.(t,n)??!0}catch{return!0}}function Yr(e){try{let t=ve.getChannel?.(e);return t?.guild_id??t?.getGuildId?.()??void 0}catch{return}}function Ca(e,t,n){if(e?.type===0)return!0;if(e?.available===!1)return!1;let r=!1;if(e?.managed&&e?.guildId){let i=og.getSelfMember?.(e.guildId)?.roles??[];r=Array.isArray(e?.roles)&&e.roles.some(a=>i.includes(a))}return lg()||r?e.guildId===n||Jd(t,Wd.USE_EXTERNAL_EMOJIS):!e?.animated&&e?.guildId===n}function Rd(){return Number(nt.store.emojiSize)||48}function ug(e){return De(String(e?.id),!!e?.animated,Rd())}function hg(e){let t=new URL(Nl(String(e?.id),e?.format_type,Number(nt.store.stickerSize)||160));return e?.name&&t.searchParams.set("name",String(e.name)),t.toString()}function Et(e,t){return!e[t]||/\s/.test(e[t])?"":" "}function pg(e){return e.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")}var fg=["*","_","~","|","`"];function mg(e){let t=e.replace(/[[\]]/g,"").replace(/\\/g,"\\\\");for(let n of fg){let r=t.split(n);r.length>2&&(t=r.join(`\\${n}`))}return t}function gg(e,t){if(!t)return e;try{let n=new URL(e);return n.searchParams.set("name",t),n.toString()}catch{return e}}function Jr(e,t){if(!nt.store.useHyperLinks)return e;let n=String(nt.store.hyperLinkText??"").replace(/\{\{NAME\}\}/g,()=>mg(t)).trim();return n.length===0?e:`[${n}](${gg(e,t)})`}function Xd(e){let t=e[1];return t&&typeof t=="object"&&typeof t.content=="string"?t:e.find(n=>n&&typeof n=="object"&&typeof n.content=="string")}function yg(e){for(let t=2;t<e.length;t++){let n=e[t];if(n&&typeof n=="object"&&"stickerIds"in n)return n}return e[3]&&typeof e[3]=="object"?e[3]:void 0}function Qd(e,t,n,r){if(!nt.store.enableStickerBypass)return!1;let i=n?.stickerIds;if(!Array.isArray(i)||i.length===0)return!1;let a=rg.getStickerById?.(i[0]);if(!a||"pack_id"in a)return!1;let s=dg()&&Jd(e,Wd.USE_EXTERNAL_STICKERS);if(a.available!==!1&&(s||a.guild_id===r))return!1;if(a.format_type===ag)return ne.warn("Lottie \u8D34\u7EB8\u65E0\u6CD5\u4F5C\u4E3A\u56FE\u7247\u5185\u8054\uFF0C\u5DF2\u8DF3\u8FC7\uFF1A",a.name),!1;let c=Jr(hg(a),String(a?.name??""));return t.content=`${t.content??""}${Et(t.content??"",(t.content??"").length-1)}${c}`,i.length=0,!0}var Nn=/(?<!\\)<(a)?:(\w+):(\d+)>/gi;function Ta(e,t,n){if(!nt.store.enableEmojiBypass)return!1;let r=!1,i=t?.validNonShortcutEmojis;if(Array.isArray(i)&&i.length>0)for(let s of i){if(Ca(s,e,n))continue;let c=`<${s.animated?"a":""}:${s.originalName||s.name}:${s.id}>`,l=Jr(ug(s),String(s.name||s.originalName||"")),d=new RegExp(pg(c),"g");t.content=String(t.content??"").replace(d,(u,h,f)=>(r=!0,`${Et(f,h-1)}${l}${Et(f,h+u.length)}`))}let a=String(t.content??"");if(Nn.lastIndex=0,a.length>0&&Nn.test(a)){Nn.lastIndex=0;let s=a.replace(Nn,(c,l,d,u,h,f)=>{let v=Vd.getCustomEmojiById?.(u);if(v&&Ca(v,e,n))return c;r=!0;let x=Jr(Zd(u,!!l),d);return`${Et(f,h-1)}${x}${Et(f,h+c.length)}`});s!==a&&(t.content=s)}return r}function Zd(e,t){return De(e,t,Rd())}var Ia,Na;function bg(e){try{let t=e.args,n=t[0],r=Xd(t);if(!r||r.__fakeNitroRewritten)return;typeof r.content!="string"&&(r.content=String(r.content??""));let i=yg(t),a=Yr(n);i&&Qd(n,r,i,a),Ta(n,r,a)}catch(t){ne.error("send \u6539\u5199\u5931\u8D25\uFF0C\u6D88\u606F\u6309\u539F\u6837\u53D1\u9001",t)}}function vg(e){try{if(!nt.store.enableEmojiBypass)return;let t=e.args,n=t[0],r=Xd(t);if(!r||typeof r.content!="string")return;let i=Yr(n);r.content=r.content.replace(Nn,(a,s,c,l,d,u)=>{let h=Vd.getCustomEmojiById?.(l);if(h&&Ca(h,n,i))return a;let f=Jr(Zd(l,!!s),c);return`${Et(u,d-1)}${f}${Et(u,d+a.length)}`})}catch(t){ne.error("edit \u6539\u5199\u5931\u8D25\uFF0C\u6D88\u606F\u6309\u539F\u6837\u4FDD\u5B58",t)}}function _g(){let e=Y().filter(i=>i.pluginId==="fake-nitro");if(!e.length){ne.warn("\u672C\u63D2\u4EF6\u6CA1\u6709\u6CE8\u518C\u4EFB\u4F55\u6E90\u7801 patch \u2014\u2014 \u542F\u52A8\u65F6\u5B83\u5904\u4E8E\u5173\u95ED\u72B6\u6001\u3002\u5728\u8BBE\u7F6E\u91CC\u6253\u5F00\u201C\u5047 Nitro\u201D\u540E\u5FC5\u987B\u5237\u65B0\u9875\u9762\uFF1A\u6E90\u7801 patch \u53EA\u5728\u6A21\u5757\u52A0\u8F7D\u90A3\u4E00\u523B\u751F\u6548\uFF0C\u4E2D\u9014\u5F00\u542F\u4E0D\u4F1A\u8865\u4E0A\u3002");return}let t=i=>i.count>1?`\u201C${i.label}\u201D \u7B2C ${i.index}/${i.count} \u5904`:`\u201C${i.label}\u201D`,n=e.filter(i=>!i.applied&&!i.optional),r=e.filter(i=>!i.applied&&i.optional);if(n.length===0)ne.info(`\u8868\u60C5 / \u8D34\u7EB8\u89E3\u9501\u7684\u6E90\u7801 patch \u5747\u5DF2\u5728\u5F53\u524D Discord \u7248\u672C\u751F\u6548\uFF08\u5171 ${e.length} \u5904\u66FF\u6362\uFF09`);else{let i=n.filter(s=>s.seen>0),a=n.filter(s=>s.seen===0);i.length>0&&ne.warn("\u4EE5\u4E0B patch \u627E\u5230\u4E86\u76EE\u6807\u6A21\u5757\uFF0C\u4F46\u66FF\u6362\u6B63\u5219\u5DF2\u5BF9\u4E0D\u4E0A\u5F53\u524D Discord \u7248\u672C\uFF08\u9700\u8981\u91CD\u951A\uFF09\uFF1A"+i.map(t).join("\u3001")),a.length>0&&ne.warn("\u4EE5\u4E0B patch \u4ECE\u672A\u62FF\u5230\u76EE\u6807\u6A21\u5757 \u2014\u2014 \u6A21\u5757\u8FD8\u6CA1\u52A0\u8F7D\uFF0C\u6216 find \u5DF2\u5931\u6548\uFF1A"+a.map(t).join("\u3001")+"\u3002\u82E5\u76F8\u5173\u754C\u9762\uFF08\u8868\u60C5\u9009\u62E9\u5668\u7B49\uFF09\u5DF2\u7ECF\u6253\u5F00\u8FC7\u4ECD\u662F\u8FD9\u6837\uFF0C\u5C31\u662F find \u9700\u8981\u66F4\u65B0\u3002")}r.length>0&&ne.info("\u4EE5\u4E0B\u53EF\u9009 patch \u672A\u5339\u914D\uFF08\u4EC5\u5F71\u54CD\u9644\u5E26\u529F\u80FD\uFF0C\u4E0D\u5F71\u54CD\u8868\u60C5 / \u8D34\u7EB8\uFF09\uFF1A"+r.map(t).join("\u3001"))}var Wr=`[${sg},${cg}].includes(typeof fakeNitroIntention==="undefined"?-1:fakeNitroIntention)`,eu=N({id:"fake-nitro",name:"\u5047 Nitro",description:"\u65E0\u9700 Nitro \u4E5F\u80FD\u4F7F\u7528\u9700\u8981 Nitro \u7684\u81EA\u5B9A\u4E49\u8868\u60C5\u4E0E\u8D34\u7EB8\uFF1A\u89E3\u9501\u9009\u62E9\u5668\uFF0C\u5E76\u5728\u53D1\u9001\u65F6\u628A\u9501\u5B9A\u7684\u8868\u60C5 / \u8D34\u7EB8\u81EA\u52A8\u6539\u5199\u4E3A\u56FE\u7247\u94FE\u63A5\uFF0C\u9ED8\u8BA4\u5199\u6210\u300C[\u8868\u60C5\u540D](\u94FE\u63A5)\u300D\u7684\u8D85\u94FE\u63A5\u5F62\u5F0F\uFF0C\u5BF9\u65B9\u770B\u5230\u8868\u60C5\u540D\u52A0\u5185\u8054\u56FE\u7247\uFF0C\u800C\u4E0D\u662F\u4E00\u957F\u4E32\u5730\u5740\u3002\u4FEE\u6539\u9700\u91CD\u542F\u5BA2\u6237\u7AEF\u624D\u80FD\u5B8C\u5168\u751F\u6548\u3002",authors:[{name:"Vencord"},{name:"caitemm"}],category:"chat",settings:nt,patches:[{label:"message pre-send rewrite",find:/handleSendMessage[\s\S]{0,200}onResize|getSendMessageOptions[\s\S]{0,500}handleSendMessage/,replacement:{match:/let ([\w$]+)=[\w$]+\.[\w$]+\.parse\(([\w$]+),[\w$]+\);.+?let ([\w$]+)=\{\.\.\.[\w$]+\.[\w$]+\.getSendMessageOptions\(\{.+?\}\),location:[^}]*\};/,replace:(e,t,n,r)=>`${e}if($self.handlePreSend(${n}.id,${t},${r}))return{shouldClear:false,shouldRefocus:true};`}},{label:"premium predicates return true",find:"canUseCustomStickersEverywhere:",replacement:[{match:/(?<=canUseCustomStickersEverywhere:function\([\w$]+\)\{)/,replace:"return true;"},{match:/(?<=canUseHighVideoUploadQuality:function\([\w$]+\)\{)/,replace:"return true;"},{match:/(?<=canStreamQuality:function\([\w$]+(?:,[\w$]+)?\)\{)/,replace:"return true;"},{match:/(?<=canUseClientThemes:function\([\w$]+\)\{)/,replace:"return true;"},{match:/(?<=canUsePremiumAppIcons:function\([\w$]+\)\{)/,replace:"return true;"}]},{label:"voice call emoji stays native",find:'.getByName("fork_and_knife")',optional:!0,replacement:{match:/\.CHAT/,replace:".STATUS"}},{label:"emoji picker unlock",find:/^(?=[\s\S]*\.GUILD_SUBSCRIPTION_UNAVAILABLE;)(?=[\s\S]*getEmojiUnavailableReasons\()/,replacement:[{match:/(?<=\.USE_EXTERNAL_EMOJIS,[\w$]+\);)(?=.{0,300}?isExternalEmojiAllowedForIntention\)\(([\w$]+)\))/,replace:"var fakeNitroIntention=$1;"},{match:/(function [\w$]+\([\w$]+\)\{let\{emoji:[\w$]+,channel:[\w$]+,guildId:[\w$]+=[\w$]+\??\.getGuildId\(\),intention:([\w$]+)[^}]*\}=[\w$]+;)/,replace:"$1var fakeNitroIntention=$2;"},{match:/&&![\w$]+&&![\w$]+(?=\)return [\w$]+\.[\w$]+\.DISALLOW_EXTERNAL;)/,replace:`$&&&!${Wr}`},{match:/![\w$]+\.available(?=\)return [\w$]+\.[\w$]+\.GUILD_SUBSCRIPTION_UNAVAILABLE;)/,replace:`$&&&!${Wr}`},{match:/!\(?(?:[\w$]+\|\|)?([\w$]+\.[\w$]+\.canUseEmojisEverywhere\([\w$]+\))/,replace:(e,t)=>e.replace(t,`(${t}||${Wr})`)},{match:/(?<=\|\|)[\w$]+\.[\w$]+\.canUseAnimatedEmojis\([\w$]+\)/,replace:`($&||${Wr})`}]},{label:"subscription emoji unlock",find:/^(?=[\s\S]*getUserSubscriptionRoles\()(?=[\s\S]*\.getUserIsAdmin\()/,replacement:{match:/(function [\w$]+\([\w$]+,[\w$]+)\)\{(.{0,250}\.getUserIsAdmin\(.+?return!1\})/,replace:"$1,fakeNitroOriginal){if(!fakeNitroOriginal)return false;$2"}},{label:"stickers always sendable",find:/^(?=[\s\S]*"SENDABLE")(?=[\s\S]*SENDABLE_WITH_PREMIUM)/,replacement:{match:/[\w$]+\.available\?/,replace:"true?"}},{label:"stream quality tiers removed",find:"STREAM_FPS_OPTION",all:!0,optional:!0,replacement:{match:/guildPremiumTier:[\w$]+\.[\w$]+\.TIER_\d,?/,replace:""}},{label:"custom app icons",find:"getCurrentDesktopIcon(),",replacement:{match:/[\w$]+\.[\w$]+\.isPremium\([\w$]+\.[\w$]+\.getCurrentUser\(\)\)/,replace:"true"}},{label:"custom client themes",find:'("custom_themes_editor_footer")',all:!0,optional:!0,replacement:{match:/\(0,[\w$]+\.[\w$]+\)\([\w$]+\.[\w$]+\.TIER_2\)(?=,|;)/,replace:"true"}},{label:"soundboard sounds available",find:'type:"GUILD_SOUNDBOARD_SOUND_CREATE"',all:!0,replacement:{match:/(?<=type:"(?:SOUNDBOARD_SOUNDS_RECEIVED|GUILD_SOUNDBOARD_SOUND_CREATE|GUILD_SOUNDBOARD_SOUND_UPDATE|GUILD_SOUNDBOARD_SOUNDS_UPDATE)".{0,300}?available:)[\w$]+\.available/,replace:"true"}}],start(){let e=Me("sendMessage","editMessage","deleteMessage");if(e){if(typeof e.sendMessage=="function")try{Ia=ue.before(e,"sendMessage",bg)}catch(t){ne.error("\u6302\u63A5 sendMessage \u5931\u8D25",t)}if(typeof e.editMessage=="function")try{Na=ue.before(e,"editMessage",vg)}catch(t){ne.error("\u6302\u63A5 editMessage \u5931\u8D25",t)}ne.info("MessageActions \u5DF2\u6302\u63A5\uFF08\u53D1\u9001 / \u7F16\u8F91\u6539\u5199\u5C31\u7EEA\uFF1B\u82E5 pre-send \u8865\u4E01\u5DF2\u751F\u6548\u5219\u6B64 hook \u4EC5\u4F5C fallback\uFF09")}else ne.warn("\u672A\u627E\u5230 MessageActions \u2014\u2014 \u9009\u62E9\u5668\u89E3\u9501\u5DF2\u901A\u8FC7\u6E90\u7801 patch \u751F\u6548\uFF0C\u4F46\u53D1\u9001\u65F6\u7684 URL \u6539\u5199\u4E0D\u53EF\u7528\u3002\u91CD\u542F\u5BA2\u6237\u7AEF\u540E\u518D\u8BD5\uFF1B\u82E5\u4ECD\u672A\u627E\u5230\uFF0C\u8BF4\u660E\u8BE5 Discord \u7248\u672C\u7684 MessageActions \u5F62\u72B6\u6709\u53D8\u3002");setTimeout(_g,4e3)},stop(){Ia?.(),Na?.(),Ia=void 0,Na=void 0},handlePreSend(e,t,n){try{typeof t?.content!="string"&&(t.content=String(t?.content??""));let r=Yr(e);n&&Qd(e,t,n,r),Ta(e,t,r),t.__fakeNitroRewritten=!0}catch(r){ne.error("pre-send \u6539\u5199\u5931\u8D25\uFF0C\u6D88\u606F\u6309\u539F\u6837\u53D1\u9001",r)}return!1},previewOutgoing(e,t){try{if(typeof t!="string"||t.length===0)return t??"";let n={content:t};return Ta(e,n,Yr(e)),n.content}catch(n){return ne.debug("previewOutgoing \u5931\u8D25\uFF0C\u6309\u539F\u6587\u8FD4\u56DE",n),t}}});var Vt=D({showRawOutgoing:{group:"\u9884\u89C8",type:"boolean",default:!0,label:"\u663E\u793A\u5B9E\u9645\u53D1\u51FA\u7684\u539F\u6587",description:"\u5047 Nitro \u4F1A\u628A\u9501\u5B9A\u7684\u8868\u60C5\u6539\u5199\u6210\u56FE\u7247\u94FE\u63A5\uFF0C\u6240\u4EE5\u4F60\u6253\u7684\u548C\u771F\u6B63\u4E0A\u7EBF\u7684\u7ECF\u5E38\u4E0D\u662F\u4E00\u56DE\u4E8B\u3002\u5F00\u542F\u540E\uFF0C\u53EA\u8981\u4E24\u8005\u4E0D\u540C\u5C31\u989D\u5916\u663E\u793A\u4E00\u5757\u771F\u6B63\u4F1A\u53D1\u51FA\u53BB\u7684\u6587\u672C\u3002"},liveUpdate:{group:"\u9884\u89C8",type:"boolean",default:!0,label:"\u8DDF\u7740\u6253\u5B57\u5B9E\u65F6\u66F4\u65B0",description:"\u9762\u677F\u5F00\u7740\u65F6\u968F\u8F93\u5165\u5237\u65B0\u9884\u89C8\u3002\u5173\u6389\u5219\u53EA\u5728\u70B9\u5F00\u7684\u90A3\u4E00\u523B\u53D6\u4E00\u6B21\u5FEB\u7167\u3002"}});var tu='[role="textbox"][contenteditable="true"]';function Rr(){try{let e=document.activeElement;if(e instanceof HTMLElement&&e.matches(tu))return e;let t=document.querySelectorAll(tu);for(let n=t.length-1;n>=0;n--)if(t[n].offsetParent!==null)return t[n];return t.length?t[t.length-1]:null}catch{return null}}var nu=g("message-preview"),ru=!1,Aa,Xr=!1,ou=!1;function xg(e){return typeof e?.parse=="function"&&typeof e?.parseTopic=="function"&&typeof e?.reactParserFor=="function"&&typeof e?.astParserFor=="function"&&typeof e?.__halcyon_probe__>"u"}function wg(){if(!ru){ru=!0;try{Aa=P(xg)}catch{Aa=void 0}}return Aa}function iu(e){return e==null||typeof e=="string"||typeof e=="number"?!0:Array.isArray(e)?e.every(iu):typeof e=="object"?typeof e.$$typeof=="symbol":!1}function Ma(e,t){ou||(ou=!0,t?nu.debug(e,t):nu.debug(e))}function au(e,t){if(!Xr){let n=wg();if(typeof n?.parse=="function"){let r={channelId:t,allowHeading:!0,allowList:!0,allowSubtext:!0,allowBlockQuotePrefix:!0,allowLinks:!0,allowEmojiLinks:!0,allowDevLinks:!0,allowGameMentions:!0,allowTimeMentionInput:!0,allowRoles:!0,allowUsers:!0,allowMentioning:!0,allowEscape:!0,allowNewLines:!0,allowAnimatedEmoji:!0,allowSoundmoji:!0,allowStickers:!0,formatInline:!1,noStyleAndInteraction:!1,isForumPost:!1};for(let i of[!1,!0])try{let a=n.parse(e,i,r);if(iu(a))return a}catch(a){i&&(Xr=!0,Ma("Discord \u89E3\u6790\u5668\u629B\u9519\uFF0C\u964D\u7EA7\u4E3A\u5185\u7F6E\u6E32\u67D3",a));continue}Xr=!0,Ma("Discord \u89E3\u6790\u5668\u8FD4\u56DE\u4E86\u4E0D\u80FD\u6E32\u67D3\u7684\u4E1C\u897F\uFF08\u5F88\u53EF\u80FD\u649E\u4E0A\u4E86 intl \u4EE3\u7406\uFF09\uFF0C\u964D\u7EA7\u4E3A\u5185\u7F6E\u6E32\u67D3")}else Xr=!0,Ma("\u672A\u627E\u5230 Discord \u7684 markdown \u89E3\u6790\u5668\uFF0C\u964D\u7EA7\u4E3A\u5185\u7F6E\u6E32\u67D3\uFF08\u8868\u60C5\u53EF\u89C1\uFF0Cmarkdown / @\u63D0\u53CA \u4E0D\u89E3\u6790\uFF09")}return bt(e)}var Sg=g("message-preview"),su=!1,Cn="";function kg(e){if(typeof e!="object"||e===null||typeof e.__halcyon_probe__<"u")return!1;let t=!1,n=!1;for(let r of Object.values(e))if(typeof r=="string"&&(/^markup[-_]/.test(r)?t=!0:/^inlineFormat[-_]/.test(r)&&(n=!0),t&&n))return!0;return!1}function Eg(e){for(let t of Object.values(e??{}))if(typeof t=="string"&&/^markup[-_]/.test(t))return t;return""}function cu(){if(su)return Cn;su=!0;try{let e=P(kg);e&&(Cn=Eg(e))}catch{Cn=""}return Cn||Sg.debug("\u672A\u627E\u5230 Discord \u7684 markup \u5BB9\u5668\u7C7B\uFF0C\u9884\u89C8\u5C06\u663E\u793A\u4E3A\u65E0\u6837\u5F0F\u6587\u672C\uFF08\u7ED3\u6784\u6B63\u786E\u3001\u5B57\u53F7/\u659C\u4F53\u7B49\u4E0D\u751F\u6548\uFF09"),Cn}var lu=T(e=>e?.getName?.()==="DraftStore"),Qr=T(e=>e?.getName?.()==="EditMessageStore"),Ig=0;function Pa(){try{let e=le.getChannelId?.();return typeof e=="string"&&e.length?e:void 0}catch{return}}function du(e){if(e)try{let t=Qr.getEditingMessageId?.(e);return typeof t=="string"&&t.length?t:void 0}catch{return}}function Zr(e){if(e){try{if(Qr.isEditingAny?.(e)){let t=Qr.getEditingTextValue?.(e);if(typeof t=="string")return t}}catch{}try{let t=lu.getDraft?.(e,Ig);if(typeof t=="string")return t}catch{}}try{return Rr()?.textContent??""}catch{return""}}function uu(e){let t=[];for(let n of[lu,Qr])try{let r=n;typeof r?.addChangeListener=="function"&&(r.addChangeListener(e),t.push(()=>{try{r.removeChangeListener?.(e)}catch{}}))}catch{}return{attached:t.length>0,off:()=>{for(let n of t)n()}}}function Ng(e){return typeof e?.globalName=="string"&&e.globalName||typeof e?.global_name=="string"&&e.global_name||typeof e?.username=="string"&&e.username||"\u4F60"}function Cg(e,t){if(!e)return t;try{if(!K.isEnabled("fake-nitro"))return t;let r=K.getPlugin("fake-nitro")?.previewOutgoing?.(e,t);return typeof r=="string"?r:t}catch{return t}}function hu({content:e,channelId:t}){let n=(()=>{try{return ee.getCurrentUser?.()}catch{return}})();if(e.trim().length===0)return o.createElement("div",{className:"hc-preview"},o.createElement("div",{className:"hc-preview__empty"},"\u8FD8\u6CA1\u8F93\u5165\u5185\u5BB9"));let i=Ng(n),a=n?.id?Dr(String(n.id),n.avatar,40):void 0,s=Vt.store.showRawOutgoing?Cg(t,e):e,c=s!==e,l=du(t)!==void 0,d=`hc-preview__body ${cu()}`.trim();return o.createElement("div",{className:"hc-preview"},o.createElement("div",{className:"hc-preview__row"},a?o.createElement("img",{className:"hc-preview__avatar",src:a,alt:"",width:40,height:40,draggable:!1}):o.createElement("div",{className:"hc-preview__avatar hc-preview__avatar--blank"}),o.createElement("div",{className:"hc-preview__main"},o.createElement("div",{className:"hc-preview__head"},o.createElement("span",{className:"hc-preview__name"},i),o.createElement("span",{className:"hc-preview__time"},l?"\u7F16\u8F91\u540E":"\u521A\u521A")),o.createElement("div",{className:d},au(e,t)))),c?o.createElement("div",{className:"hc-preview__raw"},o.createElement("div",{className:"hc-preview__raw-title"},"\u5047 Nitro \u4F1A\u628A\u5B83\u6539\u5199\u6210\uFF1A"),o.createElement("code",{className:"hc-preview__raw-text"},s)):null)}var Tg=150,pu=250;function fu({onEmptied:e}){let t=Pa(),[n,r]=y(t),[i,a]=y(()=>Zr(t)),s=se(Zr(t).trim().length>0);return C(()=>{if(!Vt.store.liveUpdate)return;let c,l,d=!1,u=()=>{if(d)return;let x=Pa(),L=Zr(x);r(x),a(L);let m=L.trim().length>0;s.current&&!m&&e(),s.current=m},h=()=>{c&&clearTimeout(c),c=setTimeout(u,Tg)},{attached:f,off:v}=uu(h);return l=setInterval(u,f?pu*4:pu),()=>{d=!0,c&&clearTimeout(c),l&&clearInterval(l),v()}},[e]),o.createElement(hu,{content:i,channelId:n})}var Ag=g("message-preview"),Mg=250,Pg=8,Ee=null,eo=null,to,mu=!1;function La(e){mu=e}function gu(){return mu}function $a(){return Ee!==null}function no(){if(!Ee)return;let e=Rr(),t=e?.closest("form")??e;if(!t)return;let n;try{n=t.getBoundingClientRect()}catch{return}let r=Math.min(Math.max(n.width,320),720),i=Ee.offsetHeight||96,a=Math.max(8,Math.min(n.left,window.innerWidth-r-8)),s=Math.max(8,n.top-i-Pg);Ee.style.width=`${Math.round(r)}px`,Ee.style.left=`${Math.round(a)}px`,Ee.style.top=`${Math.round(s)}px`}function yu(e){e.key==="Escape"&&$a()&&(Tn(),e.stopPropagation(),e.preventDefault())}function Lg(){if($a())return;B();let e=document.createElement("div");e.className="halcyon hc-preview-host",e.setAttribute("data-hc-plugin","message-preview"),document.body.appendChild(e);try{eo=X(o.createElement(fu,{onEmptied:Tn}),e),Ee=e}catch(t){e.remove(),Ag.error("\u9884\u89C8\u9762\u677F\u6302\u8F7D\u5931\u8D25",t);return}no(),to=setInterval(no,Mg),window.addEventListener("resize",no),document.addEventListener("keydown",yu,!0)}function Tn(){if(to&&(clearInterval(to),to=void 0),window.removeEventListener("resize",no),document.removeEventListener("keydown",yu,!0),eo){try{eo()}catch{}eo=null}Ee&&(Ee.remove(),Ee=null)}function $g(){$a()?Tn():Lg()}function bu(){return o.createElement("button",{type:"button",className:"hc-preview-btn","aria-label":"\u9884\u89C8\u8FD9\u6761\u6D88\u606F",title:"\u9884\u89C8\u53D1\u51FA\u540E\u7684\u6837\u5B50",onClick:e=>{e?.preventDefault?.(),e?.stopPropagation?.(),$g()}},o.createElement(Hc,{size:24}))}var vu=N({id:"message-preview",name:"\u53D1\u9001\u524D\u9884\u89C8",description:"\u5728\u8F93\u5165\u6846\u52A0\u4E00\u4E2A\u6309\u94AE\uFF0C\u70B9\u4E00\u4E0B\u5C31\u80FD\u770B\u5230\u8FD9\u6761\u6D88\u606F\u53D1\u51FA\u53BB\u4E4B\u540E\u957F\u4EC0\u4E48\u6837\uFF1Amarkdown\u3001\u8868\u60C5\u3001@\u63D0\u53CA\u90FD\u6309 Discord \u81EA\u5DF1\u7684\u6E32\u67D3\u663E\u793A\uFF1B\u5982\u679C\u5047 Nitro \u4F1A\u6539\u5199\u5185\u5BB9\uFF08\u8868\u60C5\u53D8\u6210\u56FE\u7247\u94FE\u63A5\uFF09\uFF0C\u8FD8\u4F1A\u4E00\u5E76\u663E\u793A\u771F\u6B63\u53D1\u51FA\u53BB\u7684\u539F\u6587\u3002\u6309\u94AE\u662F\u6E90\u7801\u7EA7\u6CE8\u5165\uFF0C\u5F00\u542F\u540E\u9700\u8981\u5237\u65B0\u9875\u9762\u3002",authors:[{name:"caitemm"}],category:"chat",settings:Vt,patches:[{label:"composer button injection",find:'"sticker")',replacement:{match:/0===([\w$]+)\.length(?=.{0,25}?\(0,[\w$]+\.jsxs?\)\(.{0,75}?children:\1)/,replace:"($self.injectButton($1),$&)"}}],start(){La(!0)},stop(){La(!1),Tn()},injectButton(e){try{if(!gu()||!Array.isArray(e))return;e.unshift(o.createElement(bu,{key:"halcyon-preview"}))}catch{}}});function _u(e){if(!e)return 0;let t=0,n=0;for(let r of e){let i=r.codePointAt(0)??0;i>=12288&&i<=40959||i>=44032&&i<=55215||i>=63744&&i<=64255||i>=65280&&i<=65376||i>=131072&&i<=262143?t++:n++}return Math.max(1,t+Math.ceil(n/4))}function Da(e,t,n=Math.random){if(t<=0||e<=0)return Math.round(e);let r=e*(t/100);return Math.max(1,Math.round(e+(n()*2-1)*r))}function An(e){return e<10?`0${e}`:String(e)}function xu(e,t){let n={model:t.model,time:t.seconds.toFixed(1),in:String(t.inputTokens),out:String(t.outputTokens),total:String(t.inputTokens+t.outputTokens),chars:String(t.chars),clock:`${An(t.now.getHours())}:${An(t.now.getMinutes())}:${An(t.now.getSeconds())}`,date:`${t.now.getFullYear()}-${An(t.now.getMonth()+1)}-${An(t.now.getDate())}`};return e.replace(/\{(\w+)\}/g,(r,i)=>Object.prototype.hasOwnProperty.call(n,i)?n[i]:r)}function wu(e,t=Math.random){let n=e.map(r=>r.trim()).filter(r=>r.length>0);return n.length===0?"":n.length===1?n[0]:n[Math.floor(t()*n.length)%n.length]}function Su(e,t,n){return t?n?e.endsWith(`
`)?`${e}${t}`:`${e}
${t}`:`${e} ${t}`:e}var oo=T(e=>e?.getName?.()==="DraftStore"),Dg=0,rt=new Map,ro=!1,Mn;function Og(e){try{let t=oo.getDraft?.(e,Dg);return typeof t=="string"?t:""}catch{return""}}function ku(){try{let e=oo.getState?.(),t=new Set;for(let n of Object.values(e??{}))if(!(typeof n!="object"||n===null))for(let r of Object.keys(n))t.add(r),Og(r).trim().length>0?rt.has(r)||rt.set(r,Date.now()):rt.delete(r);for(let n of Array.from(rt.keys()))t.has(n)||rt.delete(n)}catch{}}function Eu(){if(!ro)try{Mn=ku,oo.addChangeListener?.(Mn),ro=!0,ku()}catch{ro=!1}}function Iu(){try{Mn&&oo.removeChangeListener?.(Mn)}catch{}Mn=void 0,ro=!1,rt.clear()}function Nu(e,t){let n=rt.get(e);return rt.delete(e),n===void 0?t:Math.max(t,(Date.now()-n)/1e3)}var io=g("message-tail"),ot=D({template:{group:"\u5C3E\u5DF4",type:"string",default:"-# Time: {time}s | Model: {model} | Input: {in}t | Output: {out}t",label:"\u5C3E\u5DF4\u6A21\u677F",description:"\u53EF\u7528\u5360\u4F4D\u7B26\uFF1A{model} \u6A21\u578B\u540D\u3001{time} \u672C\u6761\u6D88\u606F\u5B9E\u9645\u7F16\u8F91\u79D2\u6570\u3001{in} \u8F93\u5165 token\u3001{out} \u8F93\u51FA token\u3001{total} \u4E24\u8005\u4E4B\u548C\u3001{chars} \u5B57\u7B26\u6570\u3001{clock} \u65F6\u95F4\u3001{date} \u65E5\u671F\u3002\u5F00\u5934\u7684 -# \u4F1A\u8BA9\u8FD9\u884C\u53D8\u6210\u5C0F\u5B57\uFF08Discord \u7684 subtext\uFF09\uFF0C\u5220\u6389\u5C31\u662F\u6B63\u5E38\u5927\u5C0F\u3002\u5199\u9519\u7684\u5360\u4F4D\u7B26\u4F1A\u539F\u6837\u4FDD\u7559\uFF0C\u4E0D\u4F1A\u88AB\u5403\u6389\u3002",placeholder:"-# Model: {model}",maxLength:400},ownLine:{group:"\u5C3E\u5DF4",type:"boolean",default:!0,label:"\u5C3E\u5DF4\u5355\u72EC\u4E00\u884C",description:"\u5173\u6389\u4F1A\u76F4\u63A5\u63A5\u5728\u6B63\u6587\u540E\u9762\u3002\u6CE8\u610F -# \u5C0F\u5B57\u53EA\u6709\u5728\u884C\u9996\u624D\u751F\u6548\uFF0C\u6240\u4EE5\u7528 -# \u65F6\u8FD9\u9879\u8981\u5F00\u7740\u3002"},models:{group:"\u6A21\u578B",type:"string-list",default:["agycli-gemini-3.7-flash-high-search"],label:"\u6A21\u578B\u540D",description:"{model} \u7684\u53D6\u503C\u3002\u586B\u591A\u4E2A\u7684\u8BDD\uFF0C\u6BCF\u6761\u6D88\u606F\u968F\u673A\u7528\u5176\u4E2D\u4E00\u4E2A\u3002",itemPlaceholder:"\u6A21\u578B\u540D\uFF0C\u4F8B\u5982 gpt-5-turbo"},contextTokens:{group:"\u6570\u5B57",type:"number",default:96e3,min:0,max:1e7,step:1e3,label:"\u4E0A\u4E0B\u6587 token \u57FA\u6570",description:"{in} = \u8FD9\u4E2A\u57FA\u6570 + \u4F60\u8FD9\u6761\u6D88\u606F\u7684 token \u4F30\u7B97\uFF0C\u7528\u6765\u8BA9\u8F93\u5165\u91CF\u770B\u8D77\u6765\u50CF\u771F\u7684\u5E26\u7740\u4E0A\u4E0B\u6587\u3002\u586B 0 \u5C31\u53EA\u7B97\u4F60\u81EA\u5DF1\u8FD9\u6761\u3002"},jitterPercent:{group:"\u6570\u5B57",type:"number",default:8,min:0,max:50,step:1,label:"\u6570\u5B57\u6296\u52A8\u5E45\u5EA6\uFF08%\uFF09",description:"\u7ED9 token \u6570\u52A0\u4E00\u70B9\u968F\u673A\u6D6E\u52A8\uFF0C\u514D\u5F97\u8FDE\u7740\u51E0\u6761\u7684\u6570\u5B57\u4E00\u6A21\u4E00\u6837\u3001\u4E00\u773C\u5047\u3002\u586B 0 \u5C31\u662F\u7CBE\u786E\u503C\u3002"},minSeconds:{group:"\u6570\u5B57",type:"number",default:.6,min:0,max:60,step:.1,label:"\u6700\u77ED\u8017\u65F6\uFF08\u79D2\uFF09",description:"{time} \u7684\u4E0B\u9650\u3002\u7C98\u8D34\u5B8C\u76F4\u63A5\u53D1\u4F1A\u5BFC\u81F4\u8017\u65F6\u63A5\u8FD1 0\uFF0C\u8FD9\u4E2A\u503C\u515C\u4F4F\u5B83\u3002"},skipPrefix:{group:"\u751F\u6548\u8303\u56F4",type:"string",default:"",label:"\u8DF3\u8FC7\u524D\u7F00",description:"\u6D88\u606F\u4EE5\u8FD9\u4E2A\u524D\u7F00\u5F00\u5934\u65F6\u4E0D\u52A0\u5C3E\u5DF4\uFF0C\u524D\u7F00\u672C\u8EAB\u4E5F\u4F1A\u88AB\u53BB\u6389\u3002\u7559\u7A7A\u8868\u793A\u6BCF\u6761\u90FD\u52A0\u3002",placeholder:"\u4F8B\u5982 //"}}),Oa;function jg(e){let t=e[1];return t&&typeof t=="object"&&typeof t.content=="string"?t:e.find(n=>n&&typeof n=="object"&&typeof n.content=="string")}function zg(e){try{let t=e.args,n=t[0],r=jg(t);if(!r||typeof r.content!="string"||r.__halcyonTailed)return;let i=r.content;if(i.trim().length===0)return;let a=ot.store.skipPrefix;if(a&&i.startsWith(a)){r.content=i.slice(a.length),r.__halcyonTailed=!0;return}let s=ot.store.template;if(!s.trim())return;let c=i.length,l=_u(i),d=ot.store.jitterPercent,u=xu(s,{model:wu(ot.store.models),seconds:Nu(String(n),ot.store.minSeconds),inputTokens:Da(Math.max(0,ot.store.contextTokens)+l,d),outputTokens:Da(l,d),chars:c,now:new Date});i=Su(i,u,ot.store.ownLine),r.content=i,r.__halcyonTailed=!0}catch(t){io.error("\u52A0\u5C3E\u5DF4\u5931\u8D25\uFF0C\u6D88\u606F\u6309\u539F\u6837\u53D1\u9001",t)}}var Cu=N({id:"message-tail",name:"\u6D88\u606F\u5C3E\u5DF4",description:"\u5728\u81EA\u5DF1\u53D1\u51FA\u7684\u6D88\u606F\u540E\u9762\u81EA\u52A8\u8FFD\u52A0\u4E00\u884C bot \u98CE\u683C\u7684\u5C3E\u5DF4\uFF08Time / Model / Input / Output \u90A3\u79CD\uFF09\u3002\u6574\u884C\u90FD\u662F\u6A21\u677F\uFF0C\u6A21\u578B\u540D\u81EA\u5DF1\u586B\uFF0C\u8017\u65F6\u548C token \u6570\u6309\u4F60\u5B9E\u9645\u6253\u7684\u5185\u5BB9\u7B97\uFF0C\u4E0D\u662F\u5199\u6B7B\u7684\u3002",authors:[{name:"caitemm"}],category:"chat",settings:ot,start(){Eu();let e=P(t=>typeof t?.sendMessage=="function"&&typeof t?.editMessage=="function"&&typeof t?.deleteMessage=="function"&&typeof t?.__halcyon_probe__>"u");if(!e){io.warn("\u672A\u627E\u5230 MessageActions\uFF0C\u5C3E\u5DF4\u65E0\u6CD5\u8FFD\u52A0\u3002\u91CD\u542F\u5BA2\u6237\u7AEF\u540E\u518D\u8BD5\u3002");return}try{Oa=ue.before(e,"sendMessage",zg),io.info("\u5DF2\u6302\u63A5 sendMessage\uFF0C\u53D1\u6D88\u606F\u65F6\u4F1A\u8FFD\u52A0\u5C3E\u5DF4")}catch(t){io.error("\u6302\u63A5 sendMessage \u5931\u8D25",t)}},stop(){Oa?.(),Oa=void 0,Iu()}});var it={PLAYING:0,STREAMING:1,LISTENING:2,WATCHING:3,COMPETING:5};function Ie(e){let t=e?.trim();return t||void 0}function ja(e){let t=e?.trim()??"";return/^https?:\/\//i.test(t)}function za(e,t=n=>Ie(n)){let n=[],r=Ie(e.name);if(!r)return{activity:null,problems:["\u6CA1\u586B\u540D\u79F0\u2014\u2014\u8FD9\u662F\u552F\u4E00\u5FC5\u586B\u9879\uFF0C\u7559\u7A7A\u5C31\u4E0D\u4F1A\u663E\u793A\u4EFB\u4F55\u4E1C\u897F\u3002"]};r.length<2&&n.push("\u540D\u79F0\u81F3\u5C11\u8981\u4E24\u4E2A\u5B57\u7B26\uFF0CDiscord \u4F1A\u4E22\u6389\u66F4\u77ED\u7684\u3002");let i={name:r,type:e.type,flags:1},a=Ie(e.appId);a&&(i.application_id=a);let s=Ie(e.details);s&&(i.details=s);let c=Ie(e.state);if(c&&(i.state=c),e.type===it.STREAMING){let L=Ie(e.streamUrl);L&&/^https?:\/\/(www\.)?(twitch\.tv|youtube\.com)\//i.test(L)?i.url=L:n.push("\u300C\u76F4\u64AD\u4E2D\u300D\u8FD9\u4E2A\u7C7B\u578B\u5FC5\u987B\u914D twitch.tv \u6216 youtube.com \u7684\u94FE\u63A5\uFF0C\u5426\u5219\u4E0D\u663E\u793A\u3002")}let l={},d=e.largeImage?.trim()?t(e.largeImage):void 0;d&&(l.large_image=d);let u=Ie(e.largeText);u&&(l.large_text=u);let h=e.smallImage?.trim()?t(e.smallImage):void 0;h&&(l.small_image=h);let f=Ie(e.smallText);f&&(l.small_text=f),Object.keys(l).length&&(i.assets=l),(l.small_image||l.small_text)&&!l.large_image&&n.push("\u53EA\u914D\u5C0F\u56FE\u65F6 Discord \u4E0D\u4F1A\u663E\u793A\u5B83\u2014\u2014\u5C0F\u56FE\u662F\u6302\u5728\u5927\u56FE\u89D2\u4E0A\u7684\uFF0C\u5F97\u5148\u6709\u5927\u56FE\u3002"),(d||h)&&!a&&n.push("\u56FE\u7247\u9700\u8981\u586B\u5E94\u7528 ID\uFF1A\u56FE\u5E8A\u5730\u5740\u8981\u5148\u6362\u6210 Discord \u7684\u8D44\u6E90 id\uFF0C\u6CA1\u6709\u5E94\u7528 ID \u6362\u4E0D\u4E86\u3002");let v=[],x=[];for(let[L,m]of[[e.button1Text,e.button1Url],[e.button2Text,e.button2Url]]){let b=Ie(L),E=Ie(m);if(!(!b&&!E)){if(!b||!E){n.push("\u6309\u94AE\u7684\u6587\u5B57\u548C\u94FE\u63A5\u8981\u4E00\u8D77\u586B\uFF0C\u53EA\u586B\u4E00\u4E2A\u4F1A\u88AB\u6574\u9897\u4E22\u6389\u3002");continue}v.push(b),x.push(E)}}return v.length&&(i.buttons=v,i.metadata={button_urls:x}),e.timestampMode==="now"&&(i.timestamps={start:e.startedAt}),{activity:i,problems:n}}var Bg=g("custom-rpc"),Wt=new Map;function Ug(e){try{let t=Lr?.Endpoints?.APPLICATION_EXTERNAL_ASSETS;if(typeof t=="function")return t(e)}catch{}return`/applications/${e}/external-assets`}function Ba(e){return Wt.get(e)}async function Tu(e,t){let n=t.filter(r=>r&&!Wt.has(r));if(!(!e||n.length===0))try{let i=(await Q.post({url:Ug(e),body:{urls:n}}))?.body??[];n.forEach((a,s)=>{let c=i[s]?.external_asset_path;typeof c=="string"&&c?Wt.set(a,`mp:${c}`):Wt.set(a,null)})}catch(r){for(let i of n)Wt.set(i,null);Bg.debug("\u56FE\u7247\u6362\u53D6\u8D44\u6E90 id \u5931\u8D25\uFF08\u5E94\u7528 ID \u662F\u5426\u6B63\u786E\uFF1F\u56FE\u7247\u80FD\u516C\u5F00\u8BBF\u95EE\u5417\uFF1F\uFF09",r)}}function Au(){Wt.clear()}var Lu=g("custom-rpc"),Gg="halcyon-custom-rpc",ao=D({name:{group:"\u663E\u793A\u4EC0\u4E48",type:"string",default:"",label:"\u540D\u79F0\uFF08\u5FC5\u586B\uFF09",description:"\u8D44\u6599\u5361\u4E0A\u52A0\u7C97\u7684\u90A3\u4E00\u884C\u3002\u7559\u7A7A\u5219\u6574\u4E2Apresence\u4E0D\u663E\u793A\u3002\u81F3\u5C11\u4E24\u4E2A\u5B57\u7B26\u3002",placeholder:"\u4F8B\u5982 \u9AD8\u4E09\u5012\u8BA1\u65F6",maxLength:128},type:{group:"\u663E\u793A\u4EC0\u4E48",type:"select",default:String(it.PLAYING),label:"\u7C7B\u578B",description:"\u51B3\u5B9A\u540D\u79F0\u524D\u9762\u90A3\u4E2A\u8BCD\uFF1A\u6B63\u5728\u73A9 / \u6B63\u5728\u542C / \u6B63\u5728\u89C2\u770B / \u6B63\u5728\u53C2\u52A0 / \u76F4\u64AD\u4E2D\u3002",options:[{value:String(it.PLAYING),label:"\u6B63\u5728\u73A9"},{value:String(it.LISTENING),label:"\u6B63\u5728\u542C"},{value:String(it.WATCHING),label:"\u6B63\u5728\u89C2\u770B"},{value:String(it.COMPETING),label:"\u6B63\u5728\u53C2\u52A0"},{value:String(it.STREAMING),label:"\u76F4\u64AD\u4E2D\uFF08\u9700\u8981 twitch / youtube \u94FE\u63A5\uFF09"}]},details:{group:"\u663E\u793A\u4EC0\u4E48",type:"string",default:"",label:"\u7B2C\u4E8C\u884C",description:"\u540D\u79F0\u4E0B\u9762\u90A3\u4E00\u884C\uFF0C\u901A\u5E38\u5199\u5728\u505A\u4EC0\u4E48\u3002",maxLength:128},state:{group:"\u663E\u793A\u4EC0\u4E48",type:"string",default:"",label:"\u7B2C\u4E09\u884C",description:"\u518D\u4E0B\u9762\u4E00\u884C\uFF0C\u901A\u5E38\u5199\u72B6\u6001\u3002",maxLength:128},timestampMode:{group:"\u663E\u793A\u4EC0\u4E48",type:"select",default:"none",label:"\u8BA1\u65F6\u5668",description:"\u300C\u5DF2\u8FDB\u884C 12:34\u300D\u90A3\u4E2A\u8DF3\u52A8\u7684\u8BA1\u65F6\u3002",options:[{value:"none",label:"\u4E0D\u663E\u793A"},{value:"now",label:"\u4ECE\u542F\u7528\u65F6\u5F00\u59CB\u8BA1\u65F6"}]},appId:{group:"\u56FE\u7247",type:"string",default:"",label:"\u5E94\u7528 ID",description:"\u53EA\u6709\u914D\u56FE\u7247\u65F6\u624D\u9700\u8981\u3002\u53BB Discord \u5F00\u53D1\u8005\u540E\u53F0\u968F\u4FBF\u5EFA\u4E00\u4E2A\u5E94\u7528\uFF0C\u628A\u5B83\u7684 Application ID \u586B\u8FD9\u91CC\uFF1B\u56FE\u7247\u5730\u5740\u8981\u9760\u5B83\u6362\u6210 Discord \u7684\u8D44\u6E90 id\u3002\u4E0D\u586B\u4E5F\u80FD\u663E\u793A\u6587\u5B57\u3002",placeholder:"19 \u4F4D\u6570\u5B57",maxLength:32},largeImage:{group:"\u56FE\u7247",type:"string",default:"",label:"\u5927\u56FE",description:"\u56FE\u7247\u76F4\u94FE\uFF08https \u5F00\u5934\uFF0C\u9700\u8981\u80FD\u516C\u5F00\u8BBF\u95EE\uFF09\uFF0C\u6216\u8005\u4F60\u5728\u5F00\u53D1\u8005\u540E\u53F0\u4E0A\u4F20\u7684\u8D44\u6E90\u540D\u3002",maxLength:512},largeText:{group:"\u56FE\u7247",type:"string",default:"",label:"\u5927\u56FE\u60AC\u505C\u6587\u5B57",description:"\u9F20\u6807\u653E\u5230\u5927\u56FE\u4E0A\u65F6\u663E\u793A\u3002",maxLength:128},smallImage:{group:"\u56FE\u7247",type:"string",default:"",label:"\u5C0F\u56FE",description:"\u6302\u5728\u5927\u56FE\u53F3\u4E0B\u89D2\u7684\u5C0F\u5706\u56FE\u3002\u5FC5\u987B\u5148\u6709\u5927\u56FE\uFF0C\u5426\u5219\u4E0D\u663E\u793A\u3002",maxLength:512},smallText:{group:"\u56FE\u7247",type:"string",default:"",label:"\u5C0F\u56FE\u60AC\u505C\u6587\u5B57",maxLength:128},streamUrl:{group:"\u76F4\u64AD",type:"string",default:"",label:"\u76F4\u64AD\u94FE\u63A5",description:"\u53EA\u5728\u7C7B\u578B\u9009\u300C\u76F4\u64AD\u4E2D\u300D\u65F6\u7528\uFF0C\u4E14\u53EA\u8BA4 twitch.tv \u548C youtube.com\u3002",maxLength:256},button1Text:{group:"\u6309\u94AE",type:"string",default:"",label:"\u6309\u94AE 1 \u6587\u5B57",description:"\u8D44\u6599\u5361\u4E0B\u65B9\u7684\u6309\u94AE\u3002\u6587\u5B57\u548C\u94FE\u63A5\u5FC5\u987B\u4E00\u8D77\u586B\u3002",maxLength:32},button1Url:{group:"\u6309\u94AE",type:"string",default:"",label:"\u6309\u94AE 1 \u94FE\u63A5",maxLength:512},button2Text:{group:"\u6309\u94AE",type:"string",default:"",label:"\u6309\u94AE 2 \u6587\u5B57",maxLength:32},button2Url:{group:"\u6309\u94AE",type:"string",default:"",label:"\u6309\u94AE 2 \u94FE\u63A5",maxLength:512}}),$u=Date.now(),Ua=[],Ga=!1,Ha="";function Mu(){let e=ao.store;return{appId:e.appId,type:Number(e.type)||0,name:e.name,details:e.details,state:e.state,largeImage:e.largeImage,largeText:e.largeText,smallImage:e.smallImage,smallText:e.smallText,streamUrl:e.streamUrl,button1Text:e.button1Text,button1Url:e.button1Url,button2Text:e.button2Text,button2Url:e.button2Url,timestampMode:e.timestampMode,startedAt:$u}}function Fa(e){try{he()?.dispatch({type:"LOCAL_ACTIVITY_UPDATE",socketId:Gg,activity:e})}catch(t){Lu.error("presence \u4E0B\u53D1\u5931\u8D25",t)}}async function Pu(){if(!Ga){Ga=!0;try{let e=Mu(),t=s=>{let c=s.trim();if(!c)return;if(!ja(c))return c;let l=Ba(c);return typeof l=="string"?l:void 0},n=za(e,t);Fa(n.activity);let r=n.problems.join(" / ");r!==Ha&&(Ha=r,r&&Lu.warn(r));let a=[e.largeImage,e.smallImage].map(s=>s.trim()).filter(ja).filter(s=>Ba(s)===void 0);if(a.length&&e.appId.trim()){await Tu(e.appId.trim(),a);let s=za(Mu(),t);Fa(s.activity)}}finally{Ga=!1}}}var Du=N({id:"custom-rpc",name:"\u81EA\u5B9A\u4E49\u300C\u6B63\u5728\u73A9\u300D",description:"\u5728\u81EA\u5DF1\u7684\u8D44\u6599\u5361\u4E0A\u6302\u4E00\u6761\u81EA\u5B9A\u4E49\u7684 Rich Presence\uFF1A\u6B63\u5728\u73A9 / \u6B63\u5728\u542C / \u6B63\u5728\u89C2\u770B\u4EC0\u4E48\u90FD\u7531\u4F60\u5199\uFF0C\u53EF\u4EE5\u914D\u5927\u5C0F\u56FE\u3001\u8BA1\u65F6\u5668\u548C\u4E24\u4E2A\u6309\u94AE\u3002\u4E0D\u9700\u8981 Nitro\uFF0C\u800C\u4E14\u522B\u4EBA\u771F\u7684\u80FD\u770B\u5230\u3002",authors:[{name:"caitemm"}],category:"misc",settings:ao,start(){$u=Date.now(),Ua=Object.keys(ao.schema).map(e=>ao.subscribe(e,()=>{Pu()})),Pu()},stop(){for(let e of Ua)e();Ua=[],Ha="",Au(),Fa(null)}});var at=D({zoom:{group:"\u653E\u5927\u955C",type:"number",default:2.5,min:1.5,max:10,step:.5,label:"\u9ED8\u8BA4\u500D\u7387",description:"\u6EDA\u8F6E\u53EF\u4EE5\u968F\u65F6\u8C03\u6574\uFF1B\u8FD9\u91CC\u662F\u6BCF\u6B21\u60AC\u505C\u65F6\u7684\u8D77\u59CB\u500D\u7387\u3002"},lensSize:{group:"\u653E\u5927\u955C",type:"number",default:280,min:120,max:800,step:20,label:"\u955C\u7247\u5927\u5C0F\uFF08\u50CF\u7D20\uFF09",description:"\u6309\u4F4F Shift \u6EDA\u8F6E\u53EF\u4EE5\u968F\u65F6\u6539\u3002"},minSize:{group:"\u653E\u5927\u955C",type:"number",default:100,min:40,max:400,step:10,label:"\u6700\u5C0F\u751F\u6548\u5C3A\u5BF8\uFF08\u50CF\u7D20\uFF09",description:"\u6BD4\u8FD9\u4E2A\u5C0F\u7684\u56FE\u4E0D\u7ED9\u653E\u5927\u955C\uFF0C\u7528\u6765\u6392\u9664\u8868\u60C5\u548C\u5934\u50CF\u3002\u8C03\u4F4E\u4F1A\u8FDE\u8868\u60C5\u4E00\u8D77\u653E\u5927\u3002"},square:{group:"\u653E\u5927\u955C",type:"boolean",default:!1,label:"\u65B9\u5F62\u955C\u7247",description:"\u9ED8\u8BA4\u662F\u5706\u5F62\u3002"},requireShift:{group:"\u653E\u5927\u955C",type:"boolean",default:!1,label:"\u53EA\u5728\u6309\u4F4F Alt \u65F6\u542F\u7528",description:"\u5F00\u542F\u540E\u5E73\u65F6\u4E0D\u51FA\u73B0\uFF0C\u6309\u4F4F Alt \u60AC\u505C\u624D\u6709\u2014\u2014\u5ACC\u5B83\u592A\u4E3B\u52A8\u5C31\u6253\u5F00\u8FD9\u4E2A\u3002"}}),re=null,_e=null,Pn=2.5,st=280,qa=0,Ka=0,Yt=0;function co(){_e=null,re&&(re.style.display="none")}function Hg(){if(Yt=0,!_e||!re)return;let e=_e.getBoundingClientRect();if(e.width===0||e.height===0){co();return}let t=Ol(e,qa,Ka,st,Pn),n=st/2;re.style.display="block",re.style.width=`${st}px`,re.style.height=`${st}px`,re.style.borderRadius=at.store.square?"8px":"50%",re.style.left=`${Math.round(qa-n)}px`,re.style.top=`${Math.round(Ka-n)}px`,re.style.backgroundImage=`url("${Or(_e.currentSrc||_e.src)}")`,re.style.backgroundSize=`${Math.round(t.bgWidth)}px ${Math.round(t.bgHeight)}px`,re.style.backgroundPosition=`${Math.round(t.bgX)}px ${Math.round(t.bgY)}px`}function zu(){Yt||(Yt=requestAnimationFrame(Hg))}function Ou(e){if(qa=e.clientX,Ka=e.clientY,at.store.requireShift&&!e.altKey){_e&&co();return}let t=document.elementFromPoint(e.clientX,e.clientY);if(!Bl(t,at.store.minSize)){_e&&co();return}t!==_e&&(_e=t,Pn=at.store.zoom,st=at.store.lensSize),zu()}function ju(e){_e&&(e.shiftKey?st=zl(st,e.deltaY):Pn=jl(Pn,e.deltaY,1.5,10),e.preventDefault(),zu())}function so(){co()}var Bu=N({id:"image-zoom",name:"\u56FE\u7247\u653E\u5927\u955C",description:"\u9F20\u6807\u60AC\u505C\u5728\u56FE\u7247\u4E0A\u51FA\u73B0\u653E\u5927\u955C\uFF0C\u6EDA\u8F6E\u8C03\u500D\u7387\u3001Shift+\u6EDA\u8F6E\u8C03\u955C\u7247\u5927\u5C0F\u3002\u653E\u5927\u7528\u7684\u662F\u539F\u56FE\uFF08\u53BB\u6389 Discord \u7684\u7F29\u7565\u56FE\u53C2\u6570\uFF09\uFF0C\u6240\u4EE5\u653E\u5927\u540E\u662F\u771F\u7684\u66F4\u6E05\u695A\uFF0C\u800C\u4E0D\u662F\u628A\u5C0F\u56FE\u62C9\u5927\u3002",authors:[{name:"caitemm"}],category:"appearance",settings:at,start(){Pn=at.store.zoom,st=at.store.lensSize,document.addEventListener("mousemove",Ou,!0),document.addEventListener("wheel",ju,{capture:!0,passive:!1}),document.addEventListener("mouseleave",so,!0),window.addEventListener("blur",so)},stop(){document.removeEventListener("mousemove",Ou,!0),document.removeEventListener("wheel",ju,!0),document.removeEventListener("mouseleave",so,!0),window.removeEventListener("blur",so),Yt&&cancelAnimationFrame(Yt),Yt=0,_e=null,re?.remove(),re=null}});var lo=g("console-cleaner"),Uu=D({hideSelfXss:{group:"\u5185\u7F6E\u89C4\u5219",type:"boolean",default:!0,label:"\u5C4F\u853D\u81EA\u6211 XSS \u8B66\u544A",description:"Discord \u90A3\u6761\u6BCF\u79D2\u91CD\u5237\u7684\u7EA2\u8272\u201C\u7B49\u4E00\u4E0B\uFF01/ Stop!\u201D\u7C98\u8D34\u8B66\u544A\u3002"},hideLocaleSpam:{group:"\u5185\u7F6E\u89C4\u5219",type:"boolean",default:!0,label:"\u5C4F\u853D\u672C\u5730\u5316\u7F3A\u5931\u5237\u5C4F",description:"\u201C\u2026 does not have a value in the requested locale \u2026\u201D\uFF0C\u5BA2\u6237\u7AEF mod \u8BA2\u9605\u4E8B\u4EF6\u65F6\u4F1A\u75AF\u72C2\u5237\u3002"},hideRiveSpam:{group:"\u5185\u7F6E\u89C4\u5219",type:"boolean",default:!0,label:"\u5C4F\u853D Rive \u52A8\u753B\u62A5\u9519",description:"\u201CCould not find a View Model linked to Artboard \u2026\u201D\uFF0C\u9644\u5E26\u8D85\u957F wasm \u5806\u6808\u3002"},hidePreloadWarnings:{group:"\u5185\u7F6E\u89C4\u5219",type:"boolean",default:!0,label:"\u5C4F\u853D\u8D44\u6E90\u9884\u52A0\u8F7D\u8B66\u544A",description:"\u201Cresource was preloaded using link preload but not used \u2026\u201D\u3002\u89C1\u4E0B\u65B9\u8BF4\u660E\uFF1A\u90E8\u5206\u6B64\u7C7B\u8B66\u544A\u7531\u6D4F\u89C8\u5668\u76F4\u63A5\u4EA7\u751F\uFF0C\u65E0\u6CD5\u62E6\u622A\u3002"},customPatterns:{group:"\u81EA\u5B9A\u4E49",type:"string-list",default:[],label:"\u81EA\u5B9A\u4E49\u5C4F\u853D\u5173\u952E\u8BCD",description:"\u4EFB\u4F55\u4E00\u6761 console \u6D88\u606F\u53EA\u8981\u5305\u542B\u8FD9\u91CC\u7684\u67D0\u4E2A\u5B50\u4E32\uFF0C\u5C31\u4F1A\u88AB\u4E22\u5F03\uFF08\u533A\u5206\u5927\u5C0F\u5199\uFF09\u3002",itemPlaceholder:"\u8981\u5C4F\u853D\u7684\u6587\u5B57\u7247\u6BB5"}}),Fg=["\u7B49\u4E00\u4E0B","\u5728\u8FD9\u91CC\u7C98\u8D34","\u5982\u679C\u6709\u4EBA\u544A\u8BC9\u60A8","\u8BF7\u5173\u95ED\u6B64\u7A97\u53E3","Stop!","self-XSS","browser feature intended for developers","This is a browser feature","Nicht so schnell","Attends","Alto","\u3061\u3087\u3063\u3068\u5F85\u3063\u3066","\uC7A0\uAE50"],qg=["does not have a value in the requested locale"],Kg=["Could not find a View Model linked to Artboard","BaseGlowRemapped"],Vg=["was preloaded using link preload","preloaded intentionally"],Wg=["log","info","warn","error","debug"];function Yg(e){let t="";for(let n of e)typeof n=="string"?t+=n+" ":(typeof n=="number"||typeof n=="boolean")&&(t+=String(n)+" ");return t}function Ln(e,t){for(let n of t)if(n&&e.includes(n))return!0;return!1}function Jg(e){if(typeof e[0]=="string"&&e[0].startsWith("%cHalcyon"))return!1;let t=Yg(e);if(t==="")return!1;let n=Uu.store;return!!(n.hideSelfXss&&Ln(t,Fg)||n.hideLocaleSpam&&Ln(t,qg)||n.hideRiveSpam&&Ln(t,Kg)||n.hidePreloadWarnings&&Ln(t,Vg)||n.customPatterns.length&&Ln(t,n.customPatterns))}var uo=[],Va=0;function Rg(){return e=>{try{if(Jg(e.args)){Va++;return}}catch{}return e.callOriginal()}}var Gu=N({id:"console-cleaner",name:"\u63A7\u5236\u53F0\u51C0\u5316",description:"\u5C4F\u853D Discord \u5728\u5F00\u53D1\u8005\u63A7\u5236\u53F0\u91CC\u5237\u5C4F\u7684\u65E0\u7528\u4FE1\u606F\uFF08\u81EA\u6211 XSS \u8B66\u544A\u3001Rive \u52A8\u753B\u62A5\u9519\u3001\u672C\u5730\u5316\u7F3A\u5931\u3001\u8D44\u6E90\u9884\u52A0\u8F7D\u8B66\u544A\uFF09\uFF0C\u652F\u6301\u81EA\u5B9A\u4E49\u5173\u952E\u8BCD\u3002\u5173\u95ED\u63D2\u4EF6\u5373\u6062\u590D\u539F\u59CB console\u3002",authors:[{name:"caitemm"},{name:"catie"}],category:"utility",settings:Uu,start(){let e=globalThis.console;if(!e){lo.warn("\u672A\u627E\u5230 console \u5BF9\u8C61\uFF0C\u63D2\u4EF6\u65E0\u4E8B\u53EF\u505A");return}Va=0;let t=Rg();for(let n of Wg)if(typeof e[n]=="function")try{uo.push(ue.instead(e,n,t))}catch(r){lo.error(`\u6302\u63A5 console.${n} \u5931\u8D25`,r)}lo.info(`\u5DF2\u51C0\u5316 console\uFF08\u62E6\u622A ${uo.length} \u4E2A\u65B9\u6CD5\uFF09\u3002\u6CE8\u610F\uFF1A\u6D4F\u89C8\u5668\u81EA\u8EAB\u4EA7\u751F\u7684\u8B66\u544A\uFF08\u5982\u67D0\u4E9B preload \u63D0\u793A\uFF09\u65E0\u6CD5\u901A\u8FC7 JS \u62E6\u622A\u3002`)},stop(){for(let e of uo)try{e()}catch{}uo=[],lo.info(`\u5DF2\u6062\u590D\u539F\u59CB console\uFF08\u672C\u6B21\u5171\u5C4F\u853D ${Va} \u6761\u6D88\u606F\uFF09`)}});var $n=g("emote-cloner"),Xg=256*1024,Qg=512*1024,ho=null;function Zg(){return ho||(ho=lr(".GUILD_EMOJIS(","EMOJI_UPLOAD_START")??null,ho)}function ey(e){let t=(e||"emoji").split("~")[0].replace(/[^\w]/g,"_");return t.length<2&&(t=`${t}_e`),t.slice(0,32)}function ty(e){return e===4?"gif":e===3?"json":"png"}function ny(e,t){return`https://cdn.discordapp.com/emojis/${e}.webp?size=${t}&lossless=true&animated=true`}function ry(e,t,n){return`https://media.discordapp.net/stickers/${e}.${t}?size=${n}&lossless=true&animated=true`}async function Hu(e,t){for(let n=4096;n>=16;n/=2){let r=e(n),i=await fetch(r);if(!i.ok)throw new Error(`\u4E0B\u8F7D\u56FE\u7247\u5931\u8D25\uFF1AHTTP ${i.status}`);let a=await i.blob();if(a.size<=t)return a}throw new Error(`\u56FE\u7247\u8D85\u51FA\u5927\u5C0F\u9650\u5236\uFF08${Math.round(t/1024)}KB\uFF09`)}function oy(e){return new Promise((t,n)=>{let r=new FileReader;r.onload=()=>t(String(r.result)),r.onerror=()=>n(r.error??new Error("\u8BFB\u53D6\u56FE\u7247\u5931\u8D25")),r.readAsDataURL(e)})}function Fu(e){if(e==null)return null;if(e.body!=null&&!(typeof e.body=="object"&&Object.keys(e.body).length===0))return e.body;if(typeof e.text=="string"&&e.text)try{return JSON.parse(e.text)}catch{}return e.body??null}function Wa(e){let t=e?.body??e?.response?.body;if(t){try{let n=i=>{if(!(!i||typeof i!="object")){if(Array.isArray(i._errors)&&i._errors[0]?.message)return i._errors[0].message;for(let a of Object.keys(i)){let s=n(i[a]);if(s)return s}}},r=n(t.errors);if(r)return r}catch{}if(typeof t.message=="string")return t.message}if(typeof e?.text=="string")try{let n=JSON.parse(e.text);if(n?.message)return n.message}catch{}return e?.message?String(e.message):"\u672A\u77E5\u9519\u8BEF"}async function qu(e,t){let n=await Hu(s=>ny(t.id,s),Xg),r=await oy(n),i=ey(t.name),a=Zg();if(typeof a=="function")try{await a({guildId:e,name:i,image:r});return}catch(s){throw $n.error("emoji \u4E0A\u4F20\uFF08action\uFF09\u5931\u8D25",s),new Error(Wa(s))}try{await Q.post({url:`/guilds/${e}/emojis`,body:{image:r,name:i,roles:[]}})}catch(s){throw $n.error("emoji \u4E0A\u4F20\uFF08REST\uFF09\u5931\u8D25",s),new Error(Wa(s))}}async function iy(e){try{let t=Sl.getStickerById?.(e);if(t)return t}catch{}try{let t=await Q.get({url:`/stickers/${e}`}),n=Fu(t);if(n)try{he()?.dispatch({type:"STICKER_FETCH_SUCCESS",sticker:n})}catch{}return n}catch(t){return $n.warn("could not fetch sticker info; using fallbacks",t),null}}async function Ku(e,t){let n=await iy(t.id);if(n?.format_type===3)throw new Error("\u8FD9\u662F Lottie \u52A8\u6001\u8D34\u7EB8\uFF0C\u65E0\u6CD5\u590D\u5236");let r=(n?.name||t.name||"sticker").slice(0,30),i=t.tags||n?.tags||"\u{1F642}",a=(t.description??n?.description??"").slice(0,100),s=ty(n?.format_type),c=await Hu(h=>ry(t.id,s,h),Qg),l=new FormData;l.append("name",r),l.append("tags",i),l.append("description",a),l.append("file",new File([c],`sticker.${s}`,{type:s==="gif"?"image/gif":"image/png"}));let d=Lr?.Endpoints?.GUILD_STICKER_PACKS?.(e)??`/guilds/${e}/stickers`,u;try{let h=await Q.post({url:d,body:l});u=Fu(h),u&&!u.id&&u.sticker?.id&&(u=u.sticker)}catch(h){throw $n.error("sticker \u4E0A\u4F20\u5931\u8D25",h),new Error(Wa(h))}$n.info("sticker uploaded",{id:u?.id,name:u?.name});try{he()?.dispatch({type:"GUILD_STICKERS_CREATE_SUCCESS",guildId:e,sticker:{...u,user:ee.getCurrentUser?.()}})}catch{}}var Vu=g("emote-cloner"),Ya=/^\d{5,25}$/,ay=/^\w{1,32}(?:~\d+)?$/;function Jt(e){if(typeof e!="string")return;let t=e.replace(/:/g,"").trim();return ay.test(t)?t:void 0}function po(e){if(typeof e!="string")return;let t=e.trim();return t&&t.length<=30&&!t.includes(`
`)?t:void 0}function Wu(e){if(!e)return!1;try{let t=new URL(e,location.href);return t.pathname.endsWith(".gif")||t.searchParams.get("animated")==="true"}catch{return/\.gif(\?|$)/.test(e)||e.includes("animated=true")}}function sy(e){let t=e.match(/\/emojis\/(\d+)\.(\w+)/);if(!t)return null;let n;try{let r=new URL(e,location.href).searchParams.get("name");n=r?decodeURIComponent(r):void 0}catch{}return{id:t[1],isAnimated:t[2]==="gif"||/animated=true/.test(e),name:n}}function cy(e){let t=e.match(/\/stickers\/(\d+)\./);return t?{id:t[1]}:null}function Yu(e){return String(e?.className??"").toLowerCase().includes("lottie")}function ly(e){let t=new Set,n=[],r=a=>{a&&a.tagName==="IMG"&&!t.has(a)&&(t.add(a),n.push(a))};r(e),e.querySelectorAll?.("img").forEach(r);let i=e.parentElement;for(let a=0;a<4&&i;a++,i=i.parentElement)r(i),i.querySelectorAll?.(":scope > img").forEach(r);return n}function dy(e,t=5){let n=[],r=e;for(let i=0;r&&i<=t;i++,r=r.parentElement)n.push(r);return n}var uy=5,hy=900;function py(e,t){let n=hy,r=new Set,i=(a,s)=>{if(a==null||typeof a!="object"||s>uy||n--<=0||r.has(a))return null;if(r.add(a),Array.isArray(a)){for(let l of a){let d=i(l,s+1);if(d)return d}return null}if(a.$$typeof!=null||a.nodeType!=null||a.stateNode!=null)return null;try{if(String(a.id??"")===t&&typeof a.name=="string")return{name:a.name,animated:!!(a.animated??a.isAnimated)};if(typeof a.emojiName=="string"&&String(a.emojiId??"")===t)return{name:a.emojiName,animated:!!(a.animated??a.isAnimated)}}catch{}let c;try{c=Object.keys(a)}catch{return null}for(let l of c){if(l.charCodeAt(0)===95)continue;let d;try{d=a[l]}catch{continue}if(d==null||typeof d!="object")continue;let u=i(d,s+1);if(u)return u}return null};return i(e,0)}function Ju(e,t){for(let n of ye(e)){let r=py(n,t);if(r)return r}return null}function fy(e){let t=e.closest?.("[id^='chat-messages-'],[data-list-item-id*='chat-messages']");if(!t)return null;let r=(t.id||t.dataset?.listItemId||"").match(/\d{5,25}/g);if(!r||r.length===0)return null;let i=r[r.length-1],a=r.length>1?r[r.length-2]:void 0;try{a??=le.getChannelId?.()}catch{}if(!a)return null;try{return Bt.getMessage?.(a,i)??null}catch{return null}}function Ru(e){let t=[];for(let r of ye(e)){let i=r?.message;if(i&&typeof i=="object"&&typeof i.content=="string"){t.push(i);break}}let n=fy(e);return n&&typeof n=="object"&&n!==t[0]&&t.push(n),t}function my(e,t){if(!Ya.test(t))return;let n=new RegExp(`<a?:(\\w+)(?:~\\d+)?:${t}>`);for(let r of Ru(e))try{let i=typeof r.content=="string"?n.exec(r.content):null,a=Jt(i?.[1]);if(a)return a;let s=Array.isArray(r.reactions)?r.reactions:[];for(let c of s)if(String(c?.emoji?.id??"")===t){let l=Jt(c.emoji.name);if(l)return l}}catch{}}function gy(e,t){for(let n of Ru(e))try{let r=Array.isArray(n.stickerItems)?n.stickerItems:Array.isArray(n.stickers)?n.stickers:[];for(let i of r)if(String(i?.id??"")===t){let a=po(i.name);if(a)return a}}catch{}}function yy(e){let t=wn,n=[()=>t.getCustomEmojiById?.(e),()=>t.getUsableCustomEmojiById?.(e),()=>t.getDisambiguatedEmojiContext?.()?.getById?.(e)];for(let r of n)try{let i=Jt(r()?.name);if(i)return i}catch{}}var by=["data-name","alt","aria-label","title"];function vy(e){for(let t of e)for(let n of by){let r=Jt(t.getAttribute?.(n));if(r)return r}}function _y(e){let t=e.closest?.("[data-type='emoji'],[data-type='sticker']");if(t){let{id:n,name:r,type:i}=t.dataset,a=t.tagName==="IMG"?t:t.querySelector("img");if(n&&Ya.test(n)&&i==="emoji")return{kind:"emoji",id:n,domName:r,img:a,isAnimated:Wu(a?.currentSrc||a?.src)};if(n&&Ya.test(n)&&i==="sticker"&&!Yu(t))return{kind:"sticker",id:n,domName:r,img:a,isAnimated:!1}}for(let n of ly(e)){let r=n.currentSrc||n.src||"",i=sy(r);if(i)return{kind:"emoji",id:i.id,domName:i.name,img:n,isAnimated:i.isAnimated||Wu(r)};let a=cy(r);if(a)return Yu(n)?null:{kind:"sticker",id:a.id,domName:n.alt,img:n,isAnimated:!1}}return null}function Xu(e){if(!e)return null;let t=_y(e);if(!t)return null;let n=dy(e);if(t.img&&!n.includes(t.img)&&n.push(t.img),t.kind==="sticker"){let a=Ju(e,t.id),s=po(a?.name)??gy(e,t.id)??po(t.domName)??po(t.img?.alt);return{kind:"sticker",id:t.id,name:s}}let r=Ju(e,t.id),i=Jt(r?.name)??my(e,t.id)??yy(t.id)??vy(n)??Jt(t.domName);return i?Vu.debug("resolved emoji",{id:t.id,name:i}):Vu.warn(`could not resolve this emoji's name; falling back to "emoji"`,{id:t.id}),{kind:"emoji",id:t.id,name:i??"emoji",isAnimated:r?.animated??t.isAnimated}}var Qu=g("emote-cloner");function xy(e){let t=e.icon&&e.icon.startsWith("a_")?"gif":"png";return`https://cdn.discordapp.com/icons/${e.id}/${e.icon}.${t}?size=64`}var It=null,mo=null,Dn=null;function fo(){if(Dn&&(document.removeEventListener("keydown",Dn),Dn=null),mo){try{mo()}catch{}mo=null}It&&(It.remove(),It=null)}function Zu(e){B(),fo(),It=document.createElement("div"),It.className="halcyon",document.body.appendChild(It),Dn=t=>{t.key==="Escape"&&fo()},document.addEventListener("keydown",Dn);try{mo=X(o.createElement(wy,{title:e.title,guilds:e.guilds,onPick:e.onPick,onClose:fo}),It)}catch(t){Qu.error("could not open guild picker",t),fo()}}function wy({title:e,guilds:t,onPick:n,onClose:r}){let[i,a]=y(""),[s,c]=y({state:"idle"}),l=i.trim().toLowerCase(),d=l?t.filter(h=>h.name.toLowerCase().includes(l)):t,u=h=>{c({state:"working",guild:h.name}),Promise.resolve().then(()=>n(h.id)).then(()=>{c({state:"done",guild:h.name}),setTimeout(r,1e3)}).catch(f=>{Qu.error("clone failed",f),c({state:"error",guild:h.name,message:f?.message??String(f)})})};return o.createElement("div",{className:"hc-overlay",role:"dialog","aria-modal":"true","aria-label":e,onMouseDown:h=>{h.target===h.currentTarget&&s.state!=="working"&&r()}},o.createElement("div",{className:"hc-emote-picker"},o.createElement("div",{className:"hc-emote-picker__head"},o.createElement("span",{className:"hc-emote-picker__title"},e),o.createElement("button",{className:"hc-emote-picker__close",onClick:r,"aria-label":"\u5173\u95ED",disabled:s.state==="working"},"\u2715")),s.state==="idle"?o.createElement(o.Fragment,null,o.createElement("div",{className:"hc-emote-picker__search"},o.createElement("input",{className:"hc-input",placeholder:"\u641C\u7D22\u670D\u52A1\u5668\u2026",value:i,autoFocus:!0,onChange:h=>a(h.currentTarget.value)})),o.createElement("div",{className:"hc-emote-picker__list"},d.length===0?o.createElement("div",{className:"hc-emote-picker__empty"},t.length===0?"\u6CA1\u6709\u53EF\u7BA1\u7406\u8868\u60C5\u7684\u670D\u52A1\u5668":"\u6CA1\u6709\u5339\u914D\u7684\u670D\u52A1\u5668"):d.map(h=>o.createElement("div",{key:h.id,className:"hc-emote-picker__item",role:"button",tabIndex:0,onClick:()=>u(h),onKeyDown:f=>{f.key==="Enter"&&u(h)}},o.createElement("div",{className:"hc-emote-picker__icon"},h.icon?o.createElement("img",{src:xy(h),alt:""}):h.name.charAt(0).toUpperCase()),o.createElement("div",{className:"hc-emote-picker__name"},h.name))))):o.createElement("div",{className:"hc-emote-picker__status","data-state":s.state},o.createElement("div",{className:"hc-emote-picker__status-icon"},s.state==="working"?"\u23F3":s.state==="done"?"\u2713":"\u2715"),o.createElement("div",{className:"hc-emote-picker__status-title"},s.state==="working"?`\u6B63\u5728\u590D\u5236\u5230 ${s.guild}\u2026`:s.state==="done"?`\u5DF2\u590D\u5236\u5230 ${s.guild}`:"\u590D\u5236\u5931\u8D25"),s.state==="error"&&o.createElement(o.Fragment,null,o.createElement("div",{className:"hc-emote-picker__status-detail"},s.message),o.createElement("button",{className:"hc-btn hc-btn--secondary hc-btn--sm",onClick:()=>c({state:"idle"})},"\u8FD4\u56DE\u5217\u8868")))))}var eh=g("emote-cloner"),Ja={CREATE_GUILD_EXPRESSIONS:1n<<43n,MANAGE_GUILD_EXPRESSIONS:1n<<40n,MANAGE_EMOJIS_AND_STICKERS:1n<<30n};function Sy(e){try{return!!(Pr.can?.(Ja.CREATE_GUILD_EXPRESSIONS,e)||Pr.can?.(Ja.MANAGE_GUILD_EXPRESSIONS,e)||Pr.can?.(Ja.MANAGE_EMOJIS_AND_STICKERS,e))}catch{return!1}}function ky(){try{let e=V.getGuilds?.()??{};return Object.values(e).filter(t=>Sy(t)).map(t=>({id:String(t?.id??""),name:String(t?.name??t?.id??"\u672A\u77E5\u670D\u52A1\u5668"),icon:t?.icon?String(t.icon):null})).filter(t=>t.id).sort((t,n)=>t.name.localeCompare(n.name,"zh-CN"))}catch{return[]}}function Ey(e){let t=e.kind==="emoji";Zu({title:t?"\u590D\u5236\u8868\u60C5\u5230\u670D\u52A1\u5668":"\u590D\u5236\u8D34\u7EB8\u5230\u670D\u52A1\u5668",guilds:ky(),onPick:n=>t?qu(n,e):Ku(n,e)})}function Iy(e){let t=Xu(Cr());if(!t)return;let n=jt();if(!n){eh.warn("MenuItem component not learned yet; skipping clone item this open");return}let r=t.kind==="emoji"?`\u590D\u5236\u8868\u60C5 :${t.name}: \u5230\u670D\u52A1\u5668`:t.name?`\u590D\u5236\u8D34\u7EB8 ${t.name} \u5230\u670D\u52A1\u5668`:"\u590D\u5236\u8D34\u7EB8\u5230\u670D\u52A1\u5668";e.push(o.createElement(n,{id:t.kind==="emoji"?"halcyon-clone-emoji":"halcyon-clone-sticker",label:r,action:()=>Ey(t)}))}var Ra=[],th=N({id:"emote-cloner",name:"\u8868\u60C5\u514B\u9686",description:"\u53F3\u952E\u4EFB\u610F\u81EA\u5B9A\u4E49\u8868\u60C5\u6216\u8D34\u7EB8\uFF0C\u5373\u53EF\u628A\u5B83\u590D\u5236\u5230\u4F60\u6709\u7BA1\u7406\u6743\u9650\u7684\u670D\u52A1\u5668\uFF08\u4FDD\u7559\u539F\u540D\uFF09\u3002\u652F\u6301\u6D88\u606F\u91CC\u7684\u8868\u60C5 / \u8868\u60C5\u56DE\u5E94 / \u8D34\u7EB8\uFF0C\u4EE5\u53CA\u8868\u60C5\u9009\u62E9\u5668\u91CC\u7684\u9879\u76EE\u3002",authors:[{name:"Vencord"},{name:"caitemm"}],category:"utility",start(){Ra.push(zt(["message","expression-picker"],Iy)),eh.info("emote-cloner ready \u2014 right-click an emoji or sticker")},stop(){for(let e of Ra)try{e()}catch{}Ra=[]}});function go(e,t=32){return e.id?De(e.id,e.animated,t):null}function nh(e,t,n=48){if(!t)return null;let r=t.startsWith("a_")?"gif":"png";return`https://cdn.discordapp.com/icons/${e}/${t}.${r}?size=${n}`}function Ne(e){return e.id?`${e.name}:${e.id}`:e.name}function Ny(e){try{let t=V.getGuild?.(e)??(V.getGuilds?.()??{})[e];return{name:String(t?.name??e),icon:t?.icon?String(t.icon):null}}catch{return{name:e,icon:null}}}function Cy(e){return!e?.id||!e?.name||e.available===!1?null:{id:String(e.id),name:String(e.name),animated:!!e.animated}}function rh(){let e=[],t={};try{t=wn.getGuilds?.()??{}}catch{t={}}let n=(i,a)=>{let s=[];for(let c of a){let l=Cy(c);l&&s.push(l)}if(s.length){let c=Ny(i);e.push({guildId:i,guildName:c.name,guildIcon:c.icon,emojis:s})}},r=Object.entries(t);if(r.length)for(let[i,a]of r){let s=Array.isArray(a)?a:Array.isArray(a?.emojis)?a.emojis:[];n(i,s)}else try{let i=V.getGuilds?.()??{};for(let a of Object.keys(i)){let s=wn.getGuildEmoji?.(a)??[];Array.isArray(s)&&n(a,s)}}catch{}return e.sort((i,a)=>i.guildName.localeCompare(a.guildName,"zh-CN")),e}function oh(e){let t=e.trim();if(!t)return null;let n=/^<(a)?:(\w+):(\d+)>$/.exec(t);return n?{id:n[3],name:n[2],animated:n[1]==="a"}:/^\d{5,25}$/.test(t)?null:{id:"",name:t,animated:!1}}var Ty=g("quick-react"),On;function Xa(){return On&&typeof On.addReaction=="function"||(On=P(e=>typeof e?.addReaction=="function"&&typeof e?.removeReaction=="function"&&typeof e?.__halcyon_probe__>"u")),On}function Ay(e){return new Promise(t=>setTimeout(t,e))}function ih(e,t,n){return`/channels/${e}/messages/${t}/reactions/${encodeURIComponent(Ne(n))}/@me`}function ah(e){return{id:e.id||void 0,name:e.name,animated:e.animated}}async function My(e,t,n){let r=Q;if(r&&typeof r.put=="function"){await r.put({url:ih(e,t,n),oldFormErrors:!0});return}let i=Xa();if(i&&typeof i.addReaction=="function"){await Promise.resolve(i.addReaction(e,t,ah(n)));return}throw new Error("\u627E\u4E0D\u5230\u6DFB\u52A0\u53CD\u5E94\u7684\u63A5\u53E3\uFF08RestAPI / reaction action \u90FD\u6CA1\u89E3\u6790\u5230\uFF09")}async function Py(e,t,n){let r=Q;if(r&&typeof r.del=="function"){await r.del({url:ih(e,t,n),oldFormErrors:!0});return}let i=Xa();if(i&&typeof i.removeReaction=="function"){await Promise.resolve(i.removeReaction(e,t,ah(n)));return}throw new Error("\u627E\u4E0D\u5230\u79FB\u9664\u53CD\u5E94\u7684\u63A5\u53E3")}function Ly(e,t){let n=e?.emoji;return n?t.id?String(n.id??"")===t.id:!n.id&&String(n.name??"")===t.name:!1}function $y(e,t,n){let r=[];try{let s=Bt.getMessage?.(e,t);r=Array.isArray(s?.reactions)?s.reactions:[]}catch{r=[]}let i=[],a=[];for(let s of n){let c=r.find(l=>Ly(l,s));c&&(c.me||c.meBurst)?a.push(s):i.push(s)}return{allMine:n.length>0&&i.length===0,missing:i,mine:a}}function Qa(){let e=Q;if(typeof e?.put=="function"||typeof e?.del=="function")return!0;let t=Xa();return!!(t&&typeof t.addReaction=="function")}async function sh(e,t,n,r){let{allMine:i,missing:a}=$y(e,t,n),s=i?"remove":"add",c=i?n:a,l=c.length,d=0,u=0;for(let h=0;h<l;h++){try{s==="add"?await My(e,t,c[h]):await Py(e,t,c[h])}catch(f){u++,Ty.warn(`${s==="add"?"\u6DFB\u52A0":"\u79FB\u9664"}\u53CD\u5E94 :${c[h].name}: \u5931\u8D25`,f)}d++,r>0&&h<l-1&&await Ay(r)}return{action:s,total:l,done:d,failed:u}}var ch="halcyon-quick-react",Dy=`
.hc-qr-inline{display:flex;flex-direction:column;max-height:340px;margin-top:8px;border:1px solid var(--hc-separator-opaque,rgba(255,255,255,.08));border-radius:8px;overflow:hidden;background:var(--hc-bg-secondary,rgba(0,0,0,.12))}
.hc-qr-inline-head{display:flex;align-items:center;gap:8px;padding:8px 10px;border-bottom:1px solid var(--hc-separator-opaque,rgba(255,255,255,.08))}
.hc-qr-grid{display:flex;flex-wrap:wrap;gap:6px;padding:2px}
.hc-qr-tile{position:relative;width:42px;height:42px;border-radius:8px;display:flex;align-items:center;justify-content:center;cursor:pointer;border:2px solid transparent;background:var(--background-secondary,rgba(255,255,255,.04))}
.hc-qr-tile:hover{background:var(--background-modifier-hover,rgba(255,255,255,.08))}
.hc-qr-tile--sel{border-color:var(--brand-500,#5865f2)}
.hc-qr-tile img{width:28px;height:28px;object-fit:contain}
.hc-qr-tile__uni{font-size:24px;line-height:1}
.hc-qr-tile__badge{position:absolute;top:-5px;right:-5px;min-width:15px;height:15px;padding:0 3px;border-radius:8px;background:var(--brand-500,#5865f2);color:#fff;font-size:10px;line-height:15px;text-align:center}
.hc-qr-count{opacity:.7;font-size:13px}
.hc-qr-back{display:inline-flex;align-items:center;gap:4px;cursor:pointer;background:none;border:none;color:var(--hc-label-secondary,#b5bac1);font-size:13px;padding:0}
.hc-qr-guildcount{margin-left:auto;opacity:.5;font-size:12px}
.hc-qr-chips{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:8px}
.hc-qr-chip{display:inline-flex;align-items:center;gap:5px;padding:3px 6px 3px 5px;border-radius:8px;background:var(--background-secondary,rgba(255,255,255,.05));font-size:12px}
.hc-qr-chip img{width:18px;height:18px;object-fit:contain}
.hc-qr-chip__x{cursor:pointer;opacity:.5;display:inline-flex;align-items:center}
.hc-qr-chip__x:hover{opacity:1}
.hc-qr-add{display:flex;gap:8px;align-items:center;margin-top:6px}
.hc-qr-add .hc-input{flex:1}
.hc-qr-msgbtn{display:inline-flex;align-items:center;justify-content:center;width:32px;height:32px;cursor:pointer;color:var(--interactive-normal,#b5bac1);border-radius:4px}
.hc-qr-msgbtn:hover{color:var(--interactive-hover,#dbdee1);background:var(--background-modifier-hover,rgba(255,255,255,.06))}
.hc-qr-msgbtn svg{width:20px;height:20px}
`;function yo(){if(B(),document.getElementById(ch))return;let e=document.createElement("style");e.id=ch,e.textContent=Dy,document.head.appendChild(e)}function lh({onAdd:e}){let t=hr(()=>rh(),[]),[n,r]=y({mode:"guilds"}),[i,a]=y(""),[s,c]=y(""),[l,d]=y({}),u=Object.keys(l).length,h=m=>d(b=>{let E={...b},z=Ne(m);return E[z]?delete E[z]:E[z]=m,E}),f=m=>d(b=>{let E={...b};for(let z of m)E[Ne(z)]=z;return E}),v=()=>{let m=Object.values(l);m.length&&(e(m),d({}))},x=m=>{c(""),r({mode:"emojis",guildId:m.guildId,guildName:m.guildName})},L=n.mode==="emojis"?t.find(m=>m.guildId===n.guildId):void 0;return o.createElement("div",{className:"hc-qr-inline"},o.createElement("div",{className:"hc-qr-inline-head"},n.mode==="emojis"?o.createElement("button",{className:"hc-qr-back",onClick:()=>r({mode:"guilds"})},o.createElement(vr,{size:16})," \u670D\u52A1\u5668"):o.createElement("span",{className:"hc-qr-count"},"\u9009\u670D\u52A1\u5668"),o.createElement("span",{className:"hc-qr-count",style:{marginLeft:"auto"}},"\u5DF2\u9009 ",u),o.createElement("button",{className:"hc-btn hc-btn--primary hc-btn--sm",onClick:v,disabled:u===0},"\u6DFB\u52A0 ",u," \u4E2A")),n.mode==="guilds"?o.createElement(Oy,{groups:t,query:i,setQuery:a,onOpen:x}):o.createElement(jy,{group:L,guildName:n.guildName,query:s,setQuery:c,selected:l,toggle:h,addMany:f}))}function Oy({groups:e,query:t,setQuery:n,onOpen:r}){let i=t.trim().toLowerCase(),a=i?e.filter(s=>s.guildName.toLowerCase().includes(i)):e;return o.createElement(o.Fragment,null,o.createElement("div",{className:"hc-emote-picker__search"},o.createElement("input",{className:"hc-input",placeholder:"\u641C\u7D22\u670D\u52A1\u5668\u2026",value:t,onChange:s=>n(s.currentTarget.value)})),o.createElement("div",{className:"hc-emote-picker__list"},a.length===0?o.createElement("div",{className:"hc-emote-picker__empty"},e.length===0?"\u6CA1\u8BFB\u5230\u670D\u52A1\u5668\u8868\u60C5\uFF08\u5148\u8FDB\u51E0\u4E2A\u6709\u81EA\u5B9A\u4E49\u8868\u60C5\u7684\u670D\u52A1\u5668\uFF09":"\u6CA1\u6709\u5339\u914D\u7684\u670D\u52A1\u5668"):a.map(s=>{let c=nh(s.guildId,s.guildIcon,48);return o.createElement("div",{key:s.guildId,className:"hc-emote-picker__item",role:"button",tabIndex:0,onClick:()=>r(s),onKeyDown:l=>{l.key==="Enter"&&r(s)}},o.createElement("div",{className:"hc-emote-picker__icon"},c?o.createElement("img",{src:c,alt:""}):s.guildName.charAt(0).toUpperCase()),o.createElement("div",{className:"hc-emote-picker__name"},s.guildName),o.createElement("span",{className:"hc-qr-guildcount"},s.emojis.length))})))}function jy({group:e,guildName:t,query:n,setQuery:r,selected:i,toggle:a,addMany:s}){let c=e?.emojis??[],l=n.trim().toLowerCase(),d=l?c.filter(u=>u.name.toLowerCase().includes(l)):c;return o.createElement(o.Fragment,null,o.createElement("div",{className:"hc-emote-picker__search"},o.createElement("input",{className:"hc-input",placeholder:`\u5728 ${t} \u91CC\u641C\u2026`,value:n,onChange:u=>r(u.currentTarget.value)})),o.createElement("div",{className:"hc-qr-add",style:{padding:"0 8px"}},o.createElement("span",{className:"hc-qr-count"},d.length," \u4E2A"),o.createElement("button",{className:"hc-btn hc-btn--secondary hc-btn--sm",onClick:()=>s(d),disabled:d.length===0,style:{marginLeft:"auto"}},"\u5168\u9009\u8FD9\u4E9B")),o.createElement("div",{className:"hc-emote-picker__list"},d.length===0?o.createElement("div",{className:"hc-emote-picker__empty"},"\u6CA1\u6709\u5339\u914D\u7684\u8868\u60C5"):o.createElement("div",{className:"hc-qr-grid"},d.map(u=>{let h=Ne(u),f=go(u,40),v=!!i[h];return o.createElement("div",{key:h,className:`hc-qr-tile${v?" hc-qr-tile--sel":""}`,role:"button",tabIndex:0,title:`:${u.name}:`,onClick:()=>a(u),onKeyDown:x=>{x.key==="Enter"&&a(u)}},f?o.createElement("img",{src:f,alt:u.name}):o.createElement("span",{className:"hc-qr-tile__uni"},u.name),v&&o.createElement("span",{className:"hc-qr-tile__badge"},"\u2713"))}))))}var uh=g("quick-react"),Za="hc-qr-msgbtn",zy=120,By=1500,Uy=['[class*="buttonContainer"]','[class*="buttons_"]'],Gy='<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M8.5 14.3c.9 1.1 2.1 1.7 3.5 1.7s2.6-.6 3.5-1.7"/><path d="M9 9.5h.01M15 9.5h.01"/></svg>',vo,bo,Rt,es,_o;function Hy(e){for(let t of ye(e,20)){let n=t?.message,r=n?.channel_id??n?.channelId;if(n?.id&&r)return{channelId:String(r),messageId:String(n.id)}}return null}function Fy(e,t){let n=document.createElement("div");n.className=Za,n.setAttribute("role","button"),n.setAttribute("tabindex","0"),n.setAttribute("aria-label","\u4E00\u952E\u53CD\u5E94"),n.title="\u4E00\u952E\u53CD\u5E94",n.innerHTML=Gy;let r=i=>{i.preventDefault(),i.stopPropagation(),es?.(e,t)};return n.addEventListener("click",r),n.addEventListener("keydown",i=>{(i.key==="Enter"||i.key===" ")&&r(i)}),n}function qy(){for(let e of Uy)try{let t=document.querySelectorAll(e);if(t.length>0)return Array.from(t)}catch{}return[]}function hh(){for(let e of Array.from(document.querySelectorAll(`.${Za}`)))e.remove()}function ts(){if(_o&&!_o()){hh();return}for(let e of qy())try{if(e.querySelector(`.${Za}`))continue;let t=Hy(e);if(!t)continue;e.insertBefore(Fy(t.channelId,t.messageId),e.firstChild)}catch(t){uh.debug("\u6CE8\u5165 hover \u6309\u94AE\u5931\u8D25",t)}}function dh(){Rt||(Rt=setTimeout(()=>{Rt=void 0,ts()},zy))}function ph(e,t){if(yo(),es=e,_o=t,typeof document<"u"&&document.body)try{vo=new MutationObserver(dh),vo.observe(document.body,{childList:!0,subtree:!0})}catch(n){uh.warn("MutationObserver \u6302\u63A5\u5931\u8D25\uFF0C\u6539\u7528\u8F6E\u8BE2\u515C\u5E95",n)}bo=setInterval(dh,By),ts()}function fh(){vo?.disconnect(),vo=void 0,bo&&(clearInterval(bo),bo=void 0),Rt&&(clearTimeout(Rt),Rt=void 0),hh(),es=void 0,_o=void 0}function ns(){ts()}function mh(e,t){let n=new Set(e.map(Ne)),r=e.slice();for(let i of t){let a=Ne(i);n.has(a)||(n.add(a),r.push(i))}return r}function gh({value:e,onChange:t}){yo();let n=Array.isArray(e)?e:[],[r,i]=y(""),[a,s]=y(!1),c=d=>t(n.filter((u,h)=>h!==d)),l=()=>{let d=oh(r);d&&t(mh(n,[d])),i("")};return o.createElement("div",null,n.length>0?o.createElement("div",{className:"hc-qr-chips"},n.map((d,u)=>{let h=go(d,24);return o.createElement("span",{className:"hc-qr-chip",key:`${Ne(d)}-${u}`},h?o.createElement("img",{src:h,alt:d.name}):o.createElement("span",null,d.name),o.createElement("span",null,d.name),o.createElement("span",{className:"hc-qr-chip__x",role:"button",tabIndex:0,"aria-label":"\u79FB\u9664",onClick:()=>c(u),onKeyDown:f=>{f.key==="Enter"&&c(u)}},o.createElement(yr,{size:14})))})):o.createElement("div",{className:"hc-qr-note"},"\u8FD8\u6CA1\u914D\u7F6E\u53CD\u5E94\u3002\u70B9\u4E0B\u9762\u4ECE\u670D\u52A1\u5668\u6311\uFF0C\u6216\u624B\u52A8\u586B\u4E00\u4E2A\u3002"),o.createElement("div",{className:"hc-qr-add"},o.createElement(J,{value:r,onChange:i,placeholder:"\u{1F600} \u6216 <:name:id>",onKeyDown:d=>{d.key==="Enter"&&(d.preventDefault(),l())}}),o.createElement(k,{size:"sm",variant:"secondary",onClick:l,disabled:!r.trim()},"\u6DFB\u52A0")),o.createElement("div",{className:"hc-qr-add"},o.createElement(k,{size:"sm",variant:a?"secondary":"primary",onClick:()=>s(d=>!d)},o.createElement(Gc,{size:16})," ",a?"\u6536\u8D77":"\u4ECE\u670D\u52A1\u5668\u6311\u9009"),n.length>0&&o.createElement(k,{size:"sm",variant:"destructive",onClick:()=>t([])},o.createElement(ce,{size:16})," \u6E05\u7A7A")),a&&o.createElement(lh,{onAdd:d=>t(mh(n,d))}))}var os=g("quick-react"),ct=D({reactions:{group:"\u53CD\u5E94",type:"custom",default:[],label:"\u914D\u7F6E\u53CD\u5E94\u8868\u60C5",description:"\u70B9\u300C\u4ECE\u670D\u52A1\u5668\u6311\u9009\u300D\u628A\u8981\u70B9\u7684\u8868\u60C5\u9009\u597D\u3002\u540C\u540D\u4E0D\u540C id \u5404\u7B97\u4E00\u4E2A\uFF0C\u53EF\u4EE5\u53E0\u5F88\u591A\u4E2A\uFF08Discord \u5355\u6761\u6D88\u606F\u6700\u591A 20 \u4E2A\u4E0D\u540C\u8868\u60C5\uFF09\u3002",component:gh},delayMs:{group:"\u9AD8\u7EA7",type:"number",default:300,min:0,max:3e3,step:50,label:"\u6BCF\u4E2A\u53CD\u5E94\u95F4\u9694\uFF08\u6BEB\u79D2\uFF09",description:"\u4E00\u4E2A\u4E2A\u70B9\uFF0C\u95F4\u9694\u592A\u77ED\u4F1A\u88AB Discord \u9650\u6D41\u5BFC\u81F4\u90E8\u5206\u70B9\u4E0D\u4E0A\u3002\u9ED8\u8BA4 300\u3002"}});function Ky(e){if(!e)return null;for(let t of ye(e,16)){let n=t?.message,r=n?.channel_id??n?.channelId;if(n?.id&&r)return{channelId:String(r),messageId:String(n.id)}}return null}var rs=!1;async function yh(e,t){if(rs)return;let n=ct.store.reactions??[];if(n.length===0){te("\u5148\u5728\u8BBE\u7F6E\u91CC\u914D\u7F6E\u53CD\u5E94\u8868\u60C5","info");return}rs=!0;try{let r=await sh(e,t,n,ct.store.delayMs),i=r.action==="add"?"\u6DFB\u52A0":"\u53D6\u6D88";r.total===0?te("\u6CA1\u6709\u9700\u8981\u53D8\u52A8\u7684\u53CD\u5E94","info"):r.failed>0?te(`\u5DF2${i} ${r.done-r.failed}/${r.total}\uFF0C${r.failed} \u4E2A\u5931\u8D25`,"failure"):te(`\u5DF2${i} ${r.done} \u4E2A\u53CD\u5E94`,"success"),ns()}catch(r){os.error("\u4E00\u952E\u53CD\u5E94\u5931\u8D25",r),te("\u4E00\u952E\u53CD\u5E94\u5931\u8D25\uFF0C\u770B\u63A7\u5236\u53F0\u65E5\u5FD7","failure")}finally{rs=!1}}function Vy(e){let t=Ky(Cr());if(!t)return;let n=jt();if(!n)return;let r=(ct.store.reactions??[]).length;e.push(o.createElement(n,{id:"halcyon-quick-react",label:r>0?`\u4E00\u952E\u53CD\u5E94\uFF08${r} \u4E2A\uFF09`:"\u4E00\u952E\u53CD\u5E94\uFF1A\u5148\u5728\u8BBE\u7F6E\u91CC\u914D\u7F6E",disabled:r===0,action:()=>void yh(t.channelId,t.messageId)}))}var xo=[],bh=N({id:"quick-react",name:"\u4E00\u952E\u53CD\u5E94",description:"\u53F3\u952E\u6D88\u606F\u4E00\u952E\u70B9\u4E0A\u4E00\u6574\u6392\u9884\u8BBE\u53CD\u5E94\u3002\u8868\u60C5\u4ECE\u4F60\u52A0\u5165\u7684\u670D\u52A1\u5668\u91CC\u6311\uFF0C\u5148\u5728\u8BBE\u7F6E\u91CC\u914D\u597D\u3002\u540C\u540D\u4E0D\u540C id \u4F1A\u5404\u7B97\u4E00\u4E2A\uFF0C\u80FD\u50CF\u622A\u56FE\u90A3\u6837\u53E0\u6210\u4E00\u6392\u3002\u53CD\u5E94\u5BF9\u6240\u6709\u4EBA\u53EF\u89C1\u3002",authors:[{name:"caitemm"}],category:"utility",settings:ct,start(){xo.push(zt("message",Vy)),ph((e,t)=>void yh(e,t),()=>(ct.store.reactions??[]).length>0),xo.push(ct.subscribe("reactions",()=>ns())),Qa()||os.warn("\u6CA1\u89E3\u6790\u5230\u6DFB\u52A0\u53CD\u5E94\u7684\u63A5\u53E3\uFF0C\u70B9\u51FB\u65F6\u4F1A\u8D70\u515C\u5E95\u6216\u62A5\u9519\u3002\u91CD\u542F\u5BA2\u6237\u7AEF\u540E\u518D\u8BD5\u3002"),os.info("\u4E00\u952E\u53CD\u5E94\u5C31\u7EEA \u2014 \u53F3\u952E\u6D88\u606F\u6216\u70B9\u60AC\u505C\u5DE5\u5177\u680F\u7684\u5C0F\u7B11\u8138")},stop(){fh();for(let e of xo)try{e()}catch{}xo=[]},probe(){return{configuredCount:(ct.store.reactions??[]).length,delayMs:ct.store.delayMs,backendReady:Qa()}}});var jn=g("flux"),zn=new Map,wo=new Map;function is(){let e=he();return e||jn.error("dispatcher unavailable; flux subscriptions are inert"),e}function Wy(e){if(wo.has(e))return;let t=r=>{let i=zn.get(e);if(i)for(let a of i)try{a(r)}catch(s){jn.error(`listener for ${e} threw`,s)}},n=is();try{n?.subscribe(e,t),wo.set(e,t)}catch(r){jn.error(`could not subscribe to ${e}`,r)}}function Yy(e){let t=zn.get(e);if(t&&t.size)return;let n=wo.get(e);if(n){try{is()?.unsubscribe(e,n)}catch(r){jn.error(`could not unsubscribe from ${e}`,r)}wo.delete(e),zn.delete(e)}}var xe={subscribe(e,t){let n=zn.get(e);n||(n=new Set,zn.set(e,n)),n.add(t),Wy(e);let r=!0;return()=>{r&&(r=!1,n.delete(t),Yy(e))}},dispatch(e){try{is()?.dispatch(e)}catch(t){jn.error("dispatch failed",e?.type,t)}}};var je=g("mark-all-read"),vh=!1;function Jy(e){return e?.channel?.id??e?.id}function Ry(){let e=[],t=new Set,n=V.getGuilds?.()??{};for(let r of Object.keys(n)){let i;try{i=yt.getChannels?.(r)}catch(c){je.warn(`could not read channels for guild ${r}`,c);continue}if(!i)continue;let a=c=>{if(!c)return!1;try{if(!Ut.hasUnread?.(c))return!1}catch{return!1}return e.push({channelId:c,messageId:Ut.lastMessageId?.(c)??null,readStateType:0}),!0};if(!vh){vh=!0;try{let c=Object.keys(i).map(l=>{let d=i[l];return Array.isArray(d)?`${l}:array(${d.length})`:`${l}:${typeof d}`}).join(", ");je.info(`getChannels shape for guild ${r} \u2014 { ${c} }`);for(let l of Object.keys(i)){let d=i[l];if(Array.isArray(d)&&d.length>0){je.info(`  first "${l}" entry keys=[${Object.keys(d[0]).join(",")}]`);break}}}catch(c){je.warn("could not describe getChannels shape",c)}}let s=[i.SELECTABLE,i.VOCAL].filter(Array.isArray);for(let c of s)for(let l of c)a(Jy(l))&&t.add(r);try{let c=zi.getActiveJoinedThreadsForGuild?.(r);if(c&&typeof c=="object"){for(let l of Object.values(c))if(!(!l||typeof l!="object"))for(let d of Object.values(l))a(d?.channel?.id??d?.id)&&t.add(r)}}catch(c){je.warn(`could not read joined threads for guild ${r}`,c)}}return{channels:e,guilds:t.size}}function Xy(){let e=(t,n)=>`${t}=${typeof n=="function"?"ok":"MISSING"}`;je.info("store check \u2014 "+[e("GuildStore.getGuilds",V.getGuilds),e("GuildChannelStore.getChannels",yt.getChannels),e("ReadStateStore.hasUnread",Ut.hasUnread),e("ReadStateStore.lastMessageId",Ut.lastMessageId),e("ActiveJoinedThreadsStore.getActiveJoinedThreadsForGuild",zi.getActiveJoinedThreadsForGuild)].join(", "))}function So(){Xy();let e=Object.keys(V.getGuilds?.()??{}).length,{channels:t,guilds:n}=Ry();return je.info(`scanned ${e} guild(s); found ${t.length} unread channel(s)`),t.length===0?(je.info("nothing unread; skipping BULK_ACK"),{channels:0,guilds:0}):(xe.dispatch({type:"BULK_ACK",context:"APP",channels:t}),je.info(`BULK_ACK dispatched for ${t.length} channel(s) across ${n} guild(s)`),{channels:t.length,guilds:n})}var Qy=g("mark-all-read");function _h(){let[e,t]=y(!1),[n,r]=y("\u5F85\u673A"),[i,a]=y("\u70B9\u51FB\u4E0B\u65B9\u6309\u94AE\uFF0C\u628A\u6240\u6709\u670D\u52A1\u5668\u91CC\u7684\u672A\u8BFB\u4E00\u6B21\u6027\u6E05\u7A7A\u3002");return o.createElement("div",{className:"hc-stack"},o.createElement("div",{className:"hc-inline-note"},o.createElement(Ot,{size:18}),o.createElement("span",null,"\u4E00\u6B21\u6027\u628A",o.createElement("strong",null,"\u6240\u6709\u670D\u52A1\u5668"),"\u7684\u672A\u8BFB\u6D88\u606F\u6807\u4E3A\u5DF2\u8BFB\u3002\u6807\u8BB0\u5DF2\u8BFB\u4E0D\u4F1A\u5220\u9664\u4EFB\u4F55\u6D88\u606F\uFF0C\u4F46\u65E0\u6CD5\u64A4\u9500\u3002")),o.createElement(R,{title:"\u64CD\u4F5C"},o.createElement("div",{className:"hc-cell"},o.createElement(k,{variant:"primary",icon:o.createElement(hn,{size:16}),disabled:e,onClick:()=>{if(!e){t(!0),r("\u5904\u7406\u4E2D"),a("\u6B63\u5728\u6536\u96C6\u672A\u8BFB\u9891\u9053\u2026");try{let c=So();c.channels===0?(r("\u5DF2\u662F\u6700\u65B0"),a("\u6CA1\u6709\u627E\u5230\u4EFB\u4F55\u672A\u8BFB\uFF0C\u65E0\u9700\u64CD\u4F5C\u3002"),te("\u6CA1\u6709\u672A\u8BFB\u6D88\u606F","info")):(r("\u5B8C\u6210"),a(`\u5DF2\u6E05\u7A7A ${c.guilds} \u4E2A\u670D\u52A1\u5668\u4E2D\u7684 ${c.channels} \u4E2A\u9891\u9053\u3002`),te(`\u5DF2\u6807\u8BB0 ${c.channels} \u4E2A\u9891\u9053\u4E3A\u5DF2\u8BFB`,"success"))}catch(c){r("\u5931\u8D25"),a(c?.message??String(c)),te("\u6807\u8BB0\u5931\u8D25","failure"),Qy.error("mark all read failed",c)}finally{t(!1)}}}},"\u5168\u90E8\u6807\u4E3A\u5DF2\u8BFB"))),o.createElement("div",{className:"hc-cleaner__status"},o.createElement("div",{className:"hc-cleaner__status-state"},n),i&&o.createElement("div",{className:"hc-cleaner__status-detail"},i)))}var as=g("mark-all-read");function Sh(){try{let e=So();e.channels===0?te("\u6CA1\u6709\u672A\u8BFB\u6D88\u606F","info"):te(`\u5DF2\u6807\u8BB0 ${e.channels} \u4E2A\u9891\u9053\u4E3A\u5DF2\u8BFB`,"success")}catch(e){te("\u6807\u8BB0\u5931\u8D25","failure"),as.error("mark all read failed",e)}}function Zy(){return o.createElement("div",{className:"hc-rail-item"},o.createElement("button",{type:"button",className:"hc-rail-btn","aria-label":"\u5168\u90E8\u670D\u52A1\u5668\u6807\u4E3A\u5DF2\u8BFB",title:"\u5168\u90E8\u670D\u52A1\u5668\u6807\u4E3A\u5DF2\u8BFB",onClick:Sh},o.createElement(hn,{size:24})))}function eb(e){let t=e?.config?.expiresAt;if(!t)return!1;try{return new Date(t).getTime()<Date.now()}catch{return!1}}function tb(){let[e,t]=y(0);return C(()=>{let n=()=>{try{let i=kl,a=i?.quests;!(a instanceof Map)&&!Array.isArray(a)&&(a=i?.getQuests?.()??i?.getAllQuests?.());let s=a instanceof Map?[...a.values()]:Array.isArray(a)?a:[];t(s.filter(c=>c&&!c.userStatus?.completedAt&&!eb(c)).length)}catch{}};n();let r=setInterval(n,3e4);return()=>clearInterval(r)},[]),e}function nb(){xn("/quest-home")||as.warn("\u65E0\u6CD5\u6253\u5F00\u4EFB\u52A1\u4E2D\u5FC3\uFF1A\u672A\u89E3\u6790\u5230\u5BFC\u822A\u8DEF\u7531\uFF0C\u5DF2\u653E\u5F03\u8DF3\u8F6C\u4EE5\u907F\u514D\u6574\u9875\u5237\u65B0\u3002")}function rb(){let e=tb(),t=e>0?`${e} \u4E2A\u53EF\u7528\u4EFB\u52A1`:"\u4EFB\u52A1\u4E2D\u5FC3";return o.createElement("div",{className:"hc-rail-item"},o.createElement("button",{type:"button",className:"hc-rail-btn hc-quest-btn","aria-label":t,title:t,onClick:nb},o.createElement(Dc,{size:24}),e>0&&o.createElement("span",{className:"hc-quest-badge"},e)))}var xh=["guild-context","guild-header-popout"],wh=e=>{let t=jt();!t||e.some(r=>r?.props?.id==="hc-mark-all-read")||e.push(o.createElement(t,{id:"hc-mark-all-read",label:"\u5168\u90E8\u670D\u52A1\u5668\u6807\u4E3A\u5DF2\u8BFB",action:Sh}))},kh=N({id:"mark-all-read",name:"\u4E00\u952E\u5DF2\u8BFB",description:"\u5728\u670D\u52A1\u5668\u5217\u8868\u7684\u597D\u53CB\u6309\u94AE\u4E0B\u65B9\u52A0\u4E00\u4E2A\u6309\u94AE\uFF0C\u4E00\u952E\u628A\u6240\u6709\u670D\u52A1\u5668\u7684\u672A\u8BFB\u6D88\u606F\u6807\u4E3A\u5DF2\u8BFB\u3002\u4E5F\u53EF\u53F3\u952E\u4EFB\u610F\u670D\u52A1\u5668\uFF0C\u6216\u5728\u672C\u9875\u70B9\u51FB\u3002\u6807\u8BB0\u5DF2\u8BFB\u4E0D\u4F1A\u5220\u9664\u6D88\u606F\uFF0C\u4F46\u65E0\u6CD5\u64A4\u9500\u3002",authors:[{name:"caitemm"},{name:"Vencord"}],category:"utility",dependencies:["context-menu-api"],patches:[{label:"read-all-rail-button",find:'tutorialId:"friends-list"',replacement:{match:/return(\(.{0,200}?tutorialId:"friends-list".+?\}\))(?=\}function)/,replace:"return[$1].concat($self.renderRailButton())"}}],renderRailButton(){return[o.createElement(Zy,{key:"hc-mark-all-read-rail"}),o.createElement(rb,{key:"hc-quest-indicator-rail"})]},page:{title:"\u4E00\u952E\u5DF2\u8BFB",icon:hn,component:_h},start(){B(),zt(xh,wh),as.info("mark-all-read ready")},stop(){_l(xh,wh)}});var lt=g("silent-typing"),Un=D({scope:{group:"\u8303\u56F4",type:"select",default:"all",label:"\u5728\u54EA\u91CC\u9759\u9ED8",description:"\u53EA\u5728\u90E8\u5206\u573A\u666F\u9690\u85CF\u8F93\u5165\u72B6\u6001\u65F6\uFF0C\u5176\u4F59\u573A\u666F\u4ECD\u6309 Discord \u9ED8\u8BA4\u884C\u4E3A\u53D1\u9001\u3002",options:[{value:"all",label:"\u6240\u6709\u9891\u9053\u4E0E\u79C1\u804A"},{value:"guilds",label:"\u53EA\u5728\u670D\u52A1\u5668\u9891\u9053"},{value:"dms",label:"\u53EA\u5728\u79C1\u804A / \u7FA4\u804A"}]},allowChannels:{group:"\u4F8B\u5916",type:"string-list",default:[],label:"\u4F8B\u5916\u9891\u9053 ID",description:"\u8FD9\u4E9B\u9891\u9053 / \u79C1\u804A\u91CC\u7167\u5E38\u53D1\u9001\u8F93\u5165\u72B6\u6001\u3002\u53F3\u952E\u9891\u9053 \u2192 \u590D\u5236\u9891\u9053 ID\uFF08\u9700\u5148\u5F00\u542F\u5F00\u53D1\u8005\u6A21\u5F0F\uFF09\u3002",itemPlaceholder:"\u9891\u9053 ID\uFF08\u7EAF\u6570\u5B57\uFF09"},silenceStop:{group:"\u9AD8\u7EA7",type:"boolean",default:!1,label:"\u540C\u65F6\u62E6\u622A\u201C\u505C\u6B62\u8F93\u5165\u201D",description:"\u9ED8\u8BA4\u5173\u95ED\u3002stopTyping \u662F\u7528\u6765\u6E05\u9664\u5DF2\u7ECF\u53D1\u51FA\u53BB\u7684\u8F93\u5165\u72B6\u6001\u7684\uFF0C\u62E6\u622A\u5B83\u53CD\u800C\u53EF\u80FD\u8BA9\u6B8B\u7559\u72B6\u6001\u591A\u6302\u51E0\u79D2\uFF0C\u53EA\u6709\u5728\u4F60\u786E\u8BA4\u4ECE\u4E0D\u53D1\u9001\u65F6\u624D\u9700\u8981\u5F00\u542F\u3002"}}),Nt=!1,Ce,ko,ss,Bn=0;function Eh(e){try{let t=ve.getChannel?.(e);return t?typeof t.isPrivate=="function"?!!t.isPrivate():t.guild_id?!1:t.type===1||t.type===3:!1}catch{return!1}}function Eo(e){if(!Nt)return!1;let t=e==null?"":String(e),n=Un.store;return t&&n.allowChannels.includes(t)?!1:n.scope==="guilds"?!Eh(t):n.scope==="dms"?Eh(t):!0}function ob(e){try{if(Eo(e.args[0])){Bn++;return}}catch(t){lt.error("\u5224\u65AD\u662F\u5426\u9759\u9ED8\u65F6\u51FA\u9519\uFF0C\u672C\u6B21\u6309 Discord \u9ED8\u8BA4\u884C\u4E3A\u5904\u7406",t)}return e.callOriginal()}function ib(e){try{if(Un.store.silenceStop&&Eo(e.args[0]))return}catch{}return e.callOriginal()}function ab(){try{let e=le.getChannelId?.();e&&typeof Ce?.stopTyping=="function"&&Ce.stopTyping(e)}catch{}}function sb(){let e=Y().filter(t=>t.pluginId==="silent-typing");e.length!==0&&(e.every(t=>t.applied)?lt.info("\u6E90\u7801 patch \u5DF2\u751F\u6548\uFF08\u8F93\u5165\u72B6\u6001\u5728\u6E90\u5934\u5C31\u88AB\u62E6\u6389\uFF09"):lt.warn("\u6E90\u7801 patch \u672A\u5339\u914D\u5F53\u524D Discord \u7248\u672C\uFF0C\u5DF2\u6539\u7528\u8FD0\u884C\u65F6 hook \u515C\u5E95\u3002\u82E5\u53D1\u73B0\u522B\u4EBA\u4ECD\u80FD\u770B\u5230\u4F60\u7684\u8F93\u5165\u72B6\u6001\uFF0C\u8BF7\u53CD\u9988\u8FD9\u6761\u65E5\u5FD7\u3002"))}var Ih=N({id:"silent-typing",name:"\u9759\u9ED8\u8F93\u5165",description:"\u4E0D\u518D\u5411\u522B\u4EBA\u53D1\u9001\u201C\u6B63\u5728\u8F93\u5165\u2026\u201D\u72B6\u6001\u3002\u53EF\u4EE5\u53EA\u5728\u670D\u52A1\u5668\u6216\u53EA\u5728\u79C1\u804A\u751F\u6548\uFF0C\u4E5F\u80FD\u4E3A\u6307\u5B9A\u9891\u9053\u5F00\u4F8B\u5916\u3002\u522B\u4EBA\u7684\u8F93\u5165\u72B6\u6001\u7167\u5E38\u663E\u793A\uFF0C\u5173\u95ED\u63D2\u4EF6\u7ACB\u5373\u6062\u590D\u3002",authors:[{name:"Vencord"},{name:"caitemm"}],category:"privacy",settings:Un,patches:[{label:"startTyping guard",find:'"TYPING_START_LOCAL"',replacement:{match:/(?<=\bstartTyping\s*(?:[:=]\s*)?(?:async\s+)?(?:function\s*)?\(\s*(\w+)\s*\)\s*(?:=>\s*)?\{)/,replace:"if($self.shouldSilence($1))return;"}}],start(){if(Bn=0,Nt=!0,Ce=Me("startTyping","stopTyping"),!Ce||typeof Ce.startTyping!="function")lt.warn("\u672A\u627E\u5230 Discord \u7684\u8F93\u5165\u72B6\u6001\u6A21\u5757\uFF08startTyping / stopTyping\uFF09\uFF0C\u8FD0\u884C\u65F6\u515C\u5E95\u4E0D\u53EF\u7528\uFF1B\u4ECD\u4F9D\u8D56\u6E90\u7801 patch\u3002\u6253\u5F00\u4EFB\u610F\u9891\u9053\u540E\u91CD\u65B0\u542F\u7528\u63D2\u4EF6\u53EF\u518D\u8BD5\u4E00\u6B21\u3002");else{Nt=!1,ab(),Nt=!0;try{ko=ue.instead(Ce,"startTyping",ob)}catch(e){lt.warn("\u6302\u63A5 startTyping \u5931\u8D25\uFF0C\u4EC5\u4F9D\u8D56\u6E90\u7801 patch",e)}if(typeof Ce.stopTyping=="function")try{ss=ue.instead(Ce,"stopTyping",ib)}catch(e){lt.warn("\u6302\u63A5 stopTyping \u5931\u8D25\uFF0C\u201C\u540C\u65F6\u62E6\u622A\u505C\u6B62\u8F93\u5165\u201D\u5F00\u5173\u5C06\u65E0\u6548",e)}}lt.info(`\u5DF2\u62E6\u622A\u8F93\u5165\u72B6\u6001\u4E0A\u62A5\uFF08\u8303\u56F4\uFF1A${Un.store.scope}\uFF09`),setTimeout(sb,4e3)},stop(){Nt=!1,ko?.(),ss?.(),ko=void 0,ss=void 0,Ce=void 0,lt.info(`\u5DF2\u6062\u590D\u8F93\u5165\u72B6\u6001\u4E0A\u62A5\uFF08\u672C\u6B21\u5171\u62E6\u622A ${Bn} \u6B21\uFF09`)},shouldSilence(e){try{return Nt&&Eo(e)?(Bn++,!0):!1}catch{return!1}},probe(){let e=Ce??Me("startTyping","stopTyping");return{active:Nt,suppressed:Bn,scope:Un.store.scope,typingModuleFound:e!=null,startTypingIsFunction:typeof e?.startTyping=="function",runtimeHookInstalled:ko!=null,sourcePatches:Y().filter(t=>t.pluginId==="silent-typing"),currentChannelWouldBeSilenced:(()=>{try{return Eo(le.getChannelId?.())}catch{return null}})()}}});function cb(e){let t="n/a";try{let n=e.getBoundingClientRect();t=`${Math.round(n.width)}x${Math.round(n.height)}@${Math.round(n.left)},${Math.round(n.top)}`}catch{}return{tag:e.tagName.toLowerCase(),classes:typeof e.className=="string"?e.className:String(e.className??""),childCount:e.children.length,box:t}}function lb(e,t=3){try{let n=document.querySelectorAll(e),r=[];for(let i=0;i<n.length&&i<t;i++)r.push(cb(n[i]));return{selector:e,count:n.length,samples:r}}catch{return{selector:e,count:-1,samples:[]}}}function dt(e,t=2){return e.map(n=>lb(n,t))}function ze(e,t=24){let n=new Set;try{let r=document.querySelectorAll(`[class*="${e}"]`);for(let i=0;i<r.length&&n.size<t;i++){let a=r[i].className;if(typeof a=="string"){for(let s of a.split(/\s+/))if(s.includes(e)&&n.add(s),n.size>=t)break}}}catch{}return[...n]}var Te=D({placement:{group:"\u4F4D\u7F6E",type:"select",default:"header",label:"\u663E\u793A\u4F4D\u7F6E",description:"\u9891\u9053\u9876\u680F\u662F\u6A2A\u5411\u5DE5\u5177\u6761\uFF0C\u63D2\u4E00\u4E2A\u5C0F\u6807\u7B7E\u6700\u7A33\uFF0C\u4E5F\u662F Discord \u6CA1\u63D0\u4F9B\u6570\u5B57\u7684\u4F4D\u7F6E\uFF1B\u6210\u5458\u5217\u8868\u9876\u90E8 Discord \u81EA\u5DF1\u5DF2\u7ECF\u663E\u793A\u4E86\u300C\u5728\u7EBF X \xB7 \u5171 Y\u300D\uFF0C\u672C\u63D2\u4EF6\u5728\u90A3\u91CC\u663E\u793A\u53EA\u662F\u8986\u76D6\u540C\u4E00\u4EFD\u4FE1\u606F\uFF0C\u9009\u5B83\u524D\u8BF7\u77E5\u6089\u3002",options:[{value:"header",label:"\u9891\u9053\u9876\u680F"},{value:"member-list",label:"\u6210\u5458\u5217\u8868\u9876\u90E8"},{value:"both",label:"\u4E24\u5904\u90FD\u663E\u793A"}]},showOnline:{group:"\u5185\u5BB9",type:"boolean",default:!0,label:"\u663E\u793A\u5728\u7EBF\u4EBA\u6570",description:"\u5728\u7EBF\u4EBA\u6570\u6765\u81EA\u6210\u5458\u5217\u8868\u7684\u5206\u7EC4\u7EDF\u8BA1\uFF0C\u53EA\u6709\u6210\u5458\u5217\u8868\u6253\u5F00\u8FC7\u624D\u6709\u6570\u636E\uFF1B\u62FF\u4E0D\u5230\u65F6\u81EA\u52A8\u9690\u85CF\u3002"},showTotal:{group:"\u5185\u5BB9",type:"boolean",default:!0,label:"\u663E\u793A\u603B\u6210\u5458\u6570",description:"\u670D\u52A1\u5668\u7684\u603B\u6210\u5458\u6570\uFF08\u542B\u79BB\u7EBF\uFF09\u3002"},abbreviate:{group:"\u5185\u5BB9",type:"boolean",default:!1,label:"\u7F29\u5199\u5927\u6570\u5B57",description:"12,345 \u663E\u793A\u4E3A 12.3k\u3002\u5173\u95ED\u5219\u663E\u793A\u5E26\u5343\u4F4D\u5206\u9694\u7684\u5B8C\u6574\u6570\u5B57\u3002"},showLabels:{group:"\u5185\u5BB9",type:"boolean",default:!0,label:"\u663E\u793A\u6587\u5B57\u6807\u7B7E",description:"\u663E\u793A\u201C\u5728\u7EBF / \u5171\u201D\u8FD9\u6837\u7684\u524D\u7F00\u3002\u5173\u95ED\u540E\u53EA\u5269\u6570\u5B57\u4E0E\u5706\u70B9\uFF0C\u66F4\u7D27\u51D1\u3002"},preloadCounts:{group:"\u9AD8\u7EA7",type:"boolean",default:!0,label:"\u7F3A\u6570\u636E\u65F6\u8BF7\u6C42\u52A0\u8F7D",description:"\u5728\u7EBF\u4EBA\u6570\u4F9D\u8D56\u670D\u52A1\u5668\u7684\u6210\u5458\u5217\u8868\u6570\u636E\uFF1B\u5982\u679C\u8FD9\u6B21\u542F\u52A8\u540E\u4ECE\u6CA1\u5C55\u5F00\u8FC7\u6210\u5458\u5217\u8868\uFF0CDiscord \u6839\u672C\u6CA1\u62C9\u8FC7\u8FD9\u4EFD\u6570\u636E\u3002\u5F00\u542F\u540E\uFF0C\u9047\u5230\u7F3A\u6570\u5B57\u7684\u670D\u52A1\u5668\u4F1A\u8C03\u7528 Discord \u81EA\u5DF1\u7684\u9891\u9053\u9884\u52A0\u8F7D\uFF08\u548C\u4F60\u70B9\u8FDB\u670D\u52A1\u5668\u65F6\u4E00\u6837\u7684\u52A8\u4F5C\uFF09\uFF0C\u6BCF\u4E2A\u670D\u52A1\u5668\u6BCF\u6B21\u542F\u52A8\u53EA\u505A\u4E00\u6B21\u3002\u5173\u95ED\u5219\u53EA\u663E\u793A\u5DF2\u6709\u7684\u6570\u5B57\u3002"}});var Nh=g("member-count");function ls(e){let t;return()=>t??=e()}var Io=ls(()=>qe("GuildMemberCountStore")??dc("getMemberCount")),cs=ls(()=>qe("ChannelMemberStore")),Ch=ls(()=>P(e=>typeof e?.preload=="function"&&typeof e?.preloadAllGuilds=="function")??P(e=>typeof e?.preload=="function"&&typeof e?.__halcyon_probe__>"u")),To={total:null,online:null};function Gn(e){return typeof e=="number"&&Number.isFinite(e)&&e>=0?e:null}function Ao(e){if(!e)return null;try{let t=ve.getChannel?.(e),n=t?.guild_id??t?.getGuildId?.();return n?String(n):null}catch{return null}}var Hn=new Map,Xt=new Map,No=[];function Th(e){if(!Array.isArray(e)||e.length===0||e.length===1&&e[0]?.id==="unknown")return null;let t=0,n=!1;for(let r of e){if(r?.id==="offline")continue;let i=Gn(r?.count);i!=null&&(t+=i,n=!0)}return n?t:null}function Ah(){ds();let e=(t,n,r)=>{let i=Gn(r);n!=null&&i!=null&&t.set(String(n),i)};No=[xe.subscribe("GUILD_MEMBER_LIST_UPDATE",t=>{let n=t,r=Th(n?.groups);n?.guildId!=null&&r!=null&&Hn.set(String(n.guildId),r),e(Xt,n?.guildId,n?.memberCount??n?.member_count)}),xe.subscribe("ONLINE_GUILD_MEMBER_COUNT_UPDATE",t=>{e(Hn,t?.guildId,t?.count)}),xe.subscribe("GUILD_CREATE",t=>{let n=t?.guild;e(Xt,n?.id,n?.member_count??n?.memberCount)}),xe.subscribe("GUILD_UPDATE",t=>{let n=t?.guild;e(Xt,n?.id,n?.member_count??n?.memberCount)})]}function ds(){for(let e of No)try{e()}catch{}No=[],Hn.clear(),Xt.clear(),Co.clear()}var Co=new Set;function db(e,t){if(Te.store.preloadCounts&&!Co.has(e)){Co.add(e);try{let n=Ch();if(typeof n?.preload!="function")return;let r=yt.getDefaultChannel?.(e)?.id??t;n.preload(e,r),Nh.debug(`\u5DF2\u8BF7\u6C42\u52A0\u8F7D ${e} \u7684\u6210\u5458\u5217\u8868\u6570\u636E`)}catch(n){Nh.debug("preload \u8C03\u7528\u5931\u8D25\uFF0C\u5FFD\u7565",n)}}}function ub(e){try{let t=Gn(Io()?.getMemberCount?.(e));if(t!=null)return t}catch{}try{let t=V.getGuild?.(e),n=Gn(t?.memberCount)??Gn(t?.approximateMemberCount);if(n!=null)return n}catch{}return Xt.get(e)??null}function hb(e,t){try{let n=Th(cs()?.getProps?.(e,t)?.groups);if(n!=null)return n}catch{}return Hn.get(e)??null}function Fn(e){let t=Ao(e);if(!t||!e)return To;let n={total:ub(t),online:hb(t,String(e))};return(n.total==null||n.online==null)&&db(t,String(e)),n}function us(e){let t=Ao(e),n=r=>{try{return r()}catch(i){return`threw: ${String(i)}`}};return{channelId:e??null,guildId:t,stores:{memberCountStore:n(()=>Io()?.getName?.()??null),memberCountStoreHasMethod:n(()=>typeof Io()?.getMemberCount=="function"),memberCountRaw:n(()=>t?Io()?.getMemberCount?.(t):null),channelMemberStore:n(()=>cs()?.getName?.()??null),rawGroups:n(()=>t&&e?cs()?.getProps?.(t,String(e))?.groups??null:null),channelActionsFound:n(()=>typeof Ch()?.preload=="function")},guildRecord:n(()=>{if(!t)return null;let r=V.getGuild?.(t);return r?{memberCount:r.memberCount??null,approximateMemberCount:r.approximateMemberCount??null,keys:Object.keys(r).slice(0,30)}:null}),captured:{total:t?Xt.get(t)??null:null,online:t?Hn.get(t)??null:null,trackingActive:No.length>0,nudged:[...Co]},storeNameHints:n(()=>cn().filter(r=>/member|count|presence|session/i.test(r))),resolved:Fn(e)}}function hs(e,t){if(!t)return e.toLocaleString("en-US");if(e<1e3)return String(e);if(e<1e6){let r=e/1e3;return`${r<10?r.toFixed(1):Math.round(r)}k`}let n=e/1e6;return`${n<10?n.toFixed(1):Math.round(n)}m`}var pb=["CHANNEL_SELECT","GUILD_MEMBER_LIST_UPDATE","GUILD_UPDATE","GUILD_CREATE","THREAD_MEMBER_LIST_UPDATE"],fb=5e3;function mb(e,t){return e.total===t.total&&e.online===t.online}function gb(){let[e,t]=y(To);return C(()=>{let n=!0,r=()=>{if(!n)return;let s;try{s=Fn(le.getChannelId?.())}catch{s=To}t(c=>mb(c,s)?c:s)};r();let i=pb.map(s=>xe.subscribe(s,r)),a=setInterval(r,fb);return()=>{n=!1,clearInterval(a);for(let s of i)s()}},[]),e}function Mh({variant:e}){let{total:t,online:n}=gb(),r=Te.store,i=r.showOnline&&n!=null,a=r.showTotal&&t!=null;if(!i&&!a)return null;let s=[];return i&&s.push(`\u5728\u7EBF ${n.toLocaleString("en-US")}`),a&&s.push(`\u603B\u6210\u5458 ${t.toLocaleString("en-US")}`),o.createElement("div",{className:`hc-membercount hc-membercount--${e}`,title:s.join(" \xB7 "),"aria-label":s.join("\uFF0C")},o.createElement(Oc,{size:14,className:"hc-membercount__icon"}),i&&o.createElement("span",{className:"hc-membercount__part"},o.createElement("span",{className:"hc-membercount__dot"}),r.showLabels&&o.createElement("span",{className:"hc-membercount__label"},"\u5728\u7EBF"),o.createElement("span",{className:"hc-membercount__value"},hs(n,r.abbreviate))),i&&a&&o.createElement("span",{className:"hc-membercount__sep"},"\xB7"),a&&o.createElement("span",{className:"hc-membercount__part"},r.showLabels&&o.createElement("span",{className:"hc-membercount__label"},"\u5171"),o.createElement("span",{className:"hc-membercount__value"},hs(t,r.abbreviate))))}var Ct=g("member-count"),ms={header:['section[class*="title_"] [class*="toolbar_"]','section[class*="title"] [class*="toolbar"]','[class*="upperContainer"] [class*="toolbar"]','[class*="chat_"] [class*="toolbar_"]','[class*="toolbar_"]'],list:['[class*="membersWrap"] [class*="members_"]','aside[class*="members"] [class*="members_"]','[class*="members_"]:not([class*="membersWrap"])','[class*="memberList"]','[class*="membersWrap"]','aside[class*="members"]']},yb=1e3,ut=new Map,Mo,Po,ps,Lo=new Map,$o=!1;function bb(e){for(let t of e)try{let n=document.querySelector(t);if(n)return{element:n,selector:t}}catch{}return null}function vb(){let e=Te.store.placement,t=new Set;return(e==="header"||e==="both")&&t.add("header"),(e==="member-list"||e==="both")&&t.add("list"),t}function Ph(e){let t=ut.get(e);if(t){ut.delete(e);try{t.unmount()}catch{}t.host.remove()}}function _b(e,t){let n=document.createElement("div");n.className="hc-membercount-host",n.setAttribute("data-hc-plugin","member-count");try{t.element.insertBefore(n,t.element.firstChild)}catch(r){Ct.debug(`\u65E0\u6CD5\u5728 ${e} \u4F4D\u7F6E\u63D2\u5165\u5BBF\u4E3B\u8282\u70B9`,r);return}try{let r=X(o.createElement(Mh,{variant:e}),n);ut.set(e,{host:n,unmount:r,selector:t.selector}),Lo.get(e)!==t.selector&&(Lo.set(e,t.selector),Ct.info(`\u5DF2\u6302\u8F7D\u5230 ${e}\uFF1A${t.selector}`))}catch(r){n.remove(),Ct.error(`\u6302\u8F7D\u6210\u5458\u6570\u6807\u7B7E\u5931\u8D25\uFF08${e}\uFF09`,r)}}function fs(){let e=vb();for(let[n,r]of[...ut])(!e.has(n)||!document.contains(r.host))&&Ph(n);let t=!1;for(let n of e){if(ut.has(n)){t=!0;continue}let r=bb(ms[n]);r&&(t=!0,_b(n,r))}!t&&!$o&&ut.size===0&&($o=!0,Ct.warn("\u627E\u4E0D\u5230\u53EF\u63D2\u5165\u7684\u4F4D\u7F6E\uFF08\u9891\u9053\u9876\u680F / \u6210\u5458\u5217\u8868\uFF09\u3002\u8BF7\u5148\u6253\u5F00\u4E00\u4E2A\u670D\u52A1\u5668\u9891\u9053\uFF1B\u82E5\u5DF2\u7ECF\u6253\u5F00\u8FD8\u662F\u6CA1\u6709\uFF0C\u5728\u63A7\u5236\u53F0\u8FD0\u884C HalcyonAPI.probe() \u5E76\u628A\u8F93\u51FA\u53D1\u56DE\u6765 \u2014\u2014 \u8BF4\u660E\u8FD9\u4E2A Discord \u7248\u672C\u7684\u5BB9\u5668\u7C7B\u540D\u53D8\u4E86\u3002"))}function Lh(){try{return le.getChannelId?.()??null}catch{return null}}function xb(){let e=Lh();if(!Ao(e))return;let{total:t,online:n}=Fn(e);t!=null||n!=null||Ct.warn("\u5DF2\u6302\u8F7D\u4F46\u62FF\u4E0D\u5230\u6210\u5458\u6570\uFF08\u6240\u6709\u6570\u636E\u6E90\u90FD\u662F\u7A7A\uFF09\u3002\u4E0B\u9762\u662F\u6BCF\u4E2A\u6765\u6E90\u7684\u5B9E\u9645\u7ED3\u679C\uFF1B\u4E5F\u53EF\u4EE5\u5728\u63A7\u5236\u53F0\u8FD0\u884C HalcyonAPI.probe() \u62FF\u5230\u5B8C\u6574\u62A5\u544A\u3002",us(e))}var $h=N({id:"member-count",name:"\u6210\u5458\u6570\u663E\u793A",description:"\u5728\u9891\u9053\u9876\u680F\u6216\u6210\u5458\u5217\u8868\u9876\u90E8\u663E\u793A\u5F53\u524D\u670D\u52A1\u5668\u7684\u5728\u7EBF\u4EBA\u6570\u4E0E\u603B\u6210\u5458\u6570\u3002\u6570\u5B57\u53D6\u81EA Discord \u81EA\u5DF1\u7684 store\uFF1B\u82E5\u67D0\u670D\u52A1\u5668\u8FD8\u6CA1\u6709\u6210\u5458\u5217\u8868\u6570\u636E\uFF0C\u4F1A\u8C03\u7528\u4E00\u6B21 Discord \u81EA\u8EAB\u7684\u9891\u9053\u9884\u52A0\u8F7D\u6765\u53D6\uFF08\u53EF\u5728\u8BBE\u7F6E\u91CC\u5173\u95ED\uFF09\u3002\u5207\u6362\u670D\u52A1\u5668\u81EA\u52A8\u66F4\u65B0\u3002",authors:[{name:"caitemm"}],category:"utility",settings:Te,start(){B(),$o=!1,Lo.clear(),Ah(),fs(),Mo=setInterval(fs,yb),ps=Te.subscribe("placement",()=>{$o=!1,fs()}),Po=setTimeout(xb,8e3),Ct.info(`\u6210\u5458\u6570\u6807\u7B7E\u5DF2\u542F\u7528\uFF08\u4F4D\u7F6E\uFF1A${Te.store.placement}\uFF09`)},stop(){Mo&&(clearInterval(Mo),Mo=void 0),Po&&(clearTimeout(Po),Po=void 0),ps?.(),ps=void 0,ds();for(let e of[...ut.keys()])Ph(e);Lo.clear(),Ct.info("\u6210\u5458\u6570\u6807\u7B7E\u5DF2\u79FB\u9664")},probe(){let e=Lh();return{placement:Te.store.placement,mounted:[...ut.entries()].map(([t,n])=>({variant:t,selector:n.selector,attached:document.contains(n.host),renderedHtml:n.host.innerHTML.slice(0,200)})),anchors:{header:dt(ms.header),list:dt(ms.list)},classHints:{toolbar:ze("toolbar"),members:ze("members"),title:ze("title_")},data:us(e)}}});var F=D({inlineAvatars:{group:"\u5E38\u9A7B\u663E\u793A",type:"boolean",default:!1,label:"\u76F4\u63A5\u5728\u8868\u60C5\u65C1\u663E\u793A\u5934\u50CF",description:"\u6BCF\u4E2A\u53CD\u5E94\u5185\u5D4C\u4E00\u5C0F\u884C\u5934\u50CF\u3002\u65B0\u7248 Discord \u684C\u9762\u5BA2\u6237\u7AEF\u5DF2\u7ECF\u539F\u751F\u663E\u793A\uFF0C\u7EDD\u5927\u591A\u6570\u60C5\u51B5\u4E0B\u8FD9\u4E00\u9879\u5E94\u5173\u95ED\uFF1B\u53EA\u6709\u5F53\u4F60\u7684 Discord \u7248\u672C\u6CA1\u6709\u539F\u751F\u7684\u53CD\u5E94\u8005\u5934\u50CF\u9884\u89C8\u65F6\u624D\u5F00\u542F\uFF0C\u5426\u5219\u4F1A\u91CD\u590D\u3002"},inlineAvatarCount:{group:"\u5E38\u9A7B\u663E\u793A",type:"number",default:3,label:"\u6700\u591A\u663E\u793A\u51E0\u4E2A\u5934\u50CF",description:"\u53CD\u5E94\u5185\u6700\u591A\u8D34\u51E0\u5F20\u5934\u50CF\u3002\u591A\u4F59\u7684\u4EBA\u4EE5\u300C+N\u300D\u5F62\u5F0F\u6298\u53E0\u3002",min:1,max:6,step:1},hoverPopout:{group:"\u60AC\u505C\u6D6E\u5C42",type:"boolean",default:!1,label:"\u60AC\u505C\u65F6\u5F39\u51FA\u5B8C\u6574\u540D\u5355",description:"\u9F20\u6807\u505C\u5728\u53CD\u5E94\u4E0A\u65F6\u5F39\u51FA\u5B8C\u6574\u53CD\u5E94\u8005\u5217\u8868\uFF08\u5E26\u540D\u5B57\u3001\u53EF\u9009 ID\uFF09\u3002\u5E38\u9A7B\u5934\u50CF\u5DF2\u7ECF\u591F\u7528\u65F6\u53EF\u4EE5\u5173\u6389\u3002"},trigger:{group:"\u60AC\u505C\u6D6E\u5C42",type:"select",default:"hover",label:"\u89E6\u53D1\u65B9\u5F0F",description:"\u60AC\u505C\u5373\u67E5\u4F1A\u5728\u4F60\u5212\u8FC7\u8868\u60C5\u65F6\u5C31\u8BF7\u6C42\u4E00\u6B21\u540D\u5355\uFF1B\u6309\u4F4F Alt \u60AC\u505C\u66F4\u514B\u5236\uFF0C\u9002\u5408\u4E0D\u60F3\u9891\u7E41\u89E6\u53D1\u7684\u573A\u666F\u3002\u4EC5\u5728\u300C\u60AC\u505C\u65F6\u5F39\u51FA\u5B8C\u6574\u540D\u5355\u300D\u5F00\u542F\u65F6\u751F\u6548\u3002",options:[{value:"hover",label:"\u60AC\u505C\u5373\u67E5"},{value:"alt-hover",label:"\u6309\u4F4F Alt \u60AC\u505C"}]},delay:{group:"\u60AC\u505C\u6D6E\u5C42",type:"number",default:120,label:"\u60AC\u505C\u5EF6\u8FDF\uFF08\u6BEB\u79D2\uFF09",description:"\u9F20\u6807\u505C\u7559\u591A\u4E45\u624D\u5F39\u51FA\u540D\u5355\u3002\u592A\u77ED\u4F1A\u5728\u5212\u8FC7\u4E00\u6392\u8868\u60C5\u65F6\u8FDE\u7EED\u53D1\u8BF7\u6C42\u3002\u4EC5\u5728\u300C\u60AC\u505C\u65F6\u5F39\u51FA\u5B8C\u6574\u540D\u5355\u300D\u5F00\u542F\u65F6\u751F\u6548\u3002",min:0,max:2e3,step:50},maxUsers:{group:"\u663E\u793A",type:"number",default:20,label:"\u6700\u591A\u663E\u793A\u4EBA\u6570",description:"\u8D85\u51FA\u7684\u90E8\u5206\u6298\u53E0\u4E3A\u201C\u8FD8\u6709 N \u4EBA\u201D\u3002Discord \u5355\u6B21\u6700\u591A\u8FD4\u56DE 100 \u4EBA\u3002",min:1,max:100,step:5},showAvatars:{group:"\u663E\u793A",type:"boolean",default:!0,label:"\u663E\u793A\u5934\u50CF",description:"\u5173\u95ED\u540E\u53EA\u663E\u793A\u540D\u5B57\uFF0C\u4E0D\u4F1A\u52A0\u8F7D\u4EFB\u4F55\u5934\u50CF\u56FE\u7247\u3002"},showIds:{group:"\u663E\u793A",type:"boolean",default:!1,label:"\u663E\u793A\u7528\u6237 ID",description:"\u5728\u540D\u5B57\u540E\u9762\u9644\u4E0A\u7528\u6237 ID\uFF0C\u4FBF\u4E8E\u4E3E\u62A5\u6216\u62C9\u9ED1\u65F6\u590D\u5236\u3002"}});var wb=g("who-reacted"),Sb=3e4;function qn(e){for(let t of ye(e,14)){let n=t?.emoji,r=t?.message;if(n==null||r==null)continue;let i=r.id,a=r.channel_id??r.channelId;if(!(!i||!a)&&!(!n.id&&!n.name))return{channelId:String(a),messageId:String(i),emoji:n,count:typeof t.count=="number"?t.count:null,type:t.type===1?1:0}}return null}function Dh(e){let t=e.name??"";return e.id?`${t}:${e.id}`:t}function gs(e){return`${e.channelId}/${e.messageId}/${Dh(e.emoji)}/${e.type}`}function Oh(e){return e.id?`:${e.name??"emoji"}:`:e.name??""}function kb(e){let t=e?.id?String(e.id):null;return t?Dr(t,e?.avatar,32):null}function Eb(e){let t=e?.id?String(e.id):null;if(!t)return null;let n=typeof e.global_name=="string"&&e.global_name||typeof e.username=="string"&&e.username||t;return{id:t,name:n,avatarUrl:kb(e),bot:e?.bot===!0}}var Oo=new Map,Do=new Map;function ys(e){let t=Oo.get(gs(e));return t?Date.now()-t.at>Sb?(Oo.delete(gs(e)),null):t.reactors:null}function bs(){Oo.clear(),Do.clear()}function jo(e,t){let n=gs(e),r=ys(e);if(r)return Promise.resolve(r);let i=Do.get(n);if(i)return i;let a=Math.max(1,Math.min(100,Math.trunc(t)||20)),s=`/channels/${e.channelId}/messages/${e.messageId}/reactions/${encodeURIComponent(Dh(e.emoji))}?limit=${a}`+(e.type===1?"&type=1":""),l=(async()=>{let d=Q;if(typeof d?.get!="function")throw new Error("\u672A\u627E\u5230 Discord \u7684 REST \u6A21\u5757");let h=(await d.get({url:s,oldFormErrors:!0}))?.body;if(!Array.isArray(h))throw new Error("\u8FD4\u56DE\u5185\u5BB9\u4E0D\u662F\u7528\u6237\u5217\u8868");let f=[];for(let v of h){let x=Eb(v);x&&f.push(x)}return Oo.set(n,{at:Date.now(),reactors:f}),f})().catch(d=>{throw wb.debug("\u62C9\u53D6 reaction \u540D\u5355\u5931\u8D25",d),d});return Do.set(n,l),l.catch(()=>{}).then(()=>Do.delete(n)),l}function Ib(e){return De(String(e.id),!!e.animated,32)}function Nb({emoji:e}){return e.id?o.createElement("img",{className:"hc-whoreacted__emoji-img",src:Ib(e),alt:Oh(e),width:18,height:18}):o.createElement("span",{className:"hc-whoreacted__emoji-char"},e.name??"")}function jh({target:e}){let t=F.store,[n,r]=y(()=>{let c=ys(e);return c?{kind:"ready",reactors:c}:{kind:"loading"}});C(()=>{let c=!0;return jo(e,t.maxUsers).then(l=>{c&&r({kind:"ready",reactors:l})}).catch(l=>{if(!c)return;let d=l instanceof Error?l.message:typeof l=="string"?l:"\u672A\u77E5\u9519\u8BEF";r({kind:"error",message:d})}),()=>{c=!1}},[]);let i=n.kind==="ready"?n.reactors.slice(0,t.maxUsers):[],a=e.count??(n.kind==="ready"?n.reactors.length:null),s=n.kind==="ready"&&a!=null?Math.max(0,a-i.length):0;return o.createElement("div",{className:"hc-whoreacted"},o.createElement("div",{className:"hc-whoreacted__head"},o.createElement(Nb,{emoji:e.emoji}),o.createElement("span",{className:"hc-whoreacted__title"},"\u8C01\u70B9\u4E86\u8FD9\u4E2A\u8868\u60C5"),a!=null&&o.createElement("span",{className:"hc-whoreacted__count"},a)),n.kind==="loading"&&o.createElement("div",{className:"hc-whoreacted__hint"},"\u6B63\u5728\u67E5\u8BE2\u2026"),n.kind==="error"&&o.createElement("div",{className:"hc-whoreacted__hint hc-whoreacted__hint--error"},"\u67E5\u8BE2\u5931\u8D25\uFF1A",n.message),n.kind==="ready"&&i.length===0&&o.createElement("div",{className:"hc-whoreacted__hint"},"\u6CA1\u6709\u4EBA\uFF08\u53EF\u80FD\u521A\u521A\u88AB\u53D6\u6D88\uFF09"),i.length>0&&o.createElement("div",{className:"hc-whoreacted__list"},i.map(c=>o.createElement("div",{className:"hc-whoreacted__row",key:c.id},t.showAvatars&&c.avatarUrl&&o.createElement("img",{className:"hc-whoreacted__avatar",src:c.avatarUrl,alt:"",width:20,height:20}),o.createElement("span",{className:"hc-whoreacted__name"},c.name),c.bot&&o.createElement("span",{className:"hc-whoreacted__tag"},"BOT"),t.showIds&&o.createElement("span",{className:"hc-whoreacted__id"},c.id))),s>0&&o.createElement("div",{className:"hc-whoreacted__more"},"\u8FD8\u6709 ",s," \u4EBA")))}var Uh=g("who-reacted"),Tt=new WeakSet,xs="data-hc-reactors",zo,Kn,vs='[class*="reactionInner"], [class*="reaction_"]';function Cb(){let e=document.createElement("span");return e.className="hc-inline-reactors",e.setAttribute(xs,"1"),e}function Tb(e,t,n){let r=Math.max(1,Math.min(6,Math.trunc(F.store.inlineAvatarCount)||3)),i=t.slice(0,r),a=n??t.length,s=Math.max(0,a-i.length);e.textContent="";for(let c of i){let l=document.createElement("img");l.className="hc-inline-reactors__avatar",c.avatarUrl&&(l.src=c.avatarUrl),l.alt="",l.loading="lazy",l.title=c.name,l.referrerPolicy="no-referrer",e.appendChild(l)}if(i.length>0&&s>0){let c=document.createElement("span");c.className="hc-inline-reactors__more",c.textContent=`+${s}`,e.appendChild(c)}}function zh(e){return e.querySelector('img[src*="cdn.discordapp.com/avatars/"]')!=null||e.querySelector('img[src*="cdn.discordapp.com/embed/avatars/"]')!=null}async function _s(e){if(Tt.has(e))return;if(zh(e)){Tt.add(e);return}Tt.add(e);let t=qn(e);if(!t||t.count!=null&&t.count<=0)return;let n=Cb();try{e.appendChild(n)}catch{return}try{let r=Math.min(12,Math.max(6,(F.store.inlineAvatarCount||3)+3)),i=await jo(t,r);if(!n.isConnected)return;if(i.length===0){n.remove(),Tt.delete(e);return}if(zh(e)){n.remove();return}Tb(n,i,t.count)}catch(r){Uh.debug("inline avatars: fetch failed",r),n.remove(),Tt.delete(e)}}function Bh(){if(!F.store.inlineAvatars)return;let e;try{e=document.querySelectorAll(vs)}catch{return}e.forEach(t=>{t.isConnected&&(Tt.has(t)&&!t.querySelector(`[${xs}]`)&&Tt.delete(t),_s(t))})}function Bo(){if(F.store.inlineAvatars){if(Vn(),Bh(),zo=setInterval(Bh,1500),typeof MutationObserver=="function"){Kn=new MutationObserver(e=>{for(let t of e)t.addedNodes.forEach(n=>{n instanceof Element&&(n.matches?.(vs)&&_s(n),n.querySelectorAll?.(vs).forEach(r=>void _s(r)))})});try{Kn.observe(document.body,{childList:!0,subtree:!0})}catch{}}Uh.info("inline reactor avatars: enabled")}}function Vn(){if(zo&&(clearInterval(zo),zo=void 0),Kn){try{Kn.disconnect()}catch{}Kn=void 0}try{document.querySelectorAll(`[${xs}]`).forEach(e=>e.remove())}catch{}}var Es=g("who-reacted"),Is='[class*="reactionInner"], [class*="reaction_"]',Ab=140,Mb=500,W=null,Go=null,Qt=null,Wn=null,Ho,Ae=null,Yn,Be,Zt=!1,ws,Ss,ks,Fo=!1;function Uo(){if(!W||!Qt)return;let e=Qt.getBoundingClientRect(),t=W.offsetWidth||220,n=W.offsetHeight||110,r=8,i=e.left+e.width/2-t/2,a=e.top-n-r;a<r&&(a=e.bottom+r),i=Math.max(r,Math.min(i,window.innerWidth-t-r)),a=Math.max(r,Math.min(a,window.innerHeight-n-r)),W.style.left=`${Math.round(i)}px`,W.style.top=`${Math.round(a)}px`}function Ue(){if(Be&&(clearTimeout(Be),Be=void 0),Ho&&(clearInterval(Ho),Ho=void 0),Wn){try{Wn.disconnect()}catch{}Wn=null}if(Go){try{Go()}catch{}Go=null}W&&(W.remove(),W=null),Qt=null}function Pb(){!W||Be||(Be=setTimeout(()=>{Be=void 0,Ue()},Ab))}function Gh(){Be&&(clearTimeout(Be),Be=void 0)}function Lb(e,t){Ue(),W=document.createElement("div"),W.className="halcyon hc-whoreacted-host",W.setAttribute("data-hc-plugin","who-reacted"),document.body.appendChild(W),Qt=e;try{Go=X(o.createElement(jh,{target:t}),W)}catch(n){Es.error("\u65E0\u6CD5\u663E\u793A reaction \u540D\u5355",n),Ue();return}Uo(),typeof ResizeObserver=="function"?(Wn=new ResizeObserver(()=>Uo()),Wn.observe(W)):(setTimeout(Uo,120),setTimeout(Uo,400)),Ho=setInterval(()=>{(!Qt||!document.contains(Qt))&&Ue()},Mb)}function $b(){return F.store.trigger!=="alt-hover"||Zt}function qh(e){if(!$b())return;let t=qn(e);t&&Lb(e,t)}function Jn(){Yn&&(clearTimeout(Yn),Yn=void 0)}function Kh(e){let t=e.target;if(!(t instanceof Element))return;let n=t.closest(Is);if(!n){Ae=null,Jn(),Pb();return}if(n===Ae){Gh();return}Ae=n,Jn(),Gh();let r=Math.max(0,Math.min(2e3,F.store.delay));Yn=setTimeout(()=>{Yn=void 0,Ae===n&&document.contains(n)&&qh(n)},r)}function Vh(){Ae=null,Jn(),Ue()}function Wh(e){e.altKey&&(Zt=!0,F.store.trigger==="alt-hover"&&Ae&&!W&&document.contains(Ae)&&qh(Ae))}function Yh(e){(e.key==="Alt"||!e.altKey)&&(Zt=!1,F.store.trigger==="alt-hover"&&Ue())}function qo(){W&&Ue()}function Jh(){Zt=!1}function Hh(){Fo||(Fo=!0,document.addEventListener("mouseover",Kh,!0),document.addEventListener("mouseleave",Vh),document.addEventListener("keydown",Wh,!0),document.addEventListener("keyup",Yh,!0),document.addEventListener("scroll",qo,!0),window.addEventListener("resize",qo),window.addEventListener("blur",Jh))}function Fh(){Fo&&(Fo=!1,document.removeEventListener("mouseover",Kh,!0),document.removeEventListener("mouseleave",Vh),document.removeEventListener("keydown",Wh,!0),document.removeEventListener("keyup",Yh,!0),document.removeEventListener("scroll",qo,!0),window.removeEventListener("resize",qo),window.removeEventListener("blur",Jh),Jn(),Ae=null,Zt=!1,Ue())}var Rh=N({id:"who-reacted",name:"\u8C01\u70B9\u4E86\u8868\u60C5",description:"\u5728\u6BCF\u4E2A\u53CD\u5E94\u56DE\u5E94\u5185\u5D4C\u4E00\u5C0F\u884C\u5934\u50CF\uFF08\u524D\u51E0\u4E2A\u53CD\u5E94\u8005\uFF09\uFF0C\u50CF Discord \u684C\u9762\u8FD1\u7248\u7684 Reaction Preview \u4E00\u6837\uFF0C\u4E0D\u7528\u60AC\u505C\u5C31\u770B\u5F97\u5230\u3002\u540D\u5355\u6309\u9700\u67E5\u8BE2\u3001\u7F13\u5B58 30 \u79D2\u3002\u60AC\u505C\u5B8C\u6574\u540D\u5355\u6D6E\u5C42\u9ED8\u8BA4\u5173\u95ED\uFF0C\u9700\u8981\u65F6\u53EF\u5728\u8BBE\u7F6E\u91CC\u5F00\u3002",authors:[{name:"Vencord"},{name:"caitemm"}],category:"utility",settings:F,start(){B(),bs(),Bo(),ws=F.subscribe("inlineAvatars",e=>{e?Bo():Vn()}),Ss=F.subscribe("inlineAvatarCount",()=>{Vn(),Bo()}),F.store.hoverPopout&&Hh(),ks=F.subscribe("hoverPopout",e=>{e?Hh():Fh()}),Es.info(`\u5DF2\u542F\u7528\uFF08\u5185\u5D4C\u5934\u50CF\uFF1A${F.store.inlineAvatars?"\u5F00":"\u5173"}\uFF0C\u60AC\u505C\u6D6E\u5C42\uFF1A${F.store.hoverPopout?"\u5F00":"\u5173"}\uFF09`)},stop(){Fh(),ws?.(),ws=void 0,Ss?.(),Ss=void 0,ks?.(),ks=void 0,Vn(),Jn(),Ae=null,Zt=!1,Ue(),bs(),Es.info("\u5DF2\u505C\u7528")},probe(){let e=null;try{e=document.querySelectorAll(Is)}catch{e=null}let t=null;if(e&&e.length>0){let n=qn(e[0]);t=n?{channelId:n.channelId,messageId:n.messageId,emoji:{id:n.emoji.id??null,name:n.emoji.name??null},count:n.count,type:n.type}:"fiber props \u91CC\u6CA1\u6709 message + emoji \u2014\u2014 \u8BF4\u660E\u8FD9\u4E2A\u7248\u672C\u7684 reaction \u7EC4\u4EF6 props \u53D8\u4E86"}return{trigger:F.store.trigger,cardShown:W!=null,reactionNodes:e?.length??-1,sample:t,anchors:dt([Is,'[class*="reactionInner"]','[class*="reaction_"]']),classHints:ze("reaction"),restApiAvailable:(()=>{try{return typeof Q?.get=="function"}catch{return!1}})()}}});var Xh=T(e=>e?.getName?.()==="PresenceStore"),Qh=T(e=>e?.getName?.()==="SessionsStore"),Zh=["desktop","mobile","web","embedded"];function ep(e){return e==="online"||e==="idle"||e==="dnd"?e:"online"}function Db(e){switch(e){case"desktop":case"mobile":case"web":case"embedded":return e;default:return null}}function Ob(){try{let e=ee.getCurrentUser?.()?.id;return typeof e=="string"?e:null}catch{return null}}function Vo(e){try{return ee.getUser?.(e)?.bot===!0}catch{return!1}}function jb(e){let t;try{let r=Xh.getState?.();t=(r?.clientStatuses??r?.clientStatus)?.[e]}catch{return[]}if(t==null||typeof t!="object")return[];let n=[];for(let r of Zh){let i=t[r];i!=null&&n.push({platform:r,status:ep(i)})}return n}function zb(){let e;try{e=Qh.getSessions?.()}catch{return[]}if(e==null||typeof e!="object")return[];let t=new Map;for(let r of Object.values(e)){if(r==null||r.sessionId==="all")continue;let i=Db(r.clientInfo?.client);i&&(t.has(i)||t.set(i,ep(r.status)))}let n=[];for(let r of Zh){let i=t.get(r);i&&n.push({platform:r,status:i})}return n}function Rn(e){if(!e)return[];if(e===Ob()){let t=zb();if(t.length)return t}return jb(e)}var Bb=400,tp=0,en,Ko=new Set;function Wo(){return tp}function np(e){return Ko.add(e),()=>{Ko.delete(e)}}function tn(){en||(en=setTimeout(()=>{en=void 0,tp++;for(let e of[...Ko])try{e()}catch{}},Bb))}function rp(){en&&(clearTimeout(en),en=void 0),Ko.clear()}function op(){let e=!1,t=[],n=null;try{let a=Xh.getState?.();e=a!=null&&typeof a=="object",e&&(t=Object.keys(a).slice(0,12));let s=a?.clientStatuses??a?.clientStatus;n=s&&typeof s=="object"?Object.keys(s).length:null}catch{e=!1}let r=!1,i=null;try{let a=Qh.getSessions?.();r=a!=null&&typeof a=="object",r&&(i=Object.keys(a).length)}catch{r=!1}return{PresenceStore:e,presenceStateKeys:t,clientStatusesEntries:n,SessionsStore:r,sessionCount:i}}var oe=D({inMessages:{group:"\u663E\u793A\u4F4D\u7F6E",type:"boolean",default:!0,label:"\u6D88\u606F\u4F5C\u8005\u65C1",description:"\u5728\u804A\u5929\u91CC\u6BCF\u6761\u6D88\u606F\u7684\u7528\u6237\u540D\u540E\u9762\u663E\u793A\u5BF9\u65B9\u6240\u5728\u7684\u5E73\u53F0\u3002"},inMemberList:{group:"\u663E\u793A\u4F4D\u7F6E",type:"boolean",default:!0,label:"\u6210\u5458\u5217\u8868",description:"\u5728\u53F3\u4FA7\u6210\u5458\u5217\u8868\u7684\u6BCF\u4E2A\u540D\u5B57\u540E\u9762\u663E\u793A\u5E73\u53F0\u56FE\u6807\u3002"},colorize:{group:"\u5916\u89C2",type:"select",default:"status",label:"\u56FE\u6807\u914D\u8272",description:"\u6309\u72B6\u6001\u7740\u8272\u65F6\uFF0C\u7EFF=\u5728\u7EBF\u3001\u9EC4=\u7A7A\u95F2\u3001\u7EA2=\u514D\u6253\u6270\uFF0C\u548C Discord \u7684\u72B6\u6001\u70B9\u4E00\u81F4\u3002",options:[{value:"status",label:"\u6309\u5728\u7EBF\u72B6\u6001\u7740\u8272"},{value:"muted",label:"\u7EDF\u4E00\u7070\u8272"}]},iconSize:{group:"\u5916\u89C2",type:"select",default:"14",label:"\u56FE\u6807\u5927\u5C0F",options:[{value:"12",label:"12\uFF08\u6700\u5C0F\uFF09"},{value:"14",label:"14\uFF08\u9ED8\u8BA4\uFF09"},{value:"16",label:"16"},{value:"18",label:"18"}]},ignoreBots:{group:"\u8FC7\u6EE4",type:"boolean",default:!0,label:"\u5FFD\u7565\u673A\u5668\u4EBA",description:"\u673A\u5668\u4EBA\u51E0\u4E4E\u603B\u662F\u663E\u793A\u4E3A\u7F51\u9875\u7AEF\uFF0C\u4FE1\u606F\u91CF\u4E3A\u96F6\uFF0C\u9ED8\u8BA4\u4E0D\u663E\u793A\u3002"},ignoreSelf:{group:"\u8FC7\u6EE4",type:"boolean",default:!1,label:"\u5FFD\u7565\u81EA\u5DF1",description:"\u4E0D\u5728\u81EA\u5DF1\u7684\u6D88\u606F\u65C1\u663E\u793A\u5E73\u53F0\u56FE\u6807\u3002"}});var Ub={desktop:jc,mobile:zc,web:Bc,embedded:Uc},Gb={desktop:"\u684C\u9762\u5BA2\u6237\u7AEF",mobile:"\u624B\u673A",web:"\u7F51\u9875 / \u6D4F\u89C8\u5668",embedded:"\u6E38\u620F\u4E3B\u673A"},Hb={online:"\u5728\u7EBF",idle:"\u7A7A\u95F2",dnd:"\u514D\u6253\u6270",offline:"\u79BB\u7EBF"};function Fb(){let[,e]=y(Wo());return C(()=>np(()=>e(Wo())),[]),Wo()}function ip({userId:e,isSelf:t}){Fb();let n=oe.store;if(n.ignoreSelf&&t||n.ignoreBots&&Vo(e))return null;let r=Rn(e);if(r.length===0)return null;let i=Number(n.iconSize)||14,a=n.colorize==="status";return o.createElement("span",{className:"hc-platform"},r.map(({platform:s,status:c})=>{let l=Ub[s],d=`${Gb[s]}\uFF08${Hb[c]??c}\uFF09`;return o.createElement("span",{key:s,className:`hc-platform__item hc-platform__item--${a?c:"muted"}`,title:d},o.createElement(l,{size:i,"aria-label":d}))}))}var Xn=g("platform-indicators"),At="data-hc-platform",Ns=['[id^="message-username-"]','[class*="headerText"] [class*="username"]','[class*="header_"] [class*="username"]'],Cs=['[class*="membersWrap"] [class*="nameAndDecorators"]','[class*="members"] [class*="nameAndDecorators"]','[class*="nameAndDecorators"]','[class*="membersWrap"] [class*="memberInner"]','[class*="member_"] [class*="username"]'],qb=["PRESENCE_UPDATES","PRESENCE_UPDATE","SESSIONS_REPLACE","GUILD_MEMBER_LIST_UPDATE"],Kb=1e3,nn=new Map,Yo,Jo=[];function cp(){try{let e=ee.getCurrentUser?.()?.id;return typeof e=="string"?e:null}catch{return null}}function lp(e,t){let n=ye(e,16);if(t==="message")for(let r of n){let i=r?.message?.author?.id;if(i)return String(i)}for(let r of n){let i=r?.user?.id;if(i)return String(i)}for(let r of n){let i=r?.message?.author?.id;if(i)return String(i)}return null}function Vb(e,t,n,r){let i=document.createElement("span");i.className="hc-platform-host",i.setAttribute("data-hc-plugin","platform-indicators");try{e.appendChild(i)}catch{return!1}try{let a=X(o.createElement(ip,{userId:n,isSelf:n===r}),i);return nn.set(i,{kind:t,host:i,anchor:e,unmount:a}),!0}catch(a){return i.remove(),Xn.debug("\u6302\u8F7D\u5E73\u53F0\u56FE\u6807\u5931\u8D25",a),!1}}function Wb(e,t,n){for(let r=0;r<e.length;r++){let i=e[r];if(i.hasAttribute(At))continue;let a=lp(i,t);if(!a){i.setAttribute(At,"0");continue}i.setAttribute(At,t),Vb(i,t,a,n)||i.removeAttribute(At)}}function Ms(e){nn.delete(e.host);try{e.unmount()}catch{}e.host.remove();try{e.anchor.removeAttribute(At)}catch{}}function Yb(){for(let e of[...nn.values()])document.contains(e.host)||Ms(e)}function ap(e){for(let t of[...nn.values()])t.kind===e&&Ms(t)}function Ts(e){for(let t of e)try{let n=document.querySelectorAll(t);if(n.length>0)return{nodes:n,selector:t}}catch{}return null}var Xo=new Map,As=!1;function sp(e,t,n){let r=Ts(t);return r?(Xo.get(e)!==r.selector&&(Xo.set(e,r.selector),Xn.info(`${e} \u951A\u70B9\uFF1A${r.selector}\uFF08${r.nodes.length} \u4E2A\uFF09`)),Wb(r.nodes,e,n),!0):!1}function Ro(){Yb();let e=oe.store,t=cp(),n=!1;e.inMessages&&sp("message",Ns,t)&&(n=!0),e.inMemberList&&sp("member",Cs,t)&&(n=!0),!n&&!As&&(e.inMessages||e.inMemberList)&&(As=!0,Xn.warn("\u627E\u4E0D\u5230\u53EF\u6302\u8F7D\u7684\u4F4D\u7F6E\uFF08\u6D88\u606F\u4F5C\u8005 / \u6210\u5458\u5217\u8868\uFF09\u3002\u8BF7\u5148\u6253\u5F00\u4E00\u4E2A\u6709\u6D88\u606F\u7684\u9891\u9053\uFF1B\u82E5\u5DF2\u7ECF\u6253\u5F00\u8FD8\u662F\u6CA1\u6709\uFF0C\u5728\u63A7\u5236\u53F0\u8FD0\u884C HalcyonAPI.probe() \u5E76\u628A\u8F93\u51FA\u53D1\u56DE\u6765\u3002"))}function Jb(){try{for(let e of document.querySelectorAll(`[${At}]`))e.removeAttribute(At)}catch{}}var dp=N({id:"platform-indicators",name:"\u5E73\u53F0\u6807\u8BC6",description:"\u5728\u6D88\u606F\u4F5C\u8005\u4E0E\u6210\u5458\u5217\u8868\u65C1\u663E\u793A\u5BF9\u65B9\u5F53\u524D\u6240\u5728\u7684\u5E73\u53F0\uFF08\u684C\u9762\u7AEF / \u624B\u673A / \u7F51\u9875 / \u6E38\u620F\u4E3B\u673A\uFF09\uFF0C\u56FE\u6807\u6309\u5728\u7EBF\u72B6\u6001\u7740\u8272\u3002\u6570\u636E\u53D6\u81EA Discord \u81EA\u5DF1\u7684\u72B6\u6001 store\uFF0C\u4E0D\u53D1\u4EFB\u4F55\u8BF7\u6C42\u3002",authors:[{name:"Vencord"},{name:"caitemm"}],category:"appearance",settings:oe,start(){B(),As=!1,Xo.clear(),Ro(),Yo=setInterval(Ro,Kb),Jo=qb.map(e=>xe.subscribe(e,tn)),Jo.push(oe.subscribe("inMessages",e=>{e?Ro():ap("message")}),oe.subscribe("inMemberList",e=>{e?Ro():ap("member")}),oe.subscribe("colorize",()=>tn()),oe.subscribe("iconSize",()=>tn()),oe.subscribe("ignoreBots",()=>tn()),oe.subscribe("ignoreSelf",()=>tn())),Xn.info("\u5E73\u53F0\u6807\u8BC6\u5DF2\u542F\u7528")},stop(){Yo&&(clearInterval(Yo),Yo=void 0);for(let e of Jo)try{e()}catch{}Jo=[];for(let e of[...nn.values()])Ms(e);Jb(),rp(),Xo.clear(),Xn.info("\u5E73\u53F0\u6807\u8BC6\u5DF2\u79FB\u9664")},probe(){let e=cp(),t=Ts(Ns),n=Ts(Cs),r=(i,a)=>{if(!i||i.nodes.length===0)return null;let s=i.nodes[0],c=lp(s,a);return{selector:i.selector,matches:i.nodes.length,userId:c,platforms:c?Rn(c):null,isBot:c?Vo(c):null}};return{settings:{inMessages:oe.store.inMessages,inMemberList:oe.store.inMemberList,ignoreBots:oe.store.ignoreBots},mountedCount:nn.size,selfId:e,selfPlatforms:e?Rn(e):null,message:r(t,"message"),member:r(n,"member"),anchors:{message:dt(Ns),member:dt(Cs)},classHints:{username:ze("username"),nameAndDecorators:ze("nameAndDecorators")},stores:op()}}});var up=[ml,wl,hd,md,xd,Kd,eu,vu,Cu,Du,Bu,Gu,th,bh,kh,Ih,$h,Rh,dp];var Rb=g("probe");function hp(){let e={};for(let n of K.list()){let r=K.getPlugin(n.id),i=r?.probe;if(typeof i=="function")try{e[n.id]={enabled:n.enabled,state:n.state,needsRestart:n.needsRestart,report:i.call(r)}}catch(a){e[n.id]={enabled:n.enabled,state:n.state,probeError:String(a)}}}let t={version:"0.7.30",build:"2026-11-19 12:06:23",href:(()=>{try{return location.pathname}catch{return null}})(),plugins:e,patches:Y()};try{globalThis.__halcyonProbe=JSON.stringify(t,null,2),Rb.info("probe \u5DF2\u751F\u6210 \u2014\u2014 \u5728\u63A7\u5236\u53F0\u8FD0\u884C  copy(__halcyonProbe)  \u7136\u540E\u628A\u5185\u5BB9\u8D34\u56DE\u6765")}catch{}return t}var pp=g("extension");K.registerAll(up);K.prepare();async function Xb(){await yc,await K.boot(),B();try{globalThis.HalcyonAPI={version:"0.7.30",build:"2026-11-19 12:06:23",open:Qe,close:Le,runtime:K,patchReport:()=>Y(),dumpSource:(e,t)=>dr(e,t),diagnose:()=>fc(),quests:()=>hc(),storeNames:()=>cn(),find:P,findByProps:Me,findByCode:lr,findStoreByName:qe,probe:hp}}catch{}pp.info("Halcyon (extension) ready \u2014 press Ctrl/Cmd+Shift+H to open settings")}Xb().catch(e=>pp.error("extension boot failed",e));})();
