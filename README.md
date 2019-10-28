# jest-given-when-then
Like rspec-given, but for Jest (port of [jasmine-given](https://github.com/searls/jasmine-given))

## Installation
To use this helper with Jest under Node.js, simply add it to your package.json with

``` bash
$ npm install jest-given-when-then --save-dev
```

And then from your spec (or in a spec helper), `require('jest-given-when-then')`. Be
sure that it's loaded after Jest itself is added to the `global` object.

You could also do this in the `jest.config.js` file like so:
```js
module.exports = {
  roots: ['<rootDir>'],
  setupFilesAfterEnv: [
    "<rootDir>/node_modules/jest-given-when-then/dist/jest-given-when-then.js"
  ]
}
```

## Description
> `jest-given-when-then` works the same way in the context of Jest as the `jasmine-given` works in the contest of Jasmine. This is why the majority of the documentation below is a straight copy-paste from `jasmine-given`.

**jest-given-when-then** is a [Jest](https://jestjs.io/) helper that encourages leaner, meaner specs using `Given`, `When`, and `Then`. It is a shameless tribute to Jim Weirich's terrific [rspec-given](https://github.com/jimweirich/rspec-given) gem.

The basic idea behind the "*-given" meme is a humble acknowledgement of given-when-then as the best English language analogue we have to arrange-act-assert. With rspec and Jest, we often approximate "given-when-then" with "let-beforeEach-it" (noting that Jest lacks `let`).

The big idea is "why approximate given-when-then, when we could actually just use them?"

The small idea is "if we couldn't write English along with our `it` blocks then we'd be encouraged to write cleaner, clearer matchers to articulate our expectations."

The subtle idea is that all "given"s should be evaluated before the "when"s. This can DRY up your specs: you don't need to repeat a series of "when"s in order to test the final result with different initial "given"s.

All ideas are pretty cool. Thanks, Jim!

## Example (JavaScript)

``` javascript
describe("assigning stuff to this", () => {
  Given(() => { this.number = 24; });
  Given(() => { this.number++; });
  When(() => { this.number *= 2; });
  Then(() => { return this.number === 50; });
  // or
  Then(() => { expect(this.number).toBe(50) });
});

describe("assigning stuff to variables", () => {
  var subject;
  Given(() => { subject = []; });
  When(() => { subject.push('foo'); });
  Then(() => { return subject.length === 1; });
  // or
  Then(() => { expect(subject.length).toBe(1); });
});
```

As you might infer from the above, `Then` will trigger a spec failure when the function passed to it returns `false`. As shown above, traditional expectations can still be used, but using simple booleans can make for significantly easier-to-read expectations when you're asserting something as obvious as equality.


## Execution order: Givens then Whens then Thens

The execution order for executing a `Then` is to execute all preceding `Given` blocks
from the outside in, and next all the preceding `When` blocks from the outside in, and
then the `Then`.  This means that a later `Given` can affect an earlier `When`!
While this may seem odd at first glance, it can DRY up your specs, especially if
you are testing a series of `When` steps whose final outcome depends on an
initial condition.  For example:

```
    Given -> user
    When -> login user

    describe "clicking create", ->

        When -> createButton.click()
        Then -> expect(ajax).toHaveBeenCalled()

        describe "creation succeeds", ->
            When -> ajax.success()
            Then -> object_is_shown()

            describe "reports success message", ->
                Then -> feedback_message.hasContents "created"

            describe "novice gets congratulations message", ->
                Given -> user.isNovice = true
                Then -> feedback_message.hasContents "congratulations!"

            describe "expert gets no feedback", ->
                Given -> user.isExpert = true
                Then -> feedback_message.isEmpty()
```
For the final three `Then`s, the execution order is:

```
       Given -> user
       When -> login user
       When -> createButton.click()
       When -> ajax.success()
       Then -> feedback_message.hasContents "created"

       Given -> user
       Given -> user.isNovice = true
       When -> login user
       When -> createButton.click()
       When -> ajax.success()
       Then -> feedback_message.hasContents "congratulations!"

       Given -> user
       Given -> user.isExpert = true
       When -> login user
       When -> createButton.click()
       When -> ajax.success()
       Then -> feedback_message.isEmpty()
```
Without this `Given`/`When` execution order, the only straightforward way to get the above behavior would be to duplicate then `When`s for each user case.

## Supporting Idempotent "Then" statements

Jim mentioned to me that `Then` blocks ought to be idempotent (that is, since they're assertions they should not have any affect on the state of the subject being specified). As a result, one improvement he made to rspec-given 2.x was the `And` method, which—by following a `Then`—would be like invoked **n** `Then` expectations without executing each `Then`'s depended-on `Given` and `When` blocks **n** times.

Take this example from jest-given-when-then's spec:

``` javascript
describe("eliminating redundant test execution", () => {
  describe("a traditional spec with numerous Then statements", () => {
    var timesGivenWasInvoked = 0,
        timesWhenWasInvoked = 0;
    Given(() => { timesGivenWasInvoked++; });
    When(() => { timesWhenWasInvoked++; });
    Then(() => { return timesGivenWasInvoked == 1; });
    Then(() => { return timesWhenWasInvoked == 2; });
    Then(() => { return timesGivenWasInvoked == 3; });
    Then(() => { return timesWhenWasInvoked == 4; });
  });
```
Because there are four `Then` statements, the `Given` and `When` are each executed four times. That's because it would be unreasonable for Jest to expect each `it` function  to be idempotent.

However, spec authors can leverage idempotence safely when writing in a given-when-then format. You opt-in with jest-given-when-then by using `And` blocks, as shown below:

``` javascript
describe("chaining Then statements", () => {
  var timesGivenWasInvoked = 0,
      timesWhenWasInvoked = 0;
  Given(() => { timesGivenWasInvoked++; });
  When(() => { timesWhenWasInvoked++; });
  Then(() => { return timesGivenWasInvoked == 1; })
  And(() => { return timesWhenWasInvoked == 1; })
  And(() => { return timesGivenWasInvoked == 1; })
  And(() => { return timesWhenWasInvoked == 1; })
});
```

In this example, `Given` and `When` are only invoked one time each for the first `Then`, because jest-given-when-then rolled all of those `Then` & `And` statements up into a single `it` in Jest.  Note that the label of the `it` is taken from the `Then` only.

Leveraging this feature is likely to have the effect of speeding up your specs, especially if your specs are otherwise slow (integration specs or DOM-heavy).


## Invariants

Rspec-given also introduced the notion of "Invariants".  An `Invariant` lets you specify a condition which should always be true within the current scope.  For example:

```ts
let stack;
Given(() => { stack = new MyStack(initialContents); });
Invariant(() => { (stack.empty != null) === (stack.depth === 0) });

describe("With some initial contents", () => {
  Given(() => this.initialContents = ["a", "b", "c"]);
  Then(() => stack.depth === 3);

  describe("Pop one", () => {
    When(() => this.result = stack.pop);
    Then(() => stack.depth === 2);
  });
  
  describe("Clear all", () => {
    When(() => stack.clear());
    Then(() => stack.depth === 0);
  });
});

describe("With no contents", () => {
  Then(() => stack.depth === 0);
});

…etc…
```

The `Invariant` will be checked before each `Then` block. Note that invariants do not appear as their own tests; if an invariant fails it will be reported as a failure within the `Then` block.  Effectively, an `Invariant` defines an implicit `And` which gets prepended to each `Then` within the current scope.  Thus the above example is a DRY version of:

```ts
Given(() => this.stack = new MyStack(this.initialContents));

describe("With some initial contents", () => {
  Given(() => this.initialContents = ["a", "b", "c"]);
  Then(() => this.stack.depth === 3);
  And(() => (this.stack.empty != null) === false);

  describe("Pop one", () => {
    When(() => this.result = this.stack.pop);
    Then(() => this.stack.depth === 2);
  });

  And(() => (this.stack.empty != null) === false);

  describe("Clear all", () => {
    When(() => this.stack.clear());
    Then(() => this.stack.depth === 0);
    And(() => (this.stack.empty != null) === true);
  });
});

describe("With no contents", () => {
  Then(() => this.stack.depth === 0);
  And(() => (this.stack.empty != null) === true);
});

…etc…

```

except that the `Invariant` is tested before each `Then` rather than after.

# "it"-style test labels

jest-given-when-then labels your underlying `it` blocks with the source expression itself, encouraging writing cleaner, clearer matchers -- and more DRY than saying the same thing twice, once in code and once in English.  But there are times when we're using third-party libraries or matchers that just don't read cleanly as English, even when they're expressing a simple concept.

Or, perhaps you are using a collection of `Then` and `And` statements to express a single specification.  So, when needed, you *may* use a label for your `Then` statements:

```ts
Then("makes AJAX POST request to create item", () => {
  expect(this.ajax_spy).toHaveBeenCalled();
});
And(() => this.ajax_spy.mostRecentCall.args[0].type = 'POST');
And(() => this.ajax_spy.mostRecentCall.args[0].url === "/items");
And(() => this.ajax_spy.mostRecentCall.args[0].data.item.user_id === userID);
And(() => this.ajax_spy.mostRecentCall.args[0].data.item.name === itemName);
```

# Testing Asynchronous Code

Following Jest's style for testing asynchronous code, the `Given` and `When` statements' functions can take a `done` parameter, which is a function to call when the asynchronous code completes.  Subsequent statements won't be executed until the `done` completes.  E.g.

```ts
Given((done) => {
  $.get("/stuff").success((data) => {
    this.stuff = data;
    done();
  })
});

When((done) => {
  $.post("/do", { stuff: this.stuff }).success((data) => {
    this.yay = true;
    done();
  });
})

Then(() => this.stuff === "the stuff");
Then(() => this.yay);
```

The `Then` and `And` statement functions can also take a `done` parameter, if the expectation itself requires asynchronous executation to evalute.  For example if you're using Selenium, you might want to check browser state in an expectation:
  
```ts
Then((done) => {
  browser.find('.alert', (el) => {
    expect(el).toBeDefined();
    done();
  });
});

And((done) => {
  browser.find('.cancel', (el) => {
    expect(cancel).toBeDefined();
    done();
  });
});
```
