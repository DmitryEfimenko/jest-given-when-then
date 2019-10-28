"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const matchers_1 = require("./matchers");
const waterfall_1 = require("./waterfall");
(function () {
    expect.extend(matchers_1.matchers);
    let mostRecentlyUsed = null;
    let root = (1, eval)('this');
    let currentSpec = null;
    let whenList = [];
    let invariantList = [];
    let mostRecentExpectations = null;
    let mostRecentStacks = null;
    beforeEach(function () {
        currentSpec = this;
    });
    root.Given = function () {
        mostRecentlyUsed = root.Given;
        beforeEach(getBlock(arguments));
    };
    root.When = function () {
        mostRecentlyUsed = root.When;
        let b = getBlock(arguments);
        beforeEach(() => whenList.push(b));
        afterEach(() => whenList.pop());
    };
    root.Invariant = function () {
        mostRecentlyUsed = root.Invariant;
        let invariantBehavior = getBlock(arguments);
        beforeEach(() => invariantList.push(invariantBehavior));
        afterEach(() => invariantList.pop());
    };
    root.Then = function () {
        return declareJestSpec(arguments);
    };
    root.Then.only = function () {
        return declareJestSpec(arguments, it.only);
    };
    root.subsequentThen = function (additionalExpectation) {
        if (!mostRecentExpectations) {
            throw new Error('subsequentThen can only be called after Then');
        }
        mostRecentExpectations.push(additionalExpectation);
        mostRecentStacks.push(errorWithRemovedLines("failed expectation", 3));
        return this;
    };
    mostRecentlyUsed = root.Given;
    root.And = function () {
        if (!mostRecentlyUsed) {
            throw new Error(`Spec isn't set`);
        }
        return mostRecentlyUsed.apply(this, argsToArray(arguments));
    };
    function getBlock(thing) {
        let setupFunction = o(thing).firstThat(arg => o(arg).isFunction());
        let assignResultTo = o(thing).firstThat(arg => o(arg).isString());
        return doneWrapperFor(setupFunction, function (done) {
            let context = currentSpec;
            let result = setupFunction.call(context, done);
            if (assignResultTo) {
                if (!context[assignResultTo]) {
                    return context[assignResultTo] = result;
                }
                else {
                    throw new Error(`Unfortunately, the variable '${assignResultTo}' is already assigned to: ${context[assignResultTo]}`);
                }
            }
        });
    }
    ;
    function declareJestSpec(specArgs, itFunction) {
        let expectations;
        let stacks;
        if (itFunction == null) {
            itFunction = it;
        }
        let label = o(specArgs).firstThat(arg => o(arg).isString());
        let expectationFunction = o(specArgs).firstThat(arg => o(arg).isFunction());
        mostRecentlyUsed = root.subsequentThen;
        mostRecentExpectations = expectations = [expectationFunction];
        mostRecentStacks = stacks = [errorWithRemovedLines("failed expectation", 3)];
        itFunction(`then ${label != null ? label : matchers_1.stringifyExpectation(expectationFunction)}`, function (jestDone) {
            let userCommands = [].concat(whenList, invariantList, wrapAsExpectations(expectations, stacks));
            return new waterfall_1.Waterfall(userCommands, jestDone).flow();
        });
        return { Then: root.subsequentThen, And: root.subsequentThen };
    }
    ;
    function wrapAsExpectations(expectations, stacks) {
        return Array.from(expectations)
            .map((expectation, i) => {
            return doneWrapperFor(expectation, (maybeDone) => {
                const args = {
                    expectation,
                    currentSpec,
                    n: i + 1,
                    stack: stacks[i],
                    maybeDone
                };
                return expect(args).not.toHaveReturnedFalseFromThen();
            });
        });
    }
    function doneWrapperFor(func, toWrap) {
        if (func.length === 0) {
            return () => toWrap();
        }
        else {
            return (done) => toWrap(done);
        }
    }
    ;
    function errorWithRemovedLines(msg, n) {
        let stack;
        if (stack = new Error(msg).stack) {
            let [error, ...lines] = Array.from(stack.split("\n"));
            return `${error}\n${lines.slice(n).join("\n")}`;
        }
    }
    ;
    var o = (thing) => ({
        isFunction() {
            return Object.prototype.toString.call(thing) === "[object Function]";
        },
        isString() {
            return Object.prototype.toString.call(thing) === "[object String]";
        },
        firstThat(test) {
            let i = 0;
            while (i < thing.length) {
                if (test(thing[i]) === true) {
                    return thing[i];
                }
                i++;
            }
            return undefined;
        }
    });
    function argsToArray(args) {
        var arrayOfArgs = [];
        for (var i = 0; i < args.length; i++) {
            arrayOfArgs.push(args[i]);
        }
        return arrayOfArgs;
    }
    ;
})();
//# sourceMappingURL=jest-given-when-then.js.map