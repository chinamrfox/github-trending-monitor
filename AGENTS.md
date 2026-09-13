# GitHub Trending Monitor - 应用规范

## 应用概览
监控 GitHub 趋势/热榜的 Web 应用，支持每日自动抓取、历史排名追踪、趋势曲线可视化。

## 设计规范

### 视觉风格
- 深色科技风，暗色背景 + 霓虹蓝/绿色调点缀
- 数据驱动视觉，图表为主，列表为辅
- 卡片带微光效果，hover 有悬浮动效

### 色彩系统
- 主色：`#2563eb`（蓝色）
- 强调色：`#10b981`（绿色，表示上升）、`#ef4444`（红色，表示下降）
- 背景：`#0f172a`（深海军蓝）
- 卡片背景：`#1e293b`
- 文字主色：`#f1f5f9`
- 文字次色：`#94a3b8`
- 边框：`#334155`

### 排版
- 标题：text-2xl font-bold text-slate-100
- 副标题：text-lg font-semibold text-slate-200
- 正文：text-sm text-slate-300
- 辅助：text-xs text-slate-500

### 间距
- 页面内边距：p-6
- 卡片内边距：p-4
- 元素间距：gap-4
- 区块间距：space-y-6

### 动画
- 入场动画：卡片渐入 + 轻微上移
- 悬浮效果：hover 时 translateY(-2px) + 阴影增强
- 图表加载：数据从下到上绘制的动画
- 排名变化：数字变化时的颜色闪烁效果

## 技术架构

### 后端模块
- `github-trending/`：GitHub 热榜抓取与查询模块
  - controller：热榜查询、趋势查询、手动触发抓取
  - service：GitHub API 调用、数据处理、历史计算
  - 自动化任务：每日 0 点定时抓取

### 数据库表
- `gh_repositories`：仓库基本信息（去重）
- `gh_trending_snapshots`：每日热榜快照
- `gh_ranking_history`：排名历史（按天聚合，用于趋势图）

### 前端页面
- 首页 `/`：热榜列表 + 筛选器 + 趋势图表
  - 筛选：时间范围（today/weekly/monthly）、编程语言
  - 列表：排名、仓库名、描述、语言、星标数、今日新增星标
  - 趋势图：选中仓库的排名变化曲线

## GitHub API 配置
- **Token 为可选项**：通过环境变量 `GITHUB_TOKEN` 配置；未配置时使用公开 API 免认证访问，功能完整可用
- 配置 Token 后可提高 API 调用限额与抓取稳定性
- Token 仅在后端服务中使用，前端代码不暴露任何凭据
- API：GitHub Search API（按 stars 排序 + 时间范围过滤）
  - 今日：`created:>YYYY-MM-DD`
  - 本周：`created:>YYYY-MM-DD`（7天前）
  - 本月：`created:>YYYY-MM-DD`（30天前）
- 语言过滤：`language:Python` 等
