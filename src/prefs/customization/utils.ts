import Adw from '@girs/adw-1';
import Gdk4 from '@girs/gdk-4.0';
import Gio from '@girs/gio-2.0';
import Gtk4 from '@girs/gtk-4.0';
import Pango from '@girs/pango-1.0';

export const createColorRow = (title: string, subtitle: string, settings: Gio.Settings, schemaKey: string) => {
  const colorRow = new Adw.ActionRow({
    title,
    subtitle,
  });

  const colorButton = new Gtk4.ColorButton({
    title,
    valign: Gtk4.Align.CENTER,
    halign: Gtk4.Align.CENTER,
    use_alpha: true,
  });

  const rgba = new Gdk4.RGBA();
  rgba.parse(settings.get_string(schemaKey));
  colorButton.set_rgba(rgba);

  colorButton.connect('color-set', () => {
    const color = colorButton.get_rgba();
    const colorString = color.to_string();
    settings.set_string(schemaKey, colorString);
  });

  colorRow.add_suffix(colorButton);
  colorRow.set_activatable_widget(colorButton);

  const clearButton = new Gtk4.Button({
    icon_name: 'edit-clear-symbolic',
    valign: Gtk4.Align.CENTER,
    halign: Gtk4.Align.CENTER,
  });

  const value = settings.get_string(schemaKey);
  const defaultValue = settings.get_default_value(schemaKey)?.get_string()[0];

  if (defaultValue === value) {
    clearButton.sensitive = false;
  }

  settings.connect(`changed::${schemaKey}`, () => {
    const value = settings.get_string(schemaKey);
    if (defaultValue === value) {
      clearButton.sensitive = false;
    } else {
      clearButton.sensitive = true;
    }

    const rgba = new Gdk4.RGBA();
    rgba.parse(value);
    colorButton.set_rgba(rgba);
  });

  clearButton.connect('clicked', () => {
    settings.reset(schemaKey);
  });

  colorRow.add_suffix(clearButton);

  return colorRow;
};

export const createSpinRow = (
  title: string,
  subtitle: string,
  settings: Gio.Settings,
  schemaKey: string,
  increment: number,
  lower: number,
  upper: number,
) => {
  const row = new Adw.ActionRow({
    title,
    subtitle,
  });

  const value = settings.get_int(schemaKey);

  const spinButton = new Gtk4.SpinButton({
    adjustment: new Gtk4.Adjustment({ step_increment: increment, lower, upper }),
    value,
    valign: Gtk4.Align.CENTER,
    halign: Gtk4.Align.CENTER,
  });

  settings.bind(schemaKey, spinButton, 'value', Gio.SettingsBindFlags.DEFAULT);

  row.add_suffix(spinButton);
  row.set_activatable_widget(spinButton);

  const clearButton = new Gtk4.Button({
    icon_name: 'edit-clear-symbolic',
    valign: Gtk4.Align.CENTER,
    halign: Gtk4.Align.CENTER,
  });

  const defaultValue = settings.get_default_value(schemaKey)?.get_int32();

  if (defaultValue === value) {
    clearButton.sensitive = false;
  }

  settings.connect(`changed::${schemaKey}`, () => {
    const value = settings.get_int(schemaKey);
    if (defaultValue === value) {
      clearButton.sensitive = false;
    } else {
      clearButton.sensitive = true;
    }
  });

  clearButton.connect('clicked', () => {
    settings.reset(schemaKey);
  });

  row.add_suffix(clearButton);

  return row;
};

export const createFontRow = (title: string, subtitle: string, settings: Gio.Settings, schemaKey: string) => {
  const getFont = () => `${settings.get_string(`${schemaKey}-family`)} ${settings.get_int(`${schemaKey}-size`)}`;
  const getDefaultFont = () =>
    `${settings.get_default_value(`${schemaKey}-family`)?.get_string()[0]} ${settings
      .get_default_value(`${schemaKey}-size`)
      ?.get_int32()}`;

  const fontRow = new Adw.ActionRow({
    title,
    subtitle,
  });

  const fontButton = new Gtk4.FontButton({
    title,
    valign: Gtk4.Align.CENTER,
    halign: Gtk4.Align.CENTER,
    use_font: true,
    font: getFont(),
  });

  fontButton.connect('font-set', () => {
    const fontFamily = fontButton.get_font_family()?.get_name();
    const fontSize = fontButton.get_font_size() / Pango.SCALE;

    settings.set_string(`${schemaKey}-family`, fontFamily || 'Cantarell Regular');
    settings.set_int(`${schemaKey}-size`, fontSize || 11);
  });

  fontRow.add_suffix(fontButton);
  fontRow.set_activatable_widget(fontButton);

  const clearButton = new Gtk4.Button({
    icon_name: 'edit-clear-symbolic',
    valign: Gtk4.Align.CENTER,
    halign: Gtk4.Align.CENTER,
  });

  const value = getFont();
  const defaultValue = getDefaultFont();

  if (defaultValue === value) {
    clearButton.sensitive = false;
  }

  const onChange = () => {
    const value = getFont();
    if (defaultValue === value) {
      clearButton.sensitive = false;
    } else {
      clearButton.sensitive = true;
    }
    fontButton.set_font(value);
  };

  settings.connect(`changed::${schemaKey}-family`, onChange);
  settings.connect(`changed::${schemaKey}-size`, onChange);

  clearButton.connect('clicked', () => {
    settings.reset(`${schemaKey}-family`);
    settings.reset(`${schemaKey}-size`);
  });

  fontRow.add_suffix(clearButton);

  return fontRow;
};

export const createDropdownRow = (
  title: string,
  subtitle: string,
  settings: Gio.Settings,
  schemaKey: string,
  options: string[],
) => {
  const row = new Adw.ActionRow({
    title,
    subtitle,
  });

  const value = settings.get_uint(schemaKey);

  const dropDown = new Gtk4.DropDown({
    valign: Gtk4.Align.CENTER,
    halign: Gtk4.Align.CENTER,
    model: Gtk4.StringList.new(options),
  });

  dropDown.set_selected(value);

  dropDown.connect('notify::selected', () => {
    settings.set_uint(schemaKey, dropDown.get_selected());
  });

  row.add_suffix(dropDown);
  row.set_activatable_widget(dropDown);

  const clearButton = new Gtk4.Button({
    icon_name: 'edit-clear-symbolic',
    valign: Gtk4.Align.CENTER,
    halign: Gtk4.Align.CENTER,
  });

  const defaultValue = settings.get_default_value(schemaKey)?.get_uint32();

  if (defaultValue === value) {
    clearButton.sensitive = false;
  }

  settings.connect(`changed::${schemaKey}`, () => {
    const value = settings.get_uint(schemaKey);
    if (defaultValue === value) {
      clearButton.sensitive = false;
    } else {
      clearButton.sensitive = true;
    }
    dropDown.set_selected(value);
  });

  clearButton.connect('clicked', () => {
    settings.reset(schemaKey);
    dropDown.set_selected(defaultValue || 0);
  });

  row.add_suffix(clearButton);

  return row;
};
