import Adw from '@girs/adw-1';
import Gio from '@girs/gio-2.0';
import type { ExtensionBase } from '@girs/gnome-shell/dist/extensions/sharedInternals';
import Gtk4 from '@girs/gtk-4.0';
import { ItemExpanderRow } from '@pano/prefs/customization/itemExpanderRow';
import {
  createColorRow,
  createDropdownRow,
  createFontRow,
  createSpinRow,
  createSwitchRow,
} from '@pano/prefs/customization/utils';
import { registerGObjectClass } from '@pano/utils/gjs';
import { PangoMarkdown } from '@pano/utils/pango';
import { getPanoItemTypes } from '@pano/utils/panoItemType';
import { getCurrentExtensionSettings, gettext, logger } from '@pano/utils/shell';

@registerGObjectClass
export class CodeItemStyleRow extends ItemExpanderRow {
  private settings: Gio.Settings;
  private enableProperties: [Adw.ActionRow, Gtk4.Switch, Gtk4.Button, Gtk4.Button | null];
  private rows: Adw.ActionRow[];
  private readonly rowCount: number;
  private markdownDetector: PangoMarkdown | null = null;
  private codeHighlighterOptions: string[];
  private codeHighlighterDropDown: Gtk4.DropDown;

  private readonly ext: ExtensionBase;

  constructor(ext: ExtensionBase) {
    const _ = gettext(ext);
    super(ext, _('Code Item Style'), _('Change the style of the code item'), getPanoItemTypes(ext).CODE.iconName);

    this.ext = ext;
    this.settings = getCurrentExtensionSettings(ext).get_child('code-item');

    // create code highlighter enabled row
    this.enableProperties = createSwitchRow(
      _('Code Highlighter Enabled'),
      _('When enabled, Code will be highlighted'),
      this.settings,
      PangoMarkdown.enabledKey,
      this.onEnabledChanged.bind(this),
      this.refreshCallback.bind(this),
    );

    // disable changing it, until we know, if it's possible to change (we have the tools needed installed) that is done asynchronously, to show something and not block this too long
    this.enableProperties[0].sensitive = false;

    this.add_row(this.enableProperties[0]);

    // create header background color row
    const headerBackgroundRow = createColorRow(
      _('Header Background Color'),
      _('You can change the background color of the header'),
      this.settings,
      'header-bg-color',
    );

    // create header text color row
    const headerTextRow = createColorRow(
      _('Header Text Color'),
      _('You can change the text color of the header'),
      this.settings,
      'header-color',
    );

    // create body background color row
    const bodyBackgroundRow = createColorRow(
      _('Body Background Color'),
      _('You can change the background color of the body'),
      this.settings,
      'body-bg-color',
    );

    // create body font row
    const bodyFontRow = createFontRow(
      _('Body Font'),
      _('You can change the font of the body'),
      this.settings,
      'body-font',
    );

    // create character length row
    const characterLengthRow = createSpinRow(
      _('Character Length'),
      _('You can change the character length of the visible text in the body'),
      this.settings,
      'char-length',
      50,
      50,
      5000,
    );

    this.codeHighlighterOptions = PangoMarkdown.availableCodeHighlighter.map((highlighter) => highlighter.name);

    // create code highlighter row
    const [codeHighlighterRow, codeHighlighterDropDown] = createDropdownRow(
      _('Code Highlighter'),
      _('You can change which code highlighter to use'),
      this.settings,
      PangoMarkdown.codeHighlighterKey,
      this.codeHighlighterOptions,
      this.onCodeHighlighterChanged.bind(this),
    );

    this.rows = [
      headerBackgroundRow,
      headerTextRow,
      bodyBackgroundRow,
      bodyFontRow,
      characterLengthRow,
      codeHighlighterRow,
    ];

    this.rowCount = this.rows.length;

    this.codeHighlighterDropDown = codeHighlighterDropDown;

    for (const row of this.rows) {
      //disable all rows, until we know, that we can set it
      row.sensitive = false;
      this.add_row(row);
    }
  }

  private onEnabledChanged(_enabled: boolean): void {
    this.scan();
    //TODOD: recreate those items, which where classified as text previously (check if the were created with the correct highlighter)
  }

  private refreshCallback(): void {
    this.scan();
  }

  private async onCodeHighlighterChanged(name: string): Promise<void> {
    await this.markdownDetector?.detectHighlighter(name);
    this.scan();
  }

