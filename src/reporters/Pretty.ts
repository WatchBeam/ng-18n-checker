import chalk from 'chalk';

import { IProblem, IReporter } from '../Validator';

/**
 * Prints human readable report to console.
 */
export class Pretty implements IReporter {
  public report(problems: IProblem[]): void {
    if (problems.length === 0) {
      return;
    }
    problems.forEach(problem => {
      const prettyFile = `${chalk.green(problem.fileName.replace(`${process.cwd()}/`, ''))}:${
        problem.line
      }`;
      switch (problem.problem) {
        case 'missing':
          console.error(`${prettyFile}: Missing i18n in for text \`${chalk.blue(problem.meta)}\``);
          break;
        case 'format':
          console.error(`${prettyFile}: Invalid i18n format \`${chalk.blue(problem.meta)}\``);
          break;
        case 'nested':
          console.error(
            `${prettyFile}: Parent already already has attribute \`${chalk.blue(problem.meta)}\``,
          );
          break;
        default:
          throw new Error(`Unknown problem ${problem.problem}`);
      }
    });
    console.error(`Total problems: ${problems.length}`);
  }
}
