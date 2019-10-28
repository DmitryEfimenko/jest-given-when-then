"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.matchers = {
    toHaveReturnedFalseFromThen: ({ expectation, currentSpec, n, stack, maybeDone }) => {
        let result = false;
        let exception = undefined;
        try {
            result = expectation.call(currentSpec, maybeDone);
        }
        catch (e) {
            exception = e;
        }
        return {
            pass: result === false || exception !== undefined,
            message: () => {
                let stringyExpectation = stringifyExpectation(expectation);
                let msg = `Then clause${n > 1 ? ` #${n}` : ""} \`${stringyExpectation}\` failed by `;
                if (exception) {
                    msg += `throwing: ${exception.toString()}`;
                }
                else {
                    msg += "returning false";
                }
                msg += additionalInsightsForErrorMessage(stringyExpectation, currentSpec);
                if (stack != null) {
                    msg += `\n\n${stack}`;
                }
                return msg;
            }
        };
    }
};
function stringifyExpectation(expectation) {
    let matches = expectation.toString().replace(/\n/g, '').match(/function\s?\(.*\)\s?{\s*(return\s+)?(.*?)(;)?\s*}/i);
    if (matches && matches.length >= 3) {
        return matches[2].replace(/\s+/g, ' ');
    }
    else {
        return "";
    }
}
exports.stringifyExpectation = stringifyExpectation;
function additionalInsightsForErrorMessage(expectationString, currentSpec) {
    let comparison;
    let expectation = finalStatementFrom(expectationString);
    if (comparison = wasComparison(expectation)) {
        return comparisonInsight(expectation, comparison, currentSpec);
    }
    else {
        return "";
    }
}
exports.additionalInsightsForErrorMessage = additionalInsightsForErrorMessage;
function finalStatementFrom(expectationString) {
    let multiStatement;
    if (multiStatement = expectationString.match(/.*return (.*)/)) {
        return multiStatement[multiStatement.length - 1];
    }
    else {
        return expectationString;
    }
}
function wasComparison(expectation) {
    let comparison;
    if (comparison = expectation.match(/(.*) (===|!==|==|!=|>|>=|<|<=) (.*)/)) {
        let [s, left, comparator, right] = Array.from(comparison);
        return { left, comparator, right };
    }
}
function comparisonInsight(expectation, comparison, currentSpec) {
    let left = evalInContextOfSpec(comparison.left, currentSpec);
    let right = evalInContextOfSpec(comparison.right, currentSpec);
    if (apparentReferenceError(left) && apparentReferenceError(right)) {
        return "";
    }
    let msg = `\
\n
This comparison was detected:
  ${expectation}
  ${left} ${comparison.comparator} ${right}\
`;
    return msg;
}
function evalInContextOfSpec(operand, currentSpec) {
    try {
        return (() => eval(operand)).call(currentSpec);
    }
    catch (e) {
        return `<Error: \"${__guardMethod__(e, 'message', (o1) => o1.message()) || e}\">`;
    }
}
;
function apparentReferenceError(result) {
    return /^<Error: "ReferenceError/.test(result);
}
function __guardMethod__(obj, methodName, transform) {
    if (typeof obj !== 'undefined' && obj !== null && typeof obj[methodName] === 'function') {
        return transform(obj, methodName);
    }
    else {
        return undefined;
    }
}
//# sourceMappingURL=matchers.js.map