const types = require('./types')

const creators = {
  add: car => ({
    car,
    type: types.ADD
  }),
  setPrice: price => ({
    price,
    type: types.SET_PRICE
  }),
  remove: () => ({
    type: types.REMOVE
  })
}

const thunks = {
  thunkAdd: car => dispatch => dispatch(creators.add(car)),
  incrementPrice: () => (dispatch, getState, selectors) => (
    dispatch(creators.setPrice(selectors.getPrice(getState()) + 1))
  )
}

const deepThunks = {
  deepThunkAdd: car => dispatch => dispatch(thunks.thunkAdd(car))
}

module.exports = Object.assign(creators, thunks, deepThunks)
