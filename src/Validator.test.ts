import { I18nValidator } from './Validator';

import { expect } from 'chai';

describe('Validator', () => {
    const tests = [
        {
            name: 'Reports missing i18n tags',
            html: '<span>Hello!</span>',
            result: {
                fileName: 'dummy',
                line: 1,
                meta: 'Hello!',
                problem: 'missing',
            },
        },
        {
            name: 'Ignores when flagged',
            html: '<span><!-- i18n-checker: disable --> Hello!</span>',
            result: true,
        },
        {
            name: 'Reports invalid i18n formats',
            html: '<span i18n="Hello">Hello!</span>',
            result: {
                fileName: 'dummy',
                line: 1,
                meta: 'Hello',
                problem: 'format',
            },
        },
        {
            name: 'Reports nested i18n tags',
            html: '<span i18n="Greeting:Hello user">Hello <span i18n="Text:User">User!</span></span>',
            result: {
                fileName: 'dummy',
                line: 1,
                meta: 'Greeting:Hello user',
                problem: 'nested',
            },
        },
        {
            name:  'Does not report missing i18n in nested tags',
            html: '<span i18n="Greeting:Hello user">Hello <span>User!</span></span>',
            result: true,
        },
        {
            name: 'Does not report ignored tags',
            html: '<code>asdfsgf</code>',
            result: true,
        },
        {
            name: 'Does not report template tags',
            html: '<span>{{test}}</span>',
            result: true,
        },
        {
            name: 'Does not report template tags with simple additions',
            html: '<span> /${{test}}$. %</span>',
            result: true,
        },
    ];

    let validator: I18nValidator;
    beforeEach(() => {
        validator = new I18nValidator({
            attrPattern: /\w+:\w+/,
            ignoreTags: ['code'],
        });
    });

    tests.forEach(test => {
        it(test.name, () => {
            const res = validator.processFile('dummy', test.html);
            expect(res).to.deep.equal(test.result === true ? [] : [test.result], 'Expected problems to match');
        });
    });
});
