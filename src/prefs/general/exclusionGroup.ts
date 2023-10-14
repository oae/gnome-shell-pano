import { ActionRow, ExpanderRow, PreferencesGroup } from '@gi-types/adw1';
import { Settings } from '@gi-types/gio2';
import { Align, Button, Entry } from '@gi-types/gtk4';
import { ExtensionBase } from '@gnome-shell/extensions/extension';
import { registerGObjectClass } from '@pano/utils/gjs';
import { _, getCurrentExtensionSettings } from '@pano/utils/shell';

@registerGObjectClass
export class ExclusionGroup extends PreferencesGroup {
  private exclusionRow: ExpanderRow;
  private exclusionButton: Button;
  private settings: Settings;

  constructor(ext: ExtensionBase) {
    super({
      title: _('Manage Exclusions'),
      margin_top: 20,
    });

    this.settings = getCurrentExtensionSettings(ext);

    this.exclusionRow = new ExpanderRow({
      title: _('Excluded Apps'),
      subtitle: _('Pano will stop tracking if any window from the list is focussed'),
    });

    this.exclusionButton = new Button({
      icon_name: 'list-add-symbolic',
      css_classes: ['flat'],
      valign: Align.CENTER,
      halign: Align.CENTER,
    });

    this.exclusionButton.connect('clicked', () => {
      this.exclusionRow.set_expanded(true);
      this.exclusionButton.set_sensitive(false);
      this.exclusionRow.add_row(this.createEntryRow());
    });

    this.set_header_suffix(this.exclusionButton);
    this.add(this.exclusionRow);
    const savedWindowClasses = this.settings.get_strv('exclusion-list');
    savedWindowClasses.forEach((w) => this.exclusionRow.add_row(this.createExcludedApp(w)));
    if (savedWindowClasses.length > 0) {
      this.exclusionRow.set_expanded(true);
    }
  }

  private createEntryRow(): ActionRow {
    const entryRow = new ActionRow();

    const entry = new Entry({
      placeholder_text: _('Window class name'),
      halign: Align.FILL,
      valign: Align.CENTER,
      hexpand: true,
    });

    entry.connect('map', () => {
      entry.grab_focus();
    });

    const okButton = new Button({
      css_classes: ['flat'],
      icon_name: 'emblem-ok-symbolic',
      valign: Align.CENTER,
      halign: Align.CENTER,
    });

    okButton.connect('clicked', () => {
      if (entry.get_text().trim()) {
        this.exclusionRow.remove(entryRow);
        this.exclusionRow.add_row(this.createExcludedApp(entry.get_text().trim()));
        this.exclusionButton.set_sensitive(true);
        this.settings.set_strv('exclusion-list', [
          ...this.settings.get_strv('exclusion-list'),
          entry.get_text().trim(),
        ]);
      }
    });

    entry.connect('activate', () => {
      okButton.emit('clicked');
    });

    const cancelButton = new Button({
      css_classes: ['flat'],
      icon_name: 'window-close-symbolic',
      valign: Align.CENTER,
      halign: Align.CENTER,
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

  private createExcludedApp(appClassName: string): ActionRow {
    const excludedRow = new ActionRow({
      title: appClassName,
    });

    const removeButton = new Button({
      css_classes: ['destructive-action'],
      icon_name: 'edit-delete-symbolic',
      valign: Align.CENTER,
      halign: Align.CENTER,
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
