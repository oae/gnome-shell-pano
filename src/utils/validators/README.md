# Color Validators

This module provides color validation utilities as a replacement for the `validate-color` npm package.

## Why This Replacement?

The original `validate-color` package (v2.2.4) uses a webpack-bundled CommonJS format that caused compatibility issues with Rollup's ES module bundling:

- **Error**: `SyntaxError: ambiguous indirect export: validateHTMLColorHex`
- **Root Cause**: The package's webpack bundle made it difficult for Rollup to properly extract named exports
- **Solution**: Implement the validation logic locally using simple regex patterns

## Benefits

✅ **No bundling issues** - Native ES modules work perfectly with Rollup  
✅ **Smaller bundle size** - Only includes what we need  
✅ **Easier to maintain** - Simple, readable regex patterns  
✅ **No external dependencies** - One less package to worry about  
✅ **Better performance** - Direct regex checks without library overhead  

## API

### `validateHTMLColorHex(color: string): boolean`

Validates hexadecimal color format.

**Supported formats:**
- `#RGB` (e.g., `#f00`)
- `#RRGGBB` (e.g., `#ff0000`)
- `#RGBA` (e.g., `#ff0000ff`)
- `#RRGGBBAA` (e.g., `#ff0000ff`)

**Examples:**
```typescript
validateHTMLColorHex('#ff0000')     // true
validateHTMLColorHex('#f00')        // true
validateHTMLColorHex('#ff0000ff')   // true
validateHTMLColorHex('red')         // false
validateHTMLColorHex('rgb(255,0,0)') // false
```

### `validateHTMLColorRgb(color: string): boolean`

Validates RGB/RGBA color format.

**Supported formats:**
- `rgb(r, g, b)` - with or without spaces
- `rgba(r, g, b, a)` - with or without spaces
- Supports percentages (e.g., `rgb(100%, 0%, 0%)`)
- Supports modern CSS syntax with `/` separator

**Examples:**
```typescript
validateHTMLColorRgb('rgb(255, 0, 0)')      // true
validateHTMLColorRgb('rgba(255, 0, 0, 1)')  // true
validateHTMLColorRgb('rgb(100%, 0%, 0%)')   // true
validateHTMLColorRgb('rgba(255 0 0 / 0.5)') // true
validateHTMLColorRgb('#ff0000')             // false
```

### `validateHTMLColorName(color: string): boolean`

Validates HTML color names (case-insensitive).

**Supports:**
- All 147 standard HTML/CSS color names (e.g., `red`, `blue`, `cornflowerblue`)
- CSS special keywords: `transparent`, `currentcolor`, `inherit`

**Examples:**
```typescript
validateHTMLColorName('red')           // true
validateHTMLColorName('CornflowerBlue') // true
validateHTMLColorName('transparent')   // true
validateHTMLColorName('#ff0000')       // false
validateHTMLColorName('notacolor')     // false
```

## Usage in Pano

These validators are used in `panoItemFactory.ts` to detect when copied text is a color value:

1. When text is copied to clipboard, Pano checks if it's a valid color
2. If valid, it creates a `COLOR` type item instead of a `TEXT` item
3. The color item gets special visual treatment (color swatch preview)
4. Notifications display the actual color when a color is copied

## Limitations

This implementation focuses on the most common color formats used in web development:
- ✅ Hex colors (`#RGB`, `#RRGGBB`, `#RGBA`, `#RRGGBBAA`)
- ✅ RGB/RGBA colors
- ✅ Named colors (147 standard HTML/CSS names)
- ❌ HSL/HSLA colors (not currently needed)
- ❌ HWB colors (not currently needed)
- ❌ LAB/LCH colors (not currently needed)

If additional color formats are needed in the future, they can be easily added following the same pattern.

## Migration Notes

**Before (using validate-color package):**
```typescript
import { validateHTMLColorHex, validateHTMLColorName, validateHTMLColorRgb } from 'validate-color';
```

**After (using local validators):**
```typescript
import { validateHTMLColorHex, validateHTMLColorName, validateHTMLColorRgb } from '@pano/utils/validators/colorValidator';
```

The API is identical, so no code changes were needed beyond the import statement.