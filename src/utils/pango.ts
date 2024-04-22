import Gio from '@girs/gio-2.0';
import type { CodeHighlighter, Language } from '@pano/utils/code/highlight';
import { PygmentsCodeHighlighter } from '@pano/utils/code/pygments';
import { logger } from '@pano/utils/shell';

//TODO: add highlight.js back, if it is installed and can be found via "require()"" or dynamic "await import()""

//TODO: things to do, after more highlighter are added, just add to availableCodeHighlighter, than on changing of one, reevaluate every text item and rescanning it and resetting the metadata. This might take some time, so maybe do it in two steps, and in some places the metadata.highlighter has to be checked, so that we don't use invalid language in one highlighter, other than the one, detecting that language

const debug = logger('pango');

// not concurrent. can only run in one thread
// from https://stackoverflow.com/questions/51850236/javascript-scheduler-implementation-using-promises
// but modified to suit our needs

class TaskScheduler {
  private limit: number;
  private active: number;
  private pool: Array<() => Promise<void>>;

  constructor(concurrency: number) {
    this.limit = concurrency;
    this.active = 0;
    this.pool = [];
  }

  push<T>(task: () => Promise<T>): Promise<T> {
    return new Promise((resolve) => {
      this._push(async () => {
        const result = await task();
        resolve(result);
      });
    });
  }

  private _push(task: () => Promise<void>): void {
    this.pool.push(task);
    if (this.active < this.limit) {
      void this._execute(this.pool.shift()!);
    }
  }

  private _execute(task: () => Promise<void>): Promise<void> {
    this.active += 1;
    return task().then(() => {
      this.active -= 1;
      if (this.pool.length > 0 && this.active < this.limit) {
        void this._execute(this.pool.shift()!);
      }
    });
  }
}

type LoadCallback = () => void | Promise<void>;

export class PangoMarkdown {
  private _detectedHighlighter: CodeHighlighter[] = [];
  private _currentHighlighter: CodeHighlighter | null = null;

  private loadCallbacks: LoadCallback[] = [];
  private _loaded: boolean = false;
  private _scheduler: TaskScheduler;

  public static readonly availableCodeHighlighter: CodeHighlighter[] = [new PygmentsCodeHighlighter()];

  constructor(
    preferredHighlighter: string | null = null,
    settings: Gio.Settings | null = null,
    schedulerConcurrency: number = 4,
  ) {
    this._scheduler = new TaskScheduler(schedulerConcurrency);

    // this is fine, since the properties this sets are async safe, alias they are set at the end, so that everything is set when it's needed, and when something uses this class, before it is ready, it will behave correctly and it has a mechanism to add callbacks, after it is finished
    this.detectHighlighter(preferredHighlighter, settings)
      .then(async () => {
        if (settings) {
          this.enableWatch(settings);
        }
        this._loaded = true;
        for (const callback of this.loadCallbacks) {
          await callback();
        }
        this.loadCallbacks = [];
      })
      .catch((err) => {
        debug(`An error occurred in detecting the highlighter: ${err}`);
      });
  }

  onLoad(callback: LoadCallback): void {
    if (this._loaded) {
      void callback();
      return;
    }

    this.loadCallbacks.push(callback);
  }

  get loaded(): boolean {
    return this._loaded;
  }

  get detectedHighlighter() {
    return this._detectedHighlighter;
  }

  get currentHighlighter() {
    return this._currentHighlighter;
  }

  // this is called in the constructor and can be called at any moment later by settings etc.
  public async detectHighlighter(
    preferredHighlighter: string | null = null,
    settings: Gio.Settings | null = null,
  ): Promise<void> {
    // this is to be async safe
    this._detectedHighlighter = [];
    const localDetectedHighlighter = [];
    let currentHighlighter: CodeHighlighter | null = this._currentHighlighter;
    this._currentHighlighter = null;

    for (const codeHighlighter of PangoMarkdown.availableCodeHighlighter) {
      if (await codeHighlighter.isInstalled()) {
        if (settings) {
          codeHighlighter.options = settings.get_string(PangoMarkdown.getSchemaKeyForOptions(codeHighlighter));
        }

        localDetectedHighlighter.push(codeHighlighter);

        if (preferredHighlighter === null) {
          if (currentHighlighter === null) {
            currentHighlighter = codeHighlighter;
          }
        } else if (codeHighlighter.name === preferredHighlighter) {
          currentHighlighter = codeHighlighter;
        }
      }
    }

    this._detectedHighlighter = localDetectedHighlighter;
    this._currentHighlighter = currentHighlighter;
  }

  public async detectLanguage(text: string): Promise<Language | undefined> {
    if (this._currentHighlighter === null) {
      return undefined;
    }

    return await this._currentHighlighter.detectLanguage(text);
  }

  public async scheduleMarkupCode(
    language: string,
    text: string,
    characterLength: number,
  ): Promise<string | undefined> {
    if (this._currentHighlighter === null) {
      return undefined;
    }

    return await this._scheduler.push(async () => {
      return await this._currentHighlighter?.markupCode(language, text, characterLength);
    });
  }

  public static getSchemaKeyForOptions(highlighter: CodeHighlighter): string {
    return `${highlighter.name}-options`;
  }

  public static readonly codeHighlighterKey = 'code-highlighter';
  public static readonly enabledKey = 'code-highlighter-enabled';

  private enableWatch(settings: Gio.Settings) {
    const settingsChanged = async () => {
      const isEnabled = settings.get_boolean(PangoMarkdown.enabledKey);
      if (!isEnabled) {
        this._currentHighlighter = null;
        return;
      }

      const highlighterValue = settings.get_uint(PangoMarkdown.codeHighlighterKey);

      await this.detectHighlighter(PangoMarkdown.availableCodeHighlighter[highlighterValue]!.name);
    };

    settings.connect(`changed::${PangoMarkdown.enabledKey}`, settingsChanged);

    settings.connect(`changed::${PangoMarkdown.codeHighlighterKey}`, settingsChanged);

    for (const codeHighlighter of PangoMarkdown.availableCodeHighlighter) {
      const schemaKey = `changed::${PangoMarkdown.getSchemaKeyForOptions(codeHighlighter)}`;
      settings.connect(schemaKey, () => {
        if (this._currentHighlighter?.name === codeHighlighter.name) {
          this._currentHighlighter.options = settings.get_string(schemaKey);
        }
      });

      codeHighlighter;
    }
  }

  public stopProcesses() {
    for (const highlighter of this._detectedHighlighter) {
      highlighter.stopProcesses();
    }
  }
}
