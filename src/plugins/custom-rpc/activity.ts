// Building the activity object Discord expects.
//
// Pure, because the interesting part is not the dispatch (one line) but the
// shape: Discord silently drops an activity that carries empty strings, a name
// shorter than two characters, or a button without a URL. Getting that wrong
// looks exactly like "the plugin does nothing", so the rules live here where
// they can be tested.

export const ActivityType = {
  PLAYING: 0,
  STREAMING: 1,
  LISTENING: 2,
  WATCHING: 3,
  COMPETING: 5
} as const;

export interface RpcConfig {
  appId: string;
  type: number;
  name: string;
  details: string;
  state: string;
  largeImage: string;
  largeText: string;
  smallImage: string;
  smallText: string;
  streamUrl: string;
  button1Text: string;
  button1Url: string;
  button2Text: string;
  button2Url: string;
  /** "none" | "now" — a running clock has to start somewhere. */
  timestampMode: string;
  /** Epoch ms the clock started, supplied by the caller so this stays pure. */
  startedAt: number;
}

export interface BuiltActivity {
  activity: Record<string, unknown> | null;
  /** Human-readable reasons the activity is incomplete or partly ignored. */
  problems: string[];
}

function clean(value: string): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

/** Whether an image field is a URL we must trade for an asset id first. */
export function isExternalImage(value: string): boolean {
  const v = value?.trim() ?? "";
  return /^https?:\/\//i.test(v);
}

/**
 * Assemble the activity. `resolveImage` maps a configured image to whatever the
 * caller could turn it into (an `mp:external/…` key for a URL, or the value
 * unchanged for an asset name); returning undefined drops the image.
 */
export function buildActivity(
  config: RpcConfig,
  resolveImage: (value: string) => string | undefined = (v) => clean(v)
): BuiltActivity {
  const problems: string[] = [];

  const name = clean(config.name);
  if (!name) {
    return { activity: null, problems: ["没填名称——这是唯一必填项，留空就不会显示任何东西。"] };
  }
  if (name.length < 2) {
    problems.push("名称至少要两个字符，Discord 会丢掉更短的。");
  }

  const activity: Record<string, unknown> = {
    name,
    type: config.type,
    flags: 1 // INSTANCE
  };

  const appId = clean(config.appId);
  if (appId) activity.application_id = appId;

  const details = clean(config.details);
  if (details) activity.details = details;
  const state = clean(config.state);
  if (state) activity.state = state;

  if (config.type === ActivityType.STREAMING) {
    const url = clean(config.streamUrl);
    // Discord only renders the STREAMING type with a Twitch / YouTube url; with
    // anything else it falls back to showing nothing at all.
    if (url && /^https?:\/\/(www\.)?(twitch\.tv|youtube\.com)\//i.test(url)) activity.url = url;
    else problems.push("「直播中」这个类型必须配 twitch.tv 或 youtube.com 的链接，否则不显示。");
  }

  const assets: Record<string, string> = {};
  const large = config.largeImage?.trim() ? resolveImage(config.largeImage) : undefined;
  if (large) assets.large_image = large;
  const largeText = clean(config.largeText);
  if (largeText) assets.large_text = largeText;
  const small = config.smallImage?.trim() ? resolveImage(config.smallImage) : undefined;
  if (small) assets.small_image = small;
  const smallText = clean(config.smallText);
  if (smallText) assets.small_text = smallText;
  if (Object.keys(assets).length) activity.assets = assets;
  if ((assets.small_image || assets.small_text) && !assets.large_image) {
    problems.push("只配小图时 Discord 不会显示它——小图是挂在大图角上的，得先有大图。");
  }
  if ((large || small) && !appId) {
    problems.push("图片需要填应用 ID：图床地址要先换成 Discord 的资源 id，没有应用 ID 换不了。");
  }

  const buttons: string[] = [];
  const urls: string[] = [];
  for (const [text, url] of [
    [config.button1Text, config.button1Url],
    [config.button2Text, config.button2Url]
  ]) {
    const label = clean(text);
    const href = clean(url);
    if (!label && !href) continue;
    if (!label || !href) {
      problems.push("按钮的文字和链接要一起填，只填一个会被整颗丢掉。");
      continue;
    }
    buttons.push(label);
    urls.push(href);
  }
  if (buttons.length) {
    activity.buttons = buttons;
    activity.metadata = { button_urls: urls };
  }

  if (config.timestampMode === "now") {
    activity.timestamps = { start: config.startedAt };
  }

  return { activity, problems };
}
