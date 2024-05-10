import Gio from '@girs/gio-2.0';
import colorString from 'color-string';

// Calculate luminance and determine whether the color is dark or light
export function isDark(color: string): boolean {
  const [r, g, b, _] = colorString.get.rgb(color) ?? [0, 0, 0, 0];

  function calculateChannel(c: number) {
    c /= 255.0;
    return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  }

  const L = 0.2126 * calculateChannel(r) + 0.7152 * calculateChannel(g) + 0.0722 * calculateChannel(b);
  return L < 0.179;
}

export function mixColor(color1: string, color2: string): string {
  const [r1, g1, b1, _] = colorString.get.rgb(color1);
  const [r2, g2, b2, a] = colorString.get.rgb(color2);

  const r = r1 * (1 - a) + r2 * a;
  const g = g1 * (1 - a) + g2 * a;
  const b = b1 * (1 - a) + b2 * a;

  return colorString.to.rgb(r, g, b);
}

export function getItemBackgroundColor(settings: Gio.Settings, headerColor: string, bodyColor: string | null): string {
  const windowColor = settings.get_boolean('is-in-incognito')
    ? settings.get_string('incognito-window-background-color')
    : settings.get_string('window-background-color');

  if (settings.get_boolean('enable-headers')) {
    return mixColor(windowColor, headerColor);
  } else if (bodyColor === null) {
    return windowColor;
  } else {
    return mixColor(windowColor, bodyColor);
  }
}
