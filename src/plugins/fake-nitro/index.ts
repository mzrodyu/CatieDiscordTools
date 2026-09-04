// fake-nitro — send Nitro-locked custom emojis (and stickers) without Nitro.
//
// Ported from Vencord's FakeNitro plugin.
// https://github.com/Vendicated/Vencord/blob/main/src/plugins/fakeNitro/index.tsx
//
// TWO LAYERS:
//
//   1. Source patches (unlock the UI). Discord gates the emoji / sticker
//      pickers and stream quality on the current premium tier via a handful
//      of `canUse…()` predicates plus the emoji-unavailable enum. A previous
//      pass tried to overwrite those functions at runtime with findByProps +
//      property assignment — but on modern Discord the exports are frozen,
//      or the callers captured the function reference at module init, so
//      the mutation never reached the code path the picker uses ("没生效").
//      These source patches rewrite the factory bodies at load time, which
//      is how Vencord does it, and is the only reliable way.
//
//   2. Runtime send/edit hook (turn the fake token into a link). Once the
//      user has selected a locked emoji/sticker, we intercept sendMessage /
//      editMessage on the MessageActions module and rewrite the outgoing
//      content to a CDN URL, so recipients see an inline image. By default that
//      URL ships as a masked link — `[nailong_fadian](https://cdn…)` — which
//      still unfurls into the image but puts the emoji's NAME in the message
//      text instead of ninety characters of CDN path. See the "link shape" note
//      further down for the tradeoff.

import { definePlugin } from "../../core/plugin";
import { defineSettings } from "../../core/settings";
import { findByProps, lazy, getSourcePatchReport } from "../../core/modules/webpack";
import { UserStore, ChannelStore } from "../../core/common/discord";
import { emojiCdnUrl, stickerCdnUrl, StickerFormat } from "../../core/common/cdn";
import { patcher, type Unpatch, type PatchContext } from "../../core/patcher";
import { logger } from "../../core/logger";

const log = logger("fake-nitro");

// --- settings --------------------------------------------------------------

const settings = defineSettings({
  enableEmojiBypass: {
    group: "表情",
    type: "boolean",
    default: true,
    label: "绕过表情限制",
    description: "发送你没有 Nitro 权限的自定义表情（跨服 / 动态表情）时，自动改为发送该表情的图片链接。"
  },
  emojiSize: {
    group: "表情",
    type: "select",
    default: "48",
    label: "表情图片尺寸",
    description:
      "内联表情图片的边长（像素）。越大越清晰、占用越大。16 是 CDN 的下限，再小它只会回 400，所以没有更小的档。",
    options: [
      { value: "16", label: "16（最小）" },
      { value: "20", label: "20" },
      { value: "24", label: "24" },
      { value: "32", label: "32" },
      { value: "48", label: "48（默认）" },
      { value: "64", label: "64" },
      { value: "128", label: "128" },
      { value: "256", label: "256" },
      { value: "512", label: "512" }
    ]
  },
  enableStickerBypass: {
    group: "贴纸",
    type: "boolean",
    default: true,
    label: "绕过贴纸限制",
    description: "发送锁定的贴纸时改为发送贴纸图片链接。Lottie（矢量）贴纸无法内联，会跳过。"
  },
  stickerSize: {
    group: "贴纸",
    type: "select",
    default: "160",
    label: "贴纸图片尺寸",
    description: "内联贴纸图片的边长（像素）。同样以 16 为下限。",
    options: [
      { value: "16", label: "16（最小）" },
      { value: "24", label: "24" },
      { value: "32", label: "32" },
      { value: "64", label: "64" },
      { value: "128", label: "128" },
      { value: "160", label: "160（默认）" },
      { value: "256", label: "256" },
      { value: "512", label: "512" }
    ]
  },
  useHyperLinks: {
    group: "链接形式",
    type: "boolean",
    default: true,
    label: "用超链接代替裸链接",
    description:
      "改写成「[表情名](链接)」而不是直接贴一长串 CDN 地址。图片照样会出现，但消息里那行字变成表情名，混在句子里不再是一堵链接墙。"
  },
  hyperLinkText: {
    group: "链接形式",
    type: "string",
    default: "{{NAME}}",
    label: "超链接文字",
    description:
      "上一项开启时链接显示成什么，{{NAME}} 会替换成表情 / 贴纸的名字。想只留图片、连名字都不要，填一个零宽字符（如 U+200E）即可；Discord 不认空的链接文字，真留空会退回裸链接。",
    placeholder: "{{NAME}}",
    maxLength: 100
  },
  enableStreamQualityBypass: {
    group: "直播",
    type: "boolean",
    default: true,
    label: "解锁直播画质",
    description: "允许以 Nitro 画质进行屏幕共享直播（需重启客户端生效，因为这是源码级 patch）。"
  }
});

// --- Discord stores --------------------------------------------------------

