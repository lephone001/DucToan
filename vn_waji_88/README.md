# Đức Toàn 七屏静态页面

页面入口和配置位于 `index.html`，样式位于 `static/assets/css/index.css`，Logo 与流体光带脚本位于 `static/assets/js/`。这是纯静态页面，没有 Nunjucks 模板语法，不需要服务端渲染或构建。按要求引用 jsDelivr 的 `https://cdn.jsdelivr.net/npm/fullpage.js/dist/fullpage.min.js` 和 `https://cdn.jsdelivr.net/npm/fullpage.js/dist/fullpage.min.css`。图片和碎块精灵统一使用 `./static/assets/` 相对路径；将 `index.html` 与 `static` 文件夹一起移动即可。

## 本地查看

可以直接双击 `index.html` 打开，联网时加载 fullpage.js CDN。也可以在项目根目录运行可选的静态预览服务：

```powershell
node app/view/template/vn_waji_88/preview.cjs
```

打开 <http://127.0.0.1:7088>。端口可通过 `DUC_TOAN_PREVIEW_PORT` 环境变量修改。该预览服务仅监听本机，使用 Node 内置模块直接发送静态文件，不依赖数据库或模板引擎。

## 页面和交互

1. 暗色城市大图背景，90×90px Logo 与两行越南语品牌文字；移植 `vn_waji_4/common_header.html` 的红蓝金粒子聚合和金边扫光特效。
2. 新提供的照片墙与透明地面碎石图分层拼接，碎石两侧通过 CSS 遮罩淡出。纯 Canvas 龙卷风的底部对齐碎石堆，外围大光晕透明度减半。透明混凝土石块图集按 4×3 裁切绘制为 12 种碎块，电脑端 54 块、手机端 24 块，旋转上升；不加载静态龙卷风图片。电脑端另有 84 条不规则支线、128 个絮状光团和 12 条柔光伴随线，手机端分别为 36、48 和 6。
3. 破旧大楼、左侧缩小竖排的七步流程、右侧能量球；汇聚粒子具有长短、粗细及亮点大小不一的渐隐拖尾。复用 `app/public/demos/pixi-neon-ribbons.html` 的 PixiJS 8.22.0 红蓝流体光带着色器，两条光带汇聚到球心的 Logo，替换演示中的闪电按钮；点击 Logo 可开关光带。
4. 现代城市夜景，桌面使用本次提供的原图，手机竖屏加载独立 9:16 竖版图，横屏使用横图。红蓝能量雨点垂直下落，到底部平滑淡出；底部为服务地区。
5. 六张施工示意图，桌面 3×2，手机两列，较矮手机使用三列。外圈光环持续旋转，五段上下起伏的能量波浪按蛇形路线连接全部圆图；连接不同颜色时，两半分别对应起点、终点圆环颜色。另有沿线流动的亮点。手机图片缩小约 22%，文字保持独立尺寸。
6. 厂房背景与四项优势，桌面和手机均为 2×2，小屏缩小间距。
7. 咨询入口、桌面四列页脚和返回顶部。手机及矮横屏页脚通过三个可用键盘操作的标签切换服务、区域和信息。

电脑和手机均使用 fullpage.js 的整屏滚动，切换时长 850ms，七点导航、下一屏与返回顶部统一调用 `moveTo()`。手机支持上下滑动翻屏，`touchSensitivity: 8`；取消宽度和高度断点自动停用，横屏仍保持 fullpage 效果。初始化时为各屏创建 `.fullpage-section` 外层，各屏固定为当前视口高度，`scrollOverflow: false`，滚轮与手势直接切换整屏，不生成屏内滚动容器。响应式布局压缩间距，并按剩余高度调整六张圆图尺寸；极矮屏幕对内容整体缩放以保留完整文字。减少动态效果模式关闭装饰动画，并将翻屏时长设为 0ms，即时切换，避免动态更换滚动模式时的库内部冲突。右侧导航通过 fullPage 回调及 IntersectionObserver 更新，可通过 Tab 访问。打开咨询弹窗时暂停全屏滚轮与键盘控制，关闭后恢复。CDN 未加载时保留原生锚点跳转。

