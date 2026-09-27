// custom-typing — 自定义「正在输入」的字样与表情.
//
// Discord 正在灰度一个功能：把频道底部的输入状态从「X 正在输入…」换成一句自
// 定义的话、并把前面跳动的小圆点换成会晃动的自定义表情（截图里那三个小脸）。
// 没进灰度就玩不到，这个插件在本地把它补齐：自定义字样 + 自定义表情 + 动效。
//
// 只影响你自己看到的画面。Discord 发出去的输入信号里没有「用什么词、什么表情」
// 这些字段，所以改得了你屏幕上的样子，改不了别人屏幕上你的样子；而且底部这条
// 只显示别人、从不显示你自己，所以是别人打字时你才看得到效果。
//
// 做法 —— DOM 扫描 + 就地改写，和 platform-indicators 一个路子，不打源码 patch：
//   1. 那句话是 i18n 拼的、字符串构建期被哈希，锚不住；但类名 `typing_<hash>`
//      很稳。只在带 `typing` 类名的容器里动手，顺便把聊天正文里恰好写了「正在
//      输入」的消息挡在外面。
//   2. 字样：TreeWalker 找文本节点，把 match 里的原文换成 verb，<strong> 名字
//      原样保留。
//   3. 表情：跳动小圆点是容器里那个「没有文字」的子元素——认出它、藏起来，在它
//      前面插一串我们自己的表情节点，靠注入的 <style> 给它们加晃动/弹跳/旋转。
//   4. React 每次重渲染都会还原，所以 MutationObserver（加低频定时器兜底）在
//      变动时重新施工；改写是幂等的，不会自触发死循环。
// stop() 会撤掉表情节点、恢复被藏的小圆点、还原改过的文字、移除注入的样式。

import { definePlugin } from "../../core/plugin";
import { defineSettings } from "../../core/settings";
import { logger } from "../../core/logger";
import { probeSelectors } from "../../core/dom-probe";
import { emojiCdnUrl } from "../../core/common/cdn";

const log = logger("custom-typing");

const settings = defineSettings({
  verb: {
    group: "文字",
    type: "string",
    default: "正在叽里咕噜",
    label: "自定义字样",
    description: "把输入状态里「正在输入」换成这句。留空则不改文字。只有你自己看得到。",
    placeholder: "例如 正在叽里咕噜",
    maxLength: 64
  },
  match: {
    group: "文字",
    type: "string-list",
    default: ["正在输入", "is typing", "are typing"],
    label: "要替换的原文",
    description:
      "在输入状态里找这些短语，找到就换成上面的字样，忽略大小写。换了语言就用 HalcyonAPI.probe() 看 custom-typing.sampleText 里的原文照抄进来。",
    itemPlaceholder: "例如 正在输入"
  },
  emoji: {
    group: "表情",
    type: "string-list",
    default: ["😶", "🐦", "😶"],
    label: "自定义表情",
    description:
      "显示在名字前面、替换掉原来跳动的小圆点。每一项可以是：普通 emoji（😀）、图片直链（https 开头），或 Discord 表情代码 <:name:id> / 动图 <a:name:id>。留空则保留原来的小圆点。",
    itemPlaceholder: "😀 或 https://… 或 <a:name:id>"
  },
  animation: {
    group: "表情",
    type: "select",
    default: "wobble",
    label: "动效",
    description: "表情的跳动方式。",
    options: [
      { value: "wobble", label: "晃动" },
      { value: "bounce", label: "弹跳" },
      { value: "spin", label: "旋转" },
      { value: "none", label: "不动" }
    ]
  },
  emojiSize: {
    group: "表情",
    type: "number",
    default: 20,
    min: 12,
    max: 48,
    step: 1,
    label: "表情大小（px）",
    description: "自定义表情的边长。"
  }
});

/** 输入状态容器。类名带构建哈希，前缀匹配能扛过改版；第一个匹配到的胜出。 */
const CONTAINER_SELECTORS = ['[class*="typing_"]', '[class*="typing"]'];
const COALESCE_MS = 100;
const SWEEP_MS = 1000;
const STYLE_ID = "halcyon-custom-typing";
/** 标在我们注入的表情节点上，供清理时定位。 */
const HOST_MARK = "custom-typing";
/** 加在原生小圆点上的类，藏起来；清理时按它还原。 */
const DOTS_HIDDEN = "hc-ct-dots-hidden";

