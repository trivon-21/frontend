# Airlux Centralized Styling System

## Overview

The Airlux styling system provides a **centralized, configuration-driven approach** to UI theming. All styling decisions (colors, typography, spacing, shadows, buttons, tables) are defined in one place as TypeScript configuration objects, enabling:

- **Single Point of Control**: Change a token value once, it updates everywhere
- **Type-Safe**: TypeScript interfaces prevent invalid configurations
- **Runtime Customization**: Update CSS variables dynamically without reloading
- **Zero Component Changes**: Existing component code remains untouched
- **Scalable**: Easy to add new tokens or themes

## Quick Start

### 1. Load Theme on App Startup

In `app.component.ts`:

```typescript
import { Component, OnInit } from '@angular/core';
import { ThemeProvider } from '@app/core/styling';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
})
export class AppComponent implements OnInit {
  constructor(private themeProvider: ThemeProvider) {}

  ngOnInit() {
    // Load theme on app start
    this.themeProvider.loadTheme();
  }
}
```

### 2. Use Tokens in Components

#### Access tokens directly:

```typescript
import { colorTokens, spacingTokens, buttonTokens } from '@app/core/styling';

export class MyComponent {
  primaryColor = colorTokens.primary.main; // #41603d
  padding = spacingTokens.padding.lg; // 16px
  primaryButton = buttonTokens.primary; // Complete button config
}
```

#### Use utility functions:

```typescript
import { getColorTokens, getSpacing, getShadow } from '@app/core/styling';

export class MyComponent {
  colors = getColorTokens();
  largeSpacing = getSpacing('lg'); // 16px
  modalShadow = getShadow('modal'); // Box shadow value
}
```

#### Use CSS variables in styles:

```css
/* In component.css */
.my-button {
  background-color: var(--primary-main);
  color: var(--text-primary);
  padding: var(--spacing-md);
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-standard);
}
```

### 3. Update Theme Variables at Runtime

```typescript
import { ThemeProvider, StylesService } from '@app/core/styling';

export class ThemeCustomizerComponent {
  constructor(
    private themeProvider: ThemeProvider,
    private stylesService: StylesService,
  ) {}

  updatePrimaryColor(color: string) {
    // Update single variable
    this.themeProvider.updateVariable('primary-main', color);
    // Or use StylesService for more options
    this.stylesService.setColor('primary-main', color);
  }

  updateMultipleColors() {
    this.themeProvider.updateVariables({
      'primary-main': '#41603d',
      'text-primary': '#1a1a1b',
      'background-page': '#f5f7f9',
    });
  }

  resetToDefaults() {
    this.stylesService.resetAll();
  }
}
```

## System Architecture

### Directory Structure

```
core/styling/
├── tokens/                          # Design token definitions
│   ├── colors.tokens.ts             # Color palette
│   ├── typography.tokens.ts         # Font configurations
│   ├── spacing.tokens.ts            # Grid & spacing scale
│   ├── shadows.tokens.ts            # Shadow elevations
│   ├── buttons.tokens.ts            # Button variants
│   ├── tables.tokens.ts             # Table styles
│   ├── index.ts                     # Token exports
│   └── README.md                    # Token documentation
├── generators/                      # CSS generation utilities
│   ├── css-variables.generator.ts   # CSS custom properties
│   ├── button-styles.generator.ts   # Button CSS
│   ├── table-styles.generator.ts    # Table CSS
│   └── component-styles.generator.ts # Master generator
├── themes/                          # Complete theme definitions
│   └── (Phase 4 - to be created)
├── theme.provider.ts                # Theme injection service
├── styles.service.ts                # CSS variable management
├── index.ts                         # Public API
└── README.md                        # This file
```

### Data Flow

```
Tokens (Config Objects)
    ↓
Generators (Convert to CSS)
    ↓
ThemeProvider (Inject into DOM)
    ↓
StylesService (Update at Runtime)
    ↓
Components (Use CSS Variables)
```

## Token System

### Tokens Included

1. **Colors** (`colors.tokens.ts`)
   - Primary, secondary, semantic colors
   - Text, background, border, surface colors
   - Status colors (success, error, warning, info)

