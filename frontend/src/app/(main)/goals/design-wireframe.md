## Goal Dashboard – Final Wireframe (Three Breakpoints)

Below are the final ASCII wireframes for **Desktop (≥940px)**, **Tablet (768–939px)**, and **Mobile (≤767px)**. They incorporate all approved elements: two KPI cards (total goals & completion rate), daily/weekly goal rings with percentage inside, line charts (monthly/yearly), planned goals with river‑style question expansion, and paginated history. The design follows the calm Wabi‑Sabi aesthetic.

---

### 1. Desktop (≥940px)

```
┌──────────────────────────────────────────────────────────────────────────────────────────────┐
│  Dashboard / Goals                                                                          │
├──────────────────────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────┐  ┌─────────────────────────┐                                   │
│  │ 📊 24                    │  │ ✅ 50%                   │                                   │
│  │ total goals              │  │ completion rate         │                                   │
│  └─────────────────────────┘  └─────────────────────────┘                                   │
├──────────────────────────────────────────────────────────────────────────────────────────────┤
│  Current Momentum                                                                            │
│  ┌───────────────────────────────────┐  ┌───────────────────────────────────┐               │
│  │  ┌───────┐                         │  │  ┌───────┐                         │               │
│  │  │  33%  │  Daily goal             │  │  │  60%  │  Weekly goal            │               │
│  │  │   ○   │  2 / 3 completed        │  │  │   ○   │  9 / 15 completed        │               │
│  │  └───────┘  1 left                  │  │  └───────┘  6 left                  │               │
│  │  Active · ends today                │  │  Active · ends Apr 27              │               │
│  └───────────────────────────────────┘  └───────────────────────────────────┘               │
├──────────────────────────────────────────────────────────────────────────────────────────────┤
│  Trends                                                                                       │
│  ┌──────────────────────────────────────────────────────┐  ┌────────────────────────────────┐│
│  │ Monthly completion (May 2025 – Apr 2026)            │  │ Yearly completion (2020–2026)  ││
│  │    4┌─────┐                                          │  │   12┌─────┐                    ││
│  │    3│     │                                          │  │   10│     │                    ││
│  │    2│     │                                          │  │    8│     │                    ││
│  │    1│     │                                          │  │    6│     │                    ││
│  │    0└─────┴───┴───┴───┴───┴───┴───┴───┴───┴───┴───┴──▶│  │    4│     │                    ││
│  │      M J J A S O N D J F M A                        │  │    2│     │                    ││
│  │   ── you (3 in Apr)   ── avg user (2.8)             │  │    0└─────┴───┴───┴───┴───┴───┴──▶││
│  └──────────────────────────────────────────────────────┘  └────────────────────────────────┘│
│  "You completed 3 goals this month – above the average of 2.8"  "You're ahead of the average"│
├──────────────────────────────────────────────────────────────────────────────────────────────┤
│  Planned goals                                                          [ + Create new goal ]│
│  ┌────────────────────────────────────────────────────────────────────────────────────────┐  │
│  │ ▼ Solve 3 questions by May 2, 2026 (active)                   33% · 2d left  [Edit] [Copy]│  │
│  │   │  ╭──────────────────────────────────────────────────────────────────────────────────╮│  │
│  │   │  │  ●   Apr 25        ╰─ Valid Parentheses (Easy)  [completed]                      ││  │
│  │   │  │      • Easy · pattern: Stack                                                     ││  │
│  │   │  │      #array #hash    ⏱ 15m · 2 att · 2 rev · 2d ago                             ││  │
│  │   │  │                                                                                  ││  │
│  │   │  │  ○   (pending)      ╰─ Binary Tree Inorder Traversal (Easy)                     ││  │
│  │   │  │      • Easy · pattern: DFS                                                       ││  │
│  │   │  │      #tree #stack   ⏱ — · — att · — rev · not started                           ││  │
│  │   │  │                                                                                  ││  │
│  │   │  │  ○   (pending)      ╰─ Merge Two Sorted Lists (Easy)                            ││  │
│  │   │  │      • Easy · pattern: Two Pointers                                              ││  │
│  │   │  │      #linkedlist    ⏱ — · — att · — rev · not started                           ││  │
│  │   │  ╰──────────────────────────────────────────────────────────────────────────────────╯│  │
│  └────────────────────────────────────────────────────────────────────────────────────────┘  │
│  ┌────────────────────────────────────────────────────────────────────────────────────────┐  │
│  │ ▶ Solve 1 question by Apr 25, 2026 (completed)                100% · ended   [Copy] [Del]│  │
│  │   (collapsed – click to expand)                                                          │  │
│  └────────────────────────────────────────────────────────────────────────────────────────┘  │
│  ┌────────────────────────────────────────────────────────────────────────────────────────┐  │
│  │ ▶ Solve 2 questions by Apr 19, 2026 (failed)                    0% · failed   [Copy] [Del]│  │
│  │   (collapsed)                                                                           │  │
│  └────────────────────────────────────────────────────────────────────────────────────────┘  │
├──────────────────────────────────────────────────────────────────────────────────────────────┤
│  History                                                              [Filter] [Sort ▼]       │
│  ┌────────────────────────────────────────────────────────────────────────────────────────┐  │
│  │ ▶ Daily goal (Apr 19, 2026) – failed                                   1/3 (33%)        │  │
│  │   (collapsed)                                                                           │  │
│  ├────────────────────────────────────────────────────────────────────────────────────────┤  │
│  │ ▶ Weekly goal (Feb 1–7, 2026) – completed                          15/15 (100%)        │  │
│  │   (collapsed)                                                                           │  │
│  ├────────────────────────────────────────────────────────────────────────────────────────┤  │
│  │ ▼ Planned goal (Apr 20–25, 2026) – completed                        1/1 (100%)         │  │
│  │   │  ╭────────────────────────────────────────────────────────────────────────────────╮│  │
│  │   │  │  ●   Apr 23        ╰─ Longest Uploaded Prefix (Medium)  [completed]            ││  │
│  │   │  │      • Medium · pattern: Greedy                                                 ││  │
│  │   │  │      #array #prefix   ⏱ 25m · 1 att · 0 rev · 3d ago                          ││  │
│  │   │  ╰────────────────────────────────────────────────────────────────────────────────╯│  │
│  └────────────────────────────────────────────────────────────────────────────────────────┘  │
│  ┌────────────────────────────────────────────────────────────────────────────────────────┐  │
│  │ [Prev]   1 / 2   [Next]                                                                  │  │
│  └────────────────────────────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

### 2. Tablet (768–939px)

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│  Dashboard / Goals                                                              │
├──────────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────┐  ┌─────────────────────────┐                       │
│  │ 📊 24                    │  │ ✅ 50%                   │                       │
│  │ total goals              │  │ completion rate         │                       │
│  └─────────────────────────┘  └─────────────────────────┘                       │
├──────────────────────────────────────────────────────────────────────────────────┤
│  Current Momentum (side‑by‑side, rings with %)                                  │
│  ┌─────────────────────────────┐  ┌─────────────────────────────┐               │
│  │  ┌───────┐  Daily goal      │  │  ┌───────┐  Weekly goal     │               │
│  │  │  33%  │  2/3, 1 left     │  │  │  60%  │  9/15, 6 left    │               │
│  │  │   ○   │  ends today      │  │  │   ○   │  ends Apr 27     │               │
│  │  └───────┘                   │  │  └───────┘                  │               │
│  └─────────────────────────────┘  └─────────────────────────────┘               │
├──────────────────────────────────────────────────────────────────────────────────┤
│  Trends (stacked)                                                                │
│  ┌────────────────────────────────────────────────────────────────────────────┐ │
│  │ Monthly completion (May 2025 – Apr 2026)                                  │ │
│  │    4┌─────┐                                                               │ │
│  │    3│     │                                                               │ │
│  │    2│     │                                                               │ │
│  │    1│     │                                                               │ │
│  │    0└─────┴───┴───┴───┴───┴───┴───┴───┴───┴───┴───┴──▶                  │ │
│  │      M J J A S O N D J F M A                                              │ │
│  │   ── you (3 in Apr)   ── avg user (2.8)                                 │ │
│  └────────────────────────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────────────────────────┐ │
│  │ Yearly completion (2020–2026)                                             │ │
│  │   12┌─────┐                                                               │ │
│  │   10│     │                                                               │ │
│  │    8│     │                                                               │ │
│  │    6│     │                                                               │ │
│  │    4│     │                                                               │ │
│  │    2│     │                                                               │ │
│  │    0└─────┴───┴───┴───┴───┴───┴───┴──▶                                    │ │
│  │     2020 2021 2022 2023 2024 2025 2026                                    │ │
│  │   ── you (12)   ── avg (9.1)                                             │ │
│  └────────────────────────────────────────────────────────────────────────────┘ │
├──────────────────────────────────────────────────────────────────────────────────┤
│  Planned goals                                              [ + Create new goal ]│
│  ┌────────────────────────────────────────────────────────────────────────────┐ │
│  │ ▼ Solve 3 questions by May 2, 2026 (active)   33% · 2d left  [Edit] [Copy]│ │
│  │   • Valid Parentheses (Easy) – completed Apr 25                            │ │
│  │   • Binary Tree Inorder (Easy) – pending                                   │ │
│  │   • Merge Two Lists (Easy) – pending                                       │ │
│  │   (compact list, no full river metrics)                                   │ │
│  └────────────────────────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────────────────────────┐ │
│  │ ▶ Solve 1 question by Apr 25, 2026 (completed)    100% · ended  [Copy][Del]│ │
│  └────────────────────────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────────────────────────┐ │
│  │ ▶ Solve 2 questions by Apr 19, 2026 (failed)      0% · failed  [Copy][Del]│ │
│  └────────────────────────────────────────────────────────────────────────────┘ │
├──────────────────────────────────────────────────────────────────────────────────┤
│  History                                              [Filter] [Sort ▼]         │
│  ┌────────────────────────────────────────────────────────────────────────────┐ │
│  │ Daily goal (Apr 19) – failed               1/3 (33%)                       │ │
│  │ Weekly goal (Feb 1–7) – completed         15/15 (100%)                    │ │
│  │ ▼ Planned goal (Apr 20–25) – completed     1/1 (100%)                     │ │
│  │   └ Longest Uploaded Prefix (Medium) – completed Apr 23                   │ │
│  └────────────────────────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────────────────────────┐ │
│  │ [Prev]   1 / 2   [Next]                                                     │ │
│  └────────────────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────────────┘
```