const EmojiStore = lazy<any>((m) => m?.getName?.() === "EmojiStore");
const StickersStore = lazy<any>((m) => m?.getName?.() === "StickersStore");
const GuildMemberStore = lazy<any>((m) => m?.getName?.() === "GuildMemberStore");
const PermissionStore = lazy<any>((m) => m?.getName?.() === "PermissionStore" && typeof m?.can === "function");

const PERM = {
  USE_EXTERNAL_EMOJIS: 1n << 18n,
  USE_EXTERNAL_STICKERS: 1n << 37n,
  EMBED_LINKS: 1n << 14n
};

const STICKER_LOTTIE = StickerFormat.LOTTIE;

// EmojiIntentions enum (from Discord's own module). CHAT and
// GUILD_STICKER_RELATED_EMOJI are the two intentions we say "always allow"
// through the picker patches. Kept in sync with Vencord.
const INTENT_CHAT = 3;
const INTENT_STICKER_EMOJI = 4;

// --- helpers ---------------------------------------------------------------

function currentPremiumType(): number {
  try {
    return (UserStore.getCurrentUser?.()?.premiumType ?? 0) as number;
  } catch {
    return 0;
  }
}

const canUseEmotesNatively = (): boolean => currentPremiumType() > 0;
const canUseStickersNatively = (): boolean => currentPremiumType() > 1;

function hasPermission(channelId: string, bit: bigint): boolean {
  try {
    const channel = ChannelStore.getChannel?.(channelId);
    if (!channel || channel.isPrivate?.()) return true;
    return PermissionStore.can?.(bit, channel) ?? true;
  } catch {
    return true;
  }
}

function guildIdOfChannel(channelId: string): string | undefined {
  try {
    const channel = ChannelStore.getChannel?.(channelId);
    return channel?.guild_id ?? channel?.getGuildId?.() ?? undefined;
  } catch {
    return undefined;
  }
}

function canUseEmote(emoji: any, channelId: string, guildId: string | undefined): boolean {
  if (emoji?.type === 0) return true;
  if (emoji?.available === false) return false;

  let usableManaged = false;
  if (emoji?.managed && emoji?.guildId) {
    const myRoles = GuildMemberStore.getSelfMember?.(emoji.guildId)?.roles ?? [];
    usableManaged = Array.isArray(emoji?.roles) && emoji.roles.some((r: string) => myRoles.includes(r));
  }

  if (canUseEmotesNatively() || usableManaged) {
    return emoji.guildId === guildId || hasPermission(channelId, PERM.USE_EXTERNAL_EMOJIS);
  }
  return !emoji?.animated && emoji?.guildId === guildId;
}

// --- URL construction ------------------------------------------------------
//
// Both builders delegate to core/common/cdn, which encodes the one rule that
// matters here: an animated emoji is `.webp?size=<n>&animated=true`, never
// `.gif`. The `.gif` form 415s on every animated custom emoji, so what the
// recipient got was a dead link in plain text instead of an image — the exact
// bug this replaced. See the note at the top of core/common/cdn.ts.

function emojiSize(): number {
  return Number(settings.store.emojiSize) || 48;
}

function emojiUrl(emoji: any): string {
  return emojiCdnUrl(String(emoji?.id), Boolean(emoji?.animated), emojiSize());
}

function stickerUrl(sticker: any): string {
  const url = new URL(stickerCdnUrl(String(sticker?.id), sticker?.format_type, Number(settings.store.stickerSize) || 160));
  if (sticker?.name) url.searchParams.set("name", String(sticker.name));
  return url.toString();
}

