import {BehaviorSubject, Observable} from "rxjs";

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

Object.equals = function( x, y ) {
    if ( x === y ) return true;
    // if both x and y are null or undefined and exactly the same

    if ( ! ( x instanceof Object ) || ! ( y instanceof Object ) ) return false;
    // if they are not strictly equal, they both need to be Objects

    if ( x.constructor !== y.constructor ) return false;
    // they must have the exact same prototype chain, the closest we can do is
    // test there constructor.

    for ( var p in x ) {
        if ( ! x.hasOwnProperty( p ) ) continue;
        // other properties were tested using x.constructor === y.constructor

        if ( ! y.hasOwnProperty( p ) ) return false;
        // allows to compare x[ p ] and y[ p ] when set to undefined

        if ( x[ p ] === y[ p ] ) continue;
        // if they have the same strict value or identity then they are equal

        if ( typeof( x[ p ] ) !== "object" ) return false;
        // Numbers, Strings, Functions, Booleans must be strictly equal

        if ( ! Object.equals( x[ p ],  y[ p ] ) ) return false;
        // Objects and Arrays must be tested recursively
    }

    for ( p in y ) {
        if ( y.hasOwnProperty( p ) && ! x.hasOwnProperty( p ) ) return false;
        // allows x[ p ] to be set to undefined
    }
    return true;
}


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

    private lastChanges = null;

    private store = store;

    // old the history of the app state
    // only work when debug is set to true
    private history = [];

    // Observable that watch for any change in the store
    private changes = store.asObservable().distinctUntilChanged();

    // push old state to history
    private pushHistory() {
        // prevent save more then one version in the history when not
        // running in debug mode
        if (!this.debug && this.history.length > 0) {
            this.history.shift();
        }


        let state;
        if (!this.history.length) {
            state = this.getState();
        } else {
            const oldState = this.history[this.history.length - 1];
            state = Object.assign({}, oldState, this.getState());

            const noChangeInState = Object.equals(oldState, state);
            if (noChangeInState) {
                return;
            }
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
                const isKeyInLastChange = objectKeyByString(this.lastChanges, key);
                if(typeof isKeyInLastChange === "undefined") {
                    return
                }


                const newValue = objectKeyByString(state, key);
                const oldState = this.history[this.history.length - 1];
                const oldValue = objectKeyByString(oldState, key);


                const equals = Object.equals(newValue, oldValue);
                if (!equals) {
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
        }

        this.pushHistory();

        this.lastChanges = stateChanges;
        this.store.next(newState);
    }
}