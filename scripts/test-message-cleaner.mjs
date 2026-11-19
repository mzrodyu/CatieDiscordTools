// Offline regression tests for the cleaner's Discord search contract.
// Every fetch is mocked: this suite neither connects to Discord nor deletes messages.
import assert from "node:assert/strict";
import { afterEach, beforeEach, test } from "node:test";
import { build } from "esbuild";

const bundle = await build({
  entryPoints: ["src/plugins/message-cleaner/cleaner.ts"],
  bundle: true,
  write: false,
  format: "esm",
  platform: "node",
  logLevel: "silent"
});
const { collect, count, remove } = await import(
  `data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text).toString("base64")}`
);

const GUILD = "1560753855455830156";
const CHANNEL = "156075385621473039";
const SELF = "111111111111111111";
const OTHER = "222222222222222222";
const guildSearch = `/guilds/${GUILD}/messages/search`;
const dmSearch = `/channels/${CHANNEL}/messages/search`;
const options = (extra = {}) => ({
  guildId: GUILD, channelId: CHANNEL, serverWide: false,
  order: "desc", limit: 100, delayMs: 1600, after: null, before: null,
  ...extra
});
const message = (n, extra = {}) => ({
  id: String(1460000000000000000n + BigInt(n)),
  channel_id: CHANNEL, author: { id: SELF }, hit: true, type: 0,
  content: `message ${n}`, timestamp: "2026-01-01T12:00:00.000Z",
  ...extra
});
const response = (body, status = 200) => new Response(JSON.stringify(body), {
  status, headers: { "Content-Type": "application/json" }
});
const page = (messages, total = messages.length) => ({
  total_results: total,
  messages: messages.map((m) => [
    message(9000, { hit: false, content: "own message shown only as context" }),
    m
  ])
});
const fortyFour = Array.from({ length: 44 }, (_, i) => message(44 - i));
const realFetch = globalThis.fetch;
const realSetTimeout = globalThis.setTimeout;
let calls, waits, handle, allowDelete;

beforeEach(() => {
  calls = [];
  allowDelete = false;
  waits = [];
  handle = () => { throw new Error("Unexpected API request"); };
  globalThis.fetch = async (input, init = {}) => {
    const url = new URL(input);
    const request = {
      url, path: url.pathname.replace(/^\/api\/v\d+/, ""),
      method: init.method ?? "GET", headers: init.headers
    };
    calls.push(request);
    if (!allowDelete) assert.equal(request.method, "GET", "preview/count must never send a deletion");
    return handle(request);
  };
  // Exercise retries without waiting in real time; retain requested delays for assertions.
  globalThis.setTimeout = (callback, ms, ...args) => {
    waits.push(ms);
    return realSetTimeout(callback, 0, ...args);
  };
});
afterEach(() => {
  globalThis.fetch = realFetch;
  globalThis.setTimeout = realSetTimeout;
});

function serve(messages, total = messages.length, expectedPath = guildSearch, pageSize = 25) {
  handle = ({ path, url }) => {
    // The old collector walks channel history and would see no recent own messages.
    if (path === `/channels/${CHANNEL}/messages`) return response([]);
    if (path === `/channels/${CHANNEL}`) return response({ id: CHANNEL, guild_id: GUILD, name: "chat" });
    assert.equal(path, expectedPath);
    const offset = Number(url.searchParams.get("offset") ?? 0);
    return response(page(messages.slice(offset, offset + pageSize), total));
  };
}
const preview = (opts = options(), progress = () => {}, ctrl = { stopped: false }) =>
  collect("fixture-token", opts, SELF, progress, ctrl);
const searchCalls = () => calls.filter((r) => r.path.endsWith("/messages/search"));
const ids = (messages) => messages.map((m) => m.id);

