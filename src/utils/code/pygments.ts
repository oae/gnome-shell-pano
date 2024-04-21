import { CodeHighlighter, type Language } from '@pano/utils/code/highlight';
import { logger } from '@pano/utils/shell';
import Gio from 'gi://Gio?version=2.0';

const debug = logger('code-highlighter:pygments');

export class PygmentsCodeHighlighter extends CodeHighlighter {
  private cliName = 'pygmentize';

  constructor() {
    super('pygments', 'CommandLine');
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

      return proc.get_successful();
    } catch (err) {
      debug(`An error occurred while testing for the executable: ${err}`);
      return false;
    }
  }

  override detectLanguage(text: string): Language | undefined {
    const noLanguageDetected = 'text';

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

        if (content === noLanguageDetected) {
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
    const finalText = text.substring(0, characterLength);

    try {
      const proc = Gio.Subprocess.new(
        [this.cliName, '-l', language, '-f', 'pango'],
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
}
