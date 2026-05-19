const styleMock = require('./styleMock');

describe('styleMock', () => {
  test('exports an object', () => {
    expect(typeof styleMock).toBe('object');
  });

  test('exports an empty object', () => {
    expect(styleMock).toEqual({});
  });

  test('has no enumerable properties', () => {
    const keys = Object.keys(styleMock);
    expect(keys).toEqual([]);
  });

  test('has correct prototype', () => {
    expect(styleMock).toBeInstanceOf(Object);
  });

  test('is not null', () => {
    expect(styleMock).not.toBeNull();
  });

  test('is not undefined', () => {
    expect(styleMock).not.toBeUndefined();
  });

  test('equals another empty object', () => {
    expect(styleMock).toEqual({});
  });

  test('does not have any properties', () => {
    expect(Object.getOwnPropertyNames(styleMock)).toEqual([]);
  });

  test('can be stringified to empty object', () => {
    expect(JSON.stringify(styleMock)).toBe('{}');
  });

  test('is truthy', () => {
    expect(styleMock).toBeTruthy();
  });
});