import Clutter from '@girs/clutter-14';
import Gio from '@girs/gio-2.0';
import GLib from '@girs/glib-2.0';
import type { ExtensionBase } from '@girs/gnome-shell/dist/extensions/sharedInternals';
import Shell from '@girs/shell-14';
import St from '@girs/st-14';
import { registerGObjectClass } from '@pano/utils/gjs';
import { ICON_PACKS, IPanoItemType } from '@pano/utils/panoItemType';
import { getCurrentExtensionSettings } from '@pano/utils/shell';
import { getHeaderHeight, HEADER_STYLES } from '@pano/utils/ui';
import { Locale } from 'date-fns';
import formatDistanceToNow from 'date-fns/formatDistanceToNow';
import * as dateLocale from 'date-fns/locale';

const langs = GLib.get_language_names_with_category('LC_MESSAGES').map(
  (l) => l.replaceAll('_', '').replaceAll('-', '').split('.')[0],
);
const localeKey = Object.keys(dateLocale).find((key) => langs.includes(key));

type FormatOptions = {
  includeSeconds?: boolean;
  addSuffix?: boolean;
  locale?: Locale;
};

@registerGObjectClass
export class PanoItemHeader extends St.BoxLayout {
  private dateUpdateIntervalId: any;
  private settings: Gio.Settings;
  private icon: St.Icon;
  private titleLabel: St.Label;
  private dateLabel: St.Label;
  private titleContainer: St.BoxLayout;
  private hasCustomIcon: boolean = false;

  constructor(ext: ExtensionBase, itemType: IPanoItemType, date: Date) {
    super({
      styleClass: 'pano-item-header',
      vertical: false,
    });

    this.settings = getCurrentExtensionSettings(ext);

    this.icon = new St.Icon({
      styleClass: 'pano-item-title-icon',
      gicon: Gio.icon_new_for_string(
        `${ext.path}/icons/hicolor/scalable/actions/${ICON_PACKS[this.settings.get_uint('icon-pack')]}-${
          itemType.iconPath
        }`,
      ),
    });

    this.settings.connect('changed::icon-pack', () => {
      if (this.hasCustomIcon) return;

      this.icon.set_gicon(
        Gio.icon_new_for_string(
          `${ext.path}/icons/hicolor/scalable/actions/${ICON_PACKS[this.settings.get_uint('icon-pack')]}-${
            itemType.iconPath
          }`,
        ),
      );
    });

    this.titleContainer = new St.BoxLayout({
      styleClass: 'pano-item-title-container',
      vertical: true,
      xExpand: true,
      xAlign: Clutter.ActorAlign.FILL,
      yAlign: Clutter.ActorAlign.CENTER,
    });

    this.titleLabel = new St.Label({
      text: itemType.title,
      styleClass: 'pano-item-title',
      visible: this.settings.get_uint('header-style') !== HEADER_STYLES.COMPACT,
      xExpand: true,
      yExpand: false,
      xAlign: Clutter.ActorAlign.FILL,
      yAlign: Clutter.ActorAlign.CENTER,
    });

    const options: FormatOptions = {
      addSuffix: true,
    };

    if (localeKey !== undefined) {
      const locale = (dateLocale as Record<string, Locale | undefined>)[localeKey];
      if (locale) {
        options.locale = locale;
      }
    }

    this.dateLabel = new St.Label({
      text: formatDistanceToNow(date, options),
      styleClass: 'pano-item-date',
      xExpand: true,
      yExpand: false,
      xAlign: Clutter.ActorAlign.FILL,
      yAlign: Clutter.ActorAlign.END,
    });

    this.dateUpdateIntervalId = GLib.timeout_add_seconds(GLib.PRIORITY_DEFAULT, 60, () => {
      this.dateLabel.set_text(formatDistanceToNow(date, options));

      return GLib.SOURCE_CONTINUE;
    });

    this.titleContainer.add_child(this.titleLabel);
    this.titleContainer.add_child(this.dateLabel);

    this.add_child(this.icon);
    this.add_child(this.titleContainer);

    const themeContext = St.ThemeContext.get_for_stage(Shell.Global.get().get_stage());

    const size = getHeaderHeight(this.settings.get_uint('header-style'));
    this.set_height(size * themeContext.scaleFactor);
    this.icon.set_width(size * themeContext.scaleFactor);

    themeContext.connect('notify::scale-factor', () => {
      const size = getHeaderHeight(this.settings.get_uint('header-style'));
      this.set_height(size * themeContext.scaleFactor);
      this.icon.set_width(size * themeContext.scaleFactor);
    });

    this.settings.connect('changed::header-style', () => {
      const size = getHeaderHeight(this.settings.get_uint('header-style'));
      this.set_height(size * themeContext.scaleFactor);
      this.icon.set_width(size * themeContext.scaleFactor);
      this.titleLabel.visible = this.settings.get_uint('header-style') !== HEADER_STYLES.COMPACT;
    });

    this.setStyle();
    this.settings.connect('changed::item-title-font-family', this.setStyle.bind(this));
    this.settings.connect('changed::item-title-font-size', this.setStyle.bind(this));
    this.settings.connect('changed::item-date-font-family', this.setStyle.bind(this));
    this.settings.connect('changed::item-date-font-size', this.setStyle.bind(this));
  }

  private setStyle() {
    const itemTitleFontFamily = this.settings.get_string('item-title-font-family');
    const itemTitleFontSize = this.settings.get_int('item-title-font-size');
    const itemDateFontFamily = this.settings.get_string('item-date-font-family');
    const itemDateFontSize = this.settings.get_int('item-date-font-size');
    this.titleLabel.set_style(`font-family: ${itemTitleFontFamily}; font-size: ${itemTitleFontSize}px;`);
    this.dateLabel.set_style(`font-family: ${itemDateFontFamily}; font-size: ${itemDateFontSize}px;`);
  }

  setIcon(icon: Gio.Icon) {
    this.hasCustomIcon = true;
    this.icon.set_gicon(icon);
  }

  override destroy(): void {
    if (this.dateUpdateIntervalId) {
      GLib.source_remove(this.dateUpdateIntervalId);
      this.dateUpdateIntervalId = null;
    }
    super.destroy();
  }
}
