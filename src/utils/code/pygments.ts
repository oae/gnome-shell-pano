import { CodeHighlighter, type Language, type OptionsForSettings } from '@pano/utils/code/highlight';
import { logger } from '@pano/utils/shell';
import Gio from 'gi://Gio?version=2.0';

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

  constructor() {
    super('pygments', 'CommandLine');
    this._options = { style: undefined };
  }

  override isInstalled(): boolean {
    try {
      const proc = Gio.Subprocess.new(
        ['which', this.cliName],
        Gio.SubprocessFlags.STDOUT_SILENCE | Gio.SubprocessFlags.STDERR_SILENCE,
      );

      const success = proc.wait(null);
      if (!success) {
        throw new Error('Process was cancelled');
      }

      this.installed = proc.get_successful();
      return this.installed;
    } catch (err) {
      debug(`An error occurred while testing for the executable: ${err}`);
      return false;
    }
  }

  override detectLanguage(text: string): Language | undefined {
    if (!this.installed) {
      return undefined;
    }

    try {
      const proc = Gio.Subprocess.new(
        [this.cliName, '-C'],
        Gio.SubprocessFlags.STDERR_PIPE | Gio.SubprocessFlags.STDOUT_PIPE | Gio.SubprocessFlags.STDIN_PIPE,
      );
      const [success, stdout, stderr] = proc.communicate_utf8(text, null);

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
      return undefined;
    }
  }

  override markupCode(language: string, text: string, characterLength: number): string | undefined {
    if (!this.installed) {
      return undefined;
    }

    const finalText = text.substring(0, characterLength);

    try {
      const proc = Gio.Subprocess.new(
        [this.cliName, '-l', language, '-f', 'pango', ...this.getOptionsForCLI()],
        Gio.SubprocessFlags.STDERR_PIPE | Gio.SubprocessFlags.STDOUT_PIPE | Gio.SubprocessFlags.STDIN_PIPE,
      );
      const [success, stdout, stderr] = proc.communicate_utf8(finalText, null);

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

  override getOptionsForSettings(_: (str: string) => string): OptionsForSettings {
    const features = this.getFeatures();

    if (!features) {
      return {};
    }

    return {
      style: {
        type: 'dropdown',
        values: Object.keys(features.styles),
        title: _('Style to Use'),
        subtitle: _('Choose the style, you want to use'),
        defaultValue: undefined,
      },
    };
  }

  private getFeatures(): PygmentsFeatures | undefined {
    if (!this.installed) {
      return undefined;
    }

    try {
      const proc = Gio.Subprocess.new(
        [this.cliName, '-L', '--json'],
        Gio.SubprocessFlags.STDERR_PIPE | Gio.SubprocessFlags.STDOUT_PIPE,
      );
      const [success, stdout, stderr] = proc.communicate_utf8(null, null);

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
      return undefined;
    }
  }
}
