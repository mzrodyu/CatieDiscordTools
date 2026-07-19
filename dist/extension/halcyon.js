"use strict";var Halcyon=(()=>{var yt={debug:10,info:20,warn:30,error:40},rr={debug:"#8E8E93",info:"#0A84FF",warn:"#FF9F0A",error:"#FF453A"},or=500,ge=[],Le=new Set,ir=yt.info;function pe(e,t,n){let o={time:Date.now(),level:e,scope:t,parts:n};ge.push(o),ge.length>or&&ge.shift();for(let c of Le)try{c(o)}catch{}if(yt[e]<ir)return;let i=`background:${rr[e]};color:#fff;border-radius:4px;padding:0 6px;font-weight:600`;(e==="error"?console.error:e==="warn"?console.warn:console.log)(`%cHalcyon%c ${t}`,i,"color:inherit;font-weight:600",...n)}function f(e){return{debug:(...t)=>pe("debug",e,t),info:(...t)=>pe("info",e,t),warn:(...t)=>pe("warn",e,t),error:(...t)=>pe("error",e,t),child:t=>f(`${e}:${t}`)}}function Ae(){return ge.slice()}function bt(e){return Le.add(e),()=>Le.delete(e)}var A=f("modules"),vt="webpackChunkdiscord_app",D,Z=!1,xt=!1,fe=new Set,De=[],St=()=>{};function kt(e){St=e,globalThis.__halcyon_self__=t=>St(t)}function wt(e){De.push({...e,applied:!1,hits:0})}function Q(){return De.map(({pluginId:e,label:t,applied:n,hits:o})=>({pluginId:e,label:t,applied:n,hits:o}))}function $e(){if(xt)return;xt=!0;let e=globalThis,t=e[vt]??[],n=a=>function(...c){try{_t(c[0])}catch(s){A.error("failed to instrument chunk",s)}return a.apply(this??t,c)},o=t.push,i=typeof o=="function"&&o!==Array.prototype.push?n(o.bind(t)):Array.prototype.push.bind(t);try{Object.defineProperty(t,"push",{configurable:!0,get:()=>i,set:a=>{i=n(a)}})}catch(a){A.error("could not install chunk interceptor",a);return}e[vt]=t;for(let a of t)try{_t(a)}catch{}t.push([[Symbol("halcyon.require")],{},a=>{D=a}])}function Et(){return new Promise(e=>{$e(),gr(t=>j(t),()=>{Z||(Z=!0,A.info("core runtime detected"),e())}),setTimeout(()=>{Z||(A.warn("core module not seen within grace period; continuing degraded"),Z=!0,e())},15e3)})}function _t(e){let t=e?.[1];if(!(!t||typeof t!="object"))for(let n of Object.keys(t)){let o=t[n];typeof o!="function"||o.__halcyon__||(t[n]=ar(n,o))}}function ar(e,t){let n=De.filter(a=>ur(a.find,t)),o=n.length?sr(e,t,n):t,i=function(a,c,s){o.call(this,a,c,s);try{pr(a)}catch(l){A.error("module observer threw for",e,l)}};return i.toString=()=>o.toString(),i.__halcyon__=!0,i}function sr(e,t,n){let o=String(t);for(let i of n){let a=o,c=dr(i.replace,i.pluginId);if(o=i.all?o.replace(new RegExp(i.match.source,lr(i.match.flags)),c):o.replace(i.match,c),o===a){A.warn(`patch "${i.label}" (${i.pluginId}) matched module ${e} but changed nothing`);continue}i.applied=!0,i.hits++,A.debug(`applied patch "${i.label}" (${i.pluginId}) to module ${e}`)}try{return(0,eval)(`(${cr(o)})`)}catch(i){return A.error(`patched module ${e} failed to compile; using original`,i),t}}function cr(e){let t=e.trimStart();if(/^(async\s+)?function[\s*(]/.test(t)||/^(async\s+)?(\([^)]*\)|[\w$]+)\s*=>/.test(t))return t;let n=t.match(/^(async\s+)?(\*\s*)?(?:\[[^\]]*\]|[\w$]+)\s*\(/);if(n){let o=n[1]?"async ":"",i=n[2]?"*":"";return`${o}function${i}${t.slice(n[0].length-1)}`}return t}function lr(e){return e.includes("g")?e:e+"g"}function dr(e,t){let n=`__halcyon_self__(${JSON.stringify(t)})`;return typeof e=="string"?e.split("$self").join(n):(...o)=>e(...o).split("$self").join(n)}function ur(e,t){let n=t.toString();return typeof e=="string"?n.includes(e):e.test(n)}var hr=40;function Oe(e,t,n){try{if(t(e,n))return e}catch{}if(typeof e!="object"&&typeof e!="function")return;let o;try{o=Object.keys(e)}catch{return}if(!(o.length>hr))for(let i of o){let a;try{a=e[i]}catch{continue}if(!(a==null||typeof a!="object"&&typeof a!="function"))try{if(t(a,n))return a}catch{}}}function pr(e){if(!fe.size)return;let t=e.exports;if(t!=null)for(let n of fe){let o=Oe(t,n.filter,{id:e.id,module:e});o!==void 0&&(fe.delete(n),n.resolve(o))}}function I(e){if(D)for(let t of Object.keys(D.c)){let n=D.c[t],o=n?.exports;if(o==null||o===globalThis)continue;let i=Oe(o,e,{id:t,module:n});if(i!==void 0)return i}}function It(e){let t=[];if(!D)return t;for(let n of Object.keys(D.c)){let o=D.c[n],i=o?.exports;if(i==null||i===globalThis)continue;let a=Oe(i,e,{id:n,module:o});a!==void 0&&t.push(a)}return t}function Nt(...e){return I(t=>e.every(n=>t[n]!==void 0))}function Ct(e){return I(t=>t?.getName?.()===e||t?.constructor?.displayName===e)}function gr(e,t){let n=I(e);if(n!==void 0){t(n);return}fe.add({filter:e,resolve:t})}function E(e){let t,n=()=>t??=I(e);return new Proxy({},{get(o,i){let a=n();if(a==null)return;let c=a[i];return typeof c=="function"?c.bind(a):c},has(o,i){let a=n();return a!=null&&i in a}})}function Pt(){return Z}function j(e){return e!=null&&typeof e.dispatch=="function"&&typeof e.subscribe=="function"&&(typeof e._actionHandlers<"u"||typeof e._subscriptions<"u"||typeof e._waitQueue<"u"||typeof e.isDispatching=="function"||typeof e.wait=="function")}function Mt(e,t=300){let n=D?.m;if(!n)return"<webpack require not ready \u2014 open the target UI first>";let o=[];for(let i of Object.keys(n)){let a;try{a=String(n[i])}catch{continue}if(!a.includes(e))continue;let c=[],s=a.indexOf(e),l=0;for(;s>=0&&l<4;)c.push(a.slice(Math.max(0,s-t),s+e.length+t)),s=a.indexOf(e,s+e.length),l++;o.push(`===== module ${i} (${l} hit${l===1?"":"s"}) =====
${c.join(`
  ...  
`)}`)}return o.length?o.join(`

`):`<no loaded factory contains "${e}">`}function Tt(){let e=Q(),t={embedRendered:typeof document<"u"&&!!document.querySelector(".hc-embed"),halcyonMounted:typeof document<"u"&&!!document.querySelector(".halcyon")};try{let n=null,o=document.querySelectorAll("*");for(let u=0;u<o.length&&!n;u++){let m=o[u],k=Object.keys(m).find(P=>P.startsWith("__reactFiber$"));k&&(n=m[k])}if(!n)return JSON.stringify({error:"no React fiber found in DOM",patches:e,dom:t},null,2);let i=n;for(;i.return;)i=i.return;let a=u=>{try{if(typeof u=="function")return Function.prototype.toString.call(u);if(u&&typeof u=="object"){let m=u.type||u.render;if(typeof m=="function")return Function.prototype.toString.call(m)}}catch{}return""},c=u=>u&&(u.displayName||u.name)||u&&u.type&&(u.type.displayName||u.type.name)||"",s=[i],l=0,d=[],h=[],p=new Set,_=new Set;for(;s.length&&l<4e4;){let u=s.shift();l++;let m=u.type;if(m&&(typeof m=="function"||typeof m=="object")){let k=a(m),P=c(m)||"anon",mt=k.includes("__halcyon_self__");k.includes("buildLayout")&&d.push({name:P,patched:mt}),k.includes("getPredicateSections")&&h.push({name:P,patched:mt}),(k.includes("renderSidebar")||k.includes("SETTINGS_SIDEBAR"))&&p.add(P),/settings/i.test(P)&&_.add(P)}u.child&&s.push(u.child),u.sibling&&s.push(u.sibling)}let V=e.find(u=>u.label==="user-settings-layout"),ue=e.find(u=>u.label==="user-settings-sidebar"),he=t.embedRendered?"embed rendered \u2014 Halcyon section is on screen":V?.applied||ue?.applied?"patch applied at load but section not seen \u2014 open user settings, then re-run":"no settings patch matched this build \u2014 run dumpSource('buildLayout') and share the output";return JSON.stringify({verdict:he,dom:t,patches:e,walked:l,buildLayoutHits:d,gpsHits:h,sidebarComps:[...p].slice(0,25),settingsNamed:[..._].slice(0,40)},null,2)}catch(n){return JSON.stringify({error:String(n),patches:e,dom:t},null,2)}}function Lt(e){let t,n=()=>t??=e();return new Proxy(function(){},{get:(o,i)=>n()?.[i],set:(o,i,a)=>{let c=n();return c&&(c[i]=a),!0},has:(o,i)=>{let a=n();return a!=null&&i in a},ownKeys:()=>Reflect.ownKeys(n()??{}),getOwnPropertyDescriptor:(o,i)=>Reflect.getOwnPropertyDescriptor(n()??{},i),apply:(o,i,a)=>n().apply(i,a),construct:(o,i)=>new(n())(...i)})}function ze(...e){return t=>e.every(n=>typeof t[n]=="function")&&typeof t.__halcyon_probe__>"u"}var r=Lt(()=>I(ze("createElement","useState","useEffect","useMemo"))),R=Lt(()=>I(ze("createPortal","flushSync"))??I(ze("createPortal"))),g=(...e)=>r.useState(...e),v=(...e)=>r.useEffect(...e),At=(...e)=>r.useMemo(...e);var ee=(...e)=>r.useRef(...e);var fr="halcyon:ext:main",mr="halcyon:ext:bridge",te=new Map,Be=!1,Dt,$t=new Promise(e=>{Dt=e});function Ot(){Be||(Be=!0,Dt())}function me(e,t){try{window.postMessage({channel:fr,kind:e,...t},"*")}catch{}}window.addEventListener("message",e=>{if(e.source!==window)return;let t=e.data;if(!(!t||t.channel!==mr)&&t.kind==="hydrate"&&t.entries&&typeof t.entries=="object"){for(let[n,o]of Object.entries(t.entries))typeof o=="string"&&te.set(n,o);Ot()}});var yr={read:e=>te.has(e)?te.get(e):null,write:(e,t)=>{te.set(e,t),me("write",{key:e,value:t})},remove:e=>{te.delete(e),me("remove",{key:e})}},br=globalThis.HalcyonNative??={};br.storage=yr;me("hydrate");setTimeout(()=>{Be||me("hydrate")},120);setTimeout(Ot,2e3);var He=f("settings"),Ge="halcyon:";function vr(){let e=globalThis.HalcyonNative?.storage;if(e&&typeof e.read=="function"&&typeof e.write=="function")return e;try{let n=globalThis.localStorage;if(n)return{read:o=>n.getItem(o),write:(o,i)=>n.setItem(o,i),remove:o=>n.removeItem(o)}}catch{}He.warn("no persistent storage backend; settings will not survive a restart");let t=new Map;return{read:n=>t.get(n)??null,write:(n,o)=>void t.set(n,o),remove:n=>void t.delete(n)}}var je=vr();function H(e){let t=je.read(Ge+e);if(!t)return{};try{let n=JSON.parse(t);return n&&typeof n=="object"?n:{}}catch{let n=new Date().toISOString().replace(/[:.]/g,"-");try{je.write(`${Ge}${e}.corrupt-${n}`,t)}catch{}return He.warn(`stored settings for "${e}" were unreadable; reset to defaults (backup kept)`),{}}}function K(e,t){try{je.write(Ge+e,JSON.stringify(t))}catch(n){He.error(`could not persist settings for "${e}"`,n)}}var $=f("runtime"),Fe="core.enabled",Ue=class{records=new Map;enabledMap={};bootPatched=new Set;listeners=new Set;prepared=!1;booted=!1;register(t){if(this.records.has(t.id)){$.warn(`duplicate plugin id "${t.id}" ignored`);return}this.records.set(t.id,{plugin:t,state:"disabled"}),t.settings?.__bind(t.id)}registerAll(t){for(let n of t)this.register(n)}prepare(){this.prepared||(this.prepared=!0,kt(t=>this.records.get(t)?.plugin),this.enabledMap=H(Fe)??{},this.registerBootPatches(),$e())}async boot(){if(this.booted)return;this.booted=!0,this.prepare(),this.enabledMap=H(Fe)??{};for(let{plugin:n}of this.records.values())n.settings?.__bind(n.id);this.registerBootPatches(),await Et();for(let n of this.startOrder())this.shouldRun(n)&&this.startPlugin(n);this.emit(),$.info(`runtime up \u2014 ${this.runningCount()} plugin(s) active (build 2026-07-19 22:33:11)`)}isEnabled(t){let n=this.records.get(t);return n?n.plugin.required?!0:this.enabledMap[t]===!0:!1}enable(t){let n=this.records.get(t);if(n){for(let o of n.plugin.dependencies??[])this.isEnabled(o)||this.enable(o);this.enabledMap[t]=!0,this.persistEnabledState(),this.booted&&Pt()&&this.startPlugin(t),this.emit()}}disable(t){let n=this.records.get(t);if(n){if(n.plugin.required){$.warn(`"${t}" is required and cannot be disabled`);return}for(let[o,i]of this.records)i.plugin.dependencies?.includes(t)&&this.isEnabled(o)&&this.disable(o);this.enabledMap[t]=!1,this.persistEnabledState(),this.stopPlugin(t),this.emit()}}toggle(t){return this.isEnabled(t)?(this.disable(t),!1):(this.enable(t),!0)}needsRestart(t){return this.records.get(t)?.plugin.patches?.length?this.isEnabled(t)!==this.bootPatched.has(t):!1}getPlugin(t){return this.records.get(t)?.plugin}list(){return[...this.records.values()].map(({plugin:t,state:n,error:o})=>({id:t.id,name:t.name,description:t.description,category:t.category,authors:t.authors,required:t.required??!1,hidden:t.hidden??!1,enabled:this.isEnabled(t.id),state:n,error:o,hasSettings:t.settings!=null,hasPage:t.page!=null,needsRestart:this.needsRestart(t.id)}))}onChange(t){return this.listeners.add(t),()=>this.listeners.delete(t)}shouldRun(t){if(!this.isEnabled(t))return!1;let n=this.records.get(t);return n?(n.plugin.dependencies??[]).every(o=>this.isEnabled(o)):!1}registerBootPatches(){for(let{plugin:t}of this.records.values())this.shouldRun(t.id)&&t.patches?.length&&!this.bootPatched.has(t.id)&&(this.registerPatches(t),this.bootPatched.add(t.id))}registerPatches(t){for(let n of t.patches??[]){let o=Array.isArray(n.replacement)?n.replacement:[n.replacement];for(let i of o)wt({pluginId:t.id,label:n.label,find:n.find,match:i.match,replace:i.replace,all:n.all??!1})}}startPlugin(t){let n=this.records.get(t);if(!(!n||n.state==="running"||n.state==="starting")){n.state="starting";try{n.plugin.start?.(),n.state="running",n.error=void 0,$.debug(`started "${t}"`)}catch(o){n.state="errored",n.error=o,this.enabledMap[t]=!1,this.persistEnabledState(),$.error(`plugin "${t}" threw during start; it has been disabled`,o)}this.emit()}}stopPlugin(t){let n=this.records.get(t);if(!(!n||n.state!=="running"&&n.state!=="errored")){n.state="stopping";try{n.plugin.stop?.(),$.debug(`stopped "${t}"`)}catch(o){$.error(`plugin "${t}" threw during stop; state may be inconsistent`,o)}finally{n.state="disabled",this.emit()}}}startOrder(){let t=[],n=new Set,o=(i,a)=>{if(n.has(i))return;if(a.has(i)){$.error(`dependency cycle involving "${i}"; breaking it`);return}a.add(i);let c=this.records.get(i);for(let s of c?.plugin.dependencies??[])this.records.has(s)&&o(s,a);a.delete(i),n.add(i),t.push(i)};for(let i of this.records.keys())o(i,new Set);return t}runningCount(){let t=0;for(let n of this.records.values())n.state==="running"&&t++;return t}persistEnabledState(){K(Fe,this.enabledMap)}emit(){for(let t of this.listeners)try{t()}catch{}}},w=new Ue;var xr=Symbol.for("halcyon.plugin"),Sr=/^[a-z0-9]+(?:-[a-z0-9]+)*$/;function O(e){if(!Sr.test(e.id))throw new Error(`Halcyon: invalid plugin id "${e.id}" \u2014 use lowercase words separated by single dashes.`);if(!e.authors?.length)throw new Error(`Halcyon: plugin "${e.id}" must list at least one author.`);return Object.assign(e,{[xr]:!0})}var zt=`/*
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
`;var Bt=`/*
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
`;var Gt="halcyon-styles",jt=!1;function q(){if(jt)return;let e=document.getElementById(Gt),t=e instanceof HTMLStyleElement?e:document.createElement("style");t.id=Gt,t.textContent=`${zt}
${Bt}`,e||document.head.appendChild(t),jt=!0}function y({size:e=20,className:t,filled:n,children:o,...i}){let a=i["aria-label"];return(typeof e!="number"||!Number.isFinite(e))&&(e=20),r.createElement("svg",{className:t,width:e,height:e,viewBox:"0 0 24 24",fill:n?"currentColor":"none",stroke:n?"none":"currentColor",strokeWidth:1.5,strokeLinecap:"round",strokeLinejoin:"round",role:a?"img":void 0,"aria-label":a,"aria-hidden":a?void 0:!0},o)}function ye(e){return r.createElement(y,{...e},r.createElement("rect",{x:"3.25",y:"3.25",width:"17.5",height:"17.5",rx:"5"}),r.createElement("path",{d:"M6.5 13.2c1.4-2.5 2.9-2.5 4.3 0s2.9 2.5 4.3 0 2.9-2.5 2.9-2.5"}))}function Ht(e){return r.createElement(y,{...e},r.createElement("path",{d:"M9 6l6 6-6 6"}))}function Ft(e){return r.createElement(y,{...e},r.createElement("circle",{cx:"12",cy:"12",r:"8.25"}),r.createElement("path",{d:"M12 7.5V12l3 2"}))}function ne(e){return r.createElement(y,{...e},r.createElement("path",{d:"M4.5 7h15"}),r.createElement("path",{d:"M9.25 7V5.5A1.5 1.5 0 0110.75 4h2.5A1.5 1.5 0 0114.75 5.5V7"}),r.createElement("path",{d:"M6.5 7l.85 11.1A2 2 0 009.34 20h5.32a2 2 0 001.99-1.9L17.5 7"}),r.createElement("path",{d:"M10 11v5.5M14 11v5.5"}))}function Ve(e){return r.createElement(y,{...e},r.createElement("path",{d:"M13.5 6.5l4 4"}),r.createElement("path",{d:"M4.5 19.5l1-4L15.5 5.5a2 2 0 013 3L8.5 18.5l-4 1z"}))}function Ut(e){return r.createElement(y,{...e},r.createElement("path",{d:"M12 3.5l7 2.6v5c0 4.4-3 7.3-7 8.9-4-1.6-7-4.5-7-8.9v-5l7-2.6z"}),r.createElement("path",{d:"M9 12l2 2 4-4"}))}function Vt(e){return r.createElement(y,{...e},r.createElement("path",{d:"M5 5.5h14a1.5 1.5 0 011.5 1.5v8a1.5 1.5 0 01-1.5 1.5H9.5L5.5 20v-3H5A1.5 1.5 0 013.5 15.5V7A1.5 1.5 0 015 5.5z"}))}function Ke(e){return r.createElement(y,{...e},r.createElement("circle",{cx:"11",cy:"11",r:"6.25"}),r.createElement("path",{d:"M20 20l-3.8-3.8"}))}function Kt(e){return r.createElement(y,{...e},r.createElement("path",{d:"M6.5 6.5l11 11M17.5 6.5l-11 11"}))}function Y(e){return r.createElement(y,{...e},r.createElement("path",{d:"M4.5 8h9M17 8h2.5M4.5 16h2.5M10.5 16h9"}),r.createElement("circle",{cx:"15",cy:"8",r:"2.25"}),r.createElement("circle",{cx:"9",cy:"16",r:"2.25"}))}function qt(e){return r.createElement(y,{...e},r.createElement("path",{d:"M4.5 9.5v5H7l4.5 3.5V6L7 9.5H4.5z"}),r.createElement("path",{d:"M15 9a4 4 0 010 6"}),r.createElement("path",{d:"M17.5 6.5a7.5 7.5 0 010 11"}))}function Yt(e){return r.createElement(y,{...e},r.createElement("circle",{cx:"12",cy:"12",r:"8.25"}),r.createElement("path",{d:"M12 3.75a8.25 8.25 0 010 16.5z",fill:"currentColor",stroke:"none"}))}function Wt(e){return r.createElement(y,{...e},r.createElement("path",{d:"M8.5 8L4.5 12l4 4"}),r.createElement("path",{d:"M15.5 8l4 4-4 4"}),r.createElement("path",{d:"M13.5 5.5l-3 13"}))}function Jt(e){return r.createElement(y,{...e,filled:!0},r.createElement("circle",{cx:"5.5",cy:"12",r:"1.6"}),r.createElement("circle",{cx:"12",cy:"12",r:"1.6"}),r.createElement("circle",{cx:"18.5",cy:"12",r:"1.6"}))}function Xt(e){return r.createElement(y,{...e},r.createElement("path",{d:"M12 4v10"}),r.createElement("path",{d:"M8 10.5l4 4 4-4"}),r.createElement("path",{d:"M5 19.5h14"}))}function be(e){return r.createElement(y,{...e},r.createElement("path",{d:"M12 5v14M5 12h14"}))}function ve(e){return r.createElement(y,{...e},r.createElement("circle",{cx:"12",cy:"12",r:"8.25"}),r.createElement("path",{d:"M12 11v5"}),r.createElement("path",{d:"M12 7.75h.01"}))}function W(e){return r.createElement(y,{...e},r.createElement("path",{d:"M12 4.5L3.5 19h17L12 4.5z"}),r.createElement("path",{d:"M12 10v4"}),r.createElement("path",{d:"M12 16.75h.01"}))}function J(e){return r.createElement(y,{...e},r.createElement("path",{d:"M8.5 7h11M8.5 12h11M8.5 17h11"}),r.createElement("path",{d:"M4.5 7h.01M4.5 12h.01M4.5 17h.01"}))}function Zt(e){return r.createElement(y,{...e},r.createElement("path",{d:"M5 12h14"}))}function re(e){return r.createElement(y,{...e},r.createElement("path",{d:"M19 8.5a7.5 7.5 0 10.9 6"}),r.createElement("path",{d:"M19 4v4.5h-4.5"}))}function Qt(e){return r.createElement(y,{...e},r.createElement("path",{d:"M15 6l-6 6 6 6"}))}function Rt(e){return r.createElement(y,{...e},r.createElement("rect",{x:"4",y:"4",width:"16",height:"6",rx:"2"}),r.createElement("rect",{x:"4",y:"14",width:"16",height:"6",rx:"2"}),r.createElement("path",{d:"M8 7h.01M8 17h.01"}))}function en(e){return r.createElement(y,{...e},r.createElement("circle",{cx:"12",cy:"12",r:"2"}),r.createElement("path",{d:"M8.5 8.5a5 5 0 000 7M15.5 8.5a5 5 0 010 7"}),r.createElement("path",{d:"M6 6a9 9 0 000 12M18 6a9 9 0 010 12"}))}function z({checked:e,onChange:t,disabled:n,...o}){return r.createElement("button",{type:"button",role:"switch","aria-checked":e,"aria-label":o["aria-label"],className:"hc-toggle","data-on":e,disabled:n,onClick:()=>{n||t(!e)}},r.createElement("span",{className:"hc-toggle__knob"}))}function tn({icon:e,iconBackground:t,title:n,subtitle:o,accessory:i,onClick:a,showChevron:c}){let s=typeof a=="function";return r.createElement("div",{className:s?"hc-row hc-row--button":"hc-row",onClick:a,role:s?"button":void 0,tabIndex:s?0:void 0,onKeyDown:s?l=>{(l.key==="Enter"||l.key===" ")&&(l.preventDefault(),a?.())}:void 0},e&&r.createElement("div",{className:"hc-row__icon",style:t?{background:t}:void 0},e),r.createElement("div",{className:"hc-row__text"},r.createElement("div",{className:"hc-row__title"},n),o!=null&&o!==!1&&r.createElement("div",{className:"hc-row__subtitle"},o)),i!=null&&i!==!1&&r.createElement("div",{className:"hc-row__accessory"},i),c&&r.createElement(Ht,{size:20,className:"hc-row__chevron"}))}function F({tone:e="neutral",children:t}){return r.createElement("span",{className:"hc-badge","data-tone":e},t)}function N({icon:e,title:t,subtitle:n,action:o}){return r.createElement("div",{className:"hc-empty"},e,r.createElement("div",{className:"hc-empty__title"},t),n&&r.createElement("div",{className:"hc-empty__subtitle"},n),o&&r.createElement("div",{style:{marginTop:"var(--hc-space-5)"}},o))}function nn(e,t,n){return t!=null&&e<t?t:n!=null&&e>n?n:e}function rn({value:e,onChange:t,min:n,max:o,step:i=1}){let a=n!=null&&e<=n,c=o!=null&&e>=o;return r.createElement("div",{className:"hc-stepper"},r.createElement("button",{type:"button",className:"hc-stepper__btn",onClick:()=>t(nn(e-i,n,o)),disabled:a,"aria-label":"\u51CF\u5C11"},r.createElement(Zt,{size:16})),r.createElement("span",{className:"hc-stepper__value"},e),r.createElement("button",{type:"button",className:"hc-stepper__btn",onClick:()=>t(nn(e+i,n,o)),disabled:c,"aria-label":"\u589E\u52A0"},r.createElement(be,{size:16})))}function oe({value:e,onChange:t,className:n,...o}){return r.createElement("input",{className:n?`hc-input ${n}`:"hc-input",value:e,onChange:i=>t(i.currentTarget.value),...o})}function on({value:e,options:t,onChange:n,...o}){let[i,a]=g(!1),[c,s]=g(-1),l=ee(null),d=ee(null),[h,p]=g(null),_=t.find(u=>u.value===e);v(()=>{if(!i)return;let u=m=>{let k=m.target;l.current?.contains(k)||d.current?.contains(k)||a(!1)};return document.addEventListener("pointerdown",u,!0),()=>document.removeEventListener("pointerdown",u,!0)},[i]),v(()=>{if(!i)return;let u=m=>{d.current&&m.target instanceof Node&&d.current.contains(m.target)||a(!1)};return window.addEventListener("scroll",u,!0),window.addEventListener("resize",u),()=>{window.removeEventListener("scroll",u,!0),window.removeEventListener("resize",u)}},[i]);let V=()=>{let u=l.current?.getBoundingClientRect();if(u){let m=Math.min(280,t.length*36+10),k=u.bottom+6,P=k+m>window.innerHeight-8?Math.max(8,u.top-6-m):k;p({top:P,right:Math.max(8,window.innerWidth-u.right),width:u.width})}s(Math.max(0,t.findIndex(m=>m.value===e))),a(!0)},ue=u=>{a(!1),u!==e&&n(u)},he=u=>{if(!i){(u.key==="Enter"||u.key===" "||u.key==="ArrowDown")&&(u.preventDefault(),V());return}u.key==="Escape"?(u.preventDefault(),a(!1)):u.key==="ArrowDown"?(u.preventDefault(),s(m=>Math.min(t.length-1,m+1))):u.key==="ArrowUp"?(u.preventDefault(),s(m=>Math.max(0,m-1))):u.key==="Enter"||u.key===" "?(u.preventDefault(),c>=0&&c<t.length&&ue(t[c].value)):u.key==="Tab"&&a(!1)};return r.createElement("div",{className:"hc-select",ref:l,onKeyDown:he},r.createElement("button",{type:"button",className:"hc-select__button","aria-haspopup":"listbox","aria-expanded":i,"aria-label":o["aria-label"],onClick:()=>i?a(!1):V()},r.createElement("span",{className:"hc-select__value"},_?.label??e),r.createElement("svg",{className:"hc-select__chevron",width:"12",height:"12",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:2.5,strokeLinecap:"round",strokeLinejoin:"round","aria-hidden":!0,"data-open":i},r.createElement("path",{d:"M6 9l6 6 6-6"}))),i&&h&&R.createPortal(r.createElement("div",{className:"halcyon",ref:d,style:{position:"fixed",top:h.top,right:h.right,zIndex:1e4},onKeyDown:he},r.createElement("div",{className:"hc-select__menu",role:"listbox",style:{minWidth:h.width}},t.map((u,m)=>r.createElement("button",{type:"button",key:u.value,role:"option","aria-selected":u.value===e,className:"hc-select__option","data-active":m===c,"data-selected":u.value===e,onPointerEnter:()=>s(m),onClick:()=>ue(u.value)},r.createElement("span",{className:"hc-select__optlabel"},u.label),u.value===e&&r.createElement("svg",{className:"hc-select__check",width:"14",height:"14",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:2.5,strokeLinecap:"round",strokeLinejoin:"round","aria-hidden":!0},r.createElement("path",{d:"M5 12.5l4.5 4.5L19 7"})))))),document.body))}function an({value:e,onChange:t,itemPlaceholder:n}){let[o,i]=g(""),a=()=>{let s=o.trim();if(!s||e.includes(s)){i("");return}t([...e,s]),i("")},c=s=>{t(e.filter((l,d)=>d!==s))};return r.createElement("div",{className:"hc-strlist"},e.map((s,l)=>r.createElement("div",{className:"hc-strlist__item",key:s},r.createElement(oe,{value:s,onChange:()=>{},readOnly:!0}),r.createElement("button",{type:"button",className:"hc-iconbtn hc-iconbtn--danger",onClick:()=>c(l),"aria-label":"\u79FB\u9664"},r.createElement(ne,{size:18})))),r.createElement("div",{className:"hc-strlist__add"},r.createElement(oe,{value:o,onChange:i,placeholder:n??"\u6DFB\u52A0\u4E00\u9879",onKeyDown:s=>{s.key==="Enter"&&(s.preventDefault(),a())}}),r.createElement("button",{type:"button",className:"hc-iconbtn",onClick:a,"aria-label":"\u6DFB\u52A0",disabled:!o.trim()},r.createElement(be,{size:18}))))}function C({variant:e="secondary",size:t="md",icon:n,className:o,children:i,type:a="button",...c}){let s=["hc-btn",`hc-btn--${e}`];return t!=="md"&&s.push(`hc-btn--${t}`),o&&s.push(o),r.createElement("button",{type:a,className:s.join(" "),...c},n,i!=null&&i!==!1&&r.createElement("span",null,i))}function xe(){let[e,t]=g(()=>w.list());return v(()=>{let n=()=>t(w.list());return n(),w.onChange(n)},[]),e}function sn(e){let[,t]=g(0);return v(()=>{let n=Object.keys(e.schema).map(o=>e.subscribe(o,()=>t(i=>i+1)));return()=>{for(let o of n)o()}},[e]),e.store}function cn(e){return e===null||typeof e!="object"?e:JSON.parse(JSON.stringify(e))}function wr(e,t){if(e===t)return!0;try{return JSON.stringify(e)===JSON.stringify(t)}catch{return!1}}function ln({settings:e}){let t=sn(e),n=At(()=>Object.keys(e.schema).filter(d=>!e.schema[d].hidden),[e]),[o,i]=g(()=>qe(t,n));if(v(()=>{i(qe(t,n))},[e]),n.length===0)return null;let a=n.filter(d=>!wr(o[d],t[d])),c=()=>{for(let d of a)t[d]=cn(o[d])},s=()=>i(qe(t,n)),l=[];for(let d of n){let h=e.schema[d].group??"\u8BBE\u7F6E",p=l[l.length-1];p&&p.title===h?p.keys.push(d):l.push({title:h,keys:[d]})}return r.createElement(r.Fragment,null,l.map((d,h)=>r.createElement("div",{className:"hc-section",key:`${d.title}-${h}`},r.createElement("div",{className:"hc-section__title"},d.title),r.createElement("div",{className:"hc-section__body"},d.keys.map(p=>r.createElement(Er,{key:p,def:e.schema[p],value:o[p],onChange:_=>i(V=>({...V,[p]:_}))}))))),a.length>0&&r.createElement("div",{className:"hc-savebar"},r.createElement("span",{className:"hc-savebar__label"},"\u6709 ",a.length," \u9879\u672A\u4FDD\u5B58\u7684\u4FEE\u6539"),r.createElement("div",{className:"hc-savebar__actions"},r.createElement(C,{size:"sm",variant:"plain",onClick:s},"\u653E\u5F03"),r.createElement(C,{size:"sm",variant:"primary",onClick:c},"\u4FDD\u5B58"))))}function qe(e,t){let n={};for(let o of t)n[o]=cn(e[o]);return n}function Er({def:e,value:t,onChange:n}){let o=r.createElement("div",{className:"hc-cell__main"},r.createElement("div",{className:"hc-cell__label"},e.label),e.description&&r.createElement("div",{className:"hc-cell__desc"},e.description));switch(e.type){case"boolean":return r.createElement("div",{className:"hc-cell hc-cell--row"},o,r.createElement(z,{checked:t===!0,onChange:i=>n(i),disabled:e.disabled?.(),"aria-label":e.label}));case"number":return r.createElement("div",{className:"hc-cell hc-cell--row"},o,r.createElement(rn,{value:typeof t=="number"?t:e.default,onChange:i=>n(i),min:e.min,max:e.max,step:e.step}));case"select":return r.createElement("div",{className:"hc-cell hc-cell--row"},o,r.createElement(on,{value:typeof t=="string"?t:e.default,onChange:i=>n(i),options:e.options}));case"string":return r.createElement("div",{className:"hc-cell"},r.createElement("div",{className:"hc-cell--row"},o),r.createElement("div",{className:"hc-cell__control"},r.createElement(oe,{value:typeof t=="string"?t:"",onChange:i=>n(i),placeholder:e.placeholder,maxLength:e.maxLength})));case"string-list":return r.createElement("div",{className:"hc-cell"},o,r.createElement("div",{className:"hc-cell__control"},r.createElement(an,{value:Array.isArray(t)?t:[],onChange:i=>n(i),itemPlaceholder:e.itemPlaceholder})));case"custom":{let i=e.component;return r.createElement("div",{className:"hc-cell"},o,r.createElement("div",{className:"hc-cell__control"},r.createElement(i,{value:t,onChange:n})))}default:return null}}var Se={utility:{label:"\u5B9E\u7528\u5DE5\u5177",color:"var(--hc-accent)",Icon:Y},chat:{label:"\u804A\u5929",color:"var(--hc-green)",Icon:Vt},voice:{label:"\u8BED\u97F3",color:"var(--hc-indigo)",Icon:qt},appearance:{label:"\u5916\u89C2",color:"var(--hc-pink)",Icon:Yt},privacy:{label:"\u9690\u79C1",color:"var(--hc-teal)",Icon:Ut},developer:{label:"\u5F00\u53D1\u8005",color:"var(--hc-orange)",Icon:Wt},misc:{label:"\u5176\u4ED6",color:"var(--hc-fill-primary)",Icon:Jt}},dn=["utility","chat","voice","appearance","privacy","developer","misc"];function un(){let e=xe().filter(l=>!l.hidden),[t,n]=g(null),[o,i]=g(""),a=t?e.find(l=>l.id===t):void 0;if(a)return r.createElement(Nr,{view:a,onBack:()=>n(null)});let c=o.trim().toLowerCase(),s=c?e.filter(l=>l.name.toLowerCase().includes(c)||l.description.toLowerCase().includes(c)):e;return r.createElement("div",null,r.createElement("div",{className:"hc-toolbar"},r.createElement("div",{className:"hc-search"},r.createElement(Ke,{size:20}),r.createElement("input",{value:o,onChange:l=>i(l.currentTarget.value),placeholder:"\u641C\u7D22\u63D2\u4EF6","aria-label":"\u641C\u7D22\u63D2\u4EF6"}))),s.length===0?r.createElement(N,{icon:r.createElement(Ke,{size:48}),title:"\u6CA1\u6709\u5339\u914D\u7684\u63D2\u4EF6",subtitle:"\u6362\u4E2A\u5173\u952E\u8BCD\u518D\u8BD5\u8BD5\u3002"}):dn.map(l=>{let d=s.filter(p=>p.category===l);if(d.length===0)return null;let h=Se[l];return r.createElement("div",{className:"hc-section",key:l},r.createElement("div",{className:"hc-section__title"},h.label),r.createElement("div",{className:"hc-section__body"},d.map(p=>r.createElement(Ir,{key:p.id,view:p,onOpen:()=>n(p.id)}))))}))}function Ir({view:e,onOpen:t}){let n=Se[e.category],o=n.Icon,i=e.hasSettings||e.hasPage;return r.createElement(tn,{icon:r.createElement(o,{size:18}),iconBackground:n.color,title:e.name,subtitle:e.description,onClick:i?t:void 0,showChevron:i,accessory:r.createElement(r.Fragment,null,e.needsRestart&&r.createElement(F,{tone:"orange"},r.createElement(re,{size:12})," \u5F85\u91CD\u542F"),e.state==="errored"&&r.createElement(F,{tone:"red"},r.createElement(W,{size:12})," \u51FA\u9519"),r.createElement("span",{onClick:a=>a.stopPropagation(),onKeyDown:a=>a.stopPropagation()},r.createElement(z,{checked:e.enabled,disabled:e.required,onChange:()=>w.toggle(e.id),"aria-label":`\u542F\u7528 ${e.name}`})))})}function Nr({view:e,onBack:t}){let n=w.getPlugin(e.id),o=Se[e.category],i=o.Icon,a=!!(n?.settings&&Object.values(n.settings.schema).some(d=>!d.hidden)),c=!!n?.page&&a,[s,l]=g("page");return r.createElement("div",null,r.createElement("button",{type:"button",className:"hc-back",onClick:t},r.createElement(Qt,{size:20}),"\u63D2\u4EF6"),r.createElement("div",{className:"hc-detail-head"},r.createElement("div",{className:"hc-detail-head__icon",style:{background:o.color}},r.createElement(i,{size:26})),r.createElement("div",{className:"hc-detail-head__text"},r.createElement("div",{className:"hc-detail-head__name"},e.name),r.createElement("div",{className:"hc-detail-head__desc"},e.description),r.createElement("div",{className:"hc-detail-head__meta"},e.authors.map(d=>d.name).join("\u3001"))),r.createElement("span",{onClick:d=>d.stopPropagation(),onKeyDown:d=>d.stopPropagation()},r.createElement(z,{checked:e.enabled,disabled:e.required,onChange:()=>w.toggle(e.id),"aria-label":`\u542F\u7528 ${e.name}`}))),e.needsRestart&&r.createElement("div",{className:"hc-inline-note"},r.createElement(re,{size:18}),r.createElement("span",null,"\u8FD9\u4E2A\u63D2\u4EF6\u5305\u542B\u52A0\u8F7D\u671F\u8865\u4E01\uFF0C\u9700\u8981\u91CD\u542F Discord \u624D\u80FD\u5B8C\u5168\u751F\u6548\u3002")),e.state==="errored"&&r.createElement("div",{className:"hc-inline-note hc-inline-note--danger"},r.createElement(W,{size:18}),r.createElement("span",null,"\u63D2\u4EF6\u542F\u52A8\u65F6\u629B\u51FA\u5F02\u5E38\uFF0C\u5DF2\u88AB\u81EA\u52A8\u505C\u7528\uFF0C\u8BE6\u60C5\u89C1\u65E5\u5FD7\u3002")),c&&r.createElement("div",{className:"hc-segment"},r.createElement("button",{type:"button",className:"hc-segment__item","data-active":s==="page",onClick:()=>l("page")},n.page.title||"\u8BB0\u5F55"),r.createElement("button",{type:"button",className:"hc-segment__item","data-active":s==="settings",onClick:()=>l("settings")},"\u8BBE\u7F6E")),n?.page&&(!c||s==="page")?r.createElement(n.page.component,null):n?.settings?r.createElement(ln,{settings:n.settings}):r.createElement(N,{title:"\u6CA1\u6709\u53EF\u914D\u7F6E\u9879",subtitle:"\u8FD9\u4E2A\u63D2\u4EF6\u5F00\u7BB1\u5373\u7528\uFF0C\u65E0\u9700\u8BBE\u7F6E\u3002"}))}var hn=500,Ye=100;function pn(){let[e,t]=g(()=>Ae().slice()),[n,o]=g(0),i=ee(null);v(()=>(t(Ae().slice()),bt(d=>{t(h=>{let p=h.concat(d);return p.length>hn?p.slice(p.length-hn):p})})),[]);let a=Math.max(1,Math.ceil(e.length/Ye)),c=Math.min(n,a-1),s=e.length-c*Ye,l=e.slice(Math.max(0,s-Ye),s);return v(()=>{if(c!==0)return;let d=i.current;d&&(d.scrollTop=d.scrollHeight)},[e,c]),e.length===0?r.createElement(N,{icon:r.createElement(J,{size:48}),title:"\u6682\u65E0\u65E5\u5FD7",subtitle:"\u8FD0\u884C\u65F6\u548C\u63D2\u4EF6\u7684\u8F93\u51FA\u4F1A\u5B9E\u65F6\u51FA\u73B0\u5728\u8FD9\u91CC\u3002"}):r.createElement("div",{className:"hc-stack"},r.createElement("div",{className:"hc-logs",ref:i},l.map((d,h)=>r.createElement("div",{className:"hc-logline","data-level":d.level,key:`${d.time}-${h}`},r.createElement("span",{className:"hc-logline__time"},Cr(d.time)),r.createElement("span",{className:"hc-logline__scope"},d.scope),r.createElement("span",{className:"hc-logline__msg"},d.parts.map(Pr).join(" "))))),a>1&&r.createElement("div",{className:"hc-pager"},r.createElement("button",{type:"button",className:"hc-tab",disabled:c>=a-1,onClick:()=>o(Math.min(a-1,c+1))},"\u2190 \u66F4\u65E9"),r.createElement("span",{className:"hc-pager__label"},c===0?"\u5B9E\u65F6":`\u7B2C ${a-c} / ${a} \u9875`),r.createElement("button",{type:"button",className:"hc-tab",disabled:c===0,onClick:()=>o(Math.max(0,c-1))},"\u66F4\u65B0 \u2192")))}function Cr(e){let t=new Date(e);return`${t.toLocaleTimeString(void 0,{hour12:!1})}.${String(t.getMilliseconds()).padStart(3,"0")}`}function Pr(e){if(typeof e=="string")return e;if(e instanceof Error)return e.stack??e.message;try{return JSON.stringify(e)}catch{return String(e)}}function We({title:e,note:t,children:n}){return r.createElement("div",{className:"hc-section"},e&&r.createElement("div",{className:"hc-section__title"},e),r.createElement("div",{className:"hc-section__body"},n),t&&r.createElement("div",{className:"hc-section__note"},t))}function gn(){let e=xe().filter(o=>!o.hidden),t=e.filter(o=>o.enabled).length;return r.createElement("div",{className:"hc-stack"},r.createElement("div",{className:"hc-about-hero"},r.createElement(ye,{size:32}),r.createElement("div",null,r.createElement("div",{className:"hc-about-hero__name"},"Halcyon"),r.createElement("div",{className:"hc-about-hero__ver"},"\u7248\u672C ","0.1.7"))),r.createElement(We,{title:"\u6982\u89C8"},r.createElement(_e,{label:"\u63D2\u4EF6\u603B\u6570",value:String(e.length)}),r.createElement(_e,{label:"\u5DF2\u542F\u7528",value:String(t)})),r.createElement(We,{title:"\u9879\u76EE",note:"\u4FEE\u6539 Discord \u5BA2\u6237\u7AEF\u8FDD\u53CD\u5176\u670D\u52A1\u6761\u6B3E\uFF0C\u7531\u6B64\u4EA7\u751F\u7684\u4EFB\u4F55\u540E\u679C\u7531\u4F7F\u7528\u8005\u81EA\u884C\u627F\u62C5\u3002\u672C\u9879\u76EE\u4EC5\u4F9B\u6280\u672F\u7814\u7A76\u4E0E\u4E2A\u4EBA\u4F7F\u7528\u3002"},r.createElement(_e,{label:"\u4F5C\u8005",value:"caitemm (mzrodyu)"}),r.createElement(_e,{label:"\u8BB8\u53EF\u534F\u8BAE",value:"GPL-3.0-or-later"})))}function _e({label:e,value:t}){return r.createElement("div",{className:"hc-cell hc-cell--row"},r.createElement("div",{className:"hc-cell__main"},r.createElement("div",{className:"hc-cell__label"},e)),r.createElement("span",{className:"hc-about__value"},t))}var Je=[{id:"plugins",label:"\u63D2\u4EF6",title:"\u63D2\u4EF6",Icon:Y},{id:"logs",label:"\u65E5\u5FD7",title:"\u65E5\u5FD7",Icon:J},{id:"about",label:"\u5173\u4E8E",title:"\u5173\u4E8E Halcyon",Icon:ve}];function fn(e){switch(e){case"plugins":return r.createElement(un,null);case"logs":return r.createElement(pn,null);case"about":return r.createElement(gn,null)}}function mn({onClose:e}){let[t,n]=g("plugins"),o=Je.find(i=>i.id===t)??Je[0];return r.createElement("div",{className:"halcyon hc-panel"},r.createElement("nav",{className:"hc-panel__sidebar"},r.createElement("div",{className:"hc-panel__brand"},r.createElement(ye,{size:24}),r.createElement("span",{className:"hc-panel__brand-name"},"Halcyon")),Je.map(i=>r.createElement("button",{key:i.id,type:"button",className:"hc-navitem","data-active":i.id===t,onClick:()=>n(i.id)},r.createElement(i.Icon,{size:18}),i.label))),r.createElement("section",{className:"hc-panel__content"},r.createElement("header",{className:"hc-panel__header"},r.createElement("span",{className:"hc-title2"},o.title),e&&r.createElement("button",{type:"button",className:"hc-iconbtn",onClick:e,"aria-label":"\u5173\u95ED"},r.createElement(Kt,{size:20}))),r.createElement("div",{className:"hc-panel__scroll"},fn(t))))}function ke({tab:e}){return r.createElement("div",{className:"halcyon hc-embed"},fn(e))}var Mr=f("settings"),M=null,ie=null;function we(){if(q(),!M){M=document.createElement("div"),M.className="halcyon",document.body.appendChild(M),ie=e=>{e.key==="Escape"&&U()},document.addEventListener("keydown",ie);try{R.render(r.createElement(Tr,{onClose:U}),M)}catch(e){Mr.error("could not open settings overlay",e),U()}}}function U(){if(ie&&(document.removeEventListener("keydown",ie),ie=null),M){try{R.unmountComponentAtNode(M)}catch{}M.remove(),M=null}}function Tr({onClose:e}){return r.createElement("div",{className:"hc-overlay",role:"dialog","aria-modal":"true","aria-label":"Halcyon \u8BBE\u7F6E",onMouseDown:t=>{t.target===t.currentTarget&&e()}},r.createElement(mn,{onClose:e}))}var T=f("settings-host");function bn(){return r.createElement(ke,{tab:"plugins"})}function vn(){return r.createElement(ke,{tab:"logs"})}function xn(){return r.createElement(ke,{tab:"about"})}function Lr(e){return function(){return r.createElement(e,{size:20})}}var yn="halcyon-section",Ar=[{key:"halcyon-plugins",title:"\u63D2\u4EF6",Component:bn,Icon:Y},{key:"halcyon-logs",title:"\u65E5\u5FD7",Component:vn,Icon:J},{key:"halcyon-about",title:"\u5173\u4E8E",Component:xn,Icon:ve}],Ie=!1,Dr=!0,Xe={SECTION:1,SIDEBAR_ITEM:2,PANEL:3,CATEGORY:5,CUSTOM:20},Ee=null;function $r(){if(Ee)return Ee;try{let e=Nt("SECTION","SIDEBAR_ITEM","PANEL","CUSTOM");if(e&&typeof e.SECTION=="number")return Ee={SECTION:e.SECTION,SIDEBAR_ITEM:e.SIDEBAR_ITEM,PANEL:e.PANEL,CATEGORY:typeof e.CATEGORY=="number"?e.CATEGORY:Xe.CATEGORY,CUSTOM:e.CUSTOM},Ee}catch(e){T.warn("could not resolve settings layout types; using fallback values",e)}return Xe}function B(e){try{if(e&&typeof e.buildLayout=="function"){let t=e.buildLayout();if(Array.isArray(t))return t}}catch{}return[]}function Sn(e){let t={...Xe};try{let n=Array.isArray(e)?e[0]:void 0;n&&typeof n.type=="number"&&(t.SECTION=n.type);for(let o of e)for(let i of B(o))if(typeof i?.type=="number"){t.SIDEBAR_ITEM=i.type;for(let a of B(i))if(typeof a?.type=="number"){t.PANEL=a.type;for(let c of B(a))if(typeof c?.type=="number"){t.CATEGORY=c.type;for(let s of B(c))if(s&&typeof s.type=="number"&&"Component"in s)return t.CUSTOM=s.type,t}}}}catch(n){T.warn("could not read layout types from the live tree; using fallbacks",n)}return t}function Or(e,t){let n={key:`${t.key}-panel`,type:e.PANEL,useTitle:()=>t.title,buildLayout:()=>[{key:`${t.key}-category`,type:e.CATEGORY,buildLayout:()=>[{key:`${t.key}-custom`,type:e.CUSTOM,Component:t.Component,useSearchTerms:()=>[t.title]}]}]};return{key:t.key,type:e.SIDEBAR_ITEM,useTitle:()=>t.title,icon:Lr(t.Icon),buildLayout:()=>[n]}}function ae(e){let t={};if(e&&typeof e=="object")for(let n of Object.keys(e)){let o=e[n];typeof o=="function"&&(t[n]=String(o).replace(/\s+/g," ").slice(0,400))}return t}function _n(e,t){if(!e||typeof e!="object")return{raw:typeof e};let n={key:e.key,type:e.type,fields:Object.keys(e)};if(t>0&&typeof e.buildLayout=="function")try{let o=e.buildLayout();Array.isArray(o)&&(n.children=o.slice(0,6).map(i=>_n(i,t-1)))}catch(o){n.childrenError=String(o)}return n}function zr(e){if(!Ie){Ie=!0;try{let t=e[0],n=B(t)[0],o=B(n)[0],i=B(o)[0],a=B(i)[0],c={resolvedTypesFromEnum:$r(),resolvedTypesFromLive:Sn(e),topLevelCount:e.length,sampleSources:{section:ae(t),sidebarItem:ae(n),panel:ae(o),category:ae(i),leaf:ae(a)},layout:e.slice(0,12).map(s=>_n(s,2))};globalThis.__halcyonLayoutProbe=JSON.stringify(c,null,2),T.info("[embed-probe] captured Discord's settings layout shape. In the console run  copy(__halcyonLayoutProbe)  and paste the result back.")}catch(t){T.warn("[embed-probe] failed to capture layout shape",t)}}}function Br(){return[{section:"HEADER",label:"HALCYON"},{section:"halcyon-plugins",label:"\u63D2\u4EF6",element:bn},{section:"halcyon-logs",label:"\u65E5\u5FD7",element:vn},{section:"halcyon-about",label:"\u5173\u4E8E",element:xn}]}var se=null,kn=O({id:"halcyon-settings",name:"Halcyon \u8BBE\u7F6E",description:"Halcyon \u81EA\u8EAB\u7684\u8BBE\u7F6E\u754C\u9762\u5BBF\u4E3B\u3002",authors:[{name:"caitemm"}],category:"misc",required:!0,hidden:!0,patches:[{label:"user-settings-layout",find:".buildLayout().map",replacement:{match:/([A-Za-z_$][\w$]*)\.buildLayout\(\)(?=\.map)/,replace:"$self.buildLayout($1)"}},{label:"user-settings-sidebar",find:"getPredicateSections",replacement:{match:/getPredicateSections\(\)(\{(?:[^{}]|\{(?:[^{}]|\{[^{}]*\})*\})*\})/,replace:(e,t)=>`getPredicateSections(){return $self.injectSections((()=>${t})())}`}}],buildLayout(e){let t=e.buildLayout();try{if(!e||e.key!=="$Root"||!Array.isArray(t)||(zr(t),!Dr)||t.some(a=>a?.key===yn))return t;let n=Sn(t),o={key:yn,type:n.SECTION,useTitle:()=>"HALCYON",buildLayout:()=>Ar.map(a=>Or(n,a))},i=t.findIndex(a=>a?.key==="billing_section");return i<0&&(i=t.findIndex(a=>a?.key==="user_section")),i<0&&(i=Math.min(2,t.length)),t.splice(i,0,o),T.info(`native settings embed active \u2014 section inserted at index ${i}/${t.length}`),t}catch(n){return T.error("failed to inject settings section into layout",n),t}},injectSections(e){try{if(!Array.isArray(e)||e.some(i=>i?.section==="halcyon-plugins"))return e;let t=Br(),n=e.slice(),o=n.findIndex(i=>i&&i.section==="DIVIDER");return o>=0?n.splice(o+1,0,...t):n.push({section:"DIVIDER"},...t),Ie||(Ie=!0,T.info(`native settings embed active (legacy) \u2014 ${e.length} base sections`)),n}catch(t){return T.error("failed to inject settings sections",t),e}},start(){q(),se=e=>{(e.ctrlKey||e.metaKey)&&e.shiftKey&&e.code==="KeyH"&&(e.preventDefault(),we())},window.addEventListener("keydown",se),T.info("settings host ready \u2014 open with Ctrl/Cmd+Shift+H")},stop(){se&&(window.removeEventListener("keydown",se),se=null),U()}});var ce=f("patcher"),Ne=Symbol("halcyon.patch");function Gr(e,t){let n=e[t];if(n&&n[Ne])return n[Ne];if(typeof n!="function")throw new TypeError(`cannot patch "${t}": not a function`);let o={before:new Set,instead:new Set,after:new Set,original:n},i=function(...a){let c={args:a,result:void 0,self:this,callOriginal:()=>o.original.apply(this,c.args)};for(let s of o.before)try{s(c)}catch(l){ce.error(`before-hook on "${t}" threw`,l)}if(o.instead.size){let s,l=!1;for(let d of o.instead)try{s=d(c),l=!0}catch(h){ce.error(`instead-hook on "${t}" threw; falling back to original`,h),s=c.callOriginal(),l=!0}c.result=l?s:c.callOriginal()}else try{c.result=o.original.apply(this,c.args)}catch(s){throw s}for(let s of o.after)try{s(c)}catch(l){ce.error(`after-hook on "${t}" threw`,l)}return c.result};return Object.defineProperty(i,"name",{value:n.name,configurable:!0}),Object.defineProperty(i,"length",{value:n.length,configurable:!0}),i.toString=()=>o.original.toString(),i[Ne]=o,Object.assign(i,n),e[t]=i,o}function jr(e,t,n){n.before.size||n.instead.size||n.after.size||e[t]&&e[t][Ne]===n&&(e[t]=n.original)}function Ze(e,t,n,o){if(t==null)return ce.error(`refusing to patch "${n}" on a null target`),()=>{};let i;try{i=Gr(t,n)}catch(c){return ce.error(c),()=>{}}i[e].add(o);let a=!0;return()=>{a&&(a=!1,i[e].delete(o),jr(t,n,i))}}var wn={before(e,t,n){return Ze("before",e,t,n)},after(e,t,n){return Ze("after",e,t,n)},instead(e,t,n){return Ze("instead",e,t,n)}};var $a=E(j);function En(){try{let e=Qe?._dispatcher;if(j(e))return e}catch{}return I(j)}var In=E(e=>typeof e?.getMessage=="function"&&typeof e?.getMessages=="function"),Oa=E(e=>typeof e?.editMessage=="function"&&typeof e?.deleteMessage=="function"),Qe=E(e=>typeof e?.getCurrentUser=="function"&&typeof e?.getUser=="function"),Nn=E(e=>e?.getName?.()==="ChannelStore"||e?.constructor?.displayName==="ChannelStore"),za=E(e=>typeof e?.getChannelId=="function"&&typeof e?.getLastSelectedChannelId=="function"),Ce=E(e=>e?.getName?.()==="GuildStore"||e?.constructor?.displayName==="GuildStore"),Cn=E(e=>typeof e?.getChannels=="function"&&typeof e?.getDefaultChannel=="function"),Re=E(e=>typeof e?.subscribeToGuild=="function"||typeof e?.subscribeToChannel=="function"),Ba=E(e=>typeof e=="function"&&typeof e?.locale=="function"&&typeof e?.utc=="function");var Pn=f("settings");function et(e){return e===null||typeof e!="object"?e:JSON.parse(JSON.stringify(e))}function X(e){let t=new Map,n=null,o={};for(let s of Object.keys(e))o[s]=et(e[s].default);let i=()=>{n&&K(n,o)},a=(s,l,d)=>{let h=t.get(s);if(h)for(let p of h)try{p(l,d)}catch(_){Pn.error(`settings listener for "${s}" threw`,_)}},c=new Proxy(o,{get:(s,l)=>s[l],set:(s,l,d)=>{if(!(l in e))return Pn.warn(`ignoring write to unknown setting "${l}"`),!0;let h=s[l];return Object.is(h,d)||(s[l]=d,i(),a(l,d,h)),!0}});return{schema:e,store:c,subscribe(s,l){let d=s,h=t.get(d);return h||(h=new Set,t.set(d,h)),h.add(l),()=>void h.delete(l)},reset(s){if(s!=null){c[s]=et(e[s].default);return}for(let l of Object.keys(e))c[l]=et(e[l].default)},__bind(s){n=s;let l=H(s);for(let d of Object.keys(e))Object.prototype.hasOwnProperty.call(l,d)&&(o[d]=l[d])}}}var x=X({keepDeletedInChat:{group:"\u8BB0\u5F55",type:"boolean",default:!0,label:"\u5728\u804A\u5929\u4E2D\u4FDD\u7559\u88AB\u5220\u6D88\u606F",description:"\u88AB\u5220\u9664\u7684\u6D88\u606F\u4E0D\u518D\u6D88\u5931\uFF0C\u800C\u662F\u6807\u8BB0\u4FDD\u7559\u5728\u539F\u4F4D\u3002\u9700\u8981\u5BA2\u6237\u7AEF\u8865\u4E01\u751F\u6548\u3002"},logEdits:{group:"\u8BB0\u5F55",type:"boolean",default:!0,label:"\u8BB0\u5F55\u7F16\u8F91\u5386\u53F2",description:"\u4FDD\u5B58\u6BCF\u6761\u6D88\u606F\u88AB\u7F16\u8F91\u524D\u7684\u5185\u5BB9\u3002"},retention:{group:"\u8BB0\u5F55",type:"number",default:50,label:"\u6BCF\u9891\u9053\u4FDD\u7559\u6761\u6570",description:"0 \u8868\u793A\u4E0D\u9650\u5236\u3002\u4E0A\u9650 500\u3002",min:0,max:500,step:10},deleteStyle:{group:"\u5916\u89C2",type:"select",default:"tint",label:"\u5220\u9664 / \u7F16\u8F91\u6837\u5F0F",description:"\u88AB\u5220\u6D88\u606F\u3001\u4EE5\u53CA\u7F16\u8F91\u6D88\u606F\u4E0A\u65B9\u65E7\u7248\u672C\u5185\u5BB9\u5728\u804A\u5929\u4E2D\u7684\u5448\u73B0\u65B9\u5F0F\u3002",options:[{value:"tint",label:"\u7EA2\u8272\u5E95\u7EB9 + \u5DE6\u4FA7\u7EA2\u6761"},{value:"text",label:"\u6B63\u6587\u53D8\u7EA2"},{value:"ghost",label:"\u534A\u900F\u660E\u6DE1\u51FA"},{value:"strike",label:"\u7EA2\u8272\u5220\u9664\u7EBF"}]},showDeletedMarker:{group:"\u5916\u89C2",type:"boolean",default:!0,label:"\u663E\u793A\u5220\u9664\u6807\u8BB0\u884C",description:"\u5728\u88AB\u5220\u6D88\u606F\u4E0B\u65B9\u663E\u793A\u201C\u6B64\u6D88\u606F\u5DF2\u5220\u9664\u201D\u4E0E\u5220\u9664\u65F6\u95F4\u3002"},markerIcon:{group:"\u5916\u89C2",type:"select",default:"trash",label:"\u6807\u8BB0\u56FE\u6807",description:"\u5220\u9664\u6807\u8BB0\u884C\u524D\u7684\u56FE\u6807\u3002",options:[{value:"trash",label:"\u{1F5D1} \u5783\u573E\u6876"},{value:"shield",label:"\u{1F6E1} \u76FE\u724C"},{value:"warning",label:"\u26A0 \u8B66\u544A\u4E09\u89D2"},{value:"none",label:"\u65E0\u56FE\u6807"}]},markerLook:{group:"\u5916\u89C2",type:"select",default:"plain",label:"\u6807\u8BB0\u5916\u89C2",description:"\u5220\u9664\u6807\u8BB0\u884C\u7684\u5448\u73B0\u65B9\u5F0F\u3002",options:[{value:"plain",label:"\u7EAF\u6587\u5B57"},{value:"badge",label:"\u5706\u89D2\u5FBD\u7AE0"},{value:"quote",label:"\u5F15\u7528\u5757\uFF08\u5DE6\u4FA7\u7AD6\u6761\uFF09"}]},markerTime:{group:"\u5916\u89C2",type:"select",default:"time",label:"\u5220\u9664\u65F6\u95F4\u683C\u5F0F",description:"\u6807\u8BB0\u884C\u91CC\u65F6\u95F4\u7684\u663E\u793A\u65B9\u5F0F\u3002",options:[{value:"time",label:"\u4EC5\u65F6\u95F4\uFF0803:19:42\uFF09"},{value:"datetime",label:"\u65E5\u671F + \u65F6\u95F4"},{value:"none",label:"\u4E0D\u663E\u793A\u65F6\u95F4"}]},ignoreBots:{group:"\u5C4F\u853D\u5BF9\u8C61",type:"boolean",default:!1,label:"\u5C4F\u853D\u673A\u5668\u4EBA",description:"\u673A\u5668\u4EBA\u7684\u6D88\u606F\u4E0D\u8BB0\u5F55\u3001\u4E0D\u5728\u804A\u5929\u4E2D\u4FDD\u7559\u3002"},ignoreSelf:{group:"\u5C4F\u853D\u5BF9\u8C61",type:"boolean",default:!1,label:"\u5C4F\u853D\u81EA\u5DF1",description:"\u4F60\u81EA\u5DF1\u5220\u9664\u6216\u7F16\u8F91\u7684\u6D88\u606F\u4E0D\u8BB0\u5F55\u3001\u4E0D\u5728\u804A\u5929\u4E2D\u4FDD\u7559\u3002"},ignoredUsers:{group:"\u5C4F\u853D\u5BF9\u8C61",type:"string-list",default:[],label:"\u5C4F\u853D\u7684\u7528\u6237",description:"\u8FD9\u4E9B\u7528\u6237\u7684\u6D88\u606F\u4E0D\u8BB0\u5F55\u3001\u4E0D\u5728\u804A\u5929\u4E2D\u4FDD\u7559\u3002",itemPlaceholder:"\u7528\u6237 ID"},ignoredChannels:{group:"\u5C4F\u853D\u5BF9\u8C61",type:"string-list",default:[],label:"\u5C4F\u853D\u7684\u9891\u9053",description:"\u8FD9\u4E9B\u9891\u9053\u91CC\u7684\u6D88\u606F\u4E0D\u8BB0\u5F55\u3001\u4E0D\u5728\u804A\u5929\u4E2D\u4FDD\u7559\u3002",itemPlaceholder:"\u9891\u9053 ID"}});var Hr=f("message-logger"),Mn="message-logger.log",tt=class{deleted=[];edited=[];retention=50;listeners=new Set;saveTimer;deletedIndex=new Set;load(){let t=H(Mn);this.deleted=Array.isArray(t.deleted)?t.deleted:[],this.edited=Array.isArray(t.edited)?t.edited:[],this.trimDeleted(),this.reindex()}isDeleted(t,n){return this.deletedIndex.has(`${t}:${n}`)}findDeleted(t,n){if(this.isDeleted(t,n))return this.deleted.find(o=>o.channelId===t&&o.id===n)}setRetention(t){this.retention=Math.max(0,t|0),this.trimDeleted(),this.reindex(),this.scheduleSave(),this.emit()}recordDeleted(t){this.deleted.some(n=>n.id===t.id)||(this.deleted.unshift(t),this.trimDeleted(),this.reindex(),this.scheduleSave(),this.emit())}recordEdit(t,n,o,i,a){let c=Date.now(),s=this.edited.find(l=>l.id===t);if(!s)s={id:t,channelId:n,guildId:a,author:o,history:[{content:i,at:c}],updatedAt:c},this.edited.unshift(s);else{if(s.history[s.history.length-1]?.content===i)return;s.history.push({content:i,at:c}),s.updatedAt=c}this.edited.length>300&&(this.edited.length=300),this.scheduleSave(),this.emit()}getDeleted(){return this.deleted}getEdited(){return this.edited}counts(){return{deleted:this.deleted.length,edited:this.edited.length}}clear(){this.deleted=[],this.edited=[],this.reindex(),this.scheduleSave(),this.emit()}toJSON(){return JSON.stringify({deleted:this.deleted,edited:this.edited},null,2)}subscribe(t){return this.listeners.add(t),()=>void this.listeners.delete(t)}flush(){this.saveTimer!==void 0&&(clearTimeout(this.saveTimer),this.saveTimer=void 0),this.save()}trimDeleted(){if(this.retention<=0)return;let t=new Map;this.deleted=this.deleted.filter(n=>{let o=t.get(n.channelId)??0;return o>=this.retention?!1:(t.set(n.channelId,o+1),!0)})}reindex(){this.deletedIndex=new Set(this.deleted.map(t=>`${t.channelId}:${t.id}`))}emit(){for(let t of this.listeners)try{t()}catch{}}scheduleSave(){this.saveTimer!==void 0&&clearTimeout(this.saveTimer),this.saveTimer=setTimeout(()=>this.save(),500)}save(){try{K(Mn,{deleted:this.deleted,edited:this.edited})}catch(t){Hr.error("failed to persist message log",t)}}},b=new tt;var nt=/<(a)?:([A-Za-z0-9_]+):(\d+)>/g;function le(e){let t=[],n=0,o=0;nt.lastIndex=0;for(let i=nt.exec(e);i;i=nt.exec(e)){i.index>n&&t.push(r.createElement("span",{key:o++},e.slice(n,i.index)));let[,a,c,s]=i;t.push(r.createElement("img",{key:o++,className:"hc-emoji",src:`https://cdn.discordapp.com/emojis/${s}.${a?"gif":"webp"}`,alt:`:${c}:`,title:`:${c}:`,draggable:!1,loading:"lazy"})),n=i.index+i[0].length}return t.length===0?e:(n<e.length&&t.push(r.createElement("span",{key:o++},e.slice(n))),t)}var Fr=f("message-logger");function Ur(){let[e,t]=g(()=>({deleted:b.getDeleted(),edited:b.getEdited()}));return v(()=>{let n=()=>t({deleted:b.getDeleted(),edited:b.getEdited()});return n(),b.subscribe(n)},[]),e}var rt=25;function Tn(){let{deleted:e,edited:t}=Ur(),[n,o]=g("deleted"),[i,a]=g({deleted:0,edited:0}),c=n==="deleted"?e:t,s=Math.max(1,Math.ceil(c.length/rt)),l=Math.min(i[n],s-1),d=c.slice(l*rt,(l+1)*rt),h=p=>a(_=>({..._,[n]:Math.max(0,Math.min(s-1,p))}));return r.createElement("div",null,r.createElement("div",{className:"hc-tabs"},r.createElement("button",{type:"button",className:"hc-tab","data-active":n==="deleted",onClick:()=>o("deleted")},r.createElement(ne,{size:16})," \u5DF2\u5220\u9664",e.length>0&&r.createElement(F,{tone:"red"},e.length)),r.createElement("button",{type:"button",className:"hc-tab","data-active":n==="edited",onClick:()=>o("edited")},r.createElement(Ve,{size:16})," \u5DF2\u7F16\u8F91",t.length>0&&r.createElement(F,{tone:"orange"},t.length)),r.createElement("div",{className:"hc-tabs__spacer"}),r.createElement(C,{size:"sm",variant:"plain",icon:r.createElement(Xt,{size:16}),onClick:Wr},"\u5BFC\u51FA"),r.createElement(C,{size:"sm",variant:"destructive",onClick:()=>b.clear(),disabled:c.length===0},"\u6E05\u7A7A")),c.length===0?n==="deleted"?r.createElement(N,{icon:r.createElement(ne,{size:48}),title:"\u8FD8\u6CA1\u6709\u8BB0\u5F55",subtitle:"\u88AB\u5220\u9664\u7684\u6D88\u606F\u4F1A\u5728\u8FD9\u91CC\u4FDD\u7559\uFF0C\u542F\u7528\u63D2\u4EF6\u540E\u5373\u65F6\u751F\u6548\u3002"}):r.createElement(N,{icon:r.createElement(Ve,{size:48}),title:"\u8FD8\u6CA1\u6709\u7F16\u8F91\u8BB0\u5F55",subtitle:"\u6D88\u606F\u88AB\u7F16\u8F91\u524D\u7684\u5185\u5BB9\u4F1A\u4FDD\u7559\u5728\u8FD9\u91CC\u3002"}):r.createElement(r.Fragment,null,r.createElement("div",{className:"hc-msglist"},n==="deleted"?d.map(p=>r.createElement(Kr,{key:`${p.channelId}-${p.id}`,entry:p})):d.map(p=>r.createElement(qr,{key:`${p.channelId}-${p.id}`,entry:p}))),s>1&&r.createElement(Vr,{page:l,pageCount:s,onChange:h})))}function Vr(e){let{page:t,pageCount:n,onChange:o}=e;return r.createElement("div",{className:"hc-pager"},r.createElement(C,{size:"sm",variant:"plain",onClick:()=>o(t-1),disabled:t===0},"\u4E0A\u4E00\u9875"),r.createElement("span",{className:"hc-pager__label"},"\u7B2C ",t+1," / ",n," \u9875"),r.createElement(C,{size:"sm",variant:"plain",onClick:()=>o(t+1),disabled:t>=n-1},"\u4E0B\u4E00\u9875"))}function Kr({entry:e}){return r.createElement("div",{className:"hc-msg"},r.createElement("div",{className:"hc-msg__head"},r.createElement("span",{className:"hc-msg__author"},e.author.name),e.author.bot&&r.createElement(F,{tone:"neutral"},"BOT"),r.createElement(Ln,{channelId:e.channelId,guildId:e.guildId}),r.createElement("span",{className:"hc-msg__time"},An(e.deletedAt))),r.createElement("div",{className:"hc-msg__body"},e.content?le(e.content):e.stickers?.length?r.createElement("span",null,"\u{1F3F7}\uFE0F \u8D34\u7EB8\uFF1A",e.stickers.map(t=>t.name).join("\u3001")):e.attachmentsRich?.length||e.embeds?.length?r.createElement("span",null,"\u{1F5BC}\uFE0F \u5A92\u4F53\u6D88\u606F"):r.createElement("span",{className:"hc-msg__empty"},"\uFF08\u65E0\u6587\u672C\u5185\u5BB9\uFF09")),(e.attachmentsRich?.length??0)>0&&r.createElement("div",{className:"hc-msg__media"},e.attachmentsRich.map((t,n)=>(t.content_type??"").startsWith("image/")||(t.content_type??"").startsWith("video/")?r.createElement("img",{key:n,className:"hc-msg__thumb",src:t.proxy_url??t.url,alt:t.filename??"\u9644\u4EF6",loading:"lazy"}):r.createElement("a",{key:n,href:t.url,target:"_blank",rel:"noreferrer"},"\u{1F4CE} ",t.filename??"\u9644\u4EF6"))),!e.attachmentsRich?.length&&e.attachments.length>0&&r.createElement("div",{className:"hc-msg__meta"},"\u9644\u4EF6 ",e.attachments.length," \u4E2A"))}function qr({entry:e}){return r.createElement("div",{className:"hc-msg"},r.createElement("div",{className:"hc-msg__head"},r.createElement("span",{className:"hc-msg__author"},e.author.name),r.createElement(Ln,{channelId:e.channelId,guildId:e.guildId}),r.createElement("span",{className:"hc-msg__time"},An(e.updatedAt))),r.createElement("div",{className:"hc-msg__versions"},e.history.map((t,n)=>r.createElement("div",{className:"hc-msg__version",key:n},r.createElement("span",{className:"hc-msg__vtag"},"v",n+1),r.createElement("span",{className:"hc-msg__vbody"},t.content?le(t.content):"\uFF08\u7A7A\uFF09")))))}function Yr(e,t){let n,o=t,i=!1;try{let s=Nn.getChannel?.(e);s&&(s.name&&(n=String(s.name)),o=o??s.guild_id??s.guildId??void 0,i=s.type===1||s.type===3)}catch{}let a;try{if(o){let s=Ce.getGuild?.(o);s?.name&&(a=String(s.name))}}catch{}let c=n?`#${n}`:i?"\u79C1\u4FE1":`#${e}`;return{guild:a,channel:c}}function Ln({channelId:e,guildId:t}){let n=Yr(e,t);return r.createElement("span",{className:"hc-msg__where"},n.guild&&r.createElement("span",{className:"hc-msg__guild"},n.guild),n.guild&&r.createElement("span",{className:"hc-msg__sep"},"\u203A"),r.createElement("span",null,n.channel))}function An(e){let t=new Date(e),n=o=>String(o).padStart(2,"0");return`${n(t.getMonth()+1)}-${n(t.getDate())} ${n(t.getHours())}:${n(t.getMinutes())}`}function Wr(){try{let e=new Blob([b.toJSON()],{type:"application/json"}),t=URL.createObjectURL(e),n=document.createElement("a");n.href=t,n.download=`halcyon-message-log-${Date.now()}.json`,document.body.appendChild(n),n.click(),n.remove(),URL.revokeObjectURL(t)}catch(e){Fr.error("export failed",e)}}var S=f("message-logger"),ot,it,at;function Bn(e){if(typeof e=="number")return e;if(typeof e=="string"){let t=Date.parse(e);return Number.isNaN(t)?Date.now():t}if(e&&typeof e.valueOf=="function"){let t=e.valueOf();if(typeof t=="number")return t}return Date.now()}function Jr(e){return e?.globalName||e?.global_name||e?.username||e?.name||"\u672A\u77E5\u7528\u6237"}function Gn(e){return{id:String(e?.id??"0"),name:Jr(e),bot:!!e?.bot}}function jn(e){let t=e?.attachments;return Array.isArray(t)?t.map(n=>n?.filename||n?.url||"\u9644\u4EF6").slice(0,20):[]}function Hn(e){let t=e?.attachments;return Array.isArray(t)?t.map(n=>({id:n?.id!=null?String(n.id):void 0,filename:n?.filename??n?.fileName??void 0,url:n?.url??void 0,proxy_url:n?.proxy_url??n?.proxyURL??n?.proxyUrl??void 0,content_type:n?.content_type??n?.contentType??void 0,width:typeof n?.width=="number"?n.width:void 0,height:typeof n?.height=="number"?n.height:void 0,size:typeof n?.size=="number"?n.size:void 0})).filter(n=>n.url||n.proxy_url).slice(0,10):[]}function Fn(e){let t=e?.embeds;if(!Array.isArray(t)||t.length===0)return[];try{return JSON.parse(JSON.stringify(t)).slice(0,6)}catch{return[]}}function Un(e){let t=e?.sticker_items??e?.stickerItems??e?.stickers;return Array.isArray(t)?t.filter(n=>n?.id!=null).map(n=>({id:String(n.id),name:String(n.name??"\u8D34\u7EB8"),format_type:typeof n.format_type=="number"?n.format_type:n.formatType})).slice(0,4):[]}function Xr(){try{return Qe.getCurrentUser?.()?.id}catch{return}}function Me(e,t){let n=x.store;return!!(e&&n.ignoredChannels.includes(e)||t?.id&&n.ignoredUsers.includes(t.id)||n.ignoreBots&&t?.bot||n.ignoreSelf&&t?.id&&t.id===Xr())}var G=new Map,Zr=4e3;function st(e,t,n){let o=n?.content;if(!e||!t||typeof o!="string")return;let i=`${e}:${t}`,a=G.get(i);a&&G.delete(i);let c=Un(n),s=Hn(n),l=Fn(n);if(G.set(i,{content:o,author:n?.author??a?.author,attachments:Array.isArray(n?.attachments)?jn(n):a?.attachments,attachmentsRich:s.length?s:a?.attachmentsRich,embeds:l.length?l:a?.embeds,stickers:c.length?c:a?.stickers,sentAt:n?.timestamp!=null?Bn(n.timestamp):a?.sentAt,guildId:n?.guild_id??n?.guildId??a?.guildId}),G.size>Zr){let d=G.keys().next().value;d!==void 0&&G.delete(d)}}function ut(e,t){try{return In.getMessage(e,t)}catch{return}}function Dn(e,t){if(!e||!t)return;let n=ut(e,t),o=G.get(`${e}:${t}`);if(!n&&!o){S.debug(`delete of ${t} skipped: message not in cache or shadow`);return}let i=n?.author??o?.author??{};if(Me(e,i))return;let a=typeof n?.content=="string"&&n.content!==""?n.content:o?.content??"",c=n?jn(n):o?.attachments??[],s=n?Hn(n):[],l=s.length?s:o?.attachmentsRich??[],d=n?Fn(n):[],h=d.length?d:o?.embeds??[],p=n?Un(n):[],_=p.length?p:o?.stickers??[];if(!(!a&&c.length===0&&l.length===0&&h.length===0&&_.length===0)&&(b.recordDeleted({id:String(t),channelId:String(e),guildId:n?.guild_id??n?.guildId??o?.guildId??void 0,author:Gn(i),content:a,attachments:c,attachmentsRich:l.length?l:void 0,embeds:h.length?h:void 0,stickers:_.length?_:void 0,sentAt:n?.timestamp!=null?Bn(n.timestamp):o?.sentAt??Date.now(),deletedAt:Date.now()}),n&&x.store.keepDeletedInChat))try{n.deleted=!0}catch{}}function Qr(e){if(!x.store.logEdits||!e)return;let t=e.channel_id??e.channelId,n=e.id;if(!t||!n||typeof e.content!="string")return;let o=`${t}:${n}`,i=ut(t,n),a=G.get(o),c=a?.content??(typeof i?.content=="string"?i.content:void 0);if(st(t,n,e),c===void 0){S.debug(`edit to ${n} skipped: no prior content known (message predates the recorder)`);return}if(c===e.content)return;let s=i?.author??a?.author??e.author??{};if(Me(t,s))return;let l=e.guild_id??e.guildId??i?.guild_id??a?.guildId;b.recordEdit(String(n),String(t),Gn(s),c,l!=null?String(l):void 0)}function Rr(e){let t=(e.attachmentsRich??[]).map((n,o)=>({id:n.id??`${e.id}${o}`,filename:n.filename??"attachment",url:n.url??n.proxy_url,proxy_url:n.proxy_url??n.url,content_type:n.content_type,width:n.width,height:n.height,size:n.size??0,spoiler:!1}));return{id:e.id,type:0,channel_id:e.channelId,guild_id:e.guildId,sticker_items:e.stickers?.length?e.stickers:void 0,content:e.content||(t.length===0&&e.attachments.length?`\u{1F4CE} ${e.attachments.join(", ")}`:""),author:{id:e.author.id,username:e.author.name,global_name:e.author.name,discriminator:"0000",bot:e.author.bot,avatar:null},timestamp:new Date(e.sentAt).toISOString(),attachments:t,embeds:e.embeds??[],mentions:[],mention_roles:[],mention_everyone:!1,pinned:!1,tts:!1,flags:0}}function Pe(e,t){try{let n=BigInt(e),o=BigInt(t);return n<o?-1:n>o?1:0}catch{return e<t?-1:e>t?1:0}}var $n=new WeakSet;function eo(e){if(!x.store.keepDeletedInChat||$n.has(e))return;$n.add(e);let t=String(e.channelId??e.channel_id??""),n=e.messages;if(!t||!Array.isArray(n))return;let o=b.getDeleted().filter(l=>l.channelId===t);if(!o.length)return;let i=new Set(n.map(l=>String(l?.id))),a;for(let l of n){let d=l?.id!=null?String(l.id):void 0;d&&(a===void 0||Pe(d,a)<0)&&(a=d)}let c=o.filter(l=>!i.has(l.id)&&(a===void 0||Pe(l.id,a)>=0)&&!Me(t,l.author));if(!c.length)return;let s=n.length>=2?Pe(String(n[0].id),String(n[n.length-1].id))>0:!0;n.push(...c.map(Rr)),n.sort((l,d)=>{let h=Pe(String(l?.id??"0"),String(d?.id??"0"));return s?-h:h}),S.info(`revived ${c.length} deleted message(s) into ${t}`)}function to(e){if(!x.store.keepDeletedInChat)return;let t=String(e.channelId??e.channel_id??"");if(t)for(let n of b.getDeleted()){if(n.channelId!==t)continue;let o=ut(t,n.id);if(o&&!o.deleted)try{o.deleted=!0}catch{}}}function no(e,t){try{if(t==="MESSAGE_CREATE"){let n=e.message;st(n?.channel_id??n?.channelId??e.channelId,n?.id,n)}else if(t==="LOAD_MESSAGES_SUCCESS"){let n=e.channelId??e.channel_id;if(Array.isArray(e.messages))for(let o of e.messages)st(o?.channel_id??n,o?.id,o)}}catch{}}var On=!1,ct=0;function lt(e){let t=e?.type;if(typeof t=="string"){if(dt.includes(t)&&ct++,no(e,t),t==="LOAD_MESSAGES_SUCCESS")try{eo(e),setTimeout(()=>to(e),0)}catch(n){S.error("failed to revive deleted messages on channel load",n)}try{if(t==="MESSAGE_DELETE")Dn(e.channelId??e.channel_id,e.id??e.messageId);else if(t==="MESSAGE_DELETE_BULK"){let n=e.channelId??e.channel_id;for(let o of e.ids??[])Dn(n,o)}else if(t==="MESSAGE_UPDATE")Qr(e.message);else return;On||(On=!0,S.info(`recorder saw its first ${t}`))}catch(n){S.error("recorder failed for",t,n)}}}function ro(e){lt(e.args[0])}var dt=["MESSAGE_CREATE","MESSAGE_UPDATE","MESSAGE_DELETE","MESSAGE_DELETE_BULK","LOAD_MESSAGES_SUCCESS"];function oo(e,t){let n=[],o=[];if(typeof e.addInterceptor=="function")try{let i=a=>(lt(a),!1);e.addInterceptor(i),n.push(()=>{let a=e._interceptors;if(Array.isArray(a)){let c=a.indexOf(i);c>=0&&a.splice(c,1)}}),o.push("interceptor")}catch{}for(let i of["dispatch","_dispatch"])if(typeof e[i]=="function"){try{n.push(wn.before(e,i,ro)),o.push(i)}catch{}break}if(typeof e.subscribe=="function")try{let i=a=>lt(a);for(let a of dt)e.subscribe(a,i);n.push(()=>{if(typeof e.unsubscribe=="function")for(let a of dt)try{e.unsubscribe(a,i)}catch{}}),o.push("subscribe")}catch{}return S.info(`recorder on dispatcher ${t}: seams [${o.join(", ")||"none"}]`),()=>n.forEach(i=>i())}function io(){let e=new Set,t=[],n=()=>{let c=[...It(j),En()].filter(Boolean),s=0;for(let l of c)e.has(l)||(e.add(l),t.push(oo(l,`#${e.size}`)),s++);return s},o=n();S.info(`recorder attached to ${o} dispatcher instance(s)`);let i=setInterval(()=>{let c=n();c>0&&S.info(`recorder attached to ${c} late dispatcher instance(s)`)},5e3),a=setTimeout(()=>clearInterval(i),6e4);return()=>{clearInterval(i),clearTimeout(a),t.forEach(c=>c())}}var ao={trash:()=>r.createElement(r.Fragment,null,r.createElement("path",{d:"M4.5 7h15"}),r.createElement("path",{d:"M9.25 7V5.5A1.5 1.5 0 0110.75 4h2.5a1.5 1.5 0 011.5 1.5V7"}),r.createElement("path",{d:"M6.5 7l.85 11.1A2 2 0 009.34 20h5.32a2 2 0 001.99-1.9L17.5 7"})),shield:()=>r.createElement(r.Fragment,null,r.createElement("path",{d:"M12 3.5l7 2.6v5c0 4.4-3 7.3-7 8.9-4-1.6-7-4.5-7-8.9v-5l7-2.6z"}),r.createElement("path",{d:"M9.5 12l1.8 1.8 3.2-3.6"})),warning:()=>r.createElement(r.Fragment,null,r.createElement("path",{d:"M12 4.5L3.5 19h17L12 4.5z"}),r.createElement("path",{d:"M12 10v4"}),r.createElement("path",{d:"M12 16.75h.01"}))};function so(e,t){if(e==null||t==="none")return;let n=new Date(e);if(t==="datetime"){let o=i=>String(i).padStart(2,"0");return`${o(n.getMonth()+1)}-${o(n.getDate())} ${n.toLocaleTimeString("zh-CN",{hour12:!1})}`}return n.toLocaleTimeString("zh-CN",{hour12:!1})}function co(e){let t=x.store,n=ao[t.markerIcon]?.(),o=so(e.deletedAt,t.markerTime);return r.createElement("div",{className:`hc-deleted-marker hc-deleted-marker--${t.markerLook||"plain"}`},n&&r.createElement("svg",{className:"hc-deleted-marker__icon",width:"14",height:"14",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:2,strokeLinecap:"round",strokeLinejoin:"round","aria-hidden":!0},n),r.createElement("span",null,"\u6B64\u6D88\u606F\u5DF2\u5220\u9664",o?`\uFF08${o}\uFF09`:""))}var lo=["logEdits","deleteStyle","showDeletedMarker","markerIcon","markerLook","markerTime"];function uo(){let[,e]=g(0);v(()=>{let t=lo.map(n=>x.subscribe(n,()=>e(o=>o+1)));return()=>t.forEach(n=>n())},[])}function ho(e){uo();let t=x.store,n=[];return t.logEdits&&e.history&&e.history.length>0&&n.push(r.createElement("div",{className:"hc-edit-history",key:"hc-edit-history"},e.history.map((o,i)=>r.createElement("div",{className:`hc-edit-history__version hc-edit-history__version--${t.deleteStyle||"tint"}`,key:i},le(o.content))))),t.showDeletedMarker&&e.isDeleted&&n.push(r.createElement(co,{key:"hc-deleted-marker",deletedAt:e.deletedAt})),n.length?r.createElement(r.Fragment,null,n):null}var Vn=["tint","text","ghost","strike"];function zn(){try{let e=document.documentElement;if(!e)return;for(let t of Vn)e.classList.remove(`hc-mlog-${t}`);e.classList.add(`hc-mlog-${x.store.deleteStyle||"tint"}`)}catch{}}function po(){let e=Q().filter(n=>n.pluginId==="message-logger");if(!e.length)return;let t=e.filter(n=>!n.applied);t.length===0?S.info("in-chat patches applied"):S.warn("some in-chat patches did not match this Discord build; deleted messages are still captured on the plugin page, but will not be kept inline. Unmatched: "+t.map(n=>`"${n.label}"`).join(", "))}var Kn=O({id:"message-logger",name:"\u6D88\u606F\u8BB0\u5F55\u5668",description:"\u4FDD\u7559\u88AB\u5220\u9664\u7684\u6D88\u606F\u4E0E\u7F16\u8F91\u5386\u53F2\uFF0C\u53EF\u6309\u7528\u6237\u6216\u9891\u9053\u5FFD\u7565\uFF0C\u652F\u6301\u5BFC\u51FA\u3002",authors:[{name:"caitemm"}],category:"utility",settings:x,page:{title:"\u6D88\u606F\u8BB0\u5F55",icon:Ft,component:Tn},patches:[{label:"keep deleted message in store",find:'"MessageStore"',replacement:[{match:/(?<=MESSAGE_DELETE:function\(([\w$]+)\)\{)(?=let.{0,100}?([\w$]+(?:\.[\w$]+)+)\.getOrCreate)/,replace:"let hcC=$2.getOrCreate($1.channelId);hcC=$self.handleDelete(hcC,$1,!1);$2.commit(hcC);return;"},{match:/(?<=MESSAGE_DELETE_BULK:function\(([\w$]+)\)\{)(?=let.{0,100}?([\w$]+(?:\.[\w$]+)+)\.getOrCreate)/,replace:"let hcC=$2.getOrCreate($1.channelId);hcC=$self.handleDelete(hcC,$1,!0);$2.commit(hcC);return;"}]},{label:"tint deleted message row (base)",find:"Message must not be a thread starter message",replacement:{match:/\)\("li",\{(.+?),className:/,replace:')("li",{$1,className:($self.deletedClass(arguments[0])||"")+" "+'}},{label:"tint deleted message row",find:"childrenRepliedMessage",replacement:{match:/(className:)(\w+\(\)\((?:[^()"']|"[^"]*"|'[^']*'|\([^()]*\))*\))/,replace:'$1[$2,$self.deletedClass(arguments[0])].filter(Boolean).join(" ")'}},{label:"inline edit history",find:".SEND_FAILED,",replacement:{match:/\]:[\w$]+\.isUnsupported.{0,30}?,children:\[/,replace:"$&$self.renderEdits(arguments[0]),"}}],start(){b.load(),b.setRetention(x.store.retention),it=x.subscribe("retention",e=>b.setRetention(e)),zn(),at=x.subscribe("deleteStyle",zn),ot=io(),setTimeout(po,4e3),setTimeout(()=>{ct>0?S.info(`recorder pulse OK \u2014 ${ct} message action(s) observed so far`):S.error("recorder pulse FAILED \u2014 no message actions observed in 30s. The dispatcher hooks are not receiving events on this build. \u8BF7\u628A\u65E5\u5FD7\u9875\u91CC recorder on dispatcher \u5F00\u5934\u7684\u51E0\u884C\u53D1\u7ED9\u5F00\u53D1\u8005\u3002")},3e4)},stop(){ot?.(),ot=void 0,it?.(),it=void 0,at?.(),at=void 0;try{for(let e of Vn)document.documentElement?.classList.remove(`hc-mlog-${e}`)}catch{}b.flush(),S.info("stopped")},handleDelete(e,t,n){try{if(e==null||!n&&typeof e.has=="function"&&!e.has(t.id))return e;let o=x.store.keepDeletedInChat,i=64,a=c=>{let s=typeof e.get=="function"?e.get(c):void 0;if(!s)return;o&&!t.mlDeleted&&(s.flags&i)!==i&&!Me(String(t.channelId??t.channel_id??s.channel_id??""),s.author??{})?e=e.update(c,d=>d.set("deleted",!0)):e=e.remove(c)};if(n)for(let c of t.ids??[])a(c);else a(t.id)}catch(o){S.error("handleDelete failed; messages removed normally",o)}return e},deletedClass(e){try{let t=e?.message??e;if(!t)return"";let n=t.channel_id??t.channelId;return t.deleted===!0||n&&t.id&&b.isDeleted(String(n),String(t.id))?"hc-deleted":""}catch{return""}},renderEdits(e){try{let t=e?.message,n=t?.id,o=t?.channel_id??t?.channelId;if(!n||!o)return null;let i=b.getEdited().find(l=>l.id===String(n)&&l.channelId===String(o)),a=b.findDeleted(String(o),String(n)),c=!!(i&&i.history.length>0),s=!!a||t?.deleted===!0;return!c&&!s?null:r.createElement(ho,{history:i?.history,deletedAt:a?.deletedAt,isDeleted:s})}catch{return null}}});var qn=f("show-username"),Yn=X({mode:{type:"select",default:"nick-user",label:"\u663E\u793A\u65B9\u5F0F",description:"\u6635\u79F0\u4E0E\u7528\u6237\u540D\u7684\u6392\u5217\u3002",options:[{value:"nick-user",label:"\u6635\u79F0\u5728\u524D\uFF0C\u7528\u6237\u540D\u5728\u540E"},{value:"user-nick",label:"\u7528\u6237\u540D\u5728\u524D\uFF0C\u6635\u79F0\u5728\u540E"},{value:"user-only",label:"\u53EA\u663E\u793A\u7528\u6237\u540D"}]},style:{type:"select",default:"muted",label:"\u7528\u6237\u540D\u6837\u5F0F",description:"\u9644\u52A0\u7684\u7528\u6237\u540D\u90E8\u5206\u7684\u89C6\u89C9\u6837\u5F0F\u3002",options:[{value:"muted",label:"\u7070\u8272\u5C0F\u5B57"},{value:"pill",label:"\u5706\u89D2\u80F6\u56CA"},{value:"at",label:"@ \u524D\u7F00"},{value:"paren",label:"\u62EC\u53F7\u5305\u88F9"}]},hideWhenSame:{type:"boolean",default:!0,label:"\u6635\u79F0\u76F8\u540C\u65F6\u9690\u85CF",description:"\u6635\u79F0\u4E0E\u7528\u6237\u540D\u4E00\u81F4\u65F6\u4E0D\u91CD\u590D\u663E\u793A\u3002"},inReplies:{type:"boolean",default:!1,label:"\u56DE\u590D\u9884\u89C8\u4E2D\u4E5F\u663E\u793A",description:"\u5728\u56DE\u590D\u5F15\u7528\u7684\u5C0F\u5B57\u6761\u4E2D\u4E5F\u9644\u52A0\u7528\u6237\u540D\u3002"}});function go(e){let{original:t}=e,n=Yn.store,o=t.userOverride??t.message?.author,i=o?.username,a=t.author?.nick??o?.globalName??i??"",c=t.withMentionPrefix?"@":"";try{if(!i)return r.createElement(r.Fragment,null,c,a);if(t.isRepliedMessage&&!n.inReplies)return r.createElement(r.Fragment,null,c,a);if(n.hideWhenSame&&i.toLowerCase()===a.toLowerCase())return r.createElement(r.Fragment,null,c,a);let s=`hc-username hc-username--${n.style||"muted"}`,l=n.style==="at"?`@${i}`:n.style==="paren"?`\uFF08${i}\uFF09`:i;return n.mode==="user-only"?r.createElement(r.Fragment,null,c,i):n.mode==="user-nick"?r.createElement(r.Fragment,null,c,i," ",r.createElement("span",{className:s},a)):r.createElement(r.Fragment,null,c,a," ",r.createElement("span",{className:s},l))}catch(s){return qn.error("username render failed; falling back to the nick",s),r.createElement(r.Fragment,null,c,a)}}var Wn=O({id:"show-username",name:"\u663E\u793A\u7528\u6237\u540D",description:"\u5728\u6635\u79F0\u65C1\u8FB9\u663E\u793A\u8D26\u53F7\u7528\u6237\u540D\uFF0C\u9632\u6B62\u6539\u540D\u5192\u5145\uFF0C\u652F\u6301\u591A\u79CD\u6837\u5F0F\u3002",authors:[{name:"caitemm"}],category:"appearance",settings:Yn,patches:[{label:"message header username",find:'="SYSTEM_TAG"',replacement:{match:/(?<=onContextMenu:[\w$]+,children:)([\w$]+)\?(?=.{0,100}?user[Nn]ame:)/,replace:"$self.renderUsername(arguments[0]),_hcOld:$1?"}}],start(){qn.info("appending usernames to message headers")},stop(){},renderUsername(e){try{return r.createElement(go,{original:e})}catch{return e?.author?.nick??null}}});var L=X({acknowledgedRisk:{type:"boolean",default:!1,label:"\u6211\u5DF2\u4E86\u89E3\u5C01\u53F7\u98CE\u9669",description:"\u4E3B\u52A8\u8BA2\u9605\u9891\u9053\u5C5E\u4E8E\u81EA\u52A8\u5316\u884C\u4E3A\uFF0C\u53EF\u80FD\u8FDD\u53CD Discord \u670D\u52A1\u6761\u6B3E\u5E76\u5BFC\u81F4\u8D26\u53F7\u88AB\u5C01\u3002\u4EC5\u5728\u4F60\u5B8C\u5168\u7406\u89E3\u5E76\u81EA\u613F\u627F\u62C5\u98CE\u9669\u65F6\u5F00\u542F\u3002",hidden:!0},selectedGuilds:{type:"string-list",default:[],label:"\u76D1\u63A7\u7684\u670D\u52A1\u5668",description:"\u6309\u670D\u52A1\u5668 ID \u76D1\u63A7\u3002\u5EFA\u8BAE\u4ECE\u4E0B\u65B9\u7684\u670D\u52A1\u5668\u5217\u8868\u52FE\u9009\uFF0C\u800C\u4E0D\u662F\u624B\u586B\u3002",itemPlaceholder:"\u670D\u52A1\u5668 ID",hidden:!0}});var Te=f("guild-monitor"),fo=5*60*1e3,de,Jn=()=>[];function mo(e){try{let t=Cn.getChannels(e);if(!t||typeof t!="object")return[];let n=new Set;for(let o of Object.values(t))if(Array.isArray(o))for(let i of o){let a=i?.channel??i,c=a?.id;c!=null&&(a?.type===0||a?.type===5)&&n.add(String(c))}return[...n]}catch(t){return Te.debug(`could not read channels for guild ${e}`,t),[]}}function yo(e){let t=Re;if(t)try{if(typeof t.subscribeToChannel=="function"){for(let n of mo(e))t.subscribeToChannel(e,n);return}typeof t.subscribeToGuild=="function"&&t.subscribeToGuild(e)}catch(n){Te.warn(`subscribe failed for guild ${e}`,n)}}function pt(){let e=Re;return!!(e&&(typeof e.subscribeToChannel=="function"||typeof e.subscribeToGuild=="function"))}function ht(){let e=Jn();if(e.length){for(let t of e)yo(t);Te.debug(`refreshed subscriptions for ${e.length} guild(s)`)}}function Xn(e){if(Jn=e,gt(),!pt()){Te.warn("this Discord build exposes no guild-subscription action; monitoring is inactive");return}ht(),de=setInterval(ht,fo)}function Zn(){de&&ht()}function gt(){de&&(clearInterval(de),de=void 0)}function ft(){try{let t=(Ct("GuildStore")??Ce)?.getGuilds?.()??{};return Object.values(t).map(n=>({id:String(n?.id??""),name:String(n?.name??n?.id??"\u672A\u77E5\u670D\u52A1\u5668")})).filter(n=>n.id).sort((n,o)=>n.name.localeCompare(o.name,"zh-CN"))}catch{return[]}}function Qn(){let[e,t]=g(()=>ft()),[n,o]=g(()=>[...L.store.selectedGuilds]),[i,a]=g(()=>L.store.acknowledgedRisk===!0),c=pt();v(()=>{if(e.length===0){let h=setTimeout(()=>t(ft()),400);return()=>clearTimeout(h)}},[e.length]);let s=h=>{o(h),L.store.selectedGuilds=h,Zn()},l=h=>{s(n.includes(h)?n.filter(p=>p!==h):[...n,h])};return r.createElement("div",{className:"hc-stack"},r.createElement("div",{className:"hc-inline-note hc-inline-note--danger"},r.createElement(W,{size:18}),r.createElement("span",null,"\u4E3B\u52A8\u76D1\u63A7\u4F1A\u8BA2\u9605\u4F60\u5C1A\u672A\u6253\u5F00\u7684\u9891\u9053\uFF0C\u5C5E\u4E8E\u81EA\u52A8\u5316\u884C\u4E3A\uFF0C\u53EF\u80FD\u8FDD\u53CD Discord \u670D\u52A1\u6761\u6B3E\u5E76\u5BFC\u81F4",r.createElement("b",null,"\u8D26\u53F7\u88AB\u5C01\u7981"),"\u3002\u8BF7\u81EA\u884C\u627F\u62C5\u98CE\u9669\u3002")),r.createElement("div",{className:"hc-section"},r.createElement("div",{className:"hc-section__body"},r.createElement("div",{className:"hc-cell hc-cell--row"},r.createElement("div",{className:"hc-cell__main"},r.createElement("div",{className:"hc-cell__label"},"\u542F\u7528\u4E3B\u52A8\u76D1\u63A7"),r.createElement("div",{className:"hc-cell__desc"},"\u5F00\u542F\u540E\u624D\u80FD\u52FE\u9009\u4E0B\u65B9\u7684\u670D\u52A1\u5668\u3002")),r.createElement(z,{checked:i,onChange:h=>{a(h),L.store.acknowledgedRisk=h,h||s([])},"aria-label":"\u542F\u7528\u4E3B\u52A8\u76D1\u63A7"})))),!c&&r.createElement("div",{className:"hc-inline-note"},r.createElement(W,{size:18}),r.createElement("span",null,"\u5F53\u524D Discord \u7248\u672C\u672A\u66B4\u9732\u53EF\u7528\u7684\u8BA2\u9605\u63A5\u53E3\uFF0C\u76D1\u63A7\u6682\u65F6\u65E0\u6CD5\u751F\u6548\u3002")),r.createElement("div",{className:"hc-section"},r.createElement("div",{className:"hc-section__title",style:{display:"flex",justifyContent:"space-between"}},r.createElement("span",null,"\u670D\u52A1\u5668\uFF08",e.length,"\uFF09"),r.createElement("button",{type:"button",className:"hc-tab",onClick:()=>t(ft()),style:{height:20,padding:"0 8px",textTransform:"none"}},r.createElement(re,{size:12})," \u5237\u65B0")),e.length===0?r.createElement(N,{icon:r.createElement(Rt,{size:48}),title:"\u6CA1\u6709\u8BFB\u5230\u670D\u52A1\u5668",subtitle:"\u7B49 Discord \u52A0\u8F7D\u5B8C\u6210\u540E\u70B9\u4E0A\u9762\u7684\u5237\u65B0\uFF0C\u6216\u7A0D\u540E\u518D\u6765\u3002"}):r.createElement("div",{className:"hc-section__body",style:{opacity:i?1:.5,pointerEvents:i?"auto":"none"}},e.map(h=>r.createElement("div",{className:"hc-cell hc-cell--row",key:h.id},r.createElement("div",{className:"hc-cell__main"},r.createElement("div",{className:"hc-cell__label"},h.name),r.createElement("div",{className:"hc-cell__desc"},h.id)),r.createElement(z,{checked:n.includes(h.id),onChange:()=>l(h.id),"aria-label":`\u76D1\u63A7 ${h.name}`}))))),n.length>0&&r.createElement("div",{className:"hc-savebar"},r.createElement("span",{className:"hc-savebar__label"},"\u6B63\u5728\u76D1\u63A7 ",n.length," \u4E2A\u670D\u52A1\u5668"),r.createElement("div",{className:"hc-savebar__actions"},r.createElement(C,{size:"sm",variant:"destructive",onClick:()=>s([])},"\u5168\u90E8\u53D6\u6D88"))))}var bo=f("guild-monitor");function Rn(){if(L.store.acknowledgedRisk!==!0)return[];let e=L.store.selectedGuilds;return Array.isArray(e)?e:[]}var er=O({id:"guild-monitor",name:"\u670D\u52A1\u5668\u76D1\u63A7",description:"\u4E3B\u52A8\u8BA2\u9605\u9009\u5B9A\u670D\u52A1\u5668\u7684\u9891\u9053\uFF0C\u6355\u6349\u672A\u6253\u5F00\u9891\u9053\u91CC\u7684\u6D88\u606F\uFF08\u6709\u5C01\u53F7\u98CE\u9669\uFF0C\u9ED8\u8BA4\u5173\u95ED\uFF09\u3002",authors:[{name:"caitemm"}],category:"privacy",settings:L,page:{title:"\u76D1\u63A7",icon:en,component:Qn},start(){Xn(Rn);let e=Rn().length;e>0&&bo.info(`monitoring ${e} guild(s)`)},stop(){gt()}});var tr=[kn,Kn,Wn,er];var nr=f("extension");w.registerAll(tr);w.prepare();async function vo(){await $t,await w.boot(),q();try{globalThis.HalcyonAPI={open:we,close:U,runtime:w,patchReport:()=>Q(),dumpSource:(e,t)=>Mt(e,t),diagnose:()=>Tt()}}catch{}nr.info("Halcyon (extension) ready \u2014 press Ctrl/Cmd+Shift+H to open settings")}vo().catch(e=>nr.error("extension boot failed",e));})();
