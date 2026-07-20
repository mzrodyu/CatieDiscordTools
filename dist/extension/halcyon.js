"use strict";var Halcyon=(()=>{var st=Object.defineProperty;var uo=Object.getOwnPropertyDescriptor;var ho=Object.getOwnPropertyNames;var po=Object.prototype.hasOwnProperty;var ke=(e,t)=>()=>(e&&(t=e(e=0)),t);var go=(e,t)=>{for(var n in t)st(e,n,{get:t[n],enumerable:!0})},fo=(e,t,n,o)=>{if(t&&typeof t=="object"||typeof t=="function")for(let i of ho(t))!po.call(e,i)&&i!==n&&st(e,i,{get:()=>t[i],enumerable:!(o=uo(t,i))||o.enumerable});return e};var mo=e=>fo(st({},"__esModule",{value:!0}),e);function ze(e,t,n){let o={time:Date.now(),level:e,scope:t,parts:n};Be.push(o),Be.length>bo&&Be.shift();for(let c of ct)try{c(o)}catch{}if(ln[e]<vo)return;let i=`background:${yo[e]};color:#fff;border-radius:4px;padding:0 6px;font-weight:600`;(e==="error"?console.error:e==="warn"?console.warn:console.log)(`%cHalcyon%c ${t}`,i,"color:inherit;font-weight:600",...n)}function y(e){return{debug:(...t)=>ze("debug",e,t),info:(...t)=>ze("info",e,t),warn:(...t)=>ze("warn",e,t),error:(...t)=>ze("error",e,t),child:t=>y(`${e}:${t}`)}}function lt(){return Be.slice()}function dn(e){return ct.add(e),()=>ct.delete(e)}var ln,yo,bo,Be,ct,vo,N=ke(()=>{"use strict";u();ln={debug:10,info:20,warn:30,error:40},yo={debug:"#8E8E93",info:"#0A84FF",warn:"#FF9F0A",error:"#FF453A"},bo=500,Be=[],ct=new Set,vo=ln.info});function fn(e){pn=e,globalThis.__halcyon_self__=t=>pn(t)}function mn(e){dt.push({...e,applied:!1,hits:0})}function we(){return dt.map(({pluginId:e,label:t,applied:n,hits:o})=>({pluginId:e,label:t,applied:n,hits:o}))}function ut(){if(hn)return;hn=!0;let e=globalThis,t=e[un]??[],n=a=>function(...c){try{gn(c[0])}catch(s){W.error("failed to instrument chunk",s)}return a.apply(this??t,c)},o=t.push,i=typeof o=="function"&&o!==Array.prototype.push?n(o.bind(t)):Array.prototype.push.bind(t);try{Object.defineProperty(t,"push",{configurable:!0,get:()=>i,set:a=>{i=n(a)}})}catch(a){W.error("could not install chunk interceptor",a);return}e[un]=t;for(let a of t)try{gn(a)}catch{}t.push([[Symbol("halcyon.require")],{},a=>{Y=a}])}function yn(){return new Promise(e=>{ut(),Co(t=>oe(t),()=>{Se||(Se=!0,W.info("core runtime detected"),e())}),setTimeout(()=>{Se||(W.warn("core module not seen within grace period; continuing degraded"),Se=!0,e())},15e3)})}function gn(e){let t=e?.[1];if(!(!t||typeof t!="object"))for(let n of Object.keys(t)){let o=t[n];typeof o!="function"||o.__halcyon__||(t[n]=xo(n,o))}}function xo(e,t){let n=dt.filter(a=>Io(a.find,t)),o=n.length?_o(e,t,n):t,i=function(a,c,s){o.call(this,a,c,s);try{Eo(a)}catch(l){W.error("module observer threw for",e,l)}};return i.toString=()=>o.toString(),i.__halcyon__=!0,i}function _o(e,t,n){let o=String(t);for(let i of n){let a=o,c=wo(i.replace,i.pluginId);if(o=i.all?o.replace(new RegExp(i.match.source,So(i.match.flags)),c):o.replace(i.match,c),o===a){W.warn(`patch "${i.label}" (${i.pluginId}) matched module ${e} but changed nothing`);continue}i.applied=!0,i.hits++,W.debug(`applied patch "${i.label}" (${i.pluginId}) to module ${e}`)}try{return(0,eval)(`(${ko(o)})`)}catch(i){return W.error(`patched module ${e} failed to compile; using original`,i),t}}function ko(e){let t=e.trimStart();if(/^(async\s+)?function[\s*(]/.test(t)||/^(async\s+)?(\([^)]*\)|[\w$]+)\s*=>/.test(t))return t;let n=t.match(/^(async\s+)?(\*\s*)?(?:\[[^\]]*\]|[\w$]+)\s*\(/);if(n){let o=n[1]?"async ":"",i=n[2]?"*":"";return`${o}function${i}${t.slice(n[0].length-1)}`}return t}function So(e){return e.includes("g")?e:e+"g"}function wo(e,t){let n=`__halcyon_self__(${JSON.stringify(t)})`;return typeof e=="string"?e.split("$self").join(n):(...o)=>e(...o).split("$self").join(n)}function Io(e,t){let n=t.toString();return typeof e=="string"?n.includes(e):e.test(n)}function ht(e,t,n){try{if(t(e,n))return e}catch{}if(typeof e!="object"&&typeof e!="function")return;let o;try{o=Object.keys(e)}catch{return}if(!(o.length>No))for(let i of o){let a;try{a=e[i]}catch{continue}if(!(a==null||typeof a!="object"&&typeof a!="function"))try{if(t(a,n))return a}catch{}}}function Eo(e){if(!Ge.size)return;let t=e.exports;if(t!=null)for(let n of Ge){let o=ht(t,n.filter,{id:e.id,module:e});o!==void 0&&(Ge.delete(n),n.resolve(o))}}function B(e){if(Y)for(let t of Object.keys(Y.c)){let n=Y.c[t],o=n?.exports;if(o==null||o===globalThis)continue;let i=ht(o,e,{id:t,module:n});if(i!==void 0)return i}}function bn(e){let t=[];if(!Y)return t;for(let n of Object.keys(Y.c)){let o=Y.c[n],i=o?.exports;if(i==null||i===globalThis)continue;let a=ht(i,e,{id:n,module:o});a!==void 0&&t.push(a)}return t}function vn(...e){return B(t=>e.every(n=>t[n]!==void 0))}function xn(e){return B(t=>t?.getName?.()===e||t?.constructor?.displayName===e)}function Co(e,t){let n=B(e);if(n!==void 0){t(n);return}Ge.add({filter:e,resolve:t})}function $(e){let t,n=()=>t??=B(e);return new Proxy({},{get(o,i){let a=n();if(a==null)return;let c=a[i];return typeof c=="function"?c.bind(a):c},has(o,i){let a=n();return a!=null&&i in a}})}function _n(){return Se}function oe(e){return e!=null&&typeof e.dispatch=="function"&&typeof e.subscribe=="function"&&(typeof e._actionHandlers<"u"||typeof e._subscriptions<"u"||typeof e._waitQueue<"u"||typeof e.isDispatching=="function"||typeof e.wait=="function")}function kn(e,t=300){let n=Y?.m;if(!n)return"<webpack require not ready \u2014 open the target UI first>";let o=[];for(let i of Object.keys(n)){let a;try{a=String(n[i])}catch{continue}if(!a.includes(e))continue;let c=[],s=a.indexOf(e),l=0;for(;s>=0&&l<4;)c.push(a.slice(Math.max(0,s-t),s+e.length+t)),s=a.indexOf(e,s+e.length),l++;o.push(`===== module ${i} (${l} hit${l===1?"":"s"}) =====
${c.join(`
  ...  
`)}`)}return o.length?o.join(`

`):`<no loaded factory contains "${e}">`}function Sn(){let e=we(),t={embedRendered:typeof document<"u"&&!!document.querySelector(".hc-embed"),halcyonMounted:typeof document<"u"&&!!document.querySelector(".halcyon")};try{let n=null,o=document.querySelectorAll("*");for(let p=0;p<o.length&&!n;p++){let b=o[p],x=Object.keys(b).find(A=>A.startsWith("__reactFiber$"));x&&(n=b[x])}if(!n)return JSON.stringify({error:"no React fiber found in DOM",patches:e,dom:t},null,2);let i=n;for(;i.return;)i=i.return;let a=p=>{try{if(typeof p=="function")return Function.prototype.toString.call(p);if(p&&typeof p=="object"){let b=p.type||p.render;if(typeof b=="function")return Function.prototype.toString.call(b)}}catch{}return""},c=p=>p&&(p.displayName||p.name)||p&&p.type&&(p.type.displayName||p.type.name)||"",s=[i],l=0,d=[],h=[],f=new Set,w=new Set;for(;s.length&&l<4e4;){let p=s.shift();l++;let b=p.type;if(b&&(typeof b=="function"||typeof b=="object")){let x=a(b),A=c(b)||"anon",Le=x.includes("__halcyon_self__");x.includes("buildLayout")&&d.push({name:A,patched:Le}),x.includes("getPredicateSections")&&h.push({name:A,patched:Le}),(x.includes("renderSidebar")||x.includes("SETTINGS_SIDEBAR"))&&f.add(A),/settings/i.test(A)&&w.add(A)}p.child&&s.push(p.child),p.sibling&&s.push(p.sibling)}let q=e.find(p=>p.label==="user-settings-layout"),ne=e.find(p=>p.label==="user-settings-sidebar"),ge=t.embedRendered?"embed rendered \u2014 Halcyon section is on screen":q?.applied||ne?.applied?"patch applied at load but section not seen \u2014 open user settings, then re-run":"no settings patch matched this build \u2014 run dumpSource('buildLayout') and share the output";return JSON.stringify({verdict:ge,dom:t,patches:e,walked:l,buildLayoutHits:d,gpsHits:h,sidebarComps:[...f].slice(0,25),settingsNamed:[...w].slice(0,40)},null,2)}catch(n){return JSON.stringify({error:String(n),patches:e,dom:t},null,2)}}var W,un,Y,Se,hn,Ge,dt,pn,No,J=ke(()=>{"use strict";u();N();W=y("modules"),un="webpackChunkdiscord_app",Se=!1,hn=!1,Ge=new Set,dt=[],pn=()=>{};No=40});function wn(e){let t,n=()=>t??=e();return new Proxy(function(){},{get:(o,i)=>n()?.[i],set:(o,i,a)=>{let c=n();return c&&(c[i]=a),!0},has:(o,i)=>{let a=n();return a!=null&&i in a},ownKeys:()=>Reflect.ownKeys(n()??{}),getOwnPropertyDescriptor:(o,i)=>Reflect.getOwnPropertyDescriptor(n()??{},i),apply:(o,i,a)=>n().apply(i,a),construct:(o,i)=>new(n())(...i)})}function pt(...e){return t=>e.every(n=>typeof t[n]=="function")&&typeof t.__halcyon_probe__>"u"}var r,Ie,m,E,In,ie,T=ke(()=>{"use strict";u();J();r=wn(()=>B(pt("createElement","useState","useEffect","useMemo"))),Ie=wn(()=>B(pt("createPortal","flushSync"))??B(pt("createPortal"))),m=(...e)=>r.useState(...e),E=(...e)=>r.useEffect(...e),In=(...e)=>r.useMemo(...e),ie=(...e)=>r.useRef(...e)});var u=ke(()=>{"use strict";T()});var gr={};go(gr,{ChannelStore:()=>Me,Dispatcher:()=>ti,GuildChannelStore:()=>Ct,GuildStore:()=>de,GuildSubscriptions:()=>et,MessageActions:()=>ni,MessageStore:()=>Et,SelectedChannelStore:()=>ri,UserStore:()=>ve,getDispatcher:()=>Nt,moment:()=>oi});function Nt(){try{let e=ve?._dispatcher;if(oe(e))return e}catch{}return B(oe)}var ti,Et,ni,ve,Me,ri,de,Ct,et,oi,ue=ke(()=>{"use strict";u();J();ti=$(oe);Et=$(e=>typeof e?.getMessage=="function"&&typeof e?.getMessages=="function"),ni=$(e=>typeof e?.editMessage=="function"&&typeof e?.deleteMessage=="function"),ve=$(e=>typeof e?.getCurrentUser=="function"&&typeof e?.getUser=="function"),Me=$(e=>e?.getName?.()==="ChannelStore"||e?.constructor?.displayName==="ChannelStore"),ri=$(e=>typeof e?.getChannelId=="function"&&typeof e?.getLastSelectedChannelId=="function"),de=$(e=>e?.getName?.()==="GuildStore"||e?.constructor?.displayName==="GuildStore"),Ct=$(e=>typeof e?.getChannels=="function"&&typeof e?.getDefaultChannel=="function"),et=$(e=>typeof e?.subscribeToGuild=="function"||typeof e?.subscribeToChannel=="function"),oi=$(e=>typeof e=="function"&&typeof e?.locale=="function"&&typeof e?.utc=="function")});u();u();var Po="halcyon:ext:main",To="halcyon:ext:bridge",Ne=new Map,gt=!1,Nn,En=new Promise(e=>{Nn=e});function Cn(){gt||(gt=!0,Nn())}function je(e,t){try{window.postMessage({channel:Po,kind:e,...t},"*")}catch{}}window.addEventListener("message",e=>{if(e.source!==window)return;let t=e.data;if(!(!t||t.channel!==To)&&t.kind==="hydrate"&&t.entries&&typeof t.entries=="object"){for(let[n,o]of Object.entries(t.entries))typeof o=="string"&&Ne.set(n,o);Cn()}});var Mo={read:e=>Ne.has(e)?Ne.get(e):null,write:(e,t)=>{Ne.set(e,t),je("write",{key:e,value:t})},remove:e=>{Ne.delete(e),je("remove",{key:e})}},Do=globalThis.HalcyonNative??={};Do.storage=Mo;je("hydrate");setTimeout(()=>{gt||je("hydrate")},120);setTimeout(Cn,2e3);u();N();J();u();N();var yt=y("settings"),ft="halcyon:";function Ao(){let e=globalThis.HalcyonNative?.storage;if(e&&typeof e.read=="function"&&typeof e.write=="function")return e;try{let n=globalThis.localStorage;if(n)return{read:o=>n.getItem(o),write:(o,i)=>n.setItem(o,i),remove:o=>n.removeItem(o)}}catch{}yt.warn("no persistent storage backend; settings will not survive a restart");let t=new Map;return{read:n=>t.get(n)??null,write:(n,o)=>void t.set(n,o),remove:n=>void t.delete(n)}}var mt=Ao();function ae(e){let t=mt.read(ft+e);if(!t)return{};try{let n=JSON.parse(t);return n&&typeof n=="object"?n:{}}catch{let n=new Date().toISOString().replace(/[:.]/g,"-");try{mt.write(`${ft}${e}.corrupt-${n}`,t)}catch{}return yt.warn(`stored settings for "${e}" were unreadable; reset to defaults (backup kept)`),{}}}function fe(e,t){try{mt.write(ft+e,JSON.stringify(t))}catch(n){yt.error(`could not persist settings for "${e}"`,n)}}var X=y("runtime"),bt="core.enabled",vt=class{records=new Map;enabledMap={};bootPatched=new Set;listeners=new Set;prepared=!1;booted=!1;register(t){if(this.records.has(t.id)){X.warn(`duplicate plugin id "${t.id}" ignored`);return}this.records.set(t.id,{plugin:t,state:"disabled"}),t.settings?.__bind(t.id)}registerAll(t){for(let n of t)this.register(n)}prepare(){this.prepared||(this.prepared=!0,fn(t=>this.records.get(t)?.plugin),this.enabledMap=ae(bt)??{},this.registerBootPatches(),ut())}async boot(){if(this.booted)return;this.booted=!0,this.prepare(),this.enabledMap=ae(bt)??{};for(let{plugin:n}of this.records.values())n.settings?.__bind(n.id);this.registerBootPatches(),await yn();for(let n of this.startOrder())this.shouldRun(n)&&this.startPlugin(n);this.emit(),X.info(`runtime up \u2014 ${this.runningCount()} plugin(s) active (build 2026-07-20 00:07:09)`)}isEnabled(t){let n=this.records.get(t);return n?n.plugin.required?!0:this.enabledMap[t]===!0:!1}enable(t){let n=this.records.get(t);if(n){for(let o of n.plugin.dependencies??[])this.isEnabled(o)||this.enable(o);this.enabledMap[t]=!0,this.persistEnabledState(),this.booted&&_n()&&this.startPlugin(t),this.emit()}}disable(t){let n=this.records.get(t);if(n){if(n.plugin.required){X.warn(`"${t}" is required and cannot be disabled`);return}for(let[o,i]of this.records)i.plugin.dependencies?.includes(t)&&this.isEnabled(o)&&this.disable(o);this.enabledMap[t]=!1,this.persistEnabledState(),this.stopPlugin(t),this.emit()}}toggle(t){return this.isEnabled(t)?(this.disable(t),!1):(this.enable(t),!0)}needsRestart(t){return this.records.get(t)?.plugin.patches?.length?this.isEnabled(t)!==this.bootPatched.has(t):!1}getPlugin(t){return this.records.get(t)?.plugin}list(){return[...this.records.values()].map(({plugin:t,state:n,error:o})=>({id:t.id,name:t.name,description:t.description,category:t.category,authors:t.authors,required:t.required??!1,hidden:t.hidden??!1,enabled:this.isEnabled(t.id),state:n,error:o,hasSettings:t.settings!=null,hasPage:t.page!=null,needsRestart:this.needsRestart(t.id)}))}onChange(t){return this.listeners.add(t),()=>this.listeners.delete(t)}shouldRun(t){if(!this.isEnabled(t))return!1;let n=this.records.get(t);return n?(n.plugin.dependencies??[]).every(o=>this.isEnabled(o)):!1}registerBootPatches(){for(let{plugin:t}of this.records.values())this.shouldRun(t.id)&&t.patches?.length&&!this.bootPatched.has(t.id)&&(this.registerPatches(t),this.bootPatched.add(t.id))}registerPatches(t){for(let n of t.patches??[]){let o=Array.isArray(n.replacement)?n.replacement:[n.replacement];for(let i of o)mn({pluginId:t.id,label:n.label,find:n.find,match:i.match,replace:i.replace,all:n.all??!1})}}startPlugin(t){let n=this.records.get(t);if(!(!n||n.state==="running"||n.state==="starting")){n.state="starting";try{n.plugin.start?.(),n.state="running",n.error=void 0,X.debug(`started "${t}"`)}catch(o){n.state="errored",n.error=o,this.enabledMap[t]=!1,this.persistEnabledState(),X.error(`plugin "${t}" threw during start; it has been disabled`,o)}this.emit()}}stopPlugin(t){let n=this.records.get(t);if(!(!n||n.state!=="running"&&n.state!=="errored")){n.state="stopping";try{n.plugin.stop?.(),X.debug(`stopped "${t}"`)}catch(o){X.error(`plugin "${t}" threw during stop; state may be inconsistent`,o)}finally{n.state="disabled",this.emit()}}}startOrder(){let t=[],n=new Set,o=(i,a)=>{if(n.has(i))return;if(a.has(i)){X.error(`dependency cycle involving "${i}"; breaking it`);return}a.add(i);let c=this.records.get(i);for(let s of c?.plugin.dependencies??[])this.records.has(s)&&o(s,a);a.delete(i),n.add(i),t.push(i)};for(let i of this.records.keys())o(i,new Set);return t}runningCount(){let t=0;for(let n of this.records.values())n.state==="running"&&t++;return t}persistEnabledState(){fe(bt,this.enabledMap)}emit(){for(let t of this.listeners)try{t()}catch{}}},L=new vt;u();u();u();var Lo=Symbol.for("halcyon.plugin"),$o=/^[a-z0-9]+(?:-[a-z0-9]+)*$/;function G(e){if(!$o.test(e.id))throw new Error(`Halcyon: invalid plugin id "${e.id}" \u2014 use lowercase words separated by single dashes.`);if(!e.authors?.length)throw new Error(`Halcyon: plugin "${e.id}" must list at least one author.`);return Object.assign(e,{[Lo]:!0})}N();J();u();var Pn=`/*
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
`;var Tn=`/*
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
`;var Mn="halcyon-styles",Dn=!1;function me(){if(Dn)return;let e=document.getElementById(Mn),t=e instanceof HTMLStyleElement?e:document.createElement("style");t.id=Mn,t.textContent=`${Pn}
${Tn}`,e||document.head.appendChild(t),Dn=!0}u();T();N();u();T();u();function _({size:e=20,className:t,filled:n,children:o,...i}){let a=i["aria-label"];return(typeof e!="number"||!Number.isFinite(e))&&(e=20),r.createElement("svg",{className:t,width:e,height:e,viewBox:"0 0 24 24",fill:n?"currentColor":"none",stroke:n?"none":"currentColor",strokeWidth:1.5,strokeLinecap:"round",strokeLinejoin:"round",role:a?"img":void 0,"aria-label":a,"aria-hidden":a?void 0:!0},o)}function He(e){return r.createElement(_,{...e},r.createElement("rect",{x:"3.25",y:"3.25",width:"17.5",height:"17.5",rx:"5"}),r.createElement("path",{d:"M6.5 13.2c1.4-2.5 2.9-2.5 4.3 0s2.9 2.5 4.3 0 2.9-2.5 2.9-2.5"}))}function An(e){return r.createElement(_,{...e},r.createElement("path",{d:"M9 6l6 6-6 6"}))}function Ln(e){return r.createElement(_,{...e},r.createElement("circle",{cx:"12",cy:"12",r:"8.25"}),r.createElement("path",{d:"M12 7.5V12l3 2"}))}function H(e){return r.createElement(_,{...e},r.createElement("path",{d:"M4.5 7h15"}),r.createElement("path",{d:"M9.25 7V5.5A1.5 1.5 0 0110.75 4h2.5A1.5 1.5 0 0114.75 5.5V7"}),r.createElement("path",{d:"M6.5 7l.85 11.1A2 2 0 009.34 20h5.32a2 2 0 001.99-1.9L17.5 7"}),r.createElement("path",{d:"M10 11v5.5M14 11v5.5"}))}function xt(e){return r.createElement(_,{...e},r.createElement("path",{d:"M13.5 6.5l4 4"}),r.createElement("path",{d:"M4.5 19.5l1-4L15.5 5.5a2 2 0 013 3L8.5 18.5l-4 1z"}))}function $n(e){return r.createElement(_,{...e},r.createElement("path",{d:"M12 3.5l7 2.6v5c0 4.4-3 7.3-7 8.9-4-1.6-7-4.5-7-8.9v-5l7-2.6z"}),r.createElement("path",{d:"M9 12l2 2 4-4"}))}function On(e){return r.createElement(_,{...e},r.createElement("path",{d:"M5 5.5h14a1.5 1.5 0 011.5 1.5v8a1.5 1.5 0 01-1.5 1.5H9.5L5.5 20v-3H5A1.5 1.5 0 013.5 15.5V7A1.5 1.5 0 015 5.5z"}))}function ye(e){return r.createElement(_,{...e},r.createElement("circle",{cx:"11",cy:"11",r:"6.25"}),r.createElement("path",{d:"M20 20l-3.8-3.8"}))}function zn(e){return r.createElement(_,{...e},r.createElement("path",{d:"M6.5 6.5l11 11M17.5 6.5l-11 11"}))}function be(e){return r.createElement(_,{...e},r.createElement("path",{d:"M4.5 8h9M17 8h2.5M4.5 16h2.5M10.5 16h9"}),r.createElement("circle",{cx:"15",cy:"8",r:"2.25"}),r.createElement("circle",{cx:"9",cy:"16",r:"2.25"}))}function Bn(e){return r.createElement(_,{...e},r.createElement("path",{d:"M4.5 9.5v5H7l4.5 3.5V6L7 9.5H4.5z"}),r.createElement("path",{d:"M15 9a4 4 0 010 6"}),r.createElement("path",{d:"M17.5 6.5a7.5 7.5 0 010 11"}))}function Gn(e){return r.createElement(_,{...e},r.createElement("circle",{cx:"12",cy:"12",r:"8.25"}),r.createElement("path",{d:"M12 3.75a8.25 8.25 0 010 16.5z",fill:"currentColor",stroke:"none"}))}function jn(e){return r.createElement(_,{...e},r.createElement("path",{d:"M8.5 8L4.5 12l4 4"}),r.createElement("path",{d:"M15.5 8l4 4-4 4"}),r.createElement("path",{d:"M13.5 5.5l-3 13"}))}function Hn(e){return r.createElement(_,{...e,filled:!0},r.createElement("circle",{cx:"5.5",cy:"12",r:"1.6"}),r.createElement("circle",{cx:"12",cy:"12",r:"1.6"}),r.createElement("circle",{cx:"18.5",cy:"12",r:"1.6"}))}function Fn(e){return r.createElement(_,{...e},r.createElement("path",{d:"M12 4v10"}),r.createElement("path",{d:"M8 10.5l4 4 4-4"}),r.createElement("path",{d:"M5 19.5h14"}))}function Fe(e){return r.createElement(_,{...e},r.createElement("path",{d:"M12 5v14M5 12h14"}))}function Ue(e){return r.createElement(_,{...e},r.createElement("circle",{cx:"12",cy:"12",r:"8.25"}),r.createElement("path",{d:"M12 11v5"}),r.createElement("path",{d:"M12 7.75h.01"}))}function Z(e){return r.createElement(_,{...e},r.createElement("path",{d:"M12 4.5L3.5 19h17L12 4.5z"}),r.createElement("path",{d:"M12 10v4"}),r.createElement("path",{d:"M12 16.75h.01"}))}function Q(e){return r.createElement(_,{...e},r.createElement("path",{d:"M8.5 7h11M8.5 12h11M8.5 17h11"}),r.createElement("path",{d:"M4.5 7h.01M4.5 12h.01M4.5 17h.01"}))}function Un(e){return r.createElement(_,{...e},r.createElement("path",{d:"M5 12h14"}))}function se(e){return r.createElement(_,{...e},r.createElement("path",{d:"M19 8.5a7.5 7.5 0 10.9 6"}),r.createElement("path",{d:"M19 4v4.5h-4.5"}))}function Kn(e){return r.createElement(_,{...e},r.createElement("path",{d:"M15 6l-6 6 6 6"}))}function Ke(e){return r.createElement(_,{...e},r.createElement("rect",{x:"4",y:"4",width:"16",height:"6",rx:"2"}),r.createElement("rect",{x:"4",y:"14",width:"16",height:"6",rx:"2"}),r.createElement("path",{d:"M8 7h.01M8 17h.01"}))}function Vn(e){return r.createElement(_,{...e},r.createElement("circle",{cx:"12",cy:"12",r:"2"}),r.createElement("path",{d:"M8.5 8.5a5 5 0 000 7M15.5 8.5a5 5 0 010 7"}),r.createElement("path",{d:"M6 6a9 9 0 000 12M18 6a9 9 0 010 12"}))}u();T();u();function O({checked:e,onChange:t,disabled:n,...o}){return r.createElement("button",{type:"button",role:"switch","aria-checked":e,"aria-label":o["aria-label"],className:"hc-toggle","data-on":e,disabled:n,onClick:()=>{n||t(!e)}},r.createElement("span",{className:"hc-toggle__knob"}))}u();function qn({icon:e,iconBackground:t,title:n,subtitle:o,accessory:i,onClick:a,showChevron:c}){let s=typeof a=="function";return r.createElement("div",{className:s?"hc-row hc-row--button":"hc-row",onClick:a,role:s?"button":void 0,tabIndex:s?0:void 0,onKeyDown:s?l=>{(l.key==="Enter"||l.key===" ")&&(l.preventDefault(),a?.())}:void 0},e&&r.createElement("div",{className:"hc-row__icon",style:t?{background:t}:void 0},e),r.createElement("div",{className:"hc-row__text"},r.createElement("div",{className:"hc-row__title"},n),o!=null&&o!==!1&&r.createElement("div",{className:"hc-row__subtitle"},o)),i!=null&&i!==!1&&r.createElement("div",{className:"hc-row__accessory"},i),c&&r.createElement(An,{size:20,className:"hc-row__chevron"}))}u();function ce({tone:e="neutral",children:t}){return r.createElement("span",{className:"hc-badge","data-tone":e},t)}u();function j({icon:e,title:t,subtitle:n,action:o}){return r.createElement("div",{className:"hc-empty"},e,r.createElement("div",{className:"hc-empty__title"},t),n&&r.createElement("div",{className:"hc-empty__subtitle"},n),o&&r.createElement("div",{style:{marginTop:"var(--hc-space-5)"}},o))}u();T();u();function Wn(e,t,n){return t!=null&&e<t?t:n!=null&&e>n?n:e}function Yn({value:e,onChange:t,min:n,max:o,step:i=1}){let a=n!=null&&e<=n,c=o!=null&&e>=o;return r.createElement("div",{className:"hc-stepper"},r.createElement("button",{type:"button",className:"hc-stepper__btn",onClick:()=>t(Wn(e-i,n,o)),disabled:a,"aria-label":"\u51CF\u5C11"},r.createElement(Un,{size:16})),r.createElement("span",{className:"hc-stepper__value"},e),r.createElement("button",{type:"button",className:"hc-stepper__btn",onClick:()=>t(Wn(e+i,n,o)),disabled:c,"aria-label":"\u589E\u52A0"},r.createElement(Fe,{size:16})))}u();function F({value:e,onChange:t,className:n,...o}){return r.createElement("input",{className:n?`hc-input ${n}`:"hc-input",value:e,onChange:i=>t(i.currentTarget.value),...o})}u();T();T();function Ve({value:e,options:t,onChange:n,...o}){let[i,a]=m(!1),[c,s]=m(-1),l=ie(null),d=ie(null),[h,f]=m(null),w=t.find(p=>p.value===e);E(()=>{if(!i)return;let p=b=>{let x=b.target;l.current?.contains(x)||d.current?.contains(x)||a(!1)};return document.addEventListener("pointerdown",p,!0),()=>document.removeEventListener("pointerdown",p,!0)},[i]),E(()=>{if(!i)return;let p=b=>{d.current&&b.target instanceof Node&&d.current.contains(b.target)||a(!1)};return window.addEventListener("scroll",p,!0),window.addEventListener("resize",p),()=>{window.removeEventListener("scroll",p,!0),window.removeEventListener("resize",p)}},[i]);let q=()=>{let p=l.current?.getBoundingClientRect();if(p){let b=Math.min(280,t.length*36+10),x=p.bottom+6,A=x+b>window.innerHeight-8?Math.max(8,p.top-6-b):x;f({top:A,right:Math.max(8,window.innerWidth-p.right),width:p.width})}s(Math.max(0,t.findIndex(b=>b.value===e))),a(!0)},ne=p=>{a(!1),p!==e&&n(p)},ge=p=>{if(!i){(p.key==="Enter"||p.key===" "||p.key==="ArrowDown")&&(p.preventDefault(),q());return}p.key==="Escape"?(p.preventDefault(),a(!1)):p.key==="ArrowDown"?(p.preventDefault(),s(b=>Math.min(t.length-1,b+1))):p.key==="ArrowUp"?(p.preventDefault(),s(b=>Math.max(0,b-1))):p.key==="Enter"||p.key===" "?(p.preventDefault(),c>=0&&c<t.length&&ne(t[c].value)):p.key==="Tab"&&a(!1)};return r.createElement("div",{className:"hc-select",ref:l,onKeyDown:ge},r.createElement("button",{type:"button",className:"hc-select__button","aria-haspopup":"listbox","aria-expanded":i,"aria-label":o["aria-label"],onClick:()=>i?a(!1):q()},r.createElement("span",{className:"hc-select__value"},w?.label??e),r.createElement("svg",{className:"hc-select__chevron",width:"12",height:"12",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:2.5,strokeLinecap:"round",strokeLinejoin:"round","aria-hidden":!0,"data-open":i},r.createElement("path",{d:"M6 9l6 6 6-6"}))),i&&h&&Ie.createPortal(r.createElement("div",{className:"halcyon",ref:d,style:{position:"fixed",top:h.top,right:h.right,zIndex:1e4},onKeyDown:ge},r.createElement("div",{className:"hc-select__menu",role:"listbox",style:{minWidth:h.width}},t.map((p,b)=>r.createElement("button",{type:"button",key:p.value,role:"option","aria-selected":p.value===e,className:"hc-select__option","data-active":b===c,"data-selected":p.value===e,onPointerEnter:()=>s(b),onClick:()=>ne(p.value)},r.createElement("span",{className:"hc-select__optlabel"},p.label),p.value===e&&r.createElement("svg",{className:"hc-select__check",width:"14",height:"14",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:2.5,strokeLinecap:"round",strokeLinejoin:"round","aria-hidden":!0},r.createElement("path",{d:"M5 12.5l4.5 4.5L19 7"})))))),document.body))}u();T();function Jn({value:e,onChange:t,itemPlaceholder:n}){let[o,i]=m(""),a=()=>{let s=o.trim();if(!s||e.includes(s)){i("");return}t([...e,s]),i("")},c=s=>{t(e.filter((l,d)=>d!==s))};return r.createElement("div",{className:"hc-strlist"},e.map((s,l)=>r.createElement("div",{className:"hc-strlist__item",key:s},r.createElement(F,{value:s,onChange:()=>{},readOnly:!0}),r.createElement("button",{type:"button",className:"hc-iconbtn hc-iconbtn--danger",onClick:()=>c(l),"aria-label":"\u79FB\u9664"},r.createElement(H,{size:18})))),r.createElement("div",{className:"hc-strlist__add"},r.createElement(F,{value:o,onChange:i,placeholder:n??"\u6DFB\u52A0\u4E00\u9879",onKeyDown:s=>{s.key==="Enter"&&(s.preventDefault(),a())}}),r.createElement("button",{type:"button",className:"hc-iconbtn",onClick:a,"aria-label":"\u6DFB\u52A0",disabled:!o.trim()},r.createElement(Fe,{size:18}))))}u();function S({variant:e="secondary",size:t="md",icon:n,className:o,children:i,type:a="button",...c}){let s=["hc-btn",`hc-btn--${e}`];return t!=="md"&&s.push(`hc-btn--${t}`),o&&s.push(o),r.createElement("button",{type:a,className:s.join(" "),...c},n,i!=null&&i!==!1&&r.createElement("span",null,i))}u();T();function qe(){let[e,t]=m(()=>L.list());return E(()=>{let n=()=>t(L.list());return n(),L.onChange(n)},[]),e}function Xn(e){let[,t]=m(0);return E(()=>{let n=Object.keys(e.schema).map(o=>e.subscribe(o,()=>t(i=>i+1)));return()=>{for(let o of n)o()}},[e]),e.store}function Zn(e){return e===null||typeof e!="object"?e:JSON.parse(JSON.stringify(e))}function Bo(e,t){if(e===t)return!0;try{return JSON.stringify(e)===JSON.stringify(t)}catch{return!1}}function Qn({settings:e}){let t=Xn(e),n=In(()=>Object.keys(e.schema).filter(d=>!e.schema[d].hidden),[e]),[o,i]=m(()=>_t(t,n));if(E(()=>{i(_t(t,n))},[e]),n.length===0)return null;let a=n.filter(d=>!Bo(o[d],t[d])),c=()=>{for(let d of a)t[d]=Zn(o[d])},s=()=>i(_t(t,n)),l=[];for(let d of n){let h=e.schema[d].group??"\u8BBE\u7F6E",f=l[l.length-1];f&&f.title===h?f.keys.push(d):l.push({title:h,keys:[d]})}return r.createElement(r.Fragment,null,l.map((d,h)=>r.createElement("div",{className:"hc-section",key:`${d.title}-${h}`},r.createElement("div",{className:"hc-section__title"},d.title),r.createElement("div",{className:"hc-section__body"},d.keys.map(f=>r.createElement(Go,{key:f,def:e.schema[f],value:o[f],onChange:w=>i(q=>({...q,[f]:w}))}))))),a.length>0&&r.createElement("div",{className:"hc-savebar"},r.createElement("span",{className:"hc-savebar__label"},"\u6709 ",a.length," \u9879\u672A\u4FDD\u5B58\u7684\u4FEE\u6539"),r.createElement("div",{className:"hc-savebar__actions"},r.createElement(S,{size:"sm",variant:"plain",onClick:s},"\u653E\u5F03"),r.createElement(S,{size:"sm",variant:"primary",onClick:c},"\u4FDD\u5B58"))))}function _t(e,t){let n={};for(let o of t)n[o]=Zn(e[o]);return n}function Go({def:e,value:t,onChange:n}){let o=r.createElement("div",{className:"hc-cell__main"},r.createElement("div",{className:"hc-cell__label"},e.label),e.description&&r.createElement("div",{className:"hc-cell__desc"},e.description));switch(e.type){case"boolean":return r.createElement("div",{className:"hc-cell hc-cell--row"},o,r.createElement(O,{checked:t===!0,onChange:i=>n(i),disabled:e.disabled?.(),"aria-label":e.label}));case"number":return r.createElement("div",{className:"hc-cell hc-cell--row"},o,r.createElement(Yn,{value:typeof t=="number"?t:e.default,onChange:i=>n(i),min:e.min,max:e.max,step:e.step}));case"select":return r.createElement("div",{className:"hc-cell hc-cell--row"},o,r.createElement(Ve,{value:typeof t=="string"?t:e.default,onChange:i=>n(i),options:e.options}));case"string":return r.createElement("div",{className:"hc-cell"},r.createElement("div",{className:"hc-cell--row"},o),r.createElement("div",{className:"hc-cell__control"},r.createElement(F,{value:typeof t=="string"?t:"",onChange:i=>n(i),placeholder:e.placeholder,maxLength:e.maxLength})));case"string-list":return r.createElement("div",{className:"hc-cell"},o,r.createElement("div",{className:"hc-cell__control"},r.createElement(Jn,{value:Array.isArray(t)?t:[],onChange:i=>n(i),itemPlaceholder:e.itemPlaceholder})));case"custom":{let i=e.component;return r.createElement("div",{className:"hc-cell"},o,r.createElement("div",{className:"hc-cell__control"},r.createElement(i,{value:t,onChange:n})))}default:return null}}u();var We={utility:{label:"\u5B9E\u7528\u5DE5\u5177",color:"var(--hc-accent)",Icon:be},chat:{label:"\u804A\u5929",color:"var(--hc-green)",Icon:On},voice:{label:"\u8BED\u97F3",color:"var(--hc-indigo)",Icon:Bn},appearance:{label:"\u5916\u89C2",color:"var(--hc-pink)",Icon:Gn},privacy:{label:"\u9690\u79C1",color:"var(--hc-teal)",Icon:$n},developer:{label:"\u5F00\u53D1\u8005",color:"var(--hc-orange)",Icon:jn},misc:{label:"\u5176\u4ED6",color:"var(--hc-fill-primary)",Icon:Hn}},Rn=["utility","chat","voice","appearance","privacy","developer","misc"];function er(){let e=qe().filter(l=>!l.hidden),[t,n]=m(null),[o,i]=m(""),a=t?e.find(l=>l.id===t):void 0;if(a)return r.createElement(Ho,{view:a,onBack:()=>n(null)});let c=o.trim().toLowerCase(),s=c?e.filter(l=>l.name.toLowerCase().includes(c)||l.description.toLowerCase().includes(c)):e;return r.createElement("div",null,r.createElement("div",{className:"hc-toolbar"},r.createElement("div",{className:"hc-search"},r.createElement(ye,{size:20}),r.createElement("input",{value:o,onChange:l=>i(l.currentTarget.value),placeholder:"\u641C\u7D22\u63D2\u4EF6","aria-label":"\u641C\u7D22\u63D2\u4EF6"}))),s.length===0?r.createElement(j,{icon:r.createElement(ye,{size:48}),title:"\u6CA1\u6709\u5339\u914D\u7684\u63D2\u4EF6",subtitle:"\u6362\u4E2A\u5173\u952E\u8BCD\u518D\u8BD5\u8BD5\u3002"}):Rn.map(l=>{let d=s.filter(f=>f.category===l);if(d.length===0)return null;let h=We[l];return r.createElement("div",{className:"hc-section",key:l},r.createElement("div",{className:"hc-section__title"},h.label),r.createElement("div",{className:"hc-section__body"},d.map(f=>r.createElement(jo,{key:f.id,view:f,onOpen:()=>n(f.id)}))))}))}function jo({view:e,onOpen:t}){let n=We[e.category],o=n.Icon,i=e.hasSettings||e.hasPage;return r.createElement(qn,{icon:r.createElement(o,{size:18}),iconBackground:n.color,title:e.name,subtitle:e.description,onClick:i?t:void 0,showChevron:i,accessory:r.createElement(r.Fragment,null,e.needsRestart&&r.createElement(ce,{tone:"orange"},r.createElement(se,{size:12})," \u5F85\u91CD\u542F"),e.state==="errored"&&r.createElement(ce,{tone:"red"},r.createElement(Z,{size:12})," \u51FA\u9519"),r.createElement("span",{onClick:a=>a.stopPropagation(),onKeyDown:a=>a.stopPropagation()},r.createElement(O,{checked:e.enabled,disabled:e.required,onChange:()=>L.toggle(e.id),"aria-label":`\u542F\u7528 ${e.name}`})))})}function Ho({view:e,onBack:t}){let n=L.getPlugin(e.id),o=We[e.category],i=o.Icon,a=!!(n?.settings&&Object.values(n.settings.schema).some(d=>!d.hidden)),c=!!n?.page&&a,[s,l]=m("page");return r.createElement("div",null,r.createElement("button",{type:"button",className:"hc-back",onClick:t},r.createElement(Kn,{size:20}),"\u63D2\u4EF6"),r.createElement("div",{className:"hc-detail-head"},r.createElement("div",{className:"hc-detail-head__icon",style:{background:o.color}},r.createElement(i,{size:26})),r.createElement("div",{className:"hc-detail-head__text"},r.createElement("div",{className:"hc-detail-head__name"},e.name),r.createElement("div",{className:"hc-detail-head__desc"},e.description),r.createElement("div",{className:"hc-detail-head__meta"},e.authors.map(d=>d.name).join("\u3001"))),r.createElement("span",{onClick:d=>d.stopPropagation(),onKeyDown:d=>d.stopPropagation()},r.createElement(O,{checked:e.enabled,disabled:e.required,onChange:()=>L.toggle(e.id),"aria-label":`\u542F\u7528 ${e.name}`}))),e.needsRestart&&r.createElement("div",{className:"hc-inline-note"},r.createElement(se,{size:18}),r.createElement("span",null,"\u8FD9\u4E2A\u63D2\u4EF6\u5305\u542B\u52A0\u8F7D\u671F\u8865\u4E01\uFF0C\u9700\u8981\u91CD\u542F Discord \u624D\u80FD\u5B8C\u5168\u751F\u6548\u3002")),e.state==="errored"&&r.createElement("div",{className:"hc-inline-note hc-inline-note--danger"},r.createElement(Z,{size:18}),r.createElement("span",null,"\u63D2\u4EF6\u542F\u52A8\u65F6\u629B\u51FA\u5F02\u5E38\uFF0C\u5DF2\u88AB\u81EA\u52A8\u505C\u7528\uFF0C\u8BE6\u60C5\u89C1\u65E5\u5FD7\u3002")),c&&r.createElement("div",{className:"hc-segment"},r.createElement("button",{type:"button",className:"hc-segment__item","data-active":s==="page",onClick:()=>l("page")},n.page.title||"\u8BB0\u5F55"),r.createElement("button",{type:"button",className:"hc-segment__item","data-active":s==="settings",onClick:()=>l("settings")},"\u8BBE\u7F6E")),n?.page&&(!c||s==="page")?r.createElement(n.page.component,null):n?.settings?r.createElement(Qn,{settings:n.settings}):r.createElement(j,{title:"\u6CA1\u6709\u53EF\u914D\u7F6E\u9879",subtitle:"\u8FD9\u4E2A\u63D2\u4EF6\u5F00\u7BB1\u5373\u7528\uFF0C\u65E0\u9700\u8BBE\u7F6E\u3002"}))}u();T();N();var tr=500,kt=100;function nr(){let[e,t]=m(()=>lt().slice()),[n,o]=m(0),i=ie(null);E(()=>(t(lt().slice()),dn(d=>{t(h=>{let f=h.concat(d);return f.length>tr?f.slice(f.length-tr):f})})),[]);let a=Math.max(1,Math.ceil(e.length/kt)),c=Math.min(n,a-1),s=e.length-c*kt,l=e.slice(Math.max(0,s-kt),s);return E(()=>{if(c!==0)return;let d=i.current;d&&(d.scrollTop=d.scrollHeight)},[e,c]),e.length===0?r.createElement(j,{icon:r.createElement(Q,{size:48}),title:"\u6682\u65E0\u65E5\u5FD7",subtitle:"\u8FD0\u884C\u65F6\u548C\u63D2\u4EF6\u7684\u8F93\u51FA\u4F1A\u5B9E\u65F6\u51FA\u73B0\u5728\u8FD9\u91CC\u3002"}):r.createElement("div",{className:"hc-stack"},r.createElement("div",{className:"hc-logs",ref:i},l.map((d,h)=>r.createElement("div",{className:"hc-logline","data-level":d.level,key:`${d.time}-${h}`},r.createElement("span",{className:"hc-logline__time"},Fo(d.time)),r.createElement("span",{className:"hc-logline__scope"},d.scope),r.createElement("span",{className:"hc-logline__msg"},d.parts.map(Uo).join(" "))))),a>1&&r.createElement("div",{className:"hc-pager"},r.createElement("button",{type:"button",className:"hc-tab",disabled:c>=a-1,onClick:()=>o(Math.min(a-1,c+1))},"\u2190 \u66F4\u65E9"),r.createElement("span",{className:"hc-pager__label"},c===0?"\u5B9E\u65F6":`\u7B2C ${a-c} / ${a} \u9875`),r.createElement("button",{type:"button",className:"hc-tab",disabled:c===0,onClick:()=>o(Math.max(0,c-1))},"\u66F4\u65B0 \u2192")))}function Fo(e){let t=new Date(e);return`${t.toLocaleTimeString(void 0,{hour12:!1})}.${String(t.getMilliseconds()).padStart(3,"0")}`}function Uo(e){if(typeof e=="string")return e;if(e instanceof Error)return e.stack??e.message;try{return JSON.stringify(e)}catch{return String(e)}}u();u();function z({title:e,note:t,children:n}){return r.createElement("div",{className:"hc-section"},e&&r.createElement("div",{className:"hc-section__title"},e),r.createElement("div",{className:"hc-section__body"},n),t&&r.createElement("div",{className:"hc-section__note"},t))}function rr(){let e=qe().filter(o=>!o.hidden),t=e.filter(o=>o.enabled).length;return r.createElement("div",{className:"hc-stack"},r.createElement("div",{className:"hc-about-hero"},r.createElement(He,{size:32}),r.createElement("div",null,r.createElement("div",{className:"hc-about-hero__name"},"Halcyon"),r.createElement("div",{className:"hc-about-hero__ver"},"\u7248\u672C ","0.1.9"))),r.createElement(z,{title:"\u6982\u89C8"},r.createElement(Ye,{label:"\u63D2\u4EF6\u603B\u6570",value:String(e.length)}),r.createElement(Ye,{label:"\u5DF2\u542F\u7528",value:String(t)})),r.createElement(z,{title:"\u9879\u76EE",note:"\u4FEE\u6539 Discord \u5BA2\u6237\u7AEF\u8FDD\u53CD\u5176\u670D\u52A1\u6761\u6B3E\uFF0C\u7531\u6B64\u4EA7\u751F\u7684\u4EFB\u4F55\u540E\u679C\u7531\u4F7F\u7528\u8005\u81EA\u884C\u627F\u62C5\u3002\u672C\u9879\u76EE\u4EC5\u4F9B\u6280\u672F\u7814\u7A76\u4E0E\u4E2A\u4EBA\u4F7F\u7528\u3002"},r.createElement(Ye,{label:"\u4F5C\u8005",value:"caitemm (mzrodyu)"}),r.createElement(Ye,{label:"\u8BB8\u53EF\u534F\u8BAE",value:"GPL-3.0-or-later"})))}function Ye({label:e,value:t}){return r.createElement("div",{className:"hc-cell hc-cell--row"},r.createElement("div",{className:"hc-cell__main"},r.createElement("div",{className:"hc-cell__label"},e)),r.createElement("span",{className:"hc-about__value"},t))}var St=[{id:"plugins",label:"\u63D2\u4EF6",title:"\u63D2\u4EF6",Icon:be},{id:"logs",label:"\u65E5\u5FD7",title:"\u65E5\u5FD7",Icon:Q},{id:"about",label:"\u5173\u4E8E",title:"\u5173\u4E8E Halcyon",Icon:Ue}];function or(e){switch(e){case"plugins":return r.createElement(er,null);case"logs":return r.createElement(nr,null);case"about":return r.createElement(rr,null)}}function ir({onClose:e}){let[t,n]=m("plugins"),o=St.find(i=>i.id===t)??St[0];return r.createElement("div",{className:"halcyon hc-panel"},r.createElement("nav",{className:"hc-panel__sidebar"},r.createElement("div",{className:"hc-panel__brand"},r.createElement(He,{size:24}),r.createElement("span",{className:"hc-panel__brand-name"},"Halcyon")),St.map(i=>r.createElement("button",{key:i.id,type:"button",className:"hc-navitem","data-active":i.id===t,onClick:()=>n(i.id)},r.createElement(i.Icon,{size:18}),i.label))),r.createElement("section",{className:"hc-panel__content"},r.createElement("header",{className:"hc-panel__header"},r.createElement("span",{className:"hc-title2"},o.title),e&&r.createElement("button",{type:"button",className:"hc-iconbtn",onClick:e,"aria-label":"\u5173\u95ED"},r.createElement(zn,{size:20}))),r.createElement("div",{className:"hc-panel__scroll"},or(t))))}function Je({tab:e}){return r.createElement("div",{className:"halcyon hc-embed"},or(e))}var Ko=y("settings"),U=null,Ee=null;function Xe(){if(me(),!U){U=document.createElement("div"),U.className="halcyon",document.body.appendChild(U),Ee=e=>{e.key==="Escape"&&le()},document.addEventListener("keydown",Ee);try{Ie.render(r.createElement(Vo,{onClose:le}),U)}catch(e){Ko.error("could not open settings overlay",e),le()}}}function le(){if(Ee&&(document.removeEventListener("keydown",Ee),Ee=null),U){try{Ie.unmountComponentAtNode(U)}catch{}U.remove(),U=null}}function Vo({onClose:e}){return r.createElement("div",{className:"hc-overlay",role:"dialog","aria-modal":"true","aria-label":"Halcyon \u8BBE\u7F6E",onMouseDown:t=>{t.target===t.currentTarget&&e()}},r.createElement(ir,{onClose:e}))}var K=y("settings-host");function sr(){return r.createElement(Je,{tab:"plugins"})}function cr(){return r.createElement(Je,{tab:"logs"})}function lr(){return r.createElement(Je,{tab:"about"})}function qo(e){return function(){return r.createElement(e,{size:20})}}var ar="halcyon-section",Wo=[{key:"halcyon-plugins",title:"\u63D2\u4EF6",Component:sr,Icon:be},{key:"halcyon-logs",title:"\u65E5\u5FD7",Component:cr,Icon:Q},{key:"halcyon-about",title:"\u5173\u4E8E",Component:lr,Icon:Ue}],Qe=!1,Yo=!0,wt={SECTION:1,SIDEBAR_ITEM:2,PANEL:3,CATEGORY:5,CUSTOM:20},Ze=null;function Jo(){if(Ze)return Ze;try{let e=vn("SECTION","SIDEBAR_ITEM","PANEL","CUSTOM");if(e&&typeof e.SECTION=="number")return Ze={SECTION:e.SECTION,SIDEBAR_ITEM:e.SIDEBAR_ITEM,PANEL:e.PANEL,CATEGORY:typeof e.CATEGORY=="number"?e.CATEGORY:wt.CATEGORY,CUSTOM:e.CUSTOM},Ze}catch(e){K.warn("could not resolve settings layout types; using fallback values",e)}return wt}function R(e){try{if(e&&typeof e.buildLayout=="function"){let t=e.buildLayout();if(Array.isArray(t))return t}}catch{}return[]}function dr(e){let t={...wt};try{let n=Array.isArray(e)?e[0]:void 0;n&&typeof n.type=="number"&&(t.SECTION=n.type);for(let o of e)for(let i of R(o))if(typeof i?.type=="number"){t.SIDEBAR_ITEM=i.type;for(let a of R(i))if(typeof a?.type=="number"){t.PANEL=a.type;for(let c of R(a))if(typeof c?.type=="number"){t.CATEGORY=c.type;for(let s of R(c))if(s&&typeof s.type=="number"&&"Component"in s)return t.CUSTOM=s.type,t}}}}catch(n){K.warn("could not read layout types from the live tree; using fallbacks",n)}return t}function Xo(e,t){let n={key:`${t.key}-panel`,type:e.PANEL,useTitle:()=>t.title,buildLayout:()=>[{key:`${t.key}-category`,type:e.CATEGORY,buildLayout:()=>[{key:`${t.key}-custom`,type:e.CUSTOM,Component:t.Component,useSearchTerms:()=>[t.title]}]}]};return{key:t.key,type:e.SIDEBAR_ITEM,useTitle:()=>t.title,icon:qo(t.Icon),buildLayout:()=>[n]}}function Ce(e){let t={};if(e&&typeof e=="object")for(let n of Object.keys(e)){let o=e[n];typeof o=="function"&&(t[n]=String(o).replace(/\s+/g," ").slice(0,400))}return t}function ur(e,t){if(!e||typeof e!="object")return{raw:typeof e};let n={key:e.key,type:e.type,fields:Object.keys(e)};if(t>0&&typeof e.buildLayout=="function")try{let o=e.buildLayout();Array.isArray(o)&&(n.children=o.slice(0,6).map(i=>ur(i,t-1)))}catch(o){n.childrenError=String(o)}return n}function Zo(e){if(!Qe){Qe=!0;try{let t=e[0],n=R(t)[0],o=R(n)[0],i=R(o)[0],a=R(i)[0],c={resolvedTypesFromEnum:Jo(),resolvedTypesFromLive:dr(e),topLevelCount:e.length,sampleSources:{section:Ce(t),sidebarItem:Ce(n),panel:Ce(o),category:Ce(i),leaf:Ce(a)},layout:e.slice(0,12).map(s=>ur(s,2))};globalThis.__halcyonLayoutProbe=JSON.stringify(c,null,2),K.info("[embed-probe] captured Discord's settings layout shape. In the console run  copy(__halcyonLayoutProbe)  and paste the result back.")}catch(t){K.warn("[embed-probe] failed to capture layout shape",t)}}}function Qo(){return[{section:"HEADER",label:"HALCYON"},{section:"halcyon-plugins",label:"\u63D2\u4EF6",element:sr},{section:"halcyon-logs",label:"\u65E5\u5FD7",element:cr},{section:"halcyon-about",label:"\u5173\u4E8E",element:lr}]}var Pe=null,hr=G({id:"halcyon-settings",name:"Halcyon \u8BBE\u7F6E",description:"Halcyon \u81EA\u8EAB\u7684\u8BBE\u7F6E\u754C\u9762\u5BBF\u4E3B\u3002",authors:[{name:"caitemm"}],category:"misc",required:!0,hidden:!0,patches:[{label:"user-settings-layout",find:".buildLayout().map",replacement:{match:/([A-Za-z_$][\w$]*)\.buildLayout\(\)(?=\.map)/,replace:"$self.buildLayout($1)"}},{label:"user-settings-sidebar",find:"getPredicateSections",replacement:{match:/getPredicateSections\(\)(\{(?:[^{}]|\{(?:[^{}]|\{[^{}]*\})*\})*\})/,replace:(e,t)=>`getPredicateSections(){return $self.injectSections((()=>${t})())}`}}],buildLayout(e){let t=e.buildLayout();try{if(!e||e.key!=="$Root"||!Array.isArray(t)||(Zo(t),!Yo)||t.some(a=>a?.key===ar))return t;let n=dr(t),o={key:ar,type:n.SECTION,useTitle:()=>"HALCYON",buildLayout:()=>Wo.map(a=>Xo(n,a))},i=t.findIndex(a=>a?.key==="billing_section");return i<0&&(i=t.findIndex(a=>a?.key==="user_section")),i<0&&(i=Math.min(2,t.length)),t.splice(i,0,o),K.info(`native settings embed active \u2014 section inserted at index ${i}/${t.length}`),t}catch(n){return K.error("failed to inject settings section into layout",n),t}},injectSections(e){try{if(!Array.isArray(e)||e.some(i=>i?.section==="halcyon-plugins"))return e;let t=Qo(),n=e.slice(),o=n.findIndex(i=>i&&i.section==="DIVIDER");return o>=0?n.splice(o+1,0,...t):n.push({section:"DIVIDER"},...t),Qe||(Qe=!0,K.info(`native settings embed active (legacy) \u2014 ${e.length} base sections`)),n}catch(t){return K.error("failed to inject settings sections",t),e}},start(){me(),Pe=e=>{(e.ctrlKey||e.metaKey)&&e.shiftKey&&e.code==="KeyH"&&(e.preventDefault(),Xe())},window.addEventListener("keydown",Pe),K.info("settings host ready \u2014 open with Ctrl/Cmd+Shift+H")},stop(){Pe&&(window.removeEventListener("keydown",Pe),Pe=null),le()}});u();u();N();var Te=y("patcher"),Re=Symbol("halcyon.patch");function Ro(e,t){let n=e[t];if(n&&n[Re])return n[Re];if(typeof n!="function")throw new TypeError(`cannot patch "${t}": not a function`);let o={before:new Set,instead:new Set,after:new Set,original:n},i=function(...a){let c={args:a,result:void 0,self:this,callOriginal:()=>o.original.apply(this,c.args)};for(let s of o.before)try{s(c)}catch(l){Te.error(`before-hook on "${t}" threw`,l)}if(o.instead.size){let s,l=!1;for(let d of o.instead)try{s=d(c),l=!0}catch(h){Te.error(`instead-hook on "${t}" threw; falling back to original`,h),s=c.callOriginal(),l=!0}c.result=l?s:c.callOriginal()}else try{c.result=o.original.apply(this,c.args)}catch(s){throw s}for(let s of o.after)try{s(c)}catch(l){Te.error(`after-hook on "${t}" threw`,l)}return c.result};return Object.defineProperty(i,"name",{value:n.name,configurable:!0}),Object.defineProperty(i,"length",{value:n.length,configurable:!0}),i.toString=()=>o.original.toString(),i[Re]=o,Object.assign(i,n),e[t]=i,o}function ei(e,t,n){n.before.size||n.instead.size||n.after.size||e[t]&&e[t][Re]===n&&(e[t]=n.original)}function It(e,t,n,o){if(t==null)return Te.error(`refusing to patch "${n}" on a null target`),()=>{};let i;try{i=Ro(t,n)}catch(c){return Te.error(c),()=>{}}i[e].add(o);let a=!0;return()=>{a&&(a=!1,i[e].delete(o),ei(t,n,i))}}var pr={before(e,t,n){return It("before",e,t,n)},after(e,t,n){return It("after",e,t,n)},instead(e,t,n){return It("instead",e,t,n)}};J();ue();T();N();u();u();N();u();var fr=y("settings");function Pt(e){return e===null||typeof e!="object"?e:JSON.parse(JSON.stringify(e))}function ee(e){let t=new Map,n=null,o={};for(let s of Object.keys(e))o[s]=Pt(e[s].default);let i=()=>{n&&fe(n,o)},a=(s,l,d)=>{let h=t.get(s);if(h)for(let f of h)try{f(l,d)}catch(w){fr.error(`settings listener for "${s}" threw`,w)}},c=new Proxy(o,{get:(s,l)=>s[l],set:(s,l,d)=>{if(!(l in e))return fr.warn(`ignoring write to unknown setting "${l}"`),!0;let h=s[l];return Object.is(h,d)||(s[l]=d,i(),a(l,d,h)),!0}});return{schema:e,store:c,subscribe(s,l){let d=s,h=t.get(d);return h||(h=new Set,t.set(d,h)),h.add(l),()=>void h.delete(l)},reset(s){if(s!=null){c[s]=Pt(e[s].default);return}for(let l of Object.keys(e))c[l]=Pt(e[l].default)},__bind(s){n=s;let l=ae(s);for(let d of Object.keys(e))Object.prototype.hasOwnProperty.call(l,d)&&(o[d]=l[d])}}}var M=ee({keepDeletedInChat:{group:"\u8BB0\u5F55",type:"boolean",default:!0,label:"\u5728\u804A\u5929\u4E2D\u4FDD\u7559\u88AB\u5220\u6D88\u606F",description:"\u88AB\u5220\u9664\u7684\u6D88\u606F\u4E0D\u518D\u6D88\u5931\uFF0C\u800C\u662F\u6807\u8BB0\u4FDD\u7559\u5728\u539F\u4F4D\u3002\u9700\u8981\u5BA2\u6237\u7AEF\u8865\u4E01\u751F\u6548\u3002"},logEdits:{group:"\u8BB0\u5F55",type:"boolean",default:!0,label:"\u8BB0\u5F55\u7F16\u8F91\u5386\u53F2",description:"\u4FDD\u5B58\u6BCF\u6761\u6D88\u606F\u88AB\u7F16\u8F91\u524D\u7684\u5185\u5BB9\u3002"},retention:{group:"\u8BB0\u5F55",type:"number",default:50,label:"\u6BCF\u9891\u9053\u4FDD\u7559\u6761\u6570",description:"0 \u8868\u793A\u4E0D\u9650\u5236\u3002\u4E0A\u9650 500\u3002",min:0,max:500,step:10},deleteStyle:{group:"\u5916\u89C2",type:"select",default:"tint",label:"\u5220\u9664 / \u7F16\u8F91\u6837\u5F0F",description:"\u88AB\u5220\u6D88\u606F\u3001\u4EE5\u53CA\u7F16\u8F91\u6D88\u606F\u4E0A\u65B9\u65E7\u7248\u672C\u5185\u5BB9\u5728\u804A\u5929\u4E2D\u7684\u5448\u73B0\u65B9\u5F0F\u3002",options:[{value:"tint",label:"\u7EA2\u8272\u5E95\u7EB9 + \u5DE6\u4FA7\u7EA2\u6761"},{value:"text",label:"\u6B63\u6587\u53D8\u7EA2"},{value:"ghost",label:"\u534A\u900F\u660E\u6DE1\u51FA"},{value:"strike",label:"\u7EA2\u8272\u5220\u9664\u7EBF"}]},showDeletedMarker:{group:"\u5916\u89C2",type:"boolean",default:!0,label:"\u663E\u793A\u5220\u9664\u6807\u8BB0\u884C",description:"\u5728\u88AB\u5220\u6D88\u606F\u4E0B\u65B9\u663E\u793A\u201C\u6B64\u6D88\u606F\u5DF2\u5220\u9664\u201D\u4E0E\u5220\u9664\u65F6\u95F4\u3002"},showEditedMarker:{group:"\u5916\u89C2",type:"boolean",default:!0,label:"\u663E\u793A\u7F16\u8F91\u6807\u8BB0\u884C",description:"\u5728\u7F16\u8F91\u8FC7\u7684\u6D88\u606F\u65C1\u663E\u793A\u201C\u6B64\u6D88\u606F\u5DF2\u7F16\u8F91\u201D\u4E0E\u7F16\u8F91\u65F6\u95F4\uFF08\u6CBF\u7528\u4E0B\u65B9\u6807\u8BB0\u7684\u56FE\u6807 / \u5916\u89C2 / \u65F6\u95F4\u8BBE\u7F6E\uFF09\u3002"},markerIcon:{group:"\u5916\u89C2",type:"select",default:"trash",label:"\u6807\u8BB0\u56FE\u6807",description:"\u6807\u8BB0\u884C\u524D\u7684\u56FE\u6807\uFF08\u5220\u9664 / \u7F16\u8F91\u901A\u7528\uFF09\u3002",options:[{value:"trash",label:"\u{1F5D1} \u5783\u573E\u6876"},{value:"shield",label:"\u{1F6E1} \u76FE\u724C"},{value:"warning",label:"\u26A0 \u8B66\u544A\u4E09\u89D2"},{value:"none",label:"\u65E0\u56FE\u6807"}]},markerLook:{group:"\u5916\u89C2",type:"select",default:"plain",label:"\u6807\u8BB0\u5916\u89C2",description:"\u6807\u8BB0\u884C\u7684\u5448\u73B0\u65B9\u5F0F\uFF08\u5220\u9664 / \u7F16\u8F91\u901A\u7528\uFF09\u3002",options:[{value:"plain",label:"\u7EAF\u6587\u5B57"},{value:"badge",label:"\u5706\u89D2\u5FBD\u7AE0"},{value:"quote",label:"\u5F15\u7528\u5757\uFF08\u5DE6\u4FA7\u7AD6\u6761\uFF09"}]},markerTime:{group:"\u5916\u89C2",type:"select",default:"time",label:"\u6807\u8BB0\u65F6\u95F4\u683C\u5F0F",description:"\u6807\u8BB0\u884C\u91CC\u65F6\u95F4\u7684\u663E\u793A\u65B9\u5F0F\u3002",options:[{value:"time",label:"\u4EC5\u65F6\u95F4\uFF0803:19:42\uFF09"},{value:"datetime",label:"\u65E5\u671F + \u65F6\u95F4"},{value:"none",label:"\u4E0D\u663E\u793A\u65F6\u95F4"}]},ignoreBots:{group:"\u5C4F\u853D\u5BF9\u8C61",type:"boolean",default:!1,label:"\u5C4F\u853D\u673A\u5668\u4EBA",description:"\u673A\u5668\u4EBA\u7684\u6D88\u606F\u4E0D\u8BB0\u5F55\u3001\u4E0D\u5728\u804A\u5929\u4E2D\u4FDD\u7559\u3002"},ignoreSelf:{group:"\u5C4F\u853D\u5BF9\u8C61",type:"boolean",default:!1,label:"\u5C4F\u853D\u81EA\u5DF1",description:"\u4F60\u81EA\u5DF1\u5220\u9664\u6216\u7F16\u8F91\u7684\u6D88\u606F\u4E0D\u8BB0\u5F55\u3001\u4E0D\u5728\u804A\u5929\u4E2D\u4FDD\u7559\u3002"},ignoredUsers:{group:"\u5C4F\u853D\u5BF9\u8C61",type:"string-list",default:[],label:"\u5C4F\u853D\u7684\u7528\u6237",description:"\u8FD9\u4E9B\u7528\u6237\u7684\u6D88\u606F\u4E0D\u8BB0\u5F55\u3001\u4E0D\u5728\u804A\u5929\u4E2D\u4FDD\u7559\u3002",itemPlaceholder:"\u7528\u6237 ID"},ignoredChannels:{group:"\u5C4F\u853D\u5BF9\u8C61",type:"string-list",default:[],label:"\u5C4F\u853D\u7684\u9891\u9053",description:"\u8FD9\u4E9B\u9891\u9053\u91CC\u7684\u6D88\u606F\u4E0D\u8BB0\u5F55\u3001\u4E0D\u5728\u804A\u5929\u4E2D\u4FDD\u7559\u3002",itemPlaceholder:"\u9891\u9053 ID"}});u();N();var ii=y("message-logger"),mr="message-logger.log",Tt=class{deleted=[];edited=[];retention=50;listeners=new Set;saveTimer;deletedIndex=new Set;load(){let t=ae(mr);this.deleted=Array.isArray(t.deleted)?t.deleted:[],this.edited=Array.isArray(t.edited)?t.edited:[],this.trimDeleted(),this.reindex()}isDeleted(t,n){return this.deletedIndex.has(`${t}:${n}`)}findDeleted(t,n){if(this.isDeleted(t,n))return this.deleted.find(o=>o.channelId===t&&o.id===n)}setRetention(t){this.retention=Math.max(0,t|0),this.trimDeleted(),this.reindex(),this.scheduleSave(),this.emit()}recordDeleted(t){this.deleted.some(n=>n.id===t.id)||(this.deleted.unshift(t),this.trimDeleted(),this.reindex(),this.scheduleSave(),this.emit())}recordEdit(t,n,o,i,a){let c=Date.now(),s=this.edited.find(l=>l.id===t);if(!s)s={id:t,channelId:n,guildId:a,author:o,history:[{content:i,at:c}],updatedAt:c},this.edited.unshift(s);else{if(s.history[s.history.length-1]?.content===i)return;s.history.push({content:i,at:c}),s.updatedAt=c}this.edited.length>300&&(this.edited.length=300),this.scheduleSave(),this.emit()}getDeleted(){return this.deleted}getEdited(){return this.edited}counts(){return{deleted:this.deleted.length,edited:this.edited.length}}clear(){this.deleted=[],this.edited=[],this.reindex(),this.scheduleSave(),this.emit()}toJSON(){return JSON.stringify({deleted:this.deleted,edited:this.edited},null,2)}subscribe(t){return this.listeners.add(t),()=>void this.listeners.delete(t)}flush(){this.saveTimer!==void 0&&(clearTimeout(this.saveTimer),this.saveTimer=void 0),this.save()}trimDeleted(){if(this.retention<=0)return;let t=new Map;this.deleted=this.deleted.filter(n=>{let o=t.get(n.channelId)??0;return o>=this.retention?!1:(t.set(n.channelId,o+1),!0)})}reindex(){this.deletedIndex=new Set(this.deleted.map(t=>`${t.channelId}:${t.id}`))}emit(){for(let t of this.listeners)try{t()}catch{}}scheduleSave(){this.saveTimer!==void 0&&clearTimeout(this.saveTimer),this.saveTimer=setTimeout(()=>this.save(),500)}save(){try{fe(mr,{deleted:this.deleted,edited:this.edited})}catch(t){ii.error("failed to persist message log",t)}}},I=new Tt;u();var Mt=/<(a)?:([A-Za-z0-9_]+):(\d+)>/g;function De(e){let t=[],n=0,o=0;Mt.lastIndex=0;for(let i=Mt.exec(e);i;i=Mt.exec(e)){i.index>n&&t.push(r.createElement("span",{key:o++},e.slice(n,i.index)));let[,a,c,s]=i;t.push(r.createElement("img",{key:o++,className:"hc-emoji",src:`https://cdn.discordapp.com/emojis/${s}.${a?"gif":"webp"}`,alt:`:${c}:`,title:`:${c}:`,draggable:!1,loading:"lazy"})),n=i.index+i[0].length}return t.length===0?e:(n<e.length&&t.push(r.createElement("span",{key:o++},e.slice(n))),t)}u();T();ue();N();var ai=y("message-logger");function si(){let[e,t]=m(()=>({deleted:I.getDeleted(),edited:I.getEdited()}));return E(()=>{let n=()=>t({deleted:I.getDeleted(),edited:I.getEdited()});return n(),I.subscribe(n)},[]),e}var Dt=25;function yr(){let{deleted:e,edited:t}=si(),[n,o]=m("deleted"),[i,a]=m({deleted:0,edited:0}),c=n==="deleted"?e:t,s=Math.max(1,Math.ceil(c.length/Dt)),l=Math.min(i[n],s-1),d=c.slice(l*Dt,(l+1)*Dt),h=f=>a(w=>({...w,[n]:Math.max(0,Math.min(s-1,f))}));return r.createElement("div",null,r.createElement("div",{className:"hc-tabs"},r.createElement("button",{type:"button",className:"hc-tab","data-active":n==="deleted",onClick:()=>o("deleted")},r.createElement(H,{size:16})," \u5DF2\u5220\u9664",e.length>0&&r.createElement(ce,{tone:"red"},e.length)),r.createElement("button",{type:"button",className:"hc-tab","data-active":n==="edited",onClick:()=>o("edited")},r.createElement(xt,{size:16})," \u5DF2\u7F16\u8F91",t.length>0&&r.createElement(ce,{tone:"orange"},t.length)),r.createElement("div",{className:"hc-tabs__spacer"}),r.createElement(S,{size:"sm",variant:"plain",icon:r.createElement(Fn,{size:16}),onClick:hi},"\u5BFC\u51FA"),r.createElement(S,{size:"sm",variant:"destructive",onClick:()=>I.clear(),disabled:c.length===0},"\u6E05\u7A7A")),c.length===0?n==="deleted"?r.createElement(j,{icon:r.createElement(H,{size:48}),title:"\u8FD8\u6CA1\u6709\u8BB0\u5F55",subtitle:"\u88AB\u5220\u9664\u7684\u6D88\u606F\u4F1A\u5728\u8FD9\u91CC\u4FDD\u7559\uFF0C\u542F\u7528\u63D2\u4EF6\u540E\u5373\u65F6\u751F\u6548\u3002"}):r.createElement(j,{icon:r.createElement(xt,{size:48}),title:"\u8FD8\u6CA1\u6709\u7F16\u8F91\u8BB0\u5F55",subtitle:"\u6D88\u606F\u88AB\u7F16\u8F91\u524D\u7684\u5185\u5BB9\u4F1A\u4FDD\u7559\u5728\u8FD9\u91CC\u3002"}):r.createElement(r.Fragment,null,r.createElement("div",{className:"hc-msglist"},n==="deleted"?d.map(f=>r.createElement(li,{key:`${f.channelId}-${f.id}`,entry:f})):d.map(f=>r.createElement(di,{key:`${f.channelId}-${f.id}`,entry:f}))),s>1&&r.createElement(ci,{page:l,pageCount:s,onChange:h})))}function ci(e){let{page:t,pageCount:n,onChange:o}=e;return r.createElement("div",{className:"hc-pager"},r.createElement(S,{size:"sm",variant:"plain",onClick:()=>o(t-1),disabled:t===0},"\u4E0A\u4E00\u9875"),r.createElement("span",{className:"hc-pager__label"},"\u7B2C ",t+1," / ",n," \u9875"),r.createElement(S,{size:"sm",variant:"plain",onClick:()=>o(t+1),disabled:t>=n-1},"\u4E0B\u4E00\u9875"))}function li({entry:e}){return r.createElement("div",{className:"hc-msg"},r.createElement("div",{className:"hc-msg__head"},r.createElement("span",{className:"hc-msg__author"},e.author.name),e.author.bot&&r.createElement(ce,{tone:"neutral"},"BOT"),r.createElement(br,{channelId:e.channelId,guildId:e.guildId}),r.createElement("span",{className:"hc-msg__time"},vr(e.deletedAt))),r.createElement("div",{className:"hc-msg__body"},e.content?De(e.content):e.stickers?.length?r.createElement("span",null,"\u{1F3F7}\uFE0F \u8D34\u7EB8\uFF1A",e.stickers.map(t=>t.name).join("\u3001")):e.attachmentsRich?.length||e.embeds?.length?r.createElement("span",null,"\u{1F5BC}\uFE0F \u5A92\u4F53\u6D88\u606F"):r.createElement("span",{className:"hc-msg__empty"},"\uFF08\u65E0\u6587\u672C\u5185\u5BB9\uFF09")),(e.attachmentsRich?.length??0)>0&&r.createElement("div",{className:"hc-msg__media"},e.attachmentsRich.map((t,n)=>(t.content_type??"").startsWith("image/")||(t.content_type??"").startsWith("video/")?r.createElement("img",{key:n,className:"hc-msg__thumb",src:t.proxy_url??t.url,alt:t.filename??"\u9644\u4EF6",loading:"lazy"}):r.createElement("a",{key:n,href:t.url,target:"_blank",rel:"noreferrer"},"\u{1F4CE} ",t.filename??"\u9644\u4EF6"))),!e.attachmentsRich?.length&&e.attachments.length>0&&r.createElement("div",{className:"hc-msg__meta"},"\u9644\u4EF6 ",e.attachments.length," \u4E2A"))}function di({entry:e}){return r.createElement("div",{className:"hc-msg"},r.createElement("div",{className:"hc-msg__head"},r.createElement("span",{className:"hc-msg__author"},e.author.name),r.createElement(br,{channelId:e.channelId,guildId:e.guildId}),r.createElement("span",{className:"hc-msg__time"},vr(e.updatedAt))),r.createElement("div",{className:"hc-msg__versions"},e.history.map((t,n)=>r.createElement("div",{className:"hc-msg__version",key:n},r.createElement("span",{className:"hc-msg__vtag"},"v",n+1),r.createElement("span",{className:"hc-msg__vbody"},t.content?De(t.content):"\uFF08\u7A7A\uFF09")))))}function ui(e,t){let n,o=t,i=!1;try{let s=Me.getChannel?.(e);s&&(s.name&&(n=String(s.name)),o=o??s.guild_id??s.guildId??void 0,i=s.type===1||s.type===3)}catch{}let a;try{if(o){let s=de.getGuild?.(o);s?.name&&(a=String(s.name))}}catch{}let c=n?`#${n}`:i?"\u79C1\u4FE1":`#${e}`;return{guild:a,channel:c}}function br({channelId:e,guildId:t}){let n=ui(e,t);return r.createElement("span",{className:"hc-msg__where"},n.guild&&r.createElement("span",{className:"hc-msg__guild"},n.guild),n.guild&&r.createElement("span",{className:"hc-msg__sep"},"\u203A"),r.createElement("span",null,n.channel))}function vr(e){let t=new Date(e),n=o=>String(o).padStart(2,"0");return`${n(t.getMonth()+1)}-${n(t.getDate())} ${n(t.getHours())}:${n(t.getMinutes())}`}function hi(){try{let e=new Blob([I.toJSON()],{type:"application/json"}),t=URL.createObjectURL(e),n=document.createElement("a");n.href=t,n.download=`halcyon-message-log-${Date.now()}.json`,document.body.appendChild(n),n.click(),n.remove(),URL.revokeObjectURL(t)}catch(e){ai.error("export failed",e)}}var D=y("message-logger"),At,Lt,$t;function jt(e){if(typeof e=="number")return e;if(typeof e=="string"){let t=Date.parse(e);return Number.isNaN(t)?Date.now():t}if(e&&typeof e.valueOf=="function"){let t=e.valueOf();if(typeof t=="number")return t}return Date.now()}function pi(e){return e?.globalName||e?.global_name||e?.username||e?.name||"\u672A\u77E5\u7528\u6237"}function Ir(e){return{id:String(e?.id??"0"),name:pi(e),bot:!!e?.bot}}function Nr(e){let t=e?.attachments;return Array.isArray(t)?t.map(n=>n?.filename||n?.url||"\u9644\u4EF6").slice(0,20):[]}function Er(e){let t=e?.attachments;return Array.isArray(t)?t.map(n=>({id:n?.id!=null?String(n.id):void 0,filename:n?.filename??n?.fileName??void 0,url:n?.url??void 0,proxy_url:n?.proxy_url??n?.proxyURL??n?.proxyUrl??void 0,content_type:n?.content_type??n?.contentType??void 0,width:typeof n?.width=="number"?n.width:void 0,height:typeof n?.height=="number"?n.height:void 0,size:typeof n?.size=="number"?n.size:void 0})).filter(n=>n.url||n.proxy_url).slice(0,10):[]}function Cr(e){let t=e?.embeds;if(!Array.isArray(t)||t.length===0)return[];try{return JSON.parse(JSON.stringify(t)).slice(0,6)}catch{return[]}}function Pr(e){let t=e?.sticker_items??e?.stickerItems??e?.stickers;return Array.isArray(t)?t.filter(n=>n?.id!=null).map(n=>({id:String(n.id),name:String(n.name??"\u8D34\u7EB8"),format_type:typeof n.format_type=="number"?n.format_type:n.formatType})).slice(0,4):[]}function gi(){try{return ve.getCurrentUser?.()?.id}catch{return}}function nt(e,t){let n=M.store;return!!(e&&n.ignoredChannels.includes(e)||t?.id&&n.ignoredUsers.includes(t.id)||n.ignoreBots&&t?.bot||n.ignoreSelf&&t?.id&&t.id===gi())}var te=new Map,fi=4e3;function Ot(e,t,n){let o=n?.content;if(!e||!t||typeof o!="string")return;let i=`${e}:${t}`,a=te.get(i);a&&te.delete(i);let c=Pr(n),s=Er(n),l=Cr(n);if(te.set(i,{content:o,author:n?.author??a?.author,attachments:Array.isArray(n?.attachments)?Nr(n):a?.attachments,attachmentsRich:s.length?s:a?.attachmentsRich,embeds:l.length?l:a?.embeds,stickers:c.length?c:a?.stickers,sentAt:n?.timestamp!=null?jt(n.timestamp):a?.sentAt,guildId:n?.guild_id??n?.guildId??a?.guildId}),te.size>fi){let d=te.keys().next().value;d!==void 0&&te.delete(d)}}function Ht(e,t){try{return Et.getMessage(e,t)}catch{return}}function xr(e,t){if(!e||!t)return;let n=Ht(e,t),o=te.get(`${e}:${t}`);if(!n&&!o){D.debug(`delete of ${t} skipped: message not in cache or shadow`);return}let i=n?.author??o?.author??{};if(nt(e,i))return;let a=typeof n?.content=="string"&&n.content!==""?n.content:o?.content??"",c=n?Nr(n):o?.attachments??[],s=n?Er(n):[],l=s.length?s:o?.attachmentsRich??[],d=n?Cr(n):[],h=d.length?d:o?.embeds??[],f=n?Pr(n):[],w=f.length?f:o?.stickers??[];if(!(!a&&c.length===0&&l.length===0&&h.length===0&&w.length===0)&&(I.recordDeleted({id:String(t),channelId:String(e),guildId:n?.guild_id??n?.guildId??o?.guildId??void 0,author:Ir(i),content:a,attachments:c,attachmentsRich:l.length?l:void 0,embeds:h.length?h:void 0,stickers:w.length?w:void 0,sentAt:n?.timestamp!=null?jt(n.timestamp):o?.sentAt??Date.now(),deletedAt:Date.now()}),n&&M.store.keepDeletedInChat))try{n.deleted=!0}catch{}}function mi(e){if(!M.store.logEdits||!e)return;let t=e.channel_id??e.channelId,n=e.id;if(!t||!n||typeof e.content!="string")return;let o=`${t}:${n}`,i=Ht(t,n),a=te.get(o),c=a?.content??(typeof i?.content=="string"?i.content:void 0);if(Ot(t,n,e),c===void 0){D.debug(`edit to ${n} skipped: no prior content known (message predates the recorder)`);return}if(c===e.content)return;let s=i?.author??a?.author??e.author??{};if(nt(t,s))return;let l=e.guild_id??e.guildId??i?.guild_id??a?.guildId;I.recordEdit(String(n),String(t),Ir(s),c,l!=null?String(l):void 0)}function yi(e){let t=(e.attachmentsRich??[]).map((n,o)=>({id:n.id??`${e.id}${o}`,filename:n.filename??"attachment",url:n.url??n.proxy_url,proxy_url:n.proxy_url??n.url,content_type:n.content_type,width:n.width,height:n.height,size:n.size??0,spoiler:!1}));return{id:e.id,type:0,channel_id:e.channelId,guild_id:e.guildId,sticker_items:e.stickers?.length?e.stickers:void 0,content:e.content||(t.length===0&&e.attachments.length?`\u{1F4CE} ${e.attachments.join(", ")}`:""),author:{id:e.author.id,username:e.author.name,global_name:e.author.name,discriminator:"0000",bot:e.author.bot,avatar:null},timestamp:new Date(e.sentAt).toISOString(),attachments:t,embeds:e.embeds??[],mentions:[],mention_roles:[],mention_everyone:!1,pinned:!1,tts:!1,flags:0}}function tt(e,t){try{let n=BigInt(e),o=BigInt(t);return n<o?-1:n>o?1:0}catch{return e<t?-1:e>t?1:0}}var _r=new WeakSet;function bi(e){if(!M.store.keepDeletedInChat||_r.has(e))return;_r.add(e);let t=String(e.channelId??e.channel_id??""),n=e.messages;if(!t||!Array.isArray(n))return;let o=I.getDeleted().filter(l=>l.channelId===t);if(!o.length)return;let i=new Set(n.map(l=>String(l?.id))),a;for(let l of n){let d=l?.id!=null?String(l.id):void 0;d&&(a===void 0||tt(d,a)<0)&&(a=d)}let c=o.filter(l=>!i.has(l.id)&&(a===void 0||tt(l.id,a)>=0)&&!nt(t,l.author));if(!c.length)return;let s=n.length>=2?tt(String(n[0].id),String(n[n.length-1].id))>0:!0;n.push(...c.map(yi)),n.sort((l,d)=>{let h=tt(String(l?.id??"0"),String(d?.id??"0"));return s?-h:h}),D.info(`revived ${c.length} deleted message(s) into ${t}`)}function vi(e){if(!M.store.keepDeletedInChat)return;let t=String(e.channelId??e.channel_id??"");if(t)for(let n of I.getDeleted()){if(n.channelId!==t)continue;let o=Ht(t,n.id);if(o&&!o.deleted)try{o.deleted=!0}catch{}}}function xi(e,t){try{if(t==="MESSAGE_CREATE"){let n=e.message;Ot(n?.channel_id??n?.channelId??e.channelId,n?.id,n)}else if(t==="LOAD_MESSAGES_SUCCESS"){let n=e.channelId??e.channel_id;if(Array.isArray(e.messages))for(let o of e.messages)Ot(o?.channel_id??n,o?.id,o)}}catch{}}var kr=!1,zt=0;function Bt(e){let t=e?.type;if(typeof t=="string"){if(Gt.includes(t)&&zt++,xi(e,t),t==="LOAD_MESSAGES_SUCCESS")try{bi(e),setTimeout(()=>vi(e),0)}catch(n){D.error("failed to revive deleted messages on channel load",n)}try{if(t==="MESSAGE_DELETE")xr(e.channelId??e.channel_id,e.id??e.messageId);else if(t==="MESSAGE_DELETE_BULK"){let n=e.channelId??e.channel_id;for(let o of e.ids??[])xr(n,o)}else if(t==="MESSAGE_UPDATE")mi(e.message);else return;kr||(kr=!0,D.info(`recorder saw its first ${t}`))}catch(n){D.error("recorder failed for",t,n)}}}function _i(e){Bt(e.args[0])}var Gt=["MESSAGE_CREATE","MESSAGE_UPDATE","MESSAGE_DELETE","MESSAGE_DELETE_BULK","LOAD_MESSAGES_SUCCESS"];function ki(e,t){let n=[],o=[];if(typeof e.addInterceptor=="function")try{let i=a=>(Bt(a),!1);e.addInterceptor(i),n.push(()=>{let a=e._interceptors;if(Array.isArray(a)){let c=a.indexOf(i);c>=0&&a.splice(c,1)}}),o.push("interceptor")}catch{}for(let i of["dispatch","_dispatch"])if(typeof e[i]=="function"){try{n.push(pr.before(e,i,_i)),o.push(i)}catch{}break}if(typeof e.subscribe=="function")try{let i=a=>Bt(a);for(let a of Gt)e.subscribe(a,i);n.push(()=>{if(typeof e.unsubscribe=="function")for(let a of Gt)try{e.unsubscribe(a,i)}catch{}}),o.push("subscribe")}catch{}return D.info(`recorder on dispatcher ${t}: seams [${o.join(", ")||"none"}]`),()=>n.forEach(i=>i())}function Si(){let e=new Set,t=[],n=()=>{let c=[...bn(oe),Nt()].filter(Boolean),s=0;for(let l of c)e.has(l)||(e.add(l),t.push(ki(l,`#${e.size}`)),s++);return s},o=n();D.info(`recorder attached to ${o} dispatcher instance(s)`);let i=setInterval(()=>{let c=n();c>0&&D.info(`recorder attached to ${c} late dispatcher instance(s)`)},5e3),a=setTimeout(()=>clearInterval(i),6e4);return()=>{clearInterval(i),clearTimeout(a),t.forEach(c=>c())}}var wi={trash:()=>r.createElement(r.Fragment,null,r.createElement("path",{d:"M4.5 7h15"}),r.createElement("path",{d:"M9.25 7V5.5A1.5 1.5 0 0110.75 4h2.5a1.5 1.5 0 011.5 1.5V7"}),r.createElement("path",{d:"M6.5 7l.85 11.1A2 2 0 009.34 20h5.32a2 2 0 001.99-1.9L17.5 7"})),shield:()=>r.createElement(r.Fragment,null,r.createElement("path",{d:"M12 3.5l7 2.6v5c0 4.4-3 7.3-7 8.9-4-1.6-7-4.5-7-8.9v-5l7-2.6z"}),r.createElement("path",{d:"M9.5 12l1.8 1.8 3.2-3.6"})),warning:()=>r.createElement(r.Fragment,null,r.createElement("path",{d:"M12 4.5L3.5 19h17L12 4.5z"}),r.createElement("path",{d:"M12 10v4"}),r.createElement("path",{d:"M12 16.75h.01"}))};function Tr(e,t){if(e==null||t==="none")return;let n=new Date(e);if(t==="datetime"){let o=i=>String(i).padStart(2,"0");return`${o(n.getMonth()+1)}-${o(n.getDate())} ${n.toLocaleTimeString("zh-CN",{hour12:!1})}`}return n.toLocaleTimeString("zh-CN",{hour12:!1})}function Sr(e){let t=M.store,n=wi[t.markerIcon]?.(),o=Tr(e.at,t.markerTime),i=`hc-deleted-marker hc-deleted-marker--${t.markerLook||"plain"}`+(e.edited?" hc-deleted-marker--edited":"");return r.createElement("div",{className:i},n&&r.createElement("svg",{className:"hc-deleted-marker__icon",width:"14",height:"14",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:2,strokeLinecap:"round",strokeLinejoin:"round","aria-hidden":!0},n),r.createElement("span",null,e.text,o?`\uFF08${o}\uFF09`:""))}var Ii=["logEdits","deleteStyle","showDeletedMarker","showEditedMarker","markerIcon","markerLook","markerTime"];function Ni(){let[,e]=m(0);E(()=>{let t=Ii.map(n=>M.subscribe(n,()=>e(o=>o+1)));return()=>t.forEach(n=>n())},[])}function Ei(e){Ni();let t=M.store,n=[];return t.logEdits&&e.history&&e.history.length>0&&n.push(r.createElement("div",{className:"hc-edit-history",key:"hc-edit-history"},e.history.map((o,i)=>{let a=Tr(o.at,"time");return r.createElement("div",{className:`hc-edit-history__version hc-edit-history__version--${t.deleteStyle||"tint"}`,key:i},De(o.content),a?r.createElement("span",{className:"hc-edit-history__time"},a):null)}))),t.showEditedMarker&&e.isEdited&&!e.isDeleted&&n.push(r.createElement(Sr,{key:"hc-edited-marker",text:"\u6B64\u6D88\u606F\u5DF2\u7F16\u8F91",at:e.editedAt,edited:!0})),t.showDeletedMarker&&e.isDeleted&&n.push(r.createElement(Sr,{key:"hc-deleted-marker",text:"\u6B64\u6D88\u606F\u5DF2\u5220\u9664",at:e.deletedAt})),n.length?r.createElement(r.Fragment,null,n):null}var Mr=["tint","text","ghost","strike"];function wr(){try{let e=document.documentElement;if(!e)return;for(let t of Mr)e.classList.remove(`hc-mlog-${t}`);e.classList.add(`hc-mlog-${M.store.deleteStyle||"tint"}`)}catch{}}function Ci(){let e=we().filter(n=>n.pluginId==="message-logger");if(!e.length)return;let t=e.filter(n=>!n.applied);t.length===0?D.info("in-chat patches applied"):D.warn("some in-chat patches did not match this Discord build; deleted messages are still captured on the plugin page, but will not be kept inline. Unmatched: "+t.map(n=>`"${n.label}"`).join(", "))}var Dr=G({id:"message-logger",name:"\u6D88\u606F\u8BB0\u5F55\u5668",description:"\u4FDD\u7559\u88AB\u5220\u9664\u7684\u6D88\u606F\u4E0E\u7F16\u8F91\u5386\u53F2\uFF0C\u53EF\u6309\u7528\u6237\u6216\u9891\u9053\u5FFD\u7565\uFF0C\u652F\u6301\u5BFC\u51FA\u3002",authors:[{name:"caitemm"}],category:"utility",settings:M,page:{title:"\u6D88\u606F\u8BB0\u5F55",icon:Ln,component:yr},patches:[{label:"keep deleted message in store",find:'"MessageStore"',replacement:[{match:/(?<=MESSAGE_DELETE:function\(([\w$]+)\)\{)(?=let.{0,100}?([\w$]+(?:\.[\w$]+)+)\.getOrCreate)/,replace:"let hcC=$2.getOrCreate($1.channelId);hcC=$self.handleDelete(hcC,$1,!1);$2.commit(hcC);return;"},{match:/(?<=MESSAGE_DELETE_BULK:function\(([\w$]+)\)\{)(?=let.{0,100}?([\w$]+(?:\.[\w$]+)+)\.getOrCreate)/,replace:"let hcC=$2.getOrCreate($1.channelId);hcC=$self.handleDelete(hcC,$1,!0);$2.commit(hcC);return;"}]},{label:"tint deleted message row (base)",find:"Message must not be a thread starter message",replacement:{match:/\)\("li",\{(.+?),className:/,replace:')("li",{$1,className:($self.deletedClass(arguments[0])||"")+" "+'}},{label:"tint deleted message row",find:"childrenRepliedMessage",replacement:{match:/(className:)(\w+\(\)\((?:[^()"']|"[^"]*"|'[^']*'|\([^()]*\))*\))/,replace:'$1[$2,$self.deletedClass(arguments[0])].filter(Boolean).join(" ")'}},{label:"inline edit history",find:".SEND_FAILED,",replacement:{match:/\]:[\w$]+\.isUnsupported.{0,30}?,children:\[/,replace:"$&$self.renderEdits(arguments[0]),"}}],start(){I.load(),I.setRetention(M.store.retention),Lt=M.subscribe("retention",e=>I.setRetention(e)),wr(),$t=M.subscribe("deleteStyle",wr),At=Si(),setTimeout(Ci,4e3),setTimeout(()=>{zt>0?D.info(`recorder pulse OK \u2014 ${zt} message action(s) observed so far`):D.error("recorder pulse FAILED \u2014 no message actions observed in 30s. The dispatcher hooks are not receiving events on this build. \u8BF7\u628A\u65E5\u5FD7\u9875\u91CC recorder on dispatcher \u5F00\u5934\u7684\u51E0\u884C\u53D1\u7ED9\u5F00\u53D1\u8005\u3002")},3e4)},stop(){At?.(),At=void 0,Lt?.(),Lt=void 0,$t?.(),$t=void 0;try{for(let e of Mr)document.documentElement?.classList.remove(`hc-mlog-${e}`)}catch{}I.flush(),D.info("stopped")},handleDelete(e,t,n){try{if(e==null||!n&&typeof e.has=="function"&&!e.has(t.id))return e;let o=M.store.keepDeletedInChat,i=64,a=c=>{let s=typeof e.get=="function"?e.get(c):void 0;if(!s)return;o&&!t.mlDeleted&&(s.flags&i)!==i&&!nt(String(t.channelId??t.channel_id??s.channel_id??""),s.author??{})?e=e.update(c,d=>d.set("deleted",!0)):e=e.remove(c)};if(n)for(let c of t.ids??[])a(c);else a(t.id)}catch(o){D.error("handleDelete failed; messages removed normally",o)}return e},deletedClass(e){try{let t=e?.message??e;if(!t)return"";let n=t.channel_id??t.channelId;return t.deleted===!0||n&&t.id&&I.isDeleted(String(n),String(t.id))?"hc-deleted":""}catch{return""}},renderEdits(e){try{let t=e?.message,n=t?.id,o=t?.channel_id??t?.channelId;if(!n||!o)return null;let i=I.getEdited().find(f=>f.id===String(n)&&f.channelId===String(o)),a=I.findDeleted(String(o),String(n)),c=!!(i&&i.history.length>0),s=!!a||t?.deleted===!0,l=t?.edited_timestamp??t?.editedTimestamp,d=l!=null||c,h=l!=null?jt(l):i?.updatedAt;return!c&&!s&&!d?null:r.createElement(Ei,{history:i?.history,deletedAt:a?.deletedAt,editedAt:h,isDeleted:s,isEdited:d})}catch{return null}}});u();N();var Ar=y("show-username"),Lr=ee({mode:{type:"select",default:"nick-user",label:"\u663E\u793A\u65B9\u5F0F",description:"\u6635\u79F0\u4E0E\u7528\u6237\u540D\u7684\u6392\u5217\u3002",options:[{value:"nick-user",label:"\u6635\u79F0\u5728\u524D\uFF0C\u7528\u6237\u540D\u5728\u540E"},{value:"user-nick",label:"\u7528\u6237\u540D\u5728\u524D\uFF0C\u6635\u79F0\u5728\u540E"},{value:"user-only",label:"\u53EA\u663E\u793A\u7528\u6237\u540D"}]},style:{type:"select",default:"muted",label:"\u7528\u6237\u540D\u6837\u5F0F",description:"\u9644\u52A0\u7684\u7528\u6237\u540D\u90E8\u5206\u7684\u89C6\u89C9\u6837\u5F0F\u3002",options:[{value:"muted",label:"\u7070\u8272\u5C0F\u5B57"},{value:"pill",label:"\u5706\u89D2\u80F6\u56CA"},{value:"at",label:"@ \u524D\u7F00"},{value:"paren",label:"\u62EC\u53F7\u5305\u88F9"}]},hideWhenSame:{type:"boolean",default:!0,label:"\u6635\u79F0\u76F8\u540C\u65F6\u9690\u85CF",description:"\u6635\u79F0\u4E0E\u7528\u6237\u540D\u4E00\u81F4\u65F6\u4E0D\u91CD\u590D\u663E\u793A\u3002"},inReplies:{type:"boolean",default:!1,label:"\u56DE\u590D\u9884\u89C8\u4E2D\u4E5F\u663E\u793A",description:"\u5728\u56DE\u590D\u5F15\u7528\u7684\u5C0F\u5B57\u6761\u4E2D\u4E5F\u9644\u52A0\u7528\u6237\u540D\u3002"}});function Pi(e){let{original:t}=e,n=Lr.store,o=t.userOverride??t.message?.author,i=o?.username,a=t.author?.nick??o?.globalName??i??"",c=t.withMentionPrefix?"@":"";try{if(!i)return r.createElement(r.Fragment,null,c,a);if(t.isRepliedMessage&&!n.inReplies)return r.createElement(r.Fragment,null,c,a);if(n.hideWhenSame&&i.toLowerCase()===a.toLowerCase())return r.createElement(r.Fragment,null,c,a);let s=`hc-username hc-username--${n.style||"muted"}`,l=n.style==="at"?`@${i}`:n.style==="paren"?`\uFF08${i}\uFF09`:i;return n.mode==="user-only"?r.createElement(r.Fragment,null,c,i):n.mode==="user-nick"?r.createElement(r.Fragment,null,c,i," ",r.createElement("span",{className:s},a)):r.createElement(r.Fragment,null,c,a," ",r.createElement("span",{className:s},l))}catch(s){return Ar.error("username render failed; falling back to the nick",s),r.createElement(r.Fragment,null,c,a)}}var $r=G({id:"show-username",name:"\u663E\u793A\u7528\u6237\u540D",description:"\u5728\u6635\u79F0\u65C1\u8FB9\u663E\u793A\u8D26\u53F7\u7528\u6237\u540D\uFF0C\u9632\u6B62\u6539\u540D\u5192\u5145\uFF0C\u652F\u6301\u591A\u79CD\u6837\u5F0F\u3002",authors:[{name:"caitemm"}],category:"appearance",settings:Lr,patches:[{label:"message header username",find:'="SYSTEM_TAG"',replacement:{match:/(?<=onContextMenu:[\w$]+,children:)([\w$]+)\?(?=.{0,100}?user[Nn]ame:)/,replace:"$self.renderUsername(arguments[0]),_hcOld:$1?"}}],start(){Ar.info("appending usernames to message headers")},stop(){},renderUsername(e){try{return r.createElement(Pi,{original:e})}catch{return e?.author?.nick??null}}});u();N();u();var V=ee({acknowledgedRisk:{type:"boolean",default:!1,label:"\u6211\u5DF2\u4E86\u89E3\u5C01\u53F7\u98CE\u9669",description:"\u4E3B\u52A8\u8BA2\u9605\u9891\u9053\u5C5E\u4E8E\u81EA\u52A8\u5316\u884C\u4E3A\uFF0C\u53EF\u80FD\u8FDD\u53CD Discord \u670D\u52A1\u6761\u6B3E\u5E76\u5BFC\u81F4\u8D26\u53F7\u88AB\u5C01\u3002\u4EC5\u5728\u4F60\u5B8C\u5168\u7406\u89E3\u5E76\u81EA\u613F\u627F\u62C5\u98CE\u9669\u65F6\u5F00\u542F\u3002",hidden:!0},selectedGuilds:{type:"string-list",default:[],label:"\u76D1\u63A7\u7684\u670D\u52A1\u5668",description:"\u6309\u670D\u52A1\u5668 ID \u76D1\u63A7\u3002\u5EFA\u8BAE\u4ECE\u4E0B\u65B9\u7684\u670D\u52A1\u5668\u5217\u8868\u52FE\u9009\uFF0C\u800C\u4E0D\u662F\u624B\u586B\u3002",itemPlaceholder:"\u670D\u52A1\u5668 ID",hidden:!0}});u();ue();N();var rt=y("guild-monitor"),Ti=5*60*1e3,Ae,Or=()=>[];function Mi(e){try{let t=Ct.getChannels(e);if(!t||typeof t!="object")return[];let n=new Set;for(let o of Object.values(t))if(Array.isArray(o))for(let i of o){let a=i?.channel??i,c=a?.id;c!=null&&(a?.type===0||a?.type===5)&&n.add(String(c))}return[...n]}catch(t){return rt.debug(`could not read channels for guild ${e}`,t),[]}}function Di(e){let t=et;if(t)try{if(typeof t.subscribeToChannel=="function"){for(let n of Mi(e))t.subscribeToChannel(e,n);return}typeof t.subscribeToGuild=="function"&&t.subscribeToGuild(e)}catch(n){rt.warn(`subscribe failed for guild ${e}`,n)}}function Ut(){let e=et;return!!(e&&(typeof e.subscribeToChannel=="function"||typeof e.subscribeToGuild=="function"))}function Ft(){let e=Or();if(e.length){for(let t of e)Di(t);rt.debug(`refreshed subscriptions for ${e.length} guild(s)`)}}function zr(e){if(Or=e,Kt(),!Ut()){rt.warn("this Discord build exposes no guild-subscription action; monitoring is inactive");return}Ft(),Ae=setInterval(Ft,Ti)}function Br(){Ae&&Ft()}function Kt(){Ae&&(clearInterval(Ae),Ae=void 0)}u();T();ue();J();function Vt(){try{let t=(xn("GuildStore")??de)?.getGuilds?.()??{};return Object.values(t).map(n=>({id:String(n?.id??""),name:String(n?.name??n?.id??"\u672A\u77E5\u670D\u52A1\u5668")})).filter(n=>n.id).sort((n,o)=>n.name.localeCompare(o.name,"zh-CN"))}catch{return[]}}function Gr(){let[e,t]=m(()=>Vt()),[n,o]=m(()=>[...V.store.selectedGuilds]),[i,a]=m(()=>V.store.acknowledgedRisk===!0),c=Ut();E(()=>{if(e.length===0){let h=setTimeout(()=>t(Vt()),400);return()=>clearTimeout(h)}},[e.length]);let s=h=>{o(h),V.store.selectedGuilds=h,Br()},l=h=>{s(n.includes(h)?n.filter(f=>f!==h):[...n,h])};return r.createElement("div",{className:"hc-stack"},r.createElement("div",{className:"hc-inline-note hc-inline-note--danger"},r.createElement(Z,{size:18}),r.createElement("span",null,"\u4E3B\u52A8\u76D1\u63A7\u4F1A\u8BA2\u9605\u4F60\u5C1A\u672A\u6253\u5F00\u7684\u9891\u9053\uFF0C\u5C5E\u4E8E\u81EA\u52A8\u5316\u884C\u4E3A\uFF0C\u53EF\u80FD\u8FDD\u53CD Discord \u670D\u52A1\u6761\u6B3E\u5E76\u5BFC\u81F4",r.createElement("b",null,"\u8D26\u53F7\u88AB\u5C01\u7981"),"\u3002\u8BF7\u81EA\u884C\u627F\u62C5\u98CE\u9669\u3002")),r.createElement("div",{className:"hc-section"},r.createElement("div",{className:"hc-section__body"},r.createElement("div",{className:"hc-cell hc-cell--row"},r.createElement("div",{className:"hc-cell__main"},r.createElement("div",{className:"hc-cell__label"},"\u542F\u7528\u4E3B\u52A8\u76D1\u63A7"),r.createElement("div",{className:"hc-cell__desc"},"\u5F00\u542F\u540E\u624D\u80FD\u52FE\u9009\u4E0B\u65B9\u7684\u670D\u52A1\u5668\u3002")),r.createElement(O,{checked:i,onChange:h=>{a(h),V.store.acknowledgedRisk=h,h||s([])},"aria-label":"\u542F\u7528\u4E3B\u52A8\u76D1\u63A7"})))),!c&&r.createElement("div",{className:"hc-inline-note"},r.createElement(Z,{size:18}),r.createElement("span",null,"\u5F53\u524D Discord \u7248\u672C\u672A\u66B4\u9732\u53EF\u7528\u7684\u8BA2\u9605\u63A5\u53E3\uFF0C\u76D1\u63A7\u6682\u65F6\u65E0\u6CD5\u751F\u6548\u3002")),r.createElement("div",{className:"hc-section"},r.createElement("div",{className:"hc-section__title",style:{display:"flex",justifyContent:"space-between"}},r.createElement("span",null,"\u670D\u52A1\u5668\uFF08",e.length,"\uFF09"),r.createElement("button",{type:"button",className:"hc-tab",onClick:()=>t(Vt()),style:{height:20,padding:"0 8px",textTransform:"none"}},r.createElement(se,{size:12})," \u5237\u65B0")),e.length===0?r.createElement(j,{icon:r.createElement(Ke,{size:48}),title:"\u6CA1\u6709\u8BFB\u5230\u670D\u52A1\u5668",subtitle:"\u7B49 Discord \u52A0\u8F7D\u5B8C\u6210\u540E\u70B9\u4E0A\u9762\u7684\u5237\u65B0\uFF0C\u6216\u7A0D\u540E\u518D\u6765\u3002"}):r.createElement("div",{className:"hc-section__body",style:{opacity:i?1:.5,pointerEvents:i?"auto":"none"}},e.map(h=>r.createElement("div",{className:"hc-cell hc-cell--row",key:h.id},r.createElement("div",{className:"hc-cell__main"},r.createElement("div",{className:"hc-cell__label"},h.name),r.createElement("div",{className:"hc-cell__desc"},h.id)),r.createElement(O,{checked:n.includes(h.id),onChange:()=>l(h.id),"aria-label":`\u76D1\u63A7 ${h.name}`}))))),n.length>0&&r.createElement("div",{className:"hc-savebar"},r.createElement("span",{className:"hc-savebar__label"},"\u6B63\u5728\u76D1\u63A7 ",n.length," \u4E2A\u670D\u52A1\u5668"),r.createElement("div",{className:"hc-savebar__actions"},r.createElement(S,{size:"sm",variant:"destructive",onClick:()=>s([])},"\u5168\u90E8\u53D6\u6D88"))))}var Ai=y("guild-monitor");function jr(){if(V.store.acknowledgedRisk!==!0)return[];let e=V.store.selectedGuilds;return Array.isArray(e)?e:[]}var Hr=G({id:"guild-monitor",name:"\u670D\u52A1\u5668\u76D1\u63A7",description:"\u4E3B\u52A8\u8BA2\u9605\u9009\u5B9A\u670D\u52A1\u5668\u7684\u9891\u9053\uFF0C\u6355\u6349\u672A\u6253\u5F00\u9891\u9053\u91CC\u7684\u6D88\u606F\uFF08\u6709\u5C01\u53F7\u98CE\u9669\uFF0C\u9ED8\u8BA4\u5173\u95ED\uFF09\u3002",authors:[{name:"caitemm"}],category:"privacy",settings:V,page:{title:"\u76D1\u63A7",icon:Vn,component:Gr},start(){zr(jr);let e=jr().length;e>0&&Ai.info(`monitoring ${e} guild(s)`)},stop(){Kt()}});u();N();u();var he=ee({order:{group:"\u9ED8\u8BA4\u53C2\u6570",type:"select",default:"desc",label:"\u6E05\u7406\u65B9\u5411",description:"\u53D7\u6761\u6570\u9650\u5236\u65F6\uFF0C\u4F18\u5148\u4ECE\u54EA\u4E00\u7AEF\u5F00\u59CB\u5220\u3002",options:[{value:"desc",label:"\u4ECE\u65B0\u5230\u8001"},{value:"asc",label:"\u4ECE\u8001\u5230\u65B0"}]},limit:{group:"\u9ED8\u8BA4\u53C2\u6570",type:"number",default:100,label:"\u6700\u591A\u5904\u7406\u6761\u6570",description:"\u5355\u6B21\u9884\u89C8 / \u5220\u9664\u7684\u4E0A\u9650\u3002",min:1,max:5e3,step:50},delayMs:{group:"\u9ED8\u8BA4\u53C2\u6570",type:"number",default:1600,label:"\u5220\u9664\u95F4\u9694\uFF08\u6BEB\u79D2\uFF09",description:"\u4E24\u6B21\u5220\u9664\u4E4B\u95F4\u7684\u7B49\u5F85\uFF0C\u592A\u5FEB\u4F1A\u89E6\u53D1\u9650\u901F\uFF0C\u5EFA\u8BAE\u4E0D\u4F4E\u4E8E 1000\u3002",min:300,max:3e4,step:100},confirmBeforeDelete:{group:"\u9ED8\u8BA4\u53C2\u6570",type:"boolean",default:!0,label:"\u5220\u9664\u524D\u4E8C\u6B21\u786E\u8BA4",description:"\u70B9\u300C\u5220\u9664\u300D\u540E\u5F39\u51FA\u786E\u8BA4\u6846\uFF0C\u907F\u514D\u8BEF\u5220\u3002"}});u();T();N();u();ue();N();var Li=y("message-cleaner"),$i="https://discord.com/api/v10",qt=new Set,xe=e=>new Promise(t=>setTimeout(t,e)),Oi=1420070400000n,ot=e=>String(BigInt(e.getTime())-Oi<<22n);function Wt(){try{let e=window.webpackChunkdiscord_app;if(Array.isArray(e)){let t=null;if(e.push([[Symbol()],{},n=>{for(let o of Object.keys(n.m||{}))try{for(let i of[n(o),n(o)?.default])if(i&&typeof i.getToken=="function"){let a=i.getToken();if(a&&a.length>20){t=a;return}}}catch{}}]),t)return t}}catch{}try{let e=window.localStorage.getItem("token");if(e)return e.replace(/^"|"$/g,"")}catch{}return null}async function pe(e,t,n={},o=0){let i;try{i=await fetch($i+t,{...n,headers:{Authorization:e,"Content-Type":"application/json",...n.headers||{}}})}catch(a){if(o<5)return await xe(3e3),pe(e,t,n,o+1);throw new Error(`\u7F51\u7EDC\u8BF7\u6C42\u5931\u8D25: ${a.message}`)}if(i.status===429){let a=await i.json().catch(()=>({})),c=a.retry_after?Math.ceil(Number(a.retry_after)*1e3):Math.pow(2,o)*1e3;if(o<5)return await xe(c+500),pe(e,t,n,o+1);throw new Error("\u89E6\u53D1\u9650\u901F\u4E14\u91CD\u8BD5\u6B21\u6570\u8017\u5C3D\u3002")}if(!i.ok){let a=await i.text().catch(()=>"");throw new Error(`API ${i.status}: ${a.slice(0,120)}`)}return i.status===204?null:i.json()}function Yt(){try{let e=ve.getCurrentUser?.();if(e?.id)return String(e.id)}catch{}}async function Jt(e){let t=await pe(e,"/users/@me");if(!t?.id)throw new Error("\u65E0\u6CD5\u901A\u8FC7 Token \u83B7\u53D6\u8D26\u53F7\u4FE1\u606F\uFF0C\u8BF7\u68C0\u67E5 Token \u662F\u5426\u6709\u6548\u3002");return String(t.id)}function Fr(){try{let e=location.pathname.match(/\/channels\/(\d{15,25}|@me)\/(\d{15,25})/);return e?{guildId:e[1],channelId:e[2],serverWide:!1}:null}catch{return null}}function Ur(){try{let e=de.getGuilds?.();return e?Object.values(e).map(t=>({id:t.id,name:t.name??"\u672A\u77E5",icon:t.icon??null})):[]}catch{return[]}}function Kr(e){try{let t=[],n=Me.getMutableGuildChannelsForGuild?.(e);if(n)for(let o of Object.values(n))o&&o.type!==4&&t.push({id:o.id,name:o.name??"\u672A\u77E5",type:o.type});if(t.length===0)try{let{GuildChannelStore:o}=(ue(),mo(gr)),i=o?.getChannels?.(e);if(i){for(let a of Object.values(i))if(Array.isArray(a))for(let c of a){let s=c?.channel??c;s&&s.id&&s.type!==4&&t.push({id:s.id,name:s.name??"\u672A\u77E5",type:s.type??0})}}}catch{}return t}catch{return[]}}async function Vr(e,t,n,o,i){let a=[];if(t.serverWide&&t.guildId&&t.guildId!=="@me"){let s=0;for(;a.length<t.limit&&!i.stopped;){o("\u5168\u670D\u68C0\u7D22\u4E2D",`\u5DF2\u627E\u5230 ${a.length} \u6761\uFF08\u641C\u7D22\u63A5\u53E3\u8F83\u6162\uFF0C\u8BF7\u7A0D\u5019\uFF09`);let l=new URLSearchParams({author_id:n,offset:String(s),include_nsfw:"true",sort_order:t.order==="asc"?"asc":"desc"});t.after&&l.set("min_id",ot(t.after)),t.before&&l.set("max_id",ot(t.before));let d;try{d=await pe(e,`/guilds/${t.guildId}/messages/search?${l}`)}catch(h){throw new Error(`\u5168\u670D\u68C0\u7D22\u5931\u8D25\uFF1A${h.message}`)}if(d?.message==="Indexing"){o("\u5EFA\u7ACB\u7D22\u5F15\u4E2D","Discord \u6B63\u5728\u5EFA\u7ACB\u5168\u670D\u7D22\u5F15\uFF0C10 \u79D2\u540E\u81EA\u52A8\u91CD\u8BD5\u2026"),await xe(1e4);continue}if(!d?.messages||d.messages.length===0)break;for(let h of d.messages){let f=h.find(w=>w?.hit)??h.find(w=>w?.author?.id===n)??h[0];if(!(!f||f.author?.id!==n||qt.has(f.id))&&(a.push({id:f.id,channelId:f.channel_id,content:f.content??"",timestamp:f.timestamp}),a.length>=t.limit))break}if(d.messages.length<25)break;s+=d.messages.length,await xe(1200)}return a}if(!t.channelId)throw new Error("\u8BF7\u586B\u5199\u9891\u9053 ID\uFF0C\u6216\u5F00\u542F\u300C\u5168\u670D\u626B\u63CF\u300D\u5E76\u586B\u5199\u670D\u52A1\u5668 ID\u3002");let c=null;for(t.order==="desc"?c=t.before?ot(t.before):null:c=t.after?ot(t.after):"0";a.length<t.limit&&!i.stopped;){let s=new URLSearchParams({limit:"100"});c&&s.set(t.order==="desc"?"before":"after",c);let l;try{l=await pe(e,`/channels/${t.channelId}/messages?${s}`)}catch(d){throw new Error(`\u8BFB\u53D6\u9891\u9053\u6D88\u606F\u5931\u8D25\uFF1A${d.message}`)}if(!Array.isArray(l)||l.length===0)break;for(let d of l){let h=new Date(d.timestamp);if(t.order==="desc"&&t.after&&h<t.after||t.order==="asc"&&t.before&&h>t.before)return a;let f=(!t.after||h>=t.after)&&(!t.before||h<=t.before);if(d.author?.id===n&&f&&!qt.has(d.id)&&(a.push({id:d.id,channelId:d.channel_id??t.channelId,content:d.content??"",timestamp:d.timestamp}),a.length>=t.limit))break}c=l[l.length-1].id,o("\u626B\u63CF\u4E2D",`\u5DF2\u627E\u5230 ${a.length} \u6761`),await xe(150)}return a}async function qr(e,t,n,o,i){let a=0,c=0;for(let s of t){if(i.stopped)break;let l=Date.now();try{await pe(e,`/channels/${s.channelId||n.channelId}/messages/${s.id}`,{method:"DELETE"}),a++}catch(h){c++,String(h?.message??"").includes("404")||qt.add(s.id),Li.warn(`skip ${s.id}: ${h?.message??h}`)}o("\u5220\u9664\u4E2D",`\u5DF2\u5220\u9664 ${a} / ${t.length}${c?`\uFF08\u8DF3\u8FC7 ${c}\uFF09`:""}`);let d=Date.now()-l;d<n.delayMs&&await xe(n.delayMs-d)}return{deleted:a,skipped:c}}async function Wr(e,t,n){let o,i=new URLSearchParams({author_id:n,include_nsfw:"true"});if(t.serverWide&&t.guildId&&t.guildId!=="@me")o=`/guilds/${t.guildId}/messages/search?${i}`;else if(t.channelId)o=`/channels/${t.channelId}/messages/search?${i}`;else if(t.guildId&&t.guildId!=="@me")o=`/guilds/${t.guildId}/messages/search?${i}`;else throw new Error("\u8BF7\u586B\u5199\u670D\u52A1\u5668 ID \u6216\u9891\u9053 ID\u3002");let a=await pe(e,o);return a?.message==="Indexing"?{total:0,indexing:!0}:{total:a?.total_results??0,indexing:!1}}var Yr=y("message-cleaner");function zi(e){let t=new Date(e);if(Number.isNaN(t.getTime()))return"";let n=o=>String(o).padStart(2,"0");return`${n(t.getMonth()+1)}-${n(t.getDate())} ${n(t.getHours())}:${n(t.getMinutes())}`}function Jr(){let[e,t]=m(""),[n,o]=m(""),[i,a]=m(""),[c,s]=m(!1),[l,d]=m(""),[h,f]=m(""),[w,q]=m(he.store.order),[ne,ge]=m(!1),[p,b]=m("idle"),[x,A]=m([]),[Le,Xt]=m("\u5F85\u673A"),[Zt,Qt]=m("\u5148\u83B7\u53D6 Token\uFF0C\u9009\u597D\u8303\u56F4\u5E76\u9884\u89C8\uFF0C\u786E\u8BA4\u540E\u518D\u5220\u9664\u3002"),[Rt,en]=m(null),[Rr,$e]=m(!1),[eo,to]=m([]),[tn,nn]=m([]),[Oe,it]=m("guilds"),[rn,no]=m(""),re=ie({stopped:!1}),_e=p!=="idle";E(()=>{let g=Wt();g&&(t(g),Xt("\u5DF2\u83B7\u53D6 Token"),Qt("\u53EF\u70B9\u51FB\u300C\u5217\u8868\u300D\u9009\u62E9\u9891\u9053\uFF0C\u6216\u624B\u52A8\u586B\u5199 ID\u3002"))},[]);let v=(g,P)=>{Xt(g),Qt(P)},at=()=>{let g=e.trim();if(!g)throw new Error("\u8BF7\u5148\u83B7\u53D6\u6216\u586B\u5165 Token\u3002");return g},on=()=>({guildId:n.trim(),channelId:c?"":i.trim(),serverWide:c,order:w,limit:he.store.limit,delayMs:he.store.delayMs,after:l?new Date(l):null,before:h?new Date(h):null}),ro=()=>{let g=Wt();g?(t(g),v("Token \u5DF2\u83B7\u53D6","\u53EF\u70B9\u51FB\u300C\u5217\u8868\u300D\u9009\u62E9\u9891\u9053\u3002")):v("\u83B7\u53D6\u5931\u8D25","\u8BF7\u624B\u52A8\u7C98\u8D34 Token\u3002")},oo=()=>{let g=Fr();if(!g){v("\u65E0\u6CD5\u8BFB\u53D6","\u5F53\u524D\u4E0D\u5728\u67D0\u4E2A\u9891\u9053/\u79C1\u4FE1\u9875\u9762\u3002");return}o(g.guildId),a(g.channelId),s(!1),v("\u5DF2\u586B\u5165\u5F53\u524D\u9891\u9053",`\u670D\u52A1\u5668 ${g.guildId} \xB7 \u9891\u9053 ${g.channelId}`)},io=()=>{let g=Ur();to([{id:"@me",name:"\u79C1\u4FE1\u4E0E\u7FA4\u804A (DMs)",icon:null},...g]),nn([]),it("guilds"),$e(!0)},an=g=>{if(o(g.id),g.id==="@me"){$e(!1),v("\u5DF2\u9009\u62E9\u79C1\u4FE1","\u8BF7\u624B\u52A8\u586B\u5199\u79C1\u4FE1\u9891\u9053 ID\u3002");return}no(g.name);let P=Kr(g.id);nn([{id:"",name:"\u2500\u2500 \u5168\u670D\u626B\u63CF\uFF08\u4E0D\u9650\u9891\u9053\uFF09\u2500\u2500",type:-1},...P]),it("channels")},sn=g=>{g.id?(s(!1),a(g.id)):(s(!0),a("")),$e(!1),v("\u5DF2\u9009\u62E9",`${rn} \u2192 ${g.name||"\u5168\u670D"}`)},ao=()=>{let g=new Date;g.setMinutes(g.getMinutes()-g.getTimezoneOffset()),f(g.toISOString().slice(0,16))},so=async()=>{let g;try{g=at()}catch(C){v("\u5931\u8D25",C.message);return}let P=Yt()??await Jt(g);if(!P){v("\u5931\u8D25","\u62FF\u4E0D\u5230\u5F53\u524D\u8D26\u53F7\uFF0C\u8BF7\u786E\u8BA4\u5DF2\u767B\u5F55 Discord\u3002");return}let k=on();if(k.serverWide&&(!k.guildId||k.guildId==="@me")){v("\u5931\u8D25","\u5168\u670D\u626B\u63CF\u9700\u8981\u586B\u5199\u670D\u52A1\u5668 ID\u3002");return}if(!k.serverWide&&!k.channelId){v("\u5931\u8D25","\u8BF7\u586B\u5199\u9891\u9053 ID\uFF0C\u6216\u6539\u7528\u5168\u670D\u626B\u63CF\u3002");return}if(k.after&&k.before&&k.after>=k.before){v("\u5931\u8D25","\u8D77\u59CB\u65F6\u95F4\u5FC5\u987B\u65E9\u4E8E\u7ED3\u675F\u65F6\u95F4\u3002");return}re.current={stopped:!1},b("previewing"),A([]),v("\u9884\u89C8\u4E2D","\u6B63\u5728\u626B\u63CF\u4F60\u7684\u6D88\u606F\u2026");try{let C=await Vr(g,k,P,v,re.current);A(C),v(re.current.stopped?"\u5DF2\u505C\u6B62":"\u9884\u89C8\u5B8C\u6210",`\u627E\u5230 ${C.length} \u6761\u4F60\u7684\u6D88\u606F\u3002`)}catch(C){v("\u5931\u8D25",C.message??String(C)),Yr.error("preview failed",C)}finally{b("idle")}},co=async()=>{if(x.length===0){v("\u8BF7\u5148\u9884\u89C8","");return}if(he.store.confirmBeforeDelete&&!window.confirm(`\u5C06\u5220\u9664 ${x.length} \u6761\u6D88\u606F\uFF0C\u5220\u9664\u4E0D\u53EF\u6062\u590D\uFF0C\u786E\u8BA4\u7EE7\u7EED\uFF1F`))return;let g;try{g=at()}catch(k){v("\u5931\u8D25",k.message);return}let P=on();re.current={stopped:!1},b("deleting"),v("\u5220\u9664\u4E2D",`0 / ${x.length}`);try{let k=await qr(g,x,P,v,re.current);v(re.current.stopped?"\u5DF2\u505C\u6B62":"\u5B8C\u6210",`\u5DF2\u5220\u9664 ${k.deleted} \u6761${k.skipped?`\uFF0C\u8DF3\u8FC7 ${k.skipped} \u6761`:""}\u3002`),A([])}catch(k){v("\u5931\u8D25",k.message??String(k)),Yr.error("delete failed",k)}finally{b("idle")}},cn=()=>{re.current.stopped=!0,v("\u505C\u6B62\u4E2D","\u7B49\u5F85\u5F53\u524D\u8BF7\u6C42\u7ED3\u675F\u2026")},lo=async()=>{let g;try{g=at()}catch(C){v("\u5931\u8D25",C.message);return}let P=Yt()??await Jt(g);if(!P){v("\u5931\u8D25","\u62FF\u4E0D\u5230\u5F53\u524D\u8D26\u53F7\u3002");return}let k={guildId:n.trim(),channelId:c?"":i.trim(),serverWide:c};en(null),v("\u7EDF\u8BA1\u4E2D","\u8C03\u7528\u641C\u7D22\u63A5\u53E3\u2026");try{let C=await Wr(g,k,P);if(C.indexing){v("\u5EFA\u7ACB\u7D22\u5F15\u4E2D","Discord \u6B63\u5728\u5EFA\u7ACB\u7D22\u5F15\uFF0C\u7A0D\u540E\u518D\u8BD5\u3002");return}en(C.total),v("\u7EDF\u8BA1\u5B8C\u6210",`\u5171 ${C.total} \u6761\u53D1\u8A00\u3002`)}catch(C){v("\u5931\u8D25",C.message??String(C))}};return Rr?r.createElement("div",{className:"hc-cleaner"},r.createElement("div",{className:"hc-cleaner__picker-head"},Oe==="channels"&&r.createElement(S,{size:"sm",variant:"plain",onClick:()=>it("guilds")},"\u2190 \u8FD4\u56DE"),r.createElement("span",{className:"hc-cleaner__picker-title"},Oe==="guilds"?"\u9009\u62E9\u670D\u52A1\u5668":rn),r.createElement(S,{size:"sm",variant:"plain",onClick:()=>$e(!1)},"\u2715")),r.createElement("div",{className:"hc-cleaner__picker-list"},Oe==="guilds"?eo.map(g=>r.createElement("div",{key:g.id,className:"hc-cleaner__picker-item",onClick:()=>an(g),role:"button",tabIndex:0,onKeyDown:P=>{P.key==="Enter"&&an(g)}},r.createElement("div",{className:"hc-cleaner__picker-icon"},g.icon?r.createElement("img",{src:`https://cdn.discordapp.com/icons/${g.id}/${g.icon}.png?size=64`,alt:""}):g.name.charAt(0)),r.createElement("div",{className:"hc-cleaner__picker-name"},g.name))):tn.map(g=>r.createElement("div",{key:g.id||"server-wide",className:"hc-cleaner__picker-item",onClick:()=>sn(g),role:"button",tabIndex:0,onKeyDown:P=>{P.key==="Enter"&&sn(g)}},r.createElement("div",{className:"hc-cleaner__picker-icon"},g.id?"#":"\u{1F310}"),r.createElement("div",{className:"hc-cleaner__picker-name"},g.name))),Oe==="channels"&&tn.length<=1&&r.createElement("div",{className:"hc-cleaner__picker-empty"},"\u6B64\u670D\u52A1\u5668\u6682\u65E0\u7F13\u5B58\u7684\u9891\u9053\uFF0C\u53EF\u624B\u52A8\u586B\u5199\u9891\u9053 ID\u3002"))):r.createElement("div",{className:"hc-cleaner"},r.createElement("div",{className:"hc-inline-note hc-inline-note--danger"},r.createElement(Z,{size:18}),r.createElement("span",null,"\u5220\u9664\u4E0D\u53EF\u6062\u590D\uFF0C\u4E14\u53EA\u4F1A\u5220\u9664",r.createElement("strong",null,"\u4F60\u81EA\u5DF1"),"\u53D1\u9001\u7684\u6D88\u606F\u3002\u8BF7\u52A1\u5FC5\u5148\u9884\u89C8\u786E\u8BA4\u3002")),r.createElement(z,{title:"Token"},r.createElement("div",{className:"hc-cell"},r.createElement("div",{className:"hc-cell--row"},r.createElement("div",{className:"hc-cell__main"},r.createElement("div",{className:"hc-cell__label"},"Discord Token"),r.createElement("div",{className:"hc-cell__desc"},"\u4EE3\u8868\u4F60\u7684\u8D26\u53F7\u6743\u9650\uFF0C\u4E0D\u8981\u6CC4\u9732\u7ED9\u4EFB\u4F55\u4EBA\u3002")),r.createElement(S,{size:"sm",variant:"secondary",icon:r.createElement(se,{size:16}),onClick:ro},"\u81EA\u52A8")),r.createElement("div",{className:"hc-cell__control"},r.createElement(F,{value:e,onChange:t,placeholder:"\u81EA\u52A8\u586B\u5165\u6216\u624B\u52A8\u7C98\u8D34",type:"password"})))),r.createElement(z,{title:"\u8303\u56F4"},r.createElement("div",{className:"hc-cell hc-cell--row"},r.createElement("div",{className:"hc-cell__main"},r.createElement("div",{className:"hc-cell__label"},"\u5168\u670D\u626B\u63CF"),r.createElement("div",{className:"hc-cell__desc"},"\u5FFD\u7565\u9891\u9053\uFF0C\u626B\u63CF\u6574\u4E2A\u670D\u52A1\u5668\uFF08\u8D70\u641C\u7D22\u63A5\u53E3\uFF0C\u8F83\u6162\uFF09\u3002")),r.createElement(O,{checked:c,onChange:s,"aria-label":"\u5168\u670D\u626B\u63CF"})),r.createElement("div",{className:"hc-cell"},r.createElement("div",{className:"hc-cell--row"},r.createElement("div",{className:"hc-cell__main"},r.createElement("div",{className:"hc-cell__label"},"\u670D\u52A1\u5668 ID"))),r.createElement("div",{className:"hc-cell__control"},r.createElement(F,{value:n,onChange:o,placeholder:"\u670D\u52A1\u5668 ID"}))),!c&&r.createElement("div",{className:"hc-cell"},r.createElement("div",{className:"hc-cell--row"},r.createElement("div",{className:"hc-cell__main"},r.createElement("div",{className:"hc-cell__label"},"\u9891\u9053 ID"))),r.createElement("div",{className:"hc-cell__control"},r.createElement(F,{value:i,onChange:a,placeholder:"\u9891\u9053 ID"}))),r.createElement("div",{className:"hc-cell hc-cell--row",style:{gap:"var(--hc-space-2)"}},r.createElement(S,{size:"sm",variant:"secondary",icon:r.createElement(Ke,{size:16}),onClick:io,disabled:_e},"\u5217\u8868"),r.createElement(S,{size:"sm",variant:"secondary",icon:r.createElement(Q,{size:16}),onClick:oo,disabled:_e},"\u5F53\u524D"))),r.createElement(z,{title:"\u65F6\u95F4\u8303\u56F4",note:"\u53EF\u9009\u3002\u7559\u7A7A\u8868\u793A\u4E0D\u9650\u5236\u8BE5\u65B9\u5411\u3002"},r.createElement("div",{className:"hc-cell"},r.createElement("div",{className:"hc-cell--row"},r.createElement("div",{className:"hc-cell__main"},r.createElement("div",{className:"hc-cell__label"},"\u8D77\u59CB\u65F6\u95F4"))),r.createElement("div",{className:"hc-cell__control"},r.createElement("input",{className:"hc-input",type:"datetime-local",value:l,onChange:g=>d(g.currentTarget.value)}))),r.createElement("div",{className:"hc-cell"},r.createElement("div",{className:"hc-cell--row"},r.createElement("div",{className:"hc-cell__main"},r.createElement("div",{className:"hc-cell__label"},"\u7ED3\u675F\u65F6\u95F4")),r.createElement(S,{size:"sm",variant:"plain",onClick:ao},"\u540C\u6B65\u6700\u65B0")),r.createElement("div",{className:"hc-cell__control"},r.createElement("input",{className:"hc-input",type:"datetime-local",value:h,onChange:g=>f(g.currentTarget.value)})))),r.createElement(z,{title:"\u65B9\u5411"},r.createElement("div",{className:"hc-cell hc-cell--row"},r.createElement("div",{className:"hc-cell__main"},r.createElement("div",{className:"hc-cell__label"},"\u6E05\u7406\u65B9\u5411")),r.createElement(Ve,{value:w,onChange:q,options:[{value:"desc",label:"\u4ECE\u65B0\u5230\u8001"},{value:"asc",label:"\u4ECE\u8001\u5230\u65B0"}]}))),r.createElement(z,{title:"\u786E\u8BA4",note:"\u5220\u9664\u662F\u4E0D\u53EF\u9006\u64CD\u4F5C\uFF0C\u8BF7\u5148\u9884\u89C8\u518D\u5220\u9664\u3002"},r.createElement("div",{className:"hc-cell hc-cell--row"},r.createElement("div",{className:"hc-cell__main"},r.createElement("div",{className:"hc-cell__label"},"\u6211\u786E\u8BA4\u53EA\u5220\u9664\u81EA\u5DF1\u7684\u6D88\u606F\uFF0C\u4E14\u660E\u767D\u4E0D\u53EF\u6062\u590D")),r.createElement(O,{checked:ne,onChange:ge,"aria-label":"\u786E\u8BA4"}))),r.createElement("div",{className:"hc-cleaner__actions"},p==="previewing"?r.createElement(S,{variant:"destructive",onClick:cn},"\u505C\u6B62\u9884\u89C8"):r.createElement(S,{variant:"primary",icon:r.createElement(ye,{size:16}),disabled:_e,onClick:so},"\u9884\u89C8"),p==="deleting"?r.createElement(S,{variant:"destructive",onClick:cn},"\u505C\u6B62\u5220\u9664"):r.createElement(S,{variant:"destructive",icon:r.createElement(H,{size:16}),disabled:_e||!ne||x.length===0,onClick:co},"\u5220\u9664\u9884\u89C8\uFF08",x.length,"\uFF09")),r.createElement("div",{className:"hc-cleaner__status"},r.createElement("div",{className:"hc-cleaner__status-state"},Le),Zt&&r.createElement("div",{className:"hc-cleaner__status-detail"},Zt)),x.length>0&&r.createElement(z,{title:`\u9884\u89C8\u7ED3\u679C\uFF08${x.length}\uFF09`},r.createElement("div",{className:"hc-cleaner__list"},x.slice(0,50).map(g=>r.createElement("div",{className:"hc-cleaner__item",key:g.id},r.createElement("span",{className:"hc-cleaner__item-time"},zi(g.timestamp)),r.createElement("span",{className:"hc-cleaner__item-text"},g.content.trim()||"\uFF08\u65E0\u6587\u672C\u5185\u5BB9\uFF09"))),x.length>50&&r.createElement("div",{className:"hc-cleaner__more"},"\u2026\u8FD8\u6709 ",x.length-50," \u6761\u672A\u5C55\u793A"))),r.createElement(z,{title:"\u7EDF\u8BA1",note:"\u7EDF\u8BA1\u4F60\u5728\u6240\u9009\u8303\u56F4\u5185\u7684\u5386\u53F2\u53D1\u8A00\u603B\u6570\uFF08\u8C03\u7528\u641C\u7D22\u63A5\u53E3\uFF09\u3002"},r.createElement("div",{className:"hc-cell"},r.createElement(S,{size:"sm",variant:"secondary",icon:r.createElement(ye,{size:16}),disabled:_e,onClick:lo},"\u7EDF\u8BA1\u6211\u7684\u53D1\u8A00\u6570")),Rt!=null&&r.createElement("div",{className:"hc-cell hc-cleaner__stat"},r.createElement("span",{className:"hc-cleaner__stat-num"},Rt),r.createElement("span",{className:"hc-cleaner__stat-unit"},"\u6761"))))}var Bi=y("message-cleaner"),Xr=G({id:"message-cleaner",name:"\u6D88\u606F\u6E05\u7406",description:"\u6279\u91CF\u5220\u9664\u4F60\u81EA\u5DF1\u5728\u67D0\u4E2A\u9891\u9053\u6216\u6574\u4E2A\u670D\u52A1\u5668\u7684\u5386\u53F2\u6D88\u606F\uFF08\u81EA\u52A9\u51B2\u6C34\u673A\uFF09\u3002\u5148\u9884\u89C8\u518D\u5220\u9664\uFF0C\u4EC5\u9650\u672C\u4EBA\u6D88\u606F\uFF0C\u5220\u9664\u4E0D\u53EF\u6062\u590D\u3002",authors:[{name:"caitemm"},{name:"catie"}],category:"privacy",settings:he,page:{title:"\u6E05\u7406",icon:H,component:Jr},start(){Bi.info("message-cleaner ready")},stop(){}});var Zr=[hr,Dr,$r,Hr,Xr];J();N();var Qr=y("extension");L.registerAll(Zr);L.prepare();async function Gi(){await En,await L.boot(),me();try{globalThis.HalcyonAPI={open:Xe,close:le,runtime:L,patchReport:()=>we(),dumpSource:(e,t)=>kn(e,t),diagnose:()=>Sn()}}catch{}Qr.info("Halcyon (extension) ready \u2014 press Ctrl/Cmd+Shift+H to open settings")}Gi().catch(e=>Qr.error("extension boot failed",e));})();
