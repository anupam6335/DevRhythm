/* =====================================================================
   DASHBOARD SPECIFICATION & ASCII WIREFRAMES
   – Light/Dark mode, production animations, strict 3‑breakpoint layout
   – Colors driven by CSS custom properties (see variables.css)
   ===================================================================== */

/* ---------------------------  COLOUR SYSTEM  ------------------------ */
/* Light theme (default) : class "light" on <body>                     */
/* Dark theme            : class "dark"  on <body>                     */
/* Every background, text, border uses variables:                       */
/*   --bg-app, --bg-surface, --bg-elevated, --text-primary,             */
/*   --text-secondary, --text-muted, --border, --accent-moss, etc.      */
/* Heatmap cells: --heat-0 (empty), --heat-1, --heat-2, --heat-3,       */
/*   --heat-4 (most intense). */
/* ------------------------------------------------------------------ */


/* ------------------------  ANIMATIONS (CSS only)  ------------------ */
/* 1. Dashboard container : fadeInUp (opacity 0→1, transform Y 8px→0)  */
/*    animation: fadeInUp 0.4s ease-out both;                          */
/*    Stagger child cards with animation-delay: 0.05s each.            */
/* 2. Heatmap cells       : hover → transform: scale(1.15);           */
/*    transition: transform 0.15s ease, box-shadow 0.15s ease;        */
/* 3. Goal progress bars  : width transition 0.4s ease-out;           */
/* 4. Line chart (SVG)    : stroke-dasharray + stroke-dashoffset      */
/*    animation 1s ease-in-out (draw effect).                         */
/* 5. Daily Challenge     : subtle pulse on button (keyframe pulse)   */
/*    @keyframes pulse { 0% {box-shadow:0 0 0 0 rgba(var(--accent-moss-rgb),0.4)} 70% {box-shadow:0 0 0 6px rgba(var(--accent-moss-rgb),0)} 100% {box-shadow:0 0 0 0 rgba(var(--accent-moss-rgb),0)} } */
/* 6. Revision items      : hover → translateX(4px); transition: transform 0.2s ease; */
/* ------------------------------------------------------------------ */


/* ---------------------  DESKTOP (940px)  ---------------------------  */
/* Container: max-width 940px; margin: 0 auto; display: grid;          */
/* grid-template-columns: repeat(12, 1fr); gap: 16px;                  */
/* Each card: background var(--bg-surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 20px; box-shadow: 0 2px 8px var(--shadow); */
/* "View All" link: always top‑right, font-size 0.875rem, color var(--text-secondary), hover var(--accent-moss). */

+---------------------------------------------------------------------------+
| [ HERO SUMMARY ]                                      grid-column: 1 / -1 |
| ┌─────────────────────────────────────────────────────────────────────────┐ |
| │ Total Solved   Current Streak   Mastery Rate   Longest Streak           │ |
| │   4,578           5 days           100%             5 days               │ |
| │                                                                         │ |
| │ Daily Goal                              Weekly Goal                     │ |
| │ ██████████████░░░░ 67% (2/3)            ██████████████░░░ 60% (9/15)    │ |
| │ (bar bg --bg-elevated, fill --accent-moss, radius 4px, height 8px)     │ |
| │                                                                         │ |
| │                                                                         │ |
| │ [ View All → ]  (top‑right corner, same line as title)                  │ |
| └─────────────────────────────────────────────────────────────────────────┘ |

