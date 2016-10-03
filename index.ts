import {BehaviorSubject, Observable} from "rxjs";
import Immutable = require("immutable");
import deepEqual = require("deep-equal");

const appState = {};
const store = new BehaviorSubject<any>(appState);


const objectKeyByString = function(o, s) {
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
};


export default class SocotraStore {
    constructor() {
        if (typeof window !== "undefined") {
            ((window: any) => {
                window.SocotraStore = {
                    state: this.store,
                    history: this.history
                };
            })(window);
        }
    }

    private lastChnages = null;

    private store = store;

    // old the history of the app state
    // only work when debug is set to true
    private history = [];

    // Observable that watch for any change in the store
    private changes = store.asObservable().distinctUntilChanged();

    // push old state to history
    private pushHistory() {
        const self = this;

        (function(window: any){
            window.storeHistory = self.history;
        })(window);

        // prevent save more then one version in the history when not
        // running in debug mode
        if (!this.debug && this.history.length > 0) {
            this.history.shift();
        }



        let state;
        if (!this.history.length) {
            state = Immutable.fromJS(this.getState());
        } else {
            const oldState = this.history[this.history.length - 1];
            state = oldState.mergeDeep(this.getState());
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

                // if we inside this catch meaning that the key to watch
                // is not inside the last change so we can return
                // without response to the subscribers
                const isKeyInLastChange = objectKeyByString(this.lastChnages, key);
                if(typeof isKeyInLastChange === "undefined") {
                    return
                }


                const newValue = JSON.stringify(objectKeyByString(state, key));
                const oldState = this.history[this.history.length - 1];
                const oldValue = JSON.stringify(objectKeyByString(oldState, key));

                if (newValue !== oldValue) {
                    observer.next(objectKeyByString(state, key));
                }
            });
        });
    }


    // return current state
    getState() {
        return this.store.value;
    }


    // remove current state
    clearState() {
        this.store.next({});
    }


    // merge new keys to the current state
    assignState(stateChanges: Object) {
        const newState = Object.assign({}, this.getState(), stateChanges);

        // prevent push if there is no change detected in the new version
        if (this.history.length) {
            const oldState = this.history[this.history.length - 1];

            const equal = deepEqual(oldState.toJSON(), newState);
            if (equal) {
                return;
            }
        }

        this.pushHistory();

        this.lastChnages = stateChanges;
        this.store.next(newState);
    }
}