## Self-Review 1: JavaScript Fundamentals Demonstration ( [CODE](https://github.com/anupam6335/DevRhythm/blob/feat-temp-smart-goal-task/frontend/src/app/page.tsx) )

### What I built
I created a single-page demo in our Next.js project that shows four core JavaScript concepts: nested destructuring, safe property access, functional array methods, and complex object operations.

### 1. Nested destructuring – how it improved readability
Before this task I would have written several lines like `company.departments.engineering.manager.name` and `company.departments.engineering.manager.contact.email` to get deep values. Now I’m using a single `const` block that destructures all of them in one place. In the code, you can see this:

```js
const {
  name: companyName,
  departments: {
    engineering: {
      manager: {
        name: engManagerName,
        contact: { email: engManagerEmail }
      }
    }
  }
} = company;
```

This is much shorter and tells you at a glance which fields I care about. It also avoids repeating long property chains, which makes typos less likely.

### 2. Challenges with functional array methods
I was used to writing traditional `for` loops, so wrapping my head around chaining `filter`, `map`, `reduce`, etc. took a little practice. The biggest challenge was flattening all employees from different departments into one array. I solved it with `flatMap` on the department object values:

```js
const allEmployees = Object.values(company.departments).flatMap(dept => dept.employees);
```

Then I could chain methods like `.filter().map()` for developer names and `.reduce()` for total salary. I also learned that methods like `sort` mutate the array, so I had to spread it first (`[...allEmployees].sort(...)`) to avoid side effects. The side‑by‑side “old loop vs. functional” example in the demo really helped me internalise the difference.

### 3. Safe property access – what I learned
The biggest takeaway for me was how `?.` and `??` can make code much safer without adding extra `if` checks. For example, the `hr` department has `manager: null`. Without safe access, `company.departments.hr.manager.name` would throw. Using `company.departments?.hr?.manager?.name ?? "Vacant"` gives a clean fallback instead. Also, I realized that whenever I access nested properties (like chaining multiple levels), I should consistently use ?. instead of direct access. It’s a better practice because it prevents runtime errors and keeps the code more reliable, especially when working with API data that might be incomplete or inconsistent.


Overall, this task gave me a solid practical grip on these fundamentals. I’m more confident using these techniques in our actual project.
