# JSON.cn 功能总览与使用手册
_更新：2025-09-19_

> 目标：全面梳理 JSON.cn（Json中文网）的功能结构、用法、参数与注意事项，便于团队选型、培训与日常使用。

---

## 1) 站点概览
- 定位：以 **JSON 相关工具** 为核心，同时提供**文本/网络/编码/图片**等泛开发工具集合。
- 导航结构：顶部导航含 **工具**、**教程**、**测评**、**博客**、**字典**、**AI 导航**；左/下拉分类聚合所有在线工具。
- 主题与布局：支持浅色/深色/跟随系统；多数工具支持**全屏/专注模式**以提升可读性。

---

## 2) JSON 核心能力清单
> 以下为与 JSON 直接相关的主力工具与转换/生成功能。

### 2.1 解析/格式化/校验 & 可视化
- **JSON 在线解析/格式化/校验**：树形折叠、高亮、错误提示；支持**点击键值进行编辑**、“保留转义” 开关；适合快速粘贴与本地调试。
- **JSON 视图（Viewer）**：专用查看器，便于纯浏览与结构化核对。
- **JSON 脑图（Graph/Mind Map）**：将 JSON/YAML/XML/CSV 图形化编辑、节点操作，适合复杂结构梳理与演示。
- **JSON Hero**：另一套结构化/层级浏览体验。

### 2.2 查询/方言/序列
- **JSONPath**：在 JSON 内进行提取与查询。
- **JSON5 解析验证**：支持带注释/尾随逗号等 JSON5 语法。

### 2.3 与表格/文档/消息格式互转
- **JSON ⇌ CSV/Excel**；**Excel → JSON**。
- **XML ⇌ JSON**；**JSON ⇌ YAML**；**JSON ⇌ TOML**；并提供 **JSON/YAML/XML 图形化编辑器**。
- **JSON ⇌ GET 参数**、**JSON ⇌ Postman**（请求/示例互转）。

### 2.4 与数据库/SQL/实体代码互转
- **JSON ⇌ SQL**、**SQL ⇌ JSON**、**SQL ⇌ Java 实体**、**SQL ⇌ C# 实体**、**Oracle/MySQL → Java 实体**、**字段视图**等。
- **从 JSON 生成多语言实体/类型**：Java、C#、C++ Class、Swift、Go、Rust、TypeScript、JavaScript、Kotlin、Elm、Ruby、Flow、Objective‑C、Python 类、Haskell、Pike、Crystal，以及 **JSON Schema**、**PHP 数组**。

### 2.5 质量与安全
- **JSON 在线清理**：去空值、空数组/对象、类型修正、敏感字段脱敏并生成报告。
- **JWT 加/解密（含高精度版）**。
- **Lottie 动画预览**（调试基于 JSON 的动效资源）。

---

## 3) 开发者常用工具（与 JSON 配套）
- **代码压缩/格式化**：JS/CSS/XML/SQL/Python/VBScript/Ruby/Perl/C#/Java/PHP/C 等。
- **在线运行**：支持 C/C++/Java/Go/JS/Python3/TypeScript/SQL/Swift/Rust/… 的在线执行环境（带 Demo）。
- **常用编码/标识**：URL 编解码、Base64、MD5、Unicode⇌中文、Unix 时间戳互转、UUID/GUID、驼峰⇌下划线、Markdown/TOML/YAML 在线编辑等。
- **数据库/配置辅助**：Properties → YAML、Mongo/Influx/Timescale/Prometheus/VictoriaMetrics 可视化等。

---

## 4) 图片/网络/文本/编码加密 等扩展
- **图片工具**：压缩、裁剪、格式互转（JPG/PNG/WebP/AVIF/TIFF…）、EXIF、取色、图表/图形生成等。
- **网络工具**：IP/网段计算、路由追踪、HTTP/WS 模拟、浏览器信息、短链互转、SEO/证书/Robots 检测、whois 等。
- **文本工具**：大小写/全半角/简繁体、去重/去空行/列截取/排序/统计、身份证校验/生日提取、多行↔一行、逆序等。
- **编码加密**：SHA/MD 系列、CRC、RSA/RSA2、DES/AES/3DES、SM 系列、Scrypt/Bcrypt、Base32、Gzip、Keccak、Type7、Punycode、RC4/Rabbit 等。

