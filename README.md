# redux-collect

A utility for converting a [redux](http://redux.js.org) reducer into a collection.

`npm install --save redux-collect`

## Usage

Requires es6/babel. You can  using either require syntax or es6 modules:

```javascript
// es6 modules
import { collectReducer, collectSelector, collectSelectors } from 'redux-collect'

// require syntax
const { collectReducer, collectSelector, collectSelectors } = require('redux-collect')
```
## API

### collectReducer

```javascript
const reducerForCollection = collectReducer(reducerForSingleEntity, pathToKeyWithinAction)
```

`reducerForSingleEntity` should return undefined to remove the entity from the collection.
Otherwise, the state it returns is added to the collection.

`pathToKeyWithinAction` is where the [path](https://lodash.com/docs/4.17.4#get) where the generated reducer look for the collection key within dispatched actions.

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

## Example

See the `examples` folder for a full, runnable example.

Say you have a [reducer](http://redux.js.org/docs/basics/Reducers.html) representing a single entity, such as:

```javascript
const car = (state, action) => {
  switch (action.type) {
    case types.ADD:
      return action.car
    case types.SET_PRICE:
      return Object.assign({}, state, { price: action.price })
    case types.REMOVE:
      return undefined
    default:
      return state
  }
}
```

For your application, you may want to be able to represent multiple cars, stored based on VINs (Vehicle Identification Numbers), producing a state that looks like:

```javascript
{
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
}
```

Every [action](http://redux.js.org/docs/basics/Actions.html) on a car includes a `vin` in order to identify the car that it is intended to modify:

```javascript
const updatePrice = (vin, price) => ({
  price,
  vin,
  type: types.UPDATE_PRICE
})
```

`collectReducer` allows you to create a reducer from your original `car` reducer and the `vin` identifier that produces the desired state:

```javascript
import { collectReducer } from 'redux-collect'
import { car } from './car'
const cars = collectReducer(car, 'vin')
```

Now the cars reducer will behave as a collection:

```javascript
// hydrate store
const store = createStore(cars, {
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

// update the price of the Renegade
store.dispatch(updatePrice('1G6KD54Y73U255447', 30000))

// the price is updated correctly
store.getState()
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

You may additionally have [selectors](https://github.com/tayiorbeii/egghead.io_idiomatic_redux_course_notes/blob/master/10-Colocating_Selectors_with_Reducers.md) located with your `car` reducer:

```javascript
const carSelectors = {
  getPrice: state => state.price,
  isModel: (state, model) => state.model === model
}
```

`collectSelectors` allows you to automatically convert these into selectors for the collection:

```javascript
const selectors = collectSelectors(carSelectors)

selectors.getPrice(store.getState(), '1FDSF34F13EB85525') // 45000
selectors.isModel(store.getState(), '1FDSF34F13EB85525', 'Corvette') // true
selectors.isModel(store.getState(), '1FDSF34F13EB85525', 'Renegade') // false
```

## Immutability

The collections are maintained using `Immutable.js`.
Maps created by `Immutable.Map` are properly serializable.
`redux-collect` should handle state hydration and serialization properly.
