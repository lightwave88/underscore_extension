!(function (global) {
    // debugger;

    (function () {

        if (typeof module !== 'undefined' && module.exports) {
            // 指定 loadash|underscode 的 path
            module.exports = function (obj) {
                // 建構
                factory(obj);
            };
        } else {
            if (typeof (global._) === "undefined") {
                // worker 本體建構
                return;
            }
            // 建構
            factory(global._);
        }
    }());

    return;
    //==========================================================================
    function factory(_) {
        if (typeof Promise !== 'function') {
            throw new Error('need Promise library');
        }

        if (typeof _.deferred === 'undefined') {
            _.mixin({
                deferred: function () {
                    return new Deferred();
                }
            });
        }
        //----------------------------------------------------------------------
        // 擴增 promise api
        //
        // promise.thenWith()
        // promise.done()
        // promise.doneWith()
        // promise.catchWith()
        // promise.always()
        // promise.alwaysWith()
        //
        //

        // promise.thenWith()
        if (typeof Promise.prototype.thenWith === 'undefined') {
            Promise.prototype.thenWith = function (onFulfilled, onRejected, context) {

                if (typeof context !== 'object') {
                    context = null;
                }

                if (typeof onFulfilled === 'function') {
                    onFulfilled = onFulfilled.bind(context);
                }
                if (typeof onRejected === 'function') {
                    onRejected = onRejected.bind(context);
                }

                return this.then(onFulfilled, undefined);
            };
        }
        //----------------------------------------------------------------------
        // promise.done()
        if (typeof Promise.prototype.done === 'undefined') {
            Promise.prototype.done = function (onFulfilled) {
                return this.then(onFulfilled, undefined);
            };
        }
        //----------------------------------------------------------------------
        // promise.doneWith()
        if (typeof Promise.prototype.doneWith === 'undefined') {
            Promise.prototype.doneWith = function (onFulfilled, context) {
                if (typeof onFulfilled === 'function') {
                    onFulfilled = onFulfilled.bind(context);
                }

                return this.then(onFulfilled, undefined);
            };
        }
        //----------------------------------------------------------------------
        // promise.catchWith()
        if (typeof Promise.prototype.catchWith === 'undefined') {
            Promise.prototype.catchWith = function (onRejected, context) {
                if (typeof onRejected === 'function') {
                    onRejected = onRejected.bind(context);
                }

                return this.then(undefined, onRejected);
            };
        }
        //----------------------------------------------------------------------
        // promise.always()
        if (typeof Promise.prototype.always === 'undefined') {
            Promise.prototype.always = function (callback) {
                if (typeof callback !== 'function') {
                    throw new TypeError('arg must be function');
                }
                /*--------------------------*/
                return this.then(function (data) {
                    callback(false, data);
                }, function (error) {
                    callback(true, error);
                });
            };
        }
        //----------------------------------------------------------------------
        // promise.alwaysWith()
        if (typeof Promise.prototype.alwaysWith === 'undefined') {
            Promise.prototype.alwaysWith = function (callback, context) {

                if (typeof context !== "object") {
                    context = null;
                }

                if (typeof callback !== 'function') {
                    throw new TypeError('arg must be function');
                }

                callback = callback.bind(context);

                return this.then(function (data) {
                    callback(false, data);
                }, function (error) {
                    callback(true, error);
                });
            };
        }
        //======================================================================
        const statusList = ['pending', 'fulfilled', 'rejected'];

        // 可以等待外部的 promise
        function Deferred() {
            if (!(this instanceof Deferred)) {
                return new Deferred();
            }
            //----------------------------
            this._reject;
            this._resolve;
            this._promise;
            //----------------------------
            this.__constructor();
        }

        (function () {
            this.__constructor = function () {
                let $this = this;

                this._promise = new Promise(function (resolve, reject) {
                    $this._setStatus(0);
                    $this._resolve = resolve;
                    $this._reject = reject;
                });

                this._promise.then(function (data) {
                    $this._setStatus(1);
                    return data;
                }, function (err) {
                    $this._setStatus(2);
                });
            };
            //------------------------------------------------------------------
            this.promise = function () {
                return this._promise;
            };
            //------------------------------------------------------------------
            this.resolve = function (arg) {
                this._resolve(arg);
            };
            //------------------------------------------------------------------
            this.reject = function (err) {
                this._reject(err);
            };
            //------------------------------------------------------------------
            this.then = function (onFulfilled, onRejected) {
                var def = Deferred();
                var p = this.promise();

                p = p.then(this._getCallback(onFulfilled),
                    this._getErrorCallback(onRejected));
                //-----------------------
                p.then(function (data) {
                    def.resolve(data);
                }, function (error) {
                    def.reject(error);
                });
                return def;
            };
            //------------------------------------------------------------------
            this.thenWith = function (onFulfilled, onRejected, context) {

                var def = Deferred();
                var p = this.promise();

                p = p.then(this._getCallback(onFulfilled, context),
                    this._getErrorCallback(onRejected, context));
                //-----------------------
                p.then(function (data) {
                    def.resolve(data);
                }, function (error) {
                    def.reject(error);
                });
                return def;
            };
            //------------------------------------------------------------------
            this.done = function (onFulfilled) {
                var def = Deferred();
                var p = this.promise();

                p = p.then(this._getCallback(onFulfilled), null);
                //-----------------------
                p.then(function (data) {
                    def.resolve(data);
                }, function (error) {
                    def.reject(error);
                });
                return def;
            };
            //------------------------------------------------------------------
            this.doneWith = function (onFulfilled, context) {

                var def = Deferred();
                var p = this.promise();

                p = p.then(this._getCallback(onFulfilled, context), null);
                //-----------------------
                p.then(function (data) {
                    def.resolve(data);
                }, function (error) {
                    def.reject(error);
                });
                return def;
            };
            //------------------------------------------------------------------
            this.catch = function (onRejected) {
                var def = Deferred();
                var p = this.promise();

                p = p.catch(this._getErrorCallback(onRejected));
                //-----------------------
                p.then(function (data) {
                    def.resolve(data);
                }, function (error) {
                    def.reject(error);
                });
                return def;
            };
            //------------------------------------------------------------------
            this.catchWith = function (onRejected, context) {

                var def = Deferred();
                var p = this.promise();

                p = p.catch(this._getErrorCallback(onRejected, context));
                //-----------------------
                p.then(function (data) {
                    def.resolve(data);
                }, function (error) {
                    def.reject(error);
                });
                return def;
            };
            //------------------------------------------------------------------
            this.always = function (callback) {
                var def = Deferred();
                var p = this.promise();

                p = p.then(this._getAlwaysCallback(callback, false),
                    this._getAlwaysCallback(callback, true));
                //-----------------------
                p.then(function (data) {
                    def.resolve(data);
                }, function (error) {
                    def.reject(error);
                });
                return def;
            };
            //------------------------------------------------------------------
            this.alwaysWith = function (callback, context) {
                callback = callback.binf(context);

                var def = Deferred();
                var p = this.promise();

                p = p.then(this._getAlwaysCallback(callback, false, context),
                    this._getAlwaysCallback(callback, true, context));
                /*--------------------------*/
                p.then(function (data) {
                    def.resolve(data);
                }, function (error) {
                    def.reject(error);
                });
                return def;
            };
            //------------------------------------------------------------------
            this.isPending = function () {
                return (this._promise.__status == 0);
            };
            //------------------------------------------------------------------
            this.isFulfilled = function () {
                return (this._promise.__status == 1);
            };
            //------------------------------------------------------------------
            this.isRejected = function () {
                return (this._promise.__status == 2);
            };
            //------------------------------------------------------------------
            this._setStatus = function (status) {
                if (this._promise.status == null) {
                    _.defineProperty(this._promise, '__status', status);
                } else {
                    this._promise.__status = status;
                }
            };
            //------------------------------------------------------------------
            this._getCallback = function (callback, context) {
                if (callback == null) {
                    return null;
                }

                let fn = function (d) {
                    return callback(d);
                };

                if (context !== undefined) {
                    fn = fn.bind(context);
                }

                return fn;
            };
            //------------------------------------------------------------------
            this._getErrorCallback = function (callback, context) {
                if (callback == null) {
                    return null;
                }

                let fn = function (err) {
                    return callback(err);
                };

                if (context !== undefined) {
                    fn = fn.bind(context);
                }

                return fn;
            };
            //------------------------------------------------------------------
            this._getAlwaysCallback = function (callback, args, context) {
                if (callback == null) {
                    return null;
                }

                let fn = function (d) {
                    return callback(args, d);
                };

                if (context !== undefined) {
                    fn = fn.bind(context);
                }

                return fn;
            }

        }).call(Deferred.prototype);
    }
}(this || {}));
