# Airlux Styling System

A deliberately small, CSS-variable–based theme. Four files, one job.

## How it works (the whole thing)

```
theme.tokens.ts   →   theme.provider.ts   →   <style> in <head>
(the values)          (builds :root vars +      (components use
theme.css.ts          injects once at boot)      var(--token))
(static base css)
```

1. **`theme.tokens.ts`** — a flat `{ 'name': 'value' }` map. This is the **single
   source of truth**. Each entry becomes a CSS variable (`'primary-main': '#00843D'`
   → `--primary-main: #00843D`).
2. **`theme.css.ts`** — the static base stylesheet (element resets + `.btn-*`,
   `.status-pill-*`, `.flex`, `.gap-*`, `.shadow-*`, table styles…). It only
   references `var(--…)`, so you rarely touch it.
3. **`theme.provider.ts`** — turns the tokens into a `:root { … }` block, prepends
   the base CSS, and injects it into a single `<style>` tag. `app.ts` calls
   `loadTheme()` once at startup.
4. **`index.ts`** — public exports (`ThemeProvider`, `TOKENS`).

## Customizing

- **Change a colour/spacing/shadow everywhere:** edit its value in
  `theme.tokens.ts`. Done — it cascades to every `var(--…)`.
- **Use a token in a component:** `background: var(--primary-main);` in the
  component's CSS. No imports needed.
- **Change it at runtime** (optional): inject `ThemeProvider` and call
  `updateVariable('primary-main', '#123456')` or `updateVariables({ … })`.

## Notes

This replaced an earlier 20-file generator/validator/theme-registry system. The
CSS output is identical — the machinery was just removed. If you ever need a
second theme or a real design-token pipeline, this is small enough to extend
without fighting it.
