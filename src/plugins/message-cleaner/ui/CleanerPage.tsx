// The message-cleaner page.
//
// Full port of the 冲水 userscript UI into Halcyon's component system. Includes:
// - Token input + auto-extract
// - Guild/channel picker (from Discord stores)
// - Time range filter (after/before)
// - Order selector
// - Preview → Delete flow
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
  currentUserId,
  currentTarget,
  getGuilds,
  getChannels,
  type CollectedMessage,
  type CleanOptions,
  type CleanTarget,
  type Controller,
  type GuildInfo,
  type ChannelInfo
} from "../cleaner";

const log = logger("message-cleaner");

type Mode = "idle" | "previewing" | "deleting";

function formatTs(ts: string): string {
  const date = new Date(ts);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function CleanerPage(): React.ReactElement {
  // Token
  const [token, setToken] = useState("");
  // Scope
  const [guildId, setGuildId] = useState("");
  const [channelId, setChannelId] = useState("");
  const [serverWide, setServerWide] = useState(false);
  // Time range
  const [afterStr, setAfterStr] = useState("");
  const [beforeStr, setBeforeStr] = useState("");
  // Order
  const [order, setOrder] = useState<string>(settings.store.order);
  // Confirmation
  const [disclaimer, setDisclaimer] = useState(false);
  // Runtime
  const [mode, setMode] = useState<Mode>("idle");
  const [previewed, setPreviewed] = useState<CollectedMessage[]>([]);
  const [state, setState] = useState("待机");
  const [detail, setDetail] = useState("先获取 Token，选好范围并预览，确认后再删除。");
  const [statCount, setStatCount] = useState<number | null>(null);
  // Picker
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerGuilds, setPickerGuilds] = useState<GuildInfo[]>([]);
  const [pickerChannels, setPickerChannels] = useState<ChannelInfo[]>([]);
  const [pickerLevel, setPickerLevel] = useState<"guilds" | "channels">("guilds");
  const [pickerGuildName, setPickerGuildName] = useState("");

  const ctrlRef = useRef<Controller>({ stopped: false });
  const running = mode !== "idle";

  // Auto-extract token on mount
  useEffect(() => {
    const tok = extractToken();
    if (tok) {
      setToken(tok);
      setState("已获取 Token");
      setDetail("可点击「列表」选择频道，或手动填写 ID。");
    }
  }, []);

  const progress = (s: string, d: string) => { setState(s); setDetail(d); };

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
    before: beforeStr ? new Date(beforeStr) : null
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
  const openPicker = () => {
    const guilds = getGuilds();
    setPickerGuilds([{ id: "@me", name: "私信与群聊 (DMs)", icon: null }, ...guilds]);
    setPickerChannels([]);
    setPickerLevel("guilds");
    setPickerOpen(true);
  };

  const pickGuild = (g: GuildInfo) => {
    setGuildId(g.id);
    if (g.id === "@me") {
      // DMs don't have a channel list from the guild store
      setPickerOpen(false);
      progress("已选择私信", "请手动填写私信频道 ID。");
      return;
    }
    setPickerGuildName(g.name);
    const channels = getChannels(g.id);
    setPickerChannels([{ id: "", name: "── 全服扫描（不限频道）──", type: -1 }, ...channels]);
    setPickerLevel("channels");
  };

  const pickChannel = (ch: ChannelInfo) => {
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
    const meId = currentUserId();
    if (!meId) { progress("失败", "拿不到当前账号，请确认已登录 Discord。"); return; }
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
    progress("预览中", "正在扫描你的消息…");
    try {
      const found = await collect(tok, opts, meId, progress, ctrlRef.current);
      setPreviewed(found);
      progress(ctrlRef.current.stopped ? "已停止" : "预览完成", `找到 ${found.length} 条你的消息。`);
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
    if (settings.store.confirmBeforeDelete) {
      const ok = window.confirm(`将删除 ${previewed.length} 条消息，删除不可恢复，确认继续？`);
      if (!ok) return;
    }
    let tok: string;
    try { tok = requireToken(); } catch (e: any) { progress("失败", e.message); return; }
    const opts = buildOptions();
    ctrlRef.current = { stopped: false };
    setMode("deleting");
    progress("删除中", `0 / ${previewed.length}`);
    try {
      const result = await remove(tok, previewed, opts, progress, ctrlRef.current);
      progress(
        ctrlRef.current.stopped ? "已停止" : "完成",
        `已删除 ${result.deleted} 条${result.skipped ? `，跳过 ${result.skipped} 条` : ""}。`
      );
      setPreviewed([]);
    } catch (err: any) {
      progress("失败", err.message ?? String(err));
      log.error("delete failed", err);
    } finally {
      setMode("idle");
    }
  };

  const onStop = () => { ctrlRef.current.stopped = true; progress("停止中", "等待当前请求结束…"); };

  // --- Stats ---
  const onCount = async () => {
    let tok: string;
    try { tok = requireToken(); } catch (e: any) { progress("失败", e.message); return; }
    const meId = currentUserId();
    if (!meId) { progress("失败", "拿不到当前账号。"); return; }
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
          {pickerLevel === "guilds"
            ? pickerGuilds.map((g) => (
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
            : pickerChannels.map((ch) => (
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
          }
          {pickerLevel === "channels" && pickerChannels.length <= 1 && (
            <div className="hc-cleaner__picker-empty">此服务器暂无缓存的频道，可手动填写频道 ID。</div>
          )}
        </div>
      </div>
    );
  }

  // --- Main page ---
  return (
    <div className="hc-cleaner">
      <div className="hc-inline-note hc-inline-note--danger">
        <WarningIcon size={18} />
        <span>删除不可恢复，且只会删除<strong>你自己</strong>发送的消息。请务必先预览确认。</span>
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
            <div className="hc-cell__main"><div className="hc-cell__label">服务器 ID</div></div>
          </div>
          <div className="hc-cell__control">
            <TextInput value={guildId} onChange={setGuildId} placeholder="服务器 ID" />
          </div>
        </div>
        {!serverWide && (
          <div className="hc-cell">
            <div className="hc-cell--row">
              <div className="hc-cell__main"><div className="hc-cell__label">频道 ID</div></div>
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

      {/* Confirm */}
      <Section title="确认" note="删除是不可逆操作，请先预览再删除。">
        <div className="hc-cell hc-cell--row">
          <div className="hc-cell__main">
            <div className="hc-cell__label">我确认只删除自己的消息，且明白不可恢复</div>
          </div>
          <Toggle checked={disclaimer} onChange={setDisclaimer} aria-label="确认" />
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
            disabled={running || !disclaimer || previewed.length === 0}
            onClick={onDelete}
          >
            删除预览（{previewed.length}）
          </Button>
        )}
      </div>

      {/* Status */}
      <div className="hc-cleaner__status">
        <div className="hc-cleaner__status-state">{state}</div>
        {detail && <div className="hc-cleaner__status-detail">{detail}</div>}
      </div>

      {/* Preview list */}
      {previewed.length > 0 && (
        <Section title={`预览结果（${previewed.length}）`}>
          <div className="hc-cleaner__list">
            {previewed.slice(0, 50).map((m) => (
              <div className="hc-cleaner__item" key={m.id}>
                <span className="hc-cleaner__item-time">{formatTs(m.timestamp)}</span>
                <span className="hc-cleaner__item-text">{m.content.trim() || "（无文本内容）"}</span>
              </div>
            ))}
            {previewed.length > 50 && <div className="hc-cleaner__more">…还有 {previewed.length - 50} 条未展示</div>}
          </div>
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
