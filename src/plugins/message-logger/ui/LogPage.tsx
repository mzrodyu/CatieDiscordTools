// The message-logger page.
//
// Two lists — deleted messages and edit histories — captured by the recorder.
// This view is self-contained: it reads from the plugin's own store, so it
// works whether or not the optional in-chat patches applied.

import { useEffect, useState } from "../../../core/common/react";
import { ChannelStore, GuildStore, navigate, AppLayers, JumpActions, SelectedChannelStore, getDispatcher } from "../../../core/common/discord";
import { closeSettings } from "../../../ui/settings/overlay";
import { logger } from "../../../core/logger";
import { getSourcePatchReport } from "../../../core/modules/webpack";
import { messageLog, type DeletedEntry, type EditedEntry } from "../store";
import { renderContent } from "../render-content";
import {
  DEFAULT_FILTERS,
  compileMatcher,
  isFiltering,
  matchEntry,
  sortEntries,
  type SearchFilters,
  type LogEntry
} from "../search";
import { Button } from "../../../ui/components/Button";
import { EmptyState } from "../../../ui/components/EmptyState";
import { Badge } from "../../../ui/components/Badge";
import { TrashIcon, PencilIcon, DownloadIcon, ChevronRightIcon, SearchIcon, SlidersIcon } from "../../../icons";

const log = logger("message-logger");

type Tab = "deleted" | "edited";

function useLog(): { deleted: readonly DeletedEntry[]; edited: readonly EditedEntry[] } {
  const [snapshot, setSnapshot] = useState(() => ({
    deleted: messageLog.getDeleted(),
    edited: messageLog.getEdited()
  }));
  useEffect(() => {
    const update = () =>
      setSnapshot({ deleted: messageLog.getDeleted(), edited: messageLog.getEdited() });
    update();
    return messageLog.subscribe(update);
  }, []);
  return snapshot;
}

const PAGE_SIZE = 25;

/**
 * Compact banner surfacing which of the plugin's in-chat patches did NOT
 * apply against this Discord build. Failing patches are the reason a delete
 * shows in the log page but the row still vanishes from chat — this makes
 * that mismatch visible instead of leaving it buried in the logs.
 *
 * Silent when everything is fine. Re-reads every few seconds because patches
 * only apply as their target modules load, and some modules load lazily on
 * first use (opening a channel, hovering an edited row) rather than at boot.
 */
function InChatStatus(): React.ReactElement | null {
  const [snapshot, setSnapshot] = useState(() =>
    getSourcePatchReport().filter((p) => p.pluginId === "message-logger")
  );
  useEffect(() => {
    const tick = () =>
      setSnapshot(getSourcePatchReport().filter((p) => p.pluginId === "message-logger"));
    tick();
    const t = setInterval(tick, 3000);
    return () => clearInterval(t);
  }, []);

  if (snapshot.length === 0) return null;
  const failed = snapshot.filter((p) => !p.applied);
  if (failed.length === 0) return null;

  const critical = failed.find((p) => p.label === "keep deleted message in store");
  const title = critical
    ? "聊天中的红色占位未生效"
    : "部分聊天内补丁未匹配当前 Discord 版本";
  const detail = critical
    ? "被删除的消息仍然记录在下方列表，但在聊天里会直接消失。核心补丁 keep-deleted 未匹配当前 Discord 版本。"
    : "记录功能正常，但聊天中的编辑历史 / 删除标记可能无法显示。";

  return (
    <div className="hc-mlog-warn">
      <div className="hc-mlog-warn__title">{title}</div>
      <div className="hc-mlog-warn__detail">{detail}</div>
      <ul className="hc-mlog-warn__list">
        {failed.map((p) => (
          <li key={p.label}>“{p.label}”</li>
        ))}
      </ul>
      <div className="hc-mlog-warn__detail">
        请把此处以及日志页里 “Halcyon modules” 相关的输出发给开发者定位。
      </div>
    </div>
  );
}

