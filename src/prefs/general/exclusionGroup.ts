import Adw from '@girs/adw-1';
import Gio from '@girs/gio-2.0';
import Gtk4 from '@girs/gtk-4.0';
import { ExtensionBase } from '@gnome-shell/extensions/extension';
import { registerGObjectClass } from '@pano/utils/gjs';
import { getCurrentExtensionSettings, gettext } from '@pano/utils/shell';

@registerGObjectClass
export class ExclusionGroup extends Adw.PreferencesGroup {
  private exclusionRow: Adw.ExpanderRow;
  private exclusionButton: Gtk4.Button;
  private settings: Gio.Settings;

  constructor(ext: ExtensionBase) {
    const _ = gettext(ext);
    super({
      title: _('Manage Exclusions'),
      margin_top: 20,
    });

    this.settings = getCurrentExtensionSettings(ext);

    this.exclusionRow = new Adw.ExpanderRow({
      title: _('Excluded Apps'),
      subtitle: _('Pano will stop tracking if any window from the list is focussed'),
    });

    this.exclusionButton = new Gtk4.Button({
      icon_name: 'list-add-symbolic',
      css_classes: ['flat'],
      valign: Gtk4.Align.CENTER,
      halign: Gtk4.Align.CENTER,
    });

    this.exclusionButton.connect('clicked', () => {
      this.exclusionRow.set_expanded(true);
      this.exclusionButton.set_sensitive(false);
      this.exclusionRow.add_row(this.createEntryRow(ext));
    });

    this.set_header_suffix(this.exclusionButton);
    this.add(this.exclusionRow);
    const savedWindowClasses = this.settings.get_strv('exclusion-list');
    savedWindowClasses.forEach((w) => this.exclusionRow.add_row(this.createExcludedApp(w)));
    if (savedWindowClasses.length > 0) {
      this.exclusionRow.set_expanded(true);
    }
  }

  private createEntryRow(ext: ExtensionBase): Adw.ActionRow {
    const entryRow = new Adw.ActionRow();
    const _ = gettext(ext);
    const entry = new Gtk4.Entry({
      placeholder_text: _('Window class name'),
      halign: Gtk4.Align.FILL,
      valign: Gtk4.Align.CENTER,
      hexpand: true,
    });

    entry.connect('map', () => {
      entry.grab_focus();
    });

    const okButton = new Gtk4.Button({
      css_classes: ['flat'],
      icon_name: 'emblem-ok-symbolic',
      valign: Gtk4.Align.CENTER,
      halign: Gtk4.Align.CENTER,
    });

    okButton.connect('clicked', () => {
      const text = entry.get_text();
      if (text !== null && text.trim() !== '') {
        this.exclusionRow.remove(entryRow);
        this.exclusionRow.add_row(this.createExcludedApp(text.trim()));
        this.exclusionButton.set_sensitive(true);
        this.settings.set_strv('exclusion-list', [...this.settings.get_strv('exclusion-list'), text.trim()]);
      }
    });

    entry.connect('activate', () => {
      okButton.emit('clicked');
    });

    const cancelButton = new Gtk4.Button({
      css_classes: ['flat'],
      icon_name: 'window-close-symbolic',
      valign: Gtk4.Align.CENTER,
      halign: Gtk4.Align.CENTER,
    });

    cancelButton.connect('clicked', () => {
      this.exclusionRow.remove(entryRow);
      this.exclusionButton.set_sensitive(true);
    });

    entryRow.add_prefix(entry);
    entryRow.add_suffix(okButton);
    entryRow.add_suffix(cancelButton);

    return entryRow;
  }

  private createExcludedApp(appClassName: string): Adw.ActionRow {
    const excludedRow = new Adw.ActionRow({
      title: appClassName,
    });

    const removeButton = new Gtk4.Button({
      css_classes: ['destructive-action'],
      icon_name: 'edit-delete-symbolic',
      valign: Gtk4.Align.CENTER,
      halign: Gtk4.Align.CENTER,
    });
    removeButton.connect('clicked', () => {
      this.exclusionRow.remove(excludedRow);
      this.settings.set_strv(
        'exclusion-list',
        this.settings.get_strv('exclusion-list').filter((w) => w !== appClassName),
      );
    });

    excludedRow.add_suffix(removeButton);

    return excludedRow;
  }
}
