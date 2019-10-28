describe("jest-given-when-then CoffeeScript API", () => {
  describe("assigning stuff to variables", () => {
    let subject = null;
    Given(() => subject = []);
    When(() => subject.push('foo'));
    Then(() => subject.length === 1);
    // or
    Then(() => expect(subject.length).toBe(1));
  });

  describe("eliminating redundant test execution", () => {
    describe("a traditional spec with numerous Then statements", () => {
      let timesWhenWasInvoked: number;
      let timesGivenWasInvoked = timesWhenWasInvoked = 0;
      Given(() => timesGivenWasInvoked++);
      When(() => timesWhenWasInvoked++);
      Then(() => timesGivenWasInvoked === 1);
      Then(() => timesWhenWasInvoked === 2);
      Then(() => timesGivenWasInvoked === 3);
      Then("it's important this gets invoked separately for each spec", () => timesWhenWasInvoked === 4);
    });

    describe("using And statements", () => {
      let timesWhenWasInvoked: number;
      let timesGivenWasInvoked = timesWhenWasInvoked = 0;
      Given(() => timesGivenWasInvoked++);
      When(() => timesWhenWasInvoked++);
      Then(() => timesGivenWasInvoked === 1);
      And(() => timesWhenWasInvoked === 1);
      And(() => timesGivenWasInvoked === 1);
      And(() => timesWhenWasInvoked === 1);
    });

    describe("chaining Then statements", () => {
      let timesWhenWasInvoked: number;
      let timesGivenWasInvoked = timesWhenWasInvoked = 0;
      Given(() => timesGivenWasInvoked++);
      When(() => timesWhenWasInvoked++);
      Then(() => timesGivenWasInvoked === 1)
        .And(() => timesWhenWasInvoked === 1)
        .And(() => timesGivenWasInvoked === 1)
        .And(() => timesWhenWasInvoked === 1);
      Then(() => timesWhenWasInvoked === 2);
    });
  });

  describe("Invariant", () => {
    describe("implicitly called for each Then", () => {
      let timesInvariantWasInvoked = 0;
      Invariant(() => timesInvariantWasInvoked++);
      Then(() => timesInvariantWasInvoked === 1);
      Then(() => timesInvariantWasInvoked === 2);
    });

    describe("following a Then", () => {
      Invariant(function (this: any) {
        expect(this.meat).toContain('pork');
      });
      Given(function (this: any) {
        return this.meat = 'pork';
      });
      When(function (this: any) {
        return this.meat += 'muffin';
      });
      Then(function (this: any) {
        return this.meat === 'porkmuffin';
      });
      And(function (this: any) {
        return this.meat !== 'hammuffin';
      });
    });
  });

  describe("And", () => {
    describe("following a Given", () => {
      Given(function (this: any) {
        return this.a = 'a';
      });
      And(function (this: any) {
        return this.b = 'b' === this.a;
      }); //is okay to return false
      Then(function (this: any) {
        return this.b === false;
      });
    });

    describe("following a Then", () => {
      Given(function (this: any) {
        return this.meat = 'pork';
      });
      When(function (this: any) {
        return this.meat += 'muffin';
      });
      Then(function (this: any) {
        return this.meat === 'porkmuffin';
      });
      And(function (this: any) {
        return this.meat !== 'hammuffin';
      });
    });
  });

  describe("Givens before Whens order", () => {
    describe("Outer block", function () {
      Given(function (this: any) {
        return this.a = 1;
      });
      Given(function (this: any) {
        return this.b = 2;
      });
      When(function (this: any) {
        return this.sum = this.a + this.b;
      });
      Then(function (this: any) {
        return this.sum === 3;
      });

      describe("Middle block", () => {
        Given(function (this: any) {
          return this.units = "days";
        });
        When(function (this: any) {
          return this.label = `${this.sum} ${this.units}`;
        });
        Then(function (this: any) {
          return this.label === "3 days";
        });

        describe("Inner block A", () => {
          Given(function (this: any) {
            return this.a = -2;
          });
          Then(function (this: any) {
            return this.label === "0 days";
          });
        });

        describe("Inner block B", () => {
          Given(function (this: any) {
            return this.units = "cm";
          });
          Then(function (this: any) {
            return this.label === "3 cm";
          });
        });
      });
    })
  });
});
