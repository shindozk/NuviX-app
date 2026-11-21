# NuviX Assets

This directory contains the app's assets.

## Required Files (generate using `npm run generate:icons`)

- `icon.png` - Main app icon (1024x1024px recommended)
- `android-icon-foreground.png` - Android foreground icon
- `android-icon-background.png` - Android background icon
- `android-icon-monochrome.png` - Monochrome Android icon
- `splash-icon.png` - Splash screen icon
- `favicon.png` - Web favicon (48x48px)

## Cloud Gaming Assets

- `boot.mp4` - Boot animation video

## Generating Icons

Run the following command to generate all required icons:

```bash
npm run generate:icons
```

This will create all icons from the SVG template with proper sizing and backgrounds.