2. **Typography** (`typography.tokens.ts`)
   - 12 typography levels (display, h1-h4, body variants, etc.)
   - Font family, size, weight, line height, letter spacing

3. **Spacing** (`spacing.tokens.ts`)
   - 8px-based grid system: xs(4px), sm(8px), md(12px), lg(16px), xl(24px), xxl(32px)
   - Border radius scale: xs(4px), sm(8px), md(12px), lg(16px), xl(20px), full(50%)
   - Component-specific padding and gaps

4. **Shadows** (`shadows.tokens.ts`)
   - 7 shadow elevations: minimal, light, standard, medium, large, xl, modal

5. **Buttons** (`buttons.tokens.ts`)
   - 9 button variants: primary, secondary, success, danger, warning, icon, text, review, small
   - Each includes: base styles, hover, active, disabled, focus states

6. **Tables** (`tables.tokens.ts`)
   - Header, cell, row styling
   - 7 status pills with specific colors
   - Pagination component styles

## Services

### ThemeProvider

Main service for theme management. Injects CSS into DOM and manages theme switching.

**Methods:**

| Method                        | Purpose                       | Example                                                |
| ----------------------------- | ----------------------------- | ------------------------------------------------------ |
| `loadTheme()`                 | Load and inject theme CSS     | `themeProvider.loadTheme()`                            |
| `getCurrentTheme()`           | Get active theme name         | `const theme = themeProvider.getCurrentTheme()`        |
| `switchTheme(name)`           | Switch to different theme     | `themeProvider.switchTheme('default')`                 |
| `updateVariable(name, value)` | Update single CSS variable    | `themeProvider.updateVariable('primary-main', '#fff')` |
| `updateVariables(updates)`    | Update multiple CSS variables | `themeProvider.updateVariables({...})`                 |
| `reloadTheme()`               | Reload current theme          | `themeProvider.reloadTheme()`                          |
| `clearTheme()`                | Remove theme CSS from DOM     | `themeProvider.clearTheme()`                           |
| `isThemeLoaded()`             | Check if theme is active      | `if (themeProvider.isThemeLoaded())`                   |

**Example Usage:**

```typescript
export class AppComponent implements OnInit {
  constructor(private themeProvider: ThemeProvider) {}

  ngOnInit() {
    // Load theme on initialization
    this.themeProvider.loadTheme();
  }

  changeTheme() {
    // Update single variable
    this.themeProvider.updateVariable('primary-main', '#00ff00');

    // Or update multiple at once
    this.themeProvider.updateVariables({
      'primary-main': '#00ff00',
      'primary-hover': '#00dd00',
    });
  }
}
```

### StylesService

Advanced CSS variable management with caching and reset capabilities.

**Methods:**

| Method                     | Purpose                    | Example                                                        |
| -------------------------- | -------------------------- | -------------------------------------------------------------- |
| `setVariable(name, value)` | Set CSS variable           | `stylesService.setVariable('spacing-lg', '20px')`              |
| `setColor(name, value)`    | Set color variable         | `stylesService.setColor('primary-main', '#fff')`               |
| `setSpacing(size, value)`  | Set spacing variable       | `stylesService.setSpacing('lg', '20px')`                       |
| `setShadow(name, value)`   | Set shadow variable        | `stylesService.setShadow('standard', '...')`                   |
| `getVariable(name)`        | Get current variable value | `const color = stylesService.getVariable('primary-main')`      |
| `getVariables(names)`      | Get multiple variables     | `stylesService.getVariables(['primary-main', 'text-primary'])` |
| `getAllVariables()`        | Get all CSS variables      | `const all = stylesService.getAllVariables()`                  |
| `resetVariable(name)`      | Reset to initial value     | `stylesService.resetVariable('primary-main')`                  |
| `resetAll()`               | Reset all variables        | `stylesService.resetAll()`                                     |
| `exportVariablesAsCSS()`   | Export as CSS text         | `const css = stylesService.exportVariablesAsCSS()`             |

**Example Usage:**

