// The message-cleaner page.
//
// Message cleanup controls with an Undiscord-style search backend. Includes:
// - Token input + auto-extract
// - Guild/channel picker (REST)
// - Time range filter (after/before)
// - Message range (after/before a message id, click-to-pick in chat)
// - Content filters (text / link / file / pinned / regex)
// - Order selector
// - Preview → pick what to keep → Delete selected
// - Stats query

import { useRef, useState, useEffect } from "../../../core/common/react";
import { Section } from "../../../ui/components/Section";
import { Button } from "../../../ui/components/Button";
import { Toggle } from "../../../ui/components/Toggle";
import { TextInput } from "../../../ui/components/TextInput";
import { Select } from "../../../ui/components/Select";
import { Badge } from "../../../ui/components/Badge";
import { SearchIcon, TrashIcon, ListIcon, WarningIcon, RefreshIcon, ServerIcon } from "../../../icons";
import { logger } from "../../../core/logger";
import { settings } from "../settings";
import {
  collect,
  remove,
  count,
  extractToken,
  fetchUserId,
  currentTarget,
  takePendingTarget,
  fetchGuilds,
  fetchChannels,
  fetchGuildName,
  fetchChannelName,
  type CollectedMessage,
  type CleanOptions,
  type CleanTarget,
  type Controller,
  type GuildInfo,
  type ChannelInfo
} from "../cleaner";
import { pickMessage, type MessagePick } from "../pick-message";

const log = logger("message-cleaner");

type Mode = "idle" | "previewing" | "deleting";
type LogLevel = "info" | "success" | "warn" | "error";

interface LogEntry {
  id: number;
  time: string;
  level: LogLevel;
  text: string;
}

