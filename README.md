# Local Tab Organizer

Local Tab Organizer 是一个纯本地运行的 Chrome 标签页智能整理扩展。它读取当前窗口标签页的标题、URL 和域名，在浏览器本地用规则、内置词表和轻量聚类生成分组建议，并在用户确认后使用 Chrome 原生 Tab Groups 创建标签组。

## 功能列表

- 本地用户规则分类
- 内置域名词表分类
- 标题和 URL 关键词分类
- 同域名聚合
- 轻量 Jaccard 相似度聚类
- 可选 Chrome 内置 Gemini Nano 本地增强，固定英文分类 ID 映射中文组名
- 原生 Chrome Tab Groups 应用
- 侧边栏查看、编辑、删除分组建议
- 设置页规则管理
- 设置导入导出
- 折叠、展开、取消当前窗口标签组

## 安装依赖

```bash
npm install
```

## 开发运行

```bash
npm run dev
```

## 构建

```bash
npm run build
```

构建产物会生成到 `dist` 目录。

## 在 Chrome 中加载扩展

1. 打开 `chrome://extensions`
2. 开启 Developer mode
3. 点击 Load unpacked
4. 选择本项目的 `dist` 目录

## 使用方法

1. 点击扩展图标并打开侧边栏。
2. 点击“本地智能整理”。
3. 查看每个建议分组的名称、颜色、标签页和分类原因。
4. 按需要修改组名、颜色，删除建议组，或移除单个标签。
5. 点击“应用分组”后，扩展会调用 Chrome 原生 Tab Groups API 创建标签组。

## Gemini Nano 增强模式

Gemini Nano 增强是可选功能，默认关闭。可在设置页开启“启用 Chrome 内置 Gemini Nano 本地增强”。

开启后，扩展仍然会先执行本地规则、内置词表、关键词、同域名聚合和相似度聚类。Chrome 内置 Gemini Nano 只处理本地流程剩余的未分组标签，不会覆盖用户规则、域名词表等确定性结果。

由于 Chrome Prompt API 当前主要支持英文、西班牙文和日文语言代码，本扩展对 Gemini Nano 使用英文请求，并要求它只返回固定英文 `categoryId`，例如：

- `development`
- `tech-docs`
- `papers`
- `social`
- `video`
- `shopping`
- `design`

扩展会在本地把这些英文分类 ID 映射成中文组名和颜色，例如：

- `development` -> 开发编程
- `tech-docs` -> 技术文档
- `social` -> 社交社区
- `shopping` -> 购物消费

如果 Gemini Nano 不可用、模型尚未下载、返回内容不是合法 JSON、或返回未知分类 ID，扩展会自动回退到普通本地分类结果。

## 本地分类机制

分类按固定顺序执行：

- 用户规则：支持域名、域名后缀、关键词、URL 正则、标题正则。
- 域名词表：内置常见站点到分类的映射。
- 标题关键词：根据分类词表对标题打分。
- URL 关键词：根据路径和 URL 文本打分。
- 同域名聚合：未分类标签中，同域名数量达到阈值时成组。
- Jaccard 相似度聚类：使用标题、域名、URL path 的 token set 做轻量聚类。
- Chrome 内置 Gemini Nano 增强：可在设置页手动开启。扩展会先完成本地规则分类，再在支持 Prompt API 的 Chrome 中调用浏览器内置本地模型，对剩余未分组标签进行弱语义分类；不可用或返回格式不合法时自动回退。

## 隐私说明

- 本扩展不接入任何第三方 AI API。
- 本扩展不上传标签页数据。
- 本扩展默认只读取标签页标题、URL、域名。
- 所有分类逻辑均在浏览器本地完成。
- 可选 Gemini Nano 增强调用的是 Chrome 内置本地模型，无需密钥，不接入远程模型服务。
- 用户设置保存在 `chrome.storage.sync` 中。
- 扩展不会读取网页正文。
- 扩展不会收集分析数据。

## 权限说明

- `tabs`：读取当前窗口标签页标题和 URL。
- `tabGroups`：创建和修改 Chrome 原生标签组。
- `storage`：保存用户设置和规则。
- `sidePanel`：提供侧边栏界面。
- `activeTab`：支持当前标签页相关交互。

## 已知限制

- 无法修改 Chrome 原生标签栏 UI。
- 只能通过 Chrome 原生 Tab Groups 实现分组体验。
- Chrome 内部页面无法整理。
- 本地分类无法像大型语言模型一样理解复杂语义。
- Service Worker 不是常驻后台。
- 当标签页标题过短或 URL 信息不足时，分类可能不准确。
- Chrome 内置 Gemini Nano 增强取决于 Chrome 版本、系统环境、地区、硬件和模型下载状态。

## 后续可扩展方向

- 更丰富词表
- 用户可编辑内置分类
- 本地嵌入模型
- WebAssembly 本地 NLP
- 更复杂聚类算法