export function LogPage(): React.ReactElement {
  const { deleted, edited } = useLog();
  const [tab, setTab] = useState<Tab>("deleted");
  // Page index per tab, so switching tabs doesn't lose your place.
  const [pages, setPages] = useState<Record<Tab, number>>({ deleted: 0, edited: 0 });
  const [filters, setFilters] = useState<SearchFilters>(DEFAULT_FILTERS);
  const [showFilters, setShowFilters] = useState(false);

  const matcher = compileMatcher(filters.query, filters.mode);
  const narrowing = isFiltering(filters);

  const apply = <T extends LogEntry>(list: readonly T[]): T[] => {
    const kept = narrowing
      ? list.filter((e) => matchEntry(e, filters, matcher, resolveLocation(e.channelId, e.guildId)))
      : list.slice();
    return sortEntries(kept, filters.sort);
  };

  // BOTH tabs are filtered, not just the visible one: the counts on the tab
  // buttons are what tell you the other list also has hits. Searching only the
  // tab you happen to be on hides half the log every time.
  const deletedHits = apply(deleted);
  const editedHits = apply(edited);

  const all = tab === "deleted" ? deleted : edited;
  const entries: readonly LogEntry[] = tab === "deleted" ? deletedHits : editedHits;

  const pageCount = Math.max(1, Math.ceil(entries.length / PAGE_SIZE));
  // Entries shrink on clear/retention/search; clamp rather than blank-paging.
  const page = Math.min(pages[tab], pageCount - 1);
  const visible = entries.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const goTo = (next: number) =>
    setPages((prev) => ({ ...prev, [tab]: Math.max(0, Math.min(pageCount - 1, next)) }));

  // Any filter change resets to the first page of results, on both tabs — the
  // old page index means nothing against a different result set.
  const patch = (next: Partial<SearchFilters>): void => {
    setFilters((prev) => ({ ...prev, ...next }));
    setPages({ deleted: 0, edited: 0 });
  };
  const onQuery = (value: string): void => patch({ query: value });

  return (
    <div>
      <InChatStatus />
      <div className="hc-tabs">
        <button
          type="button"
          className="hc-tab"
          data-active={tab === "deleted"}
          onClick={() => setTab("deleted")}
        >
          <TrashIcon size={16} /> 已删除
          {deleted.length > 0 && (
            <Badge tone="red">{narrowing ? `${deletedHits.length}/${deleted.length}` : deleted.length}</Badge>
          )}
        </button>
        <button
          type="button"
          className="hc-tab"
          data-active={tab === "edited"}
          onClick={() => setTab("edited")}
        >
          <PencilIcon size={16} /> 已编辑
          {edited.length > 0 && (
            <Badge tone="orange">{narrowing ? `${editedHits.length}/${edited.length}` : edited.length}</Badge>
          )}
        </button>

        <div className="hc-tabs__spacer" />

        <Button size="sm" variant="plain" icon={<DownloadIcon size={16} />} onClick={exportLog}>
          导出
        </Button>
        <Button
          size="sm"
          variant="destructive"
          // Scoped to the tab you're looking at. It used to wipe BOTH lists, so
          // tidying up edit history also destroyed every recorded deletion.
          onClick={() => messageLog.clear(tab)}
          disabled={all.length === 0}
          title={tab === "deleted" ? "清空「已删除」记录" : "清空「已编辑」记录"}
        >
          清空{tab === "deleted" ? "已删除" : "已编辑"}
        </Button>
      </div>

      <div className="hc-mlog-search">
        <SearchIcon size={18} />
        <input
          value={filters.query}
          onChange={(event) => onQuery(event.currentTarget.value)}
          placeholder={
            filters.mode === "regex"
              ? "正则，例如 ^喂|再见$"
              : filters.mode === "phrase"
                ? "精确短语，空格也算"
                : "搜索作者、内容、服务器 / 频道（空格分隔＝都要有）"
          }
          aria-label="搜索消息记录"
        />
        {filters.query && (
          <button
            type="button"
            className="hc-mlog-search__clear"
            aria-label="清除搜索"
            onClick={() => onQuery("")}
          >
            ×
          </button>
        )}
        <button
          type="button"
          className="hc-mlog-search__filters"
          data-active={showFilters || narrowing}
          aria-label="筛选"
          title="按作者 / 位置 / 时间筛选"
          onClick={() => setShowFilters((v) => !v)}
        >
          <SlidersIcon size={18} />
        </button>
      </div>

      {matcher.error && <div className="hc-mlog-filters__error">正则还没写完：{matcher.error}</div>}

      {showFilters && (
        <div className="hc-mlog-filters">
          <label className="hc-mlog-filters__field">
            <span>匹配方式</span>
            <select
              value={filters.mode}
              onChange={(e) => patch({ mode: e.currentTarget.value as SearchFilters["mode"] })}
            >
              <option value="contains">包含全部词</option>
              <option value="phrase">精确短语</option>
              <option value="regex">正则</option>
            </select>
          </label>
          <label className="hc-mlog-filters__field">
            <span>作者</span>
            <input
              value={filters.author}
              onChange={(e) => patch({ author: e.currentTarget.value })}
              placeholder="名字的一部分"
            />
          </label>
          <label className="hc-mlog-filters__field">
            <span>服务器 / 频道</span>
            <input
              value={filters.location}
              onChange={(e) => patch({ location: e.currentTarget.value })}
              placeholder="名字的一部分"
            />
          </label>
          <label className="hc-mlog-filters__field">
            <span>起始日期</span>
            <input type="date" value={filters.from} onChange={(e) => patch({ from: e.currentTarget.value })} />
          </label>
          <label className="hc-mlog-filters__field">
            <span>结束日期</span>
            <input type="date" value={filters.to} onChange={(e) => patch({ to: e.currentTarget.value })} />
          </label>
          <label className="hc-mlog-filters__field">
            <span>排序</span>
            <select
              value={filters.sort}
              onChange={(e) => patch({ sort: e.currentTarget.value as SearchFilters["sort"] })}
            >
              <option value="newest">最新在前</option>
              <option value="oldest">最早在前</option>
            </select>
          </label>
          <div className="hc-mlog-filters__actions">
            <Button size="sm" variant="plain" onClick={() => patch(DEFAULT_FILTERS)} disabled={!narrowing}>
              重置筛选
            </Button>
          </div>
        </div>
      )}

      {all.length === 0 ? (
        tab === "deleted" ? (
          <EmptyState
            icon={<TrashIcon size={48} />}
            title="还没有记录"
            subtitle="被删除的消息会在这里保留，启用插件后即时生效。"
          />
        ) : (
          <EmptyState
            icon={<PencilIcon size={48} />}
            title="还没有编辑记录"
            subtitle="消息被编辑前的内容会保留在这里。"
          />
        )
      ) : entries.length === 0 ? (
        <EmptyState
          icon={<SearchIcon size={48} />}
          title="没有匹配的记录"
          subtitle={
            (tab === "deleted" ? editedHits.length : deletedHits.length) > 0
              ? `这一栏没有，但「${tab === "deleted" ? "已编辑" : "已删除"}」里有 ${
                  tab === "deleted" ? editedHits.length : deletedHits.length
                } 条匹配。`
              : "换个关键词，或者放宽筛选条件试试。"
          }
        />
      ) : (
        <>
          <div className="hc-msglist">
            {tab === "deleted"
              ? (visible as readonly DeletedEntry[]).map((entry) => (
                  <DeletedRow
                    key={`${entry.channelId}-${entry.id}`}
                    entry={entry}
                    highlight={matcher.highlight}
                  />
                ))
              : (visible as readonly EditedEntry[]).map((entry) => (
                  <EditedRow
                    key={`${entry.channelId}-${entry.id}`}
                    entry={entry}
                    highlight={matcher.highlight}
                  />
                ))}
          </div>
          {pageCount > 1 && <Pager page={page} pageCount={pageCount} onChange={goTo} />}
        </>
      )}
    </div>
  );
}