```typescript
export class ThemeCustomizerComponent {
  constructor(private stylesService: StylesService) {}

  updateColor(color: string) {
    this.stylesService.setColor('primary-main', color);
  }

  resetColors() {
    this.stylesService.resetAll();
  }

  viewCurrentConfig() {
    const css = this.stylesService.exportVariablesAsCSS();
    console.log(css);
  }
}
```

## CSS Variables Available

All tokens are exposed as CSS custom properties. Use them in component stylesheets:

```css
/* Colors */
--primary-main: #41603d;
--primary-hover: #2d4631;
--text-primary: #1a1a1b;
--background-page: #f5f7f9;

/* Typography */
--h1-font-size: 38px;
--body-font-family: 'Inter', sans-serif;

/* Spacing */
--spacing-xs: 4px;
--spacing-md: 12px;
--border-radius-lg: 16px;

/* Shadows */
--shadow-standard: 0 4px 20px rgba(0, 0, 0, 0.03);
--shadow-modal: 0 20px 60px rgba(0, 0, 0, 0.15);
```

## Using Pre-Generated CSS Classes

The system generates utility classes automatically:

```html
<!-- Flex utilities -->
<div class="flex"></div>
<div class="flex-center"></div>
<div class="flex-between"></div>

<!-- Spacing utilities -->
<div class="gap-lg"></div>
<div class="p-md"></div>
<div class="m-xl"></div>

<!-- Border radius utilities -->
<div class="rounded-md"></div>
<div class="rounded-full"></div>

<!-- Shadow utilities -->
<div class="shadow-standard"></div>
<div class="shadow-modal"></div>

<!-- Button classes -->
<button class="btn-primary">Primary</button>
<button class="btn-secondary">Secondary</button>
<button class="btn-success">Success</button>
<button class="btn-danger">Danger</button>

<!-- Status pills -->
<span class="status-pill-approved">Approved</span>
<span class="status-pill-rejected">Rejected</span>
```

## Modifying Tokens

### Update an Existing Token

1. Find the token file (e.g., `colors.tokens.ts`)
2. Update the value:

```typescript
export const colorTokens: ColorPalette = {
  primary: {
    main: '#41603d', // Change this
    hover: '#2d4631',
    // ...
  },
};
```

3. Save - Changes automatically apply via CSS variables

### Add a New Token

1. Create a new token file (e.g., `animations.tokens.ts`)
2. Define interfaces and values:

```typescript
export interface AnimationTokens {
  fadeInDuration: string;
  slideInDuration: string;
}

export const animationTokens: AnimationTokens = {
  fadeInDuration: '0.3s',
  slideInDuration: '0.5s',
};

export function getAnimationTokens(): AnimationTokens {
  return animationTokens;
}
```

3. Add to `index.ts`:

```typescript
export { animationTokens, getAnimationTokens } from './tokens/animations.tokens';
```

4. Create generator in `generators/` if needed

## Best Practices

✅ **Use tokens in all styling** - Replace hard-coded values with token references  
✅ **Use CSS variables in components** - `var(--spacing-md)` instead of `12px`  
✅ **Batch updates** - Use `updateVariables()` instead of multiple `updateVariable()` calls  
✅ **Cache token values** - Import once at component top, reuse throughout  
✅ **Use utility classes** - `.flex`, `.gap-md`, `.shadow-standard` for common patterns  
✅ **Type-safe** - TypeScript interfaces prevent configuration errors

❌ **Don't use hard-coded values** - Always use tokens  
❌ **Don't create inline styles** - Use CSS classes or CSS variables  
❌ **Don't mix themes** - Load one theme consistently  
❌ **Don't update unrelated variables** - Keep updates focused

## Related Documentation

- **Phase 1**: Design Token System (Complete)
- **Phase 2**: CSS Generators (Complete)
- **Phase 3**: Theme Provider & Service (✓ This phase)
- **Phase 4**: Theme Definitions (Next)
- **Phase 5**: App Integration (Next)
- **Phase 6**: Component Migration (Next)
- **Phase 7**: Documentation (In Progress)

## Next Steps

The next phase will:

- Create theme definition files that bundle all tokens together
- Integrate theme provider into app initialization
- Begin component migration to use the token system