+---------------------------------------------------------------------------+
| [ PRODUCTIVITY HEATMAP ]            | [ WEEKLY STUDY TIME ]               |
| grid-column: 1 / 9                  | grid-column: 9 / -1                 |
| ┌───────────────────────────────────┐ ┌─────────────────────┐             |
| │ April 2026                        │ │ 245 min             │             |
| │ (3‑row grid of 30‑31 squares,     │ │ this week           │             |
| │  each 18x18px, gap 2px,           │ │                     │             |
| │  background var(--heat-*))        │ │ Active days: 1.9%   │             |
| │ Mon Tue ... 23 24 25 26 27 ...   │ │ Consistency score: 0│             |
| │ · · · · · · · · ▓▓▓ ▓▓ ▓▓▓ ▓ ░ · │ │                     │             |
| │                                   │ │ [ View All → ]     │             |
| │ [ View All → ]                    │ └─────────────────────┘             |
| └───────────────────────────────────┘                                     |
+---------------------------------------------------------------------------+
| [ GOALS PROGRESS GRAPH ]            | [ UPCOMING REVISIONS ]              |
| grid-column: 1 / 8                  | grid-column: 8 / -1                 |
| ┌───────────────────────────────────┐ ┌─────────────────────┐             |
| │ Line chart (canvas/SVG)           │ │ ▸ Two Sum (Easy)    │             |
| │  Nov'25─Apr'26                    │ │   LeetCode | May 1  │             |
| │  --- comparison avg               │ │                     │             |
| │                                   │ │ ▸ Binary Tree In..  │             |
| │ [ View All → ]                    │ │   LeetCode | May 2  │             |
| │                                   │ │                     │             |
| │                                   │ │ [ View All → ]     │             |
| └───────────────────────────────────┘ └─────────────────────┘             |
+---------------------------------------------------------------------------+
| [ ACTIVE GOALS ]                    | [ DAILY CHALLENGE ]                 |
| grid-column: 1 / 8                  | grid-column: 8 / -1                 |
| ┌───────────────────────────────────┐ ┌─────────────────────┐             |
| │ ● "15 Apr – 15 May" (60%) 3/5    │ │ Maximum Score From  │             |
| │   ██████████░░░░                   │ │ Grid Operations    │             |
| │ ● "01 May – 31 May" (10%) 1/10   │ │ (Hard) · LeetCode   │             |
| │   ██░░░░░░░░░░                      │ │ [ Solve Now ]      │             |
| │ ● "20 Apr – 10 May" (67%) 2/3    │ │                     │             |
| │   ████████████░                     │ │ [ View All → ]     │             |
| │                                   │ └─────────────────────┘             |
| │ [ View All → ]                    │                                     |
| └───────────────────────────────────┘                                     |
+---------------------------------------------------------------------------+
| [ PENDING REVISIONS TODAY ]         | [ RECENT ACTIVITY ]                 |
| grid-column: 1 / 6                  | grid-column: 6 / -1                 |
| ┌───────────────────────────────────┐ ┌─────────────────────┐             |
| │ ⚡ Rotting Oranges (Medium)       │ │ ✓ 3Sum (Medium)     │             |
| │   LeetCode · Today                │ │   Apr 27, 7:24 AM   │             |
| │   [ Revise now ]                  │ │                     │             |
| │                                   │ │ ↻ Rotting Oranges   │             |
| │ ⚡ 3Sum (Medium)                   │ │   Apr 23, 10:30 AM │             |
| │   LeetCode · Today                │ │                     │             |
| │   [ Revise now ]                  │ │ ✓ Binary Tree In..  │             |
| │                                   │ │   Apr 22, 9:15 AM   │             |
| │ [ View All → ]                    │ │                     │             |
| │                                   │ │ [ View All → ]     │             |
| └───────────────────────────────────┘ └─────────────────────┘             |
+---------------------------------------------------------------------------+
| [ THE PATH OF SOLVED ]                              grid-column: 1 / -1  |
| ┌─────────────────────────────────────────────────────────────────────────┐ |
| │ The path of solved                                   [ View All → ]    │ |
| │ ─────────────────────────────────────────────────────────────────────── │ |
| │ ╰─ 3Sum                        Solved     Medium · pattern             │ |
| │   #tag1 #tag2  ⏱ 1h  👣 2 att  ↻ 0 rev  ↻ 4d                          │ |
| │ ╰─ Binary Tree Inorder Traversal Solved    Easy · pattern              │ |
| │   #tag1 #tag2  ⏱ 1h  👣 0 att  ↻ 1 rev  ↻ 23 Apr                      │ |
| │ ╰─ Two Sum                     Solved     Easy · pattern               │ |
| │   #tag1 #tag2  ⏱ 45m  👣 3 att  ↻ 2 rev  ↻ 10 Apr                     │ |
| └─────────────────────────────────────────────────────────────────────────┘ |
+---------------------------------------------------------------------------+
| [ WEAKEST PATTERN INSIGHT ]                          grid-column: 1 / -1  |
| ┌─────────────────────────────────────────────────────────────────────────┐ |
| │ ⚬ Dynamic Programming                                                   │ |
| │   ●●●○○  Confidence · 35% Mastery · 8 solved                           │ |
| │   [ Explore resources → ]   “Your next breakthrough”                    │ |
| │ [ View All → ]                                                          │ |
| └─────────────────────────────────────────────────────────────────────────┘ |
+---------------------------------------------------------------------------+


/* ---------------------  TABLET (768px)  ----------------------------  */
/* Container: max-width 768px; padding 16px; display: grid;            */
/* grid-template-columns: repeat(8, 1fr); gap: 12px;                   */
/* Cards smaller padding (16px). Animations identical.                 */