function Pager(props: { page: number; pageCount: number; onChange: (next: number) => void }): React.ReactElement {
  const { page, pageCount, onChange } = props;
  return (
    <div className="hc-pager">
      <Button size="sm" variant="plain" onClick={() => onChange(page - 1)} disabled={page === 0}>
        上一页
      </Button>
      <span className="hc-pager__label">
        第 {page + 1} / {pageCount} 页
      </span>
      <Button
        size="sm"
        variant="plain"
        onClick={() => onChange(page + 1)}
        disabled={page >= pageCount - 1}
      >
        下一页
      </Button>
    </div>
  );
}

// Navigate the client to a logged message. Deleted messages no longer exist,
// so the jump lands on their channel (Discord can't highlight a gone message);
// edited messages still exist, so it highlights the live row. Resolves the
// guild from the stored id, falling back to the channel's own guild_id, then
// to "@me" for DMs / group DMs.
function jumpToMessage(channelId: string, messageId: string, guildId?: string): void {
  // Close the settings surface first so the app is what's on screen when the
  // route lands. On this build Halcyon's settings is its OWN overlay (the
  // native-embed patches don't apply), so closeSettings() is what actually
  // closes it; the Escape / popLayer belt-and-braces stay for embedded builds.
  dismissSettingsSurface();

  let gid = guildId;
  if (!gid) {
    try {
      const channel = ChannelStore.getChannel?.(channelId);
      gid = channel?.guild_id ?? channel?.guildId ?? undefined;
    } catch {
      // channel not cached; @me path still works for DMs
    }
  }
  // A full message deep-link. transitionTo-ing to this is exactly what "复制
  // 消息链接" + click does: switch channel, load the page around the message,
  // scroll to it, flash it.
  const path = `/channels/${gid ?? "@me"}/${channelId}/${messageId}`;

  const selected = (): string | undefined => {
    try {
      return SelectedChannelStore.getChannelId?.();
    } catch {
      return undefined;
    }
  };

  const doJump = (): void => {
    // Prefer Discord's own jump action (handles scroll + flash even when the
    // target page isn't loaded); otherwise push the deep-link route.
    const jump = JumpActions as any;
    if (typeof jump?.jumpToMessage === "function") {
      try {
        jump.jumpToMessage({ channelId, messageId, flash: true });
        // jumpToMessage doesn't always switch channel by itself on every
        // build, so also push the route to guarantee the channel change.
        if (selected() !== channelId) navigate(path);
        return;
      } catch (err) {
        log.warn("[jump] jumpToMessage threw; falling back to route", err);
      }
    }
    if (!navigate(path)) {
      log.warn("[jump] 跳转失败：JumpActions 与 NavigationRouter 均未解析到");
    }
  };

  // Retry across a few hundred ms. Closing the settings overlay (and, on
  // embedded builds, Discord restoring the previous route afterwards) can land
  // AFTER a single early nav and revert it — the "点了没反应" symptom. Retrying
  // until the selected channel actually matches beats that race.
  const schedule = [80, 220, 450, 800];
  let i = 0;
  const tick = (): void => {
    doJump();
    const now = selected();
    const ok = now === channelId;
    log.info(`[jump] 第 ${i + 1} 次 · now=${now ?? "?"} wanted=${channelId} ok=${ok}`);
    i++;
    if (!ok && i < schedule.length) {
      setTimeout(tick, schedule[i] - schedule[i - 1]);
    }
  };
  setTimeout(tick, schedule[0]);
}

