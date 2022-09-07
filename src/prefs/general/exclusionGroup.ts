import { ActionRow, ExpanderRow, PreferencesGroup } from '@gi-types/adw1';
import { Align, Button, Entry } from '@gi-types/gtk4';
import { registerGObjectClass } from '@pano/utils/gjs';
import { _ } from '@pano/utils/shell';

@registerGObjectClass
export class ExclusionGroup extends PreferencesGroup {
  private exclusionRow: ExpanderRow;
  private exclusionButton: Button;

  constructor() {
    super({
      title: _('Manage Exclusions'),
      margin_top: 20,
    });

    this.exclusionRow = new ExpanderRow({
      title: _('Excluded Apps'),
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
        this.exclusionRow.add_row(this.createExcludedApp(entry.get_text()));
        this.exclusionButton.set_sensitive(true);
      }
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
    });

    excludedRow.add_suffix(removeButton);

    return excludedRow;
  }
}
