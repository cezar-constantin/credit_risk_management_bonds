# Bond Credit Risk Case Lab

**UZH Executive Education Finance · Cezar Chirila**

**▶ Open the dashboard / 打开应用: https://cezar-constantin.github.io/credit_risk_management_bonds/**
· [Focus view / 专注视图](https://cezar-constantin.github.io/credit_risk_management_bonds/focus.html)
· [Module description / 模块说明](https://cezar-constantin.github.io/credit_risk_management_bonds/description.html)

[English](#english) · [中文](#中文)

> **Disclaimer.** Educational use only. This application supports a University of Zurich Executive Education class. All issuers, positions, prices, spreads, financial statements, dates and scenarios are fictional teaching assumptions; simplified formulas are used for teaching, not for valuation, accounting or regulatory reporting. Nothing here is investment, accounting, legal or regulatory advice, and nothing represents the policies, data or views of ICBC or any other institution. Verify any figure against primary sources before use.
>
> **免责声明。** 仅供教学使用。本应用为苏黎世大学高管教育课程配套工具。所有发行人、头寸、价格、利差、财务报表、日期和情景均为虚构的教学假设；所用公式为教学简化，不适用于估值、会计或监管报告。本应用不构成投资、会计、法律或监管建议，也不代表中国工商银行或任何其他机构的政策、数据或观点。使用前请以原始资料核实任何数字。

---

## English

### What it is

An interactive companion to the class **Credit Risk Management in Bond Investment** (UZH Executive Education, ICBC senior managers and experts, 30 October 2026, 10:00–12:30, consecutive interpretation). The whole class use case runs in it, and participants can reuse it afterwards.

The class is built around one question:

> **What can cause a bond investment to lose money even when the issuer continues paying?**

The app follows one fictional position through four dated stops, computing every number live, and ends by answering that question. The position is a 3.60% RMB 100 m senior unsecured MTN of *Huaxing Development Co., Ltd.* (a fictional composite), bought at issue on 15 March 2025.

| Stop | Date | What happens |
|---|---|---|
| 1 | Sep 2025 | Market repricing, no issuer news |
| 2 | Mar 2026 | One coupon received; spread 450 bp; price 95.07; first decision |
| 3 | Dec 2025 → Jun 2026 | Deterioration while every coupon is paid; counterfactuals A (support) and B (extension) |
| 4 | Jun 2026 | The decision: executable proceeds vs probability-weighted holding value |

Fifteen tabs: Home · Position · Mechanisms · Repricing lab · Spread anatomy · Ratings · Timeline · Structure · Portfolio · Recognition · Capital · Controls · Decision · The answer · Glossary. See [`app/description.html`](app/description.html) for each module's purpose, inputs and outputs, and [`docs/slide-to-module-map.md`](docs/slide-to-module-map.md) for where each class slide lives in the app.

### Open it online

The app is published on GitHub Pages at **https://cezar-constantin.github.io/credit_risk_management_bonds/**. It works on any laptop or tablet browser, and participants can use it straight away. Every push to `main` redeploys it.

### Class questions (v3)

Every teaching screen ends with its **Choose one** questions from the class question bank. Copy `question_bank.json` unchanged to `data/questions.json`, then run `npm run build`. Participants tap an answer and reveal it. The instructor enters hand counts and reveals with → . Engine questions show the figure the engine computed, together with its workings. The Answer screen shows the participant's score and prints the question sheet or, in instructor mode, the answer key. **Guided** mode (default for participants) keeps each screen to one table plus its questions; **Full** shows everything. `npm run question-shots` checks that every question is reachable on its screen and saves screenshots to `docs/questions/`.

### Two views: standard and focus

The app comes as two files with identical content, numbers and features. Both share progress in the same browser, and the header button switches between them.

- `app/index.html`: the **standard view**.
- `app/focus.html`: the **focus view**, with a lower visual load. It uses the same palette but only three font sizes (13 / 15 / 22 px; 18 / 22 / 32 px in presenter view), one quiet strip of tiles, one underlined row of tabs, and cards separated by space instead of borders. Colour is kept for actions and alarms only. `tests/e2e/font-audit.mjs` checks the three-size rule on every tab, in both languages and both layouts.

### Run it offline (instructor laptop)

`app/index.html` is one self-contained file: all code, styles, data and both languages are inlined. It makes no network calls and loads no external fonts or scripts.

1. Download the repository (or just `app/index.html`).
2. Double-click `app/index.html`. It opens from `file://` in any current Chrome, Edge, Firefox or Safari. No internet and no installation needed.

### Run the class from the app (instructor)

1. **Before class:** open the app and choose **Instructor** (top right). Press **P** for the presenter layout (large type, high contrast, built for 1920×1080 projection). Choose the language, English or 简体中文. You can switch at any time without losing state.
2. **Preset:** keep **Class defaults**. It locks the position and reproduces every figure in the deck. **1 Position → Tie-out to the class deck** shows all of them with ✓.
3. **Timer:** the header shows the current 10:00–12:30 block and the minutes left. For a rehearsal, **Rehearse** shifts the clock so that now reads 10:00.
4. **Navigation:** use **Jump to stop** (left panel) for Stops 1–4, or the tabs in order.
5. **Reveals:** **→** reveals the next item on the current tab (poll verdicts, timeline facts, model answers). **R** resets that tab's reveals. **P** toggles the presenter layout.
6. **Polls:** no participant devices are needed. Count hands and enter the numbers in the tally boxes (Home poll, three-shock exercise, “thesis still stands?” votes).
7. **Decision (Stop 4):** fill in the decision form with the room, print it or export JSON, then replay it against counterfactual A and B.

### Use it afterwards (participant)

Choose **Participant**. Work through the tabs at your own pace. Hints and **Check my answer** reveals appear on the exercise screens. Your progress, answers and decision are saved in your browser only (`localStorage`); nothing is sent anywhere. Use **Free play** to change the position and every input, and **Reset to class values** to return to the deck.

### Deploy

- **GitHub Pages:** `.github/workflows/ci.yml` runs the tests, the i18n parity check and the build, then deploys `app/` to Pages on every push to `main` (live at https://cezar-constantin.github.io/credit_risk_management_bonds/). Pages → Source is set to **GitHub Actions**.
- **Portfolio path:** copy `app/index.html` and `app/description.html` to `cezar-chirila.com/risk-intelligence/bond-credit-risk-case-lab/app/`. No server-side code is needed.

### How the numbers tie to the class deck

- **Engine:** `engine/` is a pure, framework-free module (pricing, ECL, recognition, five-category classification, decision maths, capital). It uses annual coupons, bullet repayment, DCF with fractional exponents, and “dirty” value = PV of all remaining cash flows, accrued interest included. Executable bid = price at mid yield + full quoted bid–ask.
- **Acceptance tests:** `tests/engine.test.js` hard-codes every figure in the deck. Examples: T0 price 100.00, Macaulay 2.90, modified 2.80. Shocks −3.36/−3.28, −1.40/−1.38, −0.84/−0.83. Mar 2026: 99.43, 95.07, −0.57, −4.36, −1.33, −3.33, bid ≈ 94.35. Apr 2026: 100.30, 93.89, 92.91. ECL 0.60 / 3.60 / 6.00 / 5.79, charges 5.40 / 3.00. Recognition: AC 94.30, FVOCI 93.89 with OCI −0.41, FVTPL −6.41. Jun 2026: 100.89, 92.76, 91.32. Jul 2026: A 98.53, B 90.68, break-even ≈ 8%. Extension: PV cost 2.87, modification loss 0.00. Break-even PD 3.5%; sizing 0.60% vs 0.396% / 1.485%. **Any drift fails CI.**
- **On screen:** the same figures are listed in `data/case.json → tieOut` and recomputed live in the tie-out table. Every calculation has **Show workings** with its formula and inputs.
- **Rounding note:** the executable bid on 15 Mar 2026 (6.70%) computes to 94.37. The deck shows “≈ 94.35”, and the test allows ±0.05.

### Repository layout

```
app/index.html          single-file build artefact, standard view (runs from file://)
app/focus.html          same app, focus view (lower visual load, three font sizes)
app/description.html    module description page (purpose, modules, inputs, outputs, disclaimer)
src/                    UI source: shell, components, tabs, styles (tokens.css = palette)
engine/                 pricing, ECL, classification, decision maths (pure ES modules)
tests/                  acceptance and unit tests (node --test)
i18n/en.json, zh.json   every user-visible string, English and 简体中文
data/case.json          Huaxing case, presets, timeline, tie-out figures
docs/                   screenshots (both languages), slide-to-module map
scripts/                build.mjs (bundler), check-i18n.mjs (parity), screenshots.mjs
.github/workflows/      test + build + Pages deploy
```

### Develop

Requires Node ≥ 20. There are no runtime dependencies.

```bash
npm test               # acceptance + unit tests
npm run check:i18n     # EN/中文 parity (fails on any missing or untranslated key)
npm run build          # writes app/index.html
npm run screenshots    # docs/screenshots/*.png (needs Playwright + Chromium)
node tests/e2e/interactions.mjs [app/focus.html]   # browser checks: shortcuts, free play, decision form, language switch, no network
node tests/e2e/font-audit.mjs app/focus.html 3       # the focus view uses at most three font sizes
```

Accessibility: Lighthouse scores 100 on every tab (checked with Lighthouse 12). The UI is keyboard-operable (tabs use arrow keys) and meets WCAG AA contrast.

The visual identity is derived from the public website icbc.com.cn (primary red `#BC0021`, light theme). It lives in `src/styles/tokens.css`. The app uses no logo or trademark and is not an ICBC product.

---

## 中文

### 这是什么

本应用是 **债券投资中的信用风险管理** 课程的互动配套工具（苏黎世大学高管教育，面向中国工商银行高级管理人员和专家，2026年10月30日 10:00–12:30，交替传译）。整个课程案例都在应用中进行，学员课后可继续使用。

课程围绕一个问题展开：

> **即使发行人仍在按时付息，是什么导致债券投资亏损？**

应用带领学员沿四个日期节点跟踪一个虚构头寸，所有数字实时计算，最后明确回答这一问题。该头寸为 *华兴发展有限公司*（虚构的综合案例）发行的票面利率3.60%、面值1亿元的优先无担保中期票据，于2025年3月15日发行时买入。

| 节点 | 日期 | 内容 |
|---|---|---|
| 1 | 2025年9月 | 市场重新定价，发行人无新消息 |
| 2 | 2026年3月 | 收到一次票息；利差450个基点；价格95.07；第一次决策 |
| 3 | 2025年12月 → 2026年6月 | 每期票息均按时支付，但信用持续恶化；反事实情景A（支持）与B（展期） |
| 4 | 2026年6月 | 决策：可成交价格对比概率加权的持有价值 |

应用共15个标签页。各模块的目的、输入和输出见 [`app/description.html`](app/description.html)；每张课程幻灯片对应的模块见 [`docs/slide-to-module-map.md`](docs/slide-to-module-map.md)。

### 在线打开

应用发布在 GitHub Pages：**https://cezar-constantin.github.io/credit_risk_management_bonds/** ，可在任何笔记本电脑或平板浏览器中直接使用。每次推送到 `main` 都会自动重新部署。

### 两种视图：标准视图与专注视图

两个文件的内容、数字和功能完全相同，在同一浏览器中共享进度，页眉按钮可随时切换：`app/index.html` 为**标准视图**；`app/focus.html` 为**专注视图**，视觉负担更低。专注视图配色不变，全程只使用三种字号（13 / 15 / 22 像素；演示视图为 18 / 22 / 32 像素），指标卡合并为一条，标签页为单行下划线样式，以留白代替边框，红色仅用于操作与警示。

### 离线运行（讲师笔记本电脑）

`app/index.html` 是单一自包含文件，代码、样式、数据和双语文本全部内嵌。运行时不发起任何网络请求，也不加载外部字体或脚本。下载后双击即可在浏览器中打开（`file://`），无需联网或安装。

### 讲师如何用应用授课

1. 右上角选择 **讲师** 模式，按 **P** 切换投影演示布局（大字号、高对比度，适合1920×1080投影）。语言可随时在 English 与 简体中文 之间切换，状态不会丢失。
2. 预设保持 **课堂默认值**：头寸被锁定，所有数字与课件一致；**1 头寸 → 与课堂讲义核对** 逐项显示 ✓。
3. 页眉的计时器显示当前所处的 10:00–12:30 时间段及剩余分钟数；**排练** 按钮会把当前时间设为10:00。
4. 用左侧 **跳转至节点** 在四个节点之间切换。
5. 快捷键：**→** 揭示当前标签页的下一项，**R** 重置本页揭示，**P** 切换演示布局。
6. 投票无需学员设备：举手计数后，在计数框中输入人数。
7. 节点4：与学员一起填写决策表，可打印或导出 JSON，并针对情景A或B回放。

### 学员课后使用

选择 **学员** 模式，按顺序自主学习；练习页面提供提示和“核对我的答案”。进度、答案和决策仅保存在本浏览器（localStorage），不会发送到任何地方。**自由模式** 可修改头寸和全部输入，**恢复课堂数值** 可随时回到课件数值。

### 部署

- **GitHub Pages：** 推送到 `main` 后，工作流会运行测试、双语一致性检查和构建，然后部署 `app/`。需在仓库设置中把 Pages 的来源设为 GitHub Actions。
- **个人网站：** 将 `app/index.html` 与 `app/description.html` 复制到 `cezar-chirila.com/risk-intelligence/bond-credit-risk-case-lab/app/` 即可，无需服务器端代码。

### 数字如何与课件对应

`engine/` 是纯函数计算模块。`tests/engine.test.js` 写死了课件中的每一个数字，任何偏差都会导致 CI 失败。应用中 **与课堂讲义核对** 表格实时重算同样的数字，每项计算都有 **显示计算过程**。说明：2026年3月15日可成交买价（6.70%）计算结果为94.37，课件显示“≈ 94.35”，测试允许 ±0.05 的误差。

### 许可

代码采用 MIT 许可（见 `LICENSE`）。案例内容仅供教学使用。
