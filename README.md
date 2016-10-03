Simple state container for Angular 2 application
====================================
RXBox let's you handle your Application state in one place.
You retain the responsibility for updating the state to your app.
It gives you an easy API to deal with your app's state.

<br>



Getting started
---------------
Install `rxbox` using npm.
```shell
npm install rxbox --save
```
import it into your main app.component
```javascript
import {RXBox} from "rxbox";
```

Add RXBox to your providers array
```javascript
@Component({
    selector: 'app',
    providers: [
        RXBox
    ]
})
```
Inject it to your constructor
```javascript
 constructor(
        private _store: RXBox,
    ) {
```
Now you can start interacting with the store from your component.


<br>

### API
## assignState(stateChanges)
assignState push data to the store
```javascript
 this._store.assignState({foo: bar});
```
## clearState()
clearState will completely remove the current state and will replace it with empty object
```javascript
 this._store.clearState();
```
## getState()
Return the full current app state object.
```javascript
 this._store.getState();
```
## watch(key)
If you want to respond to the state change even if it's changed by
another component, you can use 'watch' to watch for a key or a nested key.
It will return RXJS observable.
```javascript
this._store.watch('foo').subscribe(
    (val) => {
        console.log("change in foo value",  val);
    }
);
// nested key watch
this._store.watch('foo.bar').subscribe(
    (val) => {
        console.log("change in bar value",  val);
    }
);
```

## debug
If you want to use the state history  feature, you have to first set debug to true
```javascript
this._store.debug = true;
```

## getHistory()
Show the history of the state (first you have to set debug to true)
```javascript
this._store.getHistory()
```
## clearHistory()
Remove all state history
```javascript
this._store.clearHistory()
```


##note
The history methods are memory-efficient because they use structure sharing and 
need only save the differences.