# Lingua Design System

Complete design system implementation for the Lingua language learning app, built with NativeWind and Tailwind CSS.

## Overview

The design system is organized into modular, reusable tokens and utilities that ensure consistency across the app. All design decisions follow the Lingua brand guidelines and are pixel-perfect implementations of the provided design theme.

## Architecture

```
src/theme/
├── colors.ts         # Color palette and semantic color definitions
├── typography.ts     # Font families, sizes, and font weights
├── spacing.ts        # Spacing scale, border radius, and shadows
├── fonts.ts          # Font loading configuration
├── index.ts          # Centralized exports
└── DESIGN_SYSTEM.md  # This file
```

## Color System

### Brand Colors (Primary)

- **Lingua Purple**: `#6C4EF5` - Primary brand color
- **Lingua Deep Purple**: `#5B3BF6` - Secondary brand color
- **Lingua Blue**: `#4D8BFF` - Accent color
- **Lingua Green**: `#21C16B` - Success/positive color

### Semantic Colors

- **Success**: `#21C16B` - Positive actions, completion
- **Warning**: `#FFC800` - Warnings, caution
- **Streak**: `#FF8A00` - Achievements, streaks
- **Error**: `#FF4D4F` - Errors, destructive actions
- **Info**: `#4D8BFF` - Information, help

### Neutral Colors

- **Text Primary**: `#0D132B` - Main text color
- **Text Secondary**: `#6B7280` - Secondary text, captions
- **Border**: `#E5E7EB` - Borders, dividers
- **Surface**: `#F6F7FB` - Backgrounds for secondary elements
- **Background**: `#FFFFFF` - Main background

## Typography

### Font Family

- **Primary Font**: Poppins
  - Regular (400) - `Poppins-Regular`
  - Medium (500) - `Poppins-Medium`
  - SemiBold (600) - `Poppins-SemiBold`
  - Bold (700) - `Poppins-Bold`

### Type Styles

| Style       | Size | Weight         | Line Height | Usage             |
| ----------- | ---- | -------------- | ----------- | ----------------- |
| H1          | 32px | Bold (700)     | 38.4px      | Page/Screen Title |
| H2          | 24px | SemiBold (600) | 31.2px      | Section Title     |
| H3          | 20px | SemiBold (600) | 26px        | Card/Module Title |
| H4          | 16px | Medium (500)   | 22.4px      | Subheading        |
| Body Large  | 16px | Regular (400)  | 25.6px      | Important content |
| Body Medium | 14px | Regular (400)  | 22.4px      | Body text         |
| Body Small  | 13px | Regular (400)  | 20.8px      | Supporting text   |
| Caption     | 11px | Regular (400)  | 15.4px      | Labels, meta text |

### Usage Classes

```tsx
// Headings
<Text className="h1">Page Title</Text>
<Text className="h2">Section Title</Text>
<Text className="h3">Card Title</Text>
<Text className="h4">Subheading</Text>

// Body
<Text className="body-lg">Important text</Text>
<Text className="body-md">Normal text</Text>
<Text className="body-sm">Supporting text</Text>
<Text className="caption">Label or meta</Text>
```

## Spacing Scale

| Token | Value |
| ----- | ----- |
| 0     | 0px   |
| 1     | 4px   |
| 2     | 8px   |
| 3     | 12px  |
| 4     | 16px  |
| 5     | 20px  |
| 6     | 24px  |
| 8     | 32px  |
| 10    | 40px  |
| 12    | 48px  |
| 16    | 64px  |

### Padding Classes

```tsx
// Horizontal padding
<View className="px-sm">  {/* 8px */}
<View className="px-md">  {/* 12px */}
<View className="px-lg">  {/* 16px */}
<View className="px-xl">  {/* 20px */}

// Vertical padding
<View className="py-sm">  {/* 8px */}
<View className="py-md">  {/* 12px */}
<View className="py-lg">  {/* 16px */}
<View className="py-xl">  {/* 20px */}

// All padding
<View className="p-md">   {/* 12px all sides */}

// Gap (for flex)
<View className="gap-lg"> {/* 16px gap */}
```

## Border Radius

| Token | Value |
| ----- | ----- |
| sm    | 8px   |
| md    | 12px  |
| lg    | 16px  |
| xl    | 20px  |
| 2xl   | 24px  |

### Usage Classes

```tsx
<View className="rounded-sm">   {/* 8px */}
<View className="rounded-md">   {/* 12px */}
<View className="rounded-lg">   {/* 16px */}
<View className="rounded-xl">   {/* 20px */}
<View className="rounded-2xl">  {/* 24px */}
```

## Shadows

| Shadow | Specification                           |
| ------ | --------------------------------------- |
| Card   | `0px 10px 30px rgba(13, 19, 43, 0.06)`  |
| Button | `0px 8px 18px rgba(108, 78, 245, 0.22)` |
| Small  | `0px 2px 8px rgba(13, 19, 43, 0.04)`    |
| Medium | `0px 4px 12px rgba(13, 19, 43, 0.08)`   |
| Large  | `0px 8px 24px rgba(13, 19, 43, 0.12)`   |

### Usage Classes

