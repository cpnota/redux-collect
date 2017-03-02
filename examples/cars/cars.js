const { collectReducer, collectSelectors, collectActions } = require('../../index')
const { reducer, selectors } = require('./reducer')
const actions = require('./actions')

const reducerForCollection = collectReducer(reducer, 'vin')
const selectorsForCollection = collectSelectors(selectors)
const actionsForCollection = collectActions(actions, 'vin', selectorsForCollection)

module.exports = {
  reducer: reducerForCollection,
  selectors: selectorsForCollection,
  actions: actionsForCollection
}
