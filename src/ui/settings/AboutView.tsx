// A small "about" page: identity, a live update check, a couple of live
// counts, and the honest disclaimer. Deliberately sparse.

import { HalcyonMark } from "../../icons";
import { Section } from "../components/Section";
import { Button } from "../components/Button";
import { checkForUpdate, getCachedUpdate, PROJECT_URL, type UpdateState } from "../../core/update";
import { useRuntimeList } from "./hooks";

/** Human-readable line for the current check state. */
function statusText(update: UpdateState | null, checking: boolean): string {
  if (checking) return "检查中…";
  if (!update) return "尚未检查";
  switch (update.status) {
    case "current":
      return "已是最新版本";
    case "outdated":
      return `发现新版本 ${update.latest}`;
    case "unknown":
      return "无法检查更新";
    default:
      return "检查中…";
  }
}

export function AboutView(): React.ReactElement {
  const plugins = useRuntimeList().filter((p) => !p.hidden);
  const enabled = plugins.filter((p) => p.enabled).length;
  const version = typeof HALCYON_VERSION !== "undefined" ? HALCYON_VERSION : "dev";

  const [update, setUpdate] = React.useState<UpdateState | null>(getCachedUpdate);
  const [checking, setChecking] = React.useState(false);
  const alive = React.useRef(true);

  const runCheck = React.useCallback((force: boolean) => {
    setChecking(true);
    void checkForUpdate(force)
      .then((state) => {
        if (alive.current) setUpdate(state);
      })
      .finally(() => {
        if (alive.current) setChecking(false);
      });
  }, []);

  React.useEffect(() => {
    alive.current = true;
    runCheck(false);
    return () => {
      alive.current = false;
    };
  }, [runCheck]);

  const outdated = update?.status === "outdated";

  return (
    <div className="hc-stack">
      <div className="hc-about-hero">
        <HalcyonMark size={32} />
        <div>
          <div className="hc-about-hero__name">Halcyon</div>
          <div className="hc-about-hero__ver">
            版本 {version}
            {outdated && "，有新版本可用"}
          </div>
        </div>
      </div>

      <Section
        title="更新"
        note={
          update?.status === "unknown"
            ? "无法访问 GitHub —— 可能被网络或客户端策略拦截，稍后再试。"
            : undefined
        }
      >
        <div className="hc-cell hc-cell--row">
          <div className="hc-cell__main">
            <div className="hc-cell__label">版本 {version}</div>
            <div className="hc-cell__desc">{statusText(update, checking)}</div>
          </div>
          <Button
            variant="secondary"
            size="sm"
            disabled={checking}
            onClick={() => runCheck(true)}
          >
            {checking ? "检查中…" : "检查更新"}
          </Button>
        </div>

        {outdated && (
          <div className="hc-cell hc-cell--row">
            <div className="hc-cell__main">
              <div className="hc-cell__label">发现新版本 {update?.latest}</div>
            </div>
            <Button
              variant="primary"
              size="sm"
              onClick={() => window.open(PROJECT_URL, "_blank", "noopener,noreferrer")}
            >
              前往下载
            </Button>
          </div>
        )}
      </Section>

      <Section title="概览">
        <AboutRow label="插件总数" value={String(plugins.length)} />
        <AboutRow label="已启用" value={String(enabled)} />
      </Section>

      <Section
        title="项目"
        note="修改 Discord 客户端违反其服务条款，由此产生的任何后果由使用者自行承担。本项目仅供技术研究与个人使用。"
      >
        <AboutRow label="作者" value="caitemm (mzrodyu)" />
        <AboutRow label="许可协议" value="GPL-3.0-or-later" />
      </Section>
    </div>
  );
}

function AboutRow({ label, value }: { label: string; value: string }): React.ReactElement {
  return (
    <div className="hc-cell hc-cell--row">
      <div className="hc-cell__main">
        <div className="hc-cell__label">{label}</div>
      </div>
      <span className="hc-about__value">{value}</span>
    </div>
  );
}
