---
name: flora-3form-growth-workflow
description: Standard 3-form procedural vector growth workflow (Basic, Advanced, Majestic) for all plant items on isometric lands based on focus time (0-60m, 60-90/120m, 120-180m max), modeled after the Forest focus app.
---

# Flora 3-Form Growth Workflow (Parametric 2D Vector Rig)

This skill defines the standardized mechanism, mathematical geometry, and rendering workflow for all plant/tree items that grow on Hatching isometric lands.

---

## 🌟 Core Architecture Principle: Parametric Scalloped Pagoda Rig

All flora on Hatching floating islands are generated via the **Skia Parametric 2D Vector Rig**.

### Key Advantages:
1. **100% Continuous Cascading Growth**: As focus progress runs from $0\% \to 100\%$, tiers unfurl and cascade downward like an opening parasol.
2. **Faithful Stylized Aesthetic**: Golden honey amber radial scalloped petal tiers, glossy top jelly dome with specular beads, and flared 5-toe wooden root feet.
3. **Infinite Crisp Resolution & Zero Overhead**: Rendered directly on the GPU via `@shopify/react-native-skia` running at 60/120 FPS with 0 KB asset footprint.

---

## 🌳 1. Focus Time Growth Tiers (3-Form Progression)

| Growth Form | Focus Duration Range | Physical Geometry & Structure | Scale Multiplier |
| :--- | :--- | :--- | :--- |
| **Form 1: Basic (基础幼态)** | **$10\text{m} - 59\text{m}$** | Top Glossy Jelly Dome + Tier 1 (Upper Frills) + Tier 2 (Mid Frills). Slender wooden trunk. | $0.95\times$ |
| **Form 2: Advanced (繁茂成态)** | **$60\text{m} - 119\text{m}$** | Dome + Tier 1 + Tier 2 + Tier 3 (Lower-Mid Frills). Thicker trunk with 3-point flare. | $1.30\times$ |
| **Form 3: Majestic (极境神木态)** | **$120\text{m} - 180\text{m}$ (Max)** | Full 5 Tiers (Dome + T1 + T2 + T3 + T4 Grand Skirt) + Full 5-toe flared root base + Floating golden fairy fireflies. | $1.65\times$ |

---

## 📐 2. Parametric Geometry Functions (`GroveActors.tsx`)

### A. Radial Scalloped Petal Tier (`scallopTierPath`):
Generates an umbrella canopy tier with $N$ rounded scalloped petal lobes:
$$r(\theta) = R + \text{petalDepth} \cdot \cos\left(\frac{2\theta - (\theta_{start} + \theta_{end})}{2}\right)$$

### B. Top Glossy Dome Cap (`topDomePath` & `jellyHighlightBandPath`):
* Smooth hemispherical top cap with crescent translucent highlight band (`rgba(255, 252, 210, 0.45)`) and specular droplet beads.

### C. Flared Wooden Trunk (`flaredTrunkPath`):
* Tapered waist with 5 organic root toe claws spreading across the isometric diamond tile.

---

## 🎨 3. Golden Amber Sunset Palette Specs

| Tier Component | Fill Color | Stroke Border | Details |
| :--- | :--- | :--- | :--- |
| **Top Dome** | `#FFDF38` | `#E5B800` | Glossy jelly ribbon + specular white dots |
| **Tier 1 (Upper Frills)** | `#F2BF15` | `#D49D08` | 9 Scalloped Petal Lobes |
| **Tier 2 (Mid Frills)** | `#EAA512` | `#CB8208` | 11 Scalloped Petal Lobes |
| **Tier 3 (Lower Frills)** | `#E08C0F` | `#B86806` | 13 Scalloped Petal Lobes |
| **Tier 4 (Grand Skirt)** | `#D26D0A` | `#A64A04` | 17 Scalloped Petal Lobes |
| **Flared Trunk** | `#5C3214` | `#3E1F09` | Vertical grain lines & 5 root toes |

---

## 📱 4. Depth Sorting & Layering Contract
All procedural trees are depth sorted in Layer B against walking creatures:
$$\text{depth} = (tree.x + tree.y) \times 2 + 1.0$$
* Always rendered after solid ground foundation (Layer A).