---

## 5) 进阶参数与专注模式（提高效率）
- **`?fullscreen`**：带该查询参数可**直达全屏模式**，适合投屏/演示/专注编辑。
- **`#data=...`**：通过 URL 哈希传入 **原始 JSON 文本**，页面读取后**自动清空**哈希内容。
- **`#url=...`**：传入可访问的 JSON 资源地址，工具会**基于本地网络**尝试拉取并渲染，同样在读取后**清空**哈希内容。
- **隐私与本地性**：由于参数放在 **`#`（Hash）段**并在本地读取后清空，减少了被搜索引擎或统计脚本抓取的风险；**刷新会丢失**参数，需从浏览器历史找回完整 URL。

> 小贴士：这种 “Hash 传参 + 本地读取” 的设计，适合与 Raycast、终端别名等进行一键跳转联动。

---

## 6) 交互与可用性细节
- **可点击键值进行编辑**：树视图中直接改动键名与值，减少来回切换。
- **保留转义**：针对 `\n` / `\t` 等转义字符保留显示。
- **主题切换**：浅色/深色/系统跟随；工具页多数提供 **全屏按钮**。
- **键入体验优化**：如在线编辑器默认聚焦左侧粘贴区，部分比对类工具提供 Demo/左右布局等。

---

## 7) 近两年重要更新（摘选）
- **2025‑08**：新增 3DES/RIPEMD160、网络带宽/硬盘分区等诸多工具；“三维数据可视化生成器”等前端可视化工具上线；文本/图片/生活类计算器持续扩充。
- **2025‑05**：批量上线 **JSON → 多语言实体生成**（Haskell/Pike/Ruby/Elm/Kotlin/Flow/JS/TS/Crystal/Rust/Go/Swift/C++/Objective‑C/Python、JSON Schema 等）；发布 **JSON 清理**；**JSON 脑图**加强对 YAML/XML/CSV 的图形化编辑与节点操作。
- **2024‑08**：为带全屏按钮的工具统一支持 **`?fullscreen`** 快捷直达；新增 **JSON5 验证解析**、前端渐变色/快捷键等。
- **2024‑07‑30**：**JSON 在线解析**增加 **`#data` / `#url`** 两个实验性参数；上线 **JSONPath**；若干工具的全屏体验/布局得到优化。

---

## 8) 快速上手（示例）
1. **本地 JSON 秒开专注视图**  
   - 复制 JSON 后访问：`https://www.json.cn/?fullscreen` → 粘贴 → 解析。  
2. **命令/脚本联动**  
   - 将 JSON 文本 Base64/URL 编码后拼入：`https://www.json.cn/#data=<encoded>`  
   - 或将测试数据发布到静态文件：`https://www.json.cn/#url=https://example.com/demo.json`  
3. **结构查询**  
   - 在 JSONPath 工具中编写查询表达式提取字段，或用脑图/Viewer 做结构核查。  
4. **模型/实体生成**  
   - 将响应样例粘到“JSON→TypeScript/Go/Java/…”，生成接口类型/实体类，配合 Linter 校验。

---

## 9) 常见问题（FAQ）
- **为什么 `{name:'json'}` 校验不过？**  
  因为 **键名与字符串值必须用双引号**（JSON 规范）；应写为 `{"name":"json"}`。  
- **刷新后参数丢失？**  
  正常：`#data` / `#url` 读取后会清空，刷新即丢失。可从浏览器历史找回完整 URL。

---

## 10) 竞品/替代（简表）
- BeJSON、JSONS.cn、SOJSON、ToolHelper 等站点也提供解析/格式化/转码/生成功能。对比点：功能覆盖面、是否支持本地 Hash 传参、实体生成矩阵、可视化编辑、在线运行/周边工具生态等。

---

### 附：快速书签
- 全屏专注：`https://www.json.cn/?fullscreen`
- 解析并注入数据（哈希段）：`https://www.json.cn/#data=...`
- 解析远程 JSON（哈希段）：`https://www.json.cn/#url=https://...`

