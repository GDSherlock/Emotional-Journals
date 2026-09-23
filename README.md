# 心晴 · 情绪日记与自我关怀

面向初入职场年轻人的情绪洞察作品：记录当下，理解变化，用小行动照顾自己。

目标站点：[GitHub Pages](https://gdsherlock.github.io/Emotional-Journals/)

## 能做什么

- **记录**：五档感受、多选情绪、强度、事件标签、日记文字；可补记、修改、删除。
- **洞察**：7/30 天每日平均感受、事件关联、关怀前后变化；所有统计可查看原始依据，缺失日期留空。
- **关怀**：一分钟呼吸、程序化雨声、轻量活动；暂停、退出与前后自评，负向变化如实保存。
- **回顾**：按日期浏览、情绪和事件筛选、编辑日记、删除记录。
- **示例体验**：独立两周虚构故事，可编辑、重置，与个人数据隔离。
- **AI 解读示例**：固定预设内容，非实时生成，不分析、不发送个人日记。

## 数据说明

为避免多个窗口互相覆盖，同一浏览器同一站点一次只允许一个活动标签页；其他标签页会提示先关闭原页面再重试。需要支持 Web Locks 的较新浏览器和 HTTPS（本地 localhost 也可）。

个人记录仅保存到当前浏览器的 IndexedDB，按站点路径与示例空间隔离；没有账户、同步、后端或遥测。不应将本地存储视为加密或访问控制。

清除站点数据、更换浏览器/设备/部署路径不会自动保留记录，请定期导出 JSON 备份。备份未加密。导入最大 10 MB，先验证和预览，确认后**完整替换个人日记和关怀记录**；取消或失败保留原数据。导入、清空不会修改示例。

事件比较要求同期至少 7 条日记、标签至少 3 条且存在其他记录。这是展示门槛，不表示统计显著性；关联不等于原因。关怀反馈只含完整配对自评，不表示疗效。产品不能替代专业帮助。

## 本地开发

需要 Node.js 20.19+ 或 22.12+；发布使用 Node 22。

```sh
npm ci
npm run dev
npm test
npm run build
npm run preview
```

浏览器完整流程与 360/768/1440px 验证：

```sh
npx playwright install chromium
npm run test:e2e
```

测试使用独立浏览器上下文中的虚构数据，不读取日常浏览器中的个人日记。截图位于系统临时目录，不进入发布包。

## GitHub Pages

仓库 Pages Source 设置为 GitHub Actions，main 推送触发 `.github/workflows/deploy.yml`。工作流执行锁定安装、单元测试、生产构建，上传 `dist` 并发布。项目基础路径从仓库名生成；用户主页或存在 `public/CNAME` 时使用根路径。

本地验证与本仓库同样的子路径：

```sh
PAGES_BASE_PATH=/Emotional-Journals/ npm run build
PAGES_BASE_PATH=/Emotional-Journals/ npm run preview
```

页面使用 hash 路由，详情刷新无需服务器回退。无 API 密钥、运行时服务端或云端数据库。部署配置参考 [Vite 官方 Pages 指南](https://vite.dev/guide/static-deploy.html#github-pages)。

## 结构

`src/domain` 定义模型与校验；`src/storage` 处理事务和备份；`src/insights` 是纯函数分析及证据视图；`src/care` 管理活动状态；`src/demo` 保存虚构故事与固定解读；页面与样式独立组织。

[设计文档](docs/superpowers/specs/2026-09-22-mood-journal-design.md) · [实施计划](docs/superpowers/plans/2026-09-22-mood-journal.md) · [资源来源](docs/assets.md) · [验证记录](docs/verification.md)
