// A small "about" page: identity, a couple of live counts, and the honest
// disclaimer. Deliberately sparse.

import { HalcyonMark } from "../../icons";
import { Section } from "../components/Section";
import { useRuntimeList } from "./hooks";

export function AboutView(): React.ReactElement {
  const plugins = useRuntimeList().filter((p) => !p.hidden);
  const enabled = plugins.filter((p) => p.enabled).length;
  const version = typeof HALCYON_VERSION !== "undefined" ? HALCYON_VERSION : "dev";

  return (
    <div className="hc-stack">
      <div className="hc-about-hero">
        <HalcyonMark size={32} />
        <div>
          <div className="hc-about-hero__name">Halcyon</div>
          <div className="hc-about-hero__ver">版本 {version}</div>
        </div>
      </div>

      <Section title="概览">
        <AboutRow label="插件总数" value={String(plugins.length)} />
        <AboutRow label="已启用" value={String(enabled)} />
      </Section>

      <Section
        title="项目"
        note="修改 Discord 客户端违反其服务条款，由此产生的任何后果由使用者自行承担。本项目仅供技术研究与个人使用。"
      >
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