```tsx
<View className="shadow-card">   {/* Card shadow */}
<View className="shadow-button"> {/* Button shadow */}
<View className="shadow-sm">     {/* Small shadow */}
<View className="shadow-md">     {/* Medium shadow */}
<View className="shadow-lg">     {/* Large shadow */}
```

## Component Utilities

### Cards

```tsx
<View className="card">
  {/* Content */}
</View>

<View className="card-pressed">   {/* Reduced shadow on press */}
<View className="card-elevated">  {/* Elevated shadow */}
```

### Buttons

```tsx
// Primary Button
<TouchableOpacity className="btn-primary">
  <Text className="btn-primary-text">Click Me</Text>
</TouchableOpacity>

// Secondary Button
<TouchableOpacity className="btn-secondary">
  <Text className="btn-secondary-text">Click Me</Text>
</TouchableOpacity>

// Tertiary Button
<TouchableOpacity className="btn-tertiary">
  <Text className="btn-tertiary-text">Click Me</Text>
</TouchableOpacity>

// Icon Button
<TouchableOpacity className="btn-icon">
  {/* Icon */}
</TouchableOpacity>

// Disabled Button
<TouchableOpacity className="btn-primary-disabled">
  <Text className="btn-primary-disabled-text">Disabled</Text>
</TouchableOpacity>
```

### Screens

```tsx
<SafeAreaView style={{ flex: 1, backgroundColor: colors.neutral.background }}>
  <View className="screen">
    <View className="container">{/* Content */}</View>
  </View>
</SafeAreaView>
```

## Color Usage Classes

### Background Colors

```tsx
<View className="bg-lingua-purple" />     {/* Brand purple */}
<View className="bg-lingua-blue" />       {/* Brand blue */}
<View className="bg-lingua-green" />      {/* Brand green */}
<View className="bg-success" />           {/* Success color */}
<View className="bg-warning" />           {/* Warning color */}
<View className="bg-error" />             {/* Error color */}
<View className="bg-surface" />           {/* Surface background */}
```

### Text Colors

```tsx
<Text className="text-lingua-purple" />   {/* Brand purple */}
<Text className="text-text-primary" />    {/* Primary text */}
<Text className="text-text-secondary" />  {/* Secondary text */}
<Text className="text-success" />         {/* Success text */}
<Text className="text-error" />           {/* Error text */}
```

### Border Colors

```tsx
<View className="border border-lingua-purple" />   {/* Brand purple border */}
<View className="border border-border" />          {/* Default border */}
<View className="border border-error" />           {/* Error border */}
```

## Font Weight Classes

```tsx
<Text className="font-poppins">           {/* Regular 400 */}
<Text className="font-poppins-medium" />  {/* Medium 500 */}
<Text className="font-poppins-semibold" />{/* SemiBold 600 */}
<Text className="font-poppins-bold" />    {/* Bold 700 */}
```

## Interactive States

```tsx
// Scale effect on press
<TouchableOpacity className="interactive-scale">
  {/* Content */}
</TouchableOpacity>

// Opacity effect on press
<TouchableOpacity className="interactive-opacity">
  {/* Content */}
</TouchableOpacity>

// Disabled state
<View className="disabled-opacity">
  {/* Disabled content */}
</View>
```

## Exporting & Using Theme

### In Components

```tsx
import { colors, radius, spacing, fontFamily } from "@/theme";

const MyComponent = () => {
  return (
    <View style={{ padding: spacing[4], borderRadius: radius.md }}>
      <Text style={{ color: colors.neutral.textPrimary }}>Hello</Text>
    </View>
  );
};
```

### With Classes

```tsx
import { colors } from "@/theme";

const MyComponent = () => {
  return (
    <View className="p-lg rounded-md bg-surface">
      <Text className="body-lg text-text-primary">Hello</Text>
    </View>
  );
};
```

## Font Loading

Fonts are automatically loaded in the root layout (`_layout.tsx`) using the `useAppFonts()` hook from `@/theme/fonts.ts`. The app waits for fonts to load before rendering any content.

## Best Practices

1. **Always use design tokens** - Avoid hardcoded colors, sizes, or spacing
2. **Use semantic colors** - Use `success`, `error`, `warning` instead of brand colors for actions
3. **Follow typography hierarchy** - Use the correct heading levels (H1, H2, H3, H4)
4. **Consistent spacing** - Always use spacing tokens from the scale
5. **Shadow usage** - Use `card` shadow for elevation, `button` for interactive elements
6. **Brand consistency** - Primary actions should use `lingua-purple`
7. **Accessibility** - Ensure sufficient color contrast for text
8. **Responsive design** - Test on different screen sizes and devices

## Customization

To customize the design system:

1. **Update Colors**: Edit `src/theme/colors.ts`
2. **Update Typography**: Edit `src/theme/typography.ts`
3. **Update Spacing/Radius**: Edit `src/theme/spacing.ts`
4. **Add New Utilities**: Edit `global.css` and add new `@layer utilities`
5. **Update Font Loading**: Edit `src/theme/fonts.ts`

All changes are automatically reflected throughout the app via NativeWind class utilities and TypeScript exports.
