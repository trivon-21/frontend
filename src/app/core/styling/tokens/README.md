# Design Tokens System

## Overview

This directory contains the **UNIFIED design token system** for the Airlux application. All UI styling decisions (colors, typography, spacing, shadows, buttons, tables) are defined here in **ONE PLACE** as configuration objects.

**Key Principle**: One universal theme applies across the entire application:

- Customer portal
- Technician portal
- Inventory Manager
- All other applications

Changes to any token automatically apply everywhere, eliminating the need to manage multiple themes.

## File Structure

```
tokens/
├── colors.tokens.ts          # Universal color palette
├── typography.tokens.ts      # Universal font configurations
├── spacing.tokens.ts         # Universal 8px grid system & border radius
├── shadows.tokens.ts         # Universal shadow elevations
├── buttons.tokens.ts         # Universal button variant styles
├── tables.tokens.ts          # Universal table component styles
├── index.ts                  # Central export point
└── README.md                 # This file
```

## Universal Theme

### Primary Color

- **Forest Green**: #41603d
- Used for all primary actions, buttons, and highlights across entire application

### Theme applies to

✅ Customer-facing website  
✅ Technician portal  
✅ Inventory Manager dashboard  
✅ All other applications

### One Source of Truth

All styling decisions centralized → Change once, update everywhere

## Token Files

### `colors.tokens.ts`

Defines the universal color palette used across the entire application.

**Color categories**:

