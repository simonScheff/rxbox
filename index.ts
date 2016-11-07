import { BehaviorSubject, Observable } from "rxjs";

const appState = {};
const store = new BehaviorSubject<any>(appState);


export default class RXBox {
    constructor() {
        if (typeof window !== "undefined") {
            ((window: any) => {
                window.RXBox = {
                    state: this.store,
                    history: this.history
                };
            })(window);
        }
    }


    private static equals(x, y) {
        return JSON.stringify(x) === JSON.stringify(y);
    }


    private static objectKeyByString(o, s) {
        try {
            s = s.replace(/\[(\w+)\]/g, '.$1'); // convert indexes to properties
            s = s.replace(/^\./, '');           // strip a leading dot
            var a = s.split('.');
            for (var i = 0, n = a.length; i < n; ++i) {
                var k = a[i];
                if (k in o) {
                    o = o[k];
                } else {
                    return;
                }
            }
            return o;
        } catch (e) {
            return;
        }
    }


    private lastChanges = null;


    private store: any = store;


    // old the history of the app state
    // only work when debug is set to true
    private history = [];


    // Observable that watch for any change in the store
    private changes = store.asObservable().distinctUntilChanged();


    // push old state to history
    private pushHistory(state) {
        // prevent save more then one version in the history when not
        // running in debug mode
        if (!this.debug && this.history.length) {
            this.history.shift();
        }

        this.history.push(state);
    }


    // ************************** API **************************

    // change this for true when you want to push to history
    debug = false;


    // show the history of the state
    getHistory() {
        return this.history;
    }


    // remove all state history
    clearHistory() {
        this.history = [];
    }


    // watch for key change in store (you can also use nested key
    // like "key1.key2.key3")
    watch(key?: any) {
        return Observable.create(observer => {
            this.changes.subscribe(state => {
                // watch for all change (no key specified)
                if (typeof key === "undefined") {
                    observer.next(state);
                    return;
                }


                // if typeof isKeyInLastChange === "undefined"
                // we are not watching this value so we can return
                // without response to the subscribers
                const isKeyInLastChange = RXBox.objectKeyByString(this.lastChanges, key);
                if(typeof isKeyInLastChange === "undefined") {
                    return
                }


                const newValue = RXBox.objectKeyByString(state, key);
                const oldState = this.history[this.history.length - 1];
                const oldValue = RXBox.objectKeyByString(oldState, key);


                const equals = RXBox.equals(newValue, oldValue);
                if (!equals) {
                    observer.next(RXBox.objectKeyByString(state, key));
                    this.pushHistory(state);
                }
            });
        });
    }


    // return current state
    getState() {
        return JSON.parse(JSON.stringify(this.store.value));
    }


    // remove current state
    clearState() {
        this.store.next({});
    }


    // merge new keys to the current state
    assignState(stateChanges: Object) {
        this.lastChanges = stateChanges;
        const newState = Object.assign({}, this.getState(), stateChanges);
        this.store.next(newState);
    }
}





if (!Object.assign) {
    Object.defineProperty(Object, 'assign', {
        enumerable: false,
        configurable: true,
        writable: true,
        value: function(target) {
            'use strict';
            if (target === undefined || target === null) {
                throw new TypeError('Cannot convert first argument to object');
            }

            var to = Object(target);
            for (var i = 1; i < arguments.length; i++) {
                var nextSource = arguments[i];
                if (nextSource === undefined || nextSource === null) {
                    continue;
                }
                nextSource = Object(nextSource);

                var keysArray = Object.keys(Object(nextSource));
                for (var nextIndex = 0, len = keysArray.length; nextIndex < len; nextIndex++) {
                    var nextKey = keysArray[nextIndex];
                    var desc = Object.getOwnPropertyDescriptor(nextSource, nextKey);
                    if (desc !== undefined && desc.enumerable) {
                        to[nextKey] = nextSource[nextKey];
                    }
                }
            }
            return to;
        }
    });
}