// The mark-all-read page.
//
// One button. It dispatches a single BULK_ACK for every unread channel across
// every joined guild (see ../mark.ts) and reports how much was cleared. There
// is no undo — marking read is not destructive, but it can't be reversed — so
// the copy says as much and the result line makes the outcome explicit.

import { useState } from "../../../core/common/react";
import { Section } from "../../../ui/components/Section";
import { Button } from "../../../ui/components/Button";
import { MessageCheckIcon, InfoIcon } from "../../../icons";
import { showToast } from "../../../core/common/discord";
import { logger } from "../../../core/logger";
import { markAllRead } from "../mark";

const log = logger("mark-all-read");

export function MarkAllReadPage(): React.ReactElement {
  const [busy, setBusy] = useState(false);
  const [state, setState] = useState("待机");
  const [detail, setDetail] = useState("点击下方按钮，把所有服务器里的未读一次性清空。");

  const onMark = () => {
    if (busy) return;
    setBusy(true);
    setState("处理中");
    setDetail("正在收集未读频道…");
    try {
      const result = markAllRead();
      if (result.channels === 0) {
        setState("已是最新");
        setDetail("没有找到任何未读，无需操作。");
        showToast("没有未读消息", "info");
      } else {
        setState("完成");
        setDetail(`已清空 ${result.guilds} 个服务器中的 ${result.channels} 个频道。`);
        showToast(`已标记 ${result.channels} 个频道为已读`, "success");
      }
    } catch (err: any) {
      setState("失败");
      setDetail(err?.message ?? String(err));
      showToast("标记失败", "failure");
      log.error("mark all read failed", err);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="hc-stack">
      <div className="hc-inline-note">
        <InfoIcon size={18} />
        <span>
          一次性把<strong>所有服务器</strong>的未读消息标为已读。标记已读不会删除任何消息，但无法撤销。
        </span>
      </div>

      <Section title="操作">
        <div className="hc-cell">
          <Button variant="primary" icon={<MessageCheckIcon size={16} />} disabled={busy} onClick={onMark}>
            全部标为已读
          </Button>
        </div>
      </Section>

      <div className="hc-cleaner__status">
        <div className="hc-cleaner__status-state">{state}</div>
        {detail && <div className="hc-cleaner__status-detail">{detail}</div>}
      </div>
    </div>
  );
}
