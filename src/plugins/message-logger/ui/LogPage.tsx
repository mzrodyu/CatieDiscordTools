// The message-logger page.
//
// Two lists — deleted messages and edit histories — captured by the recorder.
// This view is self-contained: it reads from the plugin's own store, so it
// works whether or not the optional in-chat patches applied.

import { useEffect, useState } from "../../../core/common/react";
import { ChannelStore } from "../../../core/common/discord";
import { logger } from "../../../core/logger";
import { messageLog, type DeletedEntry, type EditedEntry } from "../store";
import { Button } from "../../../ui/components/Button";
import { EmptyState } from "../../../ui/components/EmptyState";
import { Badge } from "../../../ui/components/Badge";
import { TrashIcon, PencilIcon, DownloadIcon } from "../../../icons";

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

export function LogPage(): React.ReactElement {
  const { deleted, edited } = useLog();
  const [tab, setTab] = useState<Tab>("deleted");

  const rows = tab === "deleted" ? deleted.length : edited.length;

  return (
    <div>
      <div className="hc-tabs">
        <button
          type="button"
          className="hc-tab"
          data-active={tab === "deleted"}
          onClick={() => setTab("deleted")}
        >
          <TrashIcon size={16} /> 已删除
          {deleted.length > 0 && <Badge tone="red">{deleted.length}</Badge>}
        </button>
        <button
          type="button"
          className="hc-tab"
          data-active={tab === "edited"}
          onClick={() => setTab("edited")}
        >
          <PencilIcon size={16} /> 已编辑
          {edited.length > 0 && <Badge tone="orange">{edited.length}</Badge>}
        </button>

        <div className="hc-tabs__spacer" />

        <Button size="sm" variant="plain" icon={<DownloadIcon size={16} />} onClick={exportLog}>
          导出
        </Button>
        <Button
          size="sm"
          variant="destructive"
          onClick={() => messageLog.clear()}
          disabled={rows === 0}
        >
          清空
        </Button>
      </div>

      {tab === "deleted" ? (
        deleted.length === 0 ? (
          <EmptyState
            icon={<TrashIcon size={48} />}
            title="还没有记录"
            subtitle="被删除的消息会在这里保留，启用插件后即时生效。"
          />
        ) : (
          <div className="hc-msglist">
            {deleted.map((entry) => (
              <DeletedRow key={`${entry.channelId}-${entry.id}`} entry={entry} />
            ))}
          </div>
        )
      ) : edited.length === 0 ? (
        <EmptyState
          icon={<PencilIcon size={48} />}
          title="还没有编辑记录"
          subtitle="消息被编辑前的内容会保留在这里。"
        />
      ) : (
        <div className="hc-msglist">
          {edited.map((entry) => (
            <EditedRow key={`${entry.channelId}-${entry.id}`} entry={entry} />
          ))}
        </div>
      )}
    </div>
  );
}

function DeletedRow({ entry }: { entry: DeletedEntry }): React.ReactElement {
  return (
    <div className="hc-msg">
      <div className="hc-msg__head">
        <span className="hc-msg__author">{entry.author.name}</span>
        {entry.author.bot && <Badge tone="neutral">BOT</Badge>}
        <span className="hc-msg__where">{channelLabel(entry.channelId)}</span>
        <span className="hc-msg__time">{formatTime(entry.deletedAt)}</span>
      </div>
      <div className="hc-msg__body">
        {entry.content ? (
          entry.content
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

function EditedRow({ entry }: { entry: EditedEntry }): React.ReactElement {
  return (
    <div className="hc-msg">
      <div className="hc-msg__head">
        <span className="hc-msg__author">{entry.author.name}</span>
        <span className="hc-msg__where">{channelLabel(entry.channelId)}</span>
        <span className="hc-msg__time">{formatTime(entry.updatedAt)}</span>
      </div>
      <div className="hc-msg__versions">
        {entry.history.map((version, index) => (
          <div className="hc-msg__version" key={index}>
            <span className="hc-msg__vtag">v{index + 1}</span>
            <span className="hc-msg__vbody">{version.content || "（空）"}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function channelLabel(channelId: string): string {
  try {
    const channel = ChannelStore.getChannel(channelId);
    if (channel?.name) return `#${channel.name}`;
  } catch {
    // ChannelStore may not be ready; fall back to the id.
  }
  return `#${channelId}`;
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
