export function renderErrorPage() {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>PetPal — Something went wrong</title>
    <style>
      body { margin: 0; min-height: 100vh; display: grid; place-items: center; background: #f8faf6; color: #1f2933; font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
      main { width: min(440px, calc(100vw - 32px)); text-align: center; }
      h1 { margin: 0 0 12px; font-size: 28px; line-height: 1.1; }
      p { margin: 0 0 24px; color: #5f6b5f; line-height: 1.6; }
      .actions { display: flex; justify-content: center; gap: 12px; flex-wrap: wrap; }
      a, button { border: 0; border-radius: 8px; padding: 10px 16px; font: inherit; font-weight: 700; cursor: pointer; text-decoration: none; }
      button { background: #6f8f4f; color: white; }
      a { background: white; color: #1f2933; box-shadow: inset 0 0 0 1px #d8e0d2; }
    </style>
  </head>
  <body>
    <main>
      <h1>Something went wrong</h1>
      <p>The app could not finish loading. Please refresh the page or return home.</p>
      <div class="actions">
        <button onclick="location.reload()">Refresh</button>
        <a href="/">Go home</a>
      </div>
    </main>
  </body>
</html>`;
}