+---------------------------------------------------------------------------+
| [ HERO SUMMARY ]                                      grid-column: 1 / -1 |
| ┌─────────────────────────────────────────────────────────────────────────┐ |
| │ 4,578 Total Solved     5 days streak     100% Mastery   5 days longest  │ |
| │ Daily Goal: ████████████░░ 67% (2/3)                                    │ |
| │ Weekly Goal: ████████████░░ 60% (9/15)                                  │ |
| │ [ View All → ]                                                          │ |
| └─────────────────────────────────────────────────────────────────────────┘ |
+---------------------------------------------------------------------------+
| [ PRODUCTIVITY HEATMAP ]            | [ WEEKLY STUDY TIME ]               |
| grid-column: 1 / 6                  | grid-column: 6 / -1                 |
| ┌───────────────────────────────────┐ ┌─────────────────────┐             |
| │ April (3 rows, smaller squares)   │ │ 245 min             │             |
| │ squares ~14x14px, gap 2px         │ │ Active 1.9%         │             |
| │                                   │ │ Consistency 0        │             |
| │ [ View All → ]                    │ │ [ View All → ]     │             |
| └───────────────────────────────────┘ └─────────────────────┘             |
+---------------------------------------------------------------------------+
| [ GOALS PROGRESS GRAPH ]            | [ UPCOMING REVISIONS ]              |
| grid-column: 1 / 5                  | grid-column: 5 / -1                 |
| ┌───────────────────────────────────┐ ┌─────────────────────┐             |
| │ Line chart (compact)              │ │ ▸ Two Sum (Easy)    │             |
| │                                   │ │   May 1             │             |
| │ [ View All → ]                    │ │ ▸ Binary Tree In..  │             |
| │                                   │ │   May 2             │             |
| │                                   │ │ [ View All → ]     │             |
| └───────────────────────────────────┘ └─────────────────────┘             |
+---------------------------------------------------------------------------+
| [ ACTIVE GOALS ]                    | [ DAILY CHALLENGE ]                 |
| grid-column: 1 / 5                  | grid-column: 5 / -1                 |
| ┌───────────────────────────────────┐ ┌─────────────────────┐             |
| │ ● 15 Apr–15 May (60%) 3/5        │ │ Maximum Score From  │             |
| │ ● 01 May–31 May (10%) 1/10      │ │ Grid Operations    │             |
| │ ● 20 Apr–10 May (67%) 2/3       │ │ (Hard) · LeetCode   │             |
| │                                   │ │ [ Solve Now ]      │             |
| │ [ View All → ]                    │ │ [ View All → ]     │             |
| └───────────────────────────────────┘ └─────────────────────┘             |
+---------------------------------------------------------------------------+
| [ PENDING REVISIONS TODAY ]         | [ RECENT ACTIVITY ]                 |
| grid-column: 1 / 4                  | grid-column: 4 / -1                 |
| ┌───────────────────────────────────┐ ┌─────────────────────┐             |
| │ ⚡ Rotting Oranges (Medium)       │ │ ✓ 3Sum (Medium)     │             |
| │   Today  [ Revise now ]           │ │   Apr 27            │             |
| │ ⚡ 3Sum (Medium)                   │ │ ↻ Rotting Oranges   │             |
| │   Today  [ Revise now ]           │ │   Apr 23            │             |
| │ [ View All → ]                    │ │ ✓ Binary Tree In..  │             |
| │                                   │ │   Apr 22            │             |
| │                                   │ │ [ View All → ]     │             |
| └───────────────────────────────────┘ └─────────────────────┘             |
+---------------------------------------------------------------------------+
| [ THE PATH OF SOLVED ]                              grid-column: 1 / -1  |
| ┌─────────────────────────────────────────────────────────────────────────┐ |
| │ The path of solved                                   [ View All → ]    │ |
| │ ╰─ 3Sum                            Solved · Medium                     │ |
| │ ╰─ Binary Tree Inorder Traversal   Solved · Easy                       │ |
| │ ╰─ Two Sum                         Solved · Easy                       │ |
| └─────────────────────────────────────────────────────────────────────────┘ |
+---------------------------------------------------------------------------+
| [ WEAKEST PATTERN INSIGHT ]                          grid-column: 1 / -1  |
| ┌─────────────────────────────────────────────────────────────────────────┐ |
| │ ⚬ Dynamic Programming · ●●●○○ · 35% Mastery · 8 solved                │ |
| │ [ Explore resources → ]   [ View All → ]                                │ |
| └─────────────────────────────────────────────────────────────────────────┘ |
+---------------------------------------------------------------------------+


/* ---------------------  MOBILE (480px)  ----------------------------  */
/* Container: max-width 480px; padding 12px; single column layout.     */
/* Each card full width, stacked vertically, gap 12px.                */
/* Heatmap: horizontally scrollable (overflow-x: auto) inside card,    */
/* squares 16x16px, gap 2px, 3 rows.                                   */

