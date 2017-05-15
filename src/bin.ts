#!/usr/bin/env node
import yargs = require('yargs');
import { existsSync, readFileSync } from 'fs';
import { sync } from 'glob';
import { resolve } from 'path';

import { Json } from './reporters/JSON';
import { Pretty } from './reporters/Pretty';

import { I18nValidator, IProblem, IReporter } from './Validator';

const knownReporters: { [name: string]: IReporter } = {
    pretty: new Pretty(),
    json: new Json(),
};

interface ICLIOpts {
    reporters: string[];
    ignoreTags: string[];
    attributePattern: RegExp;
    templateMatcher: RegExp;
    assumeTextCondition: RegExp;
    _: string[];
    help: boolean;
}

const args: ICLIOpts = yargs.usage(
    'Usage: ng-18-checker -r reporter1 reporter2 -i ignoredTag1 ignoredTag2 -p attributePattern fileGlob1 fileGlob2 ...',
)
.help()

.config('config', configPath => JSON.parse(readFileSync(configPath, 'utf-8')))

.array('reporters')
.alias('reporters', 'r')
.default('reporters', ['pretty'])
.describe('reporters', 'List of reporters to use, can also be path to custom file, available are: `pretty` (stderr) and `json` (stdout)')

.array('ignoreTags')
.alias('ignoreTags', 'i')
.default('ignoreTags', [])
.describe('ignoreTags', 'List of html tags to ignore')

.string('attributePattern')
.alias('attributePattern', 'p')
.default('attributePattern', I18nValidator.defaultAttributeMacher.source)
.coerce<string, RegExp>('attributePattern', str => new RegExp(str))
.describe('attributePattern', 'Pattern to match the i18n attribute content with')

.string('templateMatcher')
.alias('templateMatcher', 't')
.default('templateMatcher', I18nValidator.defaultTemplateMatcher.source)
.coerce<string, RegExp>('templateMatcher', str => new RegExp(str))
.describe('templateMatcher', 'Pattern to identify the templates used delimiters')

.string('assumeTextCondition')
.alias('assumeTextCondition', 'a')
.default('assumeTextCondition', I18nValidator.defaultAssumeTextCondition.source)
.coerce<string, RegExp>('assumeTextCondition', str => new RegExp(str))
.describe('assumeTextCondition', 'Pattern to identify minimal text that should force a translation to be present.')

.string('urlRegEx')
.alias('urlRegEx', 'u')
.default('urlRegEx', I18nValidator.urlRegEx.source)
.coerce<string, RegExp>('urlRegEx', str => new RegExp(str))
.describe('urlRegEx', 'Pattern to identify as url and ignore.')

.string('emailRegEx')
.alias('emailRegEx', 'e')
.default('emailRegEx', I18nValidator.emailRegEx.source)
.coerce<string, RegExp>('emailRegEx', str => new RegExp(str))
.describe('emailRegEx', 'Pattern to identify as email and ignore.')
.argv;

if (args.help) {
    process.exit(0);
}

if (args._.length === 0) {
    process.exit(0);
}

const validator = new I18nValidator({
    attrPattern: args.attributePattern,
    ignoreTags: args.ignoreTags,
    templateMatcher: args.templateMatcher,
    assumeTextCondition: args.assumeTextCondition,
});

let problems: IProblem[] = [];

let filesFound = false;

const reporters: IReporter[] = args.reporters.map(nameOrFile => {
    const potentialFilePath = resolve(nameOrFile);
    if (existsSync(potentialFilePath)) {
        return new (require(potentialFilePath))(); // tslint:disable-line non-literal-require
    }
    if (nameOrFile in knownReporters) {
        return knownReporters[nameOrFile];
    }
    console.error(`Unknown reporter ${nameOrFile}!`);
    process.exit(1);
});
args._.forEach(pattern => sync(pattern).forEach(file => {
    filesFound = true;
    problems = problems.concat(validator.processFile(file));
}));
reporters.forEach(reporter => reporter.report(problems));

if (problems.length !== 0) {
    process.exit(1);
}

if (!filesFound) {
    console.warn('No files processed');
}

process.exit(0);
