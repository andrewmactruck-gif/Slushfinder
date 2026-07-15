---
name: Slushy Search
colors:
  surface: '#101415'
  surface-dim: '#101415'
  surface-bright: '#363a3b'
  surface-container-lowest: '#0b0f10'
  surface-container-low: '#181c1d'
  surface-container: '#1c2021'
  surface-container-high: '#272b2c'
  surface-container-highest: '#313536'
  on-surface: '#e0e3e4'
  on-surface-variant: '#bac9cc'
  inverse-surface: '#e0e3e4'
  inverse-on-surface: '#2d3132'
  outline: '#849396'
  outline-variant: '#3b494c'
  surface-tint: '#00daf3'
  primary: '#c3f5ff'
  on-primary: '#00363d'
  primary-container: '#00e5ff'
  on-primary-container: '#00626e'
  inverse-primary: '#006875'
  secondary: '#ffabf3'
  on-secondary: '#5b005b'
  secondary-container: '#fe00fe'
  on-secondary-container: '#500050'
  tertiary: '#abffcb'
  on-tertiary: '#003920'
  tertiary-container: '#00ee98'
  on-tertiary-container: '#00673f'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#9cf0ff'
  primary-fixed-dim: '#00daf3'
  on-primary-fixed: '#001f24'
  on-primary-fixed-variant: '#004f58'
  secondary-fixed: '#ffd7f5'
  secondary-fixed-dim: '#ffabf3'
  on-secondary-fixed: '#380038'
  on-secondary-fixed-variant: '#810081'
  tertiary-fixed: '#52ffac'
  tertiary-fixed-dim: '#00e290'
  on-tertiary-fixed: '#002111'
  on-tertiary-fixed-variant: '#005231'
  background: '#101415'
  on-background: '#e0e3e4'
  surface-variant: '#313536'
typography:
  display-lg:
    fontFamily: Space Grotesk
    fontSize: 64px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Space Grotesk
    fontSize: 40px
    fontWeight: '600'
    lineHeight: '1.2'
  headline-lg-mobile:
    fontFamily: Space Grotesk
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.2'
  callout-bubbly:
    fontFamily: Bricolage Grotesque
    fontSize: 24px
    fontWeight: '800'
    lineHeight: '1.2'
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  label-sm:
    fontFamily: Inter
    fontSize: 12px
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
  unit: 8px
  container-max: 1280px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 40px
---

## Brand & Style

This design system establishes a high-contrast, premium "Dark-Neon" aesthetic that balances the professional precision of a high-end search tool with the kinetic energy of a frozen treat brand. The narrative centers on "The Arctic Discovery"—a sophisticated, deep-space environment illuminated by vibrant, organic light sources.

The target audience bridges the gap between Gen-Z/Alpha playfulness and adult technological expectations within the Canadian market. To achieve this, the system blends **Minimalism** (for structure and utility) with **Glassmorphism** and **Vaporwave** accents (for emotional resonance and depth). The atmosphere is cool, crisp, and intellectually stimulating, yet visually rewarding through the use of "Aurora" light leaks and electric accents.

## Colors

The palette is anchored by **Deep Charcoal (#101415)**, providing a limitless, ink-like canvas that emphasizes premium quality. The primary functional color is **Electric Blue (#00e5ff)**, used for high-priority actions and interactive states to simulate a neon glow.

The "Aurora Swirl" is a dynamic gradient logic rather than a single color. It utilizes a mix of the primary Electric Blue, a punchy Magenta (#ff00ff), and an Arctic Teal (#00ffa3).
- **Backgrounds:** Primarily the deep neutral, with large-scale, low-opacity blurred "Aurora" meshes in the corners to prevent visual fatigue.
- **Accents:** Electric Blue is the workhorse for icons, active borders, and primary buttons.
- **Typography:** Stark white for maximum legibility against the dark background, with muted slates for secondary metadata.

## Typography

The typographic strategy uses a "Dual-Personality" framework:
1. **The Infrastructure (Space Grotesk & Inter):** Headlines and body copy are clean, geometric, and technical. Space Grotesk provides a sharp, modernist edge that feels premium and "tech-forward."
2. **The Accent (Bricolage Grotesque):** Used sparingly for callouts, "fun facts," or "Slushy" tips. This font introduces a bubbly, quirky character that appeals to the youth demographic without compromising the overall sophistication of the search experience.

**Implementation Note:** Use tight tracking on Display headers to emphasize the "cold/dense" feel of the brand.

## Layout & Spacing

The system utilizes a **Fluid Grid** logic with a strong emphasis on "Negative Space as Luxury." 
- **Desktop:** 12-column grid with generous 40px margins to allow the Aurora gradients to "breathe" around the content blocks.
- **Mobile:** 4-column grid with 16px margins.
- **Rhythm:** All spacing (padding, margins, gap) must be multiples of 8px. Use larger gaps (64px+) between distinct search categories to maintain a sense of "premium discovery" rather than a cluttered data density.
- **Alignment:** Content is centered-heavy for search-primary views, transitioning to asymmetrical layouts for discovery feeds to keep the experience feeling dynamic and "swirling."

## Elevation & Depth

Depth is achieved through **Glassmorphism** and **Luminescence** rather than traditional shadows.
- **Surface Layering:** The base is the Deep Charcoal. Elevated cards use a semi-transparent fill (`rgba(26, 31, 33, 0.7)`) with a `20px` backdrop-blur.
- **The "Frost" Edge:** Instead of shadows, use a 1px inner border (stroke) with a gradient from `white/20%` to `white/5%` to simulate the edge of a block of ice.
- **Glow Elevation:** Primary interactive elements (like the search bar when focused) should emit a soft Electric Blue outer glow (spread 10px, opacity 30%) to suggest it is "powered on."

## Shapes

The shape language is **"Crystalline yet Fluid."**
- **Container Corners:** Use the `Rounded` setting (0.5rem base) for standard cards to maintain a friendly feel.
- **Primary Inputs:** The main search bar should use the `rounded-xl` (1.5rem) or pill-shape to invite interaction and feel "soft" to the touch.
- **Iconography:** Use thick, 2px stroke weights with rounded ends. Icons should be "Electric Blue" on the dark background to pop.
- **Interactive Elements:** Buttons utilize a slightly more aggressive rounding than cards to differentiate them as tactile objects.

## Components

### Search Bar
The centerpiece of the system. It features a deep charcoal fill, a 1px Electric Blue border, and a persistent "Aurora" glow behind it. On focus, the border thickness increases, and the background blur intensifies.

### Primary Buttons
High-contrast Electric Blue backgrounds with Black text (Space Grotesk Bold). These should feel like "Neon Signs"—highly visible and urgent. Use a slight scale-up animation on hover (1.02x).

### Discovery Chips
Rounded pill-shapes with a dark-glass background and an Electric Blue border. When active, they fill with a gradient (Electric Blue to Teal).

### Search Cards
Minimalist containers with the "Frost Edge" (1px subtle white stroke). Images within cards should have a subtle blue-tinted overlay to harmonize with the dark theme.

### Aurora Sliders
For filtering, use a custom track that transitions through the aurora gradient (Teal to Blue), with a bright white "Ice Cube" handle.

### Lists
Lists are separated by low-opacity "ice-slice" dividers—1px horizontal lines with 10% white opacity, fading out toward the edges.