fullpage.js 授权密钥填写在 `index.html` 内 `id="site-config"` 的 JSON 中的 `fullpageLicenseKey` 字段；当前留空，保留库原有的署名与授权提示。密钥及使用条件参考 [fullPage 官方说明](https://alvarotrigo.com/fullPage/docs/#licensekey)。

第二至五屏 Canvas 动画使用一个共享 RAF，至多绘制一屏；屏幕不可见、页面进入后台或咨询弹窗打开时暂停。首屏 Logo 复用 `static/assets/js/logo-particles.js`，5000 个聚合粒子、1000 个底层粒子与金边扫光循环，滚出视口或进入后台时暂停，减少动态效果模式显示静态 Logo。脚本内包含同一 Logo 的 PNG 像素采样副本，兼容直接双击打开；可见图片继续使用相对路径。ResizeObserver 负责调整画布，DPR 桌面上限 1.5，手机 1（Logo 特效上限 1.5）。减少动态效果偏好下保留静态特效与全部内容。

第三屏的 `static/assets/js/process-ribbons.js` 在进入该屏后才从 jsDelivr 加载演示所用的 `pixi.js@8.22.0`。光带参数统一为速度 0.82、波浪幅度 81px、宽度 68px、发光强度 1.35，电脑和手机相同。Pixi 使用已有 RAF 手动渲染，分辨率 1、最多每秒渲染 30 次，不启动独立 ticker。手机默认启用；两条静态 SVG 光带已移除，无 WebGL 或 CDN 加载失败时保留原有汇聚拖尾与 Logo。减少动态效果时显示静态能量球与 Logo。Logo、粒子和光带使用相同的球心定位。演示源文件保持原样。

此前的光带检查记录见 `screenshots/process-ribbons-check.json`：桌面 HTTP 和手机 `file://` 下 WebGL 渲染正常；验证 Logo 开关、离屏暂停、弹窗暂停、减少动态效果、窗口调整及 CDN 失效处理。原截图为 `screenshots/process-pixi-1440.png` 和 `process-pixi-390.png`，参数以当前脚本为准。

## 需要配置的内容

编辑 `index.html` 内 `id="site-config"` 的 JSON 中的 `phone`、`zaloUrl`、`email`、`address`，页面会显示对应有效渠道。流程和优势文字也读取该内嵌 JSON，品牌默认网站地址来自 `domain` 字段。标题与描述直接编辑 HTML 的 `title` 和 `meta`。无需请求外部 JSON，支持 `file://` 直接打开；`static/assets/content.vi.json` 仅保留为素材包的文案参考。

当前咨询表单仅在浏览器中填写并下载 `.txt`，不保存或发送到服务器，界面明确说明。后续需要单独接入实际咨询接口，不能将下载视为提交成功。

原设计包图片是 AI 设计示意，页面已标注；请以自有施工图替换后再作为真实工程案例展示。当前第二屏使用最新提供的照片墙原图、透明地面碎石图与混凝土石块图集，PNG 内容保持不变，使用 HTML/CSS 分层和渐隐拼接。旧的 36 张照片墙裁剪素材保留在 `photo_wall/`，来源映射保留在 `photo_wall/sources.json`，当前页面不再铺设这 36 张图片。

## 资源引用清单

| 页面位置 | 本地资源（相对 `static/assets/`） |
| --- | --- |
| 首屏 / 悬浮品牌 / 页脚 | `brand/logo-original.png` |
| 首屏城市背景 / Logo 特效 | `backgrounds/screen04-old-new-city.webp`、`js/logo-particles.js` |
| 七点导航 | `fx/concrete-cursor.png` |
| 动态混凝土碎块 | `fx/concrete-debris-atlas.png`，原图 1448×1086，12 格透明图集 |
| 第二屏照片墙与地面 | `backgrounds/screen02-gallery-wall.png`（1536×864）、`screen02-ground-rubble.png`（1672×941 透明图），均为最新附件原图 |
| 龙卷风 | Canvas 绘制，`.vortex-stage` 仅负责动画定位；不加载 `fx/tornado.png` |
| 流程背景 | `backgrounds/screen03-building.webp`、`screen03-building-small.webp` |
| 能量球静态层 | `fx/orb.png` |
| 第三屏红蓝流体光带 | `js/process-ribbons.js`；PixiJS 8.22.0 CDN 按需加载 |
| 第四屏城市背景 | `backgrounds/screen04-modern-city.png`（用户原图）、`screen04-modern-city-mobile.png`（竖版） |
| 六张圆图 | `photos/01-concrete-breaking.webp`、`02-warehouse-demolition.webp`、`03-core-drilling.webp`、`04-floor-cutting.webp`、`05-foundation-breaking.webp`、`06-site-handover.webp` |
| 图集 / 优势背景 | `backgrounds/screen06-factory.webp`、`screen06-factory-small.webp` |
| 页脚纹理 | `backgrounds/screen07-concrete.webp` |
| 文案和联系配置 | `index.html` 中的 `#site-config` 内嵌 JSON；`content.vi.json` 仅保留参考 |

`screenshots/` 用于存放本地浏览器检查的截图。

## 验证记录（2026-10-26）

- Chrome 实测 390 / 768 / 1440 / 1920 宽度，逐屏检查共 28 项：无横向溢出、正文越界或当前导航错误，控制台和资源请求无错误。
- 52 个引用的本地图片路径存在，静态 HTML、内联 JavaScript 与 JSON 检查通过。
- 桌面与手机验证咨询弹窗、Escape 关闭、下载文件及其 UTF-8 内容、返回顶部、键盘导航和焦点移动、窗口调整、减少动态效果模式。
- 检查动态画布持续变化、模拟页面隐藏事件后停止、恢复可见后继续；打开弹窗暂停动画，关闭后恢复。
- 使用项目已有 axe-core 检查桌面与手机的 WCAG 2 A / AA 和 WCAG 2.1 AA 规则，无检测到的违规；无 JavaScript 时七步流程与六张图片仍存在。
- 截图为 `screenshots/1440-01.png` 至 `1440-07.png`、`390-01.png` 至 `390-07.png`，另附弹窗截图；机器检查结果保留在 `browser-check.json` 和 `motion-check.json`。

尚未连接咨询提交接口；未使用真实手机硬件进行性能测试，未发布公网。

接入 fullpage.js 后补测：1440 / 768 / 390 宽度的初始化、滚轮及方向键翻屏、七点跳转、弹窗下载与关闭、返回顶部、窗口切换、减少动态效果和 CDN 失效降级均通过。该记录为此前版本；当前已改为内容适配视口，取消屏内滚动。结果见 `screenshots/fullpage-check.json`。当前空授权密钥会产生库自带的两条授权提示，已单独记录。

改为静态页面后，实测桌面与手机宽度下直接 `file://` 打开，以及 HTTP 根目录和子目录访问：fullpage.js 正常初始化、七屏可跳转、显示的图片均正常加载。检查结果见 `screenshots/static-check.json`。

## 第四屏背景与整屏适配（2026-10-26）

桌面原图 `static/assets/backgrounds/screen04-modern-city.png` 为用户附件原始 PNG，1672×941；手机图 `static/assets/backgrounds/screen04-modern-city-mobile.png` 为 imagegen 内置工具生成的 941×1672 竖屏适配版本。两者均在项目内，页面使用相对路径。

竖版图最终提示词：

> Edit target: supplied city photograph. Create a portrait 9:16 mobile website background adaptation of this exact city scene. Preserve the modern apartment towers framing both sides, central boulevard receding into the skyline, recognizable skyscrapers, blue dusk sky and warm golden street lighting. Recompose framing for portrait without squeezing buildings or stretching the road. Realistic architectural photograph. Maintain upper sky breathing room for website title and lower road detail. No text, no logos, no decorative graphic overlays. Save the resulting image file and return its path.

本次 Chrome 检查覆盖 1920×1080 至 320×568，以及 844×390、667×375 横屏，共 12 种尺寸、84 个屏幕布局：内容无越界，没有生成 `.fp-overflow` 屏内滚动容器，本地背景均加载成功。验证滚轮、键盘、导航、手机滑动、页脚标签与键盘切换、咨询弹窗、返回顶部、窗口横竖切换、减少动态效果及 fullPage CDN 失效降级。HTTP 与 `file://` 下的手机模拟滑动均可翻至下一屏。

结果保存在 `screenshots/viewport-fit-check.json`、`viewport-interaction-check.json`；新截图为 `city-background-desktop.png`、`city-background-mobile.png`、`contact-landscape-fit.png`。未使用真实手机硬件测试。

## 波浪连线、背景拼接与亮度调整

第五屏通过共享 Canvas 动画连接六个外圈，初始化与窗口改变后重新计算圆心和连线；不同颜色在线条中间 40% 的区域平滑渐变，流动亮点的光晕同步过渡，两端保持各自圆环颜色。手机圆图尺寸在可用尺寸基础上乘以 0.78。首屏品牌保持红、蓝各自色相和 22 秒渐变周期，提高渐变亮度范围与光晕强度，明暗变化更明显。

第二屏的龙卷风底部根据地面 PNG 的实际显示位置计算，对齐图中 `(53%, 79%)` 的碎石区域；背景大光晕的两项 Canvas 透明度系数从 0.22 / 0.32 改为 0.11 / 0.16，CSS 环境光同步减半。地面图片及容器两侧均设置透明渐隐，保持原始 alpha 通道。

`.orb` 元素目前在第三屏，按指定类名将图片容器宽高均减半，保持容器中心位置；Logo、Pixi 光带及 Canvas 汇聚点继续根据图片中心计算。验证记录为 `screenshots/gallery-vortex-check.json`，新截图为 `intro-composite-1440.png`、`intro-composite-390.png`、`gallery-energy-1440.png`、`gallery-energy-390.png`。
