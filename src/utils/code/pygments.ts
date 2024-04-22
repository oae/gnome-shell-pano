import type { Promisified2 } from '@girs/gio-2.0';
import { CancellableCollection, type CancellableWrapper } from '@pano/utils/code/cancellables';
import { CodeHighlighter, type Language, type OptionsForSettings } from '@pano/utils/code/highlight';
import { logger } from '@pano/utils/shell';
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
  private cliName = 'pygmentize';
  private _options: PygmentsOptions;
  private cancellableCollection: CancellableCollection;

  constructor() {
    super('pygments', 'CommandLine');
    this._options = { style: undefined };
    this.cancellableCollection = new CancellableCollection();
  }

  override async isInstalled(): Promise<boolean> {
    let cancellable: CancellableWrapper | undefined;

    try {
      const proc = Gio.Subprocess.new(
        ['which', this.cliName],
        Gio.SubprocessFlags.STDOUT_SILENCE | Gio.SubprocessFlags.STDERR_SILENCE,
      );

      cancellable = this.cancellableCollection.getNew();

      const success = await (proc.wait_async as Promisified2<typeof proc.wait_async, boolean>)(cancellable.value);

      this.cancellableCollection.remove(cancellable);
      cancellable = undefined;

      if (!success) {
        throw new Error('Process was cancelled');
      }

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
      const proc = Gio.Subprocess.new(
        [this.cliName, '-C'],
        Gio.SubprocessFlags.STDERR_PIPE | Gio.SubprocessFlags.STDOUT_PIPE | Gio.SubprocessFlags.STDIN_PIPE,
      );

      cancellable = this.cancellableCollection.getNew();

      const result = await (
        proc.communicate_utf8_async as Promisified2<typeof proc.communicate_utf8_async, [boolean, string, string]>
      )(text, cancellable.value);

      this.cancellableCollection.remove(cancellable);
      cancellable = undefined;

      if (!result) {
        throw new Error('Process result was undefined');
      }

      const [success, stdout, stderr] = result;

      if (!success) {
        throw new Error('Process was cancelled');
      }

      if (proc.get_successful()) {
        const content = stdout.trim();

        if (content === 'text') {
          return undefined;
        }

        return { language: content, relevance: 1.0 };
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
      const proc = Gio.Subprocess.new(
        [this.cliName, '-l', language, '-f', 'pango', ...this.getOptionsForCLI()],
        Gio.SubprocessFlags.STDERR_PIPE | Gio.SubprocessFlags.STDOUT_PIPE | Gio.SubprocessFlags.STDIN_PIPE,
      );

      cancellable = this.cancellableCollection.getNew();

      const result = await (
        proc.communicate_utf8_async as Promisified2<typeof proc.communicate_utf8_async, [boolean, string, string]>
      )(finalText, cancellable.value);

      this.cancellableCollection.remove(cancellable);
      cancellable = undefined;

      if (!result) {
        throw new Error('Process result was undefined');
      }

      const [success, stdout, stderr] = result;

      if (!success) {
        throw new Error('Process was cancelled');
      }

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
      options.push(`-P="${name}=${value}`);
    }

    return options;
  }

  override set options(options: string) {
    try {
      this._options = JSON.parse(options);
    } catch (_err) {
      this._options = { style: undefined };
    }
  }

  get options(): string {
    return JSON.stringify(this._options);
  }

  override async getOptionsForSettings(_: (str: string) => string): Promise<OptionsForSettings> {
    const features = await this.getFeatures();

    if (!features) {
      return {};
    }

    return {
      style: {
        type: 'dropdown',
        values: Object.keys(features.styles),
        title: _('Style to Use'),
        subtitle: _('Choose the style, you want to use'),
        defaultValue: 0,
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
      const proc = Gio.Subprocess.new(
        [this.cliName, '-L', '--json'],
        Gio.SubprocessFlags.STDERR_PIPE | Gio.SubprocessFlags.STDOUT_PIPE,
      );

      cancellable = this.cancellableCollection.getNew();

      const result = await (
        proc.communicate_utf8_async as Promisified2<typeof proc.communicate_utf8_async, [boolean, string, string]>
      )(null, cancellable.value);

      this.cancellableCollection.remove(cancellable);
      cancellable = undefined;

      if (!result) {
        throw new Error('Process result was undefined');
      }

      const [success, stdout, stderr] = result;

      if (!success) {
        throw new Error('Process was cancelled');
      }

      if (proc.get_successful()) {
        const content = stdout.trim();

        const parsed = JSON.parse(content) as PygmentsFeatures;

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
    this.cancellableCollection.removeAll();
  }
}
