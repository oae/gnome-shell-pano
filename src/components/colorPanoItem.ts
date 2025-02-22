import Clutter from '@girs/clutter-16';
import Gio from '@girs/gio-2.0';
import type { ExtensionBase } from '@girs/gnome-shell/dist/extensions/sharedInternals';
import St from '@girs/st-16';
import { PanoItem } from '@pano/components/panoItem';
import { ClipboardContent, ClipboardManager, ContentType } from '@pano/utils/clipboardManager';
import { DBItem } from '@pano/utils/db';
import { registerGObjectClass } from '@pano/utils/gjs';
import { orientationCompatibility } from '@pano/utils/shell_compatibility';
import * as colorString from 'color-string';

@registerGObjectClass
export class ColorPanoItem extends PanoItem {
  private colorItemSettings: Gio.Settings;
  private colorContainer: St.BoxLayout;
  private icon: St.Icon;
  private label: St.Label;

  constructor(ext: ExtensionBase, clipboardManager: ClipboardManager, dbItem: DBItem) {
    super(ext, clipboardManager, dbItem);

    this.colorItemSettings = this.settings.get_child('color-item');

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

    // Calculate the luminance to determine the icon and text color with sufficient contrast
    const rgb = colorString.get.rgb(this.dbItem.content) ?? [0, 0, 0, 0];
    const L =
      0.2126 * this.calculateChannel(rgb[0]) +
      0.7152 * this.calculateChannel(rgb[1]) +
      0.0722 * this.calculateChannel(rgb[2]);

    const delta = L > 0.179 ? -30 : 30;
    const iconColor = `rgb(${Math.clamp(rgb[0] + delta, 0, 255)}, ${Math.clamp(rgb[1] + delta, 0, 255)}, ${Math.clamp(rgb[2] + delta, 0, 255)})`;
    const textColor = L > 0.179 ? '#000000' : '#ffffff';

    this.header.set_style(`background-color: ${headerBgColor}; color: ${headerColor};`);
    this.container.set_style(`background-color: ${this.dbItem.content};`);
    this.icon.set_style(`color: ${iconColor};`);
    this.label.set_style(`color: ${textColor}; font-family: ${metadataFontFamily}; font-size: ${metadataFontSize}px;`);
  }

  private calculateChannel(c: number) {
    c /= 255.0;
    if (c <= 0.04045) {
      return c / 12.92;
    } else {
      return Math.pow((c + 0.055) / 1.055, 2.4);
    }
  }

  private setClipboardContent(): void {
    this.clipboardManager.setContent(new ClipboardContent({ type: ContentType.TEXT, value: this.dbItem.content }));
  }
}
