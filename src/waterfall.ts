export class Waterfall {
  functions: any[];

  constructor(functions: any[] = [], public finalCallback = () => { }) {
    this.functions = this.cloneArray(functions);
  }

  flow(): any {
    if (this.functions.length === 0) {
      return this.finalCallback();
    }
    let func = this.functions.shift();
    if (func.length > 0) {
      return func(() => this.flow());
    } else {
      func();
      return this.flow();
    }
  }

  private cloneArray(a: any[]) {
    return a.slice(0);
  }
}
