const { createStore, applyMiddleware } = require('redux')
const thunk = require('redux-thunk').default
const Immutable = require('Immutable')
const { cars, selectors } = require('./cars')
const actions = require('./actions')
const { bindCollectedActions } = require('../../index.js')

let store

beforeEach(() => store = createStore(cars, applyMiddleware(thunk)))

function hydrateStore(pojo) {
  store = createStore(cars, pojo, applyMiddleware(thunk))
}

const jaguar = {
  model: 'jaguar',
  price: 50350,
  vin: '1234'
}

const mustang = {
  model: 'mustang',
  price: 25186,
  vin: '5678'
}

describe('reducer', () => {
  test('initializes an empty car collection', () => {
    expect(store.getState().equals(Immutable.Map())).toBe(true)
  })

  test('hydrates collection', () => {
    // hydrate with plain javascript object (e.g. deserialized from json)
    hydrateStore({
      [jaguar.vin]: jaguar,
      [mustang.vin]: mustang
    })
    // collectionReducer automatically converts this to the correct type
    expect(store.getState().equals(Immutable.Map({
      [jaguar.vin]: jaguar,
      [mustang.vin]: mustang
    }))).toBe(true)
  })

  test('adds a car to the collection', () => {
    hydrateStore({
      [mustang.vin]: mustang
    })

    store.dispatch(actions.add(jaguar.vin, jaguar))

    expect(store.getState().equals(Immutable.Map({
      [jaguar.vin]: jaguar,
      [mustang.vin]: mustang
    }))).toBe(true)
  })

  test('sets the price of a car', () => {
    hydrateStore({
      [mustang.vin]: mustang
    })

    store.dispatch(actions.setPrice(mustang.vin, 30000))

    expect(store.getState().get(mustang.vin)).toEqual(Object.assign({}, mustang, {
      price: 30000
    }))
  })

  test('removes a car from the collection', () => {
    hydrateStore({
      [jaguar.vin]: jaguar,
      [mustang.vin]: mustang
    })

    store.dispatch(actions.remove(mustang.vin))

    expect(store.getState().equals(Immutable.Map({
      [jaguar.vin]: jaguar
    }))).toBe(true)
  })
})

describe('selectors', () => {
  test('#getPrice', () => {
    hydrateStore({
      [jaguar.vin]: jaguar,
    })

    const jaguarPrice = selectors.getPrice(store.getState(), jaguar.vin)
    expect(jaguarPrice).toBe(jaguar.price)
  })

  test('#isModel', () => {
    hydrateStore({
      [jaguar.vin]: jaguar
    })

    const isJaguar = selectors.isModel(store.getState(), jaguar.vin, jaguar.model)
    expect(isJaguar).toBe(true)

    const isMustang = selectors.isModel(store.getState(), jaguar.vin, mustang.model)
    expect(isMustang).toBe(false)
  })
})

describe('thunks', () => {
  test('thunk add', () => {
    hydrateStore({
      [mustang.vin]: mustang
    })

    store.dispatch(actions.thunkAdd(jaguar.vin, jaguar))

    expect(store.getState().equals(Immutable.Map({
      [mustang.vin]: mustang,
      [jaguar.vin]: jaguar
    }))).toBe(true)
  })

  test('deep thunk add', () => {
    hydrateStore({
      [mustang.vin]: mustang
    })

    store.dispatch(actions.deepThunkAdd(jaguar.vin, jaguar))

    expect(store.getState().equals(Immutable.Map({
      [mustang.vin]: mustang,
      [jaguar.vin]: jaguar
    }))).toBe(true)
  })
})

describe('bound actions', () => {
  const boundActions = bindCollectedActions(actions, mustang.vin)

  test('sets the price of a car', () => {
    test('sets the price of a car', () => {
      hydrateStore({
        [mustang.vin]: mustang
      })

      store.dispatch(boundActions.setPrice(30000))

      expect(store.getState().get(mustang.vin)).toEqual(Object.assign({}, mustang, {
        price: 30000
      }))
    })
  })

  test('bound thunk add', () => {
    test('thunk add', () => {
      hydrateStore({
        [mustang.vin]: mustang
      })

      store.dispatch(boundActions.thunkAdd(jaguar.vin, jaguar))

      expect(store.getState().equals(Immutable.Map({
        [mustang.vin]: mustang,
        [jaguar.vin]: jaguar
      }))).toBe(true)
    })
  })
})

test.skip('bind selectors', () => {
  hydrateStore({
    [jaguar.vin]: jaguar
  })

  store.dispatch(actions.incrementPrice(bindCollectSelectors(selectors))(jaguar.vin, jaguar))

  expect(selectors.getPrice(store.getState(), jaguar.vin)).toBe(jaguar.price + 1)
})
