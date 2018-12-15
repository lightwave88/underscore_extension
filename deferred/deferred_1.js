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
            factory(_);
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
        ////////////////////////////////////////////////////////////////////////
        // setImmediate => process => setTimeout

        // 把任務排入下一個步驟
        var async;

        if (typeof setImmediate != 'undefined') {
            async = function (fn) {
                setImmediate(fn);
            };
        } else {
            async = function (fn) {
                setTimeout(fn, 0);
            }
        }
        //======================================================================

        function Deferred() {
            if (!(this instanceof Deferred)) {
                return new Deferred();
            }
            let statusList = ['pending', 'fulfilled', 'rejected'];
            let status = statusList[0];
            //----------------------------
            this._reject;
            this._resolve;
            //----------------------------
            this._promise;
            //----------------------------
            this.getStatus = function () {
                return status;
            };

            this.setStatus = function (index) {
                status = statusList[index];
            };
            //----------------------------
            this.__constructor();
        }

        (function () {
            this.__constructor = function () {
                let self = this;
                this._promise = new Promise(function (resolve, reject) {
                    self._resolve = resolve;
                    self._reject = reject;
                });

                this._promise.thenWith(function (v) {
                    this.setStatus(1);
                    return v;
                }, function (e) {
                    this.setStatus(2);

                    // 為了讓 catch 被繼續傳下去
                    if (e instanceof Error) {
                        throw e;
                    } else {
                        throw new Error(e);
                    }
                }, this);
            };
            //------------------------------------------------------------------
            this.promise = function () {
                return this._promise;
            };
            //------------------------------------------------------------------
            this.resolve = function (arg, nextTick) {

                var self = this;

                if (nextTick != null && nextTick === true) {

                    var job = (function () {
                        // 避免某些情況有些瀏覽器會叫
                        this._resolve(arg);
                    }).bind(this);

                    async(job);
                } else {
                    this._resolve(arg);
                }
            };
            //------------------------------------------------------------------
            this.reject = function (arg, nextTick) {
                var self = this;
                if (nextTick != null && nextTick === true) {

                    var job = (function () {
                        // 避免某些情況有些瀏覽器會叫
                        this._reject(arg);
                    }).bind(this);

                    async(job);
                } else {
                    this._reject(arg);
                }
            };
            //------------------------------------------------------------------
            this.then = function (onFulfilled, onRejected) {
                var def = Deferred();
                var p = this.promise();

                p = p.then(function (data) {
                    return onFulfilled(data);
                }, function (error) {
                    return onRejected(error);
                });
                /*--------------------------*/
                p.then(function (data) {
                    def.resolve(data);
                }, function (error) {
                    def.reject(error);
                });
                return def;
            };
            //------------------------------------------------------------------
            this.thenWith = function (onFulfilled, onRejected, context) {
                onFulfilled = onFulfilled.bind(context);
                onRejected = onRejected.bind(context);

                var def = Deferred();
                var p = this.promise();

                p = p.then(function (data) {
                    return onFulfilled(data);
                }, function (error) {
                    return onRejected(error);
                });
                /*--------------------------*/
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


                p = p.then(function (data) {
                    return onFulfilled(data);
                }, undefined);
                /*--------------------------*/
                p.then(function (data) {
                    def.resolve(data);
                }, function (error) {
                    def.reject(error);
                });
                return def;
            };
            //------------------------------------------------------------------
            this.doneWith = function (onFulfilled, context) {
                onFulfilled = onFulfilled.bind(context);

                var def = Deferred();
                var p = this.promise();

                p = p.then(function (data) {
                    return onFulfilled(data);
                }, undefined);
                /*--------------------------*/
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

                p = p.catch(function (error) {
                    return onRejected(error);
                });
                /*--------------------------*/
                p.then(function (data) {
                    def.resolve(data);
                }, function (error) {
                    def.reject(error);
                });
                return def;
            };
            //------------------------------------------------------------------
            this.catchWith = function (onRejected, context) {
                onRejected = onRejected.bind(context);

                var def = Deferred();
                var p = this.promise();

                p = p.catch(function (error) {
                    return onRejected(error);
                });
                /*--------------------------*/
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

                p = p.then(function (data) {
                    return callback(false, data);
                }, function (error) {
                    return callback(true, error);
                });
                /*--------------------------*/
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

                p = p.then(function (data) {
                    return callback(false, data);
                }, function (error) {
                    return callback(true, error);
                });
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
                return /pending/i.test(this.status);
            };

            this.isFulfilled = function () {
                return /fulfilled/i.test(this.status);
            };
            //------------------------------------------------------------------
            this.isRejected = function () {
                return /Rejected/i.test(this.status);
            };

        }).call(Deferred.prototype);
    }
}(this || {}));
