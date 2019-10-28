import { Waterfall } from '../src/waterfall';

let packFunctions = (n: number, fn: Function) => __range__(0, n, false).map(i => fn);

//Repitition of the closures and lack of nesting is very intentional
//as to keep the async calls reasonable.

describe("Waterfall", () => {
  describe("basic run", function () {
    let counter: number;
    Given(() => counter = 0);
    When(() => new Waterfall(packFunctions(100, () => counter++), function () { }).flow());
    Then(() => expect(counter).toBe(100));
  });

  xdescribe("when we have 128,000 functions", function () {
    let counter: number;
    Given(() => counter = 0);
    When(() => new Waterfall(packFunctions(128000, () => counter++), function () { }).flow());
    Then(() => expect(counter).toBe(128000));
  });

  describe("final fn runs last", function () {
    let counter: number;
    let countDuringFinal: number;
    Given(() => counter = 0);
    Given(function (this: any) {
      return this.finalFn = () => countDuringFinal = 100;
    });
    When(function (this: any) {
      return new Waterfall(packFunctions(100, () => counter++), this.finalFn).flow();
    });
    Then(() => expect(countDuringFinal).toBe(counter));
  });

  describe("with async functions", function () {
    let counter: number;
    let asyncCounter: number;
    let counterDuringFinal: number;
    Given(function () {
      let ref;
      [counter, asyncCounter] = Array.from(ref = [0, 0]), ref;
    });
    Given(function (this: any) {
      jest.useFakeTimers();

      this.asyncFn = (done: jest.DoneCallback) => setTimeout(function () {
        counter++;
        asyncCounter++;
        done();
      }, 9);
    });

    Given(function (this: any) {
      this.finalFn = () => counterDuringFinal = counter;
    });
    Given(function (this: any) {
      this.functions = packFunctions(100, () => counter++)
        .concat(packFunctions(5, this.asyncFn))
        .concat(packFunctions(100, () => counter++))
        .concat(packFunctions(5, this.asyncFn));
    });

    When(function (this: any) {
      new Waterfall(this.functions, this.finalFn).flow();
      jest.runAllTimers();
    });
    Then(() => expect(counter).toBe(210));
    And(() => expect(asyncCounter).toBe(10))
    And(() => expect(counterDuringFinal).toBe(counter));
  });
});

function __range__(left: number, right: number, inclusive: boolean) {
  let range = [];
  let ascending = left < right;
  let end = !inclusive ? right : ascending ? right + 1 : right - 1;
  for (let i = left; ascending ? i < end : i > end; ascending ? i++ : i--) {
    range.push(i);
  }
  return range;
}