/**
 * Close whichever settings surface is on top. Discord's user settings is not
 * reliably reachable through the layer-pop action on every build, but it always
 * closes on Escape (the client listens for it globally), so we dispatch a real
 * Escape key event as the primary path and fall back to popLayer / LAYER_POP.
 * Halcyon's own overlay is torn down directly.
 */
function dismissSettingsSurface(): void {
  try {
    closeSettings(); // Halcyon overlay; no-op if it isn't the surface showing
  } catch {
    // overlay not open
  }

  // Native user settings: Escape is the surest close across builds.
  try {
    const opts = { key: "Escape", code: "Escape", keyCode: 27, which: 27, bubbles: true, cancelable: true };
    document.dispatchEvent(new KeyboardEvent("keydown", opts as any));
    document.dispatchEvent(new KeyboardEvent("keyup", opts as any));
  } catch (err) {
    log.error("[jump] escape dispatch failed", err);
  }

  // Belt and braces: also pop the layer stack, in case this build routes
  // settings through it.
  try {
    if (typeof AppLayers.popLayer === "function") {
      AppLayers.popLayer();
    } else {
      getDispatcher()?.dispatch?.({ type: "LAYER_POP" });
    }
  } catch (err) {
    log.error("[jump] layer pop failed", err);
  }
}

function JumpButton({ entry }: { entry: DeletedEntry | EditedEntry }): React.ReactElement {
  return (
    <Button
      size="sm"
      variant="plain"
      className="hc-msg__jump"
      icon={<ChevronRightIcon size={16} />}
      title="跳转到该消息所在位置"
      onClick={() => jumpToMessage(entry.channelId, entry.id, entry.guildId)}
    >
      跳转
    </Button>
  );
}

