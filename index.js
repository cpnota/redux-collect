const Immutable = require('immutable')
const get = require('lodash.get')
const mapValues = require('lodash.mapvalues')

/**
 * Takes a reducer and returns a reducer for a collection.
 * If the provided reducer returns undefined,
 * its key is removed from the collection.
 * Otherwise, its result is added to the collection.
 * Will look inside actions for the "path" containing the key.
 * @param reducer the reducer to produce a collection for
 * @param path for each action, the path to the key for the collection (see: https://lodash.com/docs/4.17.4#get)
 * @returns A reducer for a collection.
 */
const collectReducer = (reducer, path) => {
  if (typeof reducer !== 'function') throw new Error('Must provided a valid reducer.')
  if (path === null || path === undefined) throw new Error('Must provided a valid path (see: https://lodash.com/docs/4.17.4#get).')

  return (state, action) => {
    const map = Immutable.Map(state) // normalize
    const key = get(action, path) // extract the key from the action

    if (!key) return map // action does not contain a key at the path

    const value = reducer(map.get(key), action) // get next state

    return value === undefined // allow null values in the state
      ? map.delete(key) // remove from the collection if undefined
      : map.set(key, value) // update the state otherwise
  }
}

/**
 * Creates a selector for the collection corresponding
 * to the reducer passed to collectReducer.
 * The arguments of the resulting selector are:
 * state: the state created by collectReducer
 * key: the key of the item in the collection
 * ...args: the arguments of the original selector
 * @param selector a function (state, ...args) => value
 * @return a function (state, key, ...args) => value
 */
const collectSelector = selector => (state, key, ...args) => {
  const map = Immutable.Map(state) // normalize
  const value = map.get(key)
  return value && selector(value, ...args)
}

/**
 * Creates selectors according to the rules of collectSelector.
 * Selectors should be an object, where:
 * The property names are the names of the selectors, and
 * The property values are the selector functions
 * @param selectors an object containing selectors
 */
const collectSelectors = selectors => (
  mapValues(selectors, collectSelector)
)

module.exports = {
  collectReducer,
  collectSelector,
  collectSelectors
}
