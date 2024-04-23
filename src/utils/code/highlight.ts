export type Language = {
  relevance: number;
  language: string;
};

export type CodeHighlighterType = 'CommandLine' | 'JSModule';

export interface RowOptions {
  title: string;
  subtitle: string;
}

export interface DropDownOption extends RowOptions {
  type: 'dropdown';
  values: string[];
  defaultValue: string | number;
  searchEnabled?: boolean;
}

export interface SpinButtonOption extends RowOptions {
  type: 'spinButton';
  defaultValue: number;
  min: number;
  max: number;
  increment: number;
}

export type OptionForSettings = DropDownOption | SpinButtonOption;

export type OptionsForSettings<T> = Record<keyof T, OptionForSettings>;

export type CodeHighlighterMetaData = {
  name: string;
  type: CodeHighlighterType;
};

export abstract class CodeHighlighter {
  readonly name: string;
  readonly type: CodeHighlighterType;
  protected installed: boolean;

  constructor(metaData: CodeHighlighterMetaData, installed = false) {
    this.name = metaData.name;
    this.type = metaData.type;
    this.installed = installed;
  }

  abstract isInstalled(): Promise<boolean>;

  abstract detectLanguage(text: string): Promise<Language | undefined>;

  abstract markupCode(language: string, text: string, characterLength: number): Promise<string | undefined>;

  abstract getOptionsForSettings(_: (str: string) => string): Promise<OptionsForSettings<Record<string, any>>>;

  abstract set options(options: string);

  abstract get options(): string;

  abstract stopProcesses(): void;
}