// Regression for the reported mismatch: statistics say 44, but history scanning finds 0.
test("guild preview returns all 44 own messages in two search pages, matching count", async () => {
  serve(fortyFour);
  assert.deepEqual(await count("fixture-token", options(), SELF), { total: 44, indexing: false });
  const updates = [];
  const found = await preview(options(), (state, detail) => updates.push({ state, detail }));
  assert.deepEqual(ids(found), ids(fortyFour));
  assert.equal(searchCalls().length, 3); // count + two preview pages
  assert.deepEqual(searchCalls().slice(1).map((r) => r.url.searchParams.get("offset")), ["0", "25"]);
  assert.ok(!calls.some((r) => r.path === `/channels/${CHANNEL}/messages`));
  assert.ok(updates.some((r) => r.detail.includes("44")), "show the real search total");
  for (const r of searchCalls()) {
    assert.equal(r.url.searchParams.get("author_id"), SELF);
    assert.equal(r.url.searchParams.get("channel_id"), CHANNEL);
    assert.equal(r.headers.Authorization, "fixture-token");
  }
});

test("DM preview uses channel search with no guild channel_id filter", async () => {
  serve(fortyFour, 44, dmSearch);
  const found = await preview(options({ guildId: "@me" }));
  assert.equal(found.length, 44);
  assert.equal(calls.length, 2);
  assert.ok(searchCalls().every((r) => !r.url.searchParams.has("channel_id")));
});

test("a channel ID alone resolves its guild before both preview and count", async () => {
  serve([message(1)]);
  assert.equal((await preview(options({ guildId: "" }))).length, 1);
  assert.equal((await count("fixture-token", options({ guildId: "" }), SELF)).total, 1);
  assert.equal(calls.filter((r) => r.path === `/channels/${CHANNEL}`).length, 2);
  assert.equal(searchCalls().length, 2);
  assert.ok(searchCalls().every((r) => r.path === guildSearch));
});

test("full-server preview does not constrain channel_id", async () => {
  serve([message(1), message(2, { channel_id: "333333333333333333" })]);
  const found = await preview(options({ serverWide: true, channelId: "" }));
  assert.equal(found.length, 2);
  assert.equal(searchCalls()[0].url.searchParams.get("channel_id"), null);
});

test("only explicit own hits in the chosen channel enter the preview; context and duplicates do not", async () => {
  const own = message(1);
  serve([
    message(2, { author: { id: OTHER } }),
    message(3, { channel_id: "333333333333333333" }),
    own, own,
    message(4, { hit: false })
  ]);
  assert.deepEqual(ids(await preview()), [own.id]);
});

test("limit is applied to collected hits and stops further searches", async () => {
  serve(fortyFour);
  assert.deepEqual(ids(await preview(options({ limit: 10 }))), ids(fortyFour.slice(0, 10)));
  assert.equal(searchCalls().length, 1);
});

test("short intermediate pages continue while the reported total has more results", async () => {
  serve(fortyFour, 44, guildSearch, 20);
  assert.equal((await preview()).length, 44);
  assert.deepEqual(searchCalls().map((r) => r.url.searchParams.get("offset")), ["0", "20", "40"]);
});

test("ascending search explicitly sorts by timestamp from old to new", async () => {
  const ascending = [message(1), message(2), message(3)];
  serve(ascending);
  assert.deepEqual(ids(await preview(options({ order: "asc" }))), ids(ascending));
  assert.equal(searchCalls()[0].url.searchParams.get("sort_by"), "timestamp");
  assert.equal(searchCalls()[0].url.searchParams.get("sort_order"), "asc");
});

test("time bounds go into the search request and are also enforced on each hit", async () => {
  const after = new Date("2026-01-01T11:00:00.000Z");
  const before = new Date("2026-01-01T13:00:00.000Z");
  serve([
    message(1, { timestamp: "2026-01-01T10:00:00.000Z" }),
    message(2),
    message(3, { timestamp: "2026-01-01T14:00:00.000Z" })
  ]);
  assert.deepEqual(ids(await preview(options({ after, before }))), [message(2).id]);
  const sf = (d) => String((BigInt(d.getTime()) - 1420070400000n) << 22n);
  assert.equal(searchCalls()[0].url.searchParams.get("min_id"), sf(after));
  assert.equal(searchCalls()[0].url.searchParams.get("max_id"), sf(before));
});

test("HTTP 202 indexing is retried even when the message is localized", async () => {
  let attempts = 0;
  handle = ({ path }) => {
    if (path === `/channels/${CHANNEL}/messages`) return response([]);
    assert.equal(path, guildSearch);
    return ++attempts === 1
      ? response({ code: 110000, message: "索引正在建立", retry_after: 0.5 }, 202)
      : response(page([message(1)]));
  };
  assert.equal((await preview()).length, 1);
  assert.equal(attempts, 2);
  assert.ok(waits.reduce((sum, ms) => sum + ms, 0) >= 500);
});

