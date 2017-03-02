# redux-collect

A utility for converting a [redux](http://redux.js.org) reducer into a collection.

`npm install --save redux-collect`

## Usage

```javascript
// es6 modules
import { collectReducer, collectSelectors, collectActions } from 'redux-collect'
```

```javascript
// require syntax
const { collectReducer, collectSelectors, collectActions } = require('redux-collect')
```

## Example

See the `examples` folder for a full, runnable example.

Say you have a
[reducer](http://redux.js.org/docs/basics/Reducers.html),
[selectors](http://redux.js.org/docs/recipes/ComputingDerivedData.html),
and [actions](http://redux.js.org/docs/basics/Actions.html),
representing a single entity, such as:

```javascript
const carReducer = (state, action) => {
  switch (action.type) {
    case types.ADD:
      return action.car
    case types.SET_PRICE:
      return Object.assign({}, state, { price: action.price })
    default:
      return state
  }
}

const carSelectors = {
  getPrice: state => state.price,
  isModel: (state, model) => state.model === model
}

const carActions = {
  add: car => ({
    car,
    type: types.ADD
  }),
  setPrice: price => ({
    price,
    type: types.SET_PRICE
  }),
  fetch: url => dispatch => get(url).then(car => dispatch(add(car)))
}
```

As your application grows, you may want to be able to represent multiple cars, stored based on VIN (Vehicle Identification Numbers).
`redux-collect` makes it easy to reuse your existing functions:

```javascript
const reducer = collectReducer(carReducer, 'vin')
const selectors = collectSelectors(carSelectors)
const actions = collectActions(carActions, 'vin')
```

The resulting reducer, selectors, and actions now behave as a collection:

```javascript
// state is now a collection
const store = createStore(reducer, {
  "1G6KD54Y73U255447": {
    "make": "Jeep",
    "model": "Renegade",
    "price": 25000
  },
  "1FDSF34F13EB85525": {
    "make": "Chevrolet",
    "model": "Corvette",
    "price": 45000
  }
})

// selectors and actions now take an additional VIN parameter
selectors.getPrice(store.getState(), "1G6KD54Y73U255447") // 25000

// the reducer handles the new action
store.dispatch(updatePrice('1G6KD54Y73U255447', 30000))

// the state is updated properly
selectors.getPrice(store.getState(), "1G6KD54Y73U255447") // 30000

// store remains transparent and serializable
console.log(store.getState())
// "1G6KD54Y73U255447": {
//   "make": "Jeep",
//   "model": "Renegade",
//   "price": 30000
// },
// "1FDSF34F13EB85525": {
//   "make": "Chevrolet",
//   "model": "Corvette",
//   "price": 45000
// }
```

## API

### collectReducer

```javascript
const reducerForCollection = collectReducer(reducerForSingleEntity, pathToKeyWithinAction)
```

`reducerForSingleEntity` should return undefined to remove the entity from the collection.
Otherwise, the state it returns is added to the collection.

`pathToKeyWithinAction` is the [path](https://lodash.com/docs/4.17.4#get) where the generated reducer looks for the collection key within dispatched actions.

### collectSelector

Most of the time `collectSelectors` is recommended.

```javascript
const selectorForCollection = collectSelector(selectorForSingleEntity)
```

`selectorForSingleEntity` entity is a [selector](https://github.com/tayiorbeii/egghead.io_idiomatic_redux_course_notes/blob/master/10-Colocating_Selectors_with_Reducers.md) corresponding to `reducerForSingleEntity`, with is called like `selectorForSingleEntity(state, ...args)`.

`selectorForCollection` is a generated selector corresponding to `reducerForCollection`, and is called liked `selectorForCollection(state, key, ...args)`.

### collectSelectors

```javascript
const selectorsForSingleEntity = {
  selector1,
  selector2
}

// Same as:
// const selectorsForCollection = {
//   selector1: collectSelector(selector1),
//   selector2: collectSelector(selector2)
// }
const selectorsForCollection = collectSelectors(selectorsForSingleEntity)
```

Similar to `collectSelector`, except it takes an object containing one or more selectors.

### collectAction

Most of the time, `collectActions` is recommended.

```javascript
const actionCreatorForCollection = collectionAction(actionCreatorForSingleEntity, pathToKeyWithinAction, optionalSelectorsForThunks)
```

`actionCreatorForSingleEntity` is an action creator with no knowledge of the collection,
most likely corresponding to `reducerForSingleEntity`.

`pathToKeyWithinAction` is the [path](https://lodash.com/docs/4.17.4#get) where
actions will be decorated with the collection key.

`optionalSelectorsForThunks` is an optional parameter that is recursively passed as the third parameter to [thunks](https://github.com/gaearon/redux-thunk) created by `actionCreatorForSingleEntity`.

### collectActions

```javascript
const actionCreatorsForCollection = collectionActions(actionCreatorsForSingleEntity, pathToKeyWithinAction, optionalSelectorsForThunks)
```

Similar to `collectAction`, but for an object containing multiple action creators.

### bindSelector, bindSelectors, bindCollectedAction, and bindCollectedActions

```javascript
const boundSelector = bindSelector(selectorForCollection, key)
const boundSelectors = bindSelector(selectorsForCollection, key)
const boundActionCreator = bindCollectedAction(actionCreatorForCollection, key)
const boundActionCreators = bindCollectedActions(actionCreatorsForCollection, key)
```

Helpers to bind the output of `collectSelector` and `collectActions` to key corresponding to a specific entity.
e.g.:

```javascript
const getJeepPrice = bindSelector(selectors.getPrice, "1G6KD54Y73U255447")
const setJeepPrice = bindCollectedAction(actions.setPrice, "1G6KD54Y73U255447")
```

## Immutability

The collections are maintained using `Immutable.js`.
Maps created by `Immutable.Map` are properly serializable.
`redux-collect` should handle state hydration and serialization properly.
