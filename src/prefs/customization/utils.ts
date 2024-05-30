import Adw from '@girs/adw-1';
import Gdk4 from '@girs/gdk-4.0';
import Gio from '@girs/gio-2.0';
import Gtk4 from '@girs/gtk-4.0';
import Pango from '@girs/pango-1.0';
import { logger } from '@pano/utils/shell';

const debug = logger('utils');

export type ChangeCallback<T> = (value: T) => void | Promise<void>;

export const createSwitchRow = (
  title: string,
  subtitle: string,
  settings: Gio.Settings,
  schemaKey: string,
  changeCallback?: ChangeCallback<boolean>,
  refreshButtonCallback?: () => void,
): [Adw.ActionRow, Gtk4.Switch, Gtk4.Button, null | Gtk4.Button] => {
  const row = new Adw.ActionRow({
    title,
    subtitle,
  });

  let refreshButton: null | Gtk4.Button = null;

  if (refreshButtonCallback !== undefined) {
    refreshButton = new Gtk4.Button({
      iconName: 'view-refresh-symbolic',
      valign: Gtk4.Align.CENTER,
      halign: Gtk4.Align.CENTER,
    });

    refreshButton.connect('clicked', () => {
      refreshButtonCallback();
    });

    row.add_suffix(refreshButton);
  }

  const initialValue = settings.get_boolean(schemaKey);

  const switch_ = new Gtk4.Switch({
    active: initialValue,
    state: initialValue,
    valign: Gtk4.Align.CENTER,
    halign: Gtk4.Align.CENTER,
  });

  settings.bind(schemaKey, switch_, 'active', Gio.SettingsBindFlags.DEFAULT);

  row.add_suffix(switch_);
  row.set_activatable_widget(switch_);

  const clearButton = new Gtk4.Button({
    iconName: 'edit-clear-symbolic',
    valign: Gtk4.Align.CENTER,
    halign: Gtk4.Align.CENTER,
  });

  const defaultValue = settings.get_default_value(schemaKey)?.get_boolean();

  if (defaultValue === initialValue) {
    clearButton.sensitive = false;
  }

  settings.connect(`changed::${schemaKey}`, () => {
    const value = settings.get_boolean(schemaKey);
    if (defaultValue === value) {
      clearButton.sensitive = false;
    } else {
      clearButton.sensitive = true;
    }

    switch_.active = value;

    if (changeCallback) {
      Promise.resolve(changeCallback(value))
        .then(() => {
          switch_.state = value;
          row.changed();
        })
        .catch((err) => {
          debug(`An error occurred in the changeCallback: ${err}`);
        });
    }
  });

  clearButton.connect('clicked', () => {
    settings.reset(schemaKey);
  });

  row.add_suffix(clearButton);

  return [row, switch_, clearButton, refreshButton];
};

