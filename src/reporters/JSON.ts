import { IProblem, IReporter } from '../Validator';

/**
 * Prints json report to console.
 */
export class Json implements IReporter {
  public report(problems: IProblem[]): void {
    console.log(JSON.stringify(problems)); // tslint:disable-line:no-console
  }
}
