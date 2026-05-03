## Guide: Building a Responsive, Gap-Free Heatmap Layout

### 1. Core Idea to Explain

> **“The container decides how many cells fit in each row, and cells automatically expand or shrink to fill the available space. We never fix cell widths or use `space-between` because that creates uneven gaps.”**

- **Avoid `justify-content: space-between`** – It distributes extra space *between* cells, causing large gaps when the container is wider than the sum of cell widths.
- **Avoid fixed cell sizes** – They break responsiveness on different screen widths.
- **Use CSS Grid** with `repeat(n, minmax(0, 1fr))` – Each cell gets an equal share of the row’s width, with no extra space between them.
- **Only define gaps** – Use `gap: 0.5rem` (or less on mobile) to control spacing consistently.

### 2. Step‑by‑Step Implementation

Follow this order to build the heatmap from scratch:

#### Step 1 – Set up the container
```css
.heatmapContainer {
  width: 100%;
  padding: 0.75rem;
  background: var(--bg-elevated);
  border-radius: 12px;
}
```

#### Step 2 – Define the row structure (for daily month view)
- Determine the number of columns based on month length (10 or 11).
- Create CSS classes for each column count:
```css
.row--10cols { grid-template-columns: repeat(10, minmax(0, 1fr)); }
.row--11cols { grid-template-columns: repeat(11, minmax(0, 1fr)); }
```
- Use `gap: 0.5rem` to separate cells.

#### Step 3 – Build the cell
```css
.cell {
  aspect-ratio: 1 / 1;          /* square cells */
  width: 100%;                  /* fill the grid column */
  min-width: 0;                 /* allow shrinking below content */
  /* other styling (background, border-radius, etc.) */
}
```
- **`min-width: 0`** is crucial – it overrides the default `min-width: auto` that prevents grid cells from shrinking below their content.

#### Step 4 – Handle weekly/monthly periods
```css
.heatmapGrid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(70px, 1fr));
  gap: 0.5rem;
}
```
- `auto-fill` creates as many columns as fit, each at least 70px wide, then stretches to fill extra space.

#### Step 5 – Add responsive breakpoints
- On smaller screens, reduce the minimum cell size and gap:
```css
@media (max-width: 767px) {
  .row { gap: 0.25rem; }
  .heatmapGrid { grid-template-columns: repeat(auto-fill, minmax(50px, 1fr)); }
}
```

### 3. Key Principles to Emphasize

| Principle | Why it matters |
|-----------|----------------|
| **Grid over Flex** | Grid gives precise control over column sizing and alignment; flex with `space-between` is unpredictable. |
| **Use `gap` only** | Never rely on margin or `space-between` to create spacing – `gap` is uniform and doesn’t add extra space. |
| **Relative sizing (`1fr`, `minmax(0, 1fr)`)** | Cells adapt to container width, never overflow. |
| **`min-width: 0` on grid children** | Prevents cells from expanding beyond their share when content is large. |
| **No fixed dimensions** | Avoid `width: 50px` or `height: 50px` – use `aspect-ratio` to keep squares. |
| **Test on real container widths** | The layout must work when the parent width changes (e.g., sidebars, different screen sizes). |

### 4. Common Mistakes and How to Avoid Them

| Mistake | Consequence | Fix |
|---------|-------------|-----|
| Using `justify-content: space-between` on a flex row | Large, uneven gaps between cells | Replace with CSS Grid and `gap`. |
| Setting fixed `width` and `height` on cells | Cells overflow or leave empty space on smaller screens | Use `aspect-ratio: 1/1` and let grid control width. |
| Forgetting `min-width: 0` on grid items | Cells refuse to shrink below content width, causing overflow | Always add `min-width: 0` to `.cell`. |
| Using `margin` or `padding` to separate cells | Inconsistent spacing, especially on wrap | Use `gap` on the grid container. |
| Not testing on different month lengths (28‑31 days) | Layout breaks for February or 31‑day months | Build row classes for 10 and 11 columns. |
| Hardcoding breakpoint pixel values | Layout may break on unusual screen sizes | Use relative `minmax` values that scale smoothly. |

### 5. Mental Model to Teach

> **“Think of the container as a flexible frame. The grid system divides that frame into equal‑sized slots. Each slot holds a cell. The only space between slots is the `gap` you define. The cells themselves are fully responsive – they stretch or shrink to fill their slot.”**

- **Container** → defines the available width.
- **Grid** → slices the container into equal columns.
- **Gap** → adds fixed spacing between columns.
- **Cell** → occupies one column, sized by the grid, shaped by `aspect-ratio`.
- **Responsiveness** → achieved by changing the grid’s `minmax` values and gap at breakpoints.

### 6. Sample Checklist for a Developer

- [ ] Is the container width 100% of its parent?
- [ ] Are we using CSS Grid (not flex `space-between`)?
- [ ] Does each row class have `grid-template-columns: repeat(n, minmax(0, 1fr))`?
- [ ] Is `gap` the only spacing between cells?
- [ ] Do cells have `min-width: 0`?
- [ ] Do cells use `aspect-ratio: 1/1` instead of fixed height?
- [ ] Have we tested with 28, 30, and 31 days?
- [ ] Are breakpoints reducing the gap and min cell size smoothly?
- [ ] Does the layout never overflow or show scrollbars?

By following this guide, anyone can reproduce the exact heatmap design without the common pitfalls.