export const createColorRow = (title: string, subtitle: string, settings: Gio.Settings, schemaKey: string) => {
  const colorRow = new Adw.ActionRow({
    title,
    subtitle,
  });

  const colorButton = new Gtk4.ColorButton({
    title,
    valign: Gtk4.Align.CENTER,
    halign: Gtk4.Align.CENTER,
    useAlpha: true,
  });

  const rgba = new Gdk4.RGBA();
  const colorResult = settings.get_string(schemaKey);
  if (!colorResult) {
    throw new Error(`no string setting stored for key: ${schemaKey}`);
  }
  rgba.parse(colorResult);
  colorButton.set_rgba(rgba);

  colorButton.connect('color-set', () => {
    const color = colorButton.get_rgba();
    const colorString = color.to_string();
    if (!colorString) {
      throw new Error(`couldn't convert color to string: ${color}`);
    }
    settings.set_string(schemaKey, colorString);
  });

  colorRow.add_suffix(colorButton);
  colorRow.set_activatable_widget(colorButton);

  const clearButton = new Gtk4.Button({
    iconName: 'edit-clear-symbolic',
    valign: Gtk4.Align.CENTER,
    halign: Gtk4.Align.CENTER,
  });

  const initialValue = settings.get_string(schemaKey);
  const defaultValue = settings.get_default_value(schemaKey)?.get_string()[0];

  if (defaultValue === initialValue) {
    clearButton.sensitive = false;
  }

  settings.connect(`changed::${schemaKey}`, () => {
    const value = settings.get_string(schemaKey);
    if (!value) {
      throw new Error(`no string setting stored for key: ${schemaKey}`);
    }

    if (defaultValue === value) {
      clearButton.sensitive = false;
    } else {
      clearButton.sensitive = true;
    }

    const newRgba = new Gdk4.RGBA();
    newRgba.parse(value);
    colorButton.set_rgba(newRgba);
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

  const initialValue = settings.get_int(schemaKey);

  const spinButton = new Gtk4.SpinButton({
    adjustment: new Gtk4.Adjustment({ stepIncrement: increment, lower, upper }),
    value: initialValue,
    valign: Gtk4.Align.CENTER,
    halign: Gtk4.Align.CENTER,
  });

  settings.bind(schemaKey, spinButton, 'value', Gio.SettingsBindFlags.DEFAULT);

  row.add_suffix(spinButton);
  row.set_activatable_widget(spinButton);

  const clearButton = new Gtk4.Button({
    iconName: 'edit-clear-symbolic',
    valign: Gtk4.Align.CENTER,
    halign: Gtk4.Align.CENTER,
  });

  const defaultValue = settings.get_default_value(schemaKey)?.get_int32();

  if (defaultValue === initialValue) {
    clearButton.sensitive = false;
  }

  settings.connect(`changed::${schemaKey}`, () => {
    const value = settings.get_int(schemaKey);
    if (defaultValue === value) {
      clearButton.sensitive = false;
    } else {
      clearButton.sensitive = true;
    }

    spinButton.value = value;
  });

  clearButton.connect('clicked', () => {
    settings.reset(schemaKey);
  });

  row.add_suffix(clearButton);

  return row;
};

export const createScaleRow = (
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

  const initialValue = settings.get_double(schemaKey);

  const scale = new Gtk4.Scale({
    adjustment: new Gtk4.Adjustment({ stepIncrement: increment, lower, upper }),
    drawValue: true,
    valuePos: Gtk4.PositionType.BOTTOM,
    digits: 2,
    orientation: Gtk4.Orientation.HORIZONTAL,
    valign: Gtk4.Align.CENTER,
    halign: Gtk4.Align.CENTER,
  });

  scale.set_value(initialValue);

  scale.connect('value-changed', () => {
    const value = scale.get_value();
    settings.set_double(schemaKey, value);
  });

  row.add_suffix(scale);
  row.set_activatable_widget(scale);

  const clearButton = new Gtk4.Button({
    iconName: 'edit-clear-symbolic',
    valign: Gtk4.Align.CENTER,
    halign: Gtk4.Align.CENTER,
  });

  const defaultValue = settings.get_default_value(schemaKey)?.get_double();

  if (defaultValue === initialValue) {
    clearButton.sensitive = false;
  }

  settings.connect(`changed::${schemaKey}`, () => {
    const value = settings.get_double(schemaKey);
    if (defaultValue === value) {
      clearButton.sensitive = false;
    } else {
      clearButton.sensitive = true;
    }

    scale.set_value(value);
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
    useFont: true,
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
    iconName: 'edit-clear-symbolic',
    valign: Gtk4.Align.CENTER,
    halign: Gtk4.Align.CENTER,
  });

  const initialValue = getFont();
  const defaultValue = getDefaultFont();

  if (defaultValue === initialValue) {
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
  changeCallback?: ChangeCallback<string>,
): [Adw.ActionRow, Gtk4.DropDown] => {
  const row = new Adw.ActionRow({
    title,
    subtitle,
  });

  const initialValue = settings.get_uint(schemaKey);

  const dropDown = new Gtk4.DropDown({
    valign: Gtk4.Align.CENTER,
    halign: Gtk4.Align.CENTER,
    model: Gtk4.StringList.new(options),
  });

  dropDown.set_selected(initialValue);

  dropDown.connect('notify::selected', () => {
    settings.set_uint(schemaKey, dropDown.get_selected());
  });

  row.add_suffix(dropDown);
  row.set_activatable_widget(dropDown);

  const clearButton = new Gtk4.Button({
    iconName: 'edit-clear-symbolic',
    valign: Gtk4.Align.CENTER,
    halign: Gtk4.Align.CENTER,
  });

  const defaultValue = settings.get_default_value(schemaKey)?.get_uint32();

  if (defaultValue === initialValue) {
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
    const stringValue = options[value];
    if (stringValue) {
      if (changeCallback) {
        Promise.resolve(changeCallback(stringValue))
          .then(() => {})
          .catch((err) => {
            debug(`An error occurred in the changeCallback: ${err}`);
          });
      }
    }
  });

  clearButton.connect('clicked', () => {
    settings.reset(schemaKey);
    dropDown.set_selected(defaultValue || 0);
  });

  row.add_suffix(clearButton);

  return [row, dropDown];
};
