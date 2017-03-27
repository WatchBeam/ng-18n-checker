import { readFileSync } from 'fs';
import { Parser } from 'htmlparser2';

export interface IReporter {
    report(problems: IProblem[]): Promise<void>;
}

interface IElementEntry {
    tag: string;
    i18n?: string;
}

export interface IProblem {
    fileName: string;
    line: number;
    problem: 'missing' | 'format' | 'nested';
    meta?: string;
}

export interface II18nValidatorOptions {
    attrPattern?: RegExp;
    ignoreTags?: string[];
    templateMatcher?: RegExp;
    assumeTextCondition?: RegExp;
}

export class I18nValidator {

    public static readonly defaultAttributeMacher = /^([\w-]+)#(\w+):(\w+)\|.*?$/;
    public static readonly defaultTemplateMatcher = /\{\{.*?\}\}/g;
    public static readonly defaultAssumeTextCondition = /\w{2,}/;

    constructor(private options: II18nValidatorOptions = {}) {
        options.ignoreTags = options.ignoreTags || [];
        options.templateMatcher = options.templateMatcher || I18nValidator.defaultTemplateMatcher;
        options.assumeTextCondition = options.assumeTextCondition || I18nValidator.defaultAssumeTextCondition;
    }

    public processFile(fileName: string, contents: string = readFileSync(fileName, 'utf8')): IProblem[] {
        const problems: IProblem[] = [];

        const lines = contents.split('\n');
        // Used to make sure we don't match identical text on the same position
        let lastLine = -1;
        const matchLine = (needle: string): number => {
            return lastLine = lines.findIndex((l, idx) => (idx >= lastLine) && l.includes(needle)) + 1;
        };

        const stack: IElementEntry[] = [];
        let curr: IElementEntry;

        new Parser(
            {
                onopentag: (tag: string, attributes: { [attrName: string]: string }) => {
                    // Check if any parent element already has i18n
                    const i18nParent = stack.find(p => !!p.i18n);
                    if (i18nParent && attributes['i18n']) {
                        problems.push({
                            fileName,
                            line: matchLine(i18nParent.i18n),
                            problem: 'nested',
                            meta: curr.i18n,
                        });
                    }
                    stack.push(curr = {
                        tag,
                        i18n: attributes['i18n'],
                    });
                    if (!attributes['i18n']) {
                        return;
                    }
                    // Format mismatch
                    const match = attributes['i18n'].match(this.options.attrPattern);
                    if (!match) {
                        problems.push({
                            fileName,
                            line: matchLine(attributes['i18n']),
                            problem: 'format',
                            meta: attributes['i18n'],
                        });
                        return;
                    }
                },
                ontext: (text: string) => {
                    if (curr && this.options.ignoreTags.includes(curr.tag)) {
                        return;
                    }
                    if (curr && curr.i18n) {
                        return;
                    }

                    const unTemplated = text.replace(this.options.templateMatcher, '');
                    const trimmed = text.trim();
                    const containsAnythingMeaningful = this.options.assumeTextCondition.test(unTemplated);
                    if (trimmed !== '' && containsAnythingMeaningful && !stack.some(p => !!p.i18n)) {
                        problems.push({
                            fileName,
                            line: matchLine(trimmed.split('\n')[0]),
                            problem: 'missing',
                            meta: trimmed,
                        });
                    }
                },
                onclosetag: () => {
                    stack.pop();
                    curr = stack[stack.length - 1];
                },
            },
            {
                recognizeSelfClosing: true,
            },
        )
           .parseComplete(contents);
        return problems;
    }
}
