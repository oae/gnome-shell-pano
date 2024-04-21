export type Language = {
  relevance: number;
  language: string;
};

export type CodeHighlighterType = 'CommandLine' | 'JSModule';

export type DropDownOption = {
  type: 'dropdown';
  values: string[];
  title: string;
  subtitle: string;
  defaultValue: string | undefined;
};

export type OptionForSettings = DropDownOption;

export type OptionsForSettings = Record<string, OptionForSettings>;

export abstract class CodeHighlighter {
  readonly name: string;
  readonly type: CodeHighlighterType;
  protected installed: boolean;

  constructor(name: string, type: CodeHighlighterType, installed = false) {
    this.name = name;
    this.type = type;
    this.installed = installed;
  }

  abstract isInstalled(): boolean;

  abstract detectLanguage(text: string): Language | undefined;

  abstract markupCode(language: string, text: string, characterLength: number): string | undefined;

  abstract getOptionsForSettings(_: (str: string) => string): OptionsForSettings;

  abstract set options(options: string);

  abstract get options(): string;
}
