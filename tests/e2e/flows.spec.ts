import { test, expect, type Page } from "@playwright/test";
import { mkdirSync } from "node:fs";
async function enter(page: Page, demo = false) {
  await page.goto("./");
  await page
    .getByRole("button", {
      name: demo ? "体验示例故事" : "开始我的记录",
      exact: true,
    })
    .click();
}
async function record(page: Page, text = "验收记录") {
  await page.getByRole("radio", { name: "一般", exact: true }).check();
  await page.getByRole("checkbox", { name: "疲惫", exact: true }).check();
  await page.getByRole("radio", { name: "中等", exact: true }).check();
  await page.getByLabel("一句话日记", { exact: true }).fill(text);
  await page.getByRole("button", { name: "保存记录", exact: true }).click();
  await expect(page.getByText("记录已保存", { exact: true })).toBeVisible();
}
async function nav(page: Page, name: string) {
  await page
    .getByRole("navigation", { name: "主导航" })
    .getByRole("link", { name, exact: true })
    .click();
  const headings: Record<string, string> = {
    记录: "给情绪，一个停靠的地方",
    洞察: "在变化里，更了解自己",
    关怀: "留一点时间，照顾自己",
    回顾: "回头看，慢慢懂自己",
  };
  await expect(
    page.getByRole("heading", { name: headings[name], exact: true }),
  ).toBeVisible();
}
test("personal journal persists, edits, shows evidence and supports cancel/delete", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await enter(page);
  await record(page, "<b>纯文本日记</b>");
  await page.reload();
  await nav(page, "回顾");
  await page.getByText("<b>纯文本日记</b>", { exact: true }).click();
  await expect(page.locator(".diary-text")).toHaveText("<b>纯文本日记</b>");
  await expect(page.locator(".diary-text b")).toHaveCount(0);
  await page.getByRole("button", { name: "修改记录" }).click();
  await page.getByLabel("一句话日记", { exact: true }).fill("修改后的记录");
  await page.getByRole("button", { name: "保存记录", exact: true }).click();
  await expect(page.getByText("记录已保存", { exact: true })).toBeVisible();
  await page.getByRole("link", { name: "查看记录", exact: true }).click();
  await page.reload();
  await expect(page.locator(".diary-text")).toHaveText("修改后的记录");
  await nav(page, "洞察");
  await page.getByText("查看每日数据与原始记录").click();
  await page.locator(".daily-data button:not([disabled])").click();
  await expect(page.locator(".evidence-panel")).toContainText("修改后的记录");
  await page.locator(".evidence-panel a").click();
  await page.getByRole("button", { name: "删除记录" }).click();
  await page.getByRole("button", { name: "取消", exact: true }).click();
  await expect(page.locator(".diary-text")).toHaveText("修改后的记录");
  await page.getByRole("button", { name: "删除记录" }).click();
  await page.getByRole("button", { name: "确认", exact: true }).click();
  await expect(page.getByText("这里，等着你的第一段记录")).toBeVisible();
  expect(errors).toEqual([]);
});
test("demo evidence and fixed AI references stay separate from personal records", async ({
  page,
  baseURL,
}) => {
  const external: string[] = [];
  page.on("request", (req) => {
    if (
      !req.url().startsWith(new URL(baseURL!).origin) &&
      !req.url().startsWith("data:")
    )
      external.push(req.url());
  });
  await enter(page, true);
  await nav(page, "洞察");
  await expect(page.locator(".insight-summary")).toContainText("14");
  await page.locator(".association summary").first().click();
  await expect(page.locator(".association").first()).toContainText("临时收到");
  await page.locator(".ai-banner").click();
  await expect(page.getByRole("note")).toContainText("预设内容，非实时生成");
  await page.getByText("查看引用的虚构日记").first().click();
  await expect(page.locator(".ai-observation").first()).toContainText(
    "第 2 天",
  );
  await page.getByRole("button", { name: "示例空间", exact: true }).click();
  await nav(page, "回顾");
  await expect(page.getByText("这里，等着你的第一段记录")).toBeVisible();
  expect(external).toEqual([]);
});
test("completed movement saves decline and breathing refresh is interrupted", async ({
  page,
}) => {
  await enter(page);
  await nav(page, "关怀");
  await page.getByRole("button", { name: "轻量活动", exact: true }).click();
  await page.getByRole("radio", { name: "比较好", exact: true }).check();
  await page.getByRole("button", { name: "开始练习", exact: true }).click();
  await page.getByRole("button", { name: "我已完成", exact: true }).click();
  await page.getByRole("radio", { name: "不太好", exact: true }).check();
  await page.getByRole("button", { name: "保存反馈", exact: true }).click();
  await page.getByRole("link", { name: "回看关怀反馈" }).click();
  await expect(page.locator(".feedback-row")).toContainText("-2.0");
  await expect(page.locator(".feedback-row")).toContainText("下降 1 次");
  await nav(page, "关怀");
  await page.getByRole("button", { name: "呼吸练习", exact: true }).click();
  await page.getByRole("button", { name: "开始练习", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "暂停练习", exact: true }),
  ).toBeVisible();
  page.on("dialog", (d) => d.accept());
  await page.reload();
  await nav(page, "回顾");
  await page.getByText("呼吸练习", { exact: false }).first().click();
  await expect(
    page.getByRole("heading", { name: "已中断", exact: true }),
  ).toBeVisible();
});
test("audio is user initiated and failure offers retry", async ({ page }) => {
  await page.route("**/audio/rain.wav", (route) => route.abort());
  await enter(page);
  await nav(page, "关怀");
  await page.getByRole("button", { name: "声音陪伴", exact: true }).click();
  await page.getByRole("button", { name: "开始练习", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "播放雨声", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "播放雨声", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("重试");
  await expect(page.getByRole("button", { name: "重试播放" })).toBeVisible();
});
test("backup export, preview cancel, clear and import restores the personal data", async ({
  page,
}) => {
  await enter(page);
  await record(page, "备份往返记录");
  await page.getByRole("link", { name: "数据管理", exact: true }).click();
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "导出备份", exact: true }).click();
  const download = await downloadPromise;
  const path = await download.path();
  expect(path).toBeTruthy();
  await page.locator("input[type=file]").setInputFiles(path!);
  await expect(page.getByRole("dialog")).toContainText("1 条日记");
  await page.getByRole("button", { name: "取消", exact: true }).click();
  await expect(page.locator(".privacy-note")).toContainText("1 条日记");
  await page.getByRole("button", { name: "清空个人数据", exact: true }).click();
  await page.getByRole("button", { name: "确认", exact: true }).click();
  await expect(page.locator(".privacy-note")).toContainText("0 条日记");
  await page.locator("input[type=file]").setInputFiles(path!);
  await page.getByRole("button", { name: "确认", exact: true }).click();
  await nav(page, "回顾");
  await expect(page.getByText("备份往返记录", { exact: true })).toBeVisible();
});
test("invalid backup preserves data and clearing personal does not clear demo", async ({
  page,
}) => {
  await enter(page, true);
  await page.getByRole("link", { name: "数据管理", exact: true }).click();
  await page.locator("input[type=file]").setInputFiles({
    name: "bad.json",
    mimeType: "application/json",
    buffer: Buffer.from('{"version":2}'),
  });
  await expect(page.getByRole("alert")).toContainText("版本");
  await page.getByRole("button", { name: "清空个人数据", exact: true }).click();
  await page.getByRole("button", { name: "取消", exact: true }).click();
  await nav(page, "洞察");
  await expect(page.locator(".insight-summary")).toContainText("14");
});
for (const width of [360, 768, 1440])
  test(`responsive layout and route refresh at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await enter(page, true);
    mkdirSync("/tmp/mood-journal-qa", { recursive: true });
    for (const name of ["记录", "洞察", "关怀", "回顾"]) {
      await nav(page, name);
      await expect(page.locator("h1")).toBeVisible();
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBeTruthy();
      await page.screenshot({
        path: `/tmp/mood-journal-qa/${width}-${name}.png`,
        fullPage: true,
      });
    }
    await page.reload();
    await expect(
      page.getByRole("heading", { name: "回头看，慢慢懂自己" }),
    ).toBeVisible();
  });
test("breathing timer pauses, resumes and finishes without fabricating paired feedback", async ({
  page,
}) => {
  await page.clock.install();
  await enter(page);
  await nav(page, "关怀");
  await page.getByRole("button", { name: "呼吸练习", exact: true }).click();
  await page.getByRole("button", { name: "开始练习", exact: true }).click();
  await page.clock.runFor(10000);
  await page.getByRole("button", { name: "暂停练习", exact: true }).click();
  const remaining = await page.getByLabel("剩余时间").innerText();
  await page.clock.runFor(30000);
  await expect(page.getByLabel("剩余时间")).toHaveText(remaining);
  await page.getByRole("button", { name: "继续练习", exact: true }).click();
  await page.clock.runFor(51000);
  await expect(
    page.getByRole("heading", { name: "现在，你感觉怎么样？" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "跳过评分并保存" }).click();
  await page.getByRole("link", { name: "回看关怀反馈" }).click();
  await expect(page.locator(".feedback-row")).toHaveCount(0);
});
test("real rain asset plays only on action, progresses and stops when paused", async ({
  page,
}) => {
  await enter(page);
  await nav(page, "关怀");
  await page.getByRole("button", { name: "声音陪伴", exact: true }).click();
  await page.getByRole("button", { name: "开始练习", exact: true }).click();
  expect(
    await page.locator("audio").evaluate((e: HTMLAudioElement) => e.paused),
  ).toBe(true);
  await page.getByRole("button", { name: "播放雨声", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "暂停声音", exact: true }),
  ).toBeVisible();
  await expect
    .poll(() =>
      page.locator("audio").evaluate((e: HTMLAudioElement) => e.currentTime),
    )
    .toBeGreaterThan(0.1);
  expect(
    await page.locator("audio").evaluate((e: HTMLAudioElement) => e.duration),
  ).toBeCloseTo(30);
  await page.getByRole("button", { name: "暂停练习", exact: true }).click();
  expect(
    await page.locator("audio").evaluate((e: HTMLAudioElement) => e.paused),
  ).toBe(true);
});