+---------------------------------------------------------------------------+
|  HERO SUMMARY                                                             |
| ┌─────────────────────────────────────────────────────────────────────────┐ |
| │ 4,578 Total Solved    5 days streak   100% Mastery   5 days longest     │ |
| │ Daily Goal: ████████████░░ 67% (2/3)                                    │ |
| │ Weekly Goal: ████████████░░ 60% (9/15)                                  │ |
| │ [ View All → ]                                                          │ |
| └─────────────────────────────────────────────────────────────────────────┘ |
+---------------------------------------------------------------------------+
|  PRODUCTIVITY HEATMAP                                                      |
| ┌─────────────────────────────────────────────────────────────────────────┐ |
| │ April 2026                                                              │ |
| │ ← horizontally scrollable 3‑row heatmap →                               │ |
| │ [ View All → ]                                                          │ |
| └─────────────────────────────────────────────────────────────────────────┘ |
+---------------------------------------------------------------------------+
|  WEEKLY STUDY TIME                                                         |
| ┌─────────────────────────────────────────────────────────────────────────┐ |
| │ 245 min this week · Active days 1.9% · Consistency 0                    │ |
| │ [ View All → ]                                                          │ |
| └─────────────────────────────────────────────────────────────────────────┘ |
+---------------------------------------------------------------------------+
|  GOALS PROGRESS GRAPH                                                      |
| ┌─────────────────────────────────────────────────────────────────────────┐ |
| │ Line chart (compact) Nov'25‑Apr'26                                      │ |
| │ [ View All → ]                                                          │ |
| └─────────────────────────────────────────────────────────────────────────┘ |
+---------------------------------------------------------------------------+
|  UPCOMING REVISIONS                                                        |
| ┌─────────────────────────────────────────────────────────────────────────┐ |
| │ ▸ Two Sum (Easy) · May 1                                                │ |
| │ ▸ Binary Tree Inorder Traversal (Easy) · May 2                          │ |
| │ [ View All → ]                                                          │ |
| └─────────────────────────────────────────────────────────────────────────┘ |
+---------------------------------------------------------------------------+
|  ACTIVE GOALS                                                              |
| ┌─────────────────────────────────────────────────────────────────────────┐ |
| │ ● "15 Apr – 15 May" 60% (3/5)                                           │ |
| │ ● "01 May – 31 May" 10% (1/10)                                          │ |
| │ ● "20 Apr – 10 May" 67% (2/3)                                           │ |
| │ [ View All → ]                                                          │ |
| └─────────────────────────────────────────────────────────────────────────┘ |
+---------------------------------------------------------------------------+
|  DAILY CHALLENGE                                                           |
| ┌─────────────────────────────────────────────────────────────────────────┐ |
| │ Maximum Score From Grid Operations (Hard) · LeetCode                    │ |
| │ [ Solve Now ]   [ View All → ]                                          │ |
| └─────────────────────────────────────────────────────────────────────────┘ |
+---------------------------------------------------------------------------+
|  PENDING REVISIONS TODAY                                                   |
| ┌─────────────────────────────────────────────────────────────────────────┐ |
| │ ⚡ Rotting Oranges (Medium) · Today  [ Revise now ]                      │ |
| │ ⚡ 3Sum (Medium) · Today  [ Revise now ]                                 │ |
| │ [ View All → ]                                                          │ |
| └─────────────────────────────────────────────────────────────────────────┘ |
+---------------------------------------------------------------------------+
|  RECENT ACTIVITY                                                           |
| ┌─────────────────────────────────────────────────────────────────────────┐ |
| │ ✓ 3Sum (Medium) · Apr 27                                                │ |
| │ ↻ Rotting Oranges · Apr 23                                              │ |
| │ ✓ Binary Tree Inorder Traversal · Apr 22                                │ |
| │ [ View All → ]                                                          │ |
| └─────────────────────────────────────────────────────────────────────────┘ |
+---------------------------------------------------------------------------+
|  THE PATH OF SOLVED                                                        |
| ┌─────────────────────────────────────────────────────────────────────────┐ |
| │ The path of solved                               [ View All → ]         │ |
| │ ╰─ 3Sum                            Solved · Medium                      │ |
| │ ╰─ Binary Tree Inorder Traversal   Solved · Easy                        │ |
| │ ╰─ Two Sum                         Solved · Easy                        │ |
| └─────────────────────────────────────────────────────────────────────────┘ |
+---------------------------------------------------------------------------+
|  WEAKEST PATTERN INSIGHT                                                   |
| ┌─────────────────────────────────────────────────────────────────────────┐ |
| │ ⚬ Dynamic Programming · ●●●○○ · 35% Mastery · 8 solved                 │ |
| │ [ Explore resources → ]   [ View All → ]                                │ |
| └─────────────────────────────────────────────────────────────────────────┘ |
+---------------------------------------------------------------------------+