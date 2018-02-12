import ava from 'ava';
import sinon from 'sinon';
import SpawnPatternCollection from '../../src/assets/scripts/client/trafficGenerator/SpawnPatternCollection';
import {
    createAirportControllerFixture,
    resetAirportControllerFixture
} from '../fixtures/airportFixtures';
import {
    createNavigationLibraryFixture,
    resetNavigationLibraryFixture
} from '../fixtures/navigationLibraryFixtures';
import { AIRPORT_JSON_FOR_SPAWN_MOCK } from './_mocks/spawnPatternMocks';

ava.beforeEach(() => {
    createNavigationLibraryFixture();
    createAirportControllerFixture();
});

ava.afterEach(() => {
    resetNavigationLibraryFixture();
    resetAirportControllerFixture();
});

ava('throws when called with invalid parameters', (t) => {
    t.throws(() => new SpawnPatternCollection());

    t.notThrows(() => new SpawnPatternCollection(AIRPORT_JSON_FOR_SPAWN_MOCK));
});

ava('.init() calls _buildSpawnPatternModels()', (t) => {
    const collection = new SpawnPatternCollection(AIRPORT_JSON_FOR_SPAWN_MOCK);
    const _buildSpawnPatternModelsSpy = sinon.spy(collection, '_buildSpawnPatternModels');

    collection.init(AIRPORT_JSON_FOR_SPAWN_MOCK);

    t.true(_buildSpawnPatternModelsSpy.calledWithExactly(AIRPORT_JSON_FOR_SPAWN_MOCK.spawnPatterns));
});

ava('.addItems() does not call .addItem() if passed an invalid value', (t) => {
    const collection = new SpawnPatternCollection(AIRPORT_JSON_FOR_SPAWN_MOCK);
    const addItemSpy = sinon.spy(collection, 'addItem');

    collection.addItems([]);
    t.false(addItemSpy.called);

    collection.addItems();
    t.false(addItemSpy.called);
});

ava('.addItems() calls .addItem() for each item in the list passed as an argument', (t) => {
    const collection = new SpawnPatternCollection(AIRPORT_JSON_FOR_SPAWN_MOCK);
    const addItemStub = sinon.stub(collection, 'addItem');

    collection.addItems([false, false]);
    t.true(addItemStub.calledTwice);
});

ava('.addItem() throws if anything other than a SpawnPatternModel is passed as an argument', (t) => {
    const collection = new SpawnPatternCollection(AIRPORT_JSON_FOR_SPAWN_MOCK);

    t.throws(() => collection.addItem());
    t.throws(() => collection.addItem([]));
    t.throws(() => collection.addItem({}));
    t.throws(() => collection.addItem(42));
    t.throws(() => collection.addItem('threeve'));
    t.throws(() => collection.addItem(false));
    t.throws(() => collection.addItem(null));
    t.throws(() => collection.addItem(undefined));
});
