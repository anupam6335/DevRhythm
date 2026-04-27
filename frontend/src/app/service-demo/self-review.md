
## Self‑Review 2: Service Layers & Error Handling in Next.js ( [CODE](https://github.com/anupam6335/DevRhythm/tree/feat-temp-smart-goal-task/frontend/src/app/service-demo) )

### What I built
I created a service layer (`userServiceTemp.ts`) that wraps API calls with a single, reusable `apiRequest` helper. I then built a demo page (`/service-demo`) that uses this layer in two ways:  
- **Server component** – fetches data at request time and sends fully‑rendered HTML to the browser.  
- **Client component** – fetches data after mount with interactive buttons and a loading/error state.  

### 1. Determining server vs. client API calls
I followed a simple, practical rule:

- **Server** – when the component just displays data and doesn’t need to react to user actions (no `onClick`, no `useState`, no `useEffect`). This also helps when the data must appear in the initial HTML (for SEO or a fast first paint) or when I want to keep API keys hidden.
- **Client** – when the component needs interactivity (buttons, forms, state, effects, browser APIs), or when the data depends on a user action like a button click.

In the demo, the left card (`ServerUsers`) is a Server Component – it only fetches and renders a list, no interaction. The right card (`ClientUsers`) is a Client Component – it has buttons, loading state, and error state that update on the fly. The decision table on the page summarises this logic clearly.

### 2. Challenges while designing the service layer
The main challenge was keeping the layer clean and reusable without duplicating error logic. I started by putting all `fetch` calls and error checks into a single `apiRequest` function. That way every service function (like `getUsers`, `getUserById`) only has to call `apiRequest` and return typed data. This keeps the code short and makes it easy to add new endpoints later. I also had to make sure the service works both on the server and the client – because I’m using native `fetch`, it works everywhere without extra setup.

### 3. Error handling concept I learned
Before this, I would usually just `try/catch` and show the raw error message. Now I create a custom `ApiError` class that holds a human‑friendly message, the HTTP status code, and extra details if needed. Inside `apiRequest` I handle three different cases:

- **Network error** (no internet) – throw a clear message.
- **HTTP error** (404, 500, etc.) – map status codes to user‑friendly messages.
- **JSON parse error** (bad response body) – throw a separate error.

This means the UI always gets a predictable error object, and I never have to worry about accidentally showing a stack trace to the user. On the client side I display errors in a styled box, and on the server side I return an error card instead of crashing the whole page.
