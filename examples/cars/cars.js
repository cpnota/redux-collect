const { collectReducer, collectSelectors } = require('../../index')
const { car, selectors: carSelectors } = require('./car')

// create a reducer for a collection of cars
// based on Vehicle Identification Number
const cars = collectReducer(car, 'vin')

// create selectors corresponding to the reducer
// created above
const selectors = collectSelectors(carSelectors)

module.exports = {
  cars,
  selectors
}
