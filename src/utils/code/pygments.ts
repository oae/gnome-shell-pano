import type { PromisifiedWithArrayReturnType, PromisifiedWithReturnType } from '@girs/gio-2.0';
import type { ExtensionBase } from '@girs/gnome-shell/dist/extensions/sharedInternals';
import { CancellableCollection, type CancellableWrapper } from '@pano/utils/code/cancellables';
import {
  CodeHighlighter,
  type CodeHighlighterMetaData,
  type Language,
  type OptionsForSettings,
} from '@pano/utils/code/highlight';
import { logger, safeParse, stringify } from '@pano/utils/shell';
import Gio from 'gi://Gio?version=2.0';

// from https://gjs.guide/guides/gio/subprocesses.html
/* Gio.Subprocess */
Gio._promisify(Gio.Subprocess.prototype, 'communicate_async');
Gio._promisify(Gio.Subprocess.prototype, 'communicate_utf8_async');
Gio._promisify(Gio.Subprocess.prototype, 'wait_async');
Gio._promisify(Gio.Subprocess.prototype, 'wait_check_async');

/* Ancillary Methods */
Gio._promisify(Gio.DataInputStream.prototype, 'read_line_async', 'read_line_finish_utf8');
Gio._promisify(Gio.OutputStream.prototype, 'write_bytes_async');

const debug = logger('code-highlighter:pygments');

type PygmentsLexer = {
  aliases: string[];
  filenames: string[];
  mimetypes: string[];
};

type PygmentsFormatter = {
  aliases: string[];
  filenames: string[];
  doc: string;
};

type PygmentsFilter = {
  doc: string;
};

type PygmentsStyle = {
  doc: string;
};

type PygmentsFeatures = {
  lexers: Record<string, PygmentsLexer>;
  formatters: Record<string, PygmentsFormatter>;
  filters: Record<string, PygmentsFilter>;
  styles: Record<string, PygmentsStyle>;
};

type PygmentsOptions = {
  style: string | undefined;
};

export class PygmentsCodeHighlighter extends CodeHighlighter {
  public static MetaData: CodeHighlighterMetaData = {
    name: 'pygments',
    type: 'CommandLine',
  };

  private cliName = 'pygmentize';
  private _options: PygmentsOptions;
  private cancellableCollection: CancellableCollection;

  private _launcher: Gio.SubprocessLauncher;

  constructor(ext: ExtensionBase) {
    super(PygmentsCodeHighlighter.MetaData);
    this._options = { style: undefined };
    this.cancellableCollection = new CancellableCollection();

    this._launcher = new Gio.SubprocessLauncher({
      flags: Gio.SubprocessFlags.STDIN_PIPE | Gio.SubprocessFlags.STDOUT_PIPE | Gio.SubprocessFlags.STDERR_PIPE,
    });
    this._launcher.setenv('PYTHONPATH', `${ext.path}/highlighter/pygments/`, true);
  }

  override async isInstalled(): Promise<boolean> {
    let cancellable: CancellableWrapper | undefined;

    try {
      const proc = Gio.Subprocess.new(
        ['which', this.cliName],
        Gio.SubprocessFlags.STDOUT_SILENCE | Gio.SubprocessFlags.STDERR_SILENCE,
      );

      cancellable = this.cancellableCollection.add(new Gio.Cancellable());

      await (proc.wait_async as PromisifiedWithReturnType<typeof proc.wait_async, void>)(cancellable.value);

      if (cancellable.value.is_cancelled()) {
        throw new Error('Process was cancelled');
      }

      this.cancellableCollection.remove(cancellable);
      cancellable = undefined;

      this.installed = proc.get_successful();
      return this.installed;
    } catch (err) {
      debug(`An error occurred while testing for the executable: ${err}`);
      this.cancellableCollection.remove(cancellable);
      return false;
    }
  }

  override async detectLanguage(text: string): Promise<Language | undefined> {
    if (!this.installed) {
      return undefined;
    }

    let cancellable: CancellableWrapper | undefined;

    try {
      const proc = this._launcher.spawnv([this.cliName, '-C']);

      cancellable = this.cancellableCollection.add(new Gio.Cancellable());

      const result = await (
        proc.communicate_utf8_async as PromisifiedWithArrayReturnType<
          typeof proc.communicate_utf8_async,
          typeof proc.communicate_utf8_finish
        >
      )(text, cancellable.value);

      if (cancellable.value.is_cancelled()) {
        throw new Error('Process was cancelled');
      }

      this.cancellableCollection.remove(cancellable);
      cancellable = undefined;

      if (!result) {
        throw new Error('Process result was undefined');
      }

      const [stdout, stderr] = result;

      if (proc.get_successful()) {
        const content = stdout.trim();

        if (content === 'text') {
          return undefined;
        }

        // this is hardcoded, but it's only done, since pygments can't report tha heuristic

        const relevanceBorder = 200;

        const relevance = text.length > relevanceBorder ? 1.0 : text.length / relevanceBorder;

        return { language: content, relevance };
      } else {
        throw new Error(`Process exited with exit code: ${proc.get_exit_status()} and output:  ${stderr}`);
      }
    } catch (err) {
      debug(`An error occurred while detecting the language: ${err}`);
      this.cancellableCollection.remove(cancellable);
      return undefined;
    }
  }