/** Keep the log pane bounded — a 5000-message flush would otherwise grow it forever. */
const LOG_LIMIT = 500;

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function clockTime(d: Date): string {
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`;
}

/** Map a progress headline onto a log level, so the pane reads at a glance. */
function levelOf(state: string): LogLevel {
  if (/失败|错误|无效|不可用/.test(state)) return "error";
  if (/停止|跳过|索引|限速|重试/.test(state)) return "warn";
  if (/完成|已删除|成功/.test(state)) return "success";
  return "info";
}

function formatTs(ts: string): string {
  const date = new Date(ts);
  if (Number.isNaN(date.getTime())) return "";
  return `${pad2(date.getMonth() + 1)}-${pad2(date.getDate())} ${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
}

/** Rows mounted at once; a 5000-message preview would otherwise stall the panel. */
const LIST_PAGE = 200;

const CUSTOM_EMOJI = /<(a?):(\w+):(\d{15,25})>/g;

/** Message text with custom emoji shown as images instead of raw `<:name:id>`. */
function renderContent(text: string): React.ReactNode[] {
  const out: React.ReactNode[] = [];
  let last = 0;
  for (const m of text.matchAll(CUSTOM_EMOJI)) {
    const at = m.index ?? 0;
    if (at > last) out.push(text.slice(last, at));
    out.push(
      <img
        key={`${at}-${m[3]}`}
        className="hc-cleaner__emoji"
        src={`https://cdn.discordapp.com/emojis/${m[3]}.${m[1] ? "gif" : "webp"}?size=32`}
        alt={`:${m[2]}:`}
        title={`:${m[2]}:`}
      />
    );
    last = at + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

/** What a message carries besides text, so non-text rows aren't a blank line. */
function tagsOf(m: CollectedMessage): string[] {
  const tags: string[] = [];
  if (m.pinned) tags.push("置顶");
  if (m.attachments) tags.push(`附件×${m.attachments}`);
  for (const name of m.stickers) tags.push(`贴纸 ${name}`);
  if (m.embeds) tags.push(`嵌入×${m.embeds}`);
  return tags;
}

export function CleanerPage(): React.ReactElement {
  // Token
  const [token, setToken] = useState("");
  // Scope
  const [guildId, setGuildId] = useState("");
  const [channelId, setChannelId] = useState("");
  const [serverWide, setServerWide] = useState(false);
  // Resolved names for the ids above (best-effort; empty when unknown).
  const [guildName, setGuildName] = useState("");
  const [channelName, setChannelName] = useState("");
  // Time range
  const [afterStr, setAfterStr] = useState("");
  const [beforeStr, setBeforeStr] = useState("");
  // Message range (ids; each overrides the date bound on its side)
  const [afterId, setAfterId] = useState("");
  const [beforeId, setBeforeId] = useState("");
  const rootRef = useRef<HTMLDivElement | null>(null);
  const pickRef = useRef<MessagePick | null>(null);
  // Filters
  const [contentQuery, setContentQuery] = useState("");
  const [hasLink, setHasLink] = useState(false);
  const [hasFile, setHasFile] = useState(false);
  const [includePinned, setIncludePinned] = useState(false);
  const [pattern, setPattern] = useState("");
  // Order
  const [order, setOrder] = useState<string>(settings.store.order);
  // Runtime
  const [mode, setMode] = useState<Mode>("idle");
  const [previewed, setPreviewedRaw] = useState<CollectedMessage[]>([]);
  // Everything previewed is selected unless its id is in here — unticking a
  // row is how a message is kept.
  const [excluded, setExcluded] = useState<Set<string>>(new Set());
  const [listQuery, setListQuery] = useState("");
  const [shown, setShown] = useState(LIST_PAGE);
  // Channel id → name for server-wide previews (best-effort).
  const [channelNames, setChannelNames] = useState<Record<string, string>>({});
  /** Replace the preview and reset everything that referred to the old one. */
  const setPreviewed = (next: CollectedMessage[]) => {
    setPreviewedRaw(next);
    setExcluded(new Set());
    setListQuery("");
    setShown(LIST_PAGE);
  };
  const [state, setState] = useState("待机");
  const [detail, setDetail] = useState("先获取 Token，选好范围并预览，确认后再删除。");
  const [statCount, setStatCount] = useState<number | null>(null);
  // Picker — mirrors the original script's picker, which calls the REST API
  // directly (/users/@me/guilds, /guilds/{id}/channels) rather than reading
  // from Discord's internal stores (unreliable across client builds).
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerGuilds, setPickerGuilds] = useState<GuildInfo[]>([]);
  const [pickerChannels, setPickerChannels] = useState<ChannelInfo[]>([]);
  const [pickerLevel, setPickerLevel] = useState<"guilds" | "channels">("guilds");
  const [pickerGuildId, setPickerGuildId] = useState("");
  const [pickerGuildName, setPickerGuildName] = useState("");
  const [pickerLoading, setPickerLoading] = useState(false);
  const [pickerError, setPickerError] = useState("");

  const ctrlRef = useRef<Controller>({ stopped: false });
  const running = mode !== "idle";

  // --- Run log (mirrors the reference 冲水 script's log pane) ---
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [autoScroll, setAutoScroll] = useState(true);
  const logSeq = useRef(0);
  const logBoxRef = useRef<HTMLDivElement | null>(null);

  const pushLog = (level: LogLevel, text: string) => {
    const entry: LogEntry = { id: ++logSeq.current, time: clockTime(new Date()), level, text };
    setLogs((prev) => {
      const next = [...prev, entry];
      return next.length > LOG_LIMIT ? next.slice(next.length - LOG_LIMIT) : next;
    });
  };

  // Progress updates drive both the status line and the log pane, so every
  // scan/delete step shows up there without extra plumbing in cleaner.ts.
  const progress = (s: string, d: string) => {
    setState(s);
    setDetail(d);
    // The delete loop reports once per message; per-item entries below cover
    // that, so the counter line stays out of the log to keep it readable.
    if (s === "删除中") return;
    pushLog(levelOf(s), d ? `${s} — ${d}` : s);
  };

  // Follow the tail unless the user scrolled up to read something.
  useEffect(() => {
    const el = logBoxRef.current;
    if (el && autoScroll) el.scrollTop = el.scrollHeight;
  }, [logs, autoScroll]);

  const onLogScroll = () => {
    const el = logBoxRef.current;
    if (!el) return;
    setAutoScroll(el.scrollHeight - el.scrollTop - el.clientHeight < 24);
  };

  // Auto-extract token on mount. When the header button opened this page it
  // also handed over the channel the user was looking at, so start aimed there.
  useEffect(() => {
    const target = takePendingTarget();
    if (target) {
      setGuildId(target.guildId);
      setChannelId(target.channelId);
      setServerWide(target.serverWide);
    }
    const tok = extractToken();
    if (tok) {
      setToken(tok);
      setState("已获取 Token");
      setDetail(target ? "已填入当前频道，可直接预览。" : "可点击「列表」选择频道，或手动填写 ID。");
      pushLog("info", target
        ? `已获取 Token，目标频道 ${target.channelId}`
        : "已获取 Token");
    } else {
      pushLog("warn", "未自动获取到 Token，请手动粘贴。");
    }
  }, []);

  // Resolve ids → names so the page shows what is about to be wiped, not just
  // a snowflake. Debounced while typing; failures stay silent because the raw
  // id is still perfectly usable.
  useEffect(() => {
    const tok = token.trim();
    const id = guildId.trim();
    setGuildName("");
    if (!tok || !/^\d{15,25}$/.test(id)) return;
    let alive = true;
    const timer = setTimeout(() => {
      fetchGuildName(tok, id)
        .then((name) => { if (alive && name) setGuildName(name); })
        .catch(() => {});
    }, 400);
    return () => { alive = false; clearTimeout(timer); };
  }, [token, guildId]);

  useEffect(() => {
    const tok = token.trim();
    const id = channelId.trim();
    setChannelName("");
    if (!tok || !/^\d{15,25}$/.test(id)) return;
    let alive = true;
    const timer = setTimeout(() => {
      fetchChannelName(tok, id)
        .then((res) => {
          if (!alive || !res) return;
          setChannelName(res.name);
          // A pasted channel id implies its guild; fill it so server-wide
          // count/search and the guild name display both work.
          if (res.guildId) setGuildId((prev) => (prev.trim() ? prev : res.guildId!));
        })
        .catch(() => {});
    }, 400);
    return () => { alive = false; clearTimeout(timer); };
  }, [token, channelId]);

  const requireToken = (): string => {
    const t = token.trim();
    if (!t) throw new Error("请先获取或填入 Token。");
    return t;
  };

  const buildOptions = (): CleanOptions => ({
    guildId: guildId.trim(),
    channelId: serverWide ? "" : channelId.trim(),
    serverWide,
    order: order as "asc" | "desc",
    limit: settings.store.limit,
    delayMs: settings.store.delayMs,
    after: afterStr ? new Date(afterStr) : null,
    before: beforeStr ? new Date(beforeStr) : null,
    content: contentQuery.trim(),
    hasLink,
    hasFile,
    includePinned,
    pattern: pattern.trim(),
    afterId: afterId.trim(),
    beforeId: beforeId.trim()
  });

  // --- Pick a message in chat as a range bound ---
  useEffect(() => () => pickRef.current?.cancel(), []);

  const onPick = async (side: "after" | "before") => {
    // Only Halcyon's own overlay can be hidden to reveal the chat underneath.
    const surface = rootRef.current?.closest<HTMLElement>(".hc-overlay");
    if (!surface) {
      progress("无法选取", "当前界面无法临时隐藏，请手动粘贴消息 ID（右键消息 → 复制消息 ID）。");
      return;
    }
    surface.style.display = "none";
    const pick = pickMessage(
      side === "after" ? "点击一条消息：只清理它之后的消息" : "点击一条消息：只清理它之前的消息"
    );
    pickRef.current = pick;
    const id = await pick.promise;
    pickRef.current = null;
    surface.style.display = "";
    if (!id) { progress("已取消选取", ""); return; }
    if (side === "after") setAfterId(id);
    else setBeforeId(id);
    progress("已选取消息", `${side === "after" ? "起点" : "终点"}消息 ID ${id}（该消息本身不会被删除）`);
  };

  // --- Preview selection ---
  const query = listQuery.trim().toLowerCase();
  const matching = query
    ? previewed.filter((m) => m.content.toLowerCase().includes(query) || m.id.includes(query))
    : previewed;
  const selected = previewed.filter((m) => !excluded.has(m.id));

  const toggleOne = (id: string) =>
    setExcluded((prev) => {
      const next = new Set(prev);
      if (!next.delete(id)) next.add(id);
      return next;
    });

  // Bulk actions apply to the rows matching the list filter, so "search for
  // the one to keep → 全不选" works without touching the rest.
  const bulkSelect = (kind: "all" | "none" | "invert") =>
    setExcluded((prev) => {
      const next = new Set(prev);
      for (const m of matching) {
        const off = kind === "none" || (kind === "invert" && !prev.has(m.id));
        if (off) next.add(m.id);
        else next.delete(m.id);
      }
      return next;
    });

  // --- Token ---
  const onAutoToken = () => {
    const tok = extractToken();
    if (tok) { setToken(tok); progress("Token 已获取", "可点击「列表」选择频道。"); }
    else progress("获取失败", "请手动粘贴 Token。");
  };

  // --- Fill current ---
  const useCurrent = () => {
    const target = currentTarget();
    if (!target) { progress("无法读取", "当前不在某个频道/私信页面。"); return; }
    setGuildId(target.guildId);
    setChannelId(target.channelId);
    setServerWide(false);
    progress("已填入当前频道", `服务器 ${target.guildId} · 频道 ${target.channelId}`);
  };

  // --- Picker ---
  const openPicker = async () => {
    let tok: string;
    try {
      tok = requireToken();
    } catch (e: any) {
      progress("需要 Token", e.message);
      return;
    }
    setPickerOpen(true);
    setPickerLevel("guilds");
    setPickerChannels([]);
    setPickerError("");
    setPickerLoading(true);
    try {
      const guilds = await fetchGuilds(tok);
      setPickerGuilds([{ id: "@me", name: "私信与群聊 (DMs)", icon: null }, ...guilds]);
    } catch (e: any) {
      setPickerError(e.message ?? String(e));
    } finally {
      setPickerLoading(false);
    }
  };

  const pickGuild = async (g: GuildInfo) => {
    let tok: string;
    try {
      tok = requireToken();
    } catch (e: any) {
      progress("需要 Token", e.message);
      return;
    }
    setPickerGuildId(g.id);
    setPickerGuildName(g.name);
    setPickerLevel("channels");
    setPickerError("");
    setPickerLoading(true);
    try {
      const channels = await fetchChannels(tok, g.id);
      const withServerWide =
        g.id === "@me" ? channels : [{ id: "", name: "── 全服扫描（不限频道）──", type: -1 }, ...channels];
      setPickerChannels(withServerWide);
    } catch (e: any) {
      setPickerError(e.message ?? String(e));
    } finally {
      setPickerLoading(false);
    }
  };

  const pickChannel = (ch: ChannelInfo) => {
    // Commit both ids together: retaining the previous guild id searches a
    // different server and returns zero despite the selected channel's count.
    setGuildId(pickerGuildId);
    setPreviewed([]);
    setStatCount(null);
    if (!ch.id) {
      // Server-wide
      setServerWide(true);
      setChannelId("");
    } else {
      setServerWide(false);
      setChannelId(ch.id);
    }
    setPickerOpen(false);
    progress("已选择", `${pickerGuildName} → ${ch.name || "全服"}`);
  };

  // --- Sync "before" to now ---
  const syncNow = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    setBeforeStr(now.toISOString().slice(0, 16));
  };

  // --- Preview ---
  const onPreview = async () => {
    let tok: string;
    try { tok = requireToken(); } catch (e: any) { progress("失败", e.message); return; }
    let meId: string;
    try { meId = await fetchUserId(tok); } catch (e: any) { progress("失败", e.message); return; }
    const opts = buildOptions();
    if (opts.serverWide && (!opts.guildId || opts.guildId === "@me")) {
      progress("失败", "全服扫描需要填写服务器 ID。"); return;
    }
    if (!opts.serverWide && !opts.channelId) {
      progress("失败", "请填写频道 ID，或改用全服扫描。"); return;
    }
    if (opts.after && opts.before && opts.after >= opts.before) {
      progress("失败", "起始时间必须早于结束时间。"); return;
    }

    ctrlRef.current = { stopped: false };
    setMode("previewing");
    setPreviewed([]);
    progress("预览中", "正在搜索你在所选范围内的消息…");
    try {
      const found = await collect(tok, opts, meId, progress, ctrlRef.current);
      setPreviewed(found);
      progress(
        ctrlRef.current.stopped ? "已停止" : "预览完成",
        `找到 ${found.length} 条你的消息。默认全部勾选，取消勾选即可保留。`
      );
      if (opts.serverWide && found.length > 0) {
        fetchChannels(tok, opts.guildId)
          .then((list) => setChannelNames(Object.fromEntries(list.map((c) => [c.id, c.name]))))
          .catch(() => {});
      }
    } catch (err: any) {
      progress("失败", err.message ?? String(err));
      log.error("preview failed", err);
    } finally {
      setMode("idle");
    }
  };

  // --- Delete ---
  const onDelete = async () => {
    if (previewed.length === 0) { progress("请先预览", ""); return; }
    const targets = selected;
    if (targets.length === 0) { progress("未勾选消息", "请至少勾选一条要删除的消息。"); return; }
    let tok: string;
    try { tok = requireToken(); } catch (e: any) { progress("失败", e.message); return; }
    const opts = buildOptions();
    ctrlRef.current = { stopped: false };
    setMode("deleting");
    const kept = previewed.length - targets.length;
    pushLog("info", `开始删除已勾选的 ${targets.length} 条${kept ? `，保留未勾选的 ${kept} 条` : ""}。`);
    progress("删除中", `0 / ${targets.length}`);
    const done = new Set<string>();
    const failed = new Set<string>();
    try {
      const result = await remove(tok, targets, opts, progress, ctrlRef.current, (m, ok, error) => {
        const text = m.content.trim().replace(/\s+/g, " ").slice(0, 80);
        if (ok) { done.add(m.id); pushLog("success", `已删除 ${m.id}${text ? ` · ${text}` : "（无文本）"}`); }
        else { failed.add(m.id); pushLog("warn", `跳过 ${m.id} · ${error ?? "未知错误"}`); }
      });
      progress(
        ctrlRef.current.stopped ? "已停止" : "完成",
        `已删除 ${result.deleted} 条${result.skipped ? `，跳过 ${result.skipped} 条` : ""}${kept ? `，保留 ${kept} 条` : ""}。`
      );
    } catch (err: any) {
      progress("失败", err.message ?? String(err));
      log.error("delete failed", err);
    } finally {
      // Deleted rows leave the list; kept rows stay visible and unticked, and
      // failures are unticked too so a second click can't hammer them again.
      setPreviewedRaw((prev) => prev.filter((m) => !done.has(m.id)));
      setExcluded((prev) => {
        const next = new Set(prev);
        for (const id of done) next.delete(id);
        for (const id of failed) next.add(id);
        return next;
      });
      setMode("idle");
    }
  };

  const onStop = () => { ctrlRef.current.stopped = true; progress("停止中", "等待当前请求结束…"); };

  // --- Stats ---
  const onCount = async () => {
    let tok: string;
    try { tok = requireToken(); } catch (e: any) { progress("失败", e.message); return; }
    let meId: string;
    try { meId = await fetchUserId(tok); } catch (e: any) { progress("失败", e.message); return; }
    const target: CleanTarget = { guildId: guildId.trim(), channelId: serverWide ? "" : channelId.trim(), serverWide };
    setStatCount(null);
    progress("统计中", "调用搜索接口…");
    try {
      const result = await count(tok, target, meId);
      if (result.indexing) { progress("建立索引中", "Discord 正在建立索引，稍后再试。"); return; }
      setStatCount(result.total);
      progress("统计完成", `共 ${result.total} 条发言。`);
    } catch (err: any) {
      progress("失败", err.message ?? String(err));
    }
  };

  // --- Picker overlay ---
  if (pickerOpen) {
    return (
      <div className="hc-cleaner">
        <div className="hc-cleaner__picker-head">
          {pickerLevel === "channels" && (
            <Button size="sm" variant="plain" onClick={() => setPickerLevel("guilds")}>← 返回</Button>
          )}
          <span className="hc-cleaner__picker-title">
            {pickerLevel === "guilds" ? "选择服务器" : pickerGuildName}
          </span>
          <Button size="sm" variant="plain" onClick={() => setPickerOpen(false)}>✕</Button>
        </div>
        <div className="hc-cleaner__picker-list">
          {pickerLoading ? (
            <div className="hc-cleaner__picker-empty">正在加载…</div>
          ) : pickerError ? (
            <div className="hc-cleaner__picker-empty hc-cleaner__picker-empty--error">加载失败：{pickerError}</div>
          ) : pickerLevel === "guilds" ? (
            pickerGuilds.map((g) => (
              <div
                key={g.id}
                className="hc-cleaner__picker-item"
                onClick={() => pickGuild(g)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === "Enter") pickGuild(g); }}
              >
                <div className="hc-cleaner__picker-icon">
                  {g.icon
                    ? <img src={`https://cdn.discordapp.com/icons/${g.id}/${g.icon}.png?size=64`} alt="" />
                    : g.name.charAt(0)}
                </div>
                <div className="hc-cleaner__picker-name">{g.name}</div>
              </div>
            ))
          ) : pickerChannels.length === 0 ? (
            <div className="hc-cleaner__picker-empty">此服务器暂无频道，可手动填写频道 ID。</div>
          ) : (
            pickerChannels.map((ch) => (
              <div
                key={ch.id || "server-wide"}
                className="hc-cleaner__picker-item"
                onClick={() => pickChannel(ch)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === "Enter") pickChannel(ch); }}
              >
                <div className="hc-cleaner__picker-icon">{ch.id ? "#" : "🌐"}</div>
                <div className="hc-cleaner__picker-name">{ch.name}</div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  // --- Main page ---
  return (
    <div className="hc-cleaner" ref={rootRef}>
      <div className="hc-inline-note hc-inline-note--danger">
        <WarningIcon size={18} />
        <span>只删除<strong>你自己</strong>发送的消息。建议先预览，确认范围后再删除。</span>
      </div>

      {/* Token */}
      <Section title="Token">
        <div className="hc-cell">
          <div className="hc-cell--row">
            <div className="hc-cell__main">
              <div className="hc-cell__label">Discord Token</div>
              <div className="hc-cell__desc">代表你的账号权限，不要泄露给任何人。</div>
            </div>
            <Button size="sm" variant="secondary" icon={<RefreshIcon size={16} />} onClick={onAutoToken}>
              自动
            </Button>
          </div>
          <div className="hc-cell__control">
            <TextInput value={token} onChange={setToken} placeholder="自动填入或手动粘贴" type="password" />
          </div>
        </div>
      </Section>

      {/* Scope */}
      <Section title="范围">
        <div className="hc-cell hc-cell--row">
          <div className="hc-cell__main">
            <div className="hc-cell__label">全服扫描</div>
            <div className="hc-cell__desc">忽略频道，扫描整个服务器（走搜索接口，较慢）。</div>
          </div>
          <Toggle checked={serverWide} onChange={setServerWide} aria-label="全服扫描" />
        </div>
        <div className="hc-cell">
          <div className="hc-cell--row">
            <div className="hc-cell__main">
              <div className="hc-cell__label">
                服务器 ID
                {guildName && <span className="hc-cleaner__resolved">{guildName}</span>}
              </div>
            </div>
          </div>
          <div className="hc-cell__control">
            <TextInput value={guildId} onChange={setGuildId} placeholder="服务器 ID" />
          </div>
        </div>
        {!serverWide && (
          <div className="hc-cell">
            <div className="hc-cell--row">
              <div className="hc-cell__main">
                <div className="hc-cell__label">
                  频道 ID
                  {channelName && <span className="hc-cleaner__resolved">{channelName}</span>}
                </div>
              </div>
            </div>
            <div className="hc-cell__control">
              <TextInput value={channelId} onChange={setChannelId} placeholder="频道 ID" />
            </div>
          </div>
        )}
        <div className="hc-cell hc-cell--row" style={{ gap: "var(--hc-space-2)" }}>
          <Button size="sm" variant="secondary" icon={<ServerIcon size={16} />} onClick={openPicker} disabled={running}>
            列表
          </Button>
          <Button size="sm" variant="secondary" icon={<ListIcon size={16} />} onClick={useCurrent} disabled={running}>
            当前
          </Button>
        </div>
      </Section>

      {/* Time range */}
      <Section title="时间范围" note="可选。留空表示不限制该方向。">
        <div className="hc-cell">
          <div className="hc-cell--row">
            <div className="hc-cell__main"><div className="hc-cell__label">起始时间</div></div>
          </div>
          <div className="hc-cell__control">
            <input className="hc-input" type="datetime-local" value={afterStr} onChange={(e) => setAfterStr(e.currentTarget.value)} />
          </div>
        </div>
        <div className="hc-cell">
          <div className="hc-cell--row">
            <div className="hc-cell__main"><div className="hc-cell__label">结束时间</div></div>
            <Button size="sm" variant="plain" onClick={syncNow}>同步最新</Button>
          </div>
          <div className="hc-cell__control">
            <input className="hc-input" type="datetime-local" value={beforeStr} onChange={(e) => setBeforeStr(e.currentTarget.value)} />
          </div>
        </div>
      </Section>

      {/* Message range */}
      <Section
        title="消息区间"
        note="可选。只清理两条消息之间的内容，所选的两条消息本身不会被删。填了消息 ID 的一侧会覆盖上面对应的时间。"
      >
        <div className="hc-cell">
          <div className="hc-cell--row">
            <div className="hc-cell__main"><div className="hc-cell__label">在此消息之后</div></div>
            <Button size="sm" variant="secondary" disabled={running} onClick={() => onPick("after")}>选取</Button>
          </div>
          <div className="hc-cell__control">
            <TextInput value={afterId} onChange={setAfterId} placeholder="起点消息 ID，留空不限" />
          </div>
        </div>
        <div className="hc-cell">
          <div className="hc-cell--row">
            <div className="hc-cell__main"><div className="hc-cell__label">在此消息之前</div></div>
            <Button size="sm" variant="secondary" disabled={running} onClick={() => onPick("before")}>选取</Button>
          </div>
          <div className="hc-cell__control">
            <TextInput value={beforeId} onChange={setBeforeId} placeholder="终点消息 ID，留空不限" />
          </div>
        </div>
      </Section>

      {/* Filters */}
      <Section title="筛选" note="可选。只预览 / 删除符合条件的消息；修改后需重新预览。">
        <div className="hc-cell">
          <div className="hc-cell--row">
            <div className="hc-cell__main"><div className="hc-cell__label">包含文本</div></div>
          </div>
          <div className="hc-cell__control">
            <TextInput value={contentQuery} onChange={setContentQuery} placeholder="只找包含这段文字的消息" />
          </div>
        </div>
        <div className="hc-cell hc-cell--row">
          <div className="hc-cell__main"><div className="hc-cell__label">只要带链接的</div></div>
          <Toggle checked={hasLink} onChange={setHasLink} aria-label="只要带链接的" />
        </div>
        <div className="hc-cell hc-cell--row">
          <div className="hc-cell__main"><div className="hc-cell__label">只要带文件的</div></div>
          <Toggle checked={hasFile} onChange={setHasFile} aria-label="只要带文件的" />
        </div>
        <div className="hc-cell hc-cell--row">
          <div className="hc-cell__main">
            <div className="hc-cell__label">包含置顶消息</div>
            <div className="hc-cell__desc">关闭时置顶消息不会进入预览，也不会被删除。</div>
          </div>
          <Toggle checked={includePinned} onChange={setIncludePinned} aria-label="包含置顶消息" />
        </div>
        <div className="hc-cell">
          <div className="hc-cell--row">
            <div className="hc-cell__main">
              <div className="hc-cell__label">正则匹配</div>
              <div className="hc-cell__desc">只保留文本匹配该正则的消息（不区分大小写）。</div>
            </div>
          </div>
          <div className="hc-cell__control">
            <TextInput value={pattern} onChange={setPattern} placeholder="例如 ^哈+$" />
          </div>
        </div>
      </Section>

      {/* Order */}
      <Section title="方向">
        <div className="hc-cell hc-cell--row">
          <div className="hc-cell__main"><div className="hc-cell__label">清理方向</div></div>
          <Select
            value={order}
            onChange={setOrder}
            options={[
              { value: "desc", label: "从新到老" },
              { value: "asc", label: "从老到新" }
            ]}
          />
        </div>
      </Section>

      {/* Actions */}
      <div className="hc-cleaner__actions">
        {mode === "previewing" ? (
          <Button variant="destructive" onClick={onStop}>停止预览</Button>
        ) : (
          <Button variant="primary" icon={<SearchIcon size={16} />} disabled={running} onClick={onPreview}>预览</Button>
        )}
        {mode === "deleting" ? (
          <Button variant="destructive" onClick={onStop}>停止删除</Button>
        ) : (
          <Button
            variant="destructive"
            icon={<TrashIcon size={16} />}
            disabled={running || selected.length === 0}
            onClick={onDelete}
          >
            删除已选（{selected.length}）
          </Button>
        )}
      </div>

      {/* Status */}
      <div className="hc-cleaner__status">
        <div className="hc-cleaner__status-state">{state}</div>
        {detail && <div className="hc-cleaner__status-detail">{detail}</div>}
      </div>

      {/* Run log */}
      <Section title="运行日志" note="预览与删除的每一步都记在这里，可随时清空。">
        <div className="hc-cleaner__logbar">
          <span className="hc-cleaner__logcount">{logs.length} 条</span>
          <Button
            size="sm"
            variant="plain"
            disabled={logs.length === 0}
            onClick={() => { setLogs([]); setAutoScroll(true); }}
          >
            清空
          </Button>
        </div>
        <div
          className="hc-cleaner__log"
          ref={logBoxRef}
          onScroll={onLogScroll}
          role="log"
          aria-live="polite"
        >
          {logs.length === 0 ? (
            <div className="hc-cleaner__log-empty">暂无日志。点「预览」开始。</div>
          ) : (
            logs.map((entry) => (
              <div className="hc-cleaner__log-row" data-level={entry.level} key={entry.id}>
                <span className="hc-cleaner__log-time">{entry.time}</span>
                <span className="hc-cleaner__log-level">{entry.level.toUpperCase()}</span>
                <span className="hc-cleaner__log-text">{entry.text}</span>
              </div>
            ))
          )}
        </div>
      </Section>

      {/* Preview list */}
      {previewed.length > 0 && (
        <Section
          title={`预览结果（已选 ${selected.length} / ${previewed.length}）`}
          note="勾选的会被删除；想保留的消息取消勾选即可。"
        >
          <div className="hc-cleaner__listbar">
            <TextInput
              value={listQuery}
              onChange={(v) => { setListQuery(v); setShown(LIST_PAGE); }}
              placeholder="在预览中查找…"
            />
            <div className="hc-cleaner__listbar-actions">
              <Button size="sm" variant="plain" disabled={running} onClick={() => bulkSelect("all")}>全选</Button>
              <Button size="sm" variant="plain" disabled={running} onClick={() => bulkSelect("none")}>全不选</Button>
              <Button size="sm" variant="plain" disabled={running} onClick={() => bulkSelect("invert")}>反选</Button>
            </div>
          </div>
          {query && (
            <div className="hc-cleaner__more">
              匹配 {matching.length} 条，全选 / 全不选 / 反选只作用于这些匹配项。
            </div>
          )}
          <div className="hc-cleaner__list">
            {matching.length === 0 && <div className="hc-cleaner__more">没有匹配的消息。</div>}
            {matching.slice(0, shown).map((m) => {
              const text = m.content.trim();
              const tags = tagsOf(m);
              const channel = serverWide ? channelNames[m.channelId] ?? `…${m.channelId.slice(-6)}` : "";
              return (
                <label className="hc-cleaner__item" data-off={excluded.has(m.id)} key={m.id}>
                  <input
                    className="hc-cleaner__check"
                    type="checkbox"
                    checked={!excluded.has(m.id)}
                    disabled={running}
                    onChange={() => toggleOne(m.id)}
                  />
                  <span className="hc-cleaner__item-time">{formatTs(m.timestamp)}</span>
                  <span className="hc-cleaner__item-text">
                    {channel && <span className="hc-cleaner__item-channel">#{channel}</span>}
                    {tags.map((t) => <span className="hc-cleaner__tag" key={t}>{t}</span>)}
                    {text ? renderContent(text) : tags.length === 0 && "（无文本内容）"}
                  </span>
                </label>
              );
            })}
          </div>
          {matching.length > shown && (
            <div className="hc-cleaner__listmore">
              <span>已显示 {shown} / {matching.length} 条</span>
              <Button size="sm" variant="secondary" onClick={() => setShown((n) => n + LIST_PAGE)}>再显示 {Math.min(LIST_PAGE, matching.length - shown)} 条</Button>
              <Button size="sm" variant="plain" onClick={() => setShown(matching.length)}>显示全部</Button>
            </div>
          )}
        </Section>
      )}

      {/* Stats */}
      <Section title="统计" note="统计你在所选范围内的历史发言总数（调用搜索接口）。">
        <div className="hc-cell">
          <Button size="sm" variant="secondary" icon={<SearchIcon size={16} />} disabled={running} onClick={onCount}>
            统计我的发言数
          </Button>
        </div>
        {statCount != null && (
          <div className="hc-cell hc-cleaner__stat">
            <span className="hc-cleaner__stat-num">{statCount}</span>
            <span className="hc-cleaner__stat-unit">条</span>
          </div>
        )}
      </Section>
    </div>
  );
}