function wordBoundary(str: string, offset: number): string {
  return !str[offset] || /\s/.test(str[offset]) ? "" : " ";
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// --- link shape ------------------------------------------------------------
//
// Two ways to drop a CDN URL into a message, and they read very differently on
// the receiving end:
//
//   bare        https://cdn.discordapp.com/emojis/1514172282812104745.webp?size=48&animated=true
//   hyperlink   [nailong_fadian](https://cdn.discordapp.com/emojis/1514172282812104745.webp?size=48&animated=true)
//
// Discord unfurls the URL into an image embed EITHER WAY — a masked link does
// not suppress the preview (only `<…>` angle brackets do) — so the emoji still
// arrives as a picture. What changes is the line of text above it: ninety-odd
// characters of CDN path, or the emoji's name. In a sentence, the bare form is
// the thing that wrecks the message, so hyperlinks are the default.
//
// What it costs, stated plainly: a message whose content is nothing but a bare
// media link gets that text hidden by Discord, leaving a clean standalone image.
// `[name](url)` is not a bare link, so that collapse doesn't happen and the
// label stays visible. If the emoji-on-its-own case is the one you care about,
// turn 「用超链接代替裸链接」 off — or set the label to a zero-width character,
// which gets you the image with no visible text in both cases.

/** Delimiters Discord only acts on in pairs. A lone one renders as itself. */
const PAIRED_MARKDOWN = ["*", "_", "~", "|", "`"];

/**
 * Make a name safe to use as a link label. Three different problems, handled
 * three different ways:
 *
 *   `[` and `]` are STRIPPED, not escaped. Discord's link regex defines the label
 *   as "anything except a bracket, or a balanced pair" and has no case for a
 *   backslash-escaped one, so `[a\]b](url)` does not parse as a link at all — the
 *   label ends early and the remainder leaks out as literal text. Deleting them
 *   is the only thing that keeps the link a link.
 *
 *   A backslash is always doubled, so it can't eat the character after it.
 *
 *   Emphasis delimiters are escaped ONLY from the second occurrence on. A lone
 *   `_` is inert — `nailong_fadian` really renders as `nailong_fadian` — so
 *   escaping it buys nothing and stakes the common case on Discord applying the
 *   `escape` rule inside a link label (it re-parses the label with the inline
 *   rules, so it should, but nothing here needs to depend on that). Two or more
 *   can pair up and italicise the middle, and there the escape is worth it:
 *   `nai_long_fa_dian` would otherwise come out with "long_fa" in italics.
 *
 * Applied to the substituted NAME only, never to the whole template: someone who
 * types `**{{NAME}}**` into the setting means that asterisk.
 */
function escapeMarkdown(text: string): string {
  let out = text.replace(/[[\]]/g, "").replace(/\\/g, "\\\\");
  for (const delimiter of PAIRED_MARKDOWN) {
    const parts = out.split(delimiter);
    if (parts.length > 2) out = parts.join(`\\${delimiter}`);
  }
  return out;
}

/**
 * Attach `?name=` to a URL. Vencord's FakeNitro reads that param to render the
 * link back as a real inline emoji when the id isn't in its own EmojiStore —
 * which is exactly the cross-server case — so carrying it means a Vencord
 * recipient sees `:nailong_fadian:` rather than `:FakeNitroEmoji:`.
 *
 * Only done for the hyperlink form, where the URL sits hidden behind the label
 * and the extra bytes are free. In bare mode the URL *is* the visible text, and
 * making it longer is the exact complaint hyperlinks exist to fix.
 */
function withNameParam(url: string, name: string): string {
  if (!name) return url;
  try {
    const u = new URL(url);
    u.searchParams.set("name", name);
    return u.toString();
  } catch {
    return url;
  }
}

/**
 * The text one emoji / sticker token is replaced with: either the bare CDN URL,
 * or a masked link labelled from `hyperLinkText`.
 *
 * Falls back to the bare URL when the label comes out empty — Discord does not
 * parse `[](url)` as a link, so an empty label would ship the literal brackets
 * and the full URL anyway, which is worse than either option on purpose.
 */
function renderLink(url: string, name: string): string {
  if (!settings.store.useHyperLinks) return url;
  const label = String(settings.store.hyperLinkText ?? "")
    .replace(/\{\{NAME\}\}/g, () => escapeMarkdown(name))
    .trim();
  if (label.length === 0) return url;
  return `[${label}](${withNameParam(url, name)})`;
}

// --- send / edit rewrites --------------------------------------------------

function findMessageArg(args: any[]): any {
  const m = args[1];
  if (m && typeof m === "object" && typeof m.content === "string") return m;
  return args.find((a) => a && typeof a === "object" && typeof a.content === "string");
}

function findOptionsArg(args: any[]): any {
  for (let i = 2; i < args.length; i++) {
    const a = args[i];
    if (a && typeof a === "object" && "stickerIds" in a) return a;
  }
  return args[3] && typeof args[3] === "object" ? args[3] : undefined;
}

function rewriteStickers(channelId: string, message: any, options: any, guildId: string | undefined): boolean {
  if (!settings.store.enableStickerBypass) return false;
  const ids: string[] | undefined = options?.stickerIds;
  if (!Array.isArray(ids) || ids.length === 0) return false;

  const sticker = StickersStore.getStickerById?.(ids[0]);
  if (!sticker) return false;
  if ("pack_id" in sticker) return false;

  const canUse = canUseStickersNatively() && hasPermission(channelId, PERM.USE_EXTERNAL_STICKERS);
  if (sticker.available !== false && (canUse || sticker.guild_id === guildId)) return false;

  if (sticker.format_type === STICKER_LOTTIE) {
    log.warn("Lottie 贴纸无法作为图片内联，已跳过：", sticker.name);
    return false;
  }

  const url = renderLink(stickerUrl(sticker), String(sticker?.name ?? ""));
  message.content = `${message.content ?? ""}${wordBoundary(message.content ?? "", (message.content ?? "").length - 1)}${url}`;
  ids.length = 0;
  return true;
}

/**
 * `<:name:id>` / `<a:name:id>`, skipping an escaped leading `\<`. Captures:
 *   1: "a" if animated, empty otherwise
 *   2: id
 * The `animated` flag is captured directly from the token so URL rewriting
 * doesn't have to consult EmojiStore — which is critical for cross-server
 * emoji where the emoji record may not be cached at all.
 */
const EMOJI_TOKEN_RE = /(?<!\\)<(a)?:(\w+):(\d+)>/gi;

function rewriteEmojis(channelId: string, message: any, guildId: string | undefined): boolean {
  if (!settings.store.enableEmojiBypass) return false;

  let changed = false;
  const emojis = message?.validNonShortcutEmojis;

  // Fast path: Discord already parsed the draft's emojis for us. This is what
  // the compose box normally supplies, complete with `animated` / `guildId`.
  if (Array.isArray(emojis) && emojis.length > 0) {
    for (const emoji of emojis) {
      if (canUseEmote(emoji, channelId, guildId)) continue;

      const token = `<${emoji.animated ? "a" : ""}:${emoji.originalName || emoji.name}:${emoji.id}>`;
      // Label from `name` — what your client calls it — rather than the token's
      // `originalName`, so the recipient reads the name you actually saw.
      const url = renderLink(emojiUrl(emoji), String(emoji.name || emoji.originalName || ""));
      const re = new RegExp(escapeRegExp(token), "g");
      message.content = String(message.content ?? "").replace(
        re,
        (match: string, offset: number, str: string) => {
          changed = true;
          return `${wordBoundary(str, offset - 1)}${url}${wordBoundary(str, offset + match.length)}`;
        }
      );
    }
  }

  // Fallback: scan the raw content for `<a?:name:id>` tokens directly. This is
  // what covers cross-server emoji, where validNonShortcutEmojis silently drops
  // them (parse only lists emojis whose id is currently in EmojiStore, and a
  // cross-server one may not be cached at all). The token itself already tells
  // us everything we need to build the URL — the leading `a` marks it animated,
  // the id goes into the CDN path — so we do NOT gate this on EmojiStore
  // presence. That gate was the actual failure: a cross-server emoji token
  // whose id wasn't in the local cache used to be `return tokenStr`-ed, so it
  // left the client unmodified and the recipient saw `:name:` because their
  // client also couldn't resolve the id.
  const before = String(message.content ?? "");
  EMOJI_TOKEN_RE.lastIndex = 0;
  if (before.length > 0 && EMOJI_TOKEN_RE.test(before)) {
    EMOJI_TOKEN_RE.lastIndex = 0;
    const rewritten = before.replace(
      EMOJI_TOKEN_RE,
      (tokenStr: string, animatedFlag: string | undefined, name: string, emojiId: string, offset: number, str: string) => {
        // If we have the emoji cached AND it's usable natively here, keep the
        // token (Discord will render it inline for free). Otherwise rewrite —
        // including when the emoji isn't cached at all, which is the exact
        // cross-server case.
        const cached = EmojiStore.getCustomEmojiById?.(emojiId);
        if (cached && canUseEmote(cached, channelId, guildId)) return tokenStr;

        changed = true;
        // The token carries the name, so a hyperlink label is available here too
        // even when the emoji is in no store at all.
        const url = renderLink(emojiUrlFromParts(emojiId, Boolean(animatedFlag)), name);
        return `${wordBoundary(str, offset - 1)}${url}${wordBoundary(str, offset + tokenStr.length)}`;
      }
    );
    if (rewritten !== before) message.content = rewritten;
  }

  return changed;
}

/**
 * Build a CDN URL from just an emoji id + animated flag — no store lookup.
 * Same shape `emojiUrl(emoji)` produces; kept split so the token-scan fallback
 * above can call in without a full emoji record.
 */
function emojiUrlFromParts(id: string, animated: boolean): string {
  return emojiCdnUrl(id, animated, emojiSize());
}

let unpatchSend: Unpatch | undefined;
let unpatchEdit: Unpatch | undefined;

function onSendMessage(ctx: PatchContext): void {
  try {
    const args = ctx.args;
    const channelId: string = args[0];
    const message = findMessageArg(args);
    if (!message) return;
    // Pre-send source patch already rewrote this message; skip.
    if (message.__fakeNitroRewritten) return;
    if (typeof message.content !== "string") message.content = String(message.content ?? "");

    const options = findOptionsArg(args);
    const guildId = guildIdOfChannel(channelId);

    if (options) rewriteStickers(channelId, message, options, guildId);
    rewriteEmojis(channelId, message, guildId);
  } catch (err) {
    log.error("send 改写失败，消息按原样发送", err);
  }
}

function onEditMessage(ctx: PatchContext): void {
  try {
    if (!settings.store.enableEmojiBypass) return;
    const args = ctx.args;
    const channelId: string = args[0];
    const message = findMessageArg(args);
    if (!message || typeof message.content !== "string") return;

    const guildId = guildIdOfChannel(channelId);
    message.content = message.content.replace(
      EMOJI_TOKEN_RE,
      (tokenStr: string, animatedFlag: string | undefined, name: string, emojiId: string, offset: number, str: string) => {
        // Same policy as the send fallback: keep the token only when the emoji
        // is cached AND usable natively here. Everything else — a rewrite in
        // progress, cross-server, no cache — becomes a URL, using the token's
        // own `animated` flag so we don't need a store record to build it.
        const cached = EmojiStore.getCustomEmojiById?.(emojiId);
        if (cached && canUseEmote(cached, channelId, guildId)) return tokenStr;
        const url = renderLink(emojiUrlFromParts(emojiId, Boolean(animatedFlag)), name);
        return `${wordBoundary(str, offset - 1)}${url}${wordBoundary(str, offset + tokenStr.length)}`;
      }
    );
  } catch (err) {
    log.error("edit 改写失败，消息按原样保存", err);
  }
}

/**
 * Boot-time diagnostic: report which of this plugin's source patches actually
 * matched THIS Discord build. Source patches only apply at module load and
 * their find targets shift between client versions, so a locked picker with
 * every patch showing "已应用" is a different failure than one where a picker
 * patch never matched. Logged loudly and per-patch so the state is never a
 * guess.
 *
 * Reported per REPLACEMENT, not per patch. A spec like "emoji picker unlock"
 * carries five replacements; when Discord reshaped only the premium-locked gate
 * the other four still landed, so a spec-level report said 已应用 while
 * cross-server emoji sat locked. The `第 n/m 处` suffix is what makes that
 * visible.
 */
function reportPatches(): void {
  const mine = getSourcePatchReport().filter((p) => p.pluginId === "fake-nitro");
  if (!mine.length) {
    log.warn(
      "本插件没有注册任何源码 patch —— 启动时它处于关闭状态。在设置里打开“假 Nitro”后" +
        "必须刷新页面：源码 patch 只在模块加载那一刻生效，中途开启不会补上。"
    );
    return;
  }
  const name = (p: (typeof mine)[number]): string =>
    p.count > 1 ? `“${p.label}” 第 ${p.index}/${p.count} 处` : `“${p.label}”`;
  const missed = mine.filter((p) => !p.applied && !p.optional);
  const degraded = mine.filter((p) => !p.applied && p.optional);
  if (missed.length === 0) {
    log.info(`表情 / 贴纸解锁的源码 patch 均已在当前 Discord 版本生效（共 ${mine.length} 处替换）`);
  } else {
    // Two very different failures hide behind "未匹配". `seen > 0` means the
    // module was handed to this patch and only the match regex is stale — that
    // is the one worth re-anchoring. `seen === 0` means the module never
    // arrived (not loaded yet, or `find` itself no longer selects it), where a
    // new regex would change nothing.
    const stale = missed.filter((p) => p.seen > 0);
    const unseen = missed.filter((p) => p.seen === 0);
    if (stale.length > 0) {
      log.warn(
        "以下 patch 找到了目标模块，但替换正则已对不上当前 Discord 版本（需要重锚）：" +
          stale.map(name).join("、")
      );
    }
    if (unseen.length > 0) {
      log.warn(
        "以下 patch 从未拿到目标模块 —— 模块还没加载，或 find 已失效：" +
          unseen.map(name).join("、") +
          "。若相关界面（表情选择器等）已经打开过仍是这样，就是 find 需要更新。"
      );
    }
  }
  if (degraded.length > 0) {
    log.info("以下可选 patch 未匹配（仅影响附带功能，不影响表情 / 贴纸）：" + degraded.map(name).join("、"));
  }
}

// --- the plugin ------------------------------------------------------------

// The "always allow" intention set injected into the picker patches. The
// factory rewrite lands a `fakeNitroIntention` local variable in scope, then
// this expression widens the picker's OK-to-use predicates so those two
// intentions pass regardless of premium tier.
const IS_BYPASSEABLE_INTENTION = `[${INTENT_CHAT},${INTENT_STICKER_EMOJI}].includes(fakeNitroIntention)`;

export default definePlugin({
  id: "fake-nitro",
  name: "假 Nitro",
  description:
    "无需 Nitro 也能使用需要 Nitro 的自定义表情与贴纸：解锁选择器，并在发送时把锁定的表情 / 贴纸自动改写为图片链接，默认写成「[表情名](链接)」的超链接形式，对方看到表情名加内联图片，而不是一长串地址。修改需重启客户端才能完全生效。",
  authors: [{ name: "Vencord" }, { name: "caitemm" }],
  category: "chat",

  settings,

  patches: [
    // 0. THE send-time fix — pre-send rewrite, same seam as Vencord's
    //    MessageEventsAPI (find: ".handleSendMessage,onResize:"), but the match
    //    is re-anchored to THIS build's `handleSendMessage`, verified against
    //    the dumped module source. Vencord's upstream regex expects
    //    `parse(channel,...).getSendMessageOptions({...});` back-to-back; this
    //    build instead reads:
    //
    //      let w=X.Y.parse(h,t);            // w = parsed draft (validNonShortcutEmojis)
    //      w.tts=...; ...
    //      let I={...Z.getSendMessageOptions({content:t,channelId:h.id,...}),
    //             location:...};            // I = send options (stickerIds)
    //      if(...) <send>
    //
    //    So we capture w (message), h (channel), I (options) and splice our
    //    rewrite in right after `let I={...};` — before the send, and before
    //    the client-side "该表情符号为动态表情" check that otherwise aborts an
    //    animated / cross-server emoji locally. By then the `<a:name:id>` token
    //    is already a CDN URL, so the check sees a plain link and lets it through.
    //
    //    Hooking MessageActions.sendMessage (the old approach) fired AFTER that
    //    block already killed the send — which is why the emoji came back
    //    "无法使用" no matter what.
    //
    //    NOTE (verified against the current bundle): this patch is no longer
    //    load-bearing. Discord's `_sendMessage` does NOT abort on locked
    //    emoji — it posts a local Clyde notice and sends anyway — and once the
    //    picker patch below lands, `isEmojiPremiumLocked` returns false for
    //    CHAT, so `parse()` files these emoji under validNonShortcutEmojis and
    //    `invalidEmojis` comes back empty. The runtime sendMessage hook is
    //    therefore enough on its own; this patch just gets the rewrite in
    //    earlier. If the boot report says it missed, sending still works.
    {
      label: "message pre-send rewrite",
      find: /handleSendMessage[\s\S]{0,200}onResize|getSendMessageOptions[\s\S]{0,500}handleSendMessage/,
      replacement: {
        match:
          /let ([\w$]+)=[\w$]+\.[\w$]+\.parse\(([\w$]+),[\w$]+\);.+?let ([\w$]+)=\{\.\.\.[\w$]+\.[\w$]+\.getSendMessageOptions\(\{.+?\}\),location:[^}]*\};/,
        replace: (m: string, msg: string, channel: string, options: string) =>
          `${m}if($self.handlePreSend(${channel}.id,${msg},${options}))return{shouldClear:false,shouldRefocus:true};`
      }
    },

    // 1. Premium predicate bypass. The `canUse…` helpers under PremiumUtils
    //    gate every "is this a premium feature?" check in the client. Rewrite
    //    each function body to just `return true;` so the picker, sticker
    //    dropdowns, and stream-quality options all show as usable.
    {
      label: "premium predicates return true",
      find: "canUseCustomStickersEverywhere:",
      replacement: [
        {
          match: /(?<=canUseCustomStickersEverywhere:function\([\w$]+\)\{)/,
          replace: "return true;"
        },
        {
          match: /(?<=canUseHighVideoUploadQuality:function\([\w$]+\)\{)/,
          replace: "return true;"
        },
        {
          match: /(?<=canStreamQuality:function\([\w$]+,[\w$]+\)\{)/,
          replace: "return true;"
        },
        {
          match: /(?<=canUseClientThemes:function\([\w$]+\)\{)/,
          replace: "return true;"
        },
        {
          match: /(?<=canUsePremiumAppIcons:function\([\w$]+\)\{)/,
          replace: "return true;"
        }
      ]
    },

    // 2. Voice-call emoji picker keeps its native (server-side) restriction:
    //    fake-nitro shouldn't try to bypass emoji use in voice channels where
    //    the intention isn't CHAT. Vencord swaps the CHAT constant for STATUS
    //    at this exact call site so our picker patches leave voice alone.
    {
      label: "voice call emoji stays native",
      find: '.getByName("fork_and_knife")',
      replacement: {
        match: /\.CHAT/,
        replace: ".STATUS"
      }
    },

    // 3. Emoji picker unlock. The module that produces the "why is this emoji
    //    disabled?" enum has multiple gates: DISALLOW_EXTERNAL,
    //    GUILD_SUBSCRIPTION_UNAVAILABLE, premium-locked, animated-locked.
    //    Widen each so intentions CHAT (3) and GUILD_STICKER_RELATED_EMOJI (4)
    //    pass, giving the picker "usable" for anything we're about to rewrite
    //    into a URL anyway.
    {
      label: "emoji picker unlock",
      find: ".GUILD_SUBSCRIPTION_UNAVAILABLE;",
      replacement: [
        // Introduce `fakeNitroIntention`, bound to Discord's own intention
        // variable, so the widenings below can key off it.
        //
        // Vencord anchors this on the literal `intention:` token — but that
        // token is ABSENT in the current build (verified against the dumped
        // module source): the intention is a bare minified variable, e.g.
        // `d`, compared as `d===X.EmojiIntention.STATUS`. Anchoring on the
        // (present) `.USE_EXTERNAL_EMOJIS,x);` statement boundary and reading
        // the intention variable out of the nearby
        // `isExternalEmojiAllowedForIntention(d)` call is what actually lands.
        //
        // This one MUST match: patches #2–#5 below all reference
        // `fakeNitroIntention`, so if this fails while they apply, the emoji
        // function throws ReferenceError on every call and the picker greys
        // out everything — which is exactly the "全是锁" symptom this fixes.
        {
          match: /(?<=\.USE_EXTERNAL_EMOJIS,[\w$]+\);)(?=.{0,300}?isExternalEmojiAllowedForIntention\)\(([\w$]+)\))/,
          replace: "const fakeNitroIntention=$1;"
        },
        // DISALLOW_EXTERNAL: bypass for our intentions.
        {
          match: /&&![\w$]+&&![\w$]+(?=\)return [\w$]+\.[\w$]+\.DISALLOW_EXTERNAL;)/,
          replace: `$&&&!${IS_BYPASSEABLE_INTENTION}`
        },
        // GUILD_SUBSCRIPTION_UNAVAILABLE: bypass for our intentions.
        {
          match: /![\w$]+\.available(?=\)return [\w$]+\.[\w$]+\.GUILD_SUBSCRIPTION_UNAVAILABLE;)/,
          replace: `$&&&!${IS_BYPASSEABLE_INTENTION}`
        },
        // "You need premium for cross-server emoji". THIS is the one Discord's
        // update broke, and the one that shows as 跨服务器表情全部上锁 with the
        // 获取 Nitro banner: the gate used to read
        //
        //   if(!X.canUseEmojisEverywhere(user)&&!sameGuild){…PREMIUM_LOCKED}
        //
        // and now reads
        //
        //   if(!(bypassEntitlement||X.canUseEmojisEverywhere(user))&&!sameGuild)
        //
        // so a regex anchored on a `!` sitting directly against the call no
        // longer matches. Rather than re-pin to the new shape (and break again
        // on the next reshuffle) match the CALL and widen it in place, keeping
        // whatever negation wrapper it sits in. `(call||bypassable)` inside
        // `!(…)` and inside a bare `!…` both collapse to "not locked", so this
        // holds for either shape.
        {
          match: /!\(?(?:[\w$]+\|\|)?([\w$]+\.[\w$]+\.canUseEmojisEverywhere\([\w$]+\))/,
          replace: (m: string, call: string) => m.replace(call, `(${call}||${IS_BYPASSEABLE_INTENTION})`)
        },
        // "You need premium for animated emoji": pretend we can, for our intentions.
        {
          match: /(?<=\|\|)[\w$]+\.[\w$]+\.canUseAnimatedEmojis\([\w$]+\)/,
          replace: `($&||${IS_BYPASSEABLE_INTENTION})`
        }
      ]
    },

    // 4. Subscription-locked (role-benefit) emoji unlock. A guarded predicate
    //    returns false when the current user lacks admin on the role-benefit
    //    guild. Route calls that WE make (with a fakeNitroOriginal=true tail
    //    arg) through the original, and let everyone else's calls (i.e. the
    //    picker's own probe) short-circuit to "usable".
    {
      label: "subscription emoji unlock",
      find: ".getUserIsAdmin(",
      replacement: {
        match: /(function [\w$]+\([\w$]+,[\w$]+)\)\{(.{0,250}\.getUserIsAdmin\(.+?return!1\})/,
        replace: "$1,fakeNitroOriginal){if(!fakeNitroOriginal)return false;$2"
      }
    },

    // 5. Sticker always "SENDABLE". Same trick: rewrite the availability
    //    predicate at the sticker send-affordance site so the picker doesn't
    //    grey out locked stickers before our runtime send hook can rewrite
    //    them into image links.
    {
      label: "stickers always sendable",
      find: '"SENDABLE"',
      replacement: {
        match: /[\w$]+\.available\?/,
        replace: "true?"
      }
    },

    // 6. Stream quality: drop the `guildPremiumTier: TIER_x,` requirements
    //    from the stream FPS / resolution options so all quality tiers are
    //    picker-visible regardless of the server's boost level.
    //
    //    NOTE: Vencord's find is the intl macro `#{intl::STREAM_FPS_OPTION}`,
    //    which its build step rewrites into the real (hashed) runtime lookup.
    //    This runtime has no such transform, so that literal never appears in
    //    Discord's code. We fall back to the bare `STREAM_FPS_OPTION` token as
    //    a best effort; if the build hashes it away this patch simply no-ops
    //    (stream quality is a minor extra — it never blocks emoji/sticker use).
    {
      label: "stream quality tiers removed",
      find: "STREAM_FPS_OPTION",
      all: true,
      optional: true,
      replacement: {
        match: /guildPremiumTier:[\w$]+\.[\w$]+\.TIER_\d,?/,
        replace: ""
      }
    },

    // 7. Custom desktop app icons — the picker checks `isPremium(currentUser)`.
    //    Force true. Small quality-of-life patch that comes free with the
    //    premium-bypass mood.
    {
      label: "custom app icons",
      find: "getCurrentDesktopIcon(),",
      replacement: {
        match: /[\w$]+\.[\w$]+\.isPremium\([\w$]+\.[\w$]+\.getCurrentUser\(\)\)/,
        replace: "true"
      }
    },

    // 8. Custom client themes — a `isTier2Above` gate on the custom-theme
    //    editor. Force true so the editor unlocks for the user.
    {
      label: "custom client themes",
      find: '("custom_themes_editor_footer")',
      all: true,
      optional: true,
      replacement: {
        match: /\(0,[\w$]+\.[\w$]+\)\([\w$]+\.[\w$]+\.TIER_2\)(?=,|;)/,
        replace: "true"
      }
    },

    // 9. Soundboard sounds — `available` fields arrive as false for locked
    //    sounds on non-Nitro accounts. Force them to true on the ingest
    //    reducers so the picker treats them as usable.
    {
      label: "soundboard sounds available",
      find: 'type:"GUILD_SOUNDBOARD_SOUND_CREATE"',
      all: true,
      replacement: {
        match: /(?<=type:"(?:SOUNDBOARD_SOUNDS_RECEIVED|GUILD_SOUNDBOARD_SOUND_CREATE|GUILD_SOUNDBOARD_SOUND_UPDATE|GUILD_SOUNDBOARD_SOUNDS_UPDATE)".+?available:)[\w$]+\.available/,
        replace: "true"
      }
    }
  ],

  start() {
    // The send/edit path is a runtime concern — the picker's already unlocked
    // by the patches above; here we intercept the outbound MessageActions call
    // and rewrite `<a?:name:id>` tokens (plus stickerIds) into CDN URLs so the
    // recipient sees an inline image.
    const messageActions = findByProps("sendMessage", "editMessage", "deleteMessage");
    if (messageActions) {
      if (typeof messageActions.sendMessage === "function") {
        try {
          unpatchSend = patcher.before(messageActions, "sendMessage", onSendMessage);
        } catch (err) {
          log.error("挂接 sendMessage 失败", err);
        }
      }
      if (typeof messageActions.editMessage === "function") {
        try {
          unpatchEdit = patcher.before(messageActions, "editMessage", onEditMessage);
        } catch (err) {
          log.error("挂接 editMessage 失败", err);
        }
      }
      log.info("MessageActions 已挂接（发送 / 编辑改写就绪；若 pre-send 补丁已生效则此 hook 仅作 fallback）");
    } else {
      log.warn(
        "未找到 MessageActions —— 选择器解锁已通过源码 patch 生效，但发送时的 URL 改写不可用。" +
          "重启客户端后再试；若仍未找到，说明该 Discord 版本的 MessageActions 形状有变。"
      );
    }

    // Self-diagnostic. Source patches only match at module-load, and their find
    // targets shift between Discord builds. Give module loading a moment, then
    // report — loudly and per-patch — which of our patches actually landed on
    // THIS build. This is the ground truth for "为什么还是锁着": a locked picker
    // with every patch showing "已应用" is a different bug than one where the
    // emoji-picker patch never matched.
    setTimeout(reportPatches, 4000);
  },

  stop() {
    unpatchSend?.();
    unpatchEdit?.();
    unpatchSend = undefined;
    unpatchEdit = undefined;
    // The source patches are one-shot at module load; nothing to unwind here.
    // Toggling the plugin off after boot leaves the picker unlocked until the
    // client is restarted, and `runtime.needsRestart(id)` will report that.
  },

  /**
   * Called from the pre-send source patch (#0) with Discord's freshly parsed
   * draft — at the exact point Vencord's MessageEventsAPI fires, after parse
   * and before send. Rewrites locked sticker ids and emoji tokens in
   * `messageObj` IN PLACE into CDN URLs. Returns false so the send is never
   * cancelled: we've already mutated the draft, there's nothing to abort.
   * Guarded end-to-end — a throw here must never break the send box.
   */
  handlePreSend(channelId: string, messageObj: any, options: any): boolean {
    try {
      if (typeof messageObj?.content !== "string") {
        messageObj.content = String(messageObj?.content ?? "");
      }
      const guildId = guildIdOfChannel(channelId);
      if (options) rewriteStickers(channelId, messageObj, options, guildId);
      rewriteEmojis(channelId, messageObj, guildId);
      // Mark so the runtime hook (fallback) doesn't double-rewrite.
      messageObj.__fakeNitroRewritten = true;
    } catch (err) {
      log.error("pre-send 改写失败，消息按原样发送", err);
    }
    return false;
  },

  /**
   * Dry run of the emoji rewrite, for message-preview's "what actually goes on
   * the wire" block. Same code path the send takes, on a throwaway object, so
   * the preview can never disagree with reality by construction.
   *
   * Stickers are deliberately out of scope: they never live in the draft text —
   * they ride along as `options.stickerIds`, which a preview of the text box has
   * no view of.
   *
   * Returns the input unchanged on any failure. Nothing here is allowed to be
   * load-bearing for sending; it is a read-only question about it.
   */
  previewOutgoing(channelId: string, content: string): string {
    try {
      if (typeof content !== "string" || content.length === 0) return content ?? "";
      const scratch: { content: string } = { content };
      rewriteEmojis(channelId, scratch, guildIdOfChannel(channelId));
      return scratch.content;
    } catch (err) {
      log.debug("previewOutgoing 失败，按原文返回", err);
      return content;
    }
  }
});