- `primary`: Main brand color (#41603d), hover, active, light variants
- `secondary`: Alternative accent color (#16a34a)
- `semantic`: Status colors (success, error, warning, info)
- `text`: Text colors (primary, secondary, muted, disabled, inverse)
- `backgrounds`: Background colors for different contexts
- `borders`: Border colors (light, medium, dark)
- `surface`: Elevation and overlay colors

**Usage**:

```typescript
import { colorTokens, getColorTokens } from '@app/core/styling/tokens';

// Direct access to universal theme
const colors = colorTokens;
const primaryColor = colors.primary.main; // '#41603d'

// Using utility function
const allColors = getColorTokens();
```

### `typography.tokens.ts`

Defines universal font configurations for all text elements.

**Includes**:

- 12 typography levels (display, h1-h4, bodyLarge, body, bodySmall, label, labelSmall, caption, button, buttonSmall)
- Font family (Inter, Arimo), size, weight, line height, letter spacing
- Same typography scale across entire application

**Usage**:

```typescript
import { typographyTokens, getTypographyTokens } from '@app/core/styling/tokens';

const heading1 = typographyTokens.customer.h1;
const buttonFont = getTypographyTokens().button;
```

### `spacing.tokens.ts`

Universal 8px-based grid system for consistent spacing throughout the app.

**Includes**:

- **Spacing scale**: xs (4px), sm (8px), md (12px), lg (16px), xl (24px), xxl (32px), xxxl (40px), huge (48px)
- **Border radius scale**: xs (4px), sm (8px), md (12px), lg (16px), xl (20px), full (50%)
- **Component-specific padding**: button, card, cardHeader, input
- **Component-specific gaps**: section (40px), component (32px), item (24px)

**Usage**:

```typescript
import { spacingTokens, getSpacing, getBorderRadius } from '@app/core/styling/tokens';

const smallPadding = getSpacing('sm'); // '8px'
const largeGap = spacingTokens.gap.xxl; // '32px'
const cardRadius = getBorderRadius('lg'); // '16px'
const componentPadding = spacingTokens.componentPadding.card; // '32px'
```

### `shadows.tokens.ts`

Universal shadow elevations for different component contexts.

**Shadow types**:

- `minimal`: 0 1px 3px (almost imperceptible)
- `light`: 0 2px 10px (subtle)
- `standard`: 0 4px 20px (default for cards)
- `medium`: 0 4px 24px (button hover)
- `large`: 0 8px 16px (floating panels)
- `xl`: 0 10px 40px (dropdowns)
- `modal`: 0 20px 60px (modal dialogs)

**Usage**:

```typescript
import { shadowTokens, getShadow } from '@app/core/styling/tokens';

const cardShadow = getShadow('standard');
const modalShadow = shadowTokens.boxShadows.modal;
const lightShadow = getShadow('light');
```

### `buttons.tokens.ts`

Universal button variant configurations with all states.

**Button variants**:

- `primary`: Main action button (Forest Green #41603d)
- `secondary`: Alternative action (outline)
- `success`: Positive action (green #16a34a)
- `danger`: Destructive action (red)
- `warning`: Warning action (orange)
- `icon`: Icon-only button
- `text`: Text/link button
- `review`: Custom review button
- `small`: Compact button

**Each variant includes**:

- Background, color, padding, border-radius, font
- Hover state (background, color, shadow, transform)
- Active state
- Disabled state
- Focus state

**Usage**:

```typescript
import { buttonTokens, getButtonTokens } from '@app/core/styling/tokens';

const primaryBtn = buttonTokens.primary;
const successBtn = getButtonTokens().success;
const allButtons = buttonTokens;
```

### `tables.tokens.ts`

Universal table component styling configuration.

**Includes**:

- **Header**: background, color, padding, border
- **Cell**: padding, font, color, border
- **Row**: hover and selected states
- **Status Pills**: 7 status types with colors (approved, draft, pending, inProgress, rejected, completed, onHold)
- **Pagination**: font and color

**Usage**:

```typescript
import { tableTokens, getTableTokens } from '@app/core/styling/tokens';

const headerStyle = tableTokens.header;
const statusPills = getTableTokens().statusPills;
```

## Usage Patterns

### Pattern 1: Direct access to tokens

```typescript
import { colorTokens, spacingTokens } from '@app/core/styling/tokens';

// Access universal theme directly
const primaryColor = colorTokens.primary.main;
const spacing = spacingTokens.padding.lg;
```

### Pattern 2: Using utility functions

```typescript
import { getColorTokens, getSpacing } from '@app/core/styling/tokens';

// Get tokens using utility functions
const colors = getColorTokens();
const spacing = getSpacing('lg');
```

### Pattern 3: In CSS/SCSS

```css
/* Using CSS variables injected by theme provider */
color: var(--text-primary);
background: var(--background-card);
padding: var(--spacing-lg);
box-shadow: var(--shadow-standard);
border-radius: var(--border-radius-md);
```

## Adding/Modifying Tokens

### To modify an existing token

1. **Find the token file**: Identify which file contains the token
   - Colors → `colors.tokens.ts`
   - Typography → `typography.tokens.ts`
   - Spacing → `spacing.tokens.ts`
   - Etc.

2. **Update the value**: Change the value in the token object

   ```typescript
   primary: {
     main: '#41603d',  // Change this
     // ...
   }
   ```

3. **Save and test**: Changes automatically apply everywhere through CSS variables

### To add a new token category

1. **Create new token file**: `frontend/src/app/core/styling/tokens/new-tokens.ts`
2. **Define interfaces** for your token structure
3. **Create universal token object** (no theme variations)
4. **Export utility function** (e.g., `getNewTokens()`)
5. **Add to index.ts** for central export
6. **Use in CSS generators** (Phase 2)

Example:

```typescript
export interface MyTokens {
  property1: string;
  property2: string;
}

export const myTokens: MyTokens = {
  property1: 'value1',
  property2: 'value2',
};

export function getMyTokens(): MyTokens {
  return myTokens;
}
```

## Key Principles

1. **One source of truth**: All styling defined in one place
2. **Type-safe**: TypeScript interfaces for all tokens
3. **Universal**: Same tokens for entire application
4. **Reusable**: Utility functions for easy access
5. **Maintainable**: Changes update everywhere automatically
6. **Scalable**: Easy to add new tokens

## Related Files

- **Phase 2**: `generators/` - Converts tokens to CSS
- **Phase 3**: `theme.provider.ts` - Injects CSS into DOM
- **Phase 4**: `themes/` - Complete theme definitions

## Next Steps

These tokens will be used by:

1. **CSS Generators** (Phase 2) to create dynamic stylesheets
2. **Theme Provider** (Phase 3) to inject CSS into the DOM
3. **Components** (Phase 6) to reference styling values
