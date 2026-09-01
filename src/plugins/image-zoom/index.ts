// image-zoom — hover an image, scroll to magnify.
//
// DOM-level on purpose: no source patch, no React tree touched. Discord renders
// pictures in a dozen places (chat, modal, profile, embeds) and they all end up
// as an `<img>`, so one document-level listener covers every one of them and
// cannot be broken by a component reshuffle. Which images qualify is decided by
// SIZE, not by class name — emoji and avatars are small, photos are not.
//
// The lens is a single body-mounted div with `pointer-events: none`, so hovering
// and clicking the image underneath still behave exactly as before.

import { definePlugin } from "../../core/plugin";
import { defineSettings } from "../../core/settings";
import { injectStyles } from "../../ui/inject-styles";
import { lensStyle, originalSrc, qualifies, stepLens, stepZoom } from "./lens";

const settings = defineSettings({
  zoom: {
    group: "放大镜",
    type: "number",
    default: 2.5,
    min: 1.5,
    max: 10,
    step: 0.5,
    label: "默认倍率",
    description: "滚轮可以随时调整；这里是每次悬停时的起始倍率。"
  },
  lensSize: {
    group: "放大镜",
    type: "number",
    default: 280,
    min: 120,
    max: 800,
    step: 20,
    label: "镜片大小（像素）",
    description: "按住 Shift 滚轮可以随时改。"
  },
  minSize: {
    group: "放大镜",
    type: "number",
    default: 100,
    min: 40,
    max: 400,
    step: 10,
    label: "最小生效尺寸（像素）",
    description: "比这个小的图不给放大镜，用来排除表情和头像。调低会连表情一起放大。"
  },
  square: {
    group: "放大镜",
    type: "boolean",
    default: false,
    label: "方形镜片",
    description: "默认是圆形。"
  },
  requireShift: {
    group: "放大镜",
    type: "boolean",
    default: false,
    label: "只在按住 Alt 时启用",
    description: "开启后平时不出现，按住 Alt 悬停才有——嫌它太主动就打开这个。"
  }
});

let lens: HTMLElement | null = null;
let current: HTMLImageElement | null = null;
let zoom = 2.5;
let size = 280;
let lastX = 0;
let lastY = 0;
let frame = 0;

function ensureLens(): HTMLElement {
  if (lens && document.contains(lens)) return lens;
  injectStyles();
  const el = document.createElement("div");
  el.className = "hc-zoom-lens";
  el.setAttribute("data-hc-plugin", "image-zoom");
  document.body.appendChild(el);
  lens = el;
  return el;
}

function hide(): void {
  current = null;
  if (lens) lens.style.display = "none";
}

/** Reposition against the last known cursor point. Batched into a frame. */
function paint(): void {
  frame = 0;
  if (!current || !lens) return;
  const rect = current.getBoundingClientRect();
  if (rect.width === 0 || rect.height === 0) {
    hide();
    return;
  }
  const style = lensStyle(rect, lastX, lastY, size, zoom);
  const half = size / 2;
  lens.style.display = "block";
  lens.style.width = `${size}px`;
  lens.style.height = `${size}px`;
  lens.style.borderRadius = settings.store.square ? "8px" : "50%";
  lens.style.left = `${Math.round(lastX - half)}px`;
  lens.style.top = `${Math.round(lastY - half)}px`;
  lens.style.backgroundImage = `url("${originalSrc(current.currentSrc || current.src)}")`;
  lens.style.backgroundSize = `${Math.round(style.bgWidth)}px ${Math.round(style.bgHeight)}px`;
  lens.style.backgroundPosition = `${Math.round(style.bgX)}px ${Math.round(style.bgY)}px`;
}

function schedule(): void {
  if (frame) return;
  frame = requestAnimationFrame(paint);
}

function onMouseMove(event: MouseEvent): void {
  lastX = event.clientX;
  lastY = event.clientY;

  if (settings.store.requireShift && !event.altKey) {
    if (current) hide();
    return;
  }

  const target = document.elementFromPoint(event.clientX, event.clientY);
  if (!qualifies(target, settings.store.minSize)) {
    if (current) hide();
    return;
  }
  if (target !== current) {
    current = target;
    // A fresh image starts at the configured magnification; carrying the last
    // one over makes the first hover feel random.
    zoom = settings.store.zoom;
    size = settings.store.lensSize;
  }
  schedule();
}

function onWheel(event: WheelEvent): void {
  if (!current) return;
  // Only once the lens is up, so normal scrolling over chat is untouched.
  if (event.shiftKey) size = stepLens(size, event.deltaY);
  else zoom = stepZoom(zoom, event.deltaY, 1.5, 10);
  event.preventDefault();
  schedule();
}

function onLeave(): void {
  hide();
}

export default definePlugin({
  id: "image-zoom",
  name: "图片放大镜",
  description:
    "鼠标悬停在图片上出现放大镜，滚轮调倍率、Shift+滚轮调镜片大小。放大用的是原图（去掉 Discord 的缩略图参数），所以放大后是真的更清楚，而不是把小图拉大。",
  authors: [{ name: "caitemm" }],
  category: "appearance",

  settings,

  start() {
    zoom = settings.store.zoom;
    size = settings.store.lensSize;
    // Capture phase so a stopPropagation somewhere in Discord's tree cannot
    // starve us; passive:false on wheel because we need preventDefault.
    document.addEventListener("mousemove", onMouseMove, true);
    document.addEventListener("wheel", onWheel, { capture: true, passive: false });
    document.addEventListener("mouseleave", onLeave, true);
    window.addEventListener("blur", onLeave);
  },

  stop() {
    document.removeEventListener("mousemove", onMouseMove, true);
    document.removeEventListener("wheel", onWheel, true);
    document.removeEventListener("mouseleave", onLeave, true);
    window.removeEventListener("blur", onLeave);
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
    current = null;
    lens?.remove();
    lens = null;
  }
});
