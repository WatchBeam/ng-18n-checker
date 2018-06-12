import { expect } from 'chai';

import { exec } from 'child_process';

type ErrorWithCode = Error & { code: number };

describe('E2E', () => {
  it('Reports problems in broken file', done => {
    exec(
      'node node_modules/ts-node/dist/bin.js src/bin test/broken.html -p "\\w+:\\w+"',
      (err, stdout, stderr) => {
        expect((<ErrorWithCode>err).code).to.equal(1);
        expect(stdout).to.equal('');
        expect(stderr).to.equal(
          'test/broken.html:1: Missing i18n in for text `Hello!`\ntest/broken.html:2: Invalid i18n format `Hello`\ntest/broken.html:3: Parent already already has attribute `Greeting:Hello user`\nTotal problems: 3\n', // tslint:disable-line
        );
        done();
      },
    );
  });

  it('Reports no problems in good files', done => {
    exec(
      'node node_modules/ts-node/dist/bin.js src/bin test/valid.html -p "\\w+:\\w+"',
      (err, stdout, stderr) => {
        expect(err).to.equal(null, 'Expected no error');
        expect(stdout).to.equal('');
        expect(stderr).to.equal('');
        done();
      },
    );
  });

  it('Allows specifying custom reporters', done => {
    exec(
      'node node_modules/ts-node/dist/bin.js src/bin test/broken.html -p "\\w+:\\w+" -r "./test/NullReporter.js"',
      (err, stdout, stderr) => {
        expect((<ErrorWithCode>err).code).to.equal(1);
        expect(stdout).to.equal('');
        expect(stderr).to.equal('');
        done();
      },
    );
  });
});