---

### 3. Mobile (≤767px)

```
┌─────────────────────────────────────────────────┐
│  Dashboard / Goals                              │
├─────────────────────────────────────────────────┤
│  📊 24  total goals                             │
│  ✅ 50%  completion rate                        │
├─────────────────────────────────────────────────┤
│  Current Momentum                               │
│  ┌───────────────────────────────────────────┐ │
│  │  ┌───────┐  Daily goal                    │ │
│  │  │  33%  │  2/3 completed, 1 left         │ │
│  │  │   ○   │  ends today                     │ │
│  │  └───────┘                                 │ │
│  └───────────────────────────────────────────┘ │
│  ┌───────────────────────────────────────────┐ │
│  │  ┌───────┐  Weekly goal                   │ │
│  │  │  60%  │  9/15 completed, 6 left        │ │
│  │  │   ○   │  ends Apr 27                    │ │
│  │  └───────┘                                 │ │
│  └───────────────────────────────────────────┘ │
├─────────────────────────────────────────────────┤
│  Trends (stacked, simplified)                   │
│  Monthly: line chart (last 12 months)           │
│  Yearly: line chart (2020–2026)                 │
├─────────────────────────────────────────────────┤
│  Planned goals            [ + Create new goal ] │
│  ▼ Solve 3 questions by May 2 (active) 33%     │
│    • Valid Parentheses (Easy) completed Apr 25 │
│    • Binary Tree Inorder (Easy) pending        │
│    • Merge Two Lists (Easy) pending            │
│  ▶ Solve 1 question by Apr 25 (completed) 100% │
│  ▶ Solve 2 questions by Apr 19 (failed) 0%     │
├─────────────────────────────────────────────────┤
│  History                   [Filter] [Sort]      │
│  Daily goal (Apr 19) failed: 1/3 (33%)         │
│  Weekly goal (Feb 1–7) completed: 15/15 (100%) │
│  ▼ Planned goal (Apr 20–25) completed: 1/1     │
│    └ Longest Uploaded Prefix (Medium) – Apr 23 │
│  [Prev] 1/2 [Next]                             │
└─────────────────────────────────────────────────┘
```

---

### Key Differences Between Breakpoints

| Section | Desktop | Tablet | Mobile |
|---------|---------|--------|--------|
| **Hero stats** | 2 cards side‑by‑side | 2 cards side‑by‑side | Stacked |
| **Current Momentum** | 2 cards side‑by‑side, each with ring + % inside | same, slightly narrower | Stacked vertically |
| **Trends charts** | Two columns (monthly + yearly) | Stacked vertically (monthly above yearly) | Stacked, simplified line charts |
| **Planned goals** | Full river‑style question details (node, tags, metrics) | Compact list (only question titles + status) | Very compact, only titles and status |
| **History** | Full expandable river style for completed questions | Compact expandable (only question titles) | Collapsed by default, tap to see brief details |
| **Pagination** | Centred, page numbers visible | Centred, page numbers visible | Prev/Next only, full width buttons |

All wireframes use the **exact dummy data** from the API responses. The river‑style question listing is preserved where space allows; on mobile it is simplified to save space but still shows essential information. The line charts are drawn as simplified ASCII but should be implemented with Chart.js `monotone` interpolation. This is the final approved design.