import { test, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ReviewPage } from "../src/journal/ReviewPage";
import { openRepository } from "../src/storage/repository";
import { journal } from "./fixtures";
test("editing save returns to visible details without a reload of unchanged hash", async () => {
  const user = userEvent.setup(),
    repo = await openRepository("/" + crypto.randomUUID());
  render(
    <ReviewPage
      repo={repo}
      space="personal"
      snapshot={{ journals: [journal()], care: [] }}
      refresh={async () => {}}
      route="/review/journal/j1"
    />,
  );
  await user.click(screen.getByRole("button", { name: "修改记录" }));
  await user.click(screen.getByRole("button", { name: "保存记录" }));
  await user.click(await screen.findByRole("link", { name: "查看记录" }));
  expect(screen.getByText("那一天的自己", { exact: true })).toBeVisible();
  expect(screen.getByRole("button", { name: "修改记录" })).toBeVisible();
});
