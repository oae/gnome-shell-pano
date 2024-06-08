import Clutter from '@girs/clutter-16';
import Gio from '@girs/gio-2.0';
import type { ExtensionBase } from '@girs/gnome-shell/dist/extensions/sharedInternals';
import St from '@girs/st-16';
import { PanoItem } from '@pano/components/panoItem';
import { ClipboardContent, ClipboardManager, ContentType } from '@pano/utils/clipboardManager';
import { getItemBackgroundColor, isDark } from '@pano/utils/color';
import { DBItem } from '@pano/utils/db';
import { registerGObjectClass } from '@pano/utils/gjs';
import { orientationCompatibility } from '@pano/utils/shell_compatibility';
import colorString from 'color-string';

@registerGObjectClass
export class ColorPanoItem extends PanoItem {
  private colorItemSettings: Gio.Settings;
  private colorContainer: St.BoxLayout;
  private icon: St.Icon;
  private label: St.Label;

  constructor(ext: ExtensionBase, clipboardManager: ClipboardManager, dbItem: DBItem) {
    super(ext, clipboardManager, dbItem);

    this.colorItemSettings = this.settings.get_child('color-item');

    const color = colorString.to.rgb(colorString.get.rgb(this.dbItem.content) || [0, 0, 0]);
    this.body.set_style(`background-color: ${color};`);

    this.colorContainer = new St.BoxLayout({
      ...orientationCompatibility(true),
      xExpand: true,
      yExpand: true,
      yAlign: Clutter.ActorAlign.CENTER,
      xAlign: Clutter.ActorAlign.FILL,
      styleClass: 'color-container',
    });

    this.icon = new St.Icon({
      xAlign: Clutter.ActorAlign.CENTER,
      yAlign: Clutter.ActorAlign.CENTER,
      styleClass: 'color-icon',
      gicon: Gio.icon_new_for_string(`${ext.path}/icons/hicolor/scalable/actions/blend-tool-symbolic.svg`),
    });

    this.label = new St.Label({
      xAlign: Clutter.ActorAlign.CENTER,
      yAlign: Clutter.ActorAlign.CENTER,
      text: this.dbItem.content,
      styleClass: 'color-label',
    });

    this.colorContainer.add_child(this.icon);
    this.colorContainer.add_child(this.label);

    this.colorContainer.add_constraint(
      new Clutter.AlignConstraint({ source: this, alignAxis: Clutter.AlignAxis.Y_AXIS, factor: 0.005 }),
    );

    this.body.add_child(this.colorContainer);
    this.connect('activated', this.setClipboardContent.bind(this));
    this.setCompactMode();
    this.settings.connect('changed::compact-mode', this.setCompactMode.bind(this));
    this.setStyle();
    this.colorItemSettings.connect('changed', this.setStyle.bind(this));

    // Settings for controls
    this.settings.connect('changed::is-in-incognito', this.setStyle.bind(this));
    this.settings.connect('changed::incognito-window-background-color', this.setStyle.bind(this));
    this.settings.connect('changed::window-background-color', this.setStyle.bind(this));
    this.settings.connect('changed::header-style', this.setStyle.bind(this));
  }

  private setCompactMode() {
    if (this.settings.get_boolean('compact-mode')) {
      this.colorContainer.vertical = false;
    } else {
      this.colorContainer.vertical = true;
    }
  }

  private setStyle() {
    const headerBgColor = this.colorItemSettings.get_string('header-bg-color');
    const headerColor = this.colorItemSettings.get_string('header-color');
    const metadataFontFamily = this.colorItemSettings.get_string('metadata-font-family');
    const metadataFontSize = this.colorItemSettings.get_int('metadata-font-size');

    const dark = isDark(this.dbItem.content);
    const iconColor = dark ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)';
    const textColor = dark ? '#ffffff' : '#000000';

    this.overlay.setControlsBackground(getItemBackgroundColor(this.settings, headerBgColor, null));
    this.header.set_style(`background-color: ${headerBgColor}; color: ${headerColor};`);
    this.icon.set_style(`color: ${iconColor};`);
    this.label.set_style(`color: ${textColor}; font-family: ${metadataFontFamily}; font-size: ${metadataFontSize}px;`);
  }

  private setClipboardContent(): void {
    this.clipboardManager.setContent(new ClipboardContent({ type: ContentType.TEXT, value: this.dbItem.content }));
  }
}
