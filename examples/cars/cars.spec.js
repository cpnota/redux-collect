const { createStore } = require('redux')
const Immutable = require('Immutable')
const { cars, selectors } = require('./cars')
const types = require('./types')

let store

beforeEach(() => store = createStore(cars))

function hydrateStore(pojo) {
  store = createStore(cars, pojo)
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

    store.dispatch({
      type: types.ADD,
      car: jaguar,
      vin: jaguar.vin
    })

    expect(store.getState().equals(Immutable.Map({
      [jaguar.vin]: jaguar,
      [mustang.vin]: mustang
    }))).toBe(true)
  })

  test('sets the price of a car', () => {
    hydrateStore({
      [mustang.vin]: mustang
    })

    store.dispatch({
      type: types.SET_PRICE,
      price: 30000,
      vin: mustang.vin
    })

    expect(store.getState().get(mustang.vin)).toEqual(Object.assign({}, mustang, {
      price: 30000
    }))
  })

  test('removes a car from the collection', () => {
    hydrateStore({
      [jaguar.vin]: jaguar,
      [mustang.vin]: mustang
    })

    store.dispatch({
      type: types.REMOVE,
      vin: mustang.vin
    })

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
