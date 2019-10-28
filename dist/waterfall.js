"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Waterfall {
    constructor(functions = [], finalCallback = () => { }) {
        this.finalCallback = finalCallback;
        this.functions = this.cloneArray(functions);
    }
    flow() {
        if (this.functions.length === 0) {
            return this.finalCallback();
        }
        let func = this.functions.shift();
        if (func.length > 0) {
            return func(() => this.flow());
        }
        else {
            func();
            return this.flow();
        }
    }
    cloneArray(a) {
        return a.slice(0);
    }
}
exports.Waterfall = Waterfall;
//# sourceMappingURL=waterfall.js.map