const CSS = `
.hc-ct-emoji{display:inline-flex;align-items:center;gap:3px;margin-right:5px;vertical-align:middle}
.hc-ct-face{width:var(--hc-ct-size,20px);height:var(--hc-ct-size,20px);display:inline-block;object-fit:contain;vertical-align:middle}
.hc-ct-face-text{width:auto;height:auto;font-size:var(--hc-ct-size,20px);line-height:1}
.${DOTS_HIDDEN}{display:none!important}
@keyframes hc-ct-wobble{0%,100%{transform:rotate(-10deg)}50%{transform:rotate(10deg)}}
@keyframes hc-ct-bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-30%)}}
@keyframes hc-ct-spin{to{transform:rotate(360deg)}}
.hc-ct-anim-wobble{animation:hc-ct-wobble .5s ease-in-out infinite}
.hc-ct-anim-bounce{animation:hc-ct-bounce .5s ease-in-out infinite}
.hc-ct-anim-spin{animation:hc-ct-spin 1s linear infinite}
.hc-ct-emoji .hc-ct-face:nth-child(2){animation-delay:.12s}
.hc-ct-emoji .hc-ct-face:nth-child(3){animation-delay:.24s}
.hc-ct-emoji .hc-ct-face:nth-child(n+4){animation-delay:.36s}
@media (prefers-reduced-motion:reduce){.hc-ct-face{animation:none!important}}
`;

interface Face {
  kind: "img" | "text";
  value: string;
}

let observer: MutationObserver | undefined;
let sweepTimer: ReturnType<typeof setInterval> | undefined;
let pending: ReturnType<typeof setTimeout> | undefined;
let unsubs: Array<() => void> = [];
let rewrites = 0;
/** 每次表情相关设置变动 +1；旧表情节点版本不符就重建。 */
let emojiVersion = 0;
let parsedEmoji: Face[] = [];
/** 被改过、还连在页面上的文本节点 -> 原文，供 stop() 还原。 */
const originals = new Map<Text, string>();

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** 由 match 拼一条替换正则；剔除本身是 verb 子串的项，免得越换越长。 */
function buildVerbRegex(verb: string): RegExp | null {
  const verbLower = verb.toLowerCase();
  const parts = settings.store.match
    .map((s) => s.trim())
    .filter(Boolean)
    .filter((s) => !verbLower.includes(s.toLowerCase()))
    .sort((a, b) => b.length - a.length)
    .map(escapeRegex);
  return parts.length ? new RegExp(parts.join("|"), "gi") : null;
}

/** 第一个匹配到节点的容器选择器的结果。 */
function firstContainerSet(): Element[] {
  for (const selector of CONTAINER_SELECTORS) {
    try {
      const nodes = document.querySelectorAll(selector);
      if (nodes.length > 0) return Array.from(nodes);
    } catch {
      // 引擎不认这个选择器，试下一个
    }
  }
  return [];
}

/** 把设置里的表情项解析成可渲染的面孔列表。 */
function parseEmoji(): Face[] {
  const size = settings.store.emojiSize * 2; // 取二倍图，清晰点
  const out: Face[] = [];
  for (const raw of settings.store.emoji) {
    const s = raw.trim();
    if (!s) continue;
    const token = /^<(a)?:\w+:(\d+)>$/.exec(s);
    if (token) {
      out.push({ kind: "img", value: emojiCdnUrl(token[2], token[1] === "a", size) });
    } else if (/^https?:\/\//i.test(s)) {
      out.push({ kind: "img", value: s });
    } else {
      out.push({ kind: "text", value: s });
    }
  }
  return out;
}

function refreshParsed(): void {
  parsedEmoji = parseEmoji();
  emojiVersion++;
}

/** 在一个容器里把原文换成自定义字样。 */
function rewriteVerb(root: Element, re: RegExp, verb: string): void {
  let walker: TreeWalker;
  try {
    walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  } catch {
    return;
  }
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const text = node.nodeValue;
    if (!text) continue;
    // 全局正则的 replace 与 lastIndex 无关（每次从头，结束归零），复用安全。
    const next = text.replace(re, verb);
    if (next === text) continue;
    const textNode = node as Text;
    if (!originals.has(textNode)) originals.set(textNode, text);
    textNode.nodeValue = next;
    rewrites++;
  }
}

/** 丢掉离屏的还原记录，给还原表封顶。 */
function pruneDetached(): void {
  for (const node of [...originals.keys()]) {
    if (!node.isConnected) originals.delete(node);
  }
}

/** 容器里那个「没有文字」的直接子元素——原生跳动小圆点。 */
function findDotsEl(container: Element): Element | null {
  for (const child of Array.from(container.children)) {
    if (child.getAttribute("data-hc-plugin") === HOST_MARK) continue;
    if ((child.textContent ?? "").trim() === "") return child;
  }
  return null;
}

/** 我们插进这个容器的表情节点（如果有）。 */
function findHost(container: Element): HTMLElement | null {
  for (const child of Array.from(container.children)) {
    if (child.getAttribute("data-hc-plugin") === HOST_MARK) return child as HTMLElement;
  }
  return null;
}

function buildHost(): HTMLElement {
  const host = document.createElement("span");
  host.className = "hc-ct-emoji";
  host.setAttribute("data-hc-plugin", HOST_MARK);
  host.setAttribute("aria-hidden", "true");
  host.dataset.hcVer = String(emojiVersion);
  host.style.setProperty("--hc-ct-size", `${settings.store.emojiSize}px`);
  const anim = settings.store.animation;
  const animClass = anim && anim !== "none" ? `hc-ct-anim-${anim}` : "";
  for (const face of parsedEmoji) {
    let el: HTMLElement;
    if (face.kind === "img") {
      const img = document.createElement("img");
      img.src = face.value;
      img.className = "hc-ct-face";
      el = img;
    } else {
      el = document.createElement("span");
      el.className = "hc-ct-face hc-ct-face-text";
      el.textContent = face.value;
    }
    if (animClass) el.classList.add(animClass);
    host.appendChild(el);
  }
  return host;
}