function DeletedRow({ entry, highlight }: { entry: DeletedEntry; highlight?: RegExp | null }): React.ReactElement {
  return (
    <div className="hc-msg">
      <div className="hc-msg__head">
        <span className="hc-msg__author">{entry.author.name}</span>
        {entry.author.bot && <Badge tone="neutral">BOT</Badge>}
        <Location channelId={entry.channelId} guildId={entry.guildId} />
        <span className="hc-msg__time">{formatTime(entry.deletedAt)}</span>
        <JumpButton entry={entry} />
      </div>
      <div className="hc-msg__body">
        {entry.content ? (
          renderContent(entry.content, highlight)
        ) : entry.stickers?.length ? (
          <span>🏷️ 贴纸：{entry.stickers.map((s) => s.name).join("、")}</span>
        ) : entry.attachmentsRich?.length || entry.embeds?.length ? (
          <span>🖼️ 媒体消息</span>
        ) : (
          <span className="hc-msg__empty">（无文本内容）</span>
        )}
      </div>
      {(entry.attachmentsRich?.length ?? 0) > 0 && (
        <div className="hc-msg__media">
          {entry.attachmentsRich!.map((a, i) =>
            (a.content_type ?? "").startsWith("image/") || (a.content_type ?? "").startsWith("video/") ? (
              <img
                key={i}
                className="hc-msg__thumb"
                src={a.proxy_url ?? a.url}
                alt={a.filename ?? "附件"}
                loading="lazy"
              />
            ) : (
              <a key={i} href={a.url} target="_blank" rel="noreferrer">
                📎 {a.filename ?? "附件"}
              </a>
            )
          )}
        </div>
      )}
      {!entry.attachmentsRich?.length && entry.attachments.length > 0 && (
        <div className="hc-msg__meta">附件 {entry.attachments.length} 个</div>
      )}
    </div>
  );
}

function EditedRow({ entry, highlight }: { entry: EditedEntry; highlight?: RegExp | null }): React.ReactElement {
  return (
    <div className="hc-msg">
      <div className="hc-msg__head">
        <span className="hc-msg__author">{entry.author.name}</span>
        <Location channelId={entry.channelId} guildId={entry.guildId} />
        <span className="hc-msg__time">{formatTime(entry.updatedAt)}</span>
        <JumpButton entry={entry} />
      </div>
      <div className="hc-msg__versions">
        {entry.history.map((version, index) => (
          <div className="hc-msg__version" key={index}>
            <span className="hc-msg__vtag">v{index + 1}</span>
            <span className="hc-msg__vbody">
              {version.content ? renderContent(version.content, highlight) : "（空）"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Resolve a message's origin to readable names. The channel comes from
// ChannelStore; the guild from the stored guildId, or the channel's own
// guild_id when that's absent. Anything unresolved (a channel not cached this
// session) falls back to the raw id rather than showing nothing.
function resolveLocation(channelId: string, guildId?: string): { guild?: string; channel: string } {
  let channelName: string | undefined;
  let gid = guildId;
  let isDM = false;
  try {
    const channel = ChannelStore.getChannel?.(channelId);
    if (channel) {
      if (channel.name) channelName = String(channel.name);
      gid = gid ?? channel.guild_id ?? channel.guildId ?? undefined;
      isDM = channel.type === 1 || channel.type === 3;
    }
  } catch {
    // store not ready; fall through to the id
  }

  let guildName: string | undefined;
  try {
    if (gid) {
      const guild = GuildStore.getGuild?.(gid);
      if (guild?.name) guildName = String(guild.name);
    }
  } catch {
    // store not ready
  }

  const channel = channelName ? `#${channelName}` : isDM ? "私信" : `#${channelId}`;
  return { guild: guildName, channel };
}

function Location({ channelId, guildId }: { channelId: string; guildId?: string }): React.ReactElement {
  const loc = resolveLocation(channelId, guildId);
  return (
    <span className="hc-msg__where">
      {loc.guild && <span className="hc-msg__guild">{loc.guild}</span>}
      {loc.guild && <span className="hc-msg__sep">›</span>}
      <span>{loc.channel}</span>
    </span>
  );
}
function formatTime(time: number): string {
  const date = new Date(time);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function exportLog(): void {
  try {
    const blob = new Blob([messageLog.toJSON()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `halcyon-message-log-${Date.now()}.json`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  } catch (err) {
    log.error("export failed", err);
  }
}
