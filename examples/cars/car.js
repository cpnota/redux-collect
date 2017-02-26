const types = require('./types')

const initial = {}

// a reducer for a single car
const car = (state = initial, action) => {
  switch (action.type) {
    case types.ADD:
      return action.car
    case types.SET_PRICE:
      return Object.assign({}, state, { price: action.price })
    case types.REMOVE:
      // return undefined to remove from the collection
      return undefined
    default:
      // if we never actually set the state, return undefined
      // so that the car is not added to the collection
      return state === initial
        ? undefined
        : state
  }
}

const selectors = {
  getPrice: state => state.price,
  isModel: (state, model) => state.model === model
}

module.exports = {
  car,
  selectors
}
