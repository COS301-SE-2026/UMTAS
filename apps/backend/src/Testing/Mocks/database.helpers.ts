//What the mock db returns on each function

export function createDbChain<T>(result: T) {
  const chain = {} as Record<string, jest.Mock>;

  const chainable = [
    'from',
    'where',
    'and',
    'limit',
    'leftJoin',
    'innerJoin',
    'values',
    'set',
    'returning',
    'execute',
  ];

  chainable.forEach((method) => {
    chain[method] = jest.fn(() => chain);
  });

  chain.then = jest.fn(
    (resolve: (value: T) => any, reject?: (reason: any) => any) =>
      Promise.resolve(result).then(resolve, reject),
  );

  chain.catch = jest.fn((reject: (reason: any) => any) =>
    Promise.resolve(result).catch(reject),
  );

  chain.finally = jest.fn((cb: () => void) =>
    Promise.resolve(result).finally(cb),
  );

  return chain;
} //END_createDbChain

//generic function to mock any chainable function on database
//ex: mockDbResult(mockDb.select, [{something: 'something else'}])
export const mockDbResult = (mockFn: jest.Mock, result: unknown[]) => {
  mockFn.mockReturnValue(createDbChain(result));
};

//generic Sequential result
//methods called more than once with their respective results
export const mockSequentialResults = <T>(mockFn: jest.Mock, results: T[][]) => {
  results.forEach((result) =>
    mockFn.mockReturnValueOnce(createDbChain(result)),
  );
};

// //transactions
export const mockTransaction = (mockDb: { transaction: jest.Mock }) => {
  mockDb.transaction.mockImplementation(
    (callback: (tx: typeof mockDb) => unknown) => {
      return callback(mockDb);
    },
  );
};
//ex:
//  mockDb.insert.mockReturnValue(createDbChain([{something: 'somethingElse'}]));
//  mockDb.update.mockReturnValue(createDbChain([{something: 'somethingElse}]));
//  await service.thatMethodInQuestion();
//  expect(mockDb.insert).toHaveBeenCalled();
//

// export function mockTransaction(mockDb: any) {
//   mockDb.transaction.mockImplementation((callback: any) => callback(mockDb));
// }