  public scan() {
    const resetRows = () => {
      const removedRows = this.rows.splice(this.rowCount);
      for (const removedRow of removedRows) {
        this.remove(removedRow);
      }
    };

    const initialCodeHighlighter = this.settings.get_uint(PangoMarkdown.codeHighlighterKey);
    const initialCodeHighlighterValue = this.codeHighlighterOptions[initialCodeHighlighter];

    if (!this.markdownDetector) {
      this.markdownDetector = new PangoMarkdown(initialCodeHighlighterValue);
    }

    let enablingPossible = true;

    const currentHighlighter = this.markdownDetector.currentHighlighter;

    if (this.markdownDetector.detectedHighlighter.length === 0 || currentHighlighter === null) {
      enablingPossible = false;
    }

    const isEnabled = this.settings.get_boolean(PangoMarkdown.enabledKey);

    const defaultValueForEnabled = this.settings.get_default_value(PangoMarkdown.enabledKey)?.get_boolean() ?? false;

    if (!isEnabled) {
      // make all rows in-sensitive, except the enable row, if enabling is possible
      this.enableProperties[0].sensitive = true;
      this.enableProperties[1].sensitive = enablingPossible;
      this.enableProperties[2].sensitive = enablingPossible && defaultValueForEnabled !== isEnabled;
      this.enableProperties[3]?.set_sensitive(true);

      for (const row of this.rows) {
        //disable all rows, until we know, that we can set it
        row.sensitive = false;
      }

      resetRows();
      this.changed();
      return;
    }

    if (isEnabled && !enablingPossible) {
      this.settings.set_boolean(PangoMarkdown.enabledKey, false);

      // make all rows in-sensitive, also the enable row
      this.enableProperties[0].sensitive = true;
      this.enableProperties[1].sensitive = false;
      this.enableProperties[2].sensitive = false;
      // let the user refresh, so don't disable that
      this.enableProperties[3]?.set_sensitive(true);

      for (const row of this.rows) {
        //disable all rows, until we know, that we can set it
        row.sensitive = false;
      }

      resetRows();
      this.changed();
      return;
    }

    //TODO: disable all items, that are not in  this.markdownDetector.detectedHighlighter
    logger('TEST')(JSON.stringify(this.codeHighlighterDropDown.model.get_item(0)));

    // make all rows sensitive, so that things can be changed
    this.enableProperties[0].sensitive = true;
    this.enableProperties[1].sensitive = true;
    this.enableProperties[2].sensitive = defaultValueForEnabled !== isEnabled;
    this.enableProperties[3]?.set_sensitive(true);

    for (const row of this.rows) {
      //disable all rows, until we know, that we can set it
      row.sensitive = true;
    }

    resetRows();

    const optionsForSettings = currentHighlighter!.getOptionsForSettings(gettext(this.ext));

    const schemaKey = PangoMarkdown.getSchemaKeyForOptions(currentHighlighter!);

    currentHighlighter!.options = this.settings.get_string(schemaKey);

    const getValueFor = <T>(key: string, reRead = false): T | undefined => {
      if (reRead) {
        currentHighlighter!.options = this.settings.get_string(schemaKey);
      }

      const record: Record<string, T> = JSON.parse(currentHighlighter!.options);
      return record[key];
    };

    const setValueFor = <T>(key: string, val: T | undefined): void => {
      const record: Record<string, T> = JSON.parse(currentHighlighter!.options);
      if (val === undefined) {
        delete record[key];
      } else {
        record[key] = val;
      }

      const stringified = JSON.stringify(record);

      currentHighlighter!.options = stringified;
      this.settings.set_string(schemaKey, stringified);
    };

    const createDropdownRowForHighlighter = (
      title: string,
      subtitle: string,
      options: string[],
      defaultValue: string | number,
      key: string,
      searchEnabled: boolean,
    ): [Adw.ActionRow, Gtk4.DropDown] => {
      const row = new Adw.ActionRow({
        title,
        subtitle,
      });

      const dropDown = new Gtk4.DropDown({
        valign: Gtk4.Align.CENTER,
        halign: Gtk4.Align.CENTER,
        model: Gtk4.StringList.new(options),
        enableSearch: searchEnabled,
      });

      const getIndexFor = (val: string | undefined): number => {
        if (val) {
          const index = options.indexOf(val);
          if (index >= 0) {
            return index;
          }
        }

        if (typeof defaultValue === 'number') {
          return defaultValue >= 0 && defaultValue < options.length ? defaultValue : 0;
        }

        const index = options.indexOf(defaultValue);

        return index >= 0 ? index : 0;
      };

      const initialValue = getValueFor<string>(key);

      dropDown.set_selected(getIndexFor(initialValue));

      dropDown.connect('notify::selected', () => {
        setValueFor<string>(key, options[dropDown.get_selected()]!);
      });

      row.add_suffix(dropDown);
      row.set_activatable_widget(dropDown);

      const clearButton = new Gtk4.Button({
        iconName: 'edit-clear-symbolic',
        valign: Gtk4.Align.CENTER,
        halign: Gtk4.Align.CENTER,
      });

      if (defaultValue === initialCodeHighlighterValue) {
        clearButton.sensitive = false;
      }

      this.settings.connect(`changed::${schemaKey}`, () => {
        const value = getValueFor<string>(key, true);

        if (defaultValue === value) {
          clearButton.sensitive = false;
        } else {
          clearButton.sensitive = true;
        }

        dropDown.set_selected(getIndexFor(value));
      });

      clearButton.connect('clicked', () => {
        if (typeof defaultValue === 'number') {
          const finalIndex = defaultValue >= 0 && defaultValue < options.length ? defaultValue : 0;
          setValueFor<string>(key, options[finalIndex]);

          dropDown.set_selected(finalIndex);
        } else {
          const finalIndex = getIndexFor(defaultValue);
          setValueFor<string>(key, defaultValue);

          dropDown.set_selected(finalIndex);
        }
      });

      row.add_suffix(clearButton);

      return [row, dropDown];
    };

    for (const [key, value] of Object.entries(optionsForSettings)) {
      switch (value.type) {
        case 'dropdown': {
          const [row, _] = createDropdownRowForHighlighter(
            value.title,
            value.subtitle,
            value.values,
            value.defaultValue,
            key,
            value.searchEnabled ?? false,
          );

          row.sensitive = true;
          this.add_row(row);

          this.rows.push(row);

          break;
        }

        default:
          break;
      }
    }

    this.changed();
  }
}
