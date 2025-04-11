# OMNI App Design System

This document provides guidelines for using the OMNI App design system to ensure visual consistency across the application.

## 🎨 Design Tokens

Design tokens are the visual design atoms of the design system. They're stored as CSS variables and accessible throughout the application.

### Using Design Tokens

```scss
// In SCSS files
.my-element {
  // Use CSS variables from our design system
  color: var(--color-primary);
  padding: var(--space-4);
  margin-bottom: var(--space-2);
  border-radius: var(--border-radius-md);
  font-size: var(--font-size-md);
  transition: all var(--transition-normal) var(--transition-curve-default);
}
```

```tsx
// In React components with inline styles
<Box 
  sx={{ 
    color: 'var(--color-primary)',
    padding: 'var(--space-4)',
    fontSize: 'var(--font-size-md)'
  }}
>
  Content
</Box>
```

## 🌈 Color System

The color system is structured around functional categories:

### Brand Colors
- `--color-primary` - Main brand color
- `--color-primary-light` - Lighter variant of primary
- `--color-primary-dark` - Darker variant of primary
- `--color-secondary` - Secondary brand color

### UI Colors
- `--color-background` - Page background
- `--color-surface` - Cards, dialogs, etc.
- `--color-surface-variant` - Alternative surface color
- `--color-border` - Border color

### Text Colors
- `--color-text-primary` - Primary text color
- `--color-text-secondary` - Secondary text color
- `--color-text-disabled` - Disabled text color
- `--color-text-on-primary` - Text color on primary background

### Status Colors
- `--color-error` - Error states
- `--color-warning` - Warning states
- `--color-success` - Success states
- `--color-info` - Information states

## 📏 Spacing

Use the spacing scale for consistent margins, padding, and layout spacing:

- `--space-1` - 4px
- `--space-2` - 8px
- `--space-3` - 12px
- `--space-4` - 16px
- `--space-5` - 24px
- `--space-6` - 32px
- `--space-8` - 48px
- `--space-10` - 64px
- `--space-12` - 80px

## 📝 Typography

### Font Sizes
- `--font-size-xs` - Extra small text (12px)
- `--font-size-sm` - Small text (14px)
- `--font-size-md` - Medium text (16px)
- `--font-size-lg` - Large text (18px)
- `--font-size-xl` - Extra large text (20px)
- `--font-size-2xl` - 2X large text (24px)
- `--font-size-3xl` - 3X large text (30px)
- `--font-size-4xl` - 4X large text (36px)

### Font Weights
- `--font-weight-light` - 300
- `--font-weight-regular` - 400
- `--font-weight-medium` - 500
- `--font-weight-semibold` - 600
- `--font-weight-bold` - 700

### Font Families
- `--font-family-base` - Main font family
- `--font-family-code` - Monospace font for code

## 🔳 Borders & Radiuses

Use these tokens for consistent border styling:

- `--border-width-thin` - 1px
- `--border-width-medium` - 2px
- `--border-width-thick` - 4px
- `--border-radius-sm` - Small radius (4px)
- `--border-radius-md` - Medium radius (8px)
- `--border-radius-lg` - Large radius (12px)
- `--border-radius-xl` - Extra large radius (16px)
- `--border-radius-full` - Circular radius (9999px)

## 🌓 Shadows

For consistent elevation and depth:

- `--shadow-sm` - Subtle shadow for small elements
- `--shadow-md` - Medium shadow for cards and buttons
- `--shadow-lg` - Large shadow for elevated elements
- `--shadow-xl` - Extra large shadow for modals and popovers

## ⏱️ Transitions & Animations

For consistent motion:

- `--transition-fast` - 150ms
- `--transition-normal` - 250ms
- `--transition-slow` - 350ms
- `--transition-curve-default` - Standard easing
- `--transition-curve-accelerate` - Accelerating easing
- `--transition-curve-decelerate` - Decelerating easing

## 🧩 Component Examples

### Button Styling
```scss
.custom-button {
  background-color: var(--color-primary);
  color: var(--color-text-on-primary);
  padding: var(--space-2) var(--space-4);
  border-radius: var(--border-radius-md);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  border: none;
  box-shadow: var(--shadow-sm);
  transition: all var(--transition-normal) var(--transition-curve-default);
  
  &:hover {
    background-color: var(--color-primary-dark);
    box-shadow: var(--shadow-md);
  }
  
  &:focus {
    outline: none;
    box-shadow: 0 0 0 2px var(--color-border-focus);
  }
}
```

### Card Styling
```scss
.custom-card {
  background-color: var(--color-surface);
  border-radius: var(--border-radius-md);
  padding: var(--space-4);
  box-shadow: var(--shadow-md);
  
  .card-title {
    font-size: var(--font-size-xl);
    font-weight: var(--font-weight-semibold);
    margin-bottom: var(--space-2);
    color: var(--color-text-primary);
  }
  
  .card-body {
    font-size: var(--font-size-md);
    color: var(--color-text-secondary);
  }
}
```

## 🔄 Legacy Variables & Migration Strategy

### Legacy Variables
For backward compatibility, we've maintained the original variables alongside our new design tokens:

**Light Theme:**
```scss
--primary-color: #ffffff;         // White
--secondary-color: #dcddde;       // Light gray
--neutral-color: #444444;         // Neutral dark
--text-color: var(--color-text-primary);
--accent-color: var(--color-primary);
--accent-color2: var(--color-secondary);
```

**Dark Theme:**
```scss
--primary-color: #1a1a1a;         // Dark gray
--secondary-color: #3a3a3a;       // Medium gray
--neutral-color: #b3b2b0;         // Neutral light
--text-color: var(--color-text-primary);
--accent-color: var(--color-primary);
--accent-color2: var(--color-secondary);
```

### Migration Strategy
When updating components or creating new ones, use the new design tokens instead of legacy variables:

| Legacy Variable | Modern Design Token | Purpose |
|----------------|---------------------|---------|
| `--primary-color` | `--color-surface` | Component backgrounds |
| `--secondary-color` | `--color-surface-variant` | Secondary surfaces |
| `--text-color` | `--color-text-primary` | Main text color |
| `--accent-color` | `--color-primary` | Primary accent color |
| `--accent-color2` | `--color-secondary` | Secondary accent color |
| `--border-color` | `--color-border` | Border colors |
| `--background-color` | `--color-background` | Page background |

### Common Component Transitions

**Buttons:**
```scss
/* Before */
.button {
  background-color: var(--accent-color);
  color: white;
}

/* After */
.button {
  background-color: var(--color-primary);
  color: var(--color-text-on-primary);
}
```

**Cards:**
```scss
/* Before */
.card {
  background-color: var(--primary-color);
  border: 1px solid var(--border-color);
}

/* After */
.card {
  background-color: var(--color-surface);
  border: var(--border-width-thin) solid var(--color-border);
}
```

## 🛠️ Utility Mixins

We provide SCSS mixins for common patterns:

```scss
// Use focus rings consistently
@include focus-ring;

// Truncate text with ellipsis
@include truncate;
```

## 🧪 Testing Theme Compatibility

To ensure your component works in both light and dark themes:

1. Use the theme toggle to switch between modes
2. Check for sufficient contrast in both modes
3. Verify that all interactive states (hover, focus, active) are visible

## 📝 Best Practices

1. **Always use design tokens** instead of hard-coded values
2. Use semantic variables (e.g., `--color-success` instead of `green`)
3. For one-off values not in the system, consider adding a new token if it will be reused
4. Use MUI's theme provider for MUI components, and CSS variables for custom components
5. Keep responsive design in mind - use relative units and test on different screen sizes 