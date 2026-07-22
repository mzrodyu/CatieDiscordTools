"use strict";var Halcyon=(()=>{var hr={debug:10,info:20,warn:30,error:40},ca={debug:"#8E8E93",info:"#0A84FF",warn:"#FF9F0A",error:"#FF453A"},la=500,st=[],qt=new Set,da=hr.info;function at(e,t,n){let o={time:Date.now(),level:e,scope:t,parts:n};st.push(o),st.length>la&&st.shift();for(let s of qt)try{s(o)}catch{}if(hr[e]<da)return;let i=`background:${ca[e]};color:#fff;border-radius:4px;padding:0 6px;font-weight:600`;(e==="error"?console.error:e==="warn"?console.warn:console.log)(`%cHalcyon%c ${t}`,i,"color:inherit;font-weight:600",...n)}function g(e){return{debug:(...t)=>at("debug",e,t),info:(...t)=>at("info",e,t),warn:(...t)=>at("warn",e,t),error:(...t)=>at("error",e,t),child:t=>g(`${e}:${t}`)}}function Yt(){return st.slice()}function pr(e){return qt.add(e),()=>qt.delete(e)}var H=g("modules"),fr="webpackChunkdiscord_app",te,Le=!1,mr=!1,ct=new Set,Xt=[],gr=()=>{};function br(e){gr=e,globalThis.__halcyon_self__=t=>gr(t)}function vr(e){Xt.push({...e,applied:!1,hits:0})}function F(){return Xt.map(({pluginId:e,label:t,applied:n,hits:o})=>({pluginId:e,label:t,applied:n,hits:o}))}function Zt(){if(mr)return;mr=!0;let e=globalThis,t=e[fr]??[],n=a=>function(...s){try{yr(s[0])}catch(c){H.error("failed to instrument chunk",c)}return a.apply(this??t,s)},o=t.push,i=typeof o=="function"&&o!==Array.prototype.push?n(o.bind(t)):Array.prototype.push.bind(t);try{Object.defineProperty(t,"push",{configurable:!0,get:()=>i,set:a=>{i=n(a)}})}catch(a){H.error("could not install chunk interceptor",a);return}e[fr]=t;for(let a of t)try{yr(a)}catch{}t.push([[Symbol("halcyon.require")],{},a=>{te=a;try{ua(a)}catch(s){H.error("failed to wrap pre-existing factories",s)}}])}function ua(e){let t=e?.m;if(!t||typeof t!="object")return;let n=0,o=0;for(let i of Object.keys(t)){let a=t[i];if(!(typeof a!="function"||a.__halcyon__)){if(e.c&&e.c[i]){o++;continue}t[i]=Sr(i,a),n++}}(n||o)&&H.info(`swept pre-existing factories: wrapped ${n}, skipped ${o} already-executed`)}function _r(){return new Promise(e=>{Zt(),va(t=>ue(t),()=>{Le||(Le=!0,H.info("core runtime detected"),e())}),setTimeout(()=>{Le||(H.warn("core module not seen within grace period; continuing degraded"),Le=!0,e())},15e3)})}function yr(e){let t=e?.[1];if(!(!t||typeof t!="object"))for(let n of Object.keys(t)){let o=t[n];typeof o!="function"||o.__halcyon__||(t[n]=Sr(n,o))}}function Sr(e,t){let n,o=function(i,a,s){if(!n){let c=Xt.filter(l=>ga(l.find,t));n=c.length?ha(e,t,c):t}n.call(this,i,a,s);try{ba(i)}catch(c){H.error("module observer threw for",e,c)}};return o.toString=()=>t.toString(),o.__halcyon__=!0,o}function ha(e,t,n){let o=String(t);for(let i of n){let a=o,s=ma(i.replace,i.pluginId);if(o=i.all?o.replace(new RegExp(i.match.source,fa(i.match.flags)),s):o.replace(i.match,s),o===a){H.warn(`patch "${i.label}" (${i.pluginId}) matched module ${e} but changed nothing`);continue}i.applied=!0,i.hits++,H.debug(`applied patch "${i.label}" (${i.pluginId}) to module ${e}`)}try{return(0,eval)(`(${pa(o)})`)}catch(i){return H.error(`patched module ${e} failed to compile; using original`,i),t}}function pa(e){let t=e.trimStart();if(/^(async\s+)?function[\s*(]/.test(t)||/^(async\s+)?(\([^)]*\)|[\w$]+)\s*=>/.test(t))return t;let n=t.match(/^(async\s+)?(\*\s*)?(?:\[[^\]]*\]|[\w$]+)\s*\(/);if(n){let o=n[1]?"async ":"",i=n[2]?"*":"";return`${o}function${i}${t.slice(n[0].length-1)}`}return t}function fa(e){return e.includes("g")?e:e+"g"}function ma(e,t){let n=`__halcyon_self__(${JSON.stringify(t)})`;return typeof e=="string"?e.split("$self").join(n):(...o)=>e(...o).split("$self").join(n)}function ga(e,t){let n=t.toString();return typeof e=="string"?n.includes(e):e.test(n)}var ya=40;function Qt(e,t,n){try{if(t(e,n))return e}catch{}if(typeof e!="object"&&typeof e!="function")return;let o;try{o=Object.keys(e)}catch{return}if(!(o.length>ya))for(let i of o){let a;try{a=e[i]}catch{continue}if(!(a==null||typeof a!="object"&&typeof a!="function"))try{if(t(a,n))return a}catch{}}}function ba(e){if(!ct.size)return;let t=e.exports;if(t!=null)for(let n of ct){let o=Qt(t,n.filter,{id:e.id,module:e});o!==void 0&&(ct.delete(n),n.resolve(o))}}function D(e){if(te)for(let t of Object.keys(te.c)){let n=te.c[t],o=n?.exports;if(o==null||o===globalThis)continue;let i=Qt(o,e,{id:t,module:n});if(i!==void 0)return i}}function kr(e){let t=[];if(!te)return t;for(let n of Object.keys(te.c)){let o=te.c[n],i=o?.exports;if(i==null||i===globalThis)continue;let a=Qt(i,e,{id:n,module:o});a!==void 0&&t.push(a)}return t}function lt(...e){return D(t=>e.every(n=>t[n]!==void 0))}function xr(...e){return D(t=>{if(typeof t!="function")return!1;let n;try{n=Function.prototype.toString.call(t)}catch{return!1}return e.every(o=>n.includes(o))})}function wr(e){return D(t=>t?.getName?.()===e||t?.constructor?.displayName===e)}function va(e,t){let n=D(e);if(n!==void 0){t(n);return}ct.add({filter:e,resolve:t})}function x(e){let t,n=()=>t??=D(e);return new Proxy({},{get(o,i){let a=n();if(a==null)return;let s=a[i];return typeof s=="function"?s.bind(a):s},has(o,i){let a=n();return a!=null&&i in a}})}function Er(){return Le}function ue(e){return e!=null&&typeof e.dispatch=="function"&&typeof e.subscribe=="function"&&(typeof e._actionHandlers<"u"||typeof e._subscriptions<"u"||typeof e._waitQueue<"u"||typeof e.isDispatching=="function"||typeof e.wait=="function")}function dt(e,t=300){let n=te?.m;if(!n)return"<webpack require not ready \u2014 open the target UI first>";let o=[];for(let i of Object.keys(n)){let a;try{a=String(n[i])}catch{continue}if(!a.includes(e))continue;let s=[],c=a.indexOf(e),l=0;for(;c>=0&&l<4;)s.push(a.slice(Math.max(0,c-t),c+e.length+t)),c=a.indexOf(e,c+e.length),l++;o.push(`===== module ${i} (${l} hit${l===1?"":"s"}) =====
${s.join(`
  ...  
`)}`)}return o.length?o.join(`

`):`<no loaded factory contains "${e}">`}function Ir(){let e=F(),t={embedRendered:typeof document<"u"&&!!document.querySelector(".hc-embed"),halcyonMounted:typeof document<"u"&&!!document.querySelector(".halcyon")};try{let n=null,o=document.querySelectorAll("*");for(let p=0;p<o.length&&!n;p++){let b=o[p],k=Object.keys(b).find(L=>L.startsWith("__reactFiber$"));k&&(n=b[k])}if(!n)return JSON.stringify({error:"no React fiber found in DOM",patches:e,dom:t},null,2);let i=n;for(;i.return;)i=i.return;let a=p=>{try{if(typeof p=="function")return Function.prototype.toString.call(p);if(p&&typeof p=="object"){let b=p.type||p.render;if(typeof b=="function")return Function.prototype.toString.call(b)}}catch{}return""},s=p=>p&&(p.displayName||p.name)||p&&p.type&&(p.type.displayName||p.type.name)||"",c=[i],l=0,d=[],u=[],h=new Set,y=new Set;for(;c.length&&l<4e4;){let p=c.shift();l++;let b=p.type;if(b&&(typeof b=="function"||typeof b=="object")){let k=a(b),L=s(b)||"anon",rt=k.includes("__halcyon_self__");k.includes("buildLayout")&&d.push({name:L,patched:rt}),k.includes("getPredicateSections")&&u.push({name:L,patched:rt}),(k.includes("renderSidebar")||k.includes("SETTINGS_SIDEBAR"))&&h.add(L),/settings/i.test(L)&&y.add(L)}p.child&&c.push(p.child),p.sibling&&c.push(p.sibling)}let $=e.find(p=>p.label==="user-settings-layout"),j=e.find(p=>p.label==="user-settings-sidebar"),G=t.embedRendered?"embed rendered \u2014 Halcyon section is on screen":$?.applied||j?.applied?"patch applied at load but section not seen \u2014 open user settings, then re-run":"no settings patch matched this build \u2014 run dumpSource('buildLayout') and share the output";return JSON.stringify({verdict:G,dom:t,patches:e,walked:l,buildLayoutHits:d,gpsHits:u,sidebarComps:[...h].slice(0,25),settingsNamed:[...y].slice(0,40)},null,2)}catch(n){return JSON.stringify({error:String(n),patches:e,dom:t},null,2)}}function Nr(e){let t,n=()=>t??=e();return new Proxy(function(){},{get:(o,i)=>n()?.[i],set:(o,i,a)=>{let s=n();return s&&(s[i]=a),!0},has:(o,i)=>{let a=n();return a!=null&&i in a},ownKeys:()=>Reflect.ownKeys(n()??{}),getOwnPropertyDescriptor:(o,i)=>Reflect.getOwnPropertyDescriptor(n()??{},i),apply:(o,i,a)=>n().apply(i,a),construct:(o,i)=>new(n())(...i)})}function De(...e){return t=>e.every(n=>typeof t[n]=="function")&&typeof t.__halcyon_probe__>"u"}var r=Nr(()=>D(De("createElement","useState","useEffect","useMemo"))),ut=Nr(()=>D(De("createPortal","flushSync"))??D(De("createPortal")));function _a(){let e=D(De("createRoot","hydrateRoot"))??D(De("createRoot"));return e?.createRoot?.bind(e)}function ht(e,t){let n=_a();if(n){let o=n(t);return o.render(e),()=>{try{o.unmount()}catch{}}}return ut.render(e,t),()=>{try{ut.unmountComponentAtNode(t)}catch{}}}var m=(...e)=>r.useState(...e),A=(...e)=>r.useEffect(...e),Cr=(...e)=>r.useMemo(...e);var he=(...e)=>r.useRef(...e);var Sa="halcyon:ext:main",ka="halcyon:ext:bridge",Oe=new Map,Rt=!1,Ar,xa=0,pt=new Map,Tr=new Promise(e=>{Ar=e});function Mr(){Rt||(Rt=!0,Ar())}function ze(e,t){try{window.postMessage({channel:Sa,kind:e,...t},"*")}catch{}}window.addEventListener("message",e=>{if(e.source!==window)return;let t=e.data;if(!(!t||t.channel!==ka)){if(t.kind==="hydrate"&&t.entries&&typeof t.entries=="object"){for(let[n,o]of Object.entries(t.entries))typeof o=="string"&&Oe.set(n,o);Mr()}else if(t.kind==="fetch-result"&&typeof t.id=="number"){let n=pt.get(t.id);n&&(pt.delete(t.id),n(typeof t.text=="string"?t.text:null))}}});var wa={read:e=>Oe.has(e)?Oe.get(e):null,write:(e,t)=>{Oe.set(e,t),ze("write",{key:e,value:t})},remove:e=>{Oe.delete(e),ze("remove",{key:e})}},Pr=globalThis.HalcyonNative??={};Pr.storage=wa;Pr.fetchText=e=>new Promise(t=>{let n=++xa;pt.set(n,t),ze("fetch",{id:n,url:e}),setTimeout(()=>{pt.delete(n)&&t(null)},8e3)});ze("hydrate");setTimeout(()=>{Rt||ze("hydrate")},120);setTimeout(Mr,2e3);var nn=g("settings"),en="halcyon:";function Ea(){let e=globalThis.HalcyonNative?.storage;if(e&&typeof e.read=="function"&&typeof e.write=="function")return e;try{let n=globalThis.localStorage;if(n)return{read:o=>n.getItem(o),write:(o,i)=>n.setItem(o,i),remove:o=>n.removeItem(o)}}catch{}nn.warn("no persistent storage backend; settings will not survive a restart");let t=new Map;return{read:n=>t.get(n)??null,write:(n,o)=>void t.set(n,o),remove:n=>void t.delete(n)}}var tn=Ea();function pe(e){let t=tn.read(en+e);if(!t)return{};try{let n=JSON.parse(t);return n&&typeof n=="object"?n:{}}catch{let n=new Date().toISOString().replace(/[:.]/g,"-");try{tn.write(`${en}${e}.corrupt-${n}`,t)}catch{}return nn.warn(`stored settings for "${e}" were unreadable; reset to defaults (backup kept)`),{}}}function Se(e,t){try{tn.write(en+e,JSON.stringify(t))}catch(n){nn.error(`could not persist settings for "${e}"`,n)}}var _e;try{_e=globalThis.localStorage}catch{_e=void 0}var $r="halcyon:hint:";function Lr(e){try{if(!_e)return;let t=_e.getItem($r+e);if(!t)return;let n=JSON.parse(t);return n&&typeof n=="object"?n:void 0}catch{return}}function rn(e,t){try{if(!_e)return;_e.setItem($r+e,JSON.stringify(t))}catch{}}var ne=g("runtime"),ke="core.enabled",on=class{records=new Map;enabledMap={};bootPatched=new Set;listeners=new Set;prepared=!1;booted=!1;register(t){if(this.records.has(t.id)){ne.warn(`duplicate plugin id "${t.id}" ignored`);return}this.records.set(t.id,{plugin:t,state:"disabled"}),t.settings?.__bind(t.id)}registerAll(t){for(let n of t)this.register(n)}prepare(){if(this.prepared)return;this.prepared=!0,br(o=>this.records.get(o)?.plugin);let t=Lr(ke)??{},n=pe(ke)??{};this.enabledMap={...t,...n},this.registerBootPatches(),Zt()}async boot(){if(this.booted)return;this.booted=!0,this.prepare(),this.enabledMap=pe(ke)??{},rn(ke,this.enabledMap);for(let{plugin:n}of this.records.values())n.settings?.__bind(n.id);this.registerBootPatches(),await _r();for(let n of this.startOrder())this.shouldRun(n)&&this.startPlugin(n);this.emit(),ne.info(`runtime up \u2014 ${this.runningCount()} plugin(s) active (build 2026-07-22 15:30:19)`)}isEnabled(t){let n=this.records.get(t);return n?n.plugin.required?!0:this.enabledMap[t]===!0:!1}enable(t){let n=this.records.get(t);if(n){for(let o of n.plugin.dependencies??[])this.isEnabled(o)||this.enable(o);this.enabledMap[t]=!0,this.persistEnabledState(),this.booted&&Er()&&this.startPlugin(t),this.emit()}}disable(t){let n=this.records.get(t);if(n){if(n.plugin.required){ne.warn(`"${t}" is required and cannot be disabled`);return}for(let[o,i]of this.records)i.plugin.dependencies?.includes(t)&&this.isEnabled(o)&&this.disable(o);this.enabledMap[t]=!1,this.persistEnabledState(),this.stopPlugin(t),this.emit()}}toggle(t){return this.isEnabled(t)?(this.disable(t),!1):(this.enable(t),!0)}needsRestart(t){return this.records.get(t)?.plugin.patches?.length?this.isEnabled(t)!==this.bootPatched.has(t):!1}getPlugin(t){return this.records.get(t)?.plugin}list(){return[...this.records.values()].map(({plugin:t,state:n,error:o})=>({id:t.id,name:t.name,description:t.description,category:t.category,authors:t.authors,required:t.required??!1,hidden:t.hidden??!1,enabled:this.isEnabled(t.id),state:n,error:o,hasSettings:t.settings!=null,hasPage:t.page!=null,needsRestart:this.needsRestart(t.id)}))}onChange(t){return this.listeners.add(t),()=>this.listeners.delete(t)}shouldRun(t){if(!this.isEnabled(t))return!1;let n=this.records.get(t);return n?(n.plugin.dependencies??[]).every(o=>this.isEnabled(o)):!1}registerBootPatches(){for(let{plugin:t}of this.records.values())this.shouldRun(t.id)&&t.patches?.length&&!this.bootPatched.has(t.id)&&(this.registerPatches(t),this.bootPatched.add(t.id))}registerPatches(t){for(let n of t.patches??[]){let o=Array.isArray(n.replacement)?n.replacement:[n.replacement];for(let i of o)vr({pluginId:t.id,label:n.label,find:n.find,match:i.match,replace:i.replace,all:n.all??!1})}}startPlugin(t){let n=this.records.get(t);if(!(!n||n.state==="running"||n.state==="starting")){n.state="starting";try{n.plugin.start?.(),n.state="running",n.error=void 0,ne.debug(`started "${t}"`)}catch(o){n.state="errored",n.error=o,this.enabledMap[t]=!1,this.persistEnabledState(),ne.error(`plugin "${t}" threw during start; it has been disabled`,o)}this.emit()}}stopPlugin(t){let n=this.records.get(t);if(!(!n||n.state!=="running"&&n.state!=="errored")){n.state="stopping";try{n.plugin.stop?.(),ne.debug(`stopped "${t}"`)}catch(o){ne.error(`plugin "${t}" threw during stop; state may be inconsistent`,o)}finally{n.state="disabled",this.emit()}}}startOrder(){let t=[],n=new Set,o=(i,a)=>{if(n.has(i))return;if(a.has(i)){ne.error(`dependency cycle involving "${i}"; breaking it`);return}a.add(i);let s=this.records.get(i);for(let c of s?.plugin.dependencies??[])this.records.has(c)&&o(c,a);a.delete(i),n.add(i),t.push(i)};for(let i of this.records.keys())o(i,new Set);return t}runningCount(){let t=0;for(let n of this.records.values())n.state==="running"&&t++;return t}persistEnabledState(){Se(ke,this.enabledMap),rn(ke,this.enabledMap)}emit(){for(let t of this.listeners)try{t()}catch{}}},O=new on;var Ia=Symbol.for("halcyon.plugin"),Na=/^[a-z0-9]+(?:-[a-z0-9]+)*$/;function T(e){if(!Na.test(e.id))throw new Error(`Halcyon: invalid plugin id "${e.id}" \u2014 use lowercase words separated by single dashes.`);if(!e.authors?.length)throw new Error(`Halcyon: plugin "${e.id}" must list at least one author.`);return Object.assign(e,{[Ia]:!0})}var Dr=`/*
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
`;var Or=`/*
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
  width: min(900px, 92vw);
  height: min(720px, 88vh);
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
  background: var(--background-secondary, #313338);
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
}
.hc-cleaner__actions .hc-btn {
  flex: 1;
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
}
.hc-cleaner__item {
  display: flex;
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
`;var zr="halcyon-styles",jr=!1;function K(){if(jr)return;let e=document.getElementById(zr),t=e instanceof HTMLStyleElement?e:document.createElement("style");t.id=zr,t.textContent=`${Dr}
${Or}`,e||document.head.appendChild(t),jr=!0}function w({size:e=20,className:t,filled:n,children:o,...i}){let a=i["aria-label"];return(typeof e!="number"||!Number.isFinite(e))&&(e=20),r.createElement("svg",{className:t,width:e,height:e,viewBox:"0 0 24 24",fill:n?"currentColor":"none",stroke:n?"none":"currentColor",strokeWidth:1.5,strokeLinecap:"round",strokeLinejoin:"round",role:a?"img":void 0,"aria-label":a,"aria-hidden":a?void 0:!0},o)}function ft(e){return r.createElement(w,{...e},r.createElement("rect",{x:"3.25",y:"3.25",width:"17.5",height:"17.5",rx:"5"}),r.createElement("path",{d:"M6.5 13.2c1.4-2.5 2.9-2.5 4.3 0s2.9 2.5 4.3 0 2.9-2.5 2.9-2.5"}))}function mt(e){return r.createElement(w,{...e},r.createElement("path",{d:"M9 6l6 6-6 6"}))}function Br(e){return r.createElement(w,{...e},r.createElement("circle",{cx:"12",cy:"12",r:"8.25"}),r.createElement("path",{d:"M12 7.5V12l3 2"}))}function Y(e){return r.createElement(w,{...e},r.createElement("path",{d:"M4.5 7h15"}),r.createElement("path",{d:"M9.25 7V5.5A1.5 1.5 0 0110.75 4h2.5A1.5 1.5 0 0114.75 5.5V7"}),r.createElement("path",{d:"M6.5 7l.85 11.1A2 2 0 009.34 20h5.32a2 2 0 001.99-1.9L17.5 7"}),r.createElement("path",{d:"M10 11v5.5M14 11v5.5"}))}function an(e){return r.createElement(w,{...e},r.createElement("path",{d:"M13.5 6.5l4 4"}),r.createElement("path",{d:"M4.5 19.5l1-4L15.5 5.5a2 2 0 013 3L8.5 18.5l-4 1z"}))}function Ur(e){return r.createElement(w,{...e},r.createElement("path",{d:"M12 3.5l7 2.6v5c0 4.4-3 7.3-7 8.9-4-1.6-7-4.5-7-8.9v-5l7-2.6z"}),r.createElement("path",{d:"M9 12l2 2 4-4"}))}function Gr(e){return r.createElement(w,{...e},r.createElement("path",{d:"M5 5.5h14a1.5 1.5 0 011.5 1.5v8a1.5 1.5 0 01-1.5 1.5H9.5L5.5 20v-3H5A1.5 1.5 0 013.5 15.5V7A1.5 1.5 0 015 5.5z"}))}function xe(e){return r.createElement(w,{...e},r.createElement("circle",{cx:"11",cy:"11",r:"6.25"}),r.createElement("path",{d:"M20 20l-3.8-3.8"}))}function Hr(e){return r.createElement(w,{...e},r.createElement("path",{d:"M6.5 6.5l11 11M17.5 6.5l-11 11"}))}function je(e){return r.createElement(w,{...e},r.createElement("path",{d:"M5 5.5h14a1.5 1.5 0 011.5 1.5v8a1.5 1.5 0 01-1.5 1.5H9.5L5.5 20v-3H5A1.5 1.5 0 013.5 15.5V7A1.5 1.5 0 015 5.5z"}),r.createElement("path",{d:"M8.5 11l2.25 2.25L15.5 8.5"}))}function we(e){return r.createElement(w,{...e},r.createElement("path",{d:"M4.5 8h9M17 8h2.5M4.5 16h2.5M10.5 16h9"}),r.createElement("circle",{cx:"15",cy:"8",r:"2.25"}),r.createElement("circle",{cx:"9",cy:"16",r:"2.25"}))}function Fr(e){return r.createElement(w,{...e},r.createElement("path",{d:"M4.5 9.5v5H7l4.5 3.5V6L7 9.5H4.5z"}),r.createElement("path",{d:"M15 9a4 4 0 010 6"}),r.createElement("path",{d:"M17.5 6.5a7.5 7.5 0 010 11"}))}function Kr(e){return r.createElement(w,{...e},r.createElement("circle",{cx:"12",cy:"12",r:"8.25"}),r.createElement("path",{d:"M12 3.75a8.25 8.25 0 010 16.5z",fill:"currentColor",stroke:"none"}))}function Vr(e){return r.createElement(w,{...e},r.createElement("path",{d:"M8.5 8L4.5 12l4 4"}),r.createElement("path",{d:"M15.5 8l4 4-4 4"}),r.createElement("path",{d:"M13.5 5.5l-3 13"}))}function Wr(e){return r.createElement(w,{...e,filled:!0},r.createElement("circle",{cx:"5.5",cy:"12",r:"1.6"}),r.createElement("circle",{cx:"12",cy:"12",r:"1.6"}),r.createElement("circle",{cx:"18.5",cy:"12",r:"1.6"}))}function Jr(e){return r.createElement(w,{...e},r.createElement("path",{d:"M12 4v10"}),r.createElement("path",{d:"M8 10.5l4 4 4-4"}),r.createElement("path",{d:"M5 19.5h14"}))}function gt(e){return r.createElement(w,{...e},r.createElement("path",{d:"M12 5v14M5 12h14"}))}function Ee(e){return r.createElement(w,{...e},r.createElement("circle",{cx:"12",cy:"12",r:"8.25"}),r.createElement("path",{d:"M12 11v5"}),r.createElement("path",{d:"M12 7.75h.01"}))}function re(e){return r.createElement(w,{...e},r.createElement("path",{d:"M12 4.5L3.5 19h17L12 4.5z"}),r.createElement("path",{d:"M12 10v4"}),r.createElement("path",{d:"M12 16.75h.01"}))}function oe(e){return r.createElement(w,{...e},r.createElement("path",{d:"M8.5 7h11M8.5 12h11M8.5 17h11"}),r.createElement("path",{d:"M4.5 7h.01M4.5 12h.01M4.5 17h.01"}))}function qr(e){return r.createElement(w,{...e},r.createElement("path",{d:"M5 12h14"}))}function fe(e){return r.createElement(w,{...e},r.createElement("path",{d:"M19 8.5a7.5 7.5 0 10.9 6"}),r.createElement("path",{d:"M19 4v4.5h-4.5"}))}function Yr(e){return r.createElement(w,{...e},r.createElement("path",{d:"M15 6l-6 6 6 6"}))}function yt(e){return r.createElement(w,{...e},r.createElement("rect",{x:"4",y:"4",width:"16",height:"6",rx:"2"}),r.createElement("rect",{x:"4",y:"14",width:"16",height:"6",rx:"2"}),r.createElement("path",{d:"M8 7h.01M8 17h.01"}))}function Xr(e){return r.createElement(w,{...e},r.createElement("circle",{cx:"12",cy:"12",r:"2"}),r.createElement("path",{d:"M8.5 8.5a5 5 0 000 7M15.5 8.5a5 5 0 010 7"}),r.createElement("path",{d:"M6 6a9 9 0 000 12M18 6a9 9 0 010 12"}))}function B({checked:e,onChange:t,disabled:n,...o}){return r.createElement("button",{type:"button",role:"switch","aria-checked":e,"aria-label":o["aria-label"],className:"hc-toggle","data-on":e,disabled:n,onClick:()=>{n||t(!e)}},r.createElement("span",{className:"hc-toggle__knob"}))}function Zr({icon:e,iconBackground:t,title:n,subtitle:o,accessory:i,onClick:a,showChevron:s}){let c=typeof a=="function";return r.createElement("div",{className:c?"hc-row hc-row--button":"hc-row",onClick:a,role:c?"button":void 0,tabIndex:c?0:void 0,onKeyDown:c?l=>{(l.key==="Enter"||l.key===" ")&&(l.preventDefault(),a?.())}:void 0},e&&r.createElement("div",{className:"hc-row__icon",style:t?{background:t}:void 0},e),r.createElement("div",{className:"hc-row__text"},r.createElement("div",{className:"hc-row__title"},n),o!=null&&o!==!1&&r.createElement("div",{className:"hc-row__subtitle"},o)),i!=null&&i!==!1&&r.createElement("div",{className:"hc-row__accessory"},i),s&&r.createElement(mt,{size:20,className:"hc-row__chevron"}))}function me({tone:e="neutral",children:t}){return r.createElement("span",{className:"hc-badge","data-tone":e},t)}function V({icon:e,title:t,subtitle:n,action:o}){return r.createElement("div",{className:"hc-empty"},e,r.createElement("div",{className:"hc-empty__title"},t),n&&r.createElement("div",{className:"hc-empty__subtitle"},n),o&&r.createElement("div",{style:{marginTop:"var(--hc-space-5)"}},o))}function Qr(e,t,n){return t!=null&&e<t?t:n!=null&&e>n?n:e}function Rr({value:e,onChange:t,min:n,max:o,step:i=1}){let a=n!=null&&e<=n,s=o!=null&&e>=o;return r.createElement("div",{className:"hc-stepper"},r.createElement("button",{type:"button",className:"hc-stepper__btn",onClick:()=>t(Qr(e-i,n,o)),disabled:a,"aria-label":"\u51CF\u5C11"},r.createElement(qr,{size:16})),r.createElement("span",{className:"hc-stepper__value"},e),r.createElement("button",{type:"button",className:"hc-stepper__btn",onClick:()=>t(Qr(e+i,n,o)),disabled:s,"aria-label":"\u589E\u52A0"},r.createElement(gt,{size:16})))}function X({value:e,onChange:t,className:n,...o}){return r.createElement("input",{className:n?`hc-input ${n}`:"hc-input",value:e,onChange:i=>t(i.currentTarget.value),...o})}function bt({value:e,options:t,onChange:n,...o}){let[i,a]=m(!1),[s,c]=m(-1),l=he(null),d=he(null),[u,h]=m(null),y=t.find(p=>p.value===e);A(()=>{if(!i)return;let p=b=>{let k=b.target;l.current?.contains(k)||d.current?.contains(k)||a(!1)};return document.addEventListener("pointerdown",p,!0),()=>document.removeEventListener("pointerdown",p,!0)},[i]),A(()=>{if(!i)return;let p=b=>{d.current&&b.target instanceof Node&&d.current.contains(b.target)||a(!1)};return window.addEventListener("scroll",p,!0),window.addEventListener("resize",p),()=>{window.removeEventListener("scroll",p,!0),window.removeEventListener("resize",p)}},[i]);let $=()=>{let p=l.current?.getBoundingClientRect();if(p){let b=Math.min(280,t.length*36+10),k=p.bottom+6,L=k+b>window.innerHeight-8?Math.max(8,p.top-6-b):k;h({top:L,right:Math.max(8,window.innerWidth-p.right),width:p.width})}c(Math.max(0,t.findIndex(b=>b.value===e))),a(!0)},j=p=>{a(!1),p!==e&&n(p)},G=p=>{if(!i){(p.key==="Enter"||p.key===" "||p.key==="ArrowDown")&&(p.preventDefault(),$());return}p.key==="Escape"?(p.preventDefault(),a(!1)):p.key==="ArrowDown"?(p.preventDefault(),c(b=>Math.min(t.length-1,b+1))):p.key==="ArrowUp"?(p.preventDefault(),c(b=>Math.max(0,b-1))):p.key==="Enter"||p.key===" "?(p.preventDefault(),s>=0&&s<t.length&&j(t[s].value)):p.key==="Tab"&&a(!1)};return r.createElement("div",{className:"hc-select",ref:l,onKeyDown:G},r.createElement("button",{type:"button",className:"hc-select__button","aria-haspopup":"listbox","aria-expanded":i,"aria-label":o["aria-label"],onClick:()=>i?a(!1):$()},r.createElement("span",{className:"hc-select__value"},y?.label??e),r.createElement("svg",{className:"hc-select__chevron",width:"12",height:"12",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:2.5,strokeLinecap:"round",strokeLinejoin:"round","aria-hidden":!0,"data-open":i},r.createElement("path",{d:"M6 9l6 6 6-6"}))),i&&u&&ut.createPortal(r.createElement("div",{className:"halcyon",ref:d,style:{position:"fixed",top:u.top,right:u.right,zIndex:1e4},onKeyDown:G},r.createElement("div",{className:"hc-select__menu",role:"listbox",style:{minWidth:u.width}},t.map((p,b)=>r.createElement("button",{type:"button",key:p.value,role:"option","aria-selected":p.value===e,className:"hc-select__option","data-active":b===s,"data-selected":p.value===e,onPointerEnter:()=>c(b),onClick:()=>j(p.value)},r.createElement("span",{className:"hc-select__optlabel"},p.label),p.value===e&&r.createElement("svg",{className:"hc-select__check",width:"14",height:"14",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:2.5,strokeLinecap:"round",strokeLinejoin:"round","aria-hidden":!0},r.createElement("path",{d:"M5 12.5l4.5 4.5L19 7"})))))),document.body))}function eo({value:e,onChange:t,itemPlaceholder:n}){let[o,i]=m(""),a=()=>{let c=o.trim();if(!c||e.includes(c)){i("");return}t([...e,c]),i("")},s=c=>{t(e.filter((l,d)=>d!==c))};return r.createElement("div",{className:"hc-strlist"},e.map((c,l)=>r.createElement("div",{className:"hc-strlist__item",key:c},r.createElement(X,{value:c,onChange:()=>{},readOnly:!0}),r.createElement("button",{type:"button",className:"hc-iconbtn hc-iconbtn--danger",onClick:()=>s(l),"aria-label":"\u79FB\u9664"},r.createElement(Y,{size:18})))),r.createElement("div",{className:"hc-strlist__add"},r.createElement(X,{value:o,onChange:i,placeholder:n??"\u6DFB\u52A0\u4E00\u9879",onKeyDown:c=>{c.key==="Enter"&&(c.preventDefault(),a())}}),r.createElement("button",{type:"button",className:"hc-iconbtn",onClick:a,"aria-label":"\u6DFB\u52A0",disabled:!o.trim()},r.createElement(gt,{size:18}))))}function S({variant:e="secondary",size:t="md",icon:n,className:o,children:i,type:a="button",...s}){let c=["hc-btn",`hc-btn--${e}`];return t!=="md"&&c.push(`hc-btn--${t}`),o&&c.push(o),r.createElement("button",{type:a,className:c.join(" "),...s},n,i!=null&&i!==!1&&r.createElement("span",null,i))}function vt(){let[e,t]=m(()=>O.list());return A(()=>{let n=()=>t(O.list());return n(),O.onChange(n)},[]),e}function to(e){let[,t]=m(0);return A(()=>{let n=Object.keys(e.schema).map(o=>e.subscribe(o,()=>t(i=>i+1)));return()=>{for(let o of n)o()}},[e]),e.store}function no(e){return e===null||typeof e!="object"?e:JSON.parse(JSON.stringify(e))}function Ta(e,t){if(e===t)return!0;try{return JSON.stringify(e)===JSON.stringify(t)}catch{return!1}}function ro({settings:e}){let t=to(e),n=Cr(()=>Object.keys(e.schema).filter(d=>!e.schema[d].hidden),[e]),[o,i]=m(()=>sn(t,n));if(A(()=>{i(sn(t,n))},[e]),n.length===0)return null;let a=n.filter(d=>!Ta(o[d],t[d])),s=()=>{for(let d of a)t[d]=no(o[d])},c=()=>i(sn(t,n)),l=[];for(let d of n){let u=e.schema[d].group??"\u8BBE\u7F6E",h=l[l.length-1];h&&h.title===u?h.keys.push(d):l.push({title:u,keys:[d]})}return r.createElement(r.Fragment,null,l.map((d,u)=>r.createElement("div",{className:"hc-section",key:`${d.title}-${u}`},r.createElement("div",{className:"hc-section__title"},d.title),r.createElement("div",{className:"hc-section__body"},d.keys.map(h=>r.createElement(Ma,{key:h,def:e.schema[h],value:o[h],onChange:y=>i($=>({...$,[h]:y}))}))))),a.length>0&&r.createElement("div",{className:"hc-savebar"},r.createElement("span",{className:"hc-savebar__label"},"\u6709 ",a.length," \u9879\u672A\u4FDD\u5B58\u7684\u4FEE\u6539"),r.createElement("div",{className:"hc-savebar__actions"},r.createElement(S,{size:"sm",variant:"plain",onClick:c},"\u653E\u5F03"),r.createElement(S,{size:"sm",variant:"primary",onClick:s},"\u4FDD\u5B58"))))}function sn(e,t){let n={};for(let o of t)n[o]=no(e[o]);return n}function Ma({def:e,value:t,onChange:n}){let o=r.createElement("div",{className:"hc-cell__main"},r.createElement("div",{className:"hc-cell__label"},e.label),e.description&&r.createElement("div",{className:"hc-cell__desc"},e.description));switch(e.type){case"boolean":return r.createElement("div",{className:"hc-cell hc-cell--row"},o,r.createElement(B,{checked:t===!0,onChange:i=>n(i),disabled:e.disabled?.(),"aria-label":e.label}));case"number":return r.createElement("div",{className:"hc-cell hc-cell--row"},o,r.createElement(Rr,{value:typeof t=="number"?t:e.default,onChange:i=>n(i),min:e.min,max:e.max,step:e.step}));case"select":return r.createElement("div",{className:"hc-cell hc-cell--row"},o,r.createElement(bt,{value:typeof t=="string"?t:e.default,onChange:i=>n(i),options:e.options}));case"string":return r.createElement("div",{className:"hc-cell"},r.createElement("div",{className:"hc-cell--row"},o),r.createElement("div",{className:"hc-cell__control"},r.createElement(X,{value:typeof t=="string"?t:"",onChange:i=>n(i),placeholder:e.placeholder,maxLength:e.maxLength})));case"string-list":return r.createElement("div",{className:"hc-cell"},o,r.createElement("div",{className:"hc-cell__control"},r.createElement(eo,{value:Array.isArray(t)?t:[],onChange:i=>n(i),itemPlaceholder:e.itemPlaceholder})));case"custom":{let i=e.component;return r.createElement("div",{className:"hc-cell"},o,r.createElement("div",{className:"hc-cell__control"},r.createElement(i,{value:t,onChange:n})))}default:return null}}var _t={utility:{label:"\u5B9E\u7528\u5DE5\u5177",color:"var(--hc-accent)",Icon:we},chat:{label:"\u804A\u5929",color:"var(--hc-green)",Icon:Gr},voice:{label:"\u8BED\u97F3",color:"var(--hc-indigo)",Icon:Fr},appearance:{label:"\u5916\u89C2",color:"var(--hc-pink)",Icon:Kr},privacy:{label:"\u9690\u79C1",color:"var(--hc-teal)",Icon:Ur},developer:{label:"\u5F00\u53D1\u8005",color:"var(--hc-orange)",Icon:Vr},misc:{label:"\u5176\u4ED6",color:"var(--hc-fill-primary)",Icon:Wr}},oo=["utility","chat","voice","appearance","privacy","developer","misc"];function io(){let e=vt().filter(l=>!l.hidden),[t,n]=m(null),[o,i]=m(""),a=t?e.find(l=>l.id===t):void 0;if(a)return r.createElement($a,{view:a,onBack:()=>n(null)});let s=o.trim().toLowerCase(),c=s?e.filter(l=>l.name.toLowerCase().includes(s)||l.description.toLowerCase().includes(s)):e;return r.createElement("div",null,r.createElement("div",{className:"hc-toolbar"},r.createElement("div",{className:"hc-search"},r.createElement(xe,{size:20}),r.createElement("input",{value:o,onChange:l=>i(l.currentTarget.value),placeholder:"\u641C\u7D22\u63D2\u4EF6","aria-label":"\u641C\u7D22\u63D2\u4EF6"}))),c.length===0?r.createElement(V,{icon:r.createElement(xe,{size:48}),title:"\u6CA1\u6709\u5339\u914D\u7684\u63D2\u4EF6",subtitle:"\u6362\u4E2A\u5173\u952E\u8BCD\u518D\u8BD5\u8BD5\u3002"}):oo.map(l=>{let d=c.filter(h=>h.category===l);if(d.length===0)return null;let u=_t[l];return r.createElement("div",{className:"hc-section",key:l},r.createElement("div",{className:"hc-section__title"},u.label),r.createElement("div",{className:"hc-section__body"},d.map(h=>r.createElement(Pa,{key:h.id,view:h,onOpen:()=>n(h.id)}))))}))}function Pa({view:e,onOpen:t}){let n=_t[e.category],o=n.Icon,i=e.hasSettings||e.hasPage;return r.createElement(Zr,{icon:r.createElement(o,{size:18}),iconBackground:n.color,title:e.name,subtitle:e.description,onClick:i?t:void 0,showChevron:i,accessory:r.createElement(r.Fragment,null,e.needsRestart&&r.createElement(me,{tone:"orange"},r.createElement(fe,{size:12})," \u5F85\u91CD\u542F"),e.state==="errored"&&r.createElement(me,{tone:"red"},r.createElement(re,{size:12})," \u51FA\u9519"),r.createElement("span",{onClick:a=>a.stopPropagation(),onKeyDown:a=>a.stopPropagation()},r.createElement(B,{checked:e.enabled,disabled:e.required,onChange:()=>O.toggle(e.id),"aria-label":`\u542F\u7528 ${e.name}`})))})}function $a({view:e,onBack:t}){let n=O.getPlugin(e.id),o=_t[e.category],i=o.Icon,a=!!(n?.settings&&Object.values(n.settings.schema).some(d=>!d.hidden)),s=!!n?.page&&a,[c,l]=m("page");return r.createElement("div",null,r.createElement("button",{type:"button",className:"hc-back",onClick:t},r.createElement(Yr,{size:20}),"\u63D2\u4EF6"),r.createElement("div",{className:"hc-detail-head"},r.createElement("div",{className:"hc-detail-head__icon",style:{background:o.color}},r.createElement(i,{size:26})),r.createElement("div",{className:"hc-detail-head__text"},r.createElement("div",{className:"hc-detail-head__name"},e.name),r.createElement("div",{className:"hc-detail-head__desc"},e.description),r.createElement("div",{className:"hc-detail-head__meta"},e.authors.map(d=>d.name).join("\u3001"))),r.createElement("span",{onClick:d=>d.stopPropagation(),onKeyDown:d=>d.stopPropagation()},r.createElement(B,{checked:e.enabled,disabled:e.required,onChange:()=>O.toggle(e.id),"aria-label":`\u542F\u7528 ${e.name}`}))),e.needsRestart&&r.createElement("div",{className:"hc-inline-note"},r.createElement(fe,{size:18}),r.createElement("span",null,"\u8FD9\u4E2A\u63D2\u4EF6\u5305\u542B\u52A0\u8F7D\u671F\u8865\u4E01\uFF0C\u9700\u8981\u91CD\u542F Discord \u624D\u80FD\u5B8C\u5168\u751F\u6548\u3002")),e.state==="errored"&&r.createElement("div",{className:"hc-inline-note hc-inline-note--danger"},r.createElement(re,{size:18}),r.createElement("span",null,"\u63D2\u4EF6\u542F\u52A8\u65F6\u629B\u51FA\u5F02\u5E38\uFF0C\u5DF2\u88AB\u81EA\u52A8\u505C\u7528\uFF0C\u8BE6\u60C5\u89C1\u65E5\u5FD7\u3002")),s&&r.createElement("div",{className:"hc-segment"},r.createElement("button",{type:"button",className:"hc-segment__item","data-active":c==="page",onClick:()=>l("page")},n.page.title||"\u8BB0\u5F55"),r.createElement("button",{type:"button",className:"hc-segment__item","data-active":c==="settings",onClick:()=>l("settings")},"\u8BBE\u7F6E")),n?.page&&(!s||c==="page")?r.createElement(n.page.component,null):n?.settings?r.createElement(ro,{settings:n.settings}):r.createElement(V,{title:"\u6CA1\u6709\u53EF\u914D\u7F6E\u9879",subtitle:"\u8FD9\u4E2A\u63D2\u4EF6\u5F00\u7BB1\u5373\u7528\uFF0C\u65E0\u9700\u8BBE\u7F6E\u3002"}))}var ao=500,cn=100;function so(){let[e,t]=m(()=>Yt().slice()),[n,o]=m(0),i=he(null);A(()=>(t(Yt().slice()),pr(d=>{t(u=>{let h=u.concat(d);return h.length>ao?h.slice(h.length-ao):h})})),[]);let a=Math.max(1,Math.ceil(e.length/cn)),s=Math.min(n,a-1),c=e.length-s*cn,l=e.slice(Math.max(0,c-cn),c);return A(()=>{if(s!==0)return;let d=i.current;d&&(d.scrollTop=d.scrollHeight)},[e,s]),e.length===0?r.createElement(V,{icon:r.createElement(oe,{size:48}),title:"\u6682\u65E0\u65E5\u5FD7",subtitle:"\u8FD0\u884C\u65F6\u548C\u63D2\u4EF6\u7684\u8F93\u51FA\u4F1A\u5B9E\u65F6\u51FA\u73B0\u5728\u8FD9\u91CC\u3002"}):r.createElement("div",{className:"hc-stack"},r.createElement("div",{className:"hc-logs",ref:i},l.map((d,u)=>r.createElement("div",{className:"hc-logline","data-level":d.level,key:`${d.time}-${u}`},r.createElement("span",{className:"hc-logline__time"},La(d.time)),r.createElement("span",{className:"hc-logline__scope"},d.scope),r.createElement("span",{className:"hc-logline__msg"},d.parts.map(Da).join(" "))))),a>1&&r.createElement("div",{className:"hc-pager"},r.createElement("button",{type:"button",className:"hc-tab",disabled:s>=a-1,onClick:()=>o(Math.min(a-1,s+1))},"\u2190 \u66F4\u65E9"),r.createElement("span",{className:"hc-pager__label"},s===0?"\u5B9E\u65F6":`\u7B2C ${a-s} / ${a} \u9875`),r.createElement("button",{type:"button",className:"hc-tab",disabled:s===0,onClick:()=>o(Math.max(0,s-1))},"\u66F4\u65B0 \u2192")))}function La(e){let t=new Date(e);return`${t.toLocaleTimeString(void 0,{hour12:!1})}.${String(t.getMilliseconds()).padStart(3,"0")}`}function Da(e){if(typeof e=="string")return e;if(e instanceof Error)return e.stack??e.message;try{return JSON.stringify(e)}catch{return String(e)}}function P({title:e,note:t,children:n}){return r.createElement("div",{className:"hc-section"},e&&r.createElement("div",{className:"hc-section__title"},e),r.createElement("div",{className:"hc-section__body"},n),t&&r.createElement("div",{className:"hc-section__note"},t))}var ln=g("update"),lo="mzrodyu/CatieDiscordTools",Oa=`https://raw.githubusercontent.com/${lo}/main/package.json`,uo=`https://github.com/${lo}`,Ue=null,Be=null;function za(){return"0.3.1"}function ho(){return Ue}function co(e){return String(e).trim().replace(/^v/i,"").split(/[.+-]/).map(t=>parseInt(t,10)).filter(t=>Number.isFinite(t))}function ja(e,t){let n=co(e),o=co(t),i=Math.max(n.length,o.length);for(let a=0;a<i;a++){let s=n[a]??0,c=o[a]??0;if(s!==c)return s>c}return!1}async function Ba(e){let t=globalThis.HalcyonNative;if(t&&typeof t.fetchText=="function")try{let n=await t.fetchText(e);if(typeof n=="string")return n}catch{}try{let n=await fetch(e,{cache:"no-store"});if(n.ok)return await n.text()}catch{}return null}async function po(e=!1){return!e&&Ue&&Ue.status!=="unknown"?Ue:Be||(Be=(async()=>{let t=za(),n=await Ba(Oa),o;if(n==null)o={status:"unknown",current:t,latest:null};else{let i=null;try{let a=JSON.parse(n);i=typeof a?.version=="string"&&a.version?a.version:null}catch{i=null}i?t==="dev"?o={status:"current",current:t,latest:i}:o={status:ja(i,t)?"outdated":"current",current:t,latest:i}:o={status:"unknown",current:t,latest:null}}return o.status==="outdated"?ln.info(`update available: ${o.current} \u2192 ${o.latest}`):o.status==="unknown"?ln.info("could not determine the latest version (CSP or offline) \u2014 skipping notice"):ln.info(`up to date (${o.current})`),Ue=o,Be=null,o})(),Be)}function fo(){let e=vt().filter(a=>!a.hidden),t=e.filter(a=>a.enabled).length,n="0.3.1",[o,i]=r.useState(ho);return r.useEffect(()=>{let a=!0;return po().then(s=>{a&&i(s)}),()=>{a=!1}},[]),r.createElement("div",{className:"hc-stack"},r.createElement("div",{className:"hc-about-hero"},r.createElement(ft,{size:32}),r.createElement("div",null,r.createElement("div",{className:"hc-about-hero__name"},"Halcyon"),r.createElement("div",{className:"hc-about-hero__ver"},"\u7248\u672C ",n,o?.status==="outdated"&&"\uFF0C\u6709\u65B0\u7248\u672C\u53EF\u7528"))),o?.status==="outdated"&&r.createElement(P,{title:"\u66F4\u65B0"},r.createElement("div",{className:"hc-cell hc-cell--row"},r.createElement("div",{className:"hc-cell__main"},r.createElement("div",{className:"hc-cell__label"},"\u53D1\u73B0\u65B0\u7248\u672C ",o.latest)),r.createElement(S,{variant:"primary",size:"sm",onClick:()=>window.open(uo,"_blank","noopener,noreferrer")},"\u524D\u5F80\u4E0B\u8F7D"))),r.createElement(P,{title:"\u6982\u89C8"},r.createElement(St,{label:"\u63D2\u4EF6\u603B\u6570",value:String(e.length)}),r.createElement(St,{label:"\u5DF2\u542F\u7528",value:String(t)})),r.createElement(P,{title:"\u9879\u76EE",note:"\u4FEE\u6539 Discord \u5BA2\u6237\u7AEF\u8FDD\u53CD\u5176\u670D\u52A1\u6761\u6B3E\uFF0C\u7531\u6B64\u4EA7\u751F\u7684\u4EFB\u4F55\u540E\u679C\u7531\u4F7F\u7528\u8005\u81EA\u884C\u627F\u62C5\u3002\u672C\u9879\u76EE\u4EC5\u4F9B\u6280\u672F\u7814\u7A76\u4E0E\u4E2A\u4EBA\u4F7F\u7528\u3002"},r.createElement(St,{label:"\u4F5C\u8005",value:"caitemm (mzrodyu)"}),r.createElement(St,{label:"\u8BB8\u53EF\u534F\u8BAE",value:"GPL-3.0-or-later"})))}function St({label:e,value:t}){return r.createElement("div",{className:"hc-cell hc-cell--row"},r.createElement("div",{className:"hc-cell__main"},r.createElement("div",{className:"hc-cell__label"},e)),r.createElement("span",{className:"hc-about__value"},t))}var dn=[{id:"plugins",label:"\u63D2\u4EF6",title:"\u63D2\u4EF6",Icon:we},{id:"logs",label:"\u65E5\u5FD7",title:"\u65E5\u5FD7",Icon:oe},{id:"about",label:"\u5173\u4E8E",title:"\u5173\u4E8E Halcyon",Icon:Ee}];function mo(e){switch(e){case"plugins":return r.createElement(io,null);case"logs":return r.createElement(so,null);case"about":return r.createElement(fo,null)}}function go({onClose:e}){let[t,n]=m("plugins"),o=dn.find(i=>i.id===t)??dn[0];return r.createElement("div",{className:"halcyon hc-panel"},r.createElement("nav",{className:"hc-panel__sidebar"},r.createElement("div",{className:"hc-panel__brand"},r.createElement(ft,{size:24}),r.createElement("span",{className:"hc-panel__brand-name"},"Halcyon")),dn.map(i=>r.createElement("button",{key:i.id,type:"button",className:"hc-navitem","data-active":i.id===t,onClick:()=>n(i.id)},r.createElement(i.Icon,{size:18}),i.label))),r.createElement("section",{className:"hc-panel__content"},r.createElement("header",{className:"hc-panel__header"},r.createElement("span",{className:"hc-title2"},o.title),e&&r.createElement("button",{type:"button",className:"hc-iconbtn",onClick:e,"aria-label":"\u5173\u95ED"},r.createElement(Hr,{size:20}))),r.createElement("div",{className:"hc-panel__scroll"},mo(t))))}function kt({tab:e}){return r.createElement("div",{className:"halcyon hc-embed"},mo(e))}var Ua=g("settings"),ie=null,xt=null,Ge=null;function wt(){if(K(),!ie){ie=document.createElement("div"),ie.className="halcyon",document.body.appendChild(ie),Ge=e=>{e.key==="Escape"&&Z()},document.addEventListener("keydown",Ge);try{xt=ht(r.createElement(Ga,{onClose:Z}),ie)}catch(e){Ua.error("could not open settings overlay",e),Z()}}}function Z(){Ge&&(document.removeEventListener("keydown",Ge),Ge=null),xt&&(xt(),xt=null),ie&&(ie.remove(),ie=null)}function Ga({onClose:e}){return r.createElement("div",{className:"hc-overlay",role:"dialog","aria-modal":"true","aria-label":"Halcyon \u8BBE\u7F6E",onMouseDown:t=>{t.target===t.currentTarget&&e()}},r.createElement(go,{onClose:e}))}var Q=g("settings-host");function bo(){return r.createElement(kt,{tab:"plugins"})}function vo(){return r.createElement(kt,{tab:"logs"})}function _o(){return r.createElement(kt,{tab:"about"})}function Ha(e){return function(){return r.createElement(e,{size:20})}}var yo="halcyon-section",Fa=[{key:"halcyon-plugins",title:"\u63D2\u4EF6",Component:bo,Icon:we},{key:"halcyon-logs",title:"\u65E5\u5FD7",Component:vo,Icon:oe},{key:"halcyon-about",title:"\u5173\u4E8E",Component:_o,Icon:Ee}],It=!1,Ka=!0,un={SECTION:1,SIDEBAR_ITEM:2,PANEL:3,CATEGORY:5,CUSTOM:20},Et=null;function Va(){if(Et)return Et;try{let e=lt("SECTION","SIDEBAR_ITEM","PANEL","CUSTOM");if(e&&typeof e.SECTION=="number")return Et={SECTION:e.SECTION,SIDEBAR_ITEM:e.SIDEBAR_ITEM,PANEL:e.PANEL,CATEGORY:typeof e.CATEGORY=="number"?e.CATEGORY:un.CATEGORY,CUSTOM:e.CUSTOM},Et}catch(e){Q.warn("could not resolve settings layout types; using fallback values",e)}return un}function ae(e){try{if(e&&typeof e.buildLayout=="function"){let t=e.buildLayout();if(Array.isArray(t))return t}}catch{}return[]}function So(e){let t={...un};try{let n=Array.isArray(e)?e[0]:void 0;n&&typeof n.type=="number"&&(t.SECTION=n.type);for(let o of e)for(let i of ae(o))if(typeof i?.type=="number"){t.SIDEBAR_ITEM=i.type;for(let a of ae(i))if(typeof a?.type=="number"){t.PANEL=a.type;for(let s of ae(a))if(typeof s?.type=="number"){t.CATEGORY=s.type;for(let c of ae(s))if(c&&typeof c.type=="number"&&"Component"in c)return t.CUSTOM=c.type,t}}}}catch(n){Q.warn("could not read layout types from the live tree; using fallbacks",n)}return t}function Wa(e,t){let n={key:`${t.key}-panel`,type:e.PANEL,useTitle:()=>t.title,buildLayout:()=>[{key:`${t.key}-category`,type:e.CATEGORY,buildLayout:()=>[{key:`${t.key}-custom`,type:e.CUSTOM,Component:t.Component,useSearchTerms:()=>[t.title]}]}]};return{key:t.key,type:e.SIDEBAR_ITEM,useTitle:()=>t.title,icon:Ha(t.Icon),buildLayout:()=>[n]}}function He(e){let t={};if(e&&typeof e=="object")for(let n of Object.keys(e)){let o=e[n];typeof o=="function"&&(t[n]=String(o).replace(/\s+/g," ").slice(0,400))}return t}function ko(e,t){if(!e||typeof e!="object")return{raw:typeof e};let n={key:e.key,type:e.type,fields:Object.keys(e)};if(t>0&&typeof e.buildLayout=="function")try{let o=e.buildLayout();Array.isArray(o)&&(n.children=o.slice(0,6).map(i=>ko(i,t-1)))}catch(o){n.childrenError=String(o)}return n}function Ja(e){if(!It){It=!0;try{let t=e[0],n=ae(t)[0],o=ae(n)[0],i=ae(o)[0],a=ae(i)[0],s={resolvedTypesFromEnum:Va(),resolvedTypesFromLive:So(e),topLevelCount:e.length,sampleSources:{section:He(t),sidebarItem:He(n),panel:He(o),category:He(i),leaf:He(a)},layout:e.slice(0,12).map(c=>ko(c,2))};globalThis.__halcyonLayoutProbe=JSON.stringify(s,null,2),Q.info("[embed-probe] captured Discord's settings layout shape. In the console run  copy(__halcyonLayoutProbe)  and paste the result back.")}catch(t){Q.warn("[embed-probe] failed to capture layout shape",t)}}}function qa(){return[{section:"HEADER",label:"HALCYON"},{section:"halcyon-plugins",label:"\u63D2\u4EF6",element:bo},{section:"halcyon-logs",label:"\u65E5\u5FD7",element:vo},{section:"halcyon-about",label:"\u5173\u4E8E",element:_o}]}var Fe=null,xo=T({id:"halcyon-settings",name:"Halcyon \u8BBE\u7F6E",description:"Halcyon \u81EA\u8EAB\u7684\u8BBE\u7F6E\u754C\u9762\u5BBF\u4E3B\u3002",authors:[{name:"caitemm"}],category:"misc",required:!0,hidden:!0,patches:[{label:"user-settings-layout",find:".buildLayout().map",replacement:{match:/([A-Za-z_$][\w$]*)\.buildLayout\(\)(?=\.map)/,replace:"$self.buildLayout($1)"}},{label:"user-settings-sidebar",find:"getPredicateSections",replacement:{match:/getPredicateSections\(\)(\{(?:[^{}]|\{(?:[^{}]|\{[^{}]*\})*\})*\})/,replace:(e,t)=>`getPredicateSections(){return $self.injectSections((()=>${t})())}`}}],buildLayout(e){let t=e.buildLayout();try{if(!e||e.key!=="$Root"||!Array.isArray(t)||(Ja(t),!Ka)||t.some(a=>a?.key===yo))return t;let n=So(t),o={key:yo,type:n.SECTION,useTitle:()=>"HALCYON",buildLayout:()=>Fa.map(a=>Wa(n,a))},i=t.findIndex(a=>a?.key==="billing_section");return i<0&&(i=t.findIndex(a=>a?.key==="user_section")),i<0&&(i=Math.min(2,t.length)),t.splice(i,0,o),Q.info(`native settings embed active \u2014 section inserted at index ${i}/${t.length}`),t}catch(n){return Q.error("failed to inject settings section into layout",n),t}},injectSections(e){try{if(!Array.isArray(e)||e.some(i=>i?.section==="halcyon-plugins"))return e;let t=qa(),n=e.slice(),o=n.findIndex(i=>i&&i.section==="DIVIDER");return o>=0?n.splice(o+1,0,...t):n.push({section:"DIVIDER"},...t),It||(It=!0,Q.info(`native settings embed active (legacy) \u2014 ${e.length} base sections`)),n}catch(t){return Q.error("failed to inject settings sections",t),e}},start(){K(),Fe=e=>{(e.ctrlKey||e.metaKey)&&e.shiftKey&&e.code==="KeyH"&&(e.preventDefault(),wt())},window.addEventListener("keydown",Fe),Q.info("settings host ready \u2014 open with Ctrl/Cmd+Shift+H")},stop(){Fe&&(window.removeEventListener("keydown",Fe),Fe=null),Z()}});var wo=g("context-menu"),Ke=new Map,No=null,Eo=!1;function Ya(){Eo||typeof document>"u"||(Eo=!0,document.addEventListener("contextmenu",e=>{No=e.target??null},!0))}function Co(){return No}var hn=null;function Nt(){return hn}function pn(e){for(let t of e){if(t==null)continue;if(Array.isArray(t)){let i=pn(t);if(i)return i}let n=t.props;if(t.type&&n&&typeof n.id=="string"&&(n.action!=null||n.label!=null||n.render!=null||n.onClick!=null||n.subtext!=null))return t.type;let o=n?.children;if(o){let i=pn(Array.isArray(o)?o:[o]);if(i)return i}}return null}function Ct(e,t){Ya();let n=Array.isArray(e)?e:[e];for(let o of n){let i=Ke.get(o);i||(i=new Set,Ke.set(o,i)),i.add(t)}return()=>{for(let o of n)Ke.get(o)?.delete(t)}}function Ao(e,t){let n=Array.isArray(e)?e:[e];for(let o of n)Ke.get(o)?.delete(t)}function Io(e){return Array.isArray(e)?e.slice():e==null?[]:[e]}function To(e){try{if(!e||typeof e.navId!="string")return e;!hn&&e.children!=null&&(hn=pn(Io(e.children)));let t=Ke.get(e.navId);if(!t||t.size===0)return e;let n={...e,children:Io(e.children)};for(let o of t)try{o(n.children)}catch(i){wo.error(`context-menu patch for "${e.navId}" threw`,i)}return n}catch(t){return wo.error("failed to apply context-menu patches",t),e}}var Mo=T({id:"context-menu-api",name:"\u53F3\u952E\u83DC\u5355 API",description:"\u4E3A\u5176\u4ED6\u63D2\u4EF6\u63D0\u4F9B\u5411 Discord \u53F3\u952E\u83DC\u5355\u6CE8\u5165\u83DC\u5355\u9879\u7684\u80FD\u529B\u3002",authors:[{name:"Vencord"},{name:"caitemm"}],category:"misc",required:!0,hidden:!0,patches:[{label:"context-menu central handler",find:"Menu API only allows Items",replacement:{match:/(?=let\{navId:)(?<=function [A-Za-z_$][\w$]*\(([A-Za-z_$][\w$]*)\).+?)/,replace:"$1=$self._usePatchContextMenu($1);"}}],_usePatchContextMenu(e){return To(e)}});var Ve=g("patcher"),At=Symbol("halcyon.patch");function Xa(e,t){let n=e[t];if(n&&n[At])return n[At];if(typeof n!="function")throw new TypeError(`cannot patch "${t}": not a function`);let o={before:new Set,instead:new Set,after:new Set,original:n},i=function(...a){let s={args:a,result:void 0,self:this,callOriginal:()=>o.original.apply(this,s.args)};for(let c of o.before)try{c(s)}catch(l){Ve.error(`before-hook on "${t}" threw`,l)}if(o.instead.size){let c,l=!1;for(let d of o.instead)try{c=d(s),l=!0}catch(u){Ve.error(`instead-hook on "${t}" threw; falling back to original`,u),c=s.callOriginal(),l=!0}s.result=l?c:s.callOriginal()}else try{s.result=o.original.apply(this,s.args)}catch(c){throw c}for(let c of o.after)try{c(s)}catch(l){Ve.error(`after-hook on "${t}" threw`,l)}return s.result};return Object.defineProperty(i,"name",{value:n.name,configurable:!0}),Object.defineProperty(i,"length",{value:n.length,configurable:!0}),i.toString=()=>o.original.toString(),i[At]=o,Object.assign(i,n),e[t]=i,o}function Za(e,t,n){n.before.size||n.instead.size||n.after.size||e[t]&&e[t][At]===n&&(e[t]=n.original)}function fn(e,t,n,o){if(t==null)return Ve.error(`refusing to patch "${n}" on a null target`),()=>{};let i;try{i=Xa(t,n)}catch(s){return Ve.error(s),()=>{}}i[e].add(o);let a=!0;return()=>{a&&(a=!1,i[e].delete(o),Za(t,n,i))}}var ge={before(e,t,n){return fn("before",e,t,n)},after(e,t,n){return fn("after",e,t,n)},instead(e,t,n){return fn("instead",e,t,n)}};var hu=x(ue);function W(){for(let e of[U,ye,Ne])try{let t=e?._dispatcher;if(ue(t))return t}catch{}return D(ue)}var Po=x(e=>typeof e?.getMessage=="function"&&typeof e?.getMessages=="function"),pu=x(e=>typeof e?.editMessage=="function"&&typeof e?.deleteMessage=="function"),Ie=x(e=>e?.getName?.()==="UserStore"||typeof e?.getCurrentUser=="function"&&typeof e?.getUser=="function"&&typeof e?.__halcyon_probe__>"u"),ye=x(e=>e?.getName?.()==="ChannelStore"||e?.constructor?.displayName==="ChannelStore"),$o=x(e=>typeof e?.getChannelId=="function"&&typeof e?.getLastSelectedChannelId=="function"),U=x(e=>e?.getName?.()==="GuildStore"||e?.constructor?.displayName==="GuildStore"),We=x(e=>e?.getName?.()==="GuildChannelStore"),mn=x(e=>typeof e?.subscribeToGuild=="function"||typeof e?.subscribeToChannel=="function"),fu=x(e=>typeof e=="function"&&typeof e?.locale=="function"&&typeof e?.utc=="function"),gn=x(e=>typeof e?.transitionTo=="function"&&typeof e?.replaceWith=="function"&&typeof e?.transitionToGuild=="function"),yn=x(e=>typeof e?.popLayer=="function"&&typeof e?.pushLayer=="function"),Tt=x(e=>typeof e=="object"&&typeof e?.del=="function"&&typeof e?.put=="function"&&typeof e?.__halcyon_probe__>"u"),Mt=x(e=>e?.getName?.()==="PermissionStore"&&typeof e?.can=="function"),bn=x(e=>e?.getName?.()==="EmojiStore"),Lo=x(e=>typeof e?.Endpoints?.GUILD_STICKER_PACKS=="function"),Do=x(e=>e?.getName?.()==="StickersStore"),Ne=x(e=>e?.getName?.()==="ReadStateStore"),vn=x(e=>e?.getName?.()==="ActiveJoinedThreadsStore"),Qa=x(e=>typeof e?.showToast=="function"&&typeof e?.createToast=="function"&&typeof e?.__halcyon_probe__>"u");function se(e,t="info"){try{let n=Qa,o=n?.Type??{},i=t==="success"?o.SUCCESS??1:t==="failure"?o.FAILURE??2:o.MESSAGE??o.INFO??0;typeof n?.showToast=="function"&&typeof n?.createToast=="function"&&n.showToast(n.createToast(e,i))}catch{}}var Oo=g("settings");function _n(e){return e===null||typeof e!="object"?e:JSON.parse(JSON.stringify(e))}function z(e){let t=new Map,n=null,o={};for(let c of Object.keys(e))o[c]=_n(e[c].default);let i=()=>{n&&Se(n,o)},a=(c,l,d)=>{let u=t.get(c);if(u)for(let h of u)try{h(l,d)}catch(y){Oo.error(`settings listener for "${c}" threw`,y)}},s=new Proxy(o,{get:(c,l)=>c[l],set:(c,l,d)=>{if(!(l in e))return Oo.warn(`ignoring write to unknown setting "${l}"`),!0;let u=c[l];return Object.is(u,d)||(c[l]=d,i(),a(l,d,u)),!0}});return{schema:e,store:s,subscribe(c,l){let d=c,u=t.get(d);return u||(u=new Set,t.set(d,u)),u.add(l),()=>void u.delete(l)},reset(c){if(c!=null){s[c]=_n(e[c].default);return}for(let l of Object.keys(e))s[l]=_n(e[l].default)},__bind(c){n=c;let l=pe(c);for(let d of Object.keys(e))Object.prototype.hasOwnProperty.call(l,d)&&(o[d]=l[d])}}}var M=z({keepDeletedInChat:{group:"\u8BB0\u5F55",type:"boolean",default:!0,label:"\u5728\u804A\u5929\u4E2D\u4FDD\u7559\u88AB\u5220\u6D88\u606F",description:"\u88AB\u5220\u9664\u7684\u6D88\u606F\u4E0D\u518D\u6D88\u5931\uFF0C\u800C\u662F\u6807\u8BB0\u4FDD\u7559\u5728\u539F\u4F4D\u3002\u9700\u8981\u5BA2\u6237\u7AEF\u8865\u4E01\u751F\u6548\u3002"},logEdits:{group:"\u8BB0\u5F55",type:"boolean",default:!0,label:"\u8BB0\u5F55\u7F16\u8F91\u5386\u53F2",description:"\u4FDD\u5B58\u6BCF\u6761\u6D88\u606F\u88AB\u7F16\u8F91\u524D\u7684\u5185\u5BB9\u3002"},retention:{group:"\u8BB0\u5F55",type:"number",default:50,label:"\u6BCF\u9891\u9053\u4FDD\u7559\u6761\u6570",description:"0 \u8868\u793A\u4E0D\u9650\u5236\u3002\u4E0A\u9650 500\u3002",min:0,max:500,step:10},deleteStyle:{group:"\u5916\u89C2",type:"select",default:"tint",label:"\u5220\u9664 / \u7F16\u8F91\u6837\u5F0F",description:"\u88AB\u5220\u6D88\u606F\u3001\u4EE5\u53CA\u7F16\u8F91\u6D88\u606F\u4E0A\u65B9\u65E7\u7248\u672C\u5185\u5BB9\u5728\u804A\u5929\u4E2D\u7684\u5448\u73B0\u65B9\u5F0F\u3002",options:[{value:"tint",label:"\u7EA2\u8272\u5E95\u7EB9 + \u5DE6\u4FA7\u7EA2\u6761"},{value:"text",label:"\u6B63\u6587\u53D8\u7EA2"},{value:"ghost",label:"\u534A\u900F\u660E\u6DE1\u51FA"},{value:"strike",label:"\u7EA2\u8272\u5220\u9664\u7EBF"}]},showDeletedMarker:{group:"\u5916\u89C2",type:"boolean",default:!0,label:"\u663E\u793A\u5220\u9664\u6807\u8BB0\u884C",description:"\u5728\u88AB\u5220\u6D88\u606F\u4E0B\u65B9\u663E\u793A\u201C\u6B64\u6D88\u606F\u5DF2\u5220\u9664\u201D\u4E0E\u5220\u9664\u65F6\u95F4\u3002"},showEditedMarker:{group:"\u5916\u89C2",type:"boolean",default:!0,label:"\u663E\u793A\u7F16\u8F91\u6807\u8BB0\u884C",description:"\u5728\u7F16\u8F91\u8FC7\u7684\u6D88\u606F\u65C1\u663E\u793A\u201C\u6B64\u6D88\u606F\u5DF2\u7F16\u8F91\u201D\u4E0E\u7F16\u8F91\u65F6\u95F4\uFF08\u6CBF\u7528\u4E0B\u65B9\u6807\u8BB0\u7684\u56FE\u6807 / \u5916\u89C2 / \u65F6\u95F4\u8BBE\u7F6E\uFF09\u3002"},markerIcon:{group:"\u5916\u89C2",type:"select",default:"trash",label:"\u6807\u8BB0\u56FE\u6807",description:"\u6807\u8BB0\u884C\u524D\u7684\u56FE\u6807\uFF08\u5220\u9664 / \u7F16\u8F91\u901A\u7528\uFF09\u3002",options:[{value:"trash",label:"\u{1F5D1} \u5783\u573E\u6876"},{value:"shield",label:"\u{1F6E1} \u76FE\u724C"},{value:"warning",label:"\u26A0 \u8B66\u544A\u4E09\u89D2"},{value:"none",label:"\u65E0\u56FE\u6807"}]},markerLook:{group:"\u5916\u89C2",type:"select",default:"plain",label:"\u6807\u8BB0\u5916\u89C2",description:"\u6807\u8BB0\u884C\u7684\u5448\u73B0\u65B9\u5F0F\uFF08\u5220\u9664 / \u7F16\u8F91\u901A\u7528\uFF09\u3002",options:[{value:"plain",label:"\u7EAF\u6587\u5B57"},{value:"badge",label:"\u5706\u89D2\u5FBD\u7AE0"},{value:"quote",label:"\u5F15\u7528\u5757\uFF08\u5DE6\u4FA7\u7AD6\u6761\uFF09"}]},markerTime:{group:"\u5916\u89C2",type:"select",default:"time",label:"\u6807\u8BB0\u65F6\u95F4\u683C\u5F0F",description:"\u6807\u8BB0\u884C\u91CC\u65F6\u95F4\u7684\u663E\u793A\u65B9\u5F0F\u3002",options:[{value:"time",label:"\u4EC5\u65F6\u95F4\uFF0803:19:42\uFF09"},{value:"datetime",label:"\u65E5\u671F + \u65F6\u95F4"},{value:"none",label:"\u4E0D\u663E\u793A\u65F6\u95F4"}]},ignoreBots:{group:"\u5C4F\u853D\u5BF9\u8C61",type:"boolean",default:!1,label:"\u5C4F\u853D\u673A\u5668\u4EBA",description:"\u673A\u5668\u4EBA\u7684\u6D88\u606F\u4E0D\u8BB0\u5F55\u3001\u4E0D\u5728\u804A\u5929\u4E2D\u4FDD\u7559\u3002"},ignoreSelf:{group:"\u5C4F\u853D\u5BF9\u8C61",type:"boolean",default:!1,label:"\u5C4F\u853D\u81EA\u5DF1",description:"\u4F60\u81EA\u5DF1\u5220\u9664\u6216\u7F16\u8F91\u7684\u6D88\u606F\u4E0D\u8BB0\u5F55\u3001\u4E0D\u5728\u804A\u5929\u4E2D\u4FDD\u7559\u3002"},ignoredUsers:{group:"\u5C4F\u853D\u5BF9\u8C61",type:"string-list",default:[],label:"\u5C4F\u853D\u7684\u7528\u6237",description:"\u8FD9\u4E9B\u7528\u6237\u7684\u6D88\u606F\u4E0D\u8BB0\u5F55\u3001\u4E0D\u5728\u804A\u5929\u4E2D\u4FDD\u7559\u3002",itemPlaceholder:"\u7528\u6237 ID"},ignoredChannels:{group:"\u5C4F\u853D\u5BF9\u8C61",type:"string-list",default:[],label:"\u5C4F\u853D\u7684\u9891\u9053",description:"\u8FD9\u4E9B\u9891\u9053\u91CC\u7684\u6D88\u606F\u4E0D\u8BB0\u5F55\u3001\u4E0D\u5728\u804A\u5929\u4E2D\u4FDD\u7559\u3002",itemPlaceholder:"\u9891\u9053 ID"}});var Ra=g("message-logger"),zo="message-logger.log",Sn=class{deleted=[];edited=[];retention=50;listeners=new Set;saveTimer;deletedIndex=new Set;load(){let t=pe(zo);this.deleted=Array.isArray(t.deleted)?t.deleted:[],this.edited=Array.isArray(t.edited)?t.edited:[],this.trimDeleted(),this.reindex()}isDeleted(t,n){return this.deletedIndex.has(`${t}:${n}`)}findDeleted(t,n){if(this.isDeleted(t,n))return this.deleted.find(o=>o.channelId===t&&o.id===n)}setRetention(t){this.retention=Math.max(0,t|0),this.trimDeleted(),this.reindex(),this.scheduleSave(),this.emit()}recordDeleted(t){this.deleted.some(n=>n.id===t.id)||(this.deleted.unshift(t),this.trimDeleted(),this.reindex(),this.scheduleSave(),this.emit())}recordEdit(t,n,o,i,a){let s=Date.now(),c=this.edited.find(l=>l.id===t);if(!c)c={id:t,channelId:n,guildId:a,author:o,history:[{content:i,at:s}],updatedAt:s},this.edited.unshift(c);else{if(c.history[c.history.length-1]?.content===i)return;c.history.push({content:i,at:s}),c.updatedAt=s}this.edited.length>300&&(this.edited.length=300),this.scheduleSave(),this.emit()}getDeleted(){return this.deleted}getEdited(){return this.edited}counts(){return{deleted:this.deleted.length,edited:this.edited.length}}clear(){this.deleted=[],this.edited=[],this.reindex(),this.scheduleSave(),this.emit()}toJSON(){return JSON.stringify({deleted:this.deleted,edited:this.edited},null,2)}subscribe(t){return this.listeners.add(t),()=>void this.listeners.delete(t)}flush(){this.saveTimer!==void 0&&(clearTimeout(this.saveTimer),this.saveTimer=void 0),this.save()}trimDeleted(){if(this.retention<=0)return;let t=new Map;this.deleted=this.deleted.filter(n=>{let o=t.get(n.channelId)??0;return o>=this.retention?!1:(t.set(n.channelId,o+1),!0)})}reindex(){this.deletedIndex=new Set(this.deleted.map(t=>`${t.channelId}:${t.id}`))}emit(){for(let t of this.listeners)try{t()}catch{}}scheduleSave(){this.saveTimer!==void 0&&clearTimeout(this.saveTimer),this.saveTimer=setTimeout(()=>this.save(),500)}save(){try{Se(zo,{deleted:this.deleted,edited:this.edited})}catch(t){Ra.error("failed to persist message log",t)}}},C=new Sn;var kn=/<(a)?:([A-Za-z0-9_]+):(\d+)>/g;function Je(e){let t=[],n=0,o=0;kn.lastIndex=0;for(let i=kn.exec(e);i;i=kn.exec(e)){i.index>n&&t.push(r.createElement("span",{key:o++},e.slice(n,i.index)));let[,a,s,c]=i;t.push(r.createElement("img",{key:o++,className:"hc-emoji",src:`https://cdn.discordapp.com/emojis/${c}.${a?"gif":"webp"}`,alt:`:${s}:`,title:`:${s}:`,draggable:!1,loading:"lazy"})),n=i.index+i[0].length}return t.length===0?e:(n<e.length&&t.push(r.createElement("span",{key:o++},e.slice(n))),t)}var Ce=g("message-logger");function es(){let[e,t]=m(()=>({deleted:C.getDeleted(),edited:C.getEdited()}));return A(()=>{let n=()=>t({deleted:C.getDeleted(),edited:C.getEdited()});return n(),C.subscribe(n)},[]),e}var xn=25;function ts(){let[e,t]=m(()=>F().filter(s=>s.pluginId==="message-logger"));if(A(()=>{let s=()=>t(F().filter(l=>l.pluginId==="message-logger"));s();let c=setInterval(s,3e3);return()=>clearInterval(c)},[]),e.length===0)return null;let n=e.filter(s=>!s.applied);if(n.length===0)return null;let o=n.find(s=>s.label==="keep deleted message in store");return r.createElement("div",{className:"hc-mlog-warn"},r.createElement("div",{className:"hc-mlog-warn__title"},o?"\u804A\u5929\u4E2D\u7684\u7EA2\u8272\u5360\u4F4D\u672A\u751F\u6548":"\u90E8\u5206\u804A\u5929\u5185\u8865\u4E01\u672A\u5339\u914D\u5F53\u524D Discord \u7248\u672C"),r.createElement("div",{className:"hc-mlog-warn__detail"},o?"\u88AB\u5220\u9664\u7684\u6D88\u606F\u4ECD\u7136\u8BB0\u5F55\u5728\u4E0B\u65B9\u5217\u8868\uFF0C\u4F46\u5728\u804A\u5929\u91CC\u4F1A\u76F4\u63A5\u6D88\u5931\u3002\u6838\u5FC3\u8865\u4E01 keep-deleted \u672A\u5339\u914D\u5F53\u524D Discord \u7248\u672C\u3002":"\u8BB0\u5F55\u529F\u80FD\u6B63\u5E38\uFF0C\u4F46\u804A\u5929\u4E2D\u7684\u7F16\u8F91\u5386\u53F2 / \u5220\u9664\u6807\u8BB0\u53EF\u80FD\u65E0\u6CD5\u663E\u793A\u3002"),r.createElement("ul",{className:"hc-mlog-warn__list"},n.map(s=>r.createElement("li",{key:s.label},"\u201C",s.label,"\u201D"))),r.createElement("div",{className:"hc-mlog-warn__detail"},"\u8BF7\u628A\u6B64\u5904\u4EE5\u53CA\u65E5\u5FD7\u9875\u91CC \u201CHalcyon modules\u201D \u76F8\u5173\u7684\u8F93\u51FA\u53D1\u7ED9\u5F00\u53D1\u8005\u5B9A\u4F4D\u3002"))}function jo(){let{deleted:e,edited:t}=es(),[n,o]=m("deleted"),[i,a]=m({deleted:0,edited:0}),s=n==="deleted"?e:t,c=Math.max(1,Math.ceil(s.length/xn)),l=Math.min(i[n],c-1),d=s.slice(l*xn,(l+1)*xn),u=h=>a(y=>({...y,[n]:Math.max(0,Math.min(c-1,h))}));return r.createElement("div",null,r.createElement(ts,null),r.createElement("div",{className:"hc-tabs"},r.createElement("button",{type:"button",className:"hc-tab","data-active":n==="deleted",onClick:()=>o("deleted")},r.createElement(Y,{size:16})," \u5DF2\u5220\u9664",e.length>0&&r.createElement(me,{tone:"red"},e.length)),r.createElement("button",{type:"button",className:"hc-tab","data-active":n==="edited",onClick:()=>o("edited")},r.createElement(an,{size:16})," \u5DF2\u7F16\u8F91",t.length>0&&r.createElement(me,{tone:"orange"},t.length)),r.createElement("div",{className:"hc-tabs__spacer"}),r.createElement(S,{size:"sm",variant:"plain",icon:r.createElement(Jr,{size:16}),onClick:cs},"\u5BFC\u51FA"),r.createElement(S,{size:"sm",variant:"destructive",onClick:()=>C.clear(),disabled:s.length===0},"\u6E05\u7A7A")),s.length===0?n==="deleted"?r.createElement(V,{icon:r.createElement(Y,{size:48}),title:"\u8FD8\u6CA1\u6709\u8BB0\u5F55",subtitle:"\u88AB\u5220\u9664\u7684\u6D88\u606F\u4F1A\u5728\u8FD9\u91CC\u4FDD\u7559\uFF0C\u542F\u7528\u63D2\u4EF6\u540E\u5373\u65F6\u751F\u6548\u3002"}):r.createElement(V,{icon:r.createElement(an,{size:48}),title:"\u8FD8\u6CA1\u6709\u7F16\u8F91\u8BB0\u5F55",subtitle:"\u6D88\u606F\u88AB\u7F16\u8F91\u524D\u7684\u5185\u5BB9\u4F1A\u4FDD\u7559\u5728\u8FD9\u91CC\u3002"}):r.createElement(r.Fragment,null,r.createElement("div",{className:"hc-msglist"},n==="deleted"?d.map(h=>r.createElement(is,{key:`${h.channelId}-${h.id}`,entry:h})):d.map(h=>r.createElement(as,{key:`${h.channelId}-${h.id}`,entry:h}))),c>1&&r.createElement(ns,{page:l,pageCount:c,onChange:u})))}function ns(e){let{page:t,pageCount:n,onChange:o}=e;return r.createElement("div",{className:"hc-pager"},r.createElement(S,{size:"sm",variant:"plain",onClick:()=>o(t-1),disabled:t===0},"\u4E0A\u4E00\u9875"),r.createElement("span",{className:"hc-pager__label"},"\u7B2C ",t+1," / ",n," \u9875"),r.createElement(S,{size:"sm",variant:"plain",onClick:()=>o(t+1),disabled:t>=n-1},"\u4E0B\u4E00\u9875"))}function rs(e,t,n){os(),setTimeout(()=>{try{let o=n;if(!o){let a=ye.getChannel?.(e);o=a?.guild_id??a?.guildId??void 0}let i=`/channels/${o??"@me"}/${e}/${t}`;typeof gn.transitionTo=="function"?gn.transitionTo(i):Ce.warn("[jump] NavigationRouter.transitionTo not resolved"),setTimeout(()=>{try{let a=$o.getChannelId?.();Ce.info("[jump] post-nav selected channel",{now:a,wanted:e,ok:a===e})}catch{}},200)}catch(o){Ce.error("jump to message failed",o)}},60)}function os(){try{Z()}catch{}try{let e={key:"Escape",code:"Escape",keyCode:27,which:27,bubbles:!0,cancelable:!0};document.dispatchEvent(new KeyboardEvent("keydown",e)),document.dispatchEvent(new KeyboardEvent("keyup",e))}catch(e){Ce.error("[jump] escape dispatch failed",e)}try{typeof yn.popLayer=="function"?yn.popLayer():W()?.dispatch?.({type:"LAYER_POP"})}catch(e){Ce.error("[jump] layer pop failed",e)}}function Bo({entry:e}){return r.createElement(S,{size:"sm",variant:"plain",className:"hc-msg__jump",icon:r.createElement(mt,{size:16}),title:"\u8DF3\u8F6C\u5230\u8BE5\u6D88\u606F\u6240\u5728\u4F4D\u7F6E",onClick:()=>rs(e.channelId,e.id,e.guildId)},"\u8DF3\u8F6C")}function is({entry:e}){return r.createElement("div",{className:"hc-msg"},r.createElement("div",{className:"hc-msg__head"},r.createElement("span",{className:"hc-msg__author"},e.author.name),e.author.bot&&r.createElement(me,{tone:"neutral"},"BOT"),r.createElement(Uo,{channelId:e.channelId,guildId:e.guildId}),r.createElement("span",{className:"hc-msg__time"},Go(e.deletedAt)),r.createElement(Bo,{entry:e})),r.createElement("div",{className:"hc-msg__body"},e.content?Je(e.content):e.stickers?.length?r.createElement("span",null,"\u{1F3F7}\uFE0F \u8D34\u7EB8\uFF1A",e.stickers.map(t=>t.name).join("\u3001")):e.attachmentsRich?.length||e.embeds?.length?r.createElement("span",null,"\u{1F5BC}\uFE0F \u5A92\u4F53\u6D88\u606F"):r.createElement("span",{className:"hc-msg__empty"},"\uFF08\u65E0\u6587\u672C\u5185\u5BB9\uFF09")),(e.attachmentsRich?.length??0)>0&&r.createElement("div",{className:"hc-msg__media"},e.attachmentsRich.map((t,n)=>(t.content_type??"").startsWith("image/")||(t.content_type??"").startsWith("video/")?r.createElement("img",{key:n,className:"hc-msg__thumb",src:t.proxy_url??t.url,alt:t.filename??"\u9644\u4EF6",loading:"lazy"}):r.createElement("a",{key:n,href:t.url,target:"_blank",rel:"noreferrer"},"\u{1F4CE} ",t.filename??"\u9644\u4EF6"))),!e.attachmentsRich?.length&&e.attachments.length>0&&r.createElement("div",{className:"hc-msg__meta"},"\u9644\u4EF6 ",e.attachments.length," \u4E2A"))}function as({entry:e}){return r.createElement("div",{className:"hc-msg"},r.createElement("div",{className:"hc-msg__head"},r.createElement("span",{className:"hc-msg__author"},e.author.name),r.createElement(Uo,{channelId:e.channelId,guildId:e.guildId}),r.createElement("span",{className:"hc-msg__time"},Go(e.updatedAt)),r.createElement(Bo,{entry:e})),r.createElement("div",{className:"hc-msg__versions"},e.history.map((t,n)=>r.createElement("div",{className:"hc-msg__version",key:n},r.createElement("span",{className:"hc-msg__vtag"},"v",n+1),r.createElement("span",{className:"hc-msg__vbody"},t.content?Je(t.content):"\uFF08\u7A7A\uFF09")))))}function ss(e,t){let n,o=t,i=!1;try{let c=ye.getChannel?.(e);c&&(c.name&&(n=String(c.name)),o=o??c.guild_id??c.guildId??void 0,i=c.type===1||c.type===3)}catch{}let a;try{if(o){let c=U.getGuild?.(o);c?.name&&(a=String(c.name))}}catch{}let s=n?`#${n}`:i?"\u79C1\u4FE1":`#${e}`;return{guild:a,channel:s}}function Uo({channelId:e,guildId:t}){let n=ss(e,t);return r.createElement("span",{className:"hc-msg__where"},n.guild&&r.createElement("span",{className:"hc-msg__guild"},n.guild),n.guild&&r.createElement("span",{className:"hc-msg__sep"},"\u203A"),r.createElement("span",null,n.channel))}function Go(e){let t=new Date(e),n=o=>String(o).padStart(2,"0");return`${n(t.getMonth()+1)}-${n(t.getDate())} ${n(t.getHours())}:${n(t.getMinutes())}`}function cs(){try{let e=new Blob([C.toJSON()],{type:"application/json"}),t=URL.createObjectURL(e),n=document.createElement("a");n.href=t,n.download=`halcyon-message-log-${Date.now()}.json`,document.body.appendChild(n),n.click(),n.remove(),URL.revokeObjectURL(t)}catch(e){Ce.error("export failed",e)}}var E=g("message-logger"),wn,En,In;function Lt(e){if(typeof e=="number")return e;if(typeof e=="string"){let t=Date.parse(e);return Number.isNaN(t)?Date.now():t}if(e&&typeof e.valueOf=="function"){let t=e.valueOf();if(typeof t=="number")return t}return Date.now()}function ls(e){return e?.globalName||e?.global_name||e?.username||e?.name||"\u672A\u77E5\u7528\u6237"}function Yo(e){return{id:String(e?.id??"0"),name:ls(e),bot:!!e?.bot}}function Xo(e){let t=e?.attachments;return Array.isArray(t)?t.map(n=>n?.filename||n?.url||"\u9644\u4EF6").slice(0,20):[]}function Ln(e){let t=e?.attachments;return Array.isArray(t)?t.map(n=>({id:n?.id!=null?String(n.id):void 0,filename:n?.filename??n?.fileName??void 0,url:n?.url??void 0,proxy_url:n?.proxy_url??n?.proxyURL??n?.proxyUrl??void 0,content_type:n?.content_type??n?.contentType??void 0,width:typeof n?.width=="number"?n.width:void 0,height:typeof n?.height=="number"?n.height:void 0,size:typeof n?.size=="number"?n.size:void 0})).filter(n=>n.url||n.proxy_url).slice(0,10):[]}function Dn(e){let t=e?.embeds;if(!Array.isArray(t)||t.length===0)return[];try{return JSON.parse(JSON.stringify(t)).slice(0,6)}catch{return[]}}function On(e){let t=e?.sticker_items??e?.stickerItems??e?.stickers;return Array.isArray(t)?t.filter(n=>n?.id!=null).map(n=>({id:String(n.id),name:String(n.name??"\u8D34\u7EB8"),format_type:typeof n.format_type=="number"?n.format_type:n.formatType})).slice(0,4):[]}function ds(){try{return Ie.getCurrentUser?.()?.id}catch{return}}var Ho=!1;function qe(e,t){let n=M.store;if(e&&n.ignoredChannels.includes(e))return!0;let o=t?.id!=null?String(t.id):"";if(o&&n.ignoredUsers.includes(o)||n.ignoreBots&&t?.bot)return!0;if(n.ignoreSelf){let i=ds();if(!Ho){Ho=!0;let a=!!(o&&i&&o===String(i));E.info(`\u5C4F\u853D\u81EA\u5DF1 \u81EA\u68C0 \u2014 \u5F00\u5173=on\uFF0C\u6D88\u606F\u4F5C\u8005id=${o||"(\u7A7A)"}\uFF0C\u5F53\u524D\u7528\u6237id=${i??"(\u53D6\u4E0D\u5230)"}\uFF0C\u5224\u5B9A=${a?"\u547D\u4E2D\u2192\u4F1A\u5C4F\u853D":"\u672A\u547D\u4E2D\u2192\u4E0D\u5C4F\u853D"}`)}if(o&&i&&o===String(i))return!0}return!1}var ce=new Map,us=4e3;function An(e,t,n){let o=n?.content;if(!e||!t||typeof o!="string")return;let i=`${e}:${t}`,a=ce.get(i);a&&ce.delete(i);let s=On(n),c=Ln(n),l=Dn(n);if(ce.set(i,{content:o,author:n?.author??a?.author,attachments:Array.isArray(n?.attachments)?Xo(n):a?.attachments,attachmentsRich:c.length?c:a?.attachmentsRich,embeds:l.length?l:a?.embeds,stickers:s.length?s:a?.stickers,sentAt:n?.timestamp!=null?Lt(n.timestamp):a?.sentAt,guildId:n?.guild_id??n?.guildId??a?.guildId}),ce.size>us){let d=ce.keys().next().value;d!==void 0&&ce.delete(d)}}function Ye(e,t){try{return Po.getMessage(e,t)}catch{return}}var $t,Ae,Nn=!1;function Tn(){try{if(typeof document>"u")return;let e=document.documentElement,t=`hc-mlog-${M.store.deleteStyle||"tint"}`;if(e&&!e.classList.contains(t)){for(let o of zn)e.classList.remove(`hc-mlog-${o}`);e.classList.add(t)}document.querySelectorAll('li[id^="chat-messages-"]').forEach(o=>{!o.classList.contains("hc-deleted")&&Qo(o)&&o.classList.add("hc-deleted")})}catch{}}function Zo(){Nn||(Nn=!0,setTimeout(()=>{Nn=!1,Tn()},60))}function Qo(e){let t=e.id.split("-"),n=t[t.length-1],o=t.length>=4?t[t.length-2]:void 0;return o?C.isDeleted(o,n):C.getDeleted().some(i=>i.id===n)}function hs(){if(typeof MutationObserver>"u"||typeof document>"u")return;$t=new MutationObserver(t=>{for(let n of t){let o=n.target;n.type==="attributes"&&o instanceof Element&&o.id&&o.id.startsWith("chat-messages-")&&!o.classList.contains("hc-deleted")&&Qo(o)&&o.classList.add("hc-deleted")}Zo()});let e=()=>{let t=document.documentElement??document.body;return t?(Tn(),$t?.observe(t,{childList:!0,subtree:!0,attributes:!0,attributeFilter:["class"]}),!0):!1};if(!e()){let t=0,n=setInterval(()=>{(e()||++t>100)&&clearInterval(n)},100)}Ae&&clearInterval(Ae),Ae=setInterval(Tn,300)}function ps(){$t?.disconnect(),$t=void 0,Ae&&(clearInterval(Ae),Ae=void 0)}function fs(e,t){try{let n=document.getElementById(`chat-messages-${e}-${t}`)||document.getElementById(`chat-messages-${t}`);n&&n.classList.add("hc-deleted")}catch{}Zo()}var Cn=new Set;function ms(e,t){try{let n=W();if(!n||typeof n.dispatch!="function")return;let o=Ye(e,t);if(!o)return;let i=o.author??{},a=y=>y==null?null:typeof y?.toISOString=="function"?y.toISOString():typeof y=="string"?y:new Date(Lt(y)).toISOString(),s=C.findDeleted(e,t),c=Dn(o);(!c||c.length===0)&&s?.embeds?.length&&(c=s.embeds);let l=On(o);l.length===0&&s?.stickers?.length&&(l=s.stickers);let d=Ln(o);d.length===0&&s?.attachmentsRich?.length&&(d=s.attachmentsRich);let u=typeof o.content=="string"&&o.content!==""?o.content:s?.content??"",h={id:String(t),channel_id:String(e),guild_id:o.guild_id??o.guildId??s?.guildId??null,type:typeof o.type=="number"?o.type:0,content:u,author:{id:String(i.id??s?.author.id??"0"),username:i.username??i.global_name??i.globalName??s?.author.name??"user",global_name:i.globalName??i.global_name??i.username??s?.author.name??null,discriminator:String(i.discriminator??"0"),avatar:i.avatar??null,bot:!!(i.bot??s?.author.bot),public_flags:i.publicFlags??i.public_flags??0},timestamp:a(o.timestamp)??new Date().toISOString(),edited_timestamp:a(o.editedTimestamp??o.edited_timestamp),tts:!!o.tts,mention_everyone:!!(o.mentionEveryone??o.mention_everyone),mentions:[],mention_roles:[],attachments:d.map((y,$)=>({id:y.id??`${t}${$}`,filename:y.filename??"file",url:y.url??y.proxy_url,proxy_url:y.proxy_url??y.url,content_type:y.content_type,width:y.width,height:y.height,size:y.size??0})),embeds:c,sticker_items:l,pinned:!!o.pinned,flags:typeof o.flags=="number"?o.flags:0,deleted:!0};n.dispatch({type:"MESSAGE_UPDATE",message:h})}catch(n){E.debug("force row re-render failed (non-fatal)",n)}}function gs(e,t){let n=`${e}:${t}`;Cn.has(n)||(Cn.add(n),setTimeout(()=>{ms(e,t),setTimeout(()=>Cn.delete(n),1500)},0))}function Fo(e,t){if(!e||!t)return;let n=Ye(e,t),o=ce.get(`${e}:${t}`);if(!n&&!o){E.debug(`delete of ${t} skipped: message not in cache or shadow`);return}let i=n?.author??o?.author??{};if(qe(e,i))return;let a=typeof n?.content=="string"&&n.content!==""?n.content:o?.content??"",s=n?Xo(n):o?.attachments??[],c=n?Ln(n):[],l=c.length?c:o?.attachmentsRich??[],d=n?Dn(n):[],u=d.length?d:o?.embeds??[],h=n?On(n):[],y=h.length?h:o?.stickers??[];if(!(!a&&s.length===0&&l.length===0&&u.length===0&&y.length===0)){if(C.recordDeleted({id:String(t),channelId:String(e),guildId:n?.guild_id??n?.guildId??o?.guildId??void 0,author:Yo(i),content:a,attachments:s,attachmentsRich:l.length?l:void 0,embeds:u.length?u:void 0,stickers:y.length?y:void 0,sentAt:n?.timestamp!=null?Lt(n.timestamp):o?.sentAt??Date.now(),deletedAt:Date.now()}),n&&M.store.keepDeletedInChat)try{n.deleted=!0}catch{}if(M.store.keepDeletedInChat&&(fs(String(e),String(t)),gs(String(e),String(t))),M.store.keepDeletedInChat&&!Wo){Wo=!0;let $=String(e),j=String(t);setTimeout(()=>{let G=Ye($,j),p=typeof document<"u"?document.getElementById(`chat-messages-${$}-${j}`)||document.getElementById(`chat-messages-${j}`):null,b=!!p&&p.classList.contains("hc-deleted");G&&G.deleted===!0?E.info(`live keep-deleted \u81EA\u68C0 OK \u2014 \u88AB\u5220\u6D88\u606F\u4ECD\u7559\u5728 store \u4E14\u5DF2\u6807\u8BB0 deleted\uFF1BDOM \u884C${p?b?"\u5DF2\u76F4\u63A5\u67D3\u7EA2\uFF08\u5B9E\u65F6\u7EA2\u6761\u751F\u6548\uFF09":"\u627E\u5230\u4F46\u672A\u67D3\u7EA2\uFF0C\u8BF7\u53CD\u9988":"\u672A\u627E\u5230\uFF08\u53EF\u80FD\u5DF2\u6EDA\u51FA\u89C6\u56FE\uFF09"}`):G?E.warn("live keep-deleted \u81EA\u68C0 PARTIAL \u2014 \u6D88\u606F\u4FDD\u7559\u4F46\u672A\u6807\u8BB0 deleted\uFF0C\u6539\u7528 DOM \u76F4\u63A5\u67D3\u7EA2\u515C\u5E95"):E.error("live keep-deleted \u81EA\u68C0 FAILED \u2014 MessageStore \u5DF2\u4E22\u5F03\u88AB\u5220\u6D88\u606F\uFF0C\u8BF4\u660E \u201Ckeep deleted message in store\u201D \u8865\u4E01\u672A\u547D\u4E2D\u5F53\u524D\u6784\u5EFA\uFF1B\u88AB\u5220\u6D88\u606F\u53EA\u4F1A\u5728\u91CD\u65B0\u52A0\u8F7D\u9891\u9053\u540E\u7531 revive \u91CD\u65B0\u51FA\u73B0\uFF08\u6B63\u662F\u4F60\u8BF4\u7684\u201C\u5237\u65B0\u624D\u6709\u3001\u5B9E\u65F6\u6CA1\u6709\u201D\uFF09\u3002")},0)}}}function ys(e){if(!M.store.logEdits||!e)return;let t=e.channel_id??e.channelId,n=e.id;if(!t||!n||typeof e.content!="string")return;let o=`${t}:${n}`,i=Ye(t,n),a=ce.get(o),s=a?.content??(typeof i?.content=="string"?i.content:void 0);if(An(t,n,e),s===void 0){E.debug(`edit to ${n} skipped: no prior content known (message predates the recorder)`);return}if(s===e.content)return;let c=i?.author??a?.author??e.author??{};if(qe(t,c))return;let l=e.guild_id??e.guildId??i?.guild_id??a?.guildId;C.recordEdit(String(n),String(t),Yo(c),s,l!=null?String(l):void 0)}function bs(e){let t=(e.attachmentsRich??[]).map((n,o)=>({id:n.id??`${e.id}${o}`,filename:n.filename??"attachment",url:n.url??n.proxy_url,proxy_url:n.proxy_url??n.url,content_type:n.content_type,width:n.width,height:n.height,size:n.size??0,spoiler:!1}));return{id:e.id,type:0,channel_id:e.channelId,guild_id:e.guildId,sticker_items:e.stickers?.length?e.stickers:void 0,content:e.content||(t.length===0&&e.attachments.length?`\u{1F4CE} ${e.attachments.join(", ")}`:""),author:{id:e.author.id,username:e.author.name,global_name:e.author.name,discriminator:"0000",bot:e.author.bot,avatar:null},timestamp:new Date(e.sentAt).toISOString(),attachments:t,embeds:e.embeds??[],mentions:[],mention_roles:[],mention_everyone:!1,pinned:!1,tts:!1,flags:0}}function Pt(e,t){try{let n=BigInt(e),o=BigInt(t);return n<o?-1:n>o?1:0}catch{return e<t?-1:e>t?1:0}}var Ko=new WeakSet;function vs(e){if(!M.store.keepDeletedInChat||Ko.has(e))return;Ko.add(e);let t=String(e.channelId??e.channel_id??""),n=e.messages;if(!t||!Array.isArray(n))return;let o=C.getDeleted().filter(l=>l.channelId===t);if(!o.length)return;let i=new Set(n.map(l=>String(l?.id))),a;for(let l of n){let d=l?.id!=null?String(l.id):void 0;d&&(a===void 0||Pt(d,a)<0)&&(a=d)}let s=o.filter(l=>!i.has(l.id)&&(a===void 0||Pt(l.id,a)>=0)&&!qe(t,l.author));if(!s.length)return;let c=n.length>=2?Pt(String(n[0].id),String(n[n.length-1].id))>0:!0;n.push(...s.map(bs)),n.sort((l,d)=>{let u=Pt(String(l?.id??"0"),String(d?.id??"0"));return c?-u:u}),E.info(`revived ${s.length} deleted message(s) into ${t}`)}function _s(e){if(!M.store.keepDeletedInChat)return;let t=String(e.channelId??e.channel_id??"");if(t)for(let n of C.getDeleted()){if(n.channelId!==t)continue;let o=Ye(t,n.id);if(o&&!o.deleted)try{o.deleted=!0}catch{}}}function Ss(e,t){try{if(t==="MESSAGE_CREATE"){let n=e.message;An(n?.channel_id??n?.channelId??e.channelId,n?.id,n)}else if(t==="LOAD_MESSAGES_SUCCESS"){let n=e.channelId??e.channel_id;if(Array.isArray(e.messages))for(let o of e.messages)An(o?.channel_id??n,o?.id,o)}}catch{}}var Vo=!1,Mn=0,Wo=!1;function Pn(e){let t=e?.type;if(typeof t=="string"){if($n.includes(t)&&Mn++,Ss(e,t),t==="LOAD_MESSAGES_SUCCESS")try{vs(e),setTimeout(()=>_s(e),0)}catch(n){E.error("failed to revive deleted messages on channel load",n)}try{if(t==="MESSAGE_DELETE")Fo(e.channelId??e.channel_id,e.id??e.messageId);else if(t==="MESSAGE_DELETE_BULK"){let n=e.channelId??e.channel_id;for(let o of e.ids??[])Fo(n,o)}else if(t==="MESSAGE_UPDATE")ys(e.message);else return;Vo||(Vo=!0,E.info(`recorder saw its first ${t}`))}catch(n){E.error("recorder failed for",t,n)}}}function ks(e){Pn(e.args[0])}var $n=["MESSAGE_CREATE","MESSAGE_UPDATE","MESSAGE_DELETE","MESSAGE_DELETE_BULK","LOAD_MESSAGES_SUCCESS"];function xs(e,t){let n=[],o=[];if(typeof e.addInterceptor=="function")try{let i=a=>(Pn(a),!1);e.addInterceptor(i),n.push(()=>{let a=e._interceptors;if(Array.isArray(a)){let s=a.indexOf(i);s>=0&&a.splice(s,1)}}),o.push("interceptor")}catch{}for(let i of["dispatch","_dispatch"])if(typeof e[i]=="function"){try{n.push(ge.before(e,i,ks)),o.push(i)}catch{}break}if(typeof e.subscribe=="function")try{let i=a=>Pn(a);for(let a of $n)e.subscribe(a,i);n.push(()=>{if(typeof e.unsubscribe=="function")for(let a of $n)try{e.unsubscribe(a,i)}catch{}}),o.push("subscribe")}catch{}return E.info(`recorder on dispatcher ${t}: seams [${o.join(", ")||"none"}]`),()=>n.forEach(i=>i())}function ws(){let e=new Set,t=[],n=()=>{let s=[...kr(ue),W()].filter(Boolean),c=0;for(let l of s)e.has(l)||(e.add(l),t.push(xs(l,`#${e.size}`)),c++);return c},o=n();E.info(`recorder attached to ${o} dispatcher instance(s)`);let i=setInterval(()=>{let s=n();s>0&&E.info(`recorder attached to ${s} late dispatcher instance(s)`)},5e3),a=setTimeout(()=>clearInterval(i),6e4);return()=>{clearInterval(i),clearTimeout(a),t.forEach(s=>s())}}var Es={trash:()=>r.createElement(r.Fragment,null,r.createElement("path",{d:"M4.5 7h15"}),r.createElement("path",{d:"M9.25 7V5.5A1.5 1.5 0 0110.75 4h2.5a1.5 1.5 0 011.5 1.5V7"}),r.createElement("path",{d:"M6.5 7l.85 11.1A2 2 0 009.34 20h5.32a2 2 0 001.99-1.9L17.5 7"})),shield:()=>r.createElement(r.Fragment,null,r.createElement("path",{d:"M12 3.5l7 2.6v5c0 4.4-3 7.3-7 8.9-4-1.6-7-4.5-7-8.9v-5l7-2.6z"}),r.createElement("path",{d:"M9.5 12l1.8 1.8 3.2-3.6"})),warning:()=>r.createElement(r.Fragment,null,r.createElement("path",{d:"M12 4.5L3.5 19h17L12 4.5z"}),r.createElement("path",{d:"M12 10v4"}),r.createElement("path",{d:"M12 16.75h.01"}))};function Ro(e,t){if(e==null||t==="none")return;let n=new Date(e);if(t==="datetime"){let o=i=>String(i).padStart(2,"0");return`${o(n.getMonth()+1)}-${o(n.getDate())} ${n.toLocaleTimeString("zh-CN",{hour12:!1})}`}return n.toLocaleTimeString("zh-CN",{hour12:!1})}function Jo(e){let t=M.store,n=Es[t.markerIcon]?.(),o=Ro(e.at,t.markerTime),i=`hc-deleted-marker hc-deleted-marker--${t.markerLook||"plain"}`+(e.edited?" hc-deleted-marker--edited":"");return r.createElement("div",{className:i},n&&r.createElement("svg",{className:"hc-deleted-marker__icon",width:"14",height:"14",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:2,strokeLinecap:"round",strokeLinejoin:"round","aria-hidden":!0},n),r.createElement("span",null,e.text,o?`\uFF08${o}\uFF09`:""))}var Is=["logEdits","deleteStyle","showDeletedMarker","showEditedMarker","markerIcon","markerLook","markerTime"];function Ns(){let[,e]=m(0);A(()=>{let t=Is.map(n=>M.subscribe(n,()=>e(o=>o+1)));return()=>t.forEach(n=>n())},[])}function Cs(e){Ns();let t=M.store,n=[];return t.logEdits&&e.history&&e.history.length>0&&n.push(r.createElement("div",{className:"hc-edit-history",key:"hc-edit-history"},e.history.map((o,i)=>{let a=Ro(o.at,"time");return r.createElement("div",{className:`hc-edit-history__version hc-edit-history__version--${t.deleteStyle||"tint"}`,key:i},Je(o.content),a?r.createElement("span",{className:"hc-edit-history__time"},a):null)}))),t.showEditedMarker&&e.isEdited&&!e.isDeleted&&n.push(r.createElement(Jo,{key:"hc-edited-marker",text:"\u6B64\u6D88\u606F\u5DF2\u7F16\u8F91",at:e.editedAt,edited:!0})),t.showDeletedMarker&&e.isDeleted&&n.push(r.createElement(Jo,{key:"hc-deleted-marker",text:"\u6B64\u6D88\u606F\u5DF2\u5220\u9664",at:e.deletedAt})),n.length?r.createElement(r.Fragment,null,n):null}var zn=["tint","text","ghost","strike"];function qo(){try{let e=document.documentElement;if(!e)return;for(let t of zn)e.classList.remove(`hc-mlog-${t}`);e.classList.add(`hc-mlog-${M.store.deleteStyle||"tint"}`)}catch{}}function As(){let e=F().filter(i=>i.pluginId==="message-logger");if(!e.length)return;for(let i of e)i.applied?E.info(`patch OK   \xB7 ${i.label} (${i.hits} hit${i.hits===1?"":"s"})`):E.warn(`patch MISS \xB7 ${i.label} \u2014 \u672A\u5339\u914D\u5F53\u524D Discord \u6784\u5EFA`);let t=e.filter(i=>!i.applied);t.length===0?E.info("in-chat patches applied \u2014 \u5168\u90E8\u547D\u4E2D"):E.warn("\u90E8\u5206 in-chat patch \u672A\u5339\u914D\u5F53\u524D Discord \u6784\u5EFA\uFF1A"+t.map(i=>`"${i.label}"`).join("\u3001")+"\u3002\u5220\u9664\u6D88\u606F\u4ECD\u4F1A\u8BB0\u5F55\u5728\u63D2\u4EF6\u9875\uFF0C\u4F46\u53EF\u80FD\u65E0\u6CD5\u5728\u804A\u5929\u5185\u4FDD\u7559 / \u53D8\u7EA2\u3002");let n=e.some(i=>i.label==="keep deleted message in store"&&!i.applied),o=e.some(i=>i.label==="declare deleted field on message record"&&!i.applied);if(n||o)try{let s=["MESSAGE_DELETE:function","MESSAGE_DELETE(","MESSAGE_DELETE_BULK"].map(l=>{let d=dt(l,220);return d.startsWith("<no loaded factory")||d.startsWith("<webpack")?"":`\u3010${l}\u3011${d}`}).filter(Boolean).join("  ||  ").replace(/\s+/g," "),c=s.length>3800?s.slice(0,3800)+" \u2026(\u622A\u65AD)":s;E.warn("MESSAGE_DELETE \u5904\u7406\u5668\u771F\u5B9E\u6E90\u7801\u5207\u7247\uFF08\u8865\u4E01\u672A\u547D\u4E2D\uFF0C\u7528\u4E8E\u4FEE\u6B63\uFF0C\u8BF7\u6574\u6BB5\u53D1\u7ED9\u5F00\u53D1\u8005\uFF09\uFF1A"+(c||"\u672A\u5728\u5DF2\u52A0\u8F7D\u6A21\u5757\u4E2D\u627E\u5230 MESSAGE_DELETE \u5904\u7406\u5668\uFF1B\u8BF7\u5148\u6253\u5F00\u4E00\u4E2A\u9891\u9053\u540E\u518D\u67E5\u770B\u65E5\u5FD7\u3002"))}catch(i){E.error("could not dump MESSAGE_DELETE handler shape",i)}}var ei=T({id:"message-logger",name:"\u6D88\u606F\u8BB0\u5F55\u5668",description:"\u4FDD\u7559\u88AB\u5220\u9664\u7684\u6D88\u606F\u4E0E\u7F16\u8F91\u5386\u53F2\uFF0C\u53EF\u6309\u7528\u6237\u6216\u9891\u9053\u5FFD\u7565\uFF0C\u652F\u6301\u5BFC\u51FA\u3002",authors:[{name:"caitemm"}],category:"utility",settings:M,page:{title:"\u6D88\u606F\u8BB0\u5F55",icon:Br,component:jo},patches:[{label:"keep deleted message in store",find:'"MessageStore"',replacement:[{match:/(?<=MESSAGE_DELETE:function\(([A-Za-z_$][\w$]*)\)\{)(?=let.{0,100}?([A-Za-z_$][\w$]*\.[A-Za-z_$][\w$]*)\.getOrCreate)/,replace:"let cache=$2.getOrCreate($1.channelId);cache=$self.handleDelete(cache,$1,!1);$2.commit(cache);return;"},{match:/(?<=MESSAGE_DELETE_BULK:function\(([A-Za-z_$][\w$]*)\)\{)(?=let.{0,100}?([A-Za-z_$][\w$]*\.[A-Za-z_$][\w$]*)\.getOrCreate)/,replace:"let cache=$2.getOrCreate($1.channelId);cache=$self.handleDelete(cache,$1,!0);$2.commit(cache);return;"}]},{label:"tint deleted message row (base)",find:"Message must not be a thread starter message",replacement:{match:/([)\w$\]])\("li",\{(.+?),className:/,replace:'$1("li",{$2,className:($self.deletedClass(arguments[0])||"")+" "+'}},{label:"tint deleted message row",find:"childrenRepliedMessage",replacement:{match:/(className:)(\w+\(\)\((?:[^()"']|"[^"]*"|'[^']*'|\([^()]*\))*\))/,replace:'$1[$2,$self.deletedClass(arguments[0])].filter(Boolean).join(" ")'}},{label:"inline edit history",find:".SEND_FAILED,",replacement:{match:/\]:[\w$]+\.isUnsupported.{0,30}?,children:\[/,replace:"$&$self.renderEdits(arguments[0]),"}},{label:"re-render on deleted flag",find:".SEND_FAILED,",replacement:{match:/((\w+)\.editedTimestamp\?\.toString\(\)===(\w+)\.editedTimestamp\?\.toString\(\))/,replace:"$1&&$2.deleted===$3.deleted"}},{label:"declare deleted field on message record",find:/\}addReaction\(|addReaction\([\w$]+\)\{/,replacement:{match:/this\.customRenderedContent=(\w+)\.customRenderedContent,/,replace:"this.customRenderedContent=$1.customRenderedContent,this.deleted=$1.deleted||!1,this.editHistory=$1.editHistory||[],this.firstEditTimestamp=$1.firstEditTimestamp||this.editedTimestamp||this.timestamp,"}},{label:"carry deleted flag through message updates",find:/\.PREMIUM_REFERRAL\s*&&\s*\(/,replacement:{match:/(?<=null!=[\w$]+\.edited_timestamp\)return )[\w$]+\([\w$]+,\{reactions:([\w$]+)\.reactions[\s\S]{0,60}?\}\)/,replace:"Object.assign($&,{deleted:$1.deleted,editHistory:$1.editHistory,firstEditTimestamp:$1.firstEditTimestamp})"}}],start(){C.load(),C.setRetention(M.store.retention),En=M.subscribe("retention",e=>C.setRetention(e)),qo(),In=M.subscribe("deleteStyle",qo),wn=ws(),hs(),setTimeout(As,4e3),setTimeout(()=>{Mn>0?E.info(`recorder pulse OK \u2014 ${Mn} message action(s) observed so far`):E.error("recorder pulse FAILED \u2014 no message actions observed in 30s. The dispatcher hooks are not receiving events on this build. \u8BF7\u628A\u65E5\u5FD7\u9875\u91CC recorder on dispatcher \u5F00\u5934\u7684\u51E0\u884C\u53D1\u7ED9\u5F00\u53D1\u8005\u3002")},3e4)},stop(){wn?.(),wn=void 0,En?.(),En=void 0,In?.(),In=void 0,ps();try{for(let e of zn)document.documentElement?.classList.remove(`hc-mlog-${e}`)}catch{}C.flush(),E.info("stopped")},handleDelete(e,t,n){try{if(e==null||!n&&typeof e.has=="function"&&!e.has(t.id))return e;let o=M.store.keepDeletedInChat,i=64,a=s=>{let c=typeof e.get=="function"?e.get(s):void 0;if(!c)return;o&&!t.mlDeleted&&(c.flags&i)!==i&&!qe(String(t.channelId??t.channel_id??c.channel_id??""),c.author??{})?e=e.update(s,d=>d.set("deleted",!0)):e=e.remove(s)};if(n)for(let s of t.ids??[])a(s);else a(t.id)}catch(o){E.error("handleDelete failed; messages removed normally",o)}return e},deletedClass(e){try{let t=e?.message??e;if(!t)return"";let n=t.channel_id??t.channelId;return t.deleted===!0||n&&t.id&&C.isDeleted(String(n),String(t.id))?"hc-deleted":""}catch{return""}},renderEdits(e){try{let t=e?.message,n=t?.id,o=t?.channel_id??t?.channelId;if(!n||!o||qe(String(o),t?.author))return null;let i=C.getEdited().find(h=>h.id===String(n)&&h.channelId===String(o)),a=C.findDeleted(String(o),String(n)),s=!!(i&&i.history.length>0),c=!!a||t?.deleted===!0,l=t?.edited_timestamp??t?.editedTimestamp,d=l!=null||s,u=l!=null?Lt(l):i?.updatedAt;return!s&&!c&&!d?null:r.createElement(Cs,{history:i?.history,deletedAt:a?.deletedAt,editedAt:u,isDeleted:c,isEdited:d})}catch{return null}}});var ti=g("show-username"),ni=z({mode:{type:"select",default:"nick-user",label:"\u663E\u793A\u65B9\u5F0F",description:"\u6635\u79F0\u4E0E\u7528\u6237\u540D\u7684\u6392\u5217\u3002",options:[{value:"nick-user",label:"\u6635\u79F0\u5728\u524D\uFF0C\u7528\u6237\u540D\u5728\u540E"},{value:"user-nick",label:"\u7528\u6237\u540D\u5728\u524D\uFF0C\u6635\u79F0\u5728\u540E"},{value:"user-only",label:"\u53EA\u663E\u793A\u7528\u6237\u540D"}]},style:{type:"select",default:"muted",label:"\u7528\u6237\u540D\u6837\u5F0F",description:"\u9644\u52A0\u7684\u7528\u6237\u540D\u90E8\u5206\u7684\u89C6\u89C9\u6837\u5F0F\u3002",options:[{value:"muted",label:"\u7070\u8272\u5C0F\u5B57"},{value:"pill",label:"\u5706\u89D2\u80F6\u56CA"},{value:"at",label:"@ \u524D\u7F00"},{value:"paren",label:"\u62EC\u53F7\u5305\u88F9"}]},hideWhenSame:{type:"boolean",default:!0,label:"\u6635\u79F0\u76F8\u540C\u65F6\u9690\u85CF",description:"\u6635\u79F0\u4E0E\u7528\u6237\u540D\u4E00\u81F4\u65F6\u4E0D\u91CD\u590D\u663E\u793A\u3002"},inReplies:{type:"boolean",default:!1,label:"\u56DE\u590D\u9884\u89C8\u4E2D\u4E5F\u663E\u793A",description:"\u5728\u56DE\u590D\u5F15\u7528\u7684\u5C0F\u5B57\u6761\u4E2D\u4E5F\u9644\u52A0\u7528\u6237\u540D\u3002"}});function Ts(e){let{original:t}=e,n=ni.store,o=t.userOverride??t.message?.author,i=o?.username,a=t.author?.nick??o?.globalName??i??"",s=t.withMentionPrefix?"@":"";try{if(!i)return r.createElement(r.Fragment,null,s,a);if(t.isRepliedMessage&&!n.inReplies)return r.createElement(r.Fragment,null,s,a);if(n.hideWhenSame&&i.toLowerCase()===a.toLowerCase())return r.createElement(r.Fragment,null,s,a);let c=`hc-username hc-username--${n.style||"muted"}`,l=n.style==="at"?`@${i}`:n.style==="paren"?`\uFF08${i}\uFF09`:i;return n.mode==="user-only"?r.createElement(r.Fragment,null,s,i):n.mode==="user-nick"?r.createElement(r.Fragment,null,s,i," ",r.createElement("span",{className:c},a)):r.createElement(r.Fragment,null,s,a," ",r.createElement("span",{className:c},l))}catch(c){return ti.error("username render failed; falling back to the nick",c),r.createElement(r.Fragment,null,s,a)}}var ri=T({id:"show-username",name:"\u663E\u793A\u7528\u6237\u540D",description:"\u5728\u6635\u79F0\u65C1\u8FB9\u663E\u793A\u8D26\u53F7\u7528\u6237\u540D\uFF0C\u9632\u6B62\u6539\u540D\u5192\u5145\uFF0C\u652F\u6301\u591A\u79CD\u6837\u5F0F\u3002",authors:[{name:"caitemm"}],category:"appearance",settings:ni,patches:[{label:"message header username",find:'="SYSTEM_TAG"',replacement:{match:/(?<=onContextMenu:[\w$]+,children:)([\w$]+)\?(?=.{0,100}?user[Nn]ame:)/,replace:"$self.renderUsername(arguments[0]),_hcOld:$1?"}}],start(){ti.info("appending usernames to message headers")},stop(){},renderUsername(e){try{return r.createElement(Ts,{original:e})}catch{return e?.author?.nick??null}}});var R=z({acknowledgedRisk:{type:"boolean",default:!1,label:"\u6211\u5DF2\u4E86\u89E3\u5C01\u53F7\u98CE\u9669",description:"\u4E3B\u52A8\u8BA2\u9605\u9891\u9053\u5C5E\u4E8E\u81EA\u52A8\u5316\u884C\u4E3A\uFF0C\u53EF\u80FD\u8FDD\u53CD Discord \u670D\u52A1\u6761\u6B3E\u5E76\u5BFC\u81F4\u8D26\u53F7\u88AB\u5C01\u3002\u4EC5\u5728\u4F60\u5B8C\u5168\u7406\u89E3\u5E76\u81EA\u613F\u627F\u62C5\u98CE\u9669\u65F6\u5F00\u542F\u3002",hidden:!0},selectedGuilds:{type:"string-list",default:[],label:"\u76D1\u63A7\u7684\u670D\u52A1\u5668",description:"\u6309\u670D\u52A1\u5668 ID \u76D1\u63A7\u3002\u5EFA\u8BAE\u4ECE\u4E0B\u65B9\u7684\u670D\u52A1\u5668\u5217\u8868\u52FE\u9009\uFF0C\u800C\u4E0D\u662F\u624B\u586B\u3002",itemPlaceholder:"\u670D\u52A1\u5668 ID",hidden:!0}});var Dt=g("guild-monitor"),Ms=5*60*1e3,Xe,oi=()=>[];function Ps(e){try{let t=We.getChannels(e);if(!t||typeof t!="object")return[];let n=new Set;for(let o of Object.values(t))if(Array.isArray(o))for(let i of o){let a=i?.channel??i,s=a?.id;s!=null&&(a?.type===0||a?.type===5)&&n.add(String(s))}return[...n]}catch(t){return Dt.debug(`could not read channels for guild ${e}`,t),[]}}function $s(e){let t=mn;if(t)try{if(typeof t.subscribeToChannel=="function"){for(let n of Ps(e))t.subscribeToChannel(e,n);return}typeof t.subscribeToGuild=="function"&&t.subscribeToGuild(e)}catch(n){Dt.warn(`subscribe failed for guild ${e}`,n)}}function Bn(){let e=mn;return!!(e&&(typeof e.subscribeToChannel=="function"||typeof e.subscribeToGuild=="function"))}function jn(){let e=oi();if(e.length){for(let t of e)$s(t);Dt.debug(`refreshed subscriptions for ${e.length} guild(s)`)}}function ii(e){if(oi=e,Un(),!Bn()){Dt.warn("this Discord build exposes no guild-subscription action; monitoring is inactive");return}jn(),Xe=setInterval(jn,Ms)}function ai(){Xe&&jn()}function Un(){Xe&&(clearInterval(Xe),Xe=void 0)}function Gn(){try{let t=(wr("GuildStore")??U)?.getGuilds?.()??{};return Object.values(t).map(n=>({id:String(n?.id??""),name:String(n?.name??n?.id??"\u672A\u77E5\u670D\u52A1\u5668")})).filter(n=>n.id).sort((n,o)=>n.name.localeCompare(o.name,"zh-CN"))}catch{return[]}}function si(){let[e,t]=m(()=>Gn()),[n,o]=m(()=>[...R.store.selectedGuilds]),[i,a]=m(()=>R.store.acknowledgedRisk===!0),s=Bn();A(()=>{if(e.length===0){let u=setTimeout(()=>t(Gn()),400);return()=>clearTimeout(u)}},[e.length]);let c=u=>{o(u),R.store.selectedGuilds=u,ai()},l=u=>{c(n.includes(u)?n.filter(h=>h!==u):[...n,u])};return r.createElement("div",{className:"hc-stack"},r.createElement("div",{className:"hc-inline-note hc-inline-note--danger"},r.createElement(re,{size:18}),r.createElement("span",null,"\u4E3B\u52A8\u76D1\u63A7\u4F1A\u8BA2\u9605\u4F60\u5C1A\u672A\u6253\u5F00\u7684\u9891\u9053\uFF0C\u5C5E\u4E8E\u81EA\u52A8\u5316\u884C\u4E3A\uFF0C\u53EF\u80FD\u8FDD\u53CD Discord \u670D\u52A1\u6761\u6B3E\u5E76\u5BFC\u81F4",r.createElement("b",null,"\u8D26\u53F7\u88AB\u5C01\u7981"),"\u3002\u8BF7\u81EA\u884C\u627F\u62C5\u98CE\u9669\u3002")),r.createElement("div",{className:"hc-section"},r.createElement("div",{className:"hc-section__body"},r.createElement("div",{className:"hc-cell hc-cell--row"},r.createElement("div",{className:"hc-cell__main"},r.createElement("div",{className:"hc-cell__label"},"\u542F\u7528\u4E3B\u52A8\u76D1\u63A7"),r.createElement("div",{className:"hc-cell__desc"},"\u5F00\u542F\u540E\u624D\u80FD\u52FE\u9009\u4E0B\u65B9\u7684\u670D\u52A1\u5668\u3002")),r.createElement(B,{checked:i,onChange:u=>{a(u),R.store.acknowledgedRisk=u,u||c([])},"aria-label":"\u542F\u7528\u4E3B\u52A8\u76D1\u63A7"})))),!s&&r.createElement("div",{className:"hc-inline-note"},r.createElement(re,{size:18}),r.createElement("span",null,"\u5F53\u524D Discord \u7248\u672C\u672A\u66B4\u9732\u53EF\u7528\u7684\u8BA2\u9605\u63A5\u53E3\uFF0C\u76D1\u63A7\u6682\u65F6\u65E0\u6CD5\u751F\u6548\u3002")),r.createElement("div",{className:"hc-section"},r.createElement("div",{className:"hc-section__title",style:{display:"flex",justifyContent:"space-between"}},r.createElement("span",null,"\u670D\u52A1\u5668\uFF08",e.length,"\uFF09"),r.createElement("button",{type:"button",className:"hc-tab",onClick:()=>t(Gn()),style:{height:20,padding:"0 8px",textTransform:"none"}},r.createElement(fe,{size:12})," \u5237\u65B0")),e.length===0?r.createElement(V,{icon:r.createElement(yt,{size:48}),title:"\u6CA1\u6709\u8BFB\u5230\u670D\u52A1\u5668",subtitle:"\u7B49 Discord \u52A0\u8F7D\u5B8C\u6210\u540E\u70B9\u4E0A\u9762\u7684\u5237\u65B0\uFF0C\u6216\u7A0D\u540E\u518D\u6765\u3002"}):r.createElement("div",{className:"hc-section__body",style:{opacity:i?1:.5,pointerEvents:i?"auto":"none"}},e.map(u=>r.createElement("div",{className:"hc-cell hc-cell--row",key:u.id},r.createElement("div",{className:"hc-cell__main"},r.createElement("div",{className:"hc-cell__label"},u.name),r.createElement("div",{className:"hc-cell__desc"},u.id)),r.createElement(B,{checked:n.includes(u.id),onChange:()=>l(u.id),"aria-label":`\u76D1\u63A7 ${u.name}`}))))),n.length>0&&r.createElement("div",{className:"hc-savebar"},r.createElement("span",{className:"hc-savebar__label"},"\u6B63\u5728\u76D1\u63A7 ",n.length," \u4E2A\u670D\u52A1\u5668"),r.createElement("div",{className:"hc-savebar__actions"},r.createElement(S,{size:"sm",variant:"destructive",onClick:()=>c([])},"\u5168\u90E8\u53D6\u6D88"))))}var Ls=g("guild-monitor");function ci(){if(R.store.acknowledgedRisk!==!0)return[];let e=R.store.selectedGuilds;return Array.isArray(e)?e:[]}var li=T({id:"guild-monitor",name:"\u670D\u52A1\u5668\u76D1\u63A7",description:"\u4E3B\u52A8\u8BA2\u9605\u9009\u5B9A\u670D\u52A1\u5668\u7684\u9891\u9053\uFF0C\u6355\u6349\u672A\u6253\u5F00\u9891\u9053\u91CC\u7684\u6D88\u606F\uFF08\u6709\u5C01\u53F7\u98CE\u9669\uFF0C\u9ED8\u8BA4\u5173\u95ED\uFF09\u3002",authors:[{name:"caitemm"}],category:"privacy",settings:R,page:{title:"\u76D1\u63A7",icon:Xr,component:si},start(){ii(ci);let e=ci().length;e>0&&Ls.info(`monitoring ${e} guild(s)`)},stop(){Un()}});var be=z({order:{group:"\u9ED8\u8BA4\u53C2\u6570",type:"select",default:"desc",label:"\u6E05\u7406\u65B9\u5411",description:"\u53D7\u6761\u6570\u9650\u5236\u65F6\uFF0C\u4F18\u5148\u4ECE\u54EA\u4E00\u7AEF\u5F00\u59CB\u5220\u3002",options:[{value:"desc",label:"\u4ECE\u65B0\u5230\u8001"},{value:"asc",label:"\u4ECE\u8001\u5230\u65B0"}]},limit:{group:"\u9ED8\u8BA4\u53C2\u6570",type:"number",default:100,label:"\u6700\u591A\u5904\u7406\u6761\u6570",description:"\u5355\u6B21\u9884\u89C8 / \u5220\u9664\u7684\u4E0A\u9650\u3002",min:1,max:5e3,step:50},delayMs:{group:"\u9ED8\u8BA4\u53C2\u6570",type:"number",default:1600,label:"\u5220\u9664\u95F4\u9694\uFF08\u6BEB\u79D2\uFF09",description:"\u4E24\u6B21\u5220\u9664\u4E4B\u95F4\u7684\u7B49\u5F85\uFF0C\u592A\u5FEB\u4F1A\u89E6\u53D1\u9650\u901F\uFF0C\u5EFA\u8BAE\u4E0D\u4F4E\u4E8E 1000\u3002",min:300,max:3e4,step:100},confirmBeforeDelete:{group:"\u9ED8\u8BA4\u53C2\u6570",type:"boolean",default:!0,label:"\u5220\u9664\u524D\u4E8C\u6B21\u786E\u8BA4",description:"\u70B9\u300C\u5220\u9664\u300D\u540E\u5F39\u51FA\u786E\u8BA4\u6846\uFF0C\u907F\u514D\u8BEF\u5220\u3002"}});var Ds=g("message-cleaner"),Os="https://discord.com/api/v10",Hn=new Set,Te=e=>new Promise(t=>setTimeout(t,e)),zs=1420070400000n,Ot=e=>String(BigInt(e.getTime())-zs<<22n);function Fn(){try{let e=window.webpackChunkdiscord_app;if(Array.isArray(e)){let t=null;if(e.push([[Symbol()],{},n=>{for(let o of Object.keys(n.m||{}))try{for(let i of[n(o),n(o)?.default])if(i&&typeof i.getToken=="function"){let a=i.getToken();if(a&&a.length>20){t=a;return}}}catch{}}]),t)return t}}catch{}try{let e=window.localStorage.getItem("token");if(e)return e.replace(/^"|"$/g,"")}catch{}return null}async function J(e,t,n={},o=0){let i;try{i=await fetch(Os+t,{...n,headers:{Authorization:e,"Content-Type":"application/json",...n.headers||{}}})}catch(a){if(o<5)return await Te(3e3),J(e,t,n,o+1);throw new Error(`\u7F51\u7EDC\u8BF7\u6C42\u5931\u8D25: ${a.message}`)}if(i.status===429){let a=await i.json().catch(()=>({})),s=a.retry_after?Math.ceil(Number(a.retry_after)*1e3):Math.pow(2,o)*1e3;if(o<5)return await Te(s+500),J(e,t,n,o+1);throw new Error("\u89E6\u53D1\u9650\u901F\u4E14\u91CD\u8BD5\u6B21\u6570\u8017\u5C3D\u3002")}if(!i.ok){let a=await i.text().catch(()=>"");throw new Error(`API ${i.status}: ${a.slice(0,120)}`)}return i.status===204?null:i.json()}async function Kn(e){let t=await J(e,"/users/@me");if(!t?.id)throw new Error("\u65E0\u6CD5\u901A\u8FC7 Token \u83B7\u53D6\u8D26\u53F7\u4FE1\u606F\uFF0C\u8BF7\u68C0\u67E5 Token \u662F\u5426\u6709\u6548\u3002");return String(t.id)}function di(){try{let e=location.pathname.match(/\/channels\/(\d{15,25}|@me)\/(\d{15,25})/);return e?{guildId:e[1],channelId:e[2],serverWide:!1}:null}catch{return null}}async function ui(e){let t=await J(e,"/users/@me/guilds");return Array.isArray(t)?t.map(n=>({id:String(n.id),name:n.name??"\u672A\u77E5",icon:n.icon??null})):[]}async function hi(e,t){if(t==="@me"){let o=await J(e,"/users/@me/channels");return Array.isArray(o)?o.map(i=>{let a=i.name||(Array.isArray(i.recipients)?i.recipients.map(s=>s.global_name||s.username).join("\u3001"):"")||"\u672A\u77E5\u79C1\u804A";return{id:String(i.id),name:a,type:i.type??1}}):[]}let n=await J(e,`/guilds/${t}/channels`);return Array.isArray(n)?n.filter(o=>o.type!==4).map(o=>({id:String(o.id),name:o.name??"\u672A\u77E5",type:o.type??0})):[]}async function pi(e,t,n,o,i){let a=[];if(t.serverWide&&t.guildId&&t.guildId!=="@me"){let c=0;for(;a.length<t.limit&&!i.stopped;){o("\u5168\u670D\u68C0\u7D22\u4E2D",`\u5DF2\u627E\u5230 ${a.length} \u6761\uFF08\u641C\u7D22\u63A5\u53E3\u8F83\u6162\uFF0C\u8BF7\u7A0D\u5019\uFF09`);let l=new URLSearchParams({author_id:n,offset:String(c),include_nsfw:"true",sort_order:t.order==="asc"?"asc":"desc"});t.after&&l.set("min_id",Ot(t.after)),t.before&&l.set("max_id",Ot(t.before));let d;try{d=await J(e,`/guilds/${t.guildId}/messages/search?${l}`)}catch(u){throw new Error(`\u5168\u670D\u68C0\u7D22\u5931\u8D25\uFF1A${u.message}`)}if(d?.message==="Indexing"){o("\u5EFA\u7ACB\u7D22\u5F15\u4E2D","Discord \u6B63\u5728\u5EFA\u7ACB\u5168\u670D\u7D22\u5F15\uFF0C10 \u79D2\u540E\u81EA\u52A8\u91CD\u8BD5\u2026"),await Te(1e4);continue}if(!d?.messages||d.messages.length===0)break;for(let u of d.messages){let h=u.find(y=>y?.hit)??u.find(y=>y?.author?.id===n)??u[0];if(!(!h||h.author?.id!==n||Hn.has(h.id))&&(a.push({id:h.id,channelId:h.channel_id,content:h.content??"",timestamp:h.timestamp}),a.length>=t.limit))break}if(d.messages.length<25)break;c+=d.messages.length,await Te(1200)}return a}if(!t.channelId)throw new Error("\u8BF7\u586B\u5199\u9891\u9053 ID\uFF0C\u6216\u5F00\u542F\u300C\u5168\u670D\u626B\u63CF\u300D\u5E76\u586B\u5199\u670D\u52A1\u5668 ID\u3002");let s=null;for(t.order==="desc"?s=t.before?Ot(t.before):null:s=t.after?Ot(t.after):"0";a.length<t.limit&&!i.stopped;){let c=new URLSearchParams({limit:"100"});s&&c.set(t.order==="desc"?"before":"after",s);let l;try{l=await J(e,`/channels/${t.channelId}/messages?${c}`)}catch(d){throw new Error(`\u8BFB\u53D6\u9891\u9053\u6D88\u606F\u5931\u8D25\uFF1A${d.message}`)}if(!Array.isArray(l)||l.length===0)break;for(let d of l){let u=new Date(d.timestamp);if(t.order==="desc"&&t.after&&u<t.after||t.order==="asc"&&t.before&&u>t.before)return a;let h=(!t.after||u>=t.after)&&(!t.before||u<=t.before);if(d.author?.id===n&&h&&!Hn.has(d.id)&&(a.push({id:d.id,channelId:d.channel_id??t.channelId,content:d.content??"",timestamp:d.timestamp}),a.length>=t.limit))break}s=l[l.length-1].id,o("\u626B\u63CF\u4E2D",`\u5DF2\u627E\u5230 ${a.length} \u6761`),await Te(150)}return a}async function fi(e,t,n,o,i){let a=0,s=0;for(let c of t){if(i.stopped)break;let l=Date.now();try{await J(e,`/channels/${c.channelId||n.channelId}/messages/${c.id}`,{method:"DELETE"}),a++}catch(u){s++,String(u?.message??"").includes("404")||Hn.add(c.id),Ds.warn(`skip ${c.id}: ${u?.message??u}`)}o("\u5220\u9664\u4E2D",`\u5DF2\u5220\u9664 ${a} / ${t.length}${s?`\uFF08\u8DF3\u8FC7 ${s}\uFF09`:""}`);let d=Date.now()-l;d<n.delayMs&&await Te(n.delayMs-d)}return{deleted:a,skipped:s}}async function mi(e,t,n){let o,i=new URLSearchParams({author_id:n,include_nsfw:"true"});if(t.serverWide&&t.guildId&&t.guildId!=="@me")o=`/guilds/${t.guildId}/messages/search?${i}`;else if(t.channelId)o=`/channels/${t.channelId}/messages/search?${i}`;else if(t.guildId&&t.guildId!=="@me")o=`/guilds/${t.guildId}/messages/search?${i}`;else throw new Error("\u8BF7\u586B\u5199\u670D\u52A1\u5668 ID \u6216\u9891\u9053 ID\u3002");let a=await J(e,o);return a?.message==="Indexing"?{total:0,indexing:!0}:{total:a?.total_results??0,indexing:!1}}var gi=g("message-cleaner");function js(e){let t=new Date(e);if(Number.isNaN(t.getTime()))return"";let n=o=>String(o).padStart(2,"0");return`${n(t.getMonth()+1)}-${n(t.getDate())} ${n(t.getHours())}:${n(t.getMinutes())}`}function yi(){let[e,t]=m(""),[n,o]=m(""),[i,a]=m(""),[s,c]=m(!1),[l,d]=m(""),[u,h]=m(""),[y,$]=m(be.store.order),[j,G]=m(!1),[p,b]=m("idle"),[k,L]=m([]),[rt,Rn]=m("\u5F85\u673A"),[er,tr]=m("\u5148\u83B7\u53D6 Token\uFF0C\u9009\u597D\u8303\u56F4\u5E76\u9884\u89C8\uFF0C\u786E\u8BA4\u540E\u518D\u5220\u9664\u3002"),[nr,rr]=m(null),[Xi,Vt]=m(!1),[Zi,Qi]=m([]),[or,ir]=m([]),[Wt,Jt]=m("guilds"),[ar,Ri]=m(""),[ea,ot]=m(!1),[sr,it]=m(""),de=he({stopped:!1}),Pe=p!=="idle";A(()=>{let f=Fn();f&&(t(f),Rn("\u5DF2\u83B7\u53D6 Token"),tr("\u53EF\u70B9\u51FB\u300C\u5217\u8868\u300D\u9009\u62E9\u9891\u9053\uFF0C\u6216\u624B\u52A8\u586B\u5199 ID\u3002"))},[]);let _=(f,I)=>{Rn(f),tr(I)},$e=()=>{let f=e.trim();if(!f)throw new Error("\u8BF7\u5148\u83B7\u53D6\u6216\u586B\u5165 Token\u3002");return f},cr=()=>({guildId:n.trim(),channelId:s?"":i.trim(),serverWide:s,order:y,limit:be.store.limit,delayMs:be.store.delayMs,after:l?new Date(l):null,before:u?new Date(u):null}),ta=()=>{let f=Fn();f?(t(f),_("Token \u5DF2\u83B7\u53D6","\u53EF\u70B9\u51FB\u300C\u5217\u8868\u300D\u9009\u62E9\u9891\u9053\u3002")):_("\u83B7\u53D6\u5931\u8D25","\u8BF7\u624B\u52A8\u7C98\u8D34 Token\u3002")},na=()=>{let f=di();if(!f){_("\u65E0\u6CD5\u8BFB\u53D6","\u5F53\u524D\u4E0D\u5728\u67D0\u4E2A\u9891\u9053/\u79C1\u4FE1\u9875\u9762\u3002");return}o(f.guildId),a(f.channelId),c(!1),_("\u5DF2\u586B\u5165\u5F53\u524D\u9891\u9053",`\u670D\u52A1\u5668 ${f.guildId} \xB7 \u9891\u9053 ${f.channelId}`)},ra=async()=>{let f;try{f=$e()}catch(I){_("\u9700\u8981 Token",I.message);return}Vt(!0),Jt("guilds"),ir([]),it(""),ot(!0);try{let I=await ui(f);Qi([{id:"@me",name:"\u79C1\u4FE1\u4E0E\u7FA4\u804A (DMs)",icon:null},...I])}catch(I){it(I.message??String(I))}finally{ot(!1)}},lr=async f=>{let I;try{I=$e()}catch(v){_("\u9700\u8981 Token",v.message);return}Ri(f.name),Jt("channels"),it(""),ot(!0);try{let v=await hi(I,f.id),N=f.id==="@me"?v:[{id:"",name:"\u2500\u2500 \u5168\u670D\u626B\u63CF\uFF08\u4E0D\u9650\u9891\u9053\uFF09\u2500\u2500",type:-1},...v];ir(N)}catch(v){it(v.message??String(v))}finally{ot(!1)}},dr=f=>{f.id?(c(!1),a(f.id)):(c(!0),a("")),Vt(!1),_("\u5DF2\u9009\u62E9",`${ar} \u2192 ${f.name||"\u5168\u670D"}`)},oa=()=>{let f=new Date;f.setMinutes(f.getMinutes()-f.getTimezoneOffset()),h(f.toISOString().slice(0,16))},ia=async()=>{let f;try{f=$e()}catch(N){_("\u5931\u8D25",N.message);return}let I;try{I=await Kn(f)}catch(N){_("\u5931\u8D25",N.message);return}let v=cr();if(v.serverWide&&(!v.guildId||v.guildId==="@me")){_("\u5931\u8D25","\u5168\u670D\u626B\u63CF\u9700\u8981\u586B\u5199\u670D\u52A1\u5668 ID\u3002");return}if(!v.serverWide&&!v.channelId){_("\u5931\u8D25","\u8BF7\u586B\u5199\u9891\u9053 ID\uFF0C\u6216\u6539\u7528\u5168\u670D\u626B\u63CF\u3002");return}if(v.after&&v.before&&v.after>=v.before){_("\u5931\u8D25","\u8D77\u59CB\u65F6\u95F4\u5FC5\u987B\u65E9\u4E8E\u7ED3\u675F\u65F6\u95F4\u3002");return}de.current={stopped:!1},b("previewing"),L([]),_("\u9884\u89C8\u4E2D","\u6B63\u5728\u626B\u63CF\u4F60\u7684\u6D88\u606F\u2026");try{let N=await pi(f,v,I,_,de.current);L(N),_(de.current.stopped?"\u5DF2\u505C\u6B62":"\u9884\u89C8\u5B8C\u6210",`\u627E\u5230 ${N.length} \u6761\u4F60\u7684\u6D88\u606F\u3002`)}catch(N){_("\u5931\u8D25",N.message??String(N)),gi.error("preview failed",N)}finally{b("idle")}},aa=async()=>{if(k.length===0){_("\u8BF7\u5148\u9884\u89C8","");return}if(be.store.confirmBeforeDelete&&!window.confirm(`\u5C06\u5220\u9664 ${k.length} \u6761\u6D88\u606F\uFF0C\u5220\u9664\u4E0D\u53EF\u6062\u590D\uFF0C\u786E\u8BA4\u7EE7\u7EED\uFF1F`))return;let f;try{f=$e()}catch(v){_("\u5931\u8D25",v.message);return}let I=cr();de.current={stopped:!1},b("deleting"),_("\u5220\u9664\u4E2D",`0 / ${k.length}`);try{let v=await fi(f,k,I,_,de.current);_(de.current.stopped?"\u5DF2\u505C\u6B62":"\u5B8C\u6210",`\u5DF2\u5220\u9664 ${v.deleted} \u6761${v.skipped?`\uFF0C\u8DF3\u8FC7 ${v.skipped} \u6761`:""}\u3002`),L([])}catch(v){_("\u5931\u8D25",v.message??String(v)),gi.error("delete failed",v)}finally{b("idle")}},ur=()=>{de.current.stopped=!0,_("\u505C\u6B62\u4E2D","\u7B49\u5F85\u5F53\u524D\u8BF7\u6C42\u7ED3\u675F\u2026")},sa=async()=>{let f;try{f=$e()}catch(N){_("\u5931\u8D25",N.message);return}let I;try{I=await Kn(f)}catch(N){_("\u5931\u8D25",N.message);return}let v={guildId:n.trim(),channelId:s?"":i.trim(),serverWide:s};rr(null),_("\u7EDF\u8BA1\u4E2D","\u8C03\u7528\u641C\u7D22\u63A5\u53E3\u2026");try{let N=await mi(f,v,I);if(N.indexing){_("\u5EFA\u7ACB\u7D22\u5F15\u4E2D","Discord \u6B63\u5728\u5EFA\u7ACB\u7D22\u5F15\uFF0C\u7A0D\u540E\u518D\u8BD5\u3002");return}rr(N.total),_("\u7EDF\u8BA1\u5B8C\u6210",`\u5171 ${N.total} \u6761\u53D1\u8A00\u3002`)}catch(N){_("\u5931\u8D25",N.message??String(N))}};return Xi?r.createElement("div",{className:"hc-cleaner"},r.createElement("div",{className:"hc-cleaner__picker-head"},Wt==="channels"&&r.createElement(S,{size:"sm",variant:"plain",onClick:()=>Jt("guilds")},"\u2190 \u8FD4\u56DE"),r.createElement("span",{className:"hc-cleaner__picker-title"},Wt==="guilds"?"\u9009\u62E9\u670D\u52A1\u5668":ar),r.createElement(S,{size:"sm",variant:"plain",onClick:()=>Vt(!1)},"\u2715")),r.createElement("div",{className:"hc-cleaner__picker-list"},ea?r.createElement("div",{className:"hc-cleaner__picker-empty"},"\u6B63\u5728\u52A0\u8F7D\u2026"):sr?r.createElement("div",{className:"hc-cleaner__picker-empty hc-cleaner__picker-empty--error"},"\u52A0\u8F7D\u5931\u8D25\uFF1A",sr):Wt==="guilds"?Zi.map(f=>r.createElement("div",{key:f.id,className:"hc-cleaner__picker-item",onClick:()=>lr(f),role:"button",tabIndex:0,onKeyDown:I=>{I.key==="Enter"&&lr(f)}},r.createElement("div",{className:"hc-cleaner__picker-icon"},f.icon?r.createElement("img",{src:`https://cdn.discordapp.com/icons/${f.id}/${f.icon}.png?size=64`,alt:""}):f.name.charAt(0)),r.createElement("div",{className:"hc-cleaner__picker-name"},f.name))):or.length===0?r.createElement("div",{className:"hc-cleaner__picker-empty"},"\u6B64\u670D\u52A1\u5668\u6682\u65E0\u9891\u9053\uFF0C\u53EF\u624B\u52A8\u586B\u5199\u9891\u9053 ID\u3002"):or.map(f=>r.createElement("div",{key:f.id||"server-wide",className:"hc-cleaner__picker-item",onClick:()=>dr(f),role:"button",tabIndex:0,onKeyDown:I=>{I.key==="Enter"&&dr(f)}},r.createElement("div",{className:"hc-cleaner__picker-icon"},f.id?"#":"\u{1F310}"),r.createElement("div",{className:"hc-cleaner__picker-name"},f.name))))):r.createElement("div",{className:"hc-cleaner"},r.createElement("div",{className:"hc-inline-note hc-inline-note--danger"},r.createElement(re,{size:18}),r.createElement("span",null,"\u5220\u9664\u4E0D\u53EF\u6062\u590D\uFF0C\u4E14\u53EA\u4F1A\u5220\u9664",r.createElement("strong",null,"\u4F60\u81EA\u5DF1"),"\u53D1\u9001\u7684\u6D88\u606F\u3002\u8BF7\u52A1\u5FC5\u5148\u9884\u89C8\u786E\u8BA4\u3002")),r.createElement(P,{title:"Token"},r.createElement("div",{className:"hc-cell"},r.createElement("div",{className:"hc-cell--row"},r.createElement("div",{className:"hc-cell__main"},r.createElement("div",{className:"hc-cell__label"},"Discord Token"),r.createElement("div",{className:"hc-cell__desc"},"\u4EE3\u8868\u4F60\u7684\u8D26\u53F7\u6743\u9650\uFF0C\u4E0D\u8981\u6CC4\u9732\u7ED9\u4EFB\u4F55\u4EBA\u3002")),r.createElement(S,{size:"sm",variant:"secondary",icon:r.createElement(fe,{size:16}),onClick:ta},"\u81EA\u52A8")),r.createElement("div",{className:"hc-cell__control"},r.createElement(X,{value:e,onChange:t,placeholder:"\u81EA\u52A8\u586B\u5165\u6216\u624B\u52A8\u7C98\u8D34",type:"password"})))),r.createElement(P,{title:"\u8303\u56F4"},r.createElement("div",{className:"hc-cell hc-cell--row"},r.createElement("div",{className:"hc-cell__main"},r.createElement("div",{className:"hc-cell__label"},"\u5168\u670D\u626B\u63CF"),r.createElement("div",{className:"hc-cell__desc"},"\u5FFD\u7565\u9891\u9053\uFF0C\u626B\u63CF\u6574\u4E2A\u670D\u52A1\u5668\uFF08\u8D70\u641C\u7D22\u63A5\u53E3\uFF0C\u8F83\u6162\uFF09\u3002")),r.createElement(B,{checked:s,onChange:c,"aria-label":"\u5168\u670D\u626B\u63CF"})),r.createElement("div",{className:"hc-cell"},r.createElement("div",{className:"hc-cell--row"},r.createElement("div",{className:"hc-cell__main"},r.createElement("div",{className:"hc-cell__label"},"\u670D\u52A1\u5668 ID"))),r.createElement("div",{className:"hc-cell__control"},r.createElement(X,{value:n,onChange:o,placeholder:"\u670D\u52A1\u5668 ID"}))),!s&&r.createElement("div",{className:"hc-cell"},r.createElement("div",{className:"hc-cell--row"},r.createElement("div",{className:"hc-cell__main"},r.createElement("div",{className:"hc-cell__label"},"\u9891\u9053 ID"))),r.createElement("div",{className:"hc-cell__control"},r.createElement(X,{value:i,onChange:a,placeholder:"\u9891\u9053 ID"}))),r.createElement("div",{className:"hc-cell hc-cell--row",style:{gap:"var(--hc-space-2)"}},r.createElement(S,{size:"sm",variant:"secondary",icon:r.createElement(yt,{size:16}),onClick:ra,disabled:Pe},"\u5217\u8868"),r.createElement(S,{size:"sm",variant:"secondary",icon:r.createElement(oe,{size:16}),onClick:na,disabled:Pe},"\u5F53\u524D"))),r.createElement(P,{title:"\u65F6\u95F4\u8303\u56F4",note:"\u53EF\u9009\u3002\u7559\u7A7A\u8868\u793A\u4E0D\u9650\u5236\u8BE5\u65B9\u5411\u3002"},r.createElement("div",{className:"hc-cell"},r.createElement("div",{className:"hc-cell--row"},r.createElement("div",{className:"hc-cell__main"},r.createElement("div",{className:"hc-cell__label"},"\u8D77\u59CB\u65F6\u95F4"))),r.createElement("div",{className:"hc-cell__control"},r.createElement("input",{className:"hc-input",type:"datetime-local",value:l,onChange:f=>d(f.currentTarget.value)}))),r.createElement("div",{className:"hc-cell"},r.createElement("div",{className:"hc-cell--row"},r.createElement("div",{className:"hc-cell__main"},r.createElement("div",{className:"hc-cell__label"},"\u7ED3\u675F\u65F6\u95F4")),r.createElement(S,{size:"sm",variant:"plain",onClick:oa},"\u540C\u6B65\u6700\u65B0")),r.createElement("div",{className:"hc-cell__control"},r.createElement("input",{className:"hc-input",type:"datetime-local",value:u,onChange:f=>h(f.currentTarget.value)})))),r.createElement(P,{title:"\u65B9\u5411"},r.createElement("div",{className:"hc-cell hc-cell--row"},r.createElement("div",{className:"hc-cell__main"},r.createElement("div",{className:"hc-cell__label"},"\u6E05\u7406\u65B9\u5411")),r.createElement(bt,{value:y,onChange:$,options:[{value:"desc",label:"\u4ECE\u65B0\u5230\u8001"},{value:"asc",label:"\u4ECE\u8001\u5230\u65B0"}]}))),r.createElement(P,{title:"\u786E\u8BA4",note:"\u5220\u9664\u662F\u4E0D\u53EF\u9006\u64CD\u4F5C\uFF0C\u8BF7\u5148\u9884\u89C8\u518D\u5220\u9664\u3002"},r.createElement("div",{className:"hc-cell hc-cell--row"},r.createElement("div",{className:"hc-cell__main"},r.createElement("div",{className:"hc-cell__label"},"\u6211\u786E\u8BA4\u53EA\u5220\u9664\u81EA\u5DF1\u7684\u6D88\u606F\uFF0C\u4E14\u660E\u767D\u4E0D\u53EF\u6062\u590D")),r.createElement(B,{checked:j,onChange:G,"aria-label":"\u786E\u8BA4"}))),r.createElement("div",{className:"hc-cleaner__actions"},p==="previewing"?r.createElement(S,{variant:"destructive",onClick:ur},"\u505C\u6B62\u9884\u89C8"):r.createElement(S,{variant:"primary",icon:r.createElement(xe,{size:16}),disabled:Pe,onClick:ia},"\u9884\u89C8"),p==="deleting"?r.createElement(S,{variant:"destructive",onClick:ur},"\u505C\u6B62\u5220\u9664"):r.createElement(S,{variant:"destructive",icon:r.createElement(Y,{size:16}),disabled:Pe||!j||k.length===0,onClick:aa},"\u5220\u9664\u9884\u89C8\uFF08",k.length,"\uFF09")),r.createElement("div",{className:"hc-cleaner__status"},r.createElement("div",{className:"hc-cleaner__status-state"},rt),er&&r.createElement("div",{className:"hc-cleaner__status-detail"},er)),k.length>0&&r.createElement(P,{title:`\u9884\u89C8\u7ED3\u679C\uFF08${k.length}\uFF09`},r.createElement("div",{className:"hc-cleaner__list"},k.slice(0,50).map(f=>r.createElement("div",{className:"hc-cleaner__item",key:f.id},r.createElement("span",{className:"hc-cleaner__item-time"},js(f.timestamp)),r.createElement("span",{className:"hc-cleaner__item-text"},f.content.trim()||"\uFF08\u65E0\u6587\u672C\u5185\u5BB9\uFF09"))),k.length>50&&r.createElement("div",{className:"hc-cleaner__more"},"\u2026\u8FD8\u6709 ",k.length-50," \u6761\u672A\u5C55\u793A"))),r.createElement(P,{title:"\u7EDF\u8BA1",note:"\u7EDF\u8BA1\u4F60\u5728\u6240\u9009\u8303\u56F4\u5185\u7684\u5386\u53F2\u53D1\u8A00\u603B\u6570\uFF08\u8C03\u7528\u641C\u7D22\u63A5\u53E3\uFF09\u3002"},r.createElement("div",{className:"hc-cell"},r.createElement(S,{size:"sm",variant:"secondary",icon:r.createElement(xe,{size:16}),disabled:Pe,onClick:sa},"\u7EDF\u8BA1\u6211\u7684\u53D1\u8A00\u6570")),nr!=null&&r.createElement("div",{className:"hc-cell hc-cleaner__stat"},r.createElement("span",{className:"hc-cleaner__stat-num"},nr),r.createElement("span",{className:"hc-cleaner__stat-unit"},"\u6761"))))}var Bs=g("message-cleaner"),bi=T({id:"message-cleaner",name:"\u6D88\u606F\u6E05\u7406",description:"\u6279\u91CF\u5220\u9664\u4F60\u81EA\u5DF1\u5728\u67D0\u4E2A\u9891\u9053\u6216\u6574\u4E2A\u670D\u52A1\u5668\u7684\u5386\u53F2\u6D88\u606F\uFF08\u81EA\u52A9\u51B2\u6C34\u673A\uFF09\u3002\u5148\u9884\u89C8\u518D\u5220\u9664\uFF0C\u4EC5\u9650\u672C\u4EBA\u6D88\u606F\uFF0C\u5220\u9664\u4E0D\u53EF\u6062\u590D\u3002",authors:[{name:"caitemm"},{name:"catie"}],category:"privacy",settings:be,page:{title:"\u6E05\u7406",icon:Y,component:yi},start(){Bs.info("message-cleaner ready")},stop(){}});var q=g("fake-nitro"),Me=z({enableEmojiBypass:{group:"\u8868\u60C5",type:"boolean",default:!0,label:"\u7ED5\u8FC7\u8868\u60C5\u9650\u5236",description:"\u53D1\u9001\u4F60\u6CA1\u6709 Nitro \u6743\u9650\u7684\u81EA\u5B9A\u4E49\u8868\u60C5\uFF08\u8DE8\u670D / \u52A8\u6001\u8868\u60C5\uFF09\u65F6\uFF0C\u81EA\u52A8\u6539\u4E3A\u53D1\u9001\u8BE5\u8868\u60C5\u7684\u56FE\u7247\u94FE\u63A5\u3002"},emojiSize:{group:"\u8868\u60C5",type:"select",default:"48",label:"\u8868\u60C5\u56FE\u7247\u5C3A\u5BF8",description:"\u5185\u8054\u8868\u60C5\u56FE\u7247\u7684\u8FB9\u957F\uFF08\u50CF\u7D20\uFF09\u3002\u8D8A\u5927\u8D8A\u6E05\u6670\u3001\u5360\u7528\u8D8A\u5927\u3002",options:[{value:"32",label:"32"},{value:"48",label:"48\uFF08\u9ED8\u8BA4\uFF09"},{value:"64",label:"64"},{value:"128",label:"128"},{value:"256",label:"256"},{value:"512",label:"512"}]},enableStickerBypass:{group:"\u8D34\u7EB8",type:"boolean",default:!0,label:"\u7ED5\u8FC7\u8D34\u7EB8\u9650\u5236",description:"\u53D1\u9001\u9501\u5B9A\u7684\u8D34\u7EB8\u65F6\u6539\u4E3A\u53D1\u9001\u8D34\u7EB8\u56FE\u7247\u94FE\u63A5\u3002Lottie\uFF08\u77E2\u91CF\uFF09\u8D34\u7EB8\u65E0\u6CD5\u5185\u8054\uFF0C\u4F1A\u8DF3\u8FC7\u3002"},stickerSize:{group:"\u8D34\u7EB8",type:"select",default:"160",label:"\u8D34\u7EB8\u56FE\u7247\u5C3A\u5BF8",description:"\u5185\u8054\u8D34\u7EB8\u56FE\u7247\u7684\u8FB9\u957F\uFF08\u50CF\u7D20\uFF09\u3002",options:[{value:"32",label:"32"},{value:"64",label:"64"},{value:"128",label:"128"},{value:"160",label:"160\uFF08\u9ED8\u8BA4\uFF09"},{value:"256",label:"256"},{value:"512",label:"512"}]},enableStreamQualityBypass:{group:"\u76F4\u64AD",type:"boolean",default:!0,label:"\u89E3\u9501\u76F4\u64AD\u753B\u8D28",description:"\u5141\u8BB8\u4EE5 Nitro \u753B\u8D28\u8FDB\u884C\u5C4F\u5E55\u5171\u4EAB\u76F4\u64AD\uFF08\u9700\u91CD\u542F\u5BA2\u6237\u7AEF\u751F\u6548\uFF0C\u56E0\u4E3A\u8FD9\u662F\u6E90\u7801\u7EA7 patch\uFF09\u3002"}}),Us=x(e=>e?.getName?.()==="EmojiStore"),Gs=x(e=>e?.getName?.()==="StickersStore"),Hs=x(e=>e?.getName?.()==="GuildMemberStore"),Fs=x(e=>e?.getName?.()==="PermissionStore"&&typeof e?.can=="function"),vi={USE_EXTERNAL_EMOJIS:1n<<18n,USE_EXTERNAL_STICKERS:1n<<37n,EMBED_LINKS:1n<<14n},Ks=3,Vs=4,Ws=3,Js=4;function _i(){try{return Ie.getCurrentUser?.()?.premiumType??0}catch{return 0}}var qs=()=>_i()>0,Ys=()=>_i()>1;function Si(e,t){try{let n=ye.getChannel?.(e);return!n||n.isPrivate?.()?!0:Fs.can?.(t,n)??!0}catch{return!0}}function Jn(e){try{let t=ye.getChannel?.(e);return t?.guild_id??t?.getGuildId?.()??void 0}catch{return}}function ki(e,t,n){if(e?.type===0)return!0;if(e?.available===!1)return!1;let o=!1;if(e?.managed&&e?.guildId){let i=Hs.getSelfMember?.(e.guildId)?.roles??[];o=Array.isArray(e?.roles)&&e.roles.some(a=>i.includes(a))}return qs()||o?e.guildId===n||Si(t,vi.USE_EXTERNAL_EMOJIS):!e?.animated&&e?.guildId===n}function xi(e){let t=Number(Me.store.emojiSize)||48,n=e?.animated?"gif":"webp",o=new URL(`https://cdn.discordapp.com/emojis/${e.id}.${n}`);return o.searchParams.set("size",String(t)),o.toString()}function Xs(e){let t=Number(Me.store.stickerSize)||160,n=e?.format_type===Vs?"gif":"png",o=new URL(`https://media.discordapp.net/stickers/${e.id}.${n}`);return o.searchParams.set("size",String(t)),e?.name&&o.searchParams.set("name",String(e.name)),o.toString()}function Ze(e,t){return!e[t]||/\s/.test(e[t])?"":" "}function Zs(e){return e.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")}function wi(e){let t=e[1];return t&&typeof t=="object"&&typeof t.content=="string"?t:e.find(n=>n&&typeof n=="object"&&typeof n.content=="string")}function Qs(e){for(let t=2;t<e.length;t++){let n=e[t];if(n&&typeof n=="object"&&"stickerIds"in n)return n}return e[3]&&typeof e[3]=="object"?e[3]:void 0}function Ei(e,t,n,o){if(!Me.store.enableStickerBypass)return!1;let i=n?.stickerIds;if(!Array.isArray(i)||i.length===0)return!1;let a=Gs.getStickerById?.(i[0]);if(!a||"pack_id"in a)return!1;let s=Ys()&&Si(e,vi.USE_EXTERNAL_STICKERS);if(a.available!==!1&&(s||a.guild_id===o))return!1;if(a.format_type===Ks)return q.warn("Lottie \u8D34\u7EB8\u65E0\u6CD5\u4F5C\u4E3A\u56FE\u7247\u5185\u8054\uFF0C\u5DF2\u8DF3\u8FC7\uFF1A",a.name),!1;let c=Xs(a);return t.content=`${t.content??""}${Ze(t.content??"",(t.content??"").length-1)}${c}`,i.length=0,!0}function Ii(e,t,n){if(!Me.store.enableEmojiBypass)return!1;let o=t?.validNonShortcutEmojis;if(!Array.isArray(o)||o.length===0)return!1;let i=!1;for(let a of o){if(ki(a,e,n))continue;let s=`<${a.animated?"a":""}:${a.originalName||a.name}:${a.id}>`,c=xi(a),l=new RegExp(Zs(s),"g");t.content=String(t.content??"").replace(l,(d,u,h)=>(i=!0,`${Ze(h,u-1)}${c}${Ze(h,u+d.length)}`))}return i}var Vn,Wn;function Rs(e){try{let t=e.args,n=t[0],o=wi(t);if(!o||o.__fakeNitroRewritten)return;typeof o.content!="string"&&(o.content=String(o.content??""));let i=Qs(t),a=Jn(n);i&&Ei(n,o,i,a),Ii(n,o,a)}catch(t){q.error("send \u6539\u5199\u5931\u8D25\uFF0C\u6D88\u606F\u6309\u539F\u6837\u53D1\u9001",t)}}var ec=/(?<!\\)<a?:(?:\w+):(\d+)>/gi;function tc(e){try{if(!Me.store.enableEmojiBypass)return;let t=e.args,n=t[0],o=wi(t);if(!o||typeof o.content!="string")return;let i=Jn(n);o.content=o.content.replace(ec,(a,s,c,l)=>{let d=Us.getCustomEmojiById?.(s);if(d==null||ki(d,n,i))return a;let u=xi(d);return`${Ze(l,c-1)}${u}${Ze(l,c+a.length)}`})}catch(t){q.error("edit \u6539\u5199\u5931\u8D25\uFF0C\u6D88\u606F\u6309\u539F\u6837\u4FDD\u5B58",t)}}function nc(){let e=F().filter(n=>n.pluginId==="fake-nitro");if(!e.length)return;let t=e.filter(n=>!n.applied);t.length===0?q.info("\u6240\u6709\u6E90\u7801 patch \u5747\u5DF2\u5728\u5F53\u524D Discord \u7248\u672C\u751F\u6548"):q.warn("\u90E8\u5206\u6E90\u7801 patch \u672A\u5339\u914D\u5F53\u524D Discord \u7248\u672C\uFF1B\u9009\u62E9\u5668\u89E3\u9501\u6216\u53D1\u9001\u6539\u5199\u53EF\u80FD\u4E0D\u5B8C\u6574\u3002\u672A\u5339\u914D\uFF1A"+t.map(n=>`\u201C${n.label}\u201D`).join("\u3001"))}var zt=`[${Ws},${Js}].includes(fakeNitroIntention)`,Ni=T({id:"fake-nitro",name:"\u5047 Nitro",description:"\u65E0\u9700 Nitro \u4E5F\u80FD\u4F7F\u7528\u9700\u8981 Nitro \u7684\u81EA\u5B9A\u4E49\u8868\u60C5\u4E0E\u8D34\u7EB8\uFF1A\u89E3\u9501\u9009\u62E9\u5668\uFF0C\u5E76\u5728\u53D1\u9001\u65F6\u628A\u9501\u5B9A\u7684\u8868\u60C5 / \u8D34\u7EB8\u81EA\u52A8\u6539\u5199\u4E3A\u56FE\u7247\u94FE\u63A5\uFF0C\u5BF9\u65B9\u770B\u5230\u7684\u5C31\u662F\u5185\u8054\u56FE\u7247\u3002\u4FEE\u6539\u9700\u91CD\u542F\u5BA2\u6237\u7AEF\u624D\u80FD\u5B8C\u5168\u751F\u6548\u3002",authors:[{name:"Vencord"},{name:"caitemm"}],category:"chat",settings:Me,patches:[{label:"message pre-send rewrite",find:/handleSendMessage[\s\S]{0,200}onResize|getSendMessageOptions[\s\S]{0,500}handleSendMessage/,replacement:{match:/let ([\w$]+)=[\w$]+\.[\w$]+\.parse\(([\w$]+),[\w$]+\);.+?let ([\w$]+)=\{\.\.\.[\w$]+\.[\w$]+\.getSendMessageOptions\(\{.+?\}\),location:[^}]*\};/,replace:(e,t,n,o)=>`${e}if($self.handlePreSend(${n}.id,${t},${o}))return{shouldClear:false,shouldRefocus:true};`}},{label:"premium predicates return true",find:"canUseCustomStickersEverywhere:",replacement:[{match:/(?<=canUseCustomStickersEverywhere:function\([\w$]+\)\{)/,replace:"return true;"},{match:/(?<=canUseHighVideoUploadQuality:function\([\w$]+\)\{)/,replace:"return true;"},{match:/(?<=canStreamQuality:function\([\w$]+,[\w$]+\)\{)/,replace:"return true;"},{match:/(?<=canUseClientThemes:function\([\w$]+\)\{)/,replace:"return true;"},{match:/(?<=canUsePremiumAppIcons:function\([\w$]+\)\{)/,replace:"return true;"}]},{label:"voice call emoji stays native",find:'.getByName("fork_and_knife")',replacement:{match:/\.CHAT/,replace:".STATUS"}},{label:"emoji picker unlock",find:".GUILD_SUBSCRIPTION_UNAVAILABLE;",replacement:[{match:/(?<=\.USE_EXTERNAL_EMOJIS,[\w$]+\);)(?=.{0,300}?isExternalEmojiAllowedForIntention\)\(([\w$]+)\))/,replace:"const fakeNitroIntention=$1;"},{match:/&&![\w$]+&&![\w$]+(?=\)return [\w$]+\.[\w$]+\.DISALLOW_EXTERNAL;)/,replace:`$&&&!${zt}`},{match:/![\w$]+\.available(?=\)return [\w$]+\.[\w$]+\.GUILD_SUBSCRIPTION_UNAVAILABLE;)/,replace:`$&&&!${zt}`},{match:/!([\w$]+\.[\w$]+\.canUseEmojisEverywhere\([\w$]+\))/,replace:`(!$1&&!${zt})`},{match:/(?<=\|\|)[\w$]+\.[\w$]+\.canUseAnimatedEmojis\([\w$]+\)/,replace:`($&||${zt})`}]},{label:"subscription emoji unlock",find:".getUserIsAdmin(",replacement:{match:/(function [\w$]+\([\w$]+,[\w$]+)\)\{(.{0,250}\.getUserIsAdmin\(.+?return!1\})/,replace:"$1,fakeNitroOriginal){if(!fakeNitroOriginal)return false;$2"}},{label:"stickers always sendable",find:'"SENDABLE"',replacement:{match:/[\w$]+\.available\?/,replace:"true?"}},{label:"stream quality tiers removed",find:"STREAM_FPS_OPTION",all:!0,replacement:{match:/guildPremiumTier:[\w$]+\.[\w$]+\.TIER_\d,?/,replace:""}},{label:"custom app icons",find:"getCurrentDesktopIcon(),",replacement:{match:/[\w$]+\.[\w$]+\.isPremium\([\w$]+\.[\w$]+\.getCurrentUser\(\)\)/,replace:"true"}},{label:"custom client themes",find:'("custom_themes_editor_footer")',all:!0,replacement:{match:/\(0,[\w$]+\.[\w$]+\)\([\w$]+\.[\w$]+\.TIER_2\)(?=,|;)/,replace:"true"}},{label:"soundboard sounds available",find:'type:"GUILD_SOUNDBOARD_SOUND_CREATE"',all:!0,replacement:{match:/(?<=type:"(?:SOUNDBOARD_SOUNDS_RECEIVED|GUILD_SOUNDBOARD_SOUND_CREATE|GUILD_SOUNDBOARD_SOUND_UPDATE|GUILD_SOUNDBOARD_SOUNDS_UPDATE)".+?available:)[\w$]+\.available/,replace:"true"}}],start(){let e=lt("sendMessage","editMessage","deleteMessage");if(e){if(typeof e.sendMessage=="function")try{Vn=ge.before(e,"sendMessage",Rs)}catch(t){q.error("\u6302\u63A5 sendMessage \u5931\u8D25",t)}if(typeof e.editMessage=="function")try{Wn=ge.before(e,"editMessage",tc)}catch(t){q.error("\u6302\u63A5 editMessage \u5931\u8D25",t)}q.info("MessageActions \u5DF2\u6302\u63A5\uFF08\u53D1\u9001 / \u7F16\u8F91\u6539\u5199\u5C31\u7EEA\uFF1B\u82E5 pre-send \u8865\u4E01\u5DF2\u751F\u6548\u5219\u6B64 hook \u4EC5\u4F5C fallback\uFF09")}else q.warn("\u672A\u627E\u5230 MessageActions \u2014\u2014 \u9009\u62E9\u5668\u89E3\u9501\u5DF2\u901A\u8FC7\u6E90\u7801 patch \u751F\u6548\uFF0C\u4F46\u53D1\u9001\u65F6\u7684 URL \u6539\u5199\u4E0D\u53EF\u7528\u3002\u91CD\u542F\u5BA2\u6237\u7AEF\u540E\u518D\u8BD5\uFF1B\u82E5\u4ECD\u672A\u627E\u5230\uFF0C\u8BF4\u660E\u8BE5 Discord \u7248\u672C\u7684 MessageActions \u5F62\u72B6\u6709\u53D8\u3002");setTimeout(nc,4e3)},stop(){Vn?.(),Wn?.(),Vn=void 0,Wn=void 0},handlePreSend(e,t,n){try{typeof t?.content!="string"&&(t.content=String(t?.content??""));let o=Jn(e);n&&Ei(e,t,n,o),Ii(e,t,o),t.__fakeNitroRewritten=!0}catch(o){q.error("pre-send \u6539\u5199\u5931\u8D25\uFF0C\u6D88\u606F\u6309\u539F\u6837\u53D1\u9001",o)}return!1}});var jt=g("console-cleaner"),Ci=z({hideSelfXss:{group:"\u5185\u7F6E\u89C4\u5219",type:"boolean",default:!0,label:"\u5C4F\u853D\u81EA\u6211 XSS \u8B66\u544A",description:"Discord \u90A3\u6761\u6BCF\u79D2\u91CD\u5237\u7684\u7EA2\u8272\u201C\u7B49\u4E00\u4E0B\uFF01/ Stop!\u201D\u7C98\u8D34\u8B66\u544A\u3002"},hideLocaleSpam:{group:"\u5185\u7F6E\u89C4\u5219",type:"boolean",default:!0,label:"\u5C4F\u853D\u672C\u5730\u5316\u7F3A\u5931\u5237\u5C4F",description:"\u201C\u2026 does not have a value in the requested locale \u2026\u201D\uFF0C\u5BA2\u6237\u7AEF mod \u8BA2\u9605\u4E8B\u4EF6\u65F6\u4F1A\u75AF\u72C2\u5237\u3002"},hideRiveSpam:{group:"\u5185\u7F6E\u89C4\u5219",type:"boolean",default:!0,label:"\u5C4F\u853D Rive \u52A8\u753B\u62A5\u9519",description:"\u201CCould not find a View Model linked to Artboard \u2026\u201D\uFF0C\u9644\u5E26\u8D85\u957F wasm \u5806\u6808\u3002"},hidePreloadWarnings:{group:"\u5185\u7F6E\u89C4\u5219",type:"boolean",default:!0,label:"\u5C4F\u853D\u8D44\u6E90\u9884\u52A0\u8F7D\u8B66\u544A",description:"\u201Cresource was preloaded using link preload but not used \u2026\u201D\u3002\u89C1\u4E0B\u65B9\u8BF4\u660E\uFF1A\u90E8\u5206\u6B64\u7C7B\u8B66\u544A\u7531\u6D4F\u89C8\u5668\u76F4\u63A5\u4EA7\u751F\uFF0C\u65E0\u6CD5\u62E6\u622A\u3002"},customPatterns:{group:"\u81EA\u5B9A\u4E49",type:"string-list",default:[],label:"\u81EA\u5B9A\u4E49\u5C4F\u853D\u5173\u952E\u8BCD",description:"\u4EFB\u4F55\u4E00\u6761 console \u6D88\u606F\u53EA\u8981\u5305\u542B\u8FD9\u91CC\u7684\u67D0\u4E2A\u5B50\u4E32\uFF0C\u5C31\u4F1A\u88AB\u4E22\u5F03\uFF08\u533A\u5206\u5927\u5C0F\u5199\uFF09\u3002",itemPlaceholder:"\u8981\u5C4F\u853D\u7684\u6587\u5B57\u7247\u6BB5"}}),rc=["\u7B49\u4E00\u4E0B","\u5728\u8FD9\u91CC\u7C98\u8D34","\u5982\u679C\u6709\u4EBA\u544A\u8BC9\u60A8","\u8BF7\u5173\u95ED\u6B64\u7A97\u53E3","Stop!","self-XSS","browser feature intended for developers","This is a browser feature","Nicht so schnell","Attends","Alto","\u3061\u3087\u3063\u3068\u5F85\u3063\u3066","\uC7A0\uAE50"],oc=["does not have a value in the requested locale"],ic=["Could not find a View Model linked to Artboard","BaseGlowRemapped"],ac=["was preloaded using link preload","preloaded intentionally"],sc=["log","info","warn","error","debug"];function cc(e){let t="";for(let n of e)typeof n=="string"?t+=n+" ":(typeof n=="number"||typeof n=="boolean")&&(t+=String(n)+" ");return t}function Qe(e,t){for(let n of t)if(n&&e.includes(n))return!0;return!1}function lc(e){if(typeof e[0]=="string"&&e[0].startsWith("%cHalcyon"))return!1;let t=cc(e);if(t==="")return!1;let n=Ci.store;return!!(n.hideSelfXss&&Qe(t,rc)||n.hideLocaleSpam&&Qe(t,oc)||n.hideRiveSpam&&Qe(t,ic)||n.hidePreloadWarnings&&Qe(t,ac)||n.customPatterns.length&&Qe(t,n.customPatterns))}var Bt=[],qn=0;function dc(){return e=>{try{if(lc(e.args)){qn++;return}}catch{}return e.callOriginal()}}var Ai=T({id:"console-cleaner",name:"\u63A7\u5236\u53F0\u51C0\u5316",description:"\u5C4F\u853D Discord \u5728\u5F00\u53D1\u8005\u63A7\u5236\u53F0\u91CC\u5237\u5C4F\u7684\u65E0\u7528\u4FE1\u606F\uFF08\u81EA\u6211 XSS \u8B66\u544A\u3001Rive \u52A8\u753B\u62A5\u9519\u3001\u672C\u5730\u5316\u7F3A\u5931\u3001\u8D44\u6E90\u9884\u52A0\u8F7D\u8B66\u544A\uFF09\uFF0C\u652F\u6301\u81EA\u5B9A\u4E49\u5173\u952E\u8BCD\u3002\u5173\u95ED\u63D2\u4EF6\u5373\u6062\u590D\u539F\u59CB console\u3002",authors:[{name:"caitemm"},{name:"catie"}],category:"utility",settings:Ci,start(){let e=globalThis.console;if(!e){jt.warn("\u672A\u627E\u5230 console \u5BF9\u8C61\uFF0C\u63D2\u4EF6\u65E0\u4E8B\u53EF\u505A");return}qn=0;let t=dc();for(let n of sc)if(typeof e[n]=="function")try{Bt.push(ge.instead(e,n,t))}catch(o){jt.error(`\u6302\u63A5 console.${n} \u5931\u8D25`,o)}jt.info(`\u5DF2\u51C0\u5316 console\uFF08\u62E6\u622A ${Bt.length} \u4E2A\u65B9\u6CD5\uFF09\u3002\u6CE8\u610F\uFF1A\u6D4F\u89C8\u5668\u81EA\u8EAB\u4EA7\u751F\u7684\u8B66\u544A\uFF08\u5982\u67D0\u4E9B preload \u63D0\u793A\uFF09\u65E0\u6CD5\u901A\u8FC7 JS \u62E6\u622A\u3002`)},stop(){for(let e of Bt)try{e()}catch{}Bt=[],jt.info(`\u5DF2\u6062\u590D\u539F\u59CB console\uFF08\u672C\u6B21\u5171\u5C4F\u853D ${qn} \u6761\u6D88\u606F\uFF09`)}});var Re=g("emote-cloner"),uc=256*1024,hc=512*1024,Ut=null;function pc(){return Ut||(Ut=xr(".GUILD_EMOJIS(","EMOJI_UPLOAD_START")??null,Ut)}function fc(e){let t=(e||"emoji").split("~")[0].replace(/[^\w]/g,"_");return t.length<2&&(t=`${t}_e`),t.slice(0,32)}function mc(e){return e===4?"gif":e===3?"json":"png"}function gc(e,t){return`https://cdn.discordapp.com/emojis/${e}.webp?size=${t}&lossless=true&animated=true`}function yc(e,t,n){return`https://media.discordapp.net/stickers/${e}.${t}?size=${n}&lossless=true&animated=true`}async function Ti(e,t){for(let n=4096;n>=16;n/=2){let o=e(n),i=await fetch(o);if(!i.ok)throw new Error(`\u4E0B\u8F7D\u56FE\u7247\u5931\u8D25\uFF1AHTTP ${i.status}`);let a=await i.blob();if(a.size<=t)return a}throw new Error(`\u56FE\u7247\u8D85\u51FA\u5927\u5C0F\u9650\u5236\uFF08${Math.round(t/1024)}KB\uFF09`)}function bc(e){return new Promise((t,n)=>{let o=new FileReader;o.onload=()=>t(String(o.result)),o.onerror=()=>n(o.error??new Error("\u8BFB\u53D6\u56FE\u7247\u5931\u8D25")),o.readAsDataURL(e)})}function Mi(e){if(e==null)return null;if(e.body!=null&&!(typeof e.body=="object"&&Object.keys(e.body).length===0))return e.body;if(typeof e.text=="string"&&e.text)try{return JSON.parse(e.text)}catch{}return e.body??null}function Yn(e){let t=e?.body??e?.response?.body;if(t){try{let n=i=>{if(!(!i||typeof i!="object")){if(Array.isArray(i._errors)&&i._errors[0]?.message)return i._errors[0].message;for(let a of Object.keys(i)){let s=n(i[a]);if(s)return s}}},o=n(t.errors);if(o)return o}catch{}if(typeof t.message=="string")return t.message}if(typeof e?.text=="string")try{let n=JSON.parse(e.text);if(n?.message)return n.message}catch{}return e?.message?String(e.message):"\u672A\u77E5\u9519\u8BEF"}async function Pi(e,t){let n=await Ti(s=>gc(t.id,s),uc),o=await bc(n),i=fc(t.name),a=pc();if(typeof a=="function")try{await a({guildId:e,name:i,image:o});return}catch(s){throw Re.error("emoji \u4E0A\u4F20\uFF08action\uFF09\u5931\u8D25",s),new Error(Yn(s))}try{await Tt.post({url:`/guilds/${e}/emojis`,body:{image:o,name:i,roles:[]}})}catch(s){throw Re.error("emoji \u4E0A\u4F20\uFF08REST\uFF09\u5931\u8D25",s),new Error(Yn(s))}}async function vc(e){try{let t=Do.getStickerById?.(e);if(t)return t}catch{}try{let t=await Tt.get({url:`/stickers/${e}`}),n=Mi(t);if(n)try{W()?.dispatch({type:"STICKER_FETCH_SUCCESS",sticker:n})}catch{}return n}catch(t){return Re.warn("could not fetch sticker info; using fallbacks",t),null}}async function $i(e,t){let n=await vc(t.id);if(n?.format_type===3)throw new Error("\u8FD9\u662F Lottie \u52A8\u6001\u8D34\u7EB8\uFF0C\u65E0\u6CD5\u590D\u5236");let o=(t.name||n?.name||"sticker").slice(0,30),i=t.tags||n?.tags||"\u{1F642}",a=(t.description??n?.description??"").slice(0,100),s=mc(n?.format_type),c=await Ti(h=>yc(t.id,s,h),hc),l=new FormData;l.append("name",o),l.append("tags",i),l.append("description",a),l.append("file",new File([c],`sticker.${s}`,{type:s==="gif"?"image/gif":"image/png"}));let d=Lo?.Endpoints?.GUILD_STICKER_PACKS?.(e)??`/guilds/${e}/stickers`,u;try{let h=await Tt.post({url:d,body:l});u=Mi(h),u&&!u.id&&u.sticker?.id&&(u=u.sticker)}catch(h){throw Re.error("sticker \u4E0A\u4F20\u5931\u8D25",h),new Error(Yn(h))}Re.info("sticker uploaded",{id:u?.id,name:u?.name});try{W()?.dispatch({type:"GUILD_STICKERS_CREATE_SUCCESS",guildId:e,sticker:{...u,user:Ie.getCurrentUser?.()}})}catch{}}var Li=g("emote-cloner");function _c(e){let t=e.icon&&e.icon.startsWith("a_")?"gif":"png";return`https://cdn.discordapp.com/icons/${e.id}/${e.icon}.${t}?size=64`}var ve=null,Ht=null,et=null;function Gt(){if(et&&(document.removeEventListener("keydown",et),et=null),Ht){try{Ht()}catch{}Ht=null}ve&&(ve.remove(),ve=null)}function Di(e){K(),Gt(),ve=document.createElement("div"),ve.className="halcyon",document.body.appendChild(ve),et=t=>{t.key==="Escape"&&Gt()},document.addEventListener("keydown",et);try{Ht=ht(r.createElement(Sc,{title:e.title,guilds:e.guilds,onPick:e.onPick,onClose:Gt}),ve)}catch(t){Li.error("could not open guild picker",t),Gt()}}function Sc({title:e,guilds:t,onPick:n,onClose:o}){let[i,a]=m(""),[s,c]=m({state:"idle"}),l=i.trim().toLowerCase(),d=l?t.filter(h=>h.name.toLowerCase().includes(l)):t,u=h=>{c({state:"working",guild:h.name}),Promise.resolve().then(()=>n(h.id)).then(()=>{c({state:"done",guild:h.name}),setTimeout(o,1e3)}).catch(y=>{Li.error("clone failed",y),c({state:"error",guild:h.name,message:y?.message??String(y)})})};return r.createElement("div",{className:"hc-overlay",role:"dialog","aria-modal":"true","aria-label":e,onMouseDown:h=>{h.target===h.currentTarget&&s.state!=="working"&&o()}},r.createElement("div",{className:"hc-emote-picker"},r.createElement("div",{className:"hc-emote-picker__head"},r.createElement("span",{className:"hc-emote-picker__title"},e),r.createElement("button",{className:"hc-emote-picker__close",onClick:o,"aria-label":"\u5173\u95ED",disabled:s.state==="working"},"\u2715")),s.state==="idle"?r.createElement(r.Fragment,null,r.createElement("div",{className:"hc-emote-picker__search"},r.createElement("input",{className:"hc-input",placeholder:"\u641C\u7D22\u670D\u52A1\u5668\u2026",value:i,autoFocus:!0,onChange:h=>a(h.currentTarget.value)})),r.createElement("div",{className:"hc-emote-picker__list"},d.length===0?r.createElement("div",{className:"hc-emote-picker__empty"},t.length===0?"\u6CA1\u6709\u53EF\u7BA1\u7406\u8868\u60C5\u7684\u670D\u52A1\u5668":"\u6CA1\u6709\u5339\u914D\u7684\u670D\u52A1\u5668"):d.map(h=>r.createElement("div",{key:h.id,className:"hc-emote-picker__item",role:"button",tabIndex:0,onClick:()=>u(h),onKeyDown:y=>{y.key==="Enter"&&u(h)}},r.createElement("div",{className:"hc-emote-picker__icon"},h.icon?r.createElement("img",{src:_c(h),alt:""}):h.name.charAt(0).toUpperCase()),r.createElement("div",{className:"hc-emote-picker__name"},h.name))))):r.createElement("div",{className:"hc-emote-picker__status","data-state":s.state},r.createElement("div",{className:"hc-emote-picker__status-icon"},s.state==="working"?"\u23F3":s.state==="done"?"\u2713":"\u2715"),r.createElement("div",{className:"hc-emote-picker__status-title"},s.state==="working"?`\u6B63\u5728\u590D\u5236\u5230 ${s.guild}\u2026`:s.state==="done"?`\u5DF2\u590D\u5236\u5230 ${s.guild}`:"\u590D\u5236\u5931\u8D25"),s.state==="error"&&r.createElement(r.Fragment,null,r.createElement("div",{className:"hc-emote-picker__status-detail"},s.message),r.createElement("button",{className:"hc-btn hc-btn--secondary hc-btn--sm",onClick:()=>c({state:"idle"})},"\u8FD4\u56DE\u5217\u8868")))))}var ji=g("emote-cloner"),Xn={CREATE_GUILD_EXPRESSIONS:1n<<43n,MANAGE_GUILD_EXPRESSIONS:1n<<40n,MANAGE_EMOJIS_AND_STICKERS:1n<<30n};function Oi(e){if(!e)return!1;try{let t=new URL(e,location.href);return t.pathname.endsWith(".gif")||t.searchParams.get("animated")==="true"}catch{return/\.gif(\?|$)/.test(e)||e.includes("animated=true")}}function kc(e){let t=e.match(/\/emojis\/(\d+)\.(\w+)/);if(!t)return null;let n;try{let o=new URL(e,location.href).searchParams.get("name");n=o?decodeURIComponent(o):void 0}catch{}return{id:t[1],isAnimated:t[2]==="gif"||/animated=true/.test(e),name:n}}function xc(e){try{let t=bn.getCustomEmojiById?.(e)??bn.getUsableCustomEmojiById?.(e);return le(t?.name)}catch{return}}function zi(e,t,n){let o=t;return xc(e)??le(n)??le(o?.getAttribute?.("alt"))??le(o?.getAttribute?.("aria-label"))??le(o?.getAttribute?.("title"))??le(o?.dataset?.name)}function wc(e){let t=e.match(/\/stickers\/(\d+)\./);return t?{id:t[1]}:null}function le(e){return e&&e.replace(/:/g,"").trim()||void 0}function Ec(e){let t=new Set,n=[],o=a=>{a&&a.tagName==="IMG"&&!t.has(a)&&(t.add(a),n.push(a))};o(e),e.querySelectorAll?.("img").forEach(o);let i=e.parentElement;for(let a=0;a<4&&i;a++,i=i.parentElement)o(i),i.querySelectorAll?.(":scope > img").forEach(o);return n}function Ic(e){if(!e)return null;let t=e.closest?.("[data-type='emoji'],[data-type='sticker'],[data-id]");if(t){let{id:n,name:o,type:i}=t.dataset;if(n&&i==="emoji"){let a=t.querySelector("img");return{kind:"emoji",id:n,name:zi(n,a,o)??"emoji",isAnimated:Oi(a?.currentSrc||a?.src)}}if(n&&i==="sticker"&&!String(t.className).toLowerCase().includes("lottie"))return{kind:"sticker",id:n,name:le(o)}}for(let n of Ec(e)){let o=n.currentSrc||n.src||"",i=kc(o);if(i)return{kind:"emoji",id:i.id,name:zi(i.id,n,i.name)??"emoji",isAnimated:i.isAnimated||Oi(o)};let a=wc(o);if(a)return String(n.className).toLowerCase().includes("lottie")?null:{kind:"sticker",id:a.id,name:le(n.alt)}}return null}function Nc(e){try{return!!(Mt.can?.(Xn.CREATE_GUILD_EXPRESSIONS,e)||Mt.can?.(Xn.MANAGE_GUILD_EXPRESSIONS,e)||Mt.can?.(Xn.MANAGE_EMOJIS_AND_STICKERS,e))}catch{return!1}}function Cc(){try{let e=U.getGuilds?.()??{};return Object.values(e).filter(t=>Nc(t)).map(t=>({id:String(t?.id??""),name:String(t?.name??t?.id??"\u672A\u77E5\u670D\u52A1\u5668"),icon:t?.icon?String(t.icon):null})).filter(t=>t.id).sort((t,n)=>t.name.localeCompare(n.name,"zh-CN"))}catch{return[]}}function Ac(e){let t=e.kind==="emoji";Di({title:t?"\u590D\u5236\u8868\u60C5\u5230\u670D\u52A1\u5668":"\u590D\u5236\u8D34\u7EB8\u5230\u670D\u52A1\u5668",guilds:Cc(),onPick:n=>t?Pi(n,e):$i(n,e)})}function Tc(e){let t=Ic(Co());if(!t)return;let n=Nt();if(!n){ji.warn("MenuItem component not learned yet; skipping clone item this open");return}e.push(r.createElement(n,{id:t.kind==="emoji"?"halcyon-clone-emoji":"halcyon-clone-sticker",label:t.kind==="emoji"?"\u590D\u5236\u8868\u60C5\u5230\u670D\u52A1\u5668":"\u590D\u5236\u8D34\u7EB8\u5230\u670D\u52A1\u5668",action:()=>Ac(t)}))}var Zn=[],Bi=T({id:"emote-cloner",name:"\u8868\u60C5\u514B\u9686",description:"\u53F3\u952E\u4EFB\u610F\u81EA\u5B9A\u4E49\u8868\u60C5\u6216\u8D34\u7EB8\uFF0C\u5373\u53EF\u628A\u5B83\u590D\u5236\u5230\u4F60\u6709\u7BA1\u7406\u6743\u9650\u7684\u670D\u52A1\u5668\u3002\u652F\u6301\u6D88\u606F\u91CC\u7684\u8868\u60C5 / \u8D34\u7EB8\uFF0C\u4EE5\u53CA\u8868\u60C5\u9009\u62E9\u5668\u91CC\u7684\u9879\u76EE\u3002",authors:[{name:"Vencord"},{name:"caitemm"}],category:"utility",start(){Zn.push(Ct(["message","expression-picker"],Tc)),ji.info("emote-cloner ready \u2014 right-click an emoji or sticker")},stop(){for(let e of Zn)try{e()}catch{}Zn=[]}});var tt=g("flux"),nt=new Map,Ft=new Map;function Qn(){let e=W();return e||tt.error("dispatcher unavailable; flux subscriptions are inert"),e}function Mc(e){if(Ft.has(e))return;let t=o=>{let i=nt.get(e);if(i)for(let a of i)try{a(o)}catch(s){tt.error(`listener for ${e} threw`,s)}},n=Qn();try{n?.subscribe(e,t),Ft.set(e,t)}catch(o){tt.error(`could not subscribe to ${e}`,o)}}function Pc(e){let t=nt.get(e);if(t&&t.size)return;let n=Ft.get(e);if(n){try{Qn()?.unsubscribe(e,n)}catch(o){tt.error(`could not unsubscribe from ${e}`,o)}Ft.delete(e),nt.delete(e)}}var Ui={subscribe(e,t){let n=nt.get(e);n||(n=new Set,nt.set(e,n)),n.add(t),Mc(e);let o=!0;return()=>{o&&(o=!1,n.delete(t),Pc(e))}},dispatch(e){try{Qn()?.dispatch(e)}catch(t){tt.error("dispatch failed",e?.type,t)}}};var ee=g("mark-all-read"),Gi=!1;function $c(e){return e?.channel?.id??e?.id}function Lc(){let e=[],t=new Set,n=U.getGuilds?.()??{};for(let o of Object.keys(n)){let i;try{i=We.getChannels?.(o)}catch(c){ee.warn(`could not read channels for guild ${o}`,c);continue}if(!i)continue;let a=c=>{if(!c)return!1;try{if(!Ne.hasUnread?.(c))return!1}catch{return!1}return e.push({channelId:c,messageId:Ne.lastMessageId?.(c)??null,readStateType:0}),!0};if(!Gi){Gi=!0;try{let c=Object.keys(i).map(l=>{let d=i[l];return Array.isArray(d)?`${l}:array(${d.length})`:`${l}:${typeof d}`}).join(", ");ee.info(`getChannels shape for guild ${o} \u2014 { ${c} }`);for(let l of Object.keys(i)){let d=i[l];if(Array.isArray(d)&&d.length>0){ee.info(`  first "${l}" entry keys=[${Object.keys(d[0]).join(",")}]`);break}}}catch(c){ee.warn("could not describe getChannels shape",c)}}let s=[i.SELECTABLE,i.VOCAL].filter(Array.isArray);for(let c of s)for(let l of c)a($c(l))&&t.add(o);try{let c=vn.getActiveJoinedThreadsForGuild?.(o);if(c&&typeof c=="object"){for(let l of Object.values(c))if(!(!l||typeof l!="object"))for(let d of Object.values(l))a(d?.channel?.id??d?.id)&&t.add(o)}}catch(c){ee.warn(`could not read joined threads for guild ${o}`,c)}}return{channels:e,guilds:t.size}}function Dc(){let e=(t,n)=>`${t}=${typeof n=="function"?"ok":"MISSING"}`;ee.info("store check \u2014 "+[e("GuildStore.getGuilds",U.getGuilds),e("GuildChannelStore.getChannels",We.getChannels),e("ReadStateStore.hasUnread",Ne.hasUnread),e("ReadStateStore.lastMessageId",Ne.lastMessageId),e("ActiveJoinedThreadsStore.getActiveJoinedThreadsForGuild",vn.getActiveJoinedThreadsForGuild)].join(", "))}function Kt(){Dc();let e=Object.keys(U.getGuilds?.()??{}).length,{channels:t,guilds:n}=Lc();return ee.info(`scanned ${e} guild(s); found ${t.length} unread channel(s)`),t.length===0?(ee.info("nothing unread; skipping BULK_ACK"),{channels:0,guilds:0}):(Ui.dispatch({type:"BULK_ACK",context:"APP",channels:t}),ee.info(`BULK_ACK dispatched for ${t.length} channel(s) across ${n} guild(s)`),{channels:t.length,guilds:n})}var Oc=g("mark-all-read");function Hi(){let[e,t]=m(!1),[n,o]=m("\u5F85\u673A"),[i,a]=m("\u70B9\u51FB\u4E0B\u65B9\u6309\u94AE\uFF0C\u628A\u6240\u6709\u670D\u52A1\u5668\u91CC\u7684\u672A\u8BFB\u4E00\u6B21\u6027\u6E05\u7A7A\u3002");return r.createElement("div",{className:"hc-stack"},r.createElement("div",{className:"hc-inline-note"},r.createElement(Ee,{size:18}),r.createElement("span",null,"\u4E00\u6B21\u6027\u628A",r.createElement("strong",null,"\u6240\u6709\u670D\u52A1\u5668"),"\u7684\u672A\u8BFB\u6D88\u606F\u6807\u4E3A\u5DF2\u8BFB\u3002\u6807\u8BB0\u5DF2\u8BFB\u4E0D\u4F1A\u5220\u9664\u4EFB\u4F55\u6D88\u606F\uFF0C\u4F46\u65E0\u6CD5\u64A4\u9500\u3002")),r.createElement(P,{title:"\u64CD\u4F5C"},r.createElement("div",{className:"hc-cell"},r.createElement(S,{variant:"primary",icon:r.createElement(je,{size:16}),disabled:e,onClick:()=>{if(!e){t(!0),o("\u5904\u7406\u4E2D"),a("\u6B63\u5728\u6536\u96C6\u672A\u8BFB\u9891\u9053\u2026");try{let c=Kt();c.channels===0?(o("\u5DF2\u662F\u6700\u65B0"),a("\u6CA1\u6709\u627E\u5230\u4EFB\u4F55\u672A\u8BFB\uFF0C\u65E0\u9700\u64CD\u4F5C\u3002"),se("\u6CA1\u6709\u672A\u8BFB\u6D88\u606F","info")):(o("\u5B8C\u6210"),a(`\u5DF2\u6E05\u7A7A ${c.guilds} \u4E2A\u670D\u52A1\u5668\u4E2D\u7684 ${c.channels} \u4E2A\u9891\u9053\u3002`),se(`\u5DF2\u6807\u8BB0 ${c.channels} \u4E2A\u9891\u9053\u4E3A\u5DF2\u8BFB`,"success"))}catch(c){o("\u5931\u8D25"),a(c?.message??String(c)),se("\u6807\u8BB0\u5931\u8D25","failure"),Oc.error("mark all read failed",c)}finally{t(!1)}}}},"\u5168\u90E8\u6807\u4E3A\u5DF2\u8BFB"))),r.createElement("div",{className:"hc-cleaner__status"},r.createElement("div",{className:"hc-cleaner__status-state"},n),i&&r.createElement("div",{className:"hc-cleaner__status-detail"},i)))}var Vi=g("mark-all-read");function Wi(){try{let e=Kt();e.channels===0?se("\u6CA1\u6709\u672A\u8BFB\u6D88\u606F","info"):se(`\u5DF2\u6807\u8BB0 ${e.channels} \u4E2A\u9891\u9053\u4E3A\u5DF2\u8BFB`,"success")}catch(e){se("\u6807\u8BB0\u5931\u8D25","failure"),Vi.error("mark all read failed",e)}}function zc(){return r.createElement("div",{className:"hc-rail-item"},r.createElement("button",{type:"button",className:"hc-rail-btn","aria-label":"\u5168\u90E8\u670D\u52A1\u5668\u6807\u4E3A\u5DF2\u8BFB",title:"\u5168\u90E8\u670D\u52A1\u5668\u6807\u4E3A\u5DF2\u8BFB",onClick:Wi},r.createElement(je,{size:24})))}var Fi=["guild-context","guild-header-popout"],Ki=e=>{let t=Nt();!t||e.some(o=>o?.props?.id==="hc-mark-all-read")||e.push(r.createElement(t,{id:"hc-mark-all-read",label:"\u5168\u90E8\u670D\u52A1\u5668\u6807\u4E3A\u5DF2\u8BFB",action:Wi}))},Ji=T({id:"mark-all-read",name:"\u4E00\u952E\u5DF2\u8BFB",description:"\u5728\u670D\u52A1\u5668\u5217\u8868\u7684\u597D\u53CB\u6309\u94AE\u4E0B\u65B9\u52A0\u4E00\u4E2A\u6309\u94AE\uFF0C\u4E00\u952E\u628A\u6240\u6709\u670D\u52A1\u5668\u7684\u672A\u8BFB\u6D88\u606F\u6807\u4E3A\u5DF2\u8BFB\u3002\u4E5F\u53EF\u53F3\u952E\u4EFB\u610F\u670D\u52A1\u5668\uFF0C\u6216\u5728\u672C\u9875\u70B9\u51FB\u3002\u6807\u8BB0\u5DF2\u8BFB\u4E0D\u4F1A\u5220\u9664\u6D88\u606F\uFF0C\u4F46\u65E0\u6CD5\u64A4\u9500\u3002",authors:[{name:"caitemm"},{name:"Vencord"}],category:"utility",dependencies:["context-menu-api"],patches:[{label:"read-all-rail-button",find:'tutorialId:"friends-list"',replacement:{match:/return(\(.{0,200}?tutorialId:"friends-list".+?\}\))(?=\}function)/,replace:"return[$1].concat($self.renderRailButton())"}}],renderRailButton(){return[r.createElement(zc,{key:"hc-mark-all-read-rail"})]},page:{title:"\u4E00\u952E\u5DF2\u8BFB",icon:je,component:Hi},start(){K(),Ct(Fi,Ki),Vi.info("mark-all-read ready")},stop(){Ao(Fi,Ki)}});var qi=[xo,Mo,ei,ri,li,bi,Ni,Ai,Bi,Ji];var Yi=g("extension");O.registerAll(qi);O.prepare();async function jc(){await Tr,await O.boot(),K();try{globalThis.HalcyonAPI={open:wt,close:Z,runtime:O,patchReport:()=>F(),dumpSource:(e,t)=>dt(e,t),diagnose:()=>Ir()}}catch{}Yi.info("Halcyon (extension) ready \u2014 press Ctrl/Cmd+Shift+H to open settings")}jc().catch(e=>Yi.error("extension boot failed",e));})();