/** 给一个容器换上自定义表情、藏掉原生小圆点。 */
function applyEmoji(container: Element): void {
  const existing = findHost(container);

  if (parsedEmoji.length === 0) {
    existing?.remove();
    for (const el of Array.from(container.querySelectorAll(`.${DOTS_HIDDEN}`))) {
      el.classList.remove(DOTS_HIDDEN);
    }
    return;
  }

  const dots = findDotsEl(container);
  if (!dots && !existing) return; // 不像输入状态，别乱插
  if (dots) dots.classList.add(DOTS_HIDDEN);

  if (existing && existing.dataset.hcVer === String(emojiVersion)) return;
  existing?.remove();
  container.insertBefore(buildHost(), container.firstChild);
}

function scan(): void {
  pruneDetached();
  const containers = firstContainerSet();
  if (containers.length === 0) return;

  const verb = settings.store.verb;
  const re = verb ? buildVerbRegex(verb) : null;

  for (const container of containers) {
    if (re && verb) rewriteVerb(container, re, verb);
    applyEmoji(container);
  }
}

/** 把突发变动合并成一次扫描，最多每 COALESCE_MS 一次。 */
function schedule(): void {
  if (pending) return;
  pending = setTimeout(() => {
    pending = undefined;
    scan();
  }, COALESCE_MS);
}

function injectStyle(): void {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = CSS;
  document.head.appendChild(style);
}

/** 撤掉所有注入的表情节点，并让被藏的小圆点重新显示。 */
function cleanupDom(): void {
  for (const host of Array.from(document.querySelectorAll(`[data-hc-plugin="${HOST_MARK}"]`))) {
    host.remove();
  }
  for (const el of Array.from(document.querySelectorAll(`.${DOTS_HIDDEN}`))) {
    el.classList.remove(DOTS_HIDDEN);
  }
}

export default definePlugin({
  id: "custom-typing",
  name: "自定义输入状态",
  description:
    "把频道底部「X 正在输入…」换成你写的字样（默认「正在叽里咕噜」），并把前面跳动的小圆点换成会晃动的自定义表情。对上 Discord 正在灰度的功能，只改你自己看到的画面。",
  authors: [{ name: "caitemm" }],
  category: "appearance",

  settings,

  start() {
    rewrites = 0;
    originals.clear();
    refreshParsed();
    injectStyle();

    if (typeof document !== "undefined" && document.body) {
      try {
        observer = new MutationObserver(schedule);
        observer.observe(document.body, { childList: true, subtree: true, characterData: true });
      } catch (err) {
        log.warn("MutationObserver 挂接失败，改用轮询兜底", err);
      }
    }
    sweepTimer = setInterval(schedule, SWEEP_MS);
    unsubs = [
      settings.subscribe("verb", () => schedule()),
      settings.subscribe("match", () => schedule()),
      settings.subscribe("emoji", () => {
        refreshParsed();
        schedule();
      }),
      settings.subscribe("animation", () => {
        refreshParsed();
        schedule();
      }),
      settings.subscribe("emojiSize", () => {
        refreshParsed();
        schedule();
      })
    ];

    scan();
    log.info(`已启用（字样「${settings.store.verb}」，表情 ${parsedEmoji.length} 个）`);
  },

  stop() {
    observer?.disconnect();
    observer = undefined;
    if (sweepTimer) {
      clearInterval(sweepTimer);
      sweepTimer = undefined;
    }
    if (pending) {
      clearTimeout(pending);
      pending = undefined;
    }
    for (const off of unsubs) {
      try {
        off();
      } catch {
        // best effort
      }
    }
    unsubs = [];

    // 还原当前还挂在页面上、被改过的文字节点；离屏的随重渲染消失，不用管。
    for (const [node, original] of originals) {
      try {
        if (node.isConnected) node.nodeValue = original;
      } catch {
        // 节点已随子树移除
      }
    }
    originals.clear();
    cleanupDom();
    document.getElementById(STYLE_ID)?.remove();
    log.info(`已停用（本次共替换文字 ${rewrites} 次）`);
  },

  /** 诊断快照。通过 HalcyonAPI.probe() 输出。 */
  probe(): Record<string, unknown> {
    const containers = firstContainerSet();
    return {
      active: observer != null || sweepTimer != null,
      verb: settings.store.verb,
      match: settings.store.match,
      emoji: settings.store.emoji,
      parsedEmojiCount: parsedEmoji.length,
      animation: settings.store.animation,
      rewrites,
      trackedNodes: originals.size,
      containerSelectors: probeSelectors(CONTAINER_SELECTORS),
      // 第一个输入状态容器的原始文本——替换没生效时照这里往 match 里加。
      sampleText: containers.length ? containers[0].textContent ?? "" : null
    };
  }
});
