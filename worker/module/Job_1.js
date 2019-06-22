const _ = window._;

let jobUID = 0;

class Job {
    constructor(manager, args) {
        this.id = jobUID++;
        this.manager = manager;
        this.command;
        this.args;
        this._promise;
        this._resolve;
        this._reject;
        //------------------
        this._init(args);
    }
    //------------------------------------------------------------------
    _init(args) {
        const $this = this;

        this.command = args.shift();

        if (typeof (_[this.command]) !== "function") {
            throw new TypeError("no this function(" + this.command + ")");
        }

        this.args = args;


        this._promise = new Promise(function (res, rej) {
            $this._resolve = res;
            $this._reject = rej;
        });
    }
    //------------------------------------------------------------------
    // 對 worker 發出命令
    getCommand() {
        let command = {
            command: (this.command),
            args: (this.args),
            jobID: (this.id)
        };
        return command;
    };
    //------------------------------------------------------------------
    resolve(data) {
        this._resolve(data);
    };
    //------------------------------------------------------------------
    reject(e) {
        this._reject(e);
    };
    //------------------------------------------------------------------
    promise() {
        return this._promise;
    };
}

export { Job };