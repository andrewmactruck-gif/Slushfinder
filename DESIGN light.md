---
name: Glacial Aurora
colors:
  surface: '#f3fbfc'
  surface-dim: '#d4dbdd'
  surface-bright: '#f3fbfc'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#edf5f7'
  surface-container: '#e8eff1'
  surface-container-high: '#e2e9eb'
  surface-container-highest: '#dce4e5'
  on-surface: '#151d1e'
  on-surface-variant: '#3b494c'
  inverse-surface: '#2a3233'
  inverse-on-surface: '#eaf2f4'
  outline: '#6b7a7d'
  outline-variant: '#bac9cc'
  surface-tint: '#006875'
  primary: '#006875'
  on-primary: '#ffffff'
  primary-container: '#00e5ff'
  on-primary-container: '#00626e'
  inverse-primary: '#00daf3'
  secondary: '#6c33db'
  on-secondary: '#ffffff'
  secondary-container: '#8651f5'
  on-secondary-container: '#fffbff'
  tertiary: '#a900a9'
  on-tertiary: '#ffffff'
  tertiary-container: '#ffbbf3'
  on-tertiary-container: '#a0009f'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#9cf0ff'
  primary-fixed-dim: '#00daf3'
  on-primary-fixed: '#001f24'
  on-primary-fixed-variant: '#004f58'
  secondary-fixed: '#e9ddff'
  secondary-fixed-dim: '#d1bcff'
  on-secondary-fixed: '#23005b'
  on-secondary-fixed-variant: '#5609c5'
  tertiary-fixed: '#ffd7f5'
  tertiary-fixed-dim: '#ffabf3'
  on-tertiary-fixed: '#380038'
  on-tertiary-fixed-variant: '#810081'
  background: '#f3fbfc'
  on-background: '#151d1e'
  surface-variant: '#dce4e5'
typography:
  headline-xl:
    fontFamily: Space Grotesk
    fontSize: 48px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  headline-xl-mobile:
    fontFamily: Space Grotesk
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Space Grotesk
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.2'
  headline-md:
    fontFamily: Space Grotesk
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.3'
  body-lg:
    fontFamily: Space Grotesk
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Space Grotesk
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
  label-sm:
    fontFamily: Space Grotesk
    fontSize: 13px
    fontWeight: '600'
    lineHeight: '1'
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  xs: 4px
  sm: 12px
  md: 24px
  lg: 48px
  xl: 80px
  container-max: 1280px
  gutter: 24px
---

## Brand & Style

The design system is a sophisticated, light-mode exploration of the "Slushy" aesthetic, trading high-energy dark tones for a premium, refreshing clarity. It targets a modern audience that values high-tech precision balanced with organic, fluid visual interest.

The style is a hybrid of **Glassmorphism** and **Minimalism**. It utilizes a "non-white" philosophy to reduce eye strain and provide a more tactile, physical feel to the digital interface. The emotional response should be one of "cool sophistication"—like looking through a clean block of arctic ice at a vibrant aurora borealis. All interfaces should feel layered, airy, and expensive.

## Colors

The palette is anchored by **Glacial Frost** tones, specifically avoiding #FFFFFF to maintain a soft, premium atmosphere. 

- **Primary Surface**: #F0F4F8 serves as the base canvas.
- **Surface Tiers**: Use #E1E9F0 for secondary containers and #F0F7F7 for subtle highlights to create depth without relying on shadows.
- **Aurora Accents**: 
  - **Teal (#00E5FF)**: Used for primary actions and success states.
  - **Purple (#5400C3)**: Used for secondary actions and structural accents.
  - **Magenta (#FF00FF)**: Used sparingly for high-attention callouts and decorative gradients.
- **Typography**: Deep Indigo (#1A1C2E) ensures maximum legibility and a grounded feeling against the airy backgrounds.

## Typography

The design system utilizes **Space Grotesk** across all roles to lean into its technical, geometric nature. The font’s unique apertures and spurs provide the "creative" edge required for the brand.

Headlines should use tight tracking and heavy weights to command attention against the soft glacial backgrounds. Body text is kept spacious with a generous line height to ensure breathability. For labels, use uppercase with increased tracking to create a disciplined, "pro" aesthetic.

## Layout & Spacing

The layout follows a **fluid grid** model with a hard 8px rhythmic baseline. 

- **Desktop**: 12-column grid with 24px gutters and 48px side margins.
- **Tablet**: 8-column grid with 24px gutters and 32px side margins.
- **Mobile**: 4-column grid with 16px gutters and 16px side margins.

Horizontal spacing is generous to emphasize the "refreshing" brand pillar. Content should be grouped in floating containers rather than edge-to-edge blocks to maintain the light, airy feel of the glacial aesthetic.

## Elevation & Depth

Depth is achieved through **Glassmorphism** and tonal layering rather than traditional black shadows.

- **The Glass Layer**: Use semi-transparent white overlays (rgba(255, 255, 255, 0.2)) paired with a heavy `backdrop-filter: blur(20px)`. This creates the "ice" effect over background gradients or imagery.
- **Tonal Tiers**: Elements are elevated by shifting from the primary surface (#F0F4F8) to a slightly lighter, more luminous frost tone.
- **Inner Glow**: Higher-priority elements utilize a subtle 1px inner border in pure white at 40% opacity to simulate light catching the edge of a glass pane.
- **Soft Ambient Shadows**: When necessary for extreme focus (like modals), use a very large, ultra-soft shadow tinted with the Purple accent color at 5% opacity.

## Shapes

The design system utilizes a **Rounded (8px base)** shape language. This softens the technical nature of Space Grotesk and aligns with the "slushy" fluid brand narrative.

- **Standard Elements (Buttons, Inputs)**: 0.5rem (8px).
- **Large Containers (Cards, Modals)**: 1rem (16px).
- **Extra Large (Feature Blocks)**: 1.5rem (24px).
- **Decorative Elements**: Can use full "pill" rounding to contrast against the structured grid.

## Components

### Buttons
- **Primary**: Gradient fill (Teal to Purple at 45°), Deep Indigo text, 8px radius.
- **Secondary**: Frosted glass background (White/20), 1px solid Teal border, Deep Indigo text.
- **Tertiary**: No background, Purple text, heavy weight.

### Cards & Containers
Cards must use the frosted glass effect. Apply a 1px border in #E1E9F0. When hovered, the border should transition to the Teal accent.

### Input Fields
Inputs use a slightly recessed tonal color (#E1E9F0) with no border in resting state. On focus, they animate a 2px Teal border and a very soft 10px outer glow of the same color.

### Chips & Tags
Small, pill-shaped elements with a background of #F0F7F7 and a 1px border of #D1D9E0. Use the Purple accent for the label text to make them pop against the glacial surface.

### Interactive States
All interactive elements should feel "active." Use slight scale-up transforms (1.02x) and subtle shifts in backdrop-blur intensity to provide haptic-like visual feedback.