  override async markupCode(language: string, text: string, characterLength: number): Promise<string | undefined> {
    if (!this.installed) {
      return undefined;
    }

    const finalText = text.substring(0, characterLength);

    let cancellable: CancellableWrapper | undefined;

    try {
      const proc = this._launcher.spawnv([this.cliName, '-l', language, '-f', 'pango', ...this.getOptionsForCLI()]);

      cancellable = this.cancellableCollection.add(new Gio.Cancellable());

      const result = await (
        proc.communicate_utf8_async as PromisifiedWithArrayReturnType<
          typeof proc.communicate_utf8_async,
          typeof proc.communicate_utf8_finish
        >
      )(finalText, cancellable.value);

      if (cancellable.value.is_cancelled()) {
        throw new Error('Process was cancelled');
      }

      this.cancellableCollection.remove(cancellable);
      cancellable = undefined;

      if (!result) {
        throw new Error('Process result was undefined');
      }

      const [stdout, stderr] = result;

      if (proc.get_successful()) {
        return stdout;
      } else {
        throw new Error(`Process exited with exit code: ${proc.get_exit_status()} and output:  ${stderr}`);
      }
    } catch (err) {
      debug(`An error occurred while formatting the language: ${err}`);
      this.cancellableCollection.remove(cancellable);
      return undefined;
    }
  }

  private getOptionsForCLI(): string[] {
    const options: string[] = [];

    for (const [name, value] of Object.entries(this._options)) {
      options.push(`-P=${name}=${value}`);
    }

    return options;
  }

  override set options(options: string) {
    try {
      this._options = safeParse<PygmentsOptions>(options, { style: undefined });
    } catch (_err) {
      this._options = { style: undefined };
    }
  }

  get options(): string {
    return stringify<PygmentsOptions>(this._options);
  }

  private _features: PygmentsFeatures | undefined;

  override async getOptionsForSettings(_: (str: string) => string, forceRefresh = false): Promise<OptionsForSettings> {
    if (!this._features || forceRefresh) {
      this._features = await this.getFeatures();
    }

    if (!this._features) {
      return {};
    }

    const styles = Object.keys(this._features.styles);
    styles.sort();

    let defaultStyleValue: string | number = 0;
    if (styles.includes('default')) {
      defaultStyleValue = 'default';
    }

    if (styles.includes('pano')) {
      defaultStyleValue = 'pano';
    }

    return {
      style: {
        type: 'dropdown',
        values: styles,
        title: _('Style to Use'),
        subtitle: _('Choose the style, you want to use'),
        defaultValue: defaultStyleValue,
        searchEnabled: true,
      },
    };
  }

  private async getFeatures(): Promise<PygmentsFeatures | undefined> {
    if (!this.installed) {
      return undefined;
    }

    let cancellable: CancellableWrapper | undefined;

    try {
      const proc = this._launcher.spawnv([this.cliName, '-L', '--json']);

      cancellable = this.cancellableCollection.add(new Gio.Cancellable());

      const result = await (
        proc.communicate_utf8_async as PromisifiedWithArrayReturnType<
          typeof proc.communicate_utf8_async,
          typeof proc.communicate_utf8_finish
        >
      )(null, cancellable.value);

      if (cancellable.value.is_cancelled()) {
        throw new Error('Process was cancelled');
      }

      this.cancellableCollection.remove(cancellable);
      cancellable = undefined;

      if (!result) {
        throw new Error('Process result was undefined');
      }

      const [stdout, stderr] = result;

      if (proc.get_successful()) {
        const content = stdout.trim();

        const parsed: PygmentsFeatures = safeParse<PygmentsFeatures>(content, {
          lexers: {},
          filters: {},
          formatters: {},
          styles: {},
        });

        return parsed;
      } else {
        throw new Error(`Process exited with exit code: ${proc.get_exit_status()} and output:  ${stderr}`);
      }
    } catch (err) {
      debug(`An error occurred while detecting features: ${err}`);
      this.cancellableCollection.remove(cancellable);
      return undefined;
    }
  }

  override stopProcesses() {
    this.cancellableCollection.cancelAll();
    this._launcher.close();
  }
}