test("count reports HTTP 202 indexing instead of a completed zero count", async () => {
  handle = () => response({ message: "索引正在建立", retry_after: 1 }, 202);
  assert.deepEqual(await count("fixture-token", options(), SELF), { total: 0, indexing: true });
});

test("a never-ready index fails explicitly after bounded retries", async () => {
  handle = ({ path }) => {
    if (path === `/channels/${CHANNEL}/messages`) return response([]);
    return response({ code: 110000, retry_after: 0.001 }, 202);
  };
  await assert.rejects(preview(), /索引/);
  assert.equal(searchCalls().length, 10);
});

test("stop before starting does not make a request", async () => {
  assert.deepEqual(await preview(options({ guildId: "" }), () => {}, { stopped: true }), []);
  assert.equal(calls.length, 0);
});

test("stop after a page keeps the collected preview and makes no next-page request", async () => {
  serve(fortyFour);
  const ctrl = { stopped: false };
  const found = await preview(options(), (_state, detail) => {
    if (detail.includes("已找到 25")) ctrl.stopped = true;
  }, ctrl);
  assert.equal(found.length, 25);
  assert.equal(searchCalls().length, 1);
});

test("a repeated search page errors instead of endlessly scanning zero new messages", async () => {
  handle = ({ path }) => {
    if (path === `/channels/${CHANNEL}/messages`) return response([]);
    return response(page(fortyFour.slice(0, 25), 75));
  };
  await assert.rejects(preview(), /重复/);
  assert.equal(searchCalls().length, 2);
});

test("malformed search responses are errors, not false successful zero previews", async () => {
  handle = ({ path }) => path === `/channels/${CHANNEL}/messages`
    ? response([]) : response({ total_results: 44 });
  await assert.rejects(preview(), /搜索响应/);
});

test("a positive total with a temporarily empty page retries the same offset", async () => {
  let attempts = 0;
  handle = () => ++attempts === 1
    ? response({ total_results: 1, messages: [] })
    : response(page([message(1)]));
  assert.equal((await preview()).length, 1);
  assert.equal(searchCalls().length, 2);
  assert.deepEqual(searchCalls().map((r) => r.url.searchParams.get("offset")), ["0", "0"]);
});

test("persistently empty pages with a positive total fail rather than completing a zero preview", async () => {
  handle = () => response({ total_results: 44, messages: [] });
  await assert.rejects(preview(), /44.*分页仍为空/);
  assert.equal(searchCalls().length, 3);
});

test("a genuinely empty search completes after one page", async () => {
  serve([]);
  assert.deepEqual(await preview(), []);
  assert.equal(searchCalls().length, 1);
});

test("rate-limited search waits and retries without advancing its offset", async () => {
  let attempts = 0;
  handle = () => ++attempts === 1
    ? response({ message: "Rate limited", retry_after: 0.5 }, 429)
    : response(page([message(1)]));
  assert.equal((await preview()).length, 1);
  assert.equal(searchCalls().length, 2);
  assert.deepEqual(searchCalls().map((r) => r.url.searchParams.get("offset")), ["0", "0"]);
  assert.ok(waits.reduce((sum, ms) => sum + ms, 0) >= 500);
});

test("failed channel resolution is surfaced rather than guessed to be a DM", async () => {
  handle = ({ path }) => {
    if (path === `/channels/${CHANNEL}/messages`) return response([]);
    assert.equal(path, `/channels/${CHANNEL}`);
    return response({ message: "Missing Access", code: 50001 }, 403);
  };
  await assert.rejects(preview(options({ guildId: "" })), /API 403/);
  assert.equal(searchCalls().length, 0);
});

test("content / link / file filters are sent to the search endpoint", async () => {
  serve([message(1)]);
  await preview(options({ content: " hello ", hasLink: true, hasFile: true }));
  const q = searchCalls()[0].url.searchParams;
  assert.equal(q.get("content"), "hello");
  assert.deepEqual(q.getAll("has"), ["link", "file"]);
});

test("no filter options means no content/has parameters", async () => {
  serve([message(1)]);
  await preview();
  const q = searchCalls()[0].url.searchParams;
  assert.equal(q.has("content"), false);
  assert.equal(q.has("has"), false);
});

