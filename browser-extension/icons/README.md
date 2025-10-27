# Extension Icons

You need to add 4 PNG icon files here:

- `icon-16.png` - 16x16px (browser toolbar)
- `icon-32.png` - 32x32px (browser toolbar retina)
- `icon-48.png` - 48x48px (extension management)
- `icon-128.png` - 128x128px (Chrome Web Store)

## Design Guidelines

- **Theme**: Earth/globe icon with green color scheme
- **Style**: Modern, clean, recognizable at small sizes
- **Colors**: Use DataForEarth brand colors (green: #10b981)
- **Background**: Transparent or solid color

## Quick Generation Options

### Option 1: Use Canva (Free)
1. Go to Canva.com
2. Create custom size canvas (128x128px)
3. Add globe icon + green accent
4. Export as PNG
5. Resize for other sizes

### Option 2: Use Figma (Free)
1. Create 128x128px frame
2. Design icon with globe/earth theme
3. Export @1x, @0.5x, @0.375x, @0.125x

### Option 3: Use AI Image Generator
Prompt: "Simple flat icon of a green Earth globe, minimalist style, transparent background, suitable for browser extension, 512x512px"

Then resize to required sizes using:
- https://www.iloveimg.com/resize-image
- Or ImageMagick: `convert icon-512.png -resize 128x128 icon-128.png`

## Current Status
🚫 Icons missing - extension won't work without them!

Add your icons here and the extension will be ready to load.
