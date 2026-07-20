"use strict";var Halcyon=(()=>{var hn={debug:10,info:20,warn:30,error:40},Eo={debug:"#8E8E93",info:"#0A84FF",warn:"#FF9F0A",error:"#FF453A"},Io=500,Be=[],dt=new Set,No=hn.info;function ze(e,t,n){let o={time:Date.now(),level:e,scope:t,parts:n};Be.push(o),Be.length>Io&&Be.shift();for(let c of dt)try{c(o)}catch{}if(hn[e]<No)return;let i=`background:${Eo[e]};color:#fff;border-radius:4px;padding:0 6px;font-weight:600`;(e==="error"?console.error:e==="warn"?console.warn:console.log)(`%cHalcyon%c ${t}`,i,"color:inherit;font-weight:600",...n)}function m(e){return{debug:(...t)=>ze("debug",e,t),info:(...t)=>ze("info",e,t),warn:(...t)=>ze("warn",e,t),error:(...t)=>ze("error",e,t),child:t=>m(`${e}:${t}`)}}function ut(){return Be.slice()}function pn(e){return dt.add(e),()=>dt.delete(e)}var q=m("modules"),gn="webpackChunkdiscord_app",Y,xe=!1,fn=!1,Ge=new Set,ht=[],mn=()=>{};function bn(e){mn=e,globalThis.__halcyon_self__=t=>mn(t)}function vn(e){ht.push({...e,applied:!1,hits:0})}function _e(){return ht.map(({pluginId:e,label:t,applied:n,hits:o})=>({pluginId:e,label:t,applied:n,hits:o}))}function pt(){if(fn)return;fn=!0;let e=globalThis,t=e[gn]??[],n=a=>function(...c){try{yn(c[0])}catch(s){q.error("failed to instrument chunk",s)}return a.apply(this??t,c)},o=t.push,i=typeof o=="function"&&o!==Array.prototype.push?n(o.bind(t)):Array.prototype.push.bind(t);try{Object.defineProperty(t,"push",{configurable:!0,get:()=>i,set:a=>{i=n(a)}})}catch(a){q.error("could not install chunk interceptor",a);return}e[gn]=t;for(let a of t)try{yn(a)}catch{}t.push([[Symbol("halcyon.require")],{},a=>{Y=a}])}function xn(){return new Promise(e=>{pt(),Oo(t=>ne(t),()=>{xe||(xe=!0,q.info("core runtime detected"),e())}),setTimeout(()=>{xe||(q.warn("core module not seen within grace period; continuing degraded"),xe=!0,e())},15e3)})}function yn(e){let t=e?.[1];if(!(!t||typeof t!="object"))for(let n of Object.keys(t)){let o=t[n];typeof o!="function"||o.__halcyon__||(t[n]=Co(n,o))}}function Co(e,t){let n,o=function(i,a,c){if(!n){let s=ht.filter(l=>Lo(l.find,t));n=s.length?Po(e,t,s):t}n.call(this,i,a,c);try{$o(i)}catch(s){q.error("module observer threw for",e,s)}};return o.toString=()=>t.toString(),o.__halcyon__=!0,o}function Po(e,t,n){let o=String(t);for(let i of n){let a=o,c=Ao(i.replace,i.pluginId);if(o=i.all?o.replace(new RegExp(i.match.source,Mo(i.match.flags)),c):o.replace(i.match,c),o===a){q.warn(`patch "${i.label}" (${i.pluginId}) matched module ${e} but changed nothing`);continue}i.applied=!0,i.hits++,q.debug(`applied patch "${i.label}" (${i.pluginId}) to module ${e}`)}try{return(0,eval)(`(${To(o)})`)}catch(i){return q.error(`patched module ${e} failed to compile; using original`,i),t}}function To(e){let t=e.trimStart();if(/^(async\s+)?function[\s*(]/.test(t)||/^(async\s+)?(\([^)]*\)|[\w$]+)\s*=>/.test(t))return t;let n=t.match(/^(async\s+)?(\*\s*)?(?:\[[^\]]*\]|[\w$]+)\s*\(/);if(n){let o=n[1]?"async ":"",i=n[2]?"*":"";return`${o}function${i}${t.slice(n[0].length-1)}`}return t}function Mo(e){return e.includes("g")?e:e+"g"}function Ao(e,t){let n=`__halcyon_self__(${JSON.stringify(t)})`;return typeof e=="string"?e.split("$self").join(n):(...o)=>e(...o).split("$self").join(n)}function Lo(e,t){let n=t.toString();return typeof e=="string"?n.includes(e):e.test(n)}var Do=40;function gt(e,t,n){try{if(t(e,n))return e}catch{}if(typeof e!="object"&&typeof e!="function")return;let o;try{o=Object.keys(e)}catch{return}if(!(o.length>Do))for(let i of o){let a;try{a=e[i]}catch{continue}if(!(a==null||typeof a!="object"&&typeof a!="function"))try{if(t(a,n))return a}catch{}}}function $o(e){if(!Ge.size)return;let t=e.exports;if(t!=null)for(let n of Ge){let o=gt(t,n.filter,{id:e.id,module:e});o!==void 0&&(Ge.delete(n),n.resolve(o))}}function z(e){if(Y)for(let t of Object.keys(Y.c)){let n=Y.c[t],o=n?.exports;if(o==null||o===globalThis)continue;let i=gt(o,e,{id:t,module:n});if(i!==void 0)return i}}function _n(e){let t=[];if(!Y)return t;for(let n of Object.keys(Y.c)){let o=Y.c[n],i=o?.exports;if(i==null||i===globalThis)continue;let a=gt(i,e,{id:n,module:o});a!==void 0&&t.push(a)}return t}function ue(...e){return z(t=>e.every(n=>t[n]!==void 0))}function Sn(e){return z(t=>t?.getName?.()===e||t?.constructor?.displayName===e)}function Oo(e,t){let n=z(e);if(n!==void 0){t(n);return}Ge.add({filter:e,resolve:t})}function C(e){let t,n=()=>t??=z(e);return new Proxy({},{get(o,i){let a=n();if(a==null)return;let c=a[i];return typeof c=="function"?c.bind(a):c},has(o,i){let a=n();return a!=null&&i in a}})}function kn(){return xe}function ne(e){return e!=null&&typeof e.dispatch=="function"&&typeof e.subscribe=="function"&&(typeof e._actionHandlers<"u"||typeof e._subscriptions<"u"||typeof e._waitQueue<"u"||typeof e.isDispatching=="function"||typeof e.wait=="function")}function wn(e,t=300){let n=Y?.m;if(!n)return"<webpack require not ready \u2014 open the target UI first>";let o=[];for(let i of Object.keys(n)){let a;try{a=String(n[i])}catch{continue}if(!a.includes(e))continue;let c=[],s=a.indexOf(e),l=0;for(;s>=0&&l<4;)c.push(a.slice(Math.max(0,s-t),s+e.length+t)),s=a.indexOf(e,s+e.length),l++;o.push(`===== module ${i} (${l} hit${l===1?"":"s"}) =====
${c.join(`
  ...  
`)}`)}return o.length?o.join(`

`):`<no loaded factory contains "${e}">`}function En(){let e=_e(),t={embedRendered:typeof document<"u"&&!!document.querySelector(".hc-embed"),halcyonMounted:typeof document<"u"&&!!document.querySelector(".halcyon")};try{let n=null,o=document.querySelectorAll("*");for(let h=0;h<o.length&&!n;h++){let y=o[h],x=Object.keys(y).find(A=>A.startsWith("__reactFiber$"));x&&(n=y[x])}if(!n)return JSON.stringify({error:"no React fiber found in DOM",patches:e,dom:t},null,2);let i=n;for(;i.return;)i=i.return;let a=h=>{try{if(typeof h=="function")return Function.prototype.toString.call(h);if(h&&typeof h=="object"){let y=h.type||h.render;if(typeof y=="function")return Function.prototype.toString.call(y)}}catch{}return""},c=h=>h&&(h.displayName||h.name)||h&&h.type&&(h.type.displayName||h.type.name)||"",s=[i],l=0,d=[],u=[],g=new Set,E=new Set;for(;s.length&&l<4e4;){let h=s.shift();l++;let y=h.type;if(y&&(typeof y=="function"||typeof y=="object")){let x=a(y),A=c(y)||"anon",De=x.includes("__halcyon_self__");x.includes("buildLayout")&&d.push({name:A,patched:De}),x.includes("getPredicateSections")&&u.push({name:A,patched:De}),(x.includes("renderSidebar")||x.includes("SETTINGS_SIDEBAR"))&&g.add(A),/settings/i.test(A)&&E.add(A)}h.child&&s.push(h.child),h.sibling&&s.push(h.sibling)}let W=e.find(h=>h.label==="user-settings-layout"),ee=e.find(h=>h.label==="user-settings-sidebar"),de=t.embedRendered?"embed rendered \u2014 Halcyon section is on screen":W?.applied||ee?.applied?"patch applied at load but section not seen \u2014 open user settings, then re-run":"no settings patch matched this build \u2014 run dumpSource('buildLayout') and share the output";return JSON.stringify({verdict:de,dom:t,patches:e,walked:l,buildLayoutHits:d,gpsHits:u,sidebarComps:[...g].slice(0,25),settingsNamed:[...E].slice(0,40)},null,2)}catch(n){return JSON.stringify({error:String(n),patches:e,dom:t},null,2)}}function In(e){let t,n=()=>t??=e();return new Proxy(function(){},{get:(o,i)=>n()?.[i],set:(o,i,a)=>{let c=n();return c&&(c[i]=a),!0},has:(o,i)=>{let a=n();return a!=null&&i in a},ownKeys:()=>Reflect.ownKeys(n()??{}),getOwnPropertyDescriptor:(o,i)=>Reflect.getOwnPropertyDescriptor(n()??{},i),apply:(o,i,a)=>n().apply(i,a),construct:(o,i)=>new(n())(...i)})}function ft(...e){return t=>e.every(n=>typeof t[n]=="function")&&typeof t.__halcyon_probe__>"u"}var r=In(()=>z(ft("createElement","useState","useEffect","useMemo"))),Se=In(()=>z(ft("createPortal","flushSync"))??z(ft("createPortal"))),f=(...e)=>r.useState(...e),N=(...e)=>r.useEffect(...e),Nn=(...e)=>r.useMemo(...e);var re=(...e)=>r.useRef(...e);var zo="halcyon:ext:main",Bo="halcyon:ext:bridge",ke=new Map,mt=!1,Cn,Pn=new Promise(e=>{Cn=e});function Tn(){mt||(mt=!0,Cn())}function je(e,t){try{window.postMessage({channel:zo,kind:e,...t},"*")}catch{}}window.addEventListener("message",e=>{if(e.source!==window)return;let t=e.data;if(!(!t||t.channel!==Bo)&&t.kind==="hydrate"&&t.entries&&typeof t.entries=="object"){for(let[n,o]of Object.entries(t.entries))typeof o=="string"&&ke.set(n,o);Tn()}});var Go={read:e=>ke.has(e)?ke.get(e):null,write:(e,t)=>{ke.set(e,t),je("write",{key:e,value:t})},remove:e=>{ke.delete(e),je("remove",{key:e})}},jo=globalThis.HalcyonNative??={};jo.storage=Go;je("hydrate");setTimeout(()=>{mt||je("hydrate")},120);setTimeout(Tn,2e3);var vt=m("settings"),yt="halcyon:";function Uo(){let e=globalThis.HalcyonNative?.storage;if(e&&typeof e.read=="function"&&typeof e.write=="function")return e;try{let n=globalThis.localStorage;if(n)return{read:o=>n.getItem(o),write:(o,i)=>n.setItem(o,i),remove:o=>n.removeItem(o)}}catch{}vt.warn("no persistent storage backend; settings will not survive a restart");let t=new Map;return{read:n=>t.get(n)??null,write:(n,o)=>void t.set(n,o),remove:n=>void t.delete(n)}}var bt=Uo();function oe(e){let t=bt.read(yt+e);if(!t)return{};try{let n=JSON.parse(t);return n&&typeof n=="object"?n:{}}catch{let n=new Date().toISOString().replace(/[:.]/g,"-");try{bt.write(`${yt}${e}.corrupt-${n}`,t)}catch{}return vt.warn(`stored settings for "${e}" were unreadable; reset to defaults (backup kept)`),{}}}function he(e,t){try{bt.write(yt+e,JSON.stringify(t))}catch(n){vt.error(`could not persist settings for "${e}"`,n)}}var J=m("runtime"),xt="core.enabled",_t=class{records=new Map;enabledMap={};bootPatched=new Set;listeners=new Set;prepared=!1;booted=!1;register(t){if(this.records.has(t.id)){J.warn(`duplicate plugin id "${t.id}" ignored`);return}this.records.set(t.id,{plugin:t,state:"disabled"}),t.settings?.__bind(t.id)}registerAll(t){for(let n of t)this.register(n)}prepare(){this.prepared||(this.prepared=!0,bn(t=>this.records.get(t)?.plugin),this.enabledMap=oe(xt)??{},this.registerBootPatches(),pt())}async boot(){if(this.booted)return;this.booted=!0,this.prepare(),this.enabledMap=oe(xt)??{};for(let{plugin:n}of this.records.values())n.settings?.__bind(n.id);this.registerBootPatches(),await xn();for(let n of this.startOrder())this.shouldRun(n)&&this.startPlugin(n);this.emit(),J.info(`runtime up \u2014 ${this.runningCount()} plugin(s) active (build 2026-07-20 12:37:06)`)}isEnabled(t){let n=this.records.get(t);return n?n.plugin.required?!0:this.enabledMap[t]===!0:!1}enable(t){let n=this.records.get(t);if(n){for(let o of n.plugin.dependencies??[])this.isEnabled(o)||this.enable(o);this.enabledMap[t]=!0,this.persistEnabledState(),this.booted&&kn()&&this.startPlugin(t),this.emit()}}disable(t){let n=this.records.get(t);if(n){if(n.plugin.required){J.warn(`"${t}" is required and cannot be disabled`);return}for(let[o,i]of this.records)i.plugin.dependencies?.includes(t)&&this.isEnabled(o)&&this.disable(o);this.enabledMap[t]=!1,this.persistEnabledState(),this.stopPlugin(t),this.emit()}}toggle(t){return this.isEnabled(t)?(this.disable(t),!1):(this.enable(t),!0)}needsRestart(t){return this.records.get(t)?.plugin.patches?.length?this.isEnabled(t)!==this.bootPatched.has(t):!1}getPlugin(t){return this.records.get(t)?.plugin}list(){return[...this.records.values()].map(({plugin:t,state:n,error:o})=>({id:t.id,name:t.name,description:t.description,category:t.category,authors:t.authors,required:t.required??!1,hidden:t.hidden??!1,enabled:this.isEnabled(t.id),state:n,error:o,hasSettings:t.settings!=null,hasPage:t.page!=null,needsRestart:this.needsRestart(t.id)}))}onChange(t){return this.listeners.add(t),()=>this.listeners.delete(t)}shouldRun(t){if(!this.isEnabled(t))return!1;let n=this.records.get(t);return n?(n.plugin.dependencies??[]).every(o=>this.isEnabled(o)):!1}registerBootPatches(){for(let{plugin:t}of this.records.values())this.shouldRun(t.id)&&t.patches?.length&&!this.bootPatched.has(t.id)&&(this.registerPatches(t),this.bootPatched.add(t.id))}registerPatches(t){for(let n of t.patches??[]){let o=Array.isArray(n.replacement)?n.replacement:[n.replacement];for(let i of o)vn({pluginId:t.id,label:n.label,find:n.find,match:i.match,replace:i.replace,all:n.all??!1})}}startPlugin(t){let n=this.records.get(t);if(!(!n||n.state==="running"||n.state==="starting")){n.state="starting";try{n.plugin.start?.(),n.state="running",n.error=void 0,J.debug(`started "${t}"`)}catch(o){n.state="errored",n.error=o,this.enabledMap[t]=!1,this.persistEnabledState(),J.error(`plugin "${t}" threw during start; it has been disabled`,o)}this.emit()}}stopPlugin(t){let n=this.records.get(t);if(!(!n||n.state!=="running"&&n.state!=="errored")){n.state="stopping";try{n.plugin.stop?.(),J.debug(`stopped "${t}"`)}catch(o){J.error(`plugin "${t}" threw during stop; state may be inconsistent`,o)}finally{n.state="disabled",this.emit()}}}startOrder(){let t=[],n=new Set,o=(i,a)=>{if(n.has(i))return;if(a.has(i)){J.error(`dependency cycle involving "${i}"; breaking it`);return}a.add(i);let c=this.records.get(i);for(let s of c?.plugin.dependencies??[])this.records.has(s)&&o(s,a);a.delete(i),n.add(i),t.push(i)};for(let i of this.records.keys())o(i,new Set);return t}runningCount(){let t=0;for(let n of this.records.values())n.state==="running"&&t++;return t}persistEnabledState(){he(xt,this.enabledMap)}emit(){for(let t of this.listeners)try{t()}catch{}}},L=new _t;var Ho=Symbol.for("halcyon.plugin"),Fo=/^[a-z0-9]+(?:-[a-z0-9]+)*$/;function M(e){if(!Fo.test(e.id))throw new Error(`Halcyon: invalid plugin id "${e.id}" \u2014 use lowercase words separated by single dashes.`);if(!e.authors?.length)throw new Error(`Halcyon: plugin "${e.id}" must list at least one author.`);return Object.assign(e,{[Ho]:!0})}var Mn=`/*
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
`;var An=`/*
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

/* Look: badge \u2014 pill-shaped chip. */
.hc-deleted-marker--badge {
  display: inline-flex;
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
`;var Ln="halcyon-styles",Dn=!1;function pe(){if(Dn)return;let e=document.getElementById(Ln),t=e instanceof HTMLStyleElement?e:document.createElement("style");t.id=Ln,t.textContent=`${Mn}
${An}`,e||document.head.appendChild(t),Dn=!0}function _({size:e=20,className:t,filled:n,children:o,...i}){let a=i["aria-label"];return(typeof e!="number"||!Number.isFinite(e))&&(e=20),r.createElement("svg",{className:t,width:e,height:e,viewBox:"0 0 24 24",fill:n?"currentColor":"none",stroke:n?"none":"currentColor",strokeWidth:1.5,strokeLinecap:"round",strokeLinejoin:"round",role:a?"img":void 0,"aria-label":a,"aria-hidden":a?void 0:!0},o)}function Ue(e){return r.createElement(_,{...e},r.createElement("rect",{x:"3.25",y:"3.25",width:"17.5",height:"17.5",rx:"5"}),r.createElement("path",{d:"M6.5 13.2c1.4-2.5 2.9-2.5 4.3 0s2.9 2.5 4.3 0 2.9-2.5 2.9-2.5"}))}function $n(e){return r.createElement(_,{...e},r.createElement("path",{d:"M9 6l6 6-6 6"}))}function On(e){return r.createElement(_,{...e},r.createElement("circle",{cx:"12",cy:"12",r:"8.25"}),r.createElement("path",{d:"M12 7.5V12l3 2"}))}function j(e){return r.createElement(_,{...e},r.createElement("path",{d:"M4.5 7h15"}),r.createElement("path",{d:"M9.25 7V5.5A1.5 1.5 0 0110.75 4h2.5A1.5 1.5 0 0114.75 5.5V7"}),r.createElement("path",{d:"M6.5 7l.85 11.1A2 2 0 009.34 20h5.32a2 2 0 001.99-1.9L17.5 7"}),r.createElement("path",{d:"M10 11v5.5M14 11v5.5"}))}function St(e){return r.createElement(_,{...e},r.createElement("path",{d:"M13.5 6.5l4 4"}),r.createElement("path",{d:"M4.5 19.5l1-4L15.5 5.5a2 2 0 013 3L8.5 18.5l-4 1z"}))}function zn(e){return r.createElement(_,{...e},r.createElement("path",{d:"M12 3.5l7 2.6v5c0 4.4-3 7.3-7 8.9-4-1.6-7-4.5-7-8.9v-5l7-2.6z"}),r.createElement("path",{d:"M9 12l2 2 4-4"}))}function Bn(e){return r.createElement(_,{...e},r.createElement("path",{d:"M5 5.5h14a1.5 1.5 0 011.5 1.5v8a1.5 1.5 0 01-1.5 1.5H9.5L5.5 20v-3H5A1.5 1.5 0 013.5 15.5V7A1.5 1.5 0 015 5.5z"}))}function ge(e){return r.createElement(_,{...e},r.createElement("circle",{cx:"11",cy:"11",r:"6.25"}),r.createElement("path",{d:"M20 20l-3.8-3.8"}))}function Gn(e){return r.createElement(_,{...e},r.createElement("path",{d:"M6.5 6.5l11 11M17.5 6.5l-11 11"}))}function fe(e){return r.createElement(_,{...e},r.createElement("path",{d:"M4.5 8h9M17 8h2.5M4.5 16h2.5M10.5 16h9"}),r.createElement("circle",{cx:"15",cy:"8",r:"2.25"}),r.createElement("circle",{cx:"9",cy:"16",r:"2.25"}))}function jn(e){return r.createElement(_,{...e},r.createElement("path",{d:"M4.5 9.5v5H7l4.5 3.5V6L7 9.5H4.5z"}),r.createElement("path",{d:"M15 9a4 4 0 010 6"}),r.createElement("path",{d:"M17.5 6.5a7.5 7.5 0 010 11"}))}function Un(e){return r.createElement(_,{...e},r.createElement("circle",{cx:"12",cy:"12",r:"8.25"}),r.createElement("path",{d:"M12 3.75a8.25 8.25 0 010 16.5z",fill:"currentColor",stroke:"none"}))}function Hn(e){return r.createElement(_,{...e},r.createElement("path",{d:"M8.5 8L4.5 12l4 4"}),r.createElement("path",{d:"M15.5 8l4 4-4 4"}),r.createElement("path",{d:"M13.5 5.5l-3 13"}))}function Fn(e){return r.createElement(_,{...e,filled:!0},r.createElement("circle",{cx:"5.5",cy:"12",r:"1.6"}),r.createElement("circle",{cx:"12",cy:"12",r:"1.6"}),r.createElement("circle",{cx:"18.5",cy:"12",r:"1.6"}))}function Kn(e){return r.createElement(_,{...e},r.createElement("path",{d:"M12 4v10"}),r.createElement("path",{d:"M8 10.5l4 4 4-4"}),r.createElement("path",{d:"M5 19.5h14"}))}function He(e){return r.createElement(_,{...e},r.createElement("path",{d:"M12 5v14M5 12h14"}))}function Fe(e){return r.createElement(_,{...e},r.createElement("circle",{cx:"12",cy:"12",r:"8.25"}),r.createElement("path",{d:"M12 11v5"}),r.createElement("path",{d:"M12 7.75h.01"}))}function X(e){return r.createElement(_,{...e},r.createElement("path",{d:"M12 4.5L3.5 19h17L12 4.5z"}),r.createElement("path",{d:"M12 10v4"}),r.createElement("path",{d:"M12 16.75h.01"}))}function Q(e){return r.createElement(_,{...e},r.createElement("path",{d:"M8.5 7h11M8.5 12h11M8.5 17h11"}),r.createElement("path",{d:"M4.5 7h.01M4.5 12h.01M4.5 17h.01"}))}function Vn(e){return r.createElement(_,{...e},r.createElement("path",{d:"M5 12h14"}))}function ie(e){return r.createElement(_,{...e},r.createElement("path",{d:"M19 8.5a7.5 7.5 0 10.9 6"}),r.createElement("path",{d:"M19 4v4.5h-4.5"}))}function Wn(e){return r.createElement(_,{...e},r.createElement("path",{d:"M15 6l-6 6 6 6"}))}function Ke(e){return r.createElement(_,{...e},r.createElement("rect",{x:"4",y:"4",width:"16",height:"6",rx:"2"}),r.createElement("rect",{x:"4",y:"14",width:"16",height:"6",rx:"2"}),r.createElement("path",{d:"M8 7h.01M8 17h.01"}))}function qn(e){return r.createElement(_,{...e},r.createElement("circle",{cx:"12",cy:"12",r:"2"}),r.createElement("path",{d:"M8.5 8.5a5 5 0 000 7M15.5 8.5a5 5 0 010 7"}),r.createElement("path",{d:"M6 6a9 9 0 000 12M18 6a9 9 0 010 12"}))}function $({checked:e,onChange:t,disabled:n,...o}){return r.createElement("button",{type:"button",role:"switch","aria-checked":e,"aria-label":o["aria-label"],className:"hc-toggle","data-on":e,disabled:n,onClick:()=>{n||t(!e)}},r.createElement("span",{className:"hc-toggle__knob"}))}function Yn({icon:e,iconBackground:t,title:n,subtitle:o,accessory:i,onClick:a,showChevron:c}){let s=typeof a=="function";return r.createElement("div",{className:s?"hc-row hc-row--button":"hc-row",onClick:a,role:s?"button":void 0,tabIndex:s?0:void 0,onKeyDown:s?l=>{(l.key==="Enter"||l.key===" ")&&(l.preventDefault(),a?.())}:void 0},e&&r.createElement("div",{className:"hc-row__icon",style:t?{background:t}:void 0},e),r.createElement("div",{className:"hc-row__text"},r.createElement("div",{className:"hc-row__title"},n),o!=null&&o!==!1&&r.createElement("div",{className:"hc-row__subtitle"},o)),i!=null&&i!==!1&&r.createElement("div",{className:"hc-row__accessory"},i),c&&r.createElement($n,{size:20,className:"hc-row__chevron"}))}function ae({tone:e="neutral",children:t}){return r.createElement("span",{className:"hc-badge","data-tone":e},t)}function B({icon:e,title:t,subtitle:n,action:o}){return r.createElement("div",{className:"hc-empty"},e,r.createElement("div",{className:"hc-empty__title"},t),n&&r.createElement("div",{className:"hc-empty__subtitle"},n),o&&r.createElement("div",{style:{marginTop:"var(--hc-space-5)"}},o))}function Jn(e,t,n){return t!=null&&e<t?t:n!=null&&e>n?n:e}function Xn({value:e,onChange:t,min:n,max:o,step:i=1}){let a=n!=null&&e<=n,c=o!=null&&e>=o;return r.createElement("div",{className:"hc-stepper"},r.createElement("button",{type:"button",className:"hc-stepper__btn",onClick:()=>t(Jn(e-i,n,o)),disabled:a,"aria-label":"\u51CF\u5C11"},r.createElement(Vn,{size:16})),r.createElement("span",{className:"hc-stepper__value"},e),r.createElement("button",{type:"button",className:"hc-stepper__btn",onClick:()=>t(Jn(e+i,n,o)),disabled:c,"aria-label":"\u589E\u52A0"},r.createElement(He,{size:16})))}function U({value:e,onChange:t,className:n,...o}){return r.createElement("input",{className:n?`hc-input ${n}`:"hc-input",value:e,onChange:i=>t(i.currentTarget.value),...o})}function Ve({value:e,options:t,onChange:n,...o}){let[i,a]=f(!1),[c,s]=f(-1),l=re(null),d=re(null),[u,g]=f(null),E=t.find(h=>h.value===e);N(()=>{if(!i)return;let h=y=>{let x=y.target;l.current?.contains(x)||d.current?.contains(x)||a(!1)};return document.addEventListener("pointerdown",h,!0),()=>document.removeEventListener("pointerdown",h,!0)},[i]),N(()=>{if(!i)return;let h=y=>{d.current&&y.target instanceof Node&&d.current.contains(y.target)||a(!1)};return window.addEventListener("scroll",h,!0),window.addEventListener("resize",h),()=>{window.removeEventListener("scroll",h,!0),window.removeEventListener("resize",h)}},[i]);let W=()=>{let h=l.current?.getBoundingClientRect();if(h){let y=Math.min(280,t.length*36+10),x=h.bottom+6,A=x+y>window.innerHeight-8?Math.max(8,h.top-6-y):x;g({top:A,right:Math.max(8,window.innerWidth-h.right),width:h.width})}s(Math.max(0,t.findIndex(y=>y.value===e))),a(!0)},ee=h=>{a(!1),h!==e&&n(h)},de=h=>{if(!i){(h.key==="Enter"||h.key===" "||h.key==="ArrowDown")&&(h.preventDefault(),W());return}h.key==="Escape"?(h.preventDefault(),a(!1)):h.key==="ArrowDown"?(h.preventDefault(),s(y=>Math.min(t.length-1,y+1))):h.key==="ArrowUp"?(h.preventDefault(),s(y=>Math.max(0,y-1))):h.key==="Enter"||h.key===" "?(h.preventDefault(),c>=0&&c<t.length&&ee(t[c].value)):h.key==="Tab"&&a(!1)};return r.createElement("div",{className:"hc-select",ref:l,onKeyDown:de},r.createElement("button",{type:"button",className:"hc-select__button","aria-haspopup":"listbox","aria-expanded":i,"aria-label":o["aria-label"],onClick:()=>i?a(!1):W()},r.createElement("span",{className:"hc-select__value"},E?.label??e),r.createElement("svg",{className:"hc-select__chevron",width:"12",height:"12",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:2.5,strokeLinecap:"round",strokeLinejoin:"round","aria-hidden":!0,"data-open":i},r.createElement("path",{d:"M6 9l6 6 6-6"}))),i&&u&&Se.createPortal(r.createElement("div",{className:"halcyon",ref:d,style:{position:"fixed",top:u.top,right:u.right,zIndex:1e4},onKeyDown:de},r.createElement("div",{className:"hc-select__menu",role:"listbox",style:{minWidth:u.width}},t.map((h,y)=>r.createElement("button",{type:"button",key:h.value,role:"option","aria-selected":h.value===e,className:"hc-select__option","data-active":y===c,"data-selected":h.value===e,onPointerEnter:()=>s(y),onClick:()=>ee(h.value)},r.createElement("span",{className:"hc-select__optlabel"},h.label),h.value===e&&r.createElement("svg",{className:"hc-select__check",width:"14",height:"14",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:2.5,strokeLinecap:"round",strokeLinejoin:"round","aria-hidden":!0},r.createElement("path",{d:"M5 12.5l4.5 4.5L19 7"})))))),document.body))}function Qn({value:e,onChange:t,itemPlaceholder:n}){let[o,i]=f(""),a=()=>{let s=o.trim();if(!s||e.includes(s)){i("");return}t([...e,s]),i("")},c=s=>{t(e.filter((l,d)=>d!==s))};return r.createElement("div",{className:"hc-strlist"},e.map((s,l)=>r.createElement("div",{className:"hc-strlist__item",key:s},r.createElement(U,{value:s,onChange:()=>{},readOnly:!0}),r.createElement("button",{type:"button",className:"hc-iconbtn hc-iconbtn--danger",onClick:()=>c(l),"aria-label":"\u79FB\u9664"},r.createElement(j,{size:18})))),r.createElement("div",{className:"hc-strlist__add"},r.createElement(U,{value:o,onChange:i,placeholder:n??"\u6DFB\u52A0\u4E00\u9879",onKeyDown:s=>{s.key==="Enter"&&(s.preventDefault(),a())}}),r.createElement("button",{type:"button",className:"hc-iconbtn",onClick:a,"aria-label":"\u6DFB\u52A0",disabled:!o.trim()},r.createElement(He,{size:18}))))}function w({variant:e="secondary",size:t="md",icon:n,className:o,children:i,type:a="button",...c}){let s=["hc-btn",`hc-btn--${e}`];return t!=="md"&&s.push(`hc-btn--${t}`),o&&s.push(o),r.createElement("button",{type:a,className:s.join(" "),...c},n,i!=null&&i!==!1&&r.createElement("span",null,i))}function We(){let[e,t]=f(()=>L.list());return N(()=>{let n=()=>t(L.list());return n(),L.onChange(n)},[]),e}function Zn(e){let[,t]=f(0);return N(()=>{let n=Object.keys(e.schema).map(o=>e.subscribe(o,()=>t(i=>i+1)));return()=>{for(let o of n)o()}},[e]),e.store}function Rn(e){return e===null||typeof e!="object"?e:JSON.parse(JSON.stringify(e))}function Wo(e,t){if(e===t)return!0;try{return JSON.stringify(e)===JSON.stringify(t)}catch{return!1}}function er({settings:e}){let t=Zn(e),n=Nn(()=>Object.keys(e.schema).filter(d=>!e.schema[d].hidden),[e]),[o,i]=f(()=>kt(t,n));if(N(()=>{i(kt(t,n))},[e]),n.length===0)return null;let a=n.filter(d=>!Wo(o[d],t[d])),c=()=>{for(let d of a)t[d]=Rn(o[d])},s=()=>i(kt(t,n)),l=[];for(let d of n){let u=e.schema[d].group??"\u8BBE\u7F6E",g=l[l.length-1];g&&g.title===u?g.keys.push(d):l.push({title:u,keys:[d]})}return r.createElement(r.Fragment,null,l.map((d,u)=>r.createElement("div",{className:"hc-section",key:`${d.title}-${u}`},r.createElement("div",{className:"hc-section__title"},d.title),r.createElement("div",{className:"hc-section__body"},d.keys.map(g=>r.createElement(qo,{key:g,def:e.schema[g],value:o[g],onChange:E=>i(W=>({...W,[g]:E}))}))))),a.length>0&&r.createElement("div",{className:"hc-savebar"},r.createElement("span",{className:"hc-savebar__label"},"\u6709 ",a.length," \u9879\u672A\u4FDD\u5B58\u7684\u4FEE\u6539"),r.createElement("div",{className:"hc-savebar__actions"},r.createElement(w,{size:"sm",variant:"plain",onClick:s},"\u653E\u5F03"),r.createElement(w,{size:"sm",variant:"primary",onClick:c},"\u4FDD\u5B58"))))}function kt(e,t){let n={};for(let o of t)n[o]=Rn(e[o]);return n}function qo({def:e,value:t,onChange:n}){let o=r.createElement("div",{className:"hc-cell__main"},r.createElement("div",{className:"hc-cell__label"},e.label),e.description&&r.createElement("div",{className:"hc-cell__desc"},e.description));switch(e.type){case"boolean":return r.createElement("div",{className:"hc-cell hc-cell--row"},o,r.createElement($,{checked:t===!0,onChange:i=>n(i),disabled:e.disabled?.(),"aria-label":e.label}));case"number":return r.createElement("div",{className:"hc-cell hc-cell--row"},o,r.createElement(Xn,{value:typeof t=="number"?t:e.default,onChange:i=>n(i),min:e.min,max:e.max,step:e.step}));case"select":return r.createElement("div",{className:"hc-cell hc-cell--row"},o,r.createElement(Ve,{value:typeof t=="string"?t:e.default,onChange:i=>n(i),options:e.options}));case"string":return r.createElement("div",{className:"hc-cell"},r.createElement("div",{className:"hc-cell--row"},o),r.createElement("div",{className:"hc-cell__control"},r.createElement(U,{value:typeof t=="string"?t:"",onChange:i=>n(i),placeholder:e.placeholder,maxLength:e.maxLength})));case"string-list":return r.createElement("div",{className:"hc-cell"},o,r.createElement("div",{className:"hc-cell__control"},r.createElement(Qn,{value:Array.isArray(t)?t:[],onChange:i=>n(i),itemPlaceholder:e.itemPlaceholder})));case"custom":{let i=e.component;return r.createElement("div",{className:"hc-cell"},o,r.createElement("div",{className:"hc-cell__control"},r.createElement(i,{value:t,onChange:n})))}default:return null}}var qe={utility:{label:"\u5B9E\u7528\u5DE5\u5177",color:"var(--hc-accent)",Icon:fe},chat:{label:"\u804A\u5929",color:"var(--hc-green)",Icon:Bn},voice:{label:"\u8BED\u97F3",color:"var(--hc-indigo)",Icon:jn},appearance:{label:"\u5916\u89C2",color:"var(--hc-pink)",Icon:Un},privacy:{label:"\u9690\u79C1",color:"var(--hc-teal)",Icon:zn},developer:{label:"\u5F00\u53D1\u8005",color:"var(--hc-orange)",Icon:Hn},misc:{label:"\u5176\u4ED6",color:"var(--hc-fill-primary)",Icon:Fn}},tr=["utility","chat","voice","appearance","privacy","developer","misc"];function nr(){let e=We().filter(l=>!l.hidden),[t,n]=f(null),[o,i]=f(""),a=t?e.find(l=>l.id===t):void 0;if(a)return r.createElement(Jo,{view:a,onBack:()=>n(null)});let c=o.trim().toLowerCase(),s=c?e.filter(l=>l.name.toLowerCase().includes(c)||l.description.toLowerCase().includes(c)):e;return r.createElement("div",null,r.createElement("div",{className:"hc-toolbar"},r.createElement("div",{className:"hc-search"},r.createElement(ge,{size:20}),r.createElement("input",{value:o,onChange:l=>i(l.currentTarget.value),placeholder:"\u641C\u7D22\u63D2\u4EF6","aria-label":"\u641C\u7D22\u63D2\u4EF6"}))),s.length===0?r.createElement(B,{icon:r.createElement(ge,{size:48}),title:"\u6CA1\u6709\u5339\u914D\u7684\u63D2\u4EF6",subtitle:"\u6362\u4E2A\u5173\u952E\u8BCD\u518D\u8BD5\u8BD5\u3002"}):tr.map(l=>{let d=s.filter(g=>g.category===l);if(d.length===0)return null;let u=qe[l];return r.createElement("div",{className:"hc-section",key:l},r.createElement("div",{className:"hc-section__title"},u.label),r.createElement("div",{className:"hc-section__body"},d.map(g=>r.createElement(Yo,{key:g.id,view:g,onOpen:()=>n(g.id)}))))}))}function Yo({view:e,onOpen:t}){let n=qe[e.category],o=n.Icon,i=e.hasSettings||e.hasPage;return r.createElement(Yn,{icon:r.createElement(o,{size:18}),iconBackground:n.color,title:e.name,subtitle:e.description,onClick:i?t:void 0,showChevron:i,accessory:r.createElement(r.Fragment,null,e.needsRestart&&r.createElement(ae,{tone:"orange"},r.createElement(ie,{size:12})," \u5F85\u91CD\u542F"),e.state==="errored"&&r.createElement(ae,{tone:"red"},r.createElement(X,{size:12})," \u51FA\u9519"),r.createElement("span",{onClick:a=>a.stopPropagation(),onKeyDown:a=>a.stopPropagation()},r.createElement($,{checked:e.enabled,disabled:e.required,onChange:()=>L.toggle(e.id),"aria-label":`\u542F\u7528 ${e.name}`})))})}function Jo({view:e,onBack:t}){let n=L.getPlugin(e.id),o=qe[e.category],i=o.Icon,a=!!(n?.settings&&Object.values(n.settings.schema).some(d=>!d.hidden)),c=!!n?.page&&a,[s,l]=f("page");return r.createElement("div",null,r.createElement("button",{type:"button",className:"hc-back",onClick:t},r.createElement(Wn,{size:20}),"\u63D2\u4EF6"),r.createElement("div",{className:"hc-detail-head"},r.createElement("div",{className:"hc-detail-head__icon",style:{background:o.color}},r.createElement(i,{size:26})),r.createElement("div",{className:"hc-detail-head__text"},r.createElement("div",{className:"hc-detail-head__name"},e.name),r.createElement("div",{className:"hc-detail-head__desc"},e.description),r.createElement("div",{className:"hc-detail-head__meta"},e.authors.map(d=>d.name).join("\u3001"))),r.createElement("span",{onClick:d=>d.stopPropagation(),onKeyDown:d=>d.stopPropagation()},r.createElement($,{checked:e.enabled,disabled:e.required,onChange:()=>L.toggle(e.id),"aria-label":`\u542F\u7528 ${e.name}`}))),e.needsRestart&&r.createElement("div",{className:"hc-inline-note"},r.createElement(ie,{size:18}),r.createElement("span",null,"\u8FD9\u4E2A\u63D2\u4EF6\u5305\u542B\u52A0\u8F7D\u671F\u8865\u4E01\uFF0C\u9700\u8981\u91CD\u542F Discord \u624D\u80FD\u5B8C\u5168\u751F\u6548\u3002")),e.state==="errored"&&r.createElement("div",{className:"hc-inline-note hc-inline-note--danger"},r.createElement(X,{size:18}),r.createElement("span",null,"\u63D2\u4EF6\u542F\u52A8\u65F6\u629B\u51FA\u5F02\u5E38\uFF0C\u5DF2\u88AB\u81EA\u52A8\u505C\u7528\uFF0C\u8BE6\u60C5\u89C1\u65E5\u5FD7\u3002")),c&&r.createElement("div",{className:"hc-segment"},r.createElement("button",{type:"button",className:"hc-segment__item","data-active":s==="page",onClick:()=>l("page")},n.page.title||"\u8BB0\u5F55"),r.createElement("button",{type:"button",className:"hc-segment__item","data-active":s==="settings",onClick:()=>l("settings")},"\u8BBE\u7F6E")),n?.page&&(!c||s==="page")?r.createElement(n.page.component,null):n?.settings?r.createElement(er,{settings:n.settings}):r.createElement(B,{title:"\u6CA1\u6709\u53EF\u914D\u7F6E\u9879",subtitle:"\u8FD9\u4E2A\u63D2\u4EF6\u5F00\u7BB1\u5373\u7528\uFF0C\u65E0\u9700\u8BBE\u7F6E\u3002"}))}var rr=500,wt=100;function or(){let[e,t]=f(()=>ut().slice()),[n,o]=f(0),i=re(null);N(()=>(t(ut().slice()),pn(d=>{t(u=>{let g=u.concat(d);return g.length>rr?g.slice(g.length-rr):g})})),[]);let a=Math.max(1,Math.ceil(e.length/wt)),c=Math.min(n,a-1),s=e.length-c*wt,l=e.slice(Math.max(0,s-wt),s);return N(()=>{if(c!==0)return;let d=i.current;d&&(d.scrollTop=d.scrollHeight)},[e,c]),e.length===0?r.createElement(B,{icon:r.createElement(Q,{size:48}),title:"\u6682\u65E0\u65E5\u5FD7",subtitle:"\u8FD0\u884C\u65F6\u548C\u63D2\u4EF6\u7684\u8F93\u51FA\u4F1A\u5B9E\u65F6\u51FA\u73B0\u5728\u8FD9\u91CC\u3002"}):r.createElement("div",{className:"hc-stack"},r.createElement("div",{className:"hc-logs",ref:i},l.map((d,u)=>r.createElement("div",{className:"hc-logline","data-level":d.level,key:`${d.time}-${u}`},r.createElement("span",{className:"hc-logline__time"},Xo(d.time)),r.createElement("span",{className:"hc-logline__scope"},d.scope),r.createElement("span",{className:"hc-logline__msg"},d.parts.map(Qo).join(" "))))),a>1&&r.createElement("div",{className:"hc-pager"},r.createElement("button",{type:"button",className:"hc-tab",disabled:c>=a-1,onClick:()=>o(Math.min(a-1,c+1))},"\u2190 \u66F4\u65E9"),r.createElement("span",{className:"hc-pager__label"},c===0?"\u5B9E\u65F6":`\u7B2C ${a-c} / ${a} \u9875`),r.createElement("button",{type:"button",className:"hc-tab",disabled:c===0,onClick:()=>o(Math.max(0,c-1))},"\u66F4\u65B0 \u2192")))}function Xo(e){let t=new Date(e);return`${t.toLocaleTimeString(void 0,{hour12:!1})}.${String(t.getMilliseconds()).padStart(3,"0")}`}function Qo(e){if(typeof e=="string")return e;if(e instanceof Error)return e.stack??e.message;try{return JSON.stringify(e)}catch{return String(e)}}function O({title:e,note:t,children:n}){return r.createElement("div",{className:"hc-section"},e&&r.createElement("div",{className:"hc-section__title"},e),r.createElement("div",{className:"hc-section__body"},n),t&&r.createElement("div",{className:"hc-section__note"},t))}function ir(){let e=We().filter(o=>!o.hidden),t=e.filter(o=>o.enabled).length;return r.createElement("div",{className:"hc-stack"},r.createElement("div",{className:"hc-about-hero"},r.createElement(Ue,{size:32}),r.createElement("div",null,r.createElement("div",{className:"hc-about-hero__name"},"Halcyon"),r.createElement("div",{className:"hc-about-hero__ver"},"\u7248\u672C ","0.1.9"))),r.createElement(O,{title:"\u6982\u89C8"},r.createElement(Ye,{label:"\u63D2\u4EF6\u603B\u6570",value:String(e.length)}),r.createElement(Ye,{label:"\u5DF2\u542F\u7528",value:String(t)})),r.createElement(O,{title:"\u9879\u76EE",note:"\u4FEE\u6539 Discord \u5BA2\u6237\u7AEF\u8FDD\u53CD\u5176\u670D\u52A1\u6761\u6B3E\uFF0C\u7531\u6B64\u4EA7\u751F\u7684\u4EFB\u4F55\u540E\u679C\u7531\u4F7F\u7528\u8005\u81EA\u884C\u627F\u62C5\u3002\u672C\u9879\u76EE\u4EC5\u4F9B\u6280\u672F\u7814\u7A76\u4E0E\u4E2A\u4EBA\u4F7F\u7528\u3002"},r.createElement(Ye,{label:"\u4F5C\u8005",value:"caitemm (mzrodyu)"}),r.createElement(Ye,{label:"\u8BB8\u53EF\u534F\u8BAE",value:"GPL-3.0-or-later"})))}function Ye({label:e,value:t}){return r.createElement("div",{className:"hc-cell hc-cell--row"},r.createElement("div",{className:"hc-cell__main"},r.createElement("div",{className:"hc-cell__label"},e)),r.createElement("span",{className:"hc-about__value"},t))}var Et=[{id:"plugins",label:"\u63D2\u4EF6",title:"\u63D2\u4EF6",Icon:fe},{id:"logs",label:"\u65E5\u5FD7",title:"\u65E5\u5FD7",Icon:Q},{id:"about",label:"\u5173\u4E8E",title:"\u5173\u4E8E Halcyon",Icon:Fe}];function ar(e){switch(e){case"plugins":return r.createElement(nr,null);case"logs":return r.createElement(or,null);case"about":return r.createElement(ir,null)}}function sr({onClose:e}){let[t,n]=f("plugins"),o=Et.find(i=>i.id===t)??Et[0];return r.createElement("div",{className:"halcyon hc-panel"},r.createElement("nav",{className:"hc-panel__sidebar"},r.createElement("div",{className:"hc-panel__brand"},r.createElement(Ue,{size:24}),r.createElement("span",{className:"hc-panel__brand-name"},"Halcyon")),Et.map(i=>r.createElement("button",{key:i.id,type:"button",className:"hc-navitem","data-active":i.id===t,onClick:()=>n(i.id)},r.createElement(i.Icon,{size:18}),i.label))),r.createElement("section",{className:"hc-panel__content"},r.createElement("header",{className:"hc-panel__header"},r.createElement("span",{className:"hc-title2"},o.title),e&&r.createElement("button",{type:"button",className:"hc-iconbtn",onClick:e,"aria-label":"\u5173\u95ED"},r.createElement(Gn,{size:20}))),r.createElement("div",{className:"hc-panel__scroll"},ar(t))))}function Je({tab:e}){return r.createElement("div",{className:"halcyon hc-embed"},ar(e))}var Zo=m("settings"),H=null,we=null;function Xe(){if(pe(),!H){H=document.createElement("div"),H.className="halcyon",document.body.appendChild(H),we=e=>{e.key==="Escape"&&se()},document.addEventListener("keydown",we);try{Se.render(r.createElement(Ro,{onClose:se}),H)}catch(e){Zo.error("could not open settings overlay",e),se()}}}function se(){if(we&&(document.removeEventListener("keydown",we),we=null),H){try{Se.unmountComponentAtNode(H)}catch{}H.remove(),H=null}}function Ro({onClose:e}){return r.createElement("div",{className:"hc-overlay",role:"dialog","aria-modal":"true","aria-label":"Halcyon \u8BBE\u7F6E",onMouseDown:t=>{t.target===t.currentTarget&&e()}},r.createElement(sr,{onClose:e}))}var F=m("settings-host");function lr(){return r.createElement(Je,{tab:"plugins"})}function dr(){return r.createElement(Je,{tab:"logs"})}function ur(){return r.createElement(Je,{tab:"about"})}function ei(e){return function(){return r.createElement(e,{size:20})}}var cr="halcyon-section",ti=[{key:"halcyon-plugins",title:"\u63D2\u4EF6",Component:lr,Icon:fe},{key:"halcyon-logs",title:"\u65E5\u5FD7",Component:dr,Icon:Q},{key:"halcyon-about",title:"\u5173\u4E8E",Component:ur,Icon:Fe}],Ze=!1,ni=!0,It={SECTION:1,SIDEBAR_ITEM:2,PANEL:3,CATEGORY:5,CUSTOM:20},Qe=null;function ri(){if(Qe)return Qe;try{let e=ue("SECTION","SIDEBAR_ITEM","PANEL","CUSTOM");if(e&&typeof e.SECTION=="number")return Qe={SECTION:e.SECTION,SIDEBAR_ITEM:e.SIDEBAR_ITEM,PANEL:e.PANEL,CATEGORY:typeof e.CATEGORY=="number"?e.CATEGORY:It.CATEGORY,CUSTOM:e.CUSTOM},Qe}catch(e){F.warn("could not resolve settings layout types; using fallback values",e)}return It}function Z(e){try{if(e&&typeof e.buildLayout=="function"){let t=e.buildLayout();if(Array.isArray(t))return t}}catch{}return[]}function hr(e){let t={...It};try{let n=Array.isArray(e)?e[0]:void 0;n&&typeof n.type=="number"&&(t.SECTION=n.type);for(let o of e)for(let i of Z(o))if(typeof i?.type=="number"){t.SIDEBAR_ITEM=i.type;for(let a of Z(i))if(typeof a?.type=="number"){t.PANEL=a.type;for(let c of Z(a))if(typeof c?.type=="number"){t.CATEGORY=c.type;for(let s of Z(c))if(s&&typeof s.type=="number"&&"Component"in s)return t.CUSTOM=s.type,t}}}}catch(n){F.warn("could not read layout types from the live tree; using fallbacks",n)}return t}function oi(e,t){let n={key:`${t.key}-panel`,type:e.PANEL,useTitle:()=>t.title,buildLayout:()=>[{key:`${t.key}-category`,type:e.CATEGORY,buildLayout:()=>[{key:`${t.key}-custom`,type:e.CUSTOM,Component:t.Component,useSearchTerms:()=>[t.title]}]}]};return{key:t.key,type:e.SIDEBAR_ITEM,useTitle:()=>t.title,icon:ei(t.Icon),buildLayout:()=>[n]}}function Ee(e){let t={};if(e&&typeof e=="object")for(let n of Object.keys(e)){let o=e[n];typeof o=="function"&&(t[n]=String(o).replace(/\s+/g," ").slice(0,400))}return t}function pr(e,t){if(!e||typeof e!="object")return{raw:typeof e};let n={key:e.key,type:e.type,fields:Object.keys(e)};if(t>0&&typeof e.buildLayout=="function")try{let o=e.buildLayout();Array.isArray(o)&&(n.children=o.slice(0,6).map(i=>pr(i,t-1)))}catch(o){n.childrenError=String(o)}return n}function ii(e){if(!Ze){Ze=!0;try{let t=e[0],n=Z(t)[0],o=Z(n)[0],i=Z(o)[0],a=Z(i)[0],c={resolvedTypesFromEnum:ri(),resolvedTypesFromLive:hr(e),topLevelCount:e.length,sampleSources:{section:Ee(t),sidebarItem:Ee(n),panel:Ee(o),category:Ee(i),leaf:Ee(a)},layout:e.slice(0,12).map(s=>pr(s,2))};globalThis.__halcyonLayoutProbe=JSON.stringify(c,null,2),F.info("[embed-probe] captured Discord's settings layout shape. In the console run  copy(__halcyonLayoutProbe)  and paste the result back.")}catch(t){F.warn("[embed-probe] failed to capture layout shape",t)}}}function ai(){return[{section:"HEADER",label:"HALCYON"},{section:"halcyon-plugins",label:"\u63D2\u4EF6",element:lr},{section:"halcyon-logs",label:"\u65E5\u5FD7",element:dr},{section:"halcyon-about",label:"\u5173\u4E8E",element:ur}]}var Ie=null,gr=M({id:"halcyon-settings",name:"Halcyon \u8BBE\u7F6E",description:"Halcyon \u81EA\u8EAB\u7684\u8BBE\u7F6E\u754C\u9762\u5BBF\u4E3B\u3002",authors:[{name:"caitemm"}],category:"misc",required:!0,hidden:!0,patches:[{label:"user-settings-layout",find:".buildLayout().map",replacement:{match:/([A-Za-z_$][\w$]*)\.buildLayout\(\)(?=\.map)/,replace:"$self.buildLayout($1)"}},{label:"user-settings-sidebar",find:"getPredicateSections",replacement:{match:/getPredicateSections\(\)(\{(?:[^{}]|\{(?:[^{}]|\{[^{}]*\})*\})*\})/,replace:(e,t)=>`getPredicateSections(){return $self.injectSections((()=>${t})())}`}}],buildLayout(e){let t=e.buildLayout();try{if(!e||e.key!=="$Root"||!Array.isArray(t)||(ii(t),!ni)||t.some(a=>a?.key===cr))return t;let n=hr(t),o={key:cr,type:n.SECTION,useTitle:()=>"HALCYON",buildLayout:()=>ti.map(a=>oi(n,a))},i=t.findIndex(a=>a?.key==="billing_section");return i<0&&(i=t.findIndex(a=>a?.key==="user_section")),i<0&&(i=Math.min(2,t.length)),t.splice(i,0,o),F.info(`native settings embed active \u2014 section inserted at index ${i}/${t.length}`),t}catch(n){return F.error("failed to inject settings section into layout",n),t}},injectSections(e){try{if(!Array.isArray(e)||e.some(i=>i?.section==="halcyon-plugins"))return e;let t=ai(),n=e.slice(),o=n.findIndex(i=>i&&i.section==="DIVIDER");return o>=0?n.splice(o+1,0,...t):n.push({section:"DIVIDER"},...t),Ze||(Ze=!0,F.info(`native settings embed active (legacy) \u2014 ${e.length} base sections`)),n}catch(t){return F.error("failed to inject settings sections",t),e}},start(){pe(),Ie=e=>{(e.ctrlKey||e.metaKey)&&e.shiftKey&&e.code==="KeyH"&&(e.preventDefault(),Xe())},window.addEventListener("keydown",Ie),F.info("settings host ready \u2014 open with Ctrl/Cmd+Shift+H")},stop(){Ie&&(window.removeEventListener("keydown",Ie),Ie=null),se()}});var Ne=m("patcher"),Re=Symbol("halcyon.patch");function si(e,t){let n=e[t];if(n&&n[Re])return n[Re];if(typeof n!="function")throw new TypeError(`cannot patch "${t}": not a function`);let o={before:new Set,instead:new Set,after:new Set,original:n},i=function(...a){let c={args:a,result:void 0,self:this,callOriginal:()=>o.original.apply(this,c.args)};for(let s of o.before)try{s(c)}catch(l){Ne.error(`before-hook on "${t}" threw`,l)}if(o.instead.size){let s,l=!1;for(let d of o.instead)try{s=d(c),l=!0}catch(u){Ne.error(`instead-hook on "${t}" threw; falling back to original`,u),s=c.callOriginal(),l=!0}c.result=l?s:c.callOriginal()}else try{c.result=o.original.apply(this,c.args)}catch(s){throw s}for(let s of o.after)try{s(c)}catch(l){Ne.error(`after-hook on "${t}" threw`,l)}return c.result};return Object.defineProperty(i,"name",{value:n.name,configurable:!0}),Object.defineProperty(i,"length",{value:n.length,configurable:!0}),i.toString=()=>o.original.toString(),i[Re]=o,Object.assign(i,n),e[t]=i,o}function ci(e,t,n){n.before.size||n.instead.size||n.after.size||e[t]&&e[t][Re]===n&&(e[t]=n.original)}function Nt(e,t,n,o){if(t==null)return Ne.error(`refusing to patch "${n}" on a null target`),()=>{};let i;try{i=si(t,n)}catch(c){return Ne.error(c),()=>{}}i[e].add(o);let a=!0;return()=>{a&&(a=!1,i[e].delete(o),ci(t,n,i))}}var ce={before(e,t,n){return Nt("before",e,t,n)},after(e,t,n){return Nt("after",e,t,n)},instead(e,t,n){return Nt("instead",e,t,n)}};var Pc=C(ne);function fr(){try{let e=Ce?._dispatcher;if(ne(e))return e}catch{}return z(ne)}var mr=C(e=>typeof e?.getMessage=="function"&&typeof e?.getMessages=="function"),Tc=C(e=>typeof e?.editMessage=="function"&&typeof e?.deleteMessage=="function"),Ce=C(e=>typeof e?.getCurrentUser=="function"&&typeof e?.getUser=="function"),Pe=C(e=>e?.getName?.()==="ChannelStore"||e?.constructor?.displayName==="ChannelStore"),Mc=C(e=>typeof e?.getChannelId=="function"&&typeof e?.getLastSelectedChannelId=="function"),et=C(e=>e?.getName?.()==="GuildStore"||e?.constructor?.displayName==="GuildStore"),yr=C(e=>typeof e?.getChannels=="function"&&typeof e?.getDefaultChannel=="function"),Ct=C(e=>typeof e?.subscribeToGuild=="function"||typeof e?.subscribeToChannel=="function"),Ac=C(e=>typeof e=="function"&&typeof e?.locale=="function"&&typeof e?.utc=="function");var br=m("settings");function Pt(e){return e===null||typeof e!="object"?e:JSON.parse(JSON.stringify(e))}function D(e){let t=new Map,n=null,o={};for(let s of Object.keys(e))o[s]=Pt(e[s].default);let i=()=>{n&&he(n,o)},a=(s,l,d)=>{let u=t.get(s);if(u)for(let g of u)try{g(l,d)}catch(E){br.error(`settings listener for "${s}" threw`,E)}},c=new Proxy(o,{get:(s,l)=>s[l],set:(s,l,d)=>{if(!(l in e))return br.warn(`ignoring write to unknown setting "${l}"`),!0;let u=s[l];return Object.is(u,d)||(s[l]=d,i(),a(l,d,u)),!0}});return{schema:e,store:c,subscribe(s,l){let d=s,u=t.get(d);return u||(u=new Set,t.set(d,u)),u.add(l),()=>void u.delete(l)},reset(s){if(s!=null){c[s]=Pt(e[s].default);return}for(let l of Object.keys(e))c[l]=Pt(e[l].default)},__bind(s){n=s;let l=oe(s);for(let d of Object.keys(e))Object.prototype.hasOwnProperty.call(l,d)&&(o[d]=l[d])}}}var P=D({keepDeletedInChat:{group:"\u8BB0\u5F55",type:"boolean",default:!0,label:"\u5728\u804A\u5929\u4E2D\u4FDD\u7559\u88AB\u5220\u6D88\u606F",description:"\u88AB\u5220\u9664\u7684\u6D88\u606F\u4E0D\u518D\u6D88\u5931\uFF0C\u800C\u662F\u6807\u8BB0\u4FDD\u7559\u5728\u539F\u4F4D\u3002\u9700\u8981\u5BA2\u6237\u7AEF\u8865\u4E01\u751F\u6548\u3002"},logEdits:{group:"\u8BB0\u5F55",type:"boolean",default:!0,label:"\u8BB0\u5F55\u7F16\u8F91\u5386\u53F2",description:"\u4FDD\u5B58\u6BCF\u6761\u6D88\u606F\u88AB\u7F16\u8F91\u524D\u7684\u5185\u5BB9\u3002"},retention:{group:"\u8BB0\u5F55",type:"number",default:50,label:"\u6BCF\u9891\u9053\u4FDD\u7559\u6761\u6570",description:"0 \u8868\u793A\u4E0D\u9650\u5236\u3002\u4E0A\u9650 500\u3002",min:0,max:500,step:10},deleteStyle:{group:"\u5916\u89C2",type:"select",default:"tint",label:"\u5220\u9664 / \u7F16\u8F91\u6837\u5F0F",description:"\u88AB\u5220\u6D88\u606F\u3001\u4EE5\u53CA\u7F16\u8F91\u6D88\u606F\u4E0A\u65B9\u65E7\u7248\u672C\u5185\u5BB9\u5728\u804A\u5929\u4E2D\u7684\u5448\u73B0\u65B9\u5F0F\u3002",options:[{value:"tint",label:"\u7EA2\u8272\u5E95\u7EB9 + \u5DE6\u4FA7\u7EA2\u6761"},{value:"text",label:"\u6B63\u6587\u53D8\u7EA2"},{value:"ghost",label:"\u534A\u900F\u660E\u6DE1\u51FA"},{value:"strike",label:"\u7EA2\u8272\u5220\u9664\u7EBF"}]},showDeletedMarker:{group:"\u5916\u89C2",type:"boolean",default:!0,label:"\u663E\u793A\u5220\u9664\u6807\u8BB0\u884C",description:"\u5728\u88AB\u5220\u6D88\u606F\u4E0B\u65B9\u663E\u793A\u201C\u6B64\u6D88\u606F\u5DF2\u5220\u9664\u201D\u4E0E\u5220\u9664\u65F6\u95F4\u3002"},showEditedMarker:{group:"\u5916\u89C2",type:"boolean",default:!0,label:"\u663E\u793A\u7F16\u8F91\u6807\u8BB0\u884C",description:"\u5728\u7F16\u8F91\u8FC7\u7684\u6D88\u606F\u65C1\u663E\u793A\u201C\u6B64\u6D88\u606F\u5DF2\u7F16\u8F91\u201D\u4E0E\u7F16\u8F91\u65F6\u95F4\uFF08\u6CBF\u7528\u4E0B\u65B9\u6807\u8BB0\u7684\u56FE\u6807 / \u5916\u89C2 / \u65F6\u95F4\u8BBE\u7F6E\uFF09\u3002"},markerIcon:{group:"\u5916\u89C2",type:"select",default:"trash",label:"\u6807\u8BB0\u56FE\u6807",description:"\u6807\u8BB0\u884C\u524D\u7684\u56FE\u6807\uFF08\u5220\u9664 / \u7F16\u8F91\u901A\u7528\uFF09\u3002",options:[{value:"trash",label:"\u{1F5D1} \u5783\u573E\u6876"},{value:"shield",label:"\u{1F6E1} \u76FE\u724C"},{value:"warning",label:"\u26A0 \u8B66\u544A\u4E09\u89D2"},{value:"none",label:"\u65E0\u56FE\u6807"}]},markerLook:{group:"\u5916\u89C2",type:"select",default:"plain",label:"\u6807\u8BB0\u5916\u89C2",description:"\u6807\u8BB0\u884C\u7684\u5448\u73B0\u65B9\u5F0F\uFF08\u5220\u9664 / \u7F16\u8F91\u901A\u7528\uFF09\u3002",options:[{value:"plain",label:"\u7EAF\u6587\u5B57"},{value:"badge",label:"\u5706\u89D2\u5FBD\u7AE0"},{value:"quote",label:"\u5F15\u7528\u5757\uFF08\u5DE6\u4FA7\u7AD6\u6761\uFF09"}]},markerTime:{group:"\u5916\u89C2",type:"select",default:"time",label:"\u6807\u8BB0\u65F6\u95F4\u683C\u5F0F",description:"\u6807\u8BB0\u884C\u91CC\u65F6\u95F4\u7684\u663E\u793A\u65B9\u5F0F\u3002",options:[{value:"time",label:"\u4EC5\u65F6\u95F4\uFF0803:19:42\uFF09"},{value:"datetime",label:"\u65E5\u671F + \u65F6\u95F4"},{value:"none",label:"\u4E0D\u663E\u793A\u65F6\u95F4"}]},ignoreBots:{group:"\u5C4F\u853D\u5BF9\u8C61",type:"boolean",default:!1,label:"\u5C4F\u853D\u673A\u5668\u4EBA",description:"\u673A\u5668\u4EBA\u7684\u6D88\u606F\u4E0D\u8BB0\u5F55\u3001\u4E0D\u5728\u804A\u5929\u4E2D\u4FDD\u7559\u3002"},ignoreSelf:{group:"\u5C4F\u853D\u5BF9\u8C61",type:"boolean",default:!1,label:"\u5C4F\u853D\u81EA\u5DF1",description:"\u4F60\u81EA\u5DF1\u5220\u9664\u6216\u7F16\u8F91\u7684\u6D88\u606F\u4E0D\u8BB0\u5F55\u3001\u4E0D\u5728\u804A\u5929\u4E2D\u4FDD\u7559\u3002"},ignoredUsers:{group:"\u5C4F\u853D\u5BF9\u8C61",type:"string-list",default:[],label:"\u5C4F\u853D\u7684\u7528\u6237",description:"\u8FD9\u4E9B\u7528\u6237\u7684\u6D88\u606F\u4E0D\u8BB0\u5F55\u3001\u4E0D\u5728\u804A\u5929\u4E2D\u4FDD\u7559\u3002",itemPlaceholder:"\u7528\u6237 ID"},ignoredChannels:{group:"\u5C4F\u853D\u5BF9\u8C61",type:"string-list",default:[],label:"\u5C4F\u853D\u7684\u9891\u9053",description:"\u8FD9\u4E9B\u9891\u9053\u91CC\u7684\u6D88\u606F\u4E0D\u8BB0\u5F55\u3001\u4E0D\u5728\u804A\u5929\u4E2D\u4FDD\u7559\u3002",itemPlaceholder:"\u9891\u9053 ID"}});var li=m("message-logger"),vr="message-logger.log",Tt=class{deleted=[];edited=[];retention=50;listeners=new Set;saveTimer;deletedIndex=new Set;load(){let t=oe(vr);this.deleted=Array.isArray(t.deleted)?t.deleted:[],this.edited=Array.isArray(t.edited)?t.edited:[],this.trimDeleted(),this.reindex()}isDeleted(t,n){return this.deletedIndex.has(`${t}:${n}`)}findDeleted(t,n){if(this.isDeleted(t,n))return this.deleted.find(o=>o.channelId===t&&o.id===n)}setRetention(t){this.retention=Math.max(0,t|0),this.trimDeleted(),this.reindex(),this.scheduleSave(),this.emit()}recordDeleted(t){this.deleted.some(n=>n.id===t.id)||(this.deleted.unshift(t),this.trimDeleted(),this.reindex(),this.scheduleSave(),this.emit())}recordEdit(t,n,o,i,a){let c=Date.now(),s=this.edited.find(l=>l.id===t);if(!s)s={id:t,channelId:n,guildId:a,author:o,history:[{content:i,at:c}],updatedAt:c},this.edited.unshift(s);else{if(s.history[s.history.length-1]?.content===i)return;s.history.push({content:i,at:c}),s.updatedAt=c}this.edited.length>300&&(this.edited.length=300),this.scheduleSave(),this.emit()}getDeleted(){return this.deleted}getEdited(){return this.edited}counts(){return{deleted:this.deleted.length,edited:this.edited.length}}clear(){this.deleted=[],this.edited=[],this.reindex(),this.scheduleSave(),this.emit()}toJSON(){return JSON.stringify({deleted:this.deleted,edited:this.edited},null,2)}subscribe(t){return this.listeners.add(t),()=>void this.listeners.delete(t)}flush(){this.saveTimer!==void 0&&(clearTimeout(this.saveTimer),this.saveTimer=void 0),this.save()}trimDeleted(){if(this.retention<=0)return;let t=new Map;this.deleted=this.deleted.filter(n=>{let o=t.get(n.channelId)??0;return o>=this.retention?!1:(t.set(n.channelId,o+1),!0)})}reindex(){this.deletedIndex=new Set(this.deleted.map(t=>`${t.channelId}:${t.id}`))}emit(){for(let t of this.listeners)try{t()}catch{}}scheduleSave(){this.saveTimer!==void 0&&clearTimeout(this.saveTimer),this.saveTimer=setTimeout(()=>this.save(),500)}save(){try{he(vr,{deleted:this.deleted,edited:this.edited})}catch(t){li.error("failed to persist message log",t)}}},I=new Tt;var Mt=/<(a)?:([A-Za-z0-9_]+):(\d+)>/g;function Te(e){let t=[],n=0,o=0;Mt.lastIndex=0;for(let i=Mt.exec(e);i;i=Mt.exec(e)){i.index>n&&t.push(r.createElement("span",{key:o++},e.slice(n,i.index)));let[,a,c,s]=i;t.push(r.createElement("img",{key:o++,className:"hc-emoji",src:`https://cdn.discordapp.com/emojis/${s}.${a?"gif":"webp"}`,alt:`:${c}:`,title:`:${c}:`,draggable:!1,loading:"lazy"})),n=i.index+i[0].length}return t.length===0?e:(n<e.length&&t.push(r.createElement("span",{key:o++},e.slice(n))),t)}var di=m("message-logger");function ui(){let[e,t]=f(()=>({deleted:I.getDeleted(),edited:I.getEdited()}));return N(()=>{let n=()=>t({deleted:I.getDeleted(),edited:I.getEdited()});return n(),I.subscribe(n)},[]),e}var At=25;function xr(){let{deleted:e,edited:t}=ui(),[n,o]=f("deleted"),[i,a]=f({deleted:0,edited:0}),c=n==="deleted"?e:t,s=Math.max(1,Math.ceil(c.length/At)),l=Math.min(i[n],s-1),d=c.slice(l*At,(l+1)*At),u=g=>a(E=>({...E,[n]:Math.max(0,Math.min(s-1,g))}));return r.createElement("div",null,r.createElement("div",{className:"hc-tabs"},r.createElement("button",{type:"button",className:"hc-tab","data-active":n==="deleted",onClick:()=>o("deleted")},r.createElement(j,{size:16})," \u5DF2\u5220\u9664",e.length>0&&r.createElement(ae,{tone:"red"},e.length)),r.createElement("button",{type:"button",className:"hc-tab","data-active":n==="edited",onClick:()=>o("edited")},r.createElement(St,{size:16})," \u5DF2\u7F16\u8F91",t.length>0&&r.createElement(ae,{tone:"orange"},t.length)),r.createElement("div",{className:"hc-tabs__spacer"}),r.createElement(w,{size:"sm",variant:"plain",icon:r.createElement(Kn,{size:16}),onClick:mi},"\u5BFC\u51FA"),r.createElement(w,{size:"sm",variant:"destructive",onClick:()=>I.clear(),disabled:c.length===0},"\u6E05\u7A7A")),c.length===0?n==="deleted"?r.createElement(B,{icon:r.createElement(j,{size:48}),title:"\u8FD8\u6CA1\u6709\u8BB0\u5F55",subtitle:"\u88AB\u5220\u9664\u7684\u6D88\u606F\u4F1A\u5728\u8FD9\u91CC\u4FDD\u7559\uFF0C\u542F\u7528\u63D2\u4EF6\u540E\u5373\u65F6\u751F\u6548\u3002"}):r.createElement(B,{icon:r.createElement(St,{size:48}),title:"\u8FD8\u6CA1\u6709\u7F16\u8F91\u8BB0\u5F55",subtitle:"\u6D88\u606F\u88AB\u7F16\u8F91\u524D\u7684\u5185\u5BB9\u4F1A\u4FDD\u7559\u5728\u8FD9\u91CC\u3002"}):r.createElement(r.Fragment,null,r.createElement("div",{className:"hc-msglist"},n==="deleted"?d.map(g=>r.createElement(pi,{key:`${g.channelId}-${g.id}`,entry:g})):d.map(g=>r.createElement(gi,{key:`${g.channelId}-${g.id}`,entry:g}))),s>1&&r.createElement(hi,{page:l,pageCount:s,onChange:u})))}function hi(e){let{page:t,pageCount:n,onChange:o}=e;return r.createElement("div",{className:"hc-pager"},r.createElement(w,{size:"sm",variant:"plain",onClick:()=>o(t-1),disabled:t===0},"\u4E0A\u4E00\u9875"),r.createElement("span",{className:"hc-pager__label"},"\u7B2C ",t+1," / ",n," \u9875"),r.createElement(w,{size:"sm",variant:"plain",onClick:()=>o(t+1),disabled:t>=n-1},"\u4E0B\u4E00\u9875"))}function pi({entry:e}){return r.createElement("div",{className:"hc-msg"},r.createElement("div",{className:"hc-msg__head"},r.createElement("span",{className:"hc-msg__author"},e.author.name),e.author.bot&&r.createElement(ae,{tone:"neutral"},"BOT"),r.createElement(_r,{channelId:e.channelId,guildId:e.guildId}),r.createElement("span",{className:"hc-msg__time"},Sr(e.deletedAt))),r.createElement("div",{className:"hc-msg__body"},e.content?Te(e.content):e.stickers?.length?r.createElement("span",null,"\u{1F3F7}\uFE0F \u8D34\u7EB8\uFF1A",e.stickers.map(t=>t.name).join("\u3001")):e.attachmentsRich?.length||e.embeds?.length?r.createElement("span",null,"\u{1F5BC}\uFE0F \u5A92\u4F53\u6D88\u606F"):r.createElement("span",{className:"hc-msg__empty"},"\uFF08\u65E0\u6587\u672C\u5185\u5BB9\uFF09")),(e.attachmentsRich?.length??0)>0&&r.createElement("div",{className:"hc-msg__media"},e.attachmentsRich.map((t,n)=>(t.content_type??"").startsWith("image/")||(t.content_type??"").startsWith("video/")?r.createElement("img",{key:n,className:"hc-msg__thumb",src:t.proxy_url??t.url,alt:t.filename??"\u9644\u4EF6",loading:"lazy"}):r.createElement("a",{key:n,href:t.url,target:"_blank",rel:"noreferrer"},"\u{1F4CE} ",t.filename??"\u9644\u4EF6"))),!e.attachmentsRich?.length&&e.attachments.length>0&&r.createElement("div",{className:"hc-msg__meta"},"\u9644\u4EF6 ",e.attachments.length," \u4E2A"))}function gi({entry:e}){return r.createElement("div",{className:"hc-msg"},r.createElement("div",{className:"hc-msg__head"},r.createElement("span",{className:"hc-msg__author"},e.author.name),r.createElement(_r,{channelId:e.channelId,guildId:e.guildId}),r.createElement("span",{className:"hc-msg__time"},Sr(e.updatedAt))),r.createElement("div",{className:"hc-msg__versions"},e.history.map((t,n)=>r.createElement("div",{className:"hc-msg__version",key:n},r.createElement("span",{className:"hc-msg__vtag"},"v",n+1),r.createElement("span",{className:"hc-msg__vbody"},t.content?Te(t.content):"\uFF08\u7A7A\uFF09")))))}function fi(e,t){let n,o=t,i=!1;try{let s=Pe.getChannel?.(e);s&&(s.name&&(n=String(s.name)),o=o??s.guild_id??s.guildId??void 0,i=s.type===1||s.type===3)}catch{}let a;try{if(o){let s=et.getGuild?.(o);s?.name&&(a=String(s.name))}}catch{}let c=n?`#${n}`:i?"\u79C1\u4FE1":`#${e}`;return{guild:a,channel:c}}function _r({channelId:e,guildId:t}){let n=fi(e,t);return r.createElement("span",{className:"hc-msg__where"},n.guild&&r.createElement("span",{className:"hc-msg__guild"},n.guild),n.guild&&r.createElement("span",{className:"hc-msg__sep"},"\u203A"),r.createElement("span",null,n.channel))}function Sr(e){let t=new Date(e),n=o=>String(o).padStart(2,"0");return`${n(t.getMonth()+1)}-${n(t.getDate())} ${n(t.getHours())}:${n(t.getMinutes())}`}function mi(){try{let e=new Blob([I.toJSON()],{type:"application/json"}),t=URL.createObjectURL(e),n=document.createElement("a");n.href=t,n.download=`halcyon-message-log-${Date.now()}.json`,document.body.appendChild(n),n.click(),n.remove(),URL.revokeObjectURL(t)}catch(e){di.error("export failed",e)}}var T=m("message-logger"),Lt,Dt,$t;function jt(e){if(typeof e=="number")return e;if(typeof e=="string"){let t=Date.parse(e);return Number.isNaN(t)?Date.now():t}if(e&&typeof e.valueOf=="function"){let t=e.valueOf();if(typeof t=="number")return t}return Date.now()}function yi(e){return e?.globalName||e?.global_name||e?.username||e?.name||"\u672A\u77E5\u7528\u6237"}function Cr(e){return{id:String(e?.id??"0"),name:yi(e),bot:!!e?.bot}}function Pr(e){let t=e?.attachments;return Array.isArray(t)?t.map(n=>n?.filename||n?.url||"\u9644\u4EF6").slice(0,20):[]}function Tr(e){let t=e?.attachments;return Array.isArray(t)?t.map(n=>({id:n?.id!=null?String(n.id):void 0,filename:n?.filename??n?.fileName??void 0,url:n?.url??void 0,proxy_url:n?.proxy_url??n?.proxyURL??n?.proxyUrl??void 0,content_type:n?.content_type??n?.contentType??void 0,width:typeof n?.width=="number"?n.width:void 0,height:typeof n?.height=="number"?n.height:void 0,size:typeof n?.size=="number"?n.size:void 0})).filter(n=>n.url||n.proxy_url).slice(0,10):[]}function Mr(e){let t=e?.embeds;if(!Array.isArray(t)||t.length===0)return[];try{return JSON.parse(JSON.stringify(t)).slice(0,6)}catch{return[]}}function Ar(e){let t=e?.sticker_items??e?.stickerItems??e?.stickers;return Array.isArray(t)?t.filter(n=>n?.id!=null).map(n=>({id:String(n.id),name:String(n.name??"\u8D34\u7EB8"),format_type:typeof n.format_type=="number"?n.format_type:n.formatType})).slice(0,4):[]}function bi(){try{return Ce.getCurrentUser?.()?.id}catch{return}}function nt(e,t){let n=P.store;return!!(e&&n.ignoredChannels.includes(e)||t?.id&&n.ignoredUsers.includes(t.id)||n.ignoreBots&&t?.bot||n.ignoreSelf&&t?.id&&t.id===bi())}var R=new Map,vi=4e3;function Ot(e,t,n){let o=n?.content;if(!e||!t||typeof o!="string")return;let i=`${e}:${t}`,a=R.get(i);a&&R.delete(i);let c=Ar(n),s=Tr(n),l=Mr(n);if(R.set(i,{content:o,author:n?.author??a?.author,attachments:Array.isArray(n?.attachments)?Pr(n):a?.attachments,attachmentsRich:s.length?s:a?.attachmentsRich,embeds:l.length?l:a?.embeds,stickers:c.length?c:a?.stickers,sentAt:n?.timestamp!=null?jt(n.timestamp):a?.sentAt,guildId:n?.guild_id??n?.guildId??a?.guildId}),R.size>vi){let d=R.keys().next().value;d!==void 0&&R.delete(d)}}function Ut(e,t){try{return mr.getMessage(e,t)}catch{return}}function kr(e,t){if(!e||!t)return;let n=Ut(e,t),o=R.get(`${e}:${t}`);if(!n&&!o){T.debug(`delete of ${t} skipped: message not in cache or shadow`);return}let i=n?.author??o?.author??{};if(nt(e,i))return;let a=typeof n?.content=="string"&&n.content!==""?n.content:o?.content??"",c=n?Pr(n):o?.attachments??[],s=n?Tr(n):[],l=s.length?s:o?.attachmentsRich??[],d=n?Mr(n):[],u=d.length?d:o?.embeds??[],g=n?Ar(n):[],E=g.length?g:o?.stickers??[];if(!(!a&&c.length===0&&l.length===0&&u.length===0&&E.length===0)&&(I.recordDeleted({id:String(t),channelId:String(e),guildId:n?.guild_id??n?.guildId??o?.guildId??void 0,author:Cr(i),content:a,attachments:c,attachmentsRich:l.length?l:void 0,embeds:u.length?u:void 0,stickers:E.length?E:void 0,sentAt:n?.timestamp!=null?jt(n.timestamp):o?.sentAt??Date.now(),deletedAt:Date.now()}),n&&P.store.keepDeletedInChat))try{n.deleted=!0}catch{}}function xi(e){if(!P.store.logEdits||!e)return;let t=e.channel_id??e.channelId,n=e.id;if(!t||!n||typeof e.content!="string")return;let o=`${t}:${n}`,i=Ut(t,n),a=R.get(o),c=a?.content??(typeof i?.content=="string"?i.content:void 0);if(Ot(t,n,e),c===void 0){T.debug(`edit to ${n} skipped: no prior content known (message predates the recorder)`);return}if(c===e.content)return;let s=i?.author??a?.author??e.author??{};if(nt(t,s))return;let l=e.guild_id??e.guildId??i?.guild_id??a?.guildId;I.recordEdit(String(n),String(t),Cr(s),c,l!=null?String(l):void 0)}function _i(e){let t=(e.attachmentsRich??[]).map((n,o)=>({id:n.id??`${e.id}${o}`,filename:n.filename??"attachment",url:n.url??n.proxy_url,proxy_url:n.proxy_url??n.url,content_type:n.content_type,width:n.width,height:n.height,size:n.size??0,spoiler:!1}));return{id:e.id,type:0,channel_id:e.channelId,guild_id:e.guildId,sticker_items:e.stickers?.length?e.stickers:void 0,content:e.content||(t.length===0&&e.attachments.length?`\u{1F4CE} ${e.attachments.join(", ")}`:""),author:{id:e.author.id,username:e.author.name,global_name:e.author.name,discriminator:"0000",bot:e.author.bot,avatar:null},timestamp:new Date(e.sentAt).toISOString(),attachments:t,embeds:e.embeds??[],mentions:[],mention_roles:[],mention_everyone:!1,pinned:!1,tts:!1,flags:0}}function tt(e,t){try{let n=BigInt(e),o=BigInt(t);return n<o?-1:n>o?1:0}catch{return e<t?-1:e>t?1:0}}var wr=new WeakSet;function Si(e){if(!P.store.keepDeletedInChat||wr.has(e))return;wr.add(e);let t=String(e.channelId??e.channel_id??""),n=e.messages;if(!t||!Array.isArray(n))return;let o=I.getDeleted().filter(l=>l.channelId===t);if(!o.length)return;let i=new Set(n.map(l=>String(l?.id))),a;for(let l of n){let d=l?.id!=null?String(l.id):void 0;d&&(a===void 0||tt(d,a)<0)&&(a=d)}let c=o.filter(l=>!i.has(l.id)&&(a===void 0||tt(l.id,a)>=0)&&!nt(t,l.author));if(!c.length)return;let s=n.length>=2?tt(String(n[0].id),String(n[n.length-1].id))>0:!0;n.push(...c.map(_i)),n.sort((l,d)=>{let u=tt(String(l?.id??"0"),String(d?.id??"0"));return s?-u:u}),T.info(`revived ${c.length} deleted message(s) into ${t}`)}function ki(e){if(!P.store.keepDeletedInChat)return;let t=String(e.channelId??e.channel_id??"");if(t)for(let n of I.getDeleted()){if(n.channelId!==t)continue;let o=Ut(t,n.id);if(o&&!o.deleted)try{o.deleted=!0}catch{}}}function wi(e,t){try{if(t==="MESSAGE_CREATE"){let n=e.message;Ot(n?.channel_id??n?.channelId??e.channelId,n?.id,n)}else if(t==="LOAD_MESSAGES_SUCCESS"){let n=e.channelId??e.channel_id;if(Array.isArray(e.messages))for(let o of e.messages)Ot(o?.channel_id??n,o?.id,o)}}catch{}}var Er=!1,zt=0;function Bt(e){let t=e?.type;if(typeof t=="string"){if(Gt.includes(t)&&zt++,wi(e,t),t==="LOAD_MESSAGES_SUCCESS")try{Si(e),setTimeout(()=>ki(e),0)}catch(n){T.error("failed to revive deleted messages on channel load",n)}try{if(t==="MESSAGE_DELETE")kr(e.channelId??e.channel_id,e.id??e.messageId);else if(t==="MESSAGE_DELETE_BULK"){let n=e.channelId??e.channel_id;for(let o of e.ids??[])kr(n,o)}else if(t==="MESSAGE_UPDATE")xi(e.message);else return;Er||(Er=!0,T.info(`recorder saw its first ${t}`))}catch(n){T.error("recorder failed for",t,n)}}}function Ei(e){Bt(e.args[0])}var Gt=["MESSAGE_CREATE","MESSAGE_UPDATE","MESSAGE_DELETE","MESSAGE_DELETE_BULK","LOAD_MESSAGES_SUCCESS"];function Ii(e,t){let n=[],o=[];if(typeof e.addInterceptor=="function")try{let i=a=>(Bt(a),!1);e.addInterceptor(i),n.push(()=>{let a=e._interceptors;if(Array.isArray(a)){let c=a.indexOf(i);c>=0&&a.splice(c,1)}}),o.push("interceptor")}catch{}for(let i of["dispatch","_dispatch"])if(typeof e[i]=="function"){try{n.push(ce.before(e,i,Ei)),o.push(i)}catch{}break}if(typeof e.subscribe=="function")try{let i=a=>Bt(a);for(let a of Gt)e.subscribe(a,i);n.push(()=>{if(typeof e.unsubscribe=="function")for(let a of Gt)try{e.unsubscribe(a,i)}catch{}}),o.push("subscribe")}catch{}return T.info(`recorder on dispatcher ${t}: seams [${o.join(", ")||"none"}]`),()=>n.forEach(i=>i())}function Ni(){let e=new Set,t=[],n=()=>{let c=[..._n(ne),fr()].filter(Boolean),s=0;for(let l of c)e.has(l)||(e.add(l),t.push(Ii(l,`#${e.size}`)),s++);return s},o=n();T.info(`recorder attached to ${o} dispatcher instance(s)`);let i=setInterval(()=>{let c=n();c>0&&T.info(`recorder attached to ${c} late dispatcher instance(s)`)},5e3),a=setTimeout(()=>clearInterval(i),6e4);return()=>{clearInterval(i),clearTimeout(a),t.forEach(c=>c())}}var Ci={trash:()=>r.createElement(r.Fragment,null,r.createElement("path",{d:"M4.5 7h15"}),r.createElement("path",{d:"M9.25 7V5.5A1.5 1.5 0 0110.75 4h2.5a1.5 1.5 0 011.5 1.5V7"}),r.createElement("path",{d:"M6.5 7l.85 11.1A2 2 0 009.34 20h5.32a2 2 0 001.99-1.9L17.5 7"})),shield:()=>r.createElement(r.Fragment,null,r.createElement("path",{d:"M12 3.5l7 2.6v5c0 4.4-3 7.3-7 8.9-4-1.6-7-4.5-7-8.9v-5l7-2.6z"}),r.createElement("path",{d:"M9.5 12l1.8 1.8 3.2-3.6"})),warning:()=>r.createElement(r.Fragment,null,r.createElement("path",{d:"M12 4.5L3.5 19h17L12 4.5z"}),r.createElement("path",{d:"M12 10v4"}),r.createElement("path",{d:"M12 16.75h.01"}))};function Lr(e,t){if(e==null||t==="none")return;let n=new Date(e);if(t==="datetime"){let o=i=>String(i).padStart(2,"0");return`${o(n.getMonth()+1)}-${o(n.getDate())} ${n.toLocaleTimeString("zh-CN",{hour12:!1})}`}return n.toLocaleTimeString("zh-CN",{hour12:!1})}function Ir(e){let t=P.store,n=Ci[t.markerIcon]?.(),o=Lr(e.at,t.markerTime),i=`hc-deleted-marker hc-deleted-marker--${t.markerLook||"plain"}`+(e.edited?" hc-deleted-marker--edited":"");return r.createElement("div",{className:i},n&&r.createElement("svg",{className:"hc-deleted-marker__icon",width:"14",height:"14",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:2,strokeLinecap:"round",strokeLinejoin:"round","aria-hidden":!0},n),r.createElement("span",null,e.text,o?`\uFF08${o}\uFF09`:""))}var Pi=["logEdits","deleteStyle","showDeletedMarker","showEditedMarker","markerIcon","markerLook","markerTime"];function Ti(){let[,e]=f(0);N(()=>{let t=Pi.map(n=>P.subscribe(n,()=>e(o=>o+1)));return()=>t.forEach(n=>n())},[])}function Mi(e){Ti();let t=P.store,n=[];return t.logEdits&&e.history&&e.history.length>0&&n.push(r.createElement("div",{className:"hc-edit-history",key:"hc-edit-history"},e.history.map((o,i)=>{let a=Lr(o.at,"time");return r.createElement("div",{className:`hc-edit-history__version hc-edit-history__version--${t.deleteStyle||"tint"}`,key:i},Te(o.content),a?r.createElement("span",{className:"hc-edit-history__time"},a):null)}))),t.showEditedMarker&&e.isEdited&&!e.isDeleted&&n.push(r.createElement(Ir,{key:"hc-edited-marker",text:"\u6B64\u6D88\u606F\u5DF2\u7F16\u8F91",at:e.editedAt,edited:!0})),t.showDeletedMarker&&e.isDeleted&&n.push(r.createElement(Ir,{key:"hc-deleted-marker",text:"\u6B64\u6D88\u606F\u5DF2\u5220\u9664",at:e.deletedAt})),n.length?r.createElement(r.Fragment,null,n):null}var Dr=["tint","text","ghost","strike"];function Nr(){try{let e=document.documentElement;if(!e)return;for(let t of Dr)e.classList.remove(`hc-mlog-${t}`);e.classList.add(`hc-mlog-${P.store.deleteStyle||"tint"}`)}catch{}}function Ai(){let e=_e().filter(n=>n.pluginId==="message-logger");if(!e.length)return;let t=e.filter(n=>!n.applied);t.length===0?T.info("in-chat patches applied"):T.warn("some in-chat patches did not match this Discord build; deleted messages are still captured on the plugin page, but will not be kept inline. Unmatched: "+t.map(n=>`"${n.label}"`).join(", "))}var $r=M({id:"message-logger",name:"\u6D88\u606F\u8BB0\u5F55\u5668",description:"\u4FDD\u7559\u88AB\u5220\u9664\u7684\u6D88\u606F\u4E0E\u7F16\u8F91\u5386\u53F2\uFF0C\u53EF\u6309\u7528\u6237\u6216\u9891\u9053\u5FFD\u7565\uFF0C\u652F\u6301\u5BFC\u51FA\u3002",authors:[{name:"caitemm"}],category:"utility",settings:P,page:{title:"\u6D88\u606F\u8BB0\u5F55",icon:On,component:xr},patches:[{label:"keep deleted message in store",find:'"MessageStore"',replacement:[{match:/(?<=MESSAGE_DELETE:function\(([\w$]+)\)\{)(?=let.{0,100}?([\w$]+(?:\.[\w$]+)+)\.getOrCreate)/,replace:"let hcC=$2.getOrCreate($1.channelId);hcC=$self.handleDelete(hcC,$1,!1);$2.commit(hcC);return;"},{match:/(?<=MESSAGE_DELETE_BULK:function\(([\w$]+)\)\{)(?=let.{0,100}?([\w$]+(?:\.[\w$]+)+)\.getOrCreate)/,replace:"let hcC=$2.getOrCreate($1.channelId);hcC=$self.handleDelete(hcC,$1,!0);$2.commit(hcC);return;"}]},{label:"tint deleted message row (base)",find:"Message must not be a thread starter message",replacement:{match:/\)\("li",\{(.+?),className:/,replace:')("li",{$1,className:($self.deletedClass(arguments[0])||"")+" "+'}},{label:"tint deleted message row",find:"childrenRepliedMessage",replacement:{match:/(className:)(\w+\(\)\((?:[^()"']|"[^"]*"|'[^']*'|\([^()]*\))*\))/,replace:'$1[$2,$self.deletedClass(arguments[0])].filter(Boolean).join(" ")'}},{label:"inline edit history",find:".SEND_FAILED,",replacement:{match:/\]:[\w$]+\.isUnsupported.{0,30}?,children:\[/,replace:"$&$self.renderEdits(arguments[0]),"}}],start(){I.load(),I.setRetention(P.store.retention),Dt=P.subscribe("retention",e=>I.setRetention(e)),Nr(),$t=P.subscribe("deleteStyle",Nr),Lt=Ni(),setTimeout(Ai,4e3),setTimeout(()=>{zt>0?T.info(`recorder pulse OK \u2014 ${zt} message action(s) observed so far`):T.error("recorder pulse FAILED \u2014 no message actions observed in 30s. The dispatcher hooks are not receiving events on this build. \u8BF7\u628A\u65E5\u5FD7\u9875\u91CC recorder on dispatcher \u5F00\u5934\u7684\u51E0\u884C\u53D1\u7ED9\u5F00\u53D1\u8005\u3002")},3e4)},stop(){Lt?.(),Lt=void 0,Dt?.(),Dt=void 0,$t?.(),$t=void 0;try{for(let e of Dr)document.documentElement?.classList.remove(`hc-mlog-${e}`)}catch{}I.flush(),T.info("stopped")},handleDelete(e,t,n){try{if(e==null||!n&&typeof e.has=="function"&&!e.has(t.id))return e;let o=P.store.keepDeletedInChat,i=64,a=c=>{let s=typeof e.get=="function"?e.get(c):void 0;if(!s)return;o&&!t.mlDeleted&&(s.flags&i)!==i&&!nt(String(t.channelId??t.channel_id??s.channel_id??""),s.author??{})?e=e.update(c,d=>d.set("deleted",!0)):e=e.remove(c)};if(n)for(let c of t.ids??[])a(c);else a(t.id)}catch(o){T.error("handleDelete failed; messages removed normally",o)}return e},deletedClass(e){try{let t=e?.message??e;if(!t)return"";let n=t.channel_id??t.channelId;return t.deleted===!0||n&&t.id&&I.isDeleted(String(n),String(t.id))?"hc-deleted":""}catch{return""}},renderEdits(e){try{let t=e?.message,n=t?.id,o=t?.channel_id??t?.channelId;if(!n||!o)return null;let i=I.getEdited().find(g=>g.id===String(n)&&g.channelId===String(o)),a=I.findDeleted(String(o),String(n)),c=!!(i&&i.history.length>0),s=!!a||t?.deleted===!0,l=t?.edited_timestamp??t?.editedTimestamp,d=l!=null||c,u=l!=null?jt(l):i?.updatedAt;return!c&&!s&&!d?null:r.createElement(Mi,{history:i?.history,deletedAt:a?.deletedAt,editedAt:u,isDeleted:s,isEdited:d})}catch{return null}}});var Or=m("show-username"),zr=D({mode:{type:"select",default:"nick-user",label:"\u663E\u793A\u65B9\u5F0F",description:"\u6635\u79F0\u4E0E\u7528\u6237\u540D\u7684\u6392\u5217\u3002",options:[{value:"nick-user",label:"\u6635\u79F0\u5728\u524D\uFF0C\u7528\u6237\u540D\u5728\u540E"},{value:"user-nick",label:"\u7528\u6237\u540D\u5728\u524D\uFF0C\u6635\u79F0\u5728\u540E"},{value:"user-only",label:"\u53EA\u663E\u793A\u7528\u6237\u540D"}]},style:{type:"select",default:"muted",label:"\u7528\u6237\u540D\u6837\u5F0F",description:"\u9644\u52A0\u7684\u7528\u6237\u540D\u90E8\u5206\u7684\u89C6\u89C9\u6837\u5F0F\u3002",options:[{value:"muted",label:"\u7070\u8272\u5C0F\u5B57"},{value:"pill",label:"\u5706\u89D2\u80F6\u56CA"},{value:"at",label:"@ \u524D\u7F00"},{value:"paren",label:"\u62EC\u53F7\u5305\u88F9"}]},hideWhenSame:{type:"boolean",default:!0,label:"\u6635\u79F0\u76F8\u540C\u65F6\u9690\u85CF",description:"\u6635\u79F0\u4E0E\u7528\u6237\u540D\u4E00\u81F4\u65F6\u4E0D\u91CD\u590D\u663E\u793A\u3002"},inReplies:{type:"boolean",default:!1,label:"\u56DE\u590D\u9884\u89C8\u4E2D\u4E5F\u663E\u793A",description:"\u5728\u56DE\u590D\u5F15\u7528\u7684\u5C0F\u5B57\u6761\u4E2D\u4E5F\u9644\u52A0\u7528\u6237\u540D\u3002"}});function Li(e){let{original:t}=e,n=zr.store,o=t.userOverride??t.message?.author,i=o?.username,a=t.author?.nick??o?.globalName??i??"",c=t.withMentionPrefix?"@":"";try{if(!i)return r.createElement(r.Fragment,null,c,a);if(t.isRepliedMessage&&!n.inReplies)return r.createElement(r.Fragment,null,c,a);if(n.hideWhenSame&&i.toLowerCase()===a.toLowerCase())return r.createElement(r.Fragment,null,c,a);let s=`hc-username hc-username--${n.style||"muted"}`,l=n.style==="at"?`@${i}`:n.style==="paren"?`\uFF08${i}\uFF09`:i;return n.mode==="user-only"?r.createElement(r.Fragment,null,c,i):n.mode==="user-nick"?r.createElement(r.Fragment,null,c,i," ",r.createElement("span",{className:s},a)):r.createElement(r.Fragment,null,c,a," ",r.createElement("span",{className:s},l))}catch(s){return Or.error("username render failed; falling back to the nick",s),r.createElement(r.Fragment,null,c,a)}}var Br=M({id:"show-username",name:"\u663E\u793A\u7528\u6237\u540D",description:"\u5728\u6635\u79F0\u65C1\u8FB9\u663E\u793A\u8D26\u53F7\u7528\u6237\u540D\uFF0C\u9632\u6B62\u6539\u540D\u5192\u5145\uFF0C\u652F\u6301\u591A\u79CD\u6837\u5F0F\u3002",authors:[{name:"caitemm"}],category:"appearance",settings:zr,patches:[{label:"message header username",find:'="SYSTEM_TAG"',replacement:{match:/(?<=onContextMenu:[\w$]+,children:)([\w$]+)\?(?=.{0,100}?user[Nn]ame:)/,replace:"$self.renderUsername(arguments[0]),_hcOld:$1?"}}],start(){Or.info("appending usernames to message headers")},stop(){},renderUsername(e){try{return r.createElement(Li,{original:e})}catch{return e?.author?.nick??null}}});var K=D({acknowledgedRisk:{type:"boolean",default:!1,label:"\u6211\u5DF2\u4E86\u89E3\u5C01\u53F7\u98CE\u9669",description:"\u4E3B\u52A8\u8BA2\u9605\u9891\u9053\u5C5E\u4E8E\u81EA\u52A8\u5316\u884C\u4E3A\uFF0C\u53EF\u80FD\u8FDD\u53CD Discord \u670D\u52A1\u6761\u6B3E\u5E76\u5BFC\u81F4\u8D26\u53F7\u88AB\u5C01\u3002\u4EC5\u5728\u4F60\u5B8C\u5168\u7406\u89E3\u5E76\u81EA\u613F\u627F\u62C5\u98CE\u9669\u65F6\u5F00\u542F\u3002",hidden:!0},selectedGuilds:{type:"string-list",default:[],label:"\u76D1\u63A7\u7684\u670D\u52A1\u5668",description:"\u6309\u670D\u52A1\u5668 ID \u76D1\u63A7\u3002\u5EFA\u8BAE\u4ECE\u4E0B\u65B9\u7684\u670D\u52A1\u5668\u5217\u8868\u52FE\u9009\uFF0C\u800C\u4E0D\u662F\u624B\u586B\u3002",itemPlaceholder:"\u670D\u52A1\u5668 ID",hidden:!0}});var rt=m("guild-monitor"),Di=5*60*1e3,Me,Gr=()=>[];function $i(e){try{let t=yr.getChannels(e);if(!t||typeof t!="object")return[];let n=new Set;for(let o of Object.values(t))if(Array.isArray(o))for(let i of o){let a=i?.channel??i,c=a?.id;c!=null&&(a?.type===0||a?.type===5)&&n.add(String(c))}return[...n]}catch(t){return rt.debug(`could not read channels for guild ${e}`,t),[]}}function Oi(e){let t=Ct;if(t)try{if(typeof t.subscribeToChannel=="function"){for(let n of $i(e))t.subscribeToChannel(e,n);return}typeof t.subscribeToGuild=="function"&&t.subscribeToGuild(e)}catch(n){rt.warn(`subscribe failed for guild ${e}`,n)}}function Ft(){let e=Ct;return!!(e&&(typeof e.subscribeToChannel=="function"||typeof e.subscribeToGuild=="function"))}function Ht(){let e=Gr();if(e.length){for(let t of e)Oi(t);rt.debug(`refreshed subscriptions for ${e.length} guild(s)`)}}function jr(e){if(Gr=e,Kt(),!Ft()){rt.warn("this Discord build exposes no guild-subscription action; monitoring is inactive");return}Ht(),Me=setInterval(Ht,Di)}function Ur(){Me&&Ht()}function Kt(){Me&&(clearInterval(Me),Me=void 0)}function Vt(){try{let t=(Sn("GuildStore")??et)?.getGuilds?.()??{};return Object.values(t).map(n=>({id:String(n?.id??""),name:String(n?.name??n?.id??"\u672A\u77E5\u670D\u52A1\u5668")})).filter(n=>n.id).sort((n,o)=>n.name.localeCompare(o.name,"zh-CN"))}catch{return[]}}function Hr(){let[e,t]=f(()=>Vt()),[n,o]=f(()=>[...K.store.selectedGuilds]),[i,a]=f(()=>K.store.acknowledgedRisk===!0),c=Ft();N(()=>{if(e.length===0){let u=setTimeout(()=>t(Vt()),400);return()=>clearTimeout(u)}},[e.length]);let s=u=>{o(u),K.store.selectedGuilds=u,Ur()},l=u=>{s(n.includes(u)?n.filter(g=>g!==u):[...n,u])};return r.createElement("div",{className:"hc-stack"},r.createElement("div",{className:"hc-inline-note hc-inline-note--danger"},r.createElement(X,{size:18}),r.createElement("span",null,"\u4E3B\u52A8\u76D1\u63A7\u4F1A\u8BA2\u9605\u4F60\u5C1A\u672A\u6253\u5F00\u7684\u9891\u9053\uFF0C\u5C5E\u4E8E\u81EA\u52A8\u5316\u884C\u4E3A\uFF0C\u53EF\u80FD\u8FDD\u53CD Discord \u670D\u52A1\u6761\u6B3E\u5E76\u5BFC\u81F4",r.createElement("b",null,"\u8D26\u53F7\u88AB\u5C01\u7981"),"\u3002\u8BF7\u81EA\u884C\u627F\u62C5\u98CE\u9669\u3002")),r.createElement("div",{className:"hc-section"},r.createElement("div",{className:"hc-section__body"},r.createElement("div",{className:"hc-cell hc-cell--row"},r.createElement("div",{className:"hc-cell__main"},r.createElement("div",{className:"hc-cell__label"},"\u542F\u7528\u4E3B\u52A8\u76D1\u63A7"),r.createElement("div",{className:"hc-cell__desc"},"\u5F00\u542F\u540E\u624D\u80FD\u52FE\u9009\u4E0B\u65B9\u7684\u670D\u52A1\u5668\u3002")),r.createElement($,{checked:i,onChange:u=>{a(u),K.store.acknowledgedRisk=u,u||s([])},"aria-label":"\u542F\u7528\u4E3B\u52A8\u76D1\u63A7"})))),!c&&r.createElement("div",{className:"hc-inline-note"},r.createElement(X,{size:18}),r.createElement("span",null,"\u5F53\u524D Discord \u7248\u672C\u672A\u66B4\u9732\u53EF\u7528\u7684\u8BA2\u9605\u63A5\u53E3\uFF0C\u76D1\u63A7\u6682\u65F6\u65E0\u6CD5\u751F\u6548\u3002")),r.createElement("div",{className:"hc-section"},r.createElement("div",{className:"hc-section__title",style:{display:"flex",justifyContent:"space-between"}},r.createElement("span",null,"\u670D\u52A1\u5668\uFF08",e.length,"\uFF09"),r.createElement("button",{type:"button",className:"hc-tab",onClick:()=>t(Vt()),style:{height:20,padding:"0 8px",textTransform:"none"}},r.createElement(ie,{size:12})," \u5237\u65B0")),e.length===0?r.createElement(B,{icon:r.createElement(Ke,{size:48}),title:"\u6CA1\u6709\u8BFB\u5230\u670D\u52A1\u5668",subtitle:"\u7B49 Discord \u52A0\u8F7D\u5B8C\u6210\u540E\u70B9\u4E0A\u9762\u7684\u5237\u65B0\uFF0C\u6216\u7A0D\u540E\u518D\u6765\u3002"}):r.createElement("div",{className:"hc-section__body",style:{opacity:i?1:.5,pointerEvents:i?"auto":"none"}},e.map(u=>r.createElement("div",{className:"hc-cell hc-cell--row",key:u.id},r.createElement("div",{className:"hc-cell__main"},r.createElement("div",{className:"hc-cell__label"},u.name),r.createElement("div",{className:"hc-cell__desc"},u.id)),r.createElement($,{checked:n.includes(u.id),onChange:()=>l(u.id),"aria-label":`\u76D1\u63A7 ${u.name}`}))))),n.length>0&&r.createElement("div",{className:"hc-savebar"},r.createElement("span",{className:"hc-savebar__label"},"\u6B63\u5728\u76D1\u63A7 ",n.length," \u4E2A\u670D\u52A1\u5668"),r.createElement("div",{className:"hc-savebar__actions"},r.createElement(w,{size:"sm",variant:"destructive",onClick:()=>s([])},"\u5168\u90E8\u53D6\u6D88"))))}var zi=m("guild-monitor");function Fr(){if(K.store.acknowledgedRisk!==!0)return[];let e=K.store.selectedGuilds;return Array.isArray(e)?e:[]}var Kr=M({id:"guild-monitor",name:"\u670D\u52A1\u5668\u76D1\u63A7",description:"\u4E3B\u52A8\u8BA2\u9605\u9009\u5B9A\u670D\u52A1\u5668\u7684\u9891\u9053\uFF0C\u6355\u6349\u672A\u6253\u5F00\u9891\u9053\u91CC\u7684\u6D88\u606F\uFF08\u6709\u5C01\u53F7\u98CE\u9669\uFF0C\u9ED8\u8BA4\u5173\u95ED\uFF09\u3002",authors:[{name:"caitemm"}],category:"privacy",settings:K,page:{title:"\u76D1\u63A7",icon:qn,component:Hr},start(){jr(Fr);let e=Fr().length;e>0&&zi.info(`monitoring ${e} guild(s)`)},stop(){Kt()}});var le=D({order:{group:"\u9ED8\u8BA4\u53C2\u6570",type:"select",default:"desc",label:"\u6E05\u7406\u65B9\u5411",description:"\u53D7\u6761\u6570\u9650\u5236\u65F6\uFF0C\u4F18\u5148\u4ECE\u54EA\u4E00\u7AEF\u5F00\u59CB\u5220\u3002",options:[{value:"desc",label:"\u4ECE\u65B0\u5230\u8001"},{value:"asc",label:"\u4ECE\u8001\u5230\u65B0"}]},limit:{group:"\u9ED8\u8BA4\u53C2\u6570",type:"number",default:100,label:"\u6700\u591A\u5904\u7406\u6761\u6570",description:"\u5355\u6B21\u9884\u89C8 / \u5220\u9664\u7684\u4E0A\u9650\u3002",min:1,max:5e3,step:50},delayMs:{group:"\u9ED8\u8BA4\u53C2\u6570",type:"number",default:1600,label:"\u5220\u9664\u95F4\u9694\uFF08\u6BEB\u79D2\uFF09",description:"\u4E24\u6B21\u5220\u9664\u4E4B\u95F4\u7684\u7B49\u5F85\uFF0C\u592A\u5FEB\u4F1A\u89E6\u53D1\u9650\u901F\uFF0C\u5EFA\u8BAE\u4E0D\u4F4E\u4E8E 1000\u3002",min:300,max:3e4,step:100},confirmBeforeDelete:{group:"\u9ED8\u8BA4\u53C2\u6570",type:"boolean",default:!0,label:"\u5220\u9664\u524D\u4E8C\u6B21\u786E\u8BA4",description:"\u70B9\u300C\u5220\u9664\u300D\u540E\u5F39\u51FA\u786E\u8BA4\u6846\uFF0C\u907F\u514D\u8BEF\u5220\u3002"}});var Bi=m("message-cleaner"),Gi="https://discord.com/api/v10",Wt=new Set,me=e=>new Promise(t=>setTimeout(t,e)),ji=1420070400000n,ot=e=>String(BigInt(e.getTime())-ji<<22n);function qt(){try{let e=window.webpackChunkdiscord_app;if(Array.isArray(e)){let t=null;if(e.push([[Symbol()],{},n=>{for(let o of Object.keys(n.m||{}))try{for(let i of[n(o),n(o)?.default])if(i&&typeof i.getToken=="function"){let a=i.getToken();if(a&&a.length>20){t=a;return}}}catch{}}]),t)return t}}catch{}try{let e=window.localStorage.getItem("token");if(e)return e.replace(/^"|"$/g,"")}catch{}return null}async function G(e,t,n={},o=0){let i;try{i=await fetch(Gi+t,{...n,headers:{Authorization:e,"Content-Type":"application/json",...n.headers||{}}})}catch(a){if(o<5)return await me(3e3),G(e,t,n,o+1);throw new Error(`\u7F51\u7EDC\u8BF7\u6C42\u5931\u8D25: ${a.message}`)}if(i.status===429){let a=await i.json().catch(()=>({})),c=a.retry_after?Math.ceil(Number(a.retry_after)*1e3):Math.pow(2,o)*1e3;if(o<5)return await me(c+500),G(e,t,n,o+1);throw new Error("\u89E6\u53D1\u9650\u901F\u4E14\u91CD\u8BD5\u6B21\u6570\u8017\u5C3D\u3002")}if(!i.ok){let a=await i.text().catch(()=>"");throw new Error(`API ${i.status}: ${a.slice(0,120)}`)}return i.status===204?null:i.json()}async function Yt(e){let t=await G(e,"/users/@me");if(!t?.id)throw new Error("\u65E0\u6CD5\u901A\u8FC7 Token \u83B7\u53D6\u8D26\u53F7\u4FE1\u606F\uFF0C\u8BF7\u68C0\u67E5 Token \u662F\u5426\u6709\u6548\u3002");return String(t.id)}function Vr(){try{let e=location.pathname.match(/\/channels\/(\d{15,25}|@me)\/(\d{15,25})/);return e?{guildId:e[1],channelId:e[2],serverWide:!1}:null}catch{return null}}async function Wr(e){let t=await G(e,"/users/@me/guilds");return Array.isArray(t)?t.map(n=>({id:String(n.id),name:n.name??"\u672A\u77E5",icon:n.icon??null})):[]}async function qr(e,t){if(t==="@me"){let o=await G(e,"/users/@me/channels");return Array.isArray(o)?o.map(i=>{let a=i.name||(Array.isArray(i.recipients)?i.recipients.map(c=>c.global_name||c.username).join("\u3001"):"")||"\u672A\u77E5\u79C1\u804A";return{id:String(i.id),name:a,type:i.type??1}}):[]}let n=await G(e,`/guilds/${t}/channels`);return Array.isArray(n)?n.filter(o=>o.type!==4).map(o=>({id:String(o.id),name:o.name??"\u672A\u77E5",type:o.type??0})):[]}async function Yr(e,t,n,o,i){let a=[];if(t.serverWide&&t.guildId&&t.guildId!=="@me"){let s=0;for(;a.length<t.limit&&!i.stopped;){o("\u5168\u670D\u68C0\u7D22\u4E2D",`\u5DF2\u627E\u5230 ${a.length} \u6761\uFF08\u641C\u7D22\u63A5\u53E3\u8F83\u6162\uFF0C\u8BF7\u7A0D\u5019\uFF09`);let l=new URLSearchParams({author_id:n,offset:String(s),include_nsfw:"true",sort_order:t.order==="asc"?"asc":"desc"});t.after&&l.set("min_id",ot(t.after)),t.before&&l.set("max_id",ot(t.before));let d;try{d=await G(e,`/guilds/${t.guildId}/messages/search?${l}`)}catch(u){throw new Error(`\u5168\u670D\u68C0\u7D22\u5931\u8D25\uFF1A${u.message}`)}if(d?.message==="Indexing"){o("\u5EFA\u7ACB\u7D22\u5F15\u4E2D","Discord \u6B63\u5728\u5EFA\u7ACB\u5168\u670D\u7D22\u5F15\uFF0C10 \u79D2\u540E\u81EA\u52A8\u91CD\u8BD5\u2026"),await me(1e4);continue}if(!d?.messages||d.messages.length===0)break;for(let u of d.messages){let g=u.find(E=>E?.hit)??u.find(E=>E?.author?.id===n)??u[0];if(!(!g||g.author?.id!==n||Wt.has(g.id))&&(a.push({id:g.id,channelId:g.channel_id,content:g.content??"",timestamp:g.timestamp}),a.length>=t.limit))break}if(d.messages.length<25)break;s+=d.messages.length,await me(1200)}return a}if(!t.channelId)throw new Error("\u8BF7\u586B\u5199\u9891\u9053 ID\uFF0C\u6216\u5F00\u542F\u300C\u5168\u670D\u626B\u63CF\u300D\u5E76\u586B\u5199\u670D\u52A1\u5668 ID\u3002");let c=null;for(t.order==="desc"?c=t.before?ot(t.before):null:c=t.after?ot(t.after):"0";a.length<t.limit&&!i.stopped;){let s=new URLSearchParams({limit:"100"});c&&s.set(t.order==="desc"?"before":"after",c);let l;try{l=await G(e,`/channels/${t.channelId}/messages?${s}`)}catch(d){throw new Error(`\u8BFB\u53D6\u9891\u9053\u6D88\u606F\u5931\u8D25\uFF1A${d.message}`)}if(!Array.isArray(l)||l.length===0)break;for(let d of l){let u=new Date(d.timestamp);if(t.order==="desc"&&t.after&&u<t.after||t.order==="asc"&&t.before&&u>t.before)return a;let g=(!t.after||u>=t.after)&&(!t.before||u<=t.before);if(d.author?.id===n&&g&&!Wt.has(d.id)&&(a.push({id:d.id,channelId:d.channel_id??t.channelId,content:d.content??"",timestamp:d.timestamp}),a.length>=t.limit))break}c=l[l.length-1].id,o("\u626B\u63CF\u4E2D",`\u5DF2\u627E\u5230 ${a.length} \u6761`),await me(150)}return a}async function Jr(e,t,n,o,i){let a=0,c=0;for(let s of t){if(i.stopped)break;let l=Date.now();try{await G(e,`/channels/${s.channelId||n.channelId}/messages/${s.id}`,{method:"DELETE"}),a++}catch(u){c++,String(u?.message??"").includes("404")||Wt.add(s.id),Bi.warn(`skip ${s.id}: ${u?.message??u}`)}o("\u5220\u9664\u4E2D",`\u5DF2\u5220\u9664 ${a} / ${t.length}${c?`\uFF08\u8DF3\u8FC7 ${c}\uFF09`:""}`);let d=Date.now()-l;d<n.delayMs&&await me(n.delayMs-d)}return{deleted:a,skipped:c}}async function Xr(e,t,n){let o,i=new URLSearchParams({author_id:n,include_nsfw:"true"});if(t.serverWide&&t.guildId&&t.guildId!=="@me")o=`/guilds/${t.guildId}/messages/search?${i}`;else if(t.channelId)o=`/channels/${t.channelId}/messages/search?${i}`;else if(t.guildId&&t.guildId!=="@me")o=`/guilds/${t.guildId}/messages/search?${i}`;else throw new Error("\u8BF7\u586B\u5199\u670D\u52A1\u5668 ID \u6216\u9891\u9053 ID\u3002");let a=await G(e,o);return a?.message==="Indexing"?{total:0,indexing:!0}:{total:a?.total_results??0,indexing:!1}}var Qr=m("message-cleaner");function Ui(e){let t=new Date(e);if(Number.isNaN(t.getTime()))return"";let n=o=>String(o).padStart(2,"0");return`${n(t.getMonth()+1)}-${n(t.getDate())} ${n(t.getHours())}:${n(t.getMinutes())}`}function Zr(){let[e,t]=f(""),[n,o]=f(""),[i,a]=f(""),[c,s]=f(!1),[l,d]=f(""),[u,g]=f(""),[E,W]=f(le.store.order),[ee,de]=f(!1),[h,y]=f("idle"),[x,A]=f([]),[De,Zt]=f("\u5F85\u673A"),[Rt,en]=f("\u5148\u83B7\u53D6 Token\uFF0C\u9009\u597D\u8303\u56F4\u5E76\u9884\u89C8\uFF0C\u786E\u8BA4\u540E\u518D\u5220\u9664\u3002"),[tn,nn]=f(null),[po,st]=f(!1),[go,fo]=f([]),[rn,on]=f([]),[ct,lt]=f("guilds"),[an,mo]=f(""),[yo,$e]=f(!1),[sn,Oe]=f(""),te=re({stopped:!1}),be=h!=="idle";N(()=>{let p=qt();p&&(t(p),Zt("\u5DF2\u83B7\u53D6 Token"),en("\u53EF\u70B9\u51FB\u300C\u5217\u8868\u300D\u9009\u62E9\u9891\u9053\uFF0C\u6216\u624B\u52A8\u586B\u5199 ID\u3002"))},[]);let v=(p,S)=>{Zt(p),en(S)},ve=()=>{let p=e.trim();if(!p)throw new Error("\u8BF7\u5148\u83B7\u53D6\u6216\u586B\u5165 Token\u3002");return p},cn=()=>({guildId:n.trim(),channelId:c?"":i.trim(),serverWide:c,order:E,limit:le.store.limit,delayMs:le.store.delayMs,after:l?new Date(l):null,before:u?new Date(u):null}),bo=()=>{let p=qt();p?(t(p),v("Token \u5DF2\u83B7\u53D6","\u53EF\u70B9\u51FB\u300C\u5217\u8868\u300D\u9009\u62E9\u9891\u9053\u3002")):v("\u83B7\u53D6\u5931\u8D25","\u8BF7\u624B\u52A8\u7C98\u8D34 Token\u3002")},vo=()=>{let p=Vr();if(!p){v("\u65E0\u6CD5\u8BFB\u53D6","\u5F53\u524D\u4E0D\u5728\u67D0\u4E2A\u9891\u9053/\u79C1\u4FE1\u9875\u9762\u3002");return}o(p.guildId),a(p.channelId),s(!1),v("\u5DF2\u586B\u5165\u5F53\u524D\u9891\u9053",`\u670D\u52A1\u5668 ${p.guildId} \xB7 \u9891\u9053 ${p.channelId}`)},xo=async()=>{let p;try{p=ve()}catch(S){v("\u9700\u8981 Token",S.message);return}st(!0),lt("guilds"),on([]),Oe(""),$e(!0);try{let S=await Wr(p);fo([{id:"@me",name:"\u79C1\u4FE1\u4E0E\u7FA4\u804A (DMs)",icon:null},...S])}catch(S){Oe(S.message??String(S))}finally{$e(!1)}},ln=async p=>{let S;try{S=ve()}catch(b){v("\u9700\u8981 Token",b.message);return}mo(p.name),lt("channels"),Oe(""),$e(!0);try{let b=await qr(S,p.id),k=p.id==="@me"?b:[{id:"",name:"\u2500\u2500 \u5168\u670D\u626B\u63CF\uFF08\u4E0D\u9650\u9891\u9053\uFF09\u2500\u2500",type:-1},...b];on(k)}catch(b){Oe(b.message??String(b))}finally{$e(!1)}},dn=p=>{p.id?(s(!1),a(p.id)):(s(!0),a("")),st(!1),v("\u5DF2\u9009\u62E9",`${an} \u2192 ${p.name||"\u5168\u670D"}`)},_o=()=>{let p=new Date;p.setMinutes(p.getMinutes()-p.getTimezoneOffset()),g(p.toISOString().slice(0,16))},So=async()=>{let p;try{p=ve()}catch(k){v("\u5931\u8D25",k.message);return}let S;try{S=await Yt(p)}catch(k){v("\u5931\u8D25",k.message);return}let b=cn();if(b.serverWide&&(!b.guildId||b.guildId==="@me")){v("\u5931\u8D25","\u5168\u670D\u626B\u63CF\u9700\u8981\u586B\u5199\u670D\u52A1\u5668 ID\u3002");return}if(!b.serverWide&&!b.channelId){v("\u5931\u8D25","\u8BF7\u586B\u5199\u9891\u9053 ID\uFF0C\u6216\u6539\u7528\u5168\u670D\u626B\u63CF\u3002");return}if(b.after&&b.before&&b.after>=b.before){v("\u5931\u8D25","\u8D77\u59CB\u65F6\u95F4\u5FC5\u987B\u65E9\u4E8E\u7ED3\u675F\u65F6\u95F4\u3002");return}te.current={stopped:!1},y("previewing"),A([]),v("\u9884\u89C8\u4E2D","\u6B63\u5728\u626B\u63CF\u4F60\u7684\u6D88\u606F\u2026");try{let k=await Yr(p,b,S,v,te.current);A(k),v(te.current.stopped?"\u5DF2\u505C\u6B62":"\u9884\u89C8\u5B8C\u6210",`\u627E\u5230 ${k.length} \u6761\u4F60\u7684\u6D88\u606F\u3002`)}catch(k){v("\u5931\u8D25",k.message??String(k)),Qr.error("preview failed",k)}finally{y("idle")}},ko=async()=>{if(x.length===0){v("\u8BF7\u5148\u9884\u89C8","");return}if(le.store.confirmBeforeDelete&&!window.confirm(`\u5C06\u5220\u9664 ${x.length} \u6761\u6D88\u606F\uFF0C\u5220\u9664\u4E0D\u53EF\u6062\u590D\uFF0C\u786E\u8BA4\u7EE7\u7EED\uFF1F`))return;let p;try{p=ve()}catch(b){v("\u5931\u8D25",b.message);return}let S=cn();te.current={stopped:!1},y("deleting"),v("\u5220\u9664\u4E2D",`0 / ${x.length}`);try{let b=await Jr(p,x,S,v,te.current);v(te.current.stopped?"\u5DF2\u505C\u6B62":"\u5B8C\u6210",`\u5DF2\u5220\u9664 ${b.deleted} \u6761${b.skipped?`\uFF0C\u8DF3\u8FC7 ${b.skipped} \u6761`:""}\u3002`),A([])}catch(b){v("\u5931\u8D25",b.message??String(b)),Qr.error("delete failed",b)}finally{y("idle")}},un=()=>{te.current.stopped=!0,v("\u505C\u6B62\u4E2D","\u7B49\u5F85\u5F53\u524D\u8BF7\u6C42\u7ED3\u675F\u2026")},wo=async()=>{let p;try{p=ve()}catch(k){v("\u5931\u8D25",k.message);return}let S;try{S=await Yt(p)}catch(k){v("\u5931\u8D25",k.message);return}let b={guildId:n.trim(),channelId:c?"":i.trim(),serverWide:c};nn(null),v("\u7EDF\u8BA1\u4E2D","\u8C03\u7528\u641C\u7D22\u63A5\u53E3\u2026");try{let k=await Xr(p,b,S);if(k.indexing){v("\u5EFA\u7ACB\u7D22\u5F15\u4E2D","Discord \u6B63\u5728\u5EFA\u7ACB\u7D22\u5F15\uFF0C\u7A0D\u540E\u518D\u8BD5\u3002");return}nn(k.total),v("\u7EDF\u8BA1\u5B8C\u6210",`\u5171 ${k.total} \u6761\u53D1\u8A00\u3002`)}catch(k){v("\u5931\u8D25",k.message??String(k))}};return po?r.createElement("div",{className:"hc-cleaner"},r.createElement("div",{className:"hc-cleaner__picker-head"},ct==="channels"&&r.createElement(w,{size:"sm",variant:"plain",onClick:()=>lt("guilds")},"\u2190 \u8FD4\u56DE"),r.createElement("span",{className:"hc-cleaner__picker-title"},ct==="guilds"?"\u9009\u62E9\u670D\u52A1\u5668":an),r.createElement(w,{size:"sm",variant:"plain",onClick:()=>st(!1)},"\u2715")),r.createElement("div",{className:"hc-cleaner__picker-list"},yo?r.createElement("div",{className:"hc-cleaner__picker-empty"},"\u6B63\u5728\u52A0\u8F7D\u2026"):sn?r.createElement("div",{className:"hc-cleaner__picker-empty hc-cleaner__picker-empty--error"},"\u52A0\u8F7D\u5931\u8D25\uFF1A",sn):ct==="guilds"?go.map(p=>r.createElement("div",{key:p.id,className:"hc-cleaner__picker-item",onClick:()=>ln(p),role:"button",tabIndex:0,onKeyDown:S=>{S.key==="Enter"&&ln(p)}},r.createElement("div",{className:"hc-cleaner__picker-icon"},p.icon?r.createElement("img",{src:`https://cdn.discordapp.com/icons/${p.id}/${p.icon}.png?size=64`,alt:""}):p.name.charAt(0)),r.createElement("div",{className:"hc-cleaner__picker-name"},p.name))):rn.length===0?r.createElement("div",{className:"hc-cleaner__picker-empty"},"\u6B64\u670D\u52A1\u5668\u6682\u65E0\u9891\u9053\uFF0C\u53EF\u624B\u52A8\u586B\u5199\u9891\u9053 ID\u3002"):rn.map(p=>r.createElement("div",{key:p.id||"server-wide",className:"hc-cleaner__picker-item",onClick:()=>dn(p),role:"button",tabIndex:0,onKeyDown:S=>{S.key==="Enter"&&dn(p)}},r.createElement("div",{className:"hc-cleaner__picker-icon"},p.id?"#":"\u{1F310}"),r.createElement("div",{className:"hc-cleaner__picker-name"},p.name))))):r.createElement("div",{className:"hc-cleaner"},r.createElement("div",{className:"hc-inline-note hc-inline-note--danger"},r.createElement(X,{size:18}),r.createElement("span",null,"\u5220\u9664\u4E0D\u53EF\u6062\u590D\uFF0C\u4E14\u53EA\u4F1A\u5220\u9664",r.createElement("strong",null,"\u4F60\u81EA\u5DF1"),"\u53D1\u9001\u7684\u6D88\u606F\u3002\u8BF7\u52A1\u5FC5\u5148\u9884\u89C8\u786E\u8BA4\u3002")),r.createElement(O,{title:"Token"},r.createElement("div",{className:"hc-cell"},r.createElement("div",{className:"hc-cell--row"},r.createElement("div",{className:"hc-cell__main"},r.createElement("div",{className:"hc-cell__label"},"Discord Token"),r.createElement("div",{className:"hc-cell__desc"},"\u4EE3\u8868\u4F60\u7684\u8D26\u53F7\u6743\u9650\uFF0C\u4E0D\u8981\u6CC4\u9732\u7ED9\u4EFB\u4F55\u4EBA\u3002")),r.createElement(w,{size:"sm",variant:"secondary",icon:r.createElement(ie,{size:16}),onClick:bo},"\u81EA\u52A8")),r.createElement("div",{className:"hc-cell__control"},r.createElement(U,{value:e,onChange:t,placeholder:"\u81EA\u52A8\u586B\u5165\u6216\u624B\u52A8\u7C98\u8D34",type:"password"})))),r.createElement(O,{title:"\u8303\u56F4"},r.createElement("div",{className:"hc-cell hc-cell--row"},r.createElement("div",{className:"hc-cell__main"},r.createElement("div",{className:"hc-cell__label"},"\u5168\u670D\u626B\u63CF"),r.createElement("div",{className:"hc-cell__desc"},"\u5FFD\u7565\u9891\u9053\uFF0C\u626B\u63CF\u6574\u4E2A\u670D\u52A1\u5668\uFF08\u8D70\u641C\u7D22\u63A5\u53E3\uFF0C\u8F83\u6162\uFF09\u3002")),r.createElement($,{checked:c,onChange:s,"aria-label":"\u5168\u670D\u626B\u63CF"})),r.createElement("div",{className:"hc-cell"},r.createElement("div",{className:"hc-cell--row"},r.createElement("div",{className:"hc-cell__main"},r.createElement("div",{className:"hc-cell__label"},"\u670D\u52A1\u5668 ID"))),r.createElement("div",{className:"hc-cell__control"},r.createElement(U,{value:n,onChange:o,placeholder:"\u670D\u52A1\u5668 ID"}))),!c&&r.createElement("div",{className:"hc-cell"},r.createElement("div",{className:"hc-cell--row"},r.createElement("div",{className:"hc-cell__main"},r.createElement("div",{className:"hc-cell__label"},"\u9891\u9053 ID"))),r.createElement("div",{className:"hc-cell__control"},r.createElement(U,{value:i,onChange:a,placeholder:"\u9891\u9053 ID"}))),r.createElement("div",{className:"hc-cell hc-cell--row",style:{gap:"var(--hc-space-2)"}},r.createElement(w,{size:"sm",variant:"secondary",icon:r.createElement(Ke,{size:16}),onClick:xo,disabled:be},"\u5217\u8868"),r.createElement(w,{size:"sm",variant:"secondary",icon:r.createElement(Q,{size:16}),onClick:vo,disabled:be},"\u5F53\u524D"))),r.createElement(O,{title:"\u65F6\u95F4\u8303\u56F4",note:"\u53EF\u9009\u3002\u7559\u7A7A\u8868\u793A\u4E0D\u9650\u5236\u8BE5\u65B9\u5411\u3002"},r.createElement("div",{className:"hc-cell"},r.createElement("div",{className:"hc-cell--row"},r.createElement("div",{className:"hc-cell__main"},r.createElement("div",{className:"hc-cell__label"},"\u8D77\u59CB\u65F6\u95F4"))),r.createElement("div",{className:"hc-cell__control"},r.createElement("input",{className:"hc-input",type:"datetime-local",value:l,onChange:p=>d(p.currentTarget.value)}))),r.createElement("div",{className:"hc-cell"},r.createElement("div",{className:"hc-cell--row"},r.createElement("div",{className:"hc-cell__main"},r.createElement("div",{className:"hc-cell__label"},"\u7ED3\u675F\u65F6\u95F4")),r.createElement(w,{size:"sm",variant:"plain",onClick:_o},"\u540C\u6B65\u6700\u65B0")),r.createElement("div",{className:"hc-cell__control"},r.createElement("input",{className:"hc-input",type:"datetime-local",value:u,onChange:p=>g(p.currentTarget.value)})))),r.createElement(O,{title:"\u65B9\u5411"},r.createElement("div",{className:"hc-cell hc-cell--row"},r.createElement("div",{className:"hc-cell__main"},r.createElement("div",{className:"hc-cell__label"},"\u6E05\u7406\u65B9\u5411")),r.createElement(Ve,{value:E,onChange:W,options:[{value:"desc",label:"\u4ECE\u65B0\u5230\u8001"},{value:"asc",label:"\u4ECE\u8001\u5230\u65B0"}]}))),r.createElement(O,{title:"\u786E\u8BA4",note:"\u5220\u9664\u662F\u4E0D\u53EF\u9006\u64CD\u4F5C\uFF0C\u8BF7\u5148\u9884\u89C8\u518D\u5220\u9664\u3002"},r.createElement("div",{className:"hc-cell hc-cell--row"},r.createElement("div",{className:"hc-cell__main"},r.createElement("div",{className:"hc-cell__label"},"\u6211\u786E\u8BA4\u53EA\u5220\u9664\u81EA\u5DF1\u7684\u6D88\u606F\uFF0C\u4E14\u660E\u767D\u4E0D\u53EF\u6062\u590D")),r.createElement($,{checked:ee,onChange:de,"aria-label":"\u786E\u8BA4"}))),r.createElement("div",{className:"hc-cleaner__actions"},h==="previewing"?r.createElement(w,{variant:"destructive",onClick:un},"\u505C\u6B62\u9884\u89C8"):r.createElement(w,{variant:"primary",icon:r.createElement(ge,{size:16}),disabled:be,onClick:So},"\u9884\u89C8"),h==="deleting"?r.createElement(w,{variant:"destructive",onClick:un},"\u505C\u6B62\u5220\u9664"):r.createElement(w,{variant:"destructive",icon:r.createElement(j,{size:16}),disabled:be||!ee||x.length===0,onClick:ko},"\u5220\u9664\u9884\u89C8\uFF08",x.length,"\uFF09")),r.createElement("div",{className:"hc-cleaner__status"},r.createElement("div",{className:"hc-cleaner__status-state"},De),Rt&&r.createElement("div",{className:"hc-cleaner__status-detail"},Rt)),x.length>0&&r.createElement(O,{title:`\u9884\u89C8\u7ED3\u679C\uFF08${x.length}\uFF09`},r.createElement("div",{className:"hc-cleaner__list"},x.slice(0,50).map(p=>r.createElement("div",{className:"hc-cleaner__item",key:p.id},r.createElement("span",{className:"hc-cleaner__item-time"},Ui(p.timestamp)),r.createElement("span",{className:"hc-cleaner__item-text"},p.content.trim()||"\uFF08\u65E0\u6587\u672C\u5185\u5BB9\uFF09"))),x.length>50&&r.createElement("div",{className:"hc-cleaner__more"},"\u2026\u8FD8\u6709 ",x.length-50," \u6761\u672A\u5C55\u793A"))),r.createElement(O,{title:"\u7EDF\u8BA1",note:"\u7EDF\u8BA1\u4F60\u5728\u6240\u9009\u8303\u56F4\u5185\u7684\u5386\u53F2\u53D1\u8A00\u603B\u6570\uFF08\u8C03\u7528\u641C\u7D22\u63A5\u53E3\uFF09\u3002"},r.createElement("div",{className:"hc-cell"},r.createElement(w,{size:"sm",variant:"secondary",icon:r.createElement(ge,{size:16}),disabled:be,onClick:wo},"\u7EDF\u8BA1\u6211\u7684\u53D1\u8A00\u6570")),tn!=null&&r.createElement("div",{className:"hc-cell hc-cleaner__stat"},r.createElement("span",{className:"hc-cleaner__stat-num"},tn),r.createElement("span",{className:"hc-cleaner__stat-unit"},"\u6761"))))}var Hi=m("message-cleaner"),Rr=M({id:"message-cleaner",name:"\u6D88\u606F\u6E05\u7406",description:"\u6279\u91CF\u5220\u9664\u4F60\u81EA\u5DF1\u5728\u67D0\u4E2A\u9891\u9053\u6216\u6574\u4E2A\u670D\u52A1\u5668\u7684\u5386\u53F2\u6D88\u606F\uFF08\u81EA\u52A9\u51B2\u6C34\u673A\uFF09\u3002\u5148\u9884\u89C8\u518D\u5220\u9664\uFF0C\u4EC5\u9650\u672C\u4EBA\u6D88\u606F\uFF0C\u5220\u9664\u4E0D\u53EF\u6062\u590D\u3002",authors:[{name:"caitemm"},{name:"catie"}],category:"privacy",settings:le,page:{title:"\u6E05\u7406",icon:j,component:Zr},start(){Hi.info("message-cleaner ready")},stop(){}});var V=m("fake-nitro"),ye=D({enableEmojiBypass:{group:"\u8868\u60C5",type:"boolean",default:!0,label:"\u7ED5\u8FC7\u8868\u60C5\u9650\u5236",description:"\u53D1\u9001\u4F60\u6CA1\u6709 Nitro \u6743\u9650\u7684\u81EA\u5B9A\u4E49\u8868\u60C5\uFF08\u8DE8\u670D / \u52A8\u6001\u8868\u60C5\uFF09\u65F6\uFF0C\u81EA\u52A8\u6539\u4E3A\u53D1\u9001\u8BE5\u8868\u60C5\u7684\u56FE\u7247\u94FE\u63A5\u3002"},emojiSize:{group:"\u8868\u60C5",type:"select",default:"48",label:"\u8868\u60C5\u56FE\u7247\u5C3A\u5BF8",description:"\u5185\u8054\u8868\u60C5\u56FE\u7247\u7684\u8FB9\u957F\uFF08\u50CF\u7D20\uFF09\u3002\u8D8A\u5927\u8D8A\u6E05\u6670\u3001\u5360\u7528\u8D8A\u5927\u3002",options:[{value:"32",label:"32"},{value:"48",label:"48\uFF08\u9ED8\u8BA4\uFF09"},{value:"64",label:"64"},{value:"128",label:"128"},{value:"256",label:"256"},{value:"512",label:"512"}]},enableStickerBypass:{group:"\u8D34\u7EB8",type:"boolean",default:!0,label:"\u7ED5\u8FC7\u8D34\u7EB8\u9650\u5236",description:"\u53D1\u9001\u9501\u5B9A\u7684\u8D34\u7EB8\u65F6\u6539\u4E3A\u53D1\u9001\u8D34\u7EB8\u56FE\u7247\u94FE\u63A5\u3002Lottie\uFF08\u77E2\u91CF\uFF09\u8D34\u7EB8\u65E0\u6CD5\u5185\u8054\uFF0C\u4F1A\u8DF3\u8FC7\u3002"},stickerSize:{group:"\u8D34\u7EB8",type:"select",default:"160",label:"\u8D34\u7EB8\u56FE\u7247\u5C3A\u5BF8",description:"\u5185\u8054\u8D34\u7EB8\u56FE\u7247\u7684\u8FB9\u957F\uFF08\u50CF\u7D20\uFF09\u3002",options:[{value:"32",label:"32"},{value:"64",label:"64"},{value:"128",label:"128"},{value:"160",label:"160\uFF08\u9ED8\u8BA4\uFF09"},{value:"256",label:"256"},{value:"512",label:"512"}]},enableStreamQualityBypass:{group:"\u76F4\u64AD",type:"boolean",default:!0,label:"\u89E3\u9501\u76F4\u64AD\u753B\u8D28",description:"\u5141\u8BB8\u4EE5 Nitro \u753B\u8D28\u8FDB\u884C\u5C4F\u5E55\u5171\u4EAB\u76F4\u64AD\u3002"}}),Fi=C(e=>e?.getName?.()==="EmojiStore"),Ki=C(e=>e?.getName?.()==="StickersStore"),Vi=C(e=>e?.getName?.()==="GuildMemberStore"),Wi=C(e=>e?.getName?.()==="PermissionStore"&&typeof e?.can=="function"),eo={USE_EXTERNAL_EMOJIS:1n<<18n,USE_EXTERNAL_STICKERS:1n<<37n,EMBED_LINKS:1n<<14n},qi=3,Yi=4;function to(){try{return Ce.getCurrentUser?.()?.premiumType??0}catch{return 0}}var Ji=()=>to()>0,Xi=()=>to()>1;function no(e,t){try{let n=Pe.getChannel?.(e);return!n||n.isPrivate?.()?!0:Wi.can?.(t,n)??!0}catch{return!0}}function ro(e){try{let t=Pe.getChannel?.(e);return t?.guild_id??t?.getGuildId?.()??void 0}catch{return}}function oo(e,t,n){if(e?.type===0)return!0;if(e?.available===!1)return!1;let o=!1;if(e?.managed&&e?.guildId){let i=Vi.getSelfMember?.(e.guildId)?.roles??[];o=Array.isArray(e?.roles)&&e.roles.some(a=>i.includes(a))}return Ji()||o?e.guildId===n||no(t,eo.USE_EXTERNAL_EMOJIS):!e?.animated&&e?.guildId===n}function io(e){let t=Number(ye.store.emojiSize)||48,n=e?.animated?"gif":"png",o=new URL(`https://cdn.discordapp.com/emojis/${e.id}.${n}`);return o.searchParams.set("size",String(t)),e?.name&&o.searchParams.set("name",String(e.name)),o.searchParams.set("quality","lossless"),o.toString()}function Qi(e){let t=Number(ye.store.stickerSize)||160,n=e?.format_type===Yi?"gif":"png",o=new URL(`https://media.discordapp.net/stickers/${e.id}.${n}`);return o.searchParams.set("size",String(t)),e?.name&&o.searchParams.set("name",String(e.name)),o.toString()}function Ae(e,t){return!e[t]||/\s/.test(e[t])?"":" "}function Zi(e){return e.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")}function ao(e){let t=e[1];return t&&typeof t=="object"&&typeof t.content=="string"?t:e.find(n=>n&&typeof n=="object"&&typeof n.content=="string")}function Ri(e){for(let t=2;t<e.length;t++){let n=e[t];if(n&&typeof n=="object"&&"stickerIds"in n)return n}return e[3]&&typeof e[3]=="object"?e[3]:void 0}function ea(e,t,n,o){if(!ye.store.enableStickerBypass)return!1;let i=n?.stickerIds;if(!Array.isArray(i)||i.length===0)return!1;let a=Ki.getStickerById?.(i[0]);if(!a||"pack_id"in a)return!1;let c=Xi()&&no(e,eo.USE_EXTERNAL_STICKERS);if(a.available!==!1&&(c||a.guild_id===o))return!1;if(a.format_type===qi)return V.warn("Lottie \u8D34\u7EB8\u65E0\u6CD5\u4F5C\u4E3A\u56FE\u7247\u5185\u8054\uFF0C\u5DF2\u8DF3\u8FC7\uFF1A",a.name),!1;let s=Qi(a);return t.content=`${t.content??""}${Ae(t.content??"",(t.content??"").length-1)}${s}`,i.length=0,!0}function ta(e,t,n){if(!ye.store.enableEmojiBypass)return!1;let o=t?.validNonShortcutEmojis;if(!Array.isArray(o)||o.length===0)return!1;let i=!1;for(let a of o){if(oo(a,e,n))continue;let c=`<${a.animated?"a":""}:${a.originalName||a.name}:${a.id}>`,s=io(a),l=new RegExp(Zi(c),"g");t.content=String(t.content??"").replace(l,(d,u,g)=>(i=!0,`${Ae(g,u-1)}${s}${Ae(g,u+d.length)}`))}return i}var Jt,Xt;function na(e){try{let t=e.args,n=t[0],o=ao(t);if(!o)return;typeof o.content!="string"&&(o.content=String(o.content??""));let i=Ri(t),a=ro(n);i&&ea(n,o,i,a),ta(n,o,a)}catch(t){V.error("send \u6539\u5199\u5931\u8D25\uFF0C\u6D88\u606F\u6309\u539F\u6837\u53D1\u9001",t)}}var ra=/(?<!\\)<a?:(?:\w+):(\d+)>/gi;function oa(e){try{if(!ye.store.enableEmojiBypass)return;let t=e.args,n=t[0],o=ao(t);if(!o||typeof o.content!="string")return;let i=ro(n);o.content=o.content.replace(ra,(a,c,s,l)=>{let d=Fi.getCustomEmojiById?.(c);if(d==null||oo(d,n,i))return a;let u=io(d);return`${Ae(l,s-1)}${u}${Ae(l,s+a.length)}`})}catch(t){V.error("edit \u6539\u5199\u5931\u8D25\uFF0C\u6D88\u606F\u6309\u539F\u6837\u4FDD\u5B58",t)}}var so=M({id:"fake-nitro",name:"\u5047 Nitro",description:"\u65E0\u9700 Nitro \u4E5F\u80FD\u4F7F\u7528\u9700\u8981 Nitro \u7684\u81EA\u5B9A\u4E49\u8868\u60C5\u4E0E\u8D34\u7EB8\uFF1A\u89E3\u9501\u9009\u62E9\u5668\uFF0C\u5E76\u5728\u53D1\u9001\u65F6\u628A\u9501\u5B9A\u7684\u8868\u60C5 / \u8D34\u7EB8\u81EA\u52A8\u6539\u5199\u4E3A\u56FE\u7247\u94FE\u63A5\uFF0C\u5BF9\u65B9\u770B\u5230\u7684\u5C31\u662F\u5185\u8054\u56FE\u7247\u3002",authors:[{name:"Vencord"},{name:"caitemm"}],category:"chat",settings:ye,start(){let e=ue("canUseCustomStickersEverywhere","canStreamQuality");e?(e.canUseCustomStickersEverywhere=()=>!0,e.canUseStickersEverywhere=()=>!0,e.canStreamQuality=()=>!0,e.canUseAnimatedEmojis=()=>!0,e.canUseEmojisEverywhere=()=>!0,e.canUseClientThemes=()=>!0,e.canUsePremiumAppIcons=()=>!0,V.info("\u5DF2 patch PremiumUtils")):V.warn("PremiumUtils \u672A\u627E\u5230");let t=ue("getEmojiUnavailableReason");if(t?.getEmojiUnavailableReason){let o=t.getEmojiUnavailableReason;t.getEmojiUnavailableReason=function(i){return i?.intention===3||i?.intention===4?null:o.call(this,i)},V.info("\u5DF2 patch getEmojiUnavailableReason\uFF08\u8868\u60C5\u9009\u62E9\u5668\u89E3\u9501\uFF09")}else V.warn("getEmojiUnavailableReason \u672A\u627E\u5230");let n=ue("sendMessage","editMessage","deleteMessage");n?(typeof n.sendMessage=="function"&&(Jt=ce.before(n,"sendMessage",na)),typeof n.editMessage=="function"&&(Xt=ce.before(n,"editMessage",oa)),V.info("\u5DF2\u6302\u63A5 MessageActions\uFF08\u53D1\u9001 / \u7F16\u8F91\u6539\u5199\u5C31\u7EEA\uFF09")):V.warn("MessageActions \u672A\u627E\u5230")},stop(){Jt?.(),Xt?.(),Jt=void 0,Xt=void 0}});var it=m("console-cleaner"),co=D({hideSelfXss:{group:"\u5185\u7F6E\u89C4\u5219",type:"boolean",default:!0,label:"\u5C4F\u853D\u81EA\u6211 XSS \u8B66\u544A",description:"Discord \u90A3\u6761\u6BCF\u79D2\u91CD\u5237\u7684\u7EA2\u8272\u201C\u7B49\u4E00\u4E0B\uFF01/ Stop!\u201D\u7C98\u8D34\u8B66\u544A\u3002"},hideLocaleSpam:{group:"\u5185\u7F6E\u89C4\u5219",type:"boolean",default:!0,label:"\u5C4F\u853D\u672C\u5730\u5316\u7F3A\u5931\u5237\u5C4F",description:"\u201C\u2026 does not have a value in the requested locale \u2026\u201D\uFF0C\u5BA2\u6237\u7AEF mod \u8BA2\u9605\u4E8B\u4EF6\u65F6\u4F1A\u75AF\u72C2\u5237\u3002"},hideRiveSpam:{group:"\u5185\u7F6E\u89C4\u5219",type:"boolean",default:!0,label:"\u5C4F\u853D Rive \u52A8\u753B\u62A5\u9519",description:"\u201CCould not find a View Model linked to Artboard \u2026\u201D\uFF0C\u9644\u5E26\u8D85\u957F wasm \u5806\u6808\u3002"},hidePreloadWarnings:{group:"\u5185\u7F6E\u89C4\u5219",type:"boolean",default:!0,label:"\u5C4F\u853D\u8D44\u6E90\u9884\u52A0\u8F7D\u8B66\u544A",description:"\u201Cresource was preloaded using link preload but not used \u2026\u201D\u3002\u89C1\u4E0B\u65B9\u8BF4\u660E\uFF1A\u90E8\u5206\u6B64\u7C7B\u8B66\u544A\u7531\u6D4F\u89C8\u5668\u76F4\u63A5\u4EA7\u751F\uFF0C\u65E0\u6CD5\u62E6\u622A\u3002"},customPatterns:{group:"\u81EA\u5B9A\u4E49",type:"string-list",default:[],label:"\u81EA\u5B9A\u4E49\u5C4F\u853D\u5173\u952E\u8BCD",description:"\u4EFB\u4F55\u4E00\u6761 console \u6D88\u606F\u53EA\u8981\u5305\u542B\u8FD9\u91CC\u7684\u67D0\u4E2A\u5B50\u4E32\uFF0C\u5C31\u4F1A\u88AB\u4E22\u5F03\uFF08\u533A\u5206\u5927\u5C0F\u5199\uFF09\u3002",itemPlaceholder:"\u8981\u5C4F\u853D\u7684\u6587\u5B57\u7247\u6BB5"}}),ia=["\u7B49\u4E00\u4E0B","\u5728\u8FD9\u91CC\u7C98\u8D34","\u5982\u679C\u6709\u4EBA\u544A\u8BC9\u60A8","\u8BF7\u5173\u95ED\u6B64\u7A97\u53E3","Stop!","self-XSS","browser feature intended for developers","This is a browser feature","Nicht so schnell","Attends","Alto","\u3061\u3087\u3063\u3068\u5F85\u3063\u3066","\uC7A0\uAE50"],aa=["does not have a value in the requested locale"],sa=["Could not find a View Model linked to Artboard","BaseGlowRemapped"],ca=["was preloaded using link preload","preloaded intentionally"],la=["log","info","warn","error","debug"];function da(e){let t="";for(let n of e)typeof n=="string"?t+=n+" ":(typeof n=="number"||typeof n=="boolean")&&(t+=String(n)+" ");return t}function Le(e,t){for(let n of t)if(n&&e.includes(n))return!0;return!1}function ua(e){if(typeof e[0]=="string"&&e[0].startsWith("%cHalcyon"))return!1;let t=da(e);if(t==="")return!1;let n=co.store;return!!(n.hideSelfXss&&Le(t,ia)||n.hideLocaleSpam&&Le(t,aa)||n.hideRiveSpam&&Le(t,sa)||n.hidePreloadWarnings&&Le(t,ca)||n.customPatterns.length&&Le(t,n.customPatterns))}var at=[],Qt=0;function ha(){return e=>{try{if(ua(e.args)){Qt++;return}}catch{}return e.callOriginal()}}var lo=M({id:"console-cleaner",name:"\u63A7\u5236\u53F0\u51C0\u5316",description:"\u5C4F\u853D Discord \u5728\u5F00\u53D1\u8005\u63A7\u5236\u53F0\u91CC\u5237\u5C4F\u7684\u65E0\u7528\u4FE1\u606F\uFF08\u81EA\u6211 XSS \u8B66\u544A\u3001Rive \u52A8\u753B\u62A5\u9519\u3001\u672C\u5730\u5316\u7F3A\u5931\u3001\u8D44\u6E90\u9884\u52A0\u8F7D\u8B66\u544A\uFF09\uFF0C\u652F\u6301\u81EA\u5B9A\u4E49\u5173\u952E\u8BCD\u3002\u5173\u95ED\u63D2\u4EF6\u5373\u6062\u590D\u539F\u59CB console\u3002",authors:[{name:"caitemm"},{name:"catie"}],category:"utility",settings:co,start(){let e=globalThis.console;if(!e){it.warn("\u672A\u627E\u5230 console \u5BF9\u8C61\uFF0C\u63D2\u4EF6\u65E0\u4E8B\u53EF\u505A");return}Qt=0;let t=ha();for(let n of la)if(typeof e[n]=="function")try{at.push(ce.instead(e,n,t))}catch(o){it.error(`\u6302\u63A5 console.${n} \u5931\u8D25`,o)}it.info(`\u5DF2\u51C0\u5316 console\uFF08\u62E6\u622A ${at.length} \u4E2A\u65B9\u6CD5\uFF09\u3002\u6CE8\u610F\uFF1A\u6D4F\u89C8\u5668\u81EA\u8EAB\u4EA7\u751F\u7684\u8B66\u544A\uFF08\u5982\u67D0\u4E9B preload \u63D0\u793A\uFF09\u65E0\u6CD5\u901A\u8FC7 JS \u62E6\u622A\u3002`)},stop(){for(let e of at)try{e()}catch{}at=[],it.info(`\u5DF2\u6062\u590D\u539F\u59CB console\uFF08\u672C\u6B21\u5171\u5C4F\u853D ${Qt} \u6761\u6D88\u606F\uFF09`)}});var uo=[gr,$r,Br,Kr,Rr,so,lo];var ho=m("extension");L.registerAll(uo);L.prepare();async function pa(){await Pn,await L.boot(),pe();try{globalThis.HalcyonAPI={open:Xe,close:se,runtime:L,patchReport:()=>_e(),dumpSource:(e,t)=>wn(e,t),diagnose:()=>En()}}catch{}ho.info("Halcyon (extension) ready \u2014 press Ctrl/Cmd+Shift+H to open settings")}pa().catch(e=>ho.error("extension boot failed",e));})();