test("pinned messages are kept out of the preview unless includePinned is set", async () => {
  const list = [message(1, { pinned: true }), message(2)];
  serve(list);
  assert.deepEqual(ids(await preview()), [message(2).id]);
  const withPinned = await preview(options({ includePinned: true }));
  assert.deepEqual(ids(withPinned), ids(list));
  assert.equal(withPinned[0].pinned, true);
});

test("undeletable system messages never enter the preview", async () => {
  serve([message(1, { type: 7 }), message(2, { type: 3 }), message(3, { type: 19 }), message(4, { type: 46 })]);
  assert.deepEqual(ids(await preview()), [message(1).id, message(3).id]);
});

test("regex pattern filters hits case-insensitively; an invalid one fails before any request", async () => {
  serve([message(1, { content: "Hello" }), message(2, { content: "bye" })]);
  assert.deepEqual(ids(await preview(options({ pattern: "^hel" }))), [message(1).id]);
  calls.length = 0;
  await assert.rejects(preview(options({ pattern: "(" })), /正则/);
  assert.equal(calls.length, 0);
});

test("preview rows carry attachment / sticker / embed info", async () => {
  serve([message(1, { content: "", attachments: [{}, {}], embeds: [{}], sticker_items: [{ name: "wave" }] })]);
  const [row] = await preview();
  assert.equal(row.attachments, 2);
  assert.equal(row.embeds, 1);
  assert.deepEqual(row.stickers, ["wave"]);
});

test("remove deletes exactly the messages it is given, nothing else from the preview", async () => {
  serve([message(1), message(2), message(3)]);
  const found = await preview();
  calls.length = 0;
  allowDelete = true;
  handle = () => new Response(null, { status: 204 });
  const chosen = found.filter((m) => m.id !== message(2).id);
  const result = await remove("fixture-token", chosen, options(), () => {}, { stopped: false });
  assert.deepEqual(result, { deleted: 2, skipped: 0 });
  assert.deepEqual(
    calls.map((r) => `${r.method} ${r.path}`),
    chosen.map((m) => `DELETE /channels/${CHANNEL}/messages/${m.id}`)
  );
});

test("an archived-thread delete (50083) is reported as a skip and the run continues", async () => {
  serve([message(11), message(12)]);
  const found = await preview();
  allowDelete = true;
  handle = ({ path }) => path.endsWith(message(11).id)
    ? response({ code: 50083, message: "Thread is archived" }, 400)
    : new Response(null, { status: 204 });
  const items = [];
  const result = await remove("fixture-token", found, options(), () => {}, { stopped: false },
    (m, ok, error) => items.push({ id: m.id, ok, error }));
  assert.deepEqual(result, { deleted: 1, skipped: 1 });
  assert.match(items[0].error, /归档/);
  assert.equal(items[1].ok, true);
});

test("message-id bounds are sent as min_id/max_id, override dates, and exclude the bounds themselves", async () => {
  const list = [message(5), message(4), message(3), message(2), message(1)];
  serve(list);
  const found = await preview(options({
    afterId: message(1).id, beforeId: message(5).id,
    after: new Date("2030-01-01T00:00:00.000Z"), before: new Date("2010-01-01T00:00:00.000Z")
  }));
  assert.deepEqual(ids(found), [message(4).id, message(3).id, message(2).id]);
  const q = searchCalls()[0].url.searchParams;
  assert.equal(q.get("min_id"), message(1).id);
  assert.equal(q.get("max_id"), message(5).id);
});

test("a message-id bound on one side keeps the date bound on the other", async () => {
  serve([message(2)]);
  const before = new Date("2027-01-01T00:00:00.000Z");
  await preview(options({ afterId: message(1).id, before }));
  const q = searchCalls()[0].url.searchParams;
  assert.equal(q.get("min_id"), message(1).id);
  assert.equal(q.get("max_id"), String((BigInt(before.getTime()) - 1420070400000n) << 22n));
});

test("invalid or reversed message-id bounds fail before any request", async () => {
  await assert.rejects(preview(options({ afterId: "abc" })), /消息 ID/);
  await assert.rejects(preview(options({ afterId: message(5).id, beforeId: message(1).id })), /消息区间/);
  assert.equal(calls.length, 0);
});
