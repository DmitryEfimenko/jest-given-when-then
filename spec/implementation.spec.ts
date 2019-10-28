import { matchers } from '../src/matchers';

describe("jest-given-when-then implementation", () => {
  describe("returning boolean values from Then", () => {
    describe("Then()'s responsibility", () => {
      let passed: boolean;
      beforeEach(function () {
        expect.extend({
          toHaveReturnedFalseFromThen: (args) => {
            passed = matchers.toHaveReturnedFalseFromThen(args).pass;
            return {
              pass: false,
              message: () => 'mock'
            }
          }
        });
      });

      describe("a true is returned", function () {
        Then(() => 1 + 1 === 2);
        it("passed", () => expect(passed).toBe(false));
      });

      describe("a false is returned", function () {
        Then(() => 1 + 1 === 3);
        it("failed", () => expect(passed).toBe(true));
      });
    })
  });


  describe("support for jest-only style `Then.only` blocks", () => {
    let spy: jasmine.Spy;
    Given(function (this: any) {
      this.expectationFunction = jasmine.createSpy('my expectation');
    });
    Given(() => it.only);
    Given(() => spy = spyOn(it, 'only'));
    When(function (this: any) {
      Then.only(this.expectationFunction);
    });
    Then(() => expect(spy.calls.allArgs()[0][0]).toEqual(jasmine.any(String)));
    And(function (this: any) {
      spy.calls.allArgs()[0][1].call();
      return this.expectationFunction.calls.length === 1;
    });
  });

  describe("support for async done() style blocks", () => {
    describe("Then blocks", () => {
      let afterEaches: any[] = [];
      let itSpy: jasmine.Spy;

      beforeEach(function () {
        itSpy = spyOn(window, 'it');
        spyOn(window, 'beforeEach').and.callFake(f => f());

        afterEaches = [];
        spyOn(window, 'afterEach').and.callFake(f => {
          return afterEaches.push(f);
        });
      });

      afterEach(function () {
        return Array.from(afterEaches).map(afterEachAction => afterEachAction());
      });

      describe("Then", () => {
        beforeEach(() => Then(function () { }));
        it('', () => {
          expect(itSpy.calls.allArgs()[0][0]).toEqual(jasmine.any(String));
          expect(itSpy.calls.allArgs()[0][1].length).toEqual(1);
        });
      });

      describe("When", () => {
        let thenSpy: jasmine.Spy;
        beforeEach(function () {
          thenSpy = jasmine.createSpy("Then");
        });

        describe("the when does not call its done()", function () {
          beforeEach(function () {
            When(function (done) { });
            Then(function (done) {
              thenSpy();
              done();
            });
          });

          it('', () => {
            let specImplementation = itSpy.calls.allArgs()[0][1];
            let doneProvidedByJasmineRunner = jasmine.createSpy("done");
            specImplementation(doneProvidedByJasmineRunner);
            expect(thenSpy).not.toHaveBeenCalled();
            expect(doneProvidedByJasmineRunner).not.toHaveBeenCalled();
          });
        });

        describe("the when does indeed call its done()", function () {
          beforeEach(function () {
            When(done => done());
            Then(function (done) {
              thenSpy();
              done();
            });
          });
          it('', () => {
            let specImplementation = itSpy.calls.allArgs()[0][1];
            let doneProvidedByJasmineRunner = jasmine.createSpy("done");
            specImplementation(doneProvidedByJasmineRunner);
            expect(thenSpy).toHaveBeenCalled();
            expect(doneProvidedByJasmineRunner).toHaveBeenCalled();
          });
        });

        describe("the when calls its done() and the then has no done", function () {
          beforeEach(function () {
            When(done => done());
            Then(function () {
              return thenSpy();
            });
          });
          it('', () => {
            let specImplementation = itSpy.calls.allArgs()[0][1];
            let doneProvidedByJasmineRunner = jasmine.createSpy("done");
            specImplementation(doneProvidedByJasmineRunner);
            expect(thenSpy).toHaveBeenCalled();
            expect(doneProvidedByJasmineRunner).toHaveBeenCalled();
          });
        });

        describe("has a boatload of commands", function () {
          let callCount: number;
          beforeEach(function () {
            callCount = 0;

            let inc = (done?: jest.DoneCallback) => {
              callCount++;
              return typeof done === 'function' ? done() : undefined;
            };

            Invariant(done => inc(done));
            Invariant(() => inc());
            When(done => inc(done));
            And(() => inc());
            Then(done => inc(done));
            And(() => inc());
            And(done => inc(done));
            And(() => inc());
          });

          it('', () => {
            let specImplementation = itSpy.calls.allArgs()[0][1];
            let doneProvidedByJasmineRunner = jasmine.createSpy("done");

            specImplementation(doneProvidedByJasmineRunner);

            expect(callCount).toBe(8);
            expect(doneProvidedByJasmineRunner).toHaveBeenCalled();
          });
        });
      });
    });

    describe("Given blocks", () => {
      let beforeEachSpy: jasmine.Spy;
      Given(() => beforeEachSpy = spyOn(window, 'beforeEach'));

      describe("no-arg", function () {
        When(() => Given(function () { }));
        Then(() => beforeEachSpy.calls.allArgs()[0][0].length === 0);
      });

      describe("done-ful", function () {
        When(() => Given(function (done) { }));
        Then(() => beforeEachSpy.calls.allArgs()[0][0].length === 1);
      });
    });
  });


  describe("matchers", () => {
    Given(function (this: any) {
      this.subject = matchers;
    });
    describe("toHaveReturnedFalseFromThen", () => {
      When(function (this: any) {
        this.result = this.subject.toHaveReturnedFalseFromThen.call(this.describe, this, 1);
      });

      describe("super simple uses", () => {
        describe("simple failing matcher", function () {
          Given(function (this: any) {
            this.describe = {
              actual() {
                return false;
              }
            };
          });
          Then(function (this: any) {
            expect(this.describe.message()).toEqual('Then clause `false` failed by returning false');
          });
        });

        describe("a matcher that blows up", function () {
          Given(function (this: any) {
            this.describe = {
              actual() {
                throw "Whoops";
              }
            };
          });
          Then(function (this: any) {
            expect(this.describe.message()).toEqual('Then clause `throw "Whoops"` failed by throwing: Whoops');
          });
        });
      });

      describe("obfuscated by variables", () => {
        Given(function (this: any) {
          this.describe = {
            actual() {
              return this.a() === this.b;
            }
          };
        });

        describe("simple threequals matcher", function () {
          Given(function (this: any) {
            return this.a = () => 1;
          });
          Given(function (this: any) {
            return this.b = 3;
          });
          Then(function (this: any) {
            expect(this.describe.message()).toEqual(`\
Then clause \`this.a() === this.b\` failed by returning false

This comparison was detected:
  this.a() === this.b
  1 === 3\
`);
          });
        });

        describe("two deeply equal but not === things", function () {
          Given(function (this: any) {
            return this.a = () => [1];
          });
          Given(function (this: any) {
            return this.b = [1];
          });
          Then(function (this: any) {
            expect(this.describe.message()).toEqual(`\
Then clause \`this.a() === this.b\` failed by returning false

This comparison was detected:
  this.a() === this.b
  1 === 1

However, these items are deeply equal! Try an expectation like this instead:
  expect(this.a()).toEqual(this.b)\
`);
          });
        });

        describe("simple !== matcher", function () {
          Given(function (this: any) {
            this.describe = {
              actual() {
                return this.a() !== this.b;
              }
            };
          });
          Given(function (this: any) {
            return this.a = () => 1;
          });
          Given(function (this: any) {
            return this.b = 1;
          });
          Then(function (this: any) {
            expect(this.describe.message()).toEqual(`\
Then clause \`this.a() !== this.b\` failed by returning false

This comparison was detected:
  this.a() !== this.b
  1 !== 1\
`);
          });
        });

        describe("a matcher that blows up", function () {
          Given(function (this: any) {
            return this.a = function () {
              throw 'Whoops';
            };
          });
          Given(function (this: any) {
            return this.b = 3;
          });
          Then(function (this: any) {
            expect(this.describe.message()).toEqual(`\
Then clause \`this.a() === this.b\` failed by throwing: Whoops

This comparison was detected:
  this.a() === this.b
  <Error: "Whoops"> === 3\
`);
          });
        });

        describe("a final statement in a multi statement Then", function () {
          Given(function (this: any) {
            this.describe = {
              actual() {
                "whatever other stuff in previous statements.";

                return this.a() === this.b;
              }
            };
          });
          Given(function (this: any) {
            return this.a = () => 1;
          });
          Given(function (this: any) {
            return this.b = 3;
          });
          Then(function (this: any) {
            expect(this.describe.message()).toEqual(`\
Then clause \`"whatever other stuff in previous statements."; return this.a() === this.b\` failed by returning false

This comparison was detected:
  this.a() === this.b
  1 === 3\
`);
          });
        });

        describe("both sides will ReferenceError", function () {
          let a: any = function () { };
          let b = 3;
          Given(function (this: any) {
            this.describe = {
              actual() {
                return a() === b;
              }
            };
          });
          Then(function (this: any) {
            expect(this.describe.message()).toEqual("Then clause `a() === b` failed by returning false");
          });
        });
      });
    });
  });
});
