const Immutable = require('immutable')
const get = require('lodash.get')
const set = require('lodash.set')
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

/**
 * Binds a selector created with collectSelector to a key
 * @param selector the selector to bindSelector
 * @param key the key passed to the collected selector
 * @return a selector for a particular entity in the collection
 */
const bindSelector = (selector, key) => (
  (state, ...args) => selector(state, key, ...args)
)

/**
 * Binds multiple selectors according to the reuls of bindSelector
 * @param selectors an object whose values are selectors
 * @param key the key passed to the collected selector
 * @return an object whose values are bound selectors
 */
const bindSelectors = (selectors, key) => (
  mapValues(selectors, selector => bindSelector(selector, key))
)

/**
 * Creates an action creator corresponding to a reducer created by collectReducer.
 * The action creator should not know about the path or the key,
 * and neither should any of its selectors,
 * or any actions it calls (if it is a thunk).
 * It optionally takes a "selectors" parameter.
 * This should be an object containing selectors created by collectSelectors.
 * If provided, it will be passed as a third argument to thunks,
 * (e.g. const thunkCreator = () => (dispatch, getState, selector) => { ... }))
 * @param action The action creator to change into an action creator for a collection
 * @param path The path to set the collection key in the created action
 * @param selectors (optional) selectors corresponding the collection created with collectSelectors
 * @return an action creator for a collection
 */
const collectAction = (action, path, selectors) => (
  (key, ...args) => decorate(action(...args), path, key, selectors)
)

/**
 * Creates multiples action creators corresponding to the reuls of collectAction
 * @param actions an object whose values are actions creators
 * @param path The path to set the collection key in the created actions
 * @param selectors (optional) selectors corresponding the collection created with collectSelectors
 * @return an object containing action creators for a collection
 */
const collectActions = (actions, path, selectors) => (
  mapValues(actions, action => collectAction(action, path, selectors))
)

/**
 * Binds an action creator created with collectAction to a key
 * (Do not confuse with bindActionCreators, which is for binding dispatch,
 * this is simply for the key)
 * @param action an action creator created with collectAction
 * @param key the collection key to bind to the action creator
 * @return the bound action creator
 */
const bindCollectedAction = (action, key) => (
  (...args) => action(key, ...args)
)

/**
 * Binds multiple action creators created with collectAction to a key
 * according to the rules of bindCollectedAction
 * @param actions an object containing action creators
 * @param key the collection key to bind the action creators
 * @return an object containing the bound action creators
 */
const bindCollectedActions = (actions, key) => (
  mapValues(actions, action => bindCollectedAction(action, key))
)

// helper for for handling actions
const decorate = (action, path, key, selectors) => (
  typeof action === 'function'
    ? collectThunk(action, path, key, selectors)
    : set(action, path, get(action, path, key)) // don't override if it already exists
)

// helper for overriding dispatch in thunks
const collectThunk = (thunk, path, key, selectors) => {
  const boundSelectors = bindSelectors(selectors, key)

  const decorateDispatch = dispatch => (
   (action, ...args) => dispatch(decorate(action, path, key), ...args)
  )

  return (dispatch, getState, ...args) => (
    selectors
      ? thunk(decorateDispatch(dispatch), getState, boundSelectors, ...args)
      : thunk(decorateDispatch(dispatch), getState, ...args)
  )
}

module.exports = {
  collectReducer,
  collectSelector,
  collectSelectors,
  collectAction,
  collectActions,
  bindSelector,
  bindSelectors,
  bindCollectedAction,
  bindCollectedActions
}
