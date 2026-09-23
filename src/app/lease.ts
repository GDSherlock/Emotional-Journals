/** A single active tab owns this local database; other tabs never run recovery writes. */
export function acquireWorkspaceLease(
  locks: Pick<LockManager, "request"> | undefined,
  base: string,
): Promise<() => void> {
  if (!locks)
    return Promise.reject(
      new Error(
        "当前浏览器不支持安全的多窗口保护，请使用较新版本的 Chrome、Edge、Safari 或 Firefox。",
      ),
    );
  const name =
    "mood-journal:" + ("/" + base.split("/").filter(Boolean).join("/"));
  return new Promise((resolve, reject) => {
    void locks
      .request(name, { mode: "exclusive", ifAvailable: true }, async (lock) => {
        if (!lock) {
          reject(
            new Error(
              "心晴已在另一个标签页打开。请先关闭那个页面，再点击重新打开；原来的记录与活动不受影响。",
            ),
          );
          return;
        }
        await new Promise<void>((release) => resolve(release));
      })
      .catch(reject);
  });
}
