//What the mock db returns on each function

import { DeepMockProxy } from 'jest-mock-extended';
import { AppDatabase } from '../../db/database.service';

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
    'onConflictDoNothing',
    'onConflictDoUpdate',
    'orderBy',
    'for',
    'orderBy',
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
export const mockSequentialResults = (
  mockFn: jest.Mock,
  results: unknown[][],
) => {
  results.forEach((result) =>
    mockFn.mockReturnValueOnce(createDbChain(result)),
  );
};

//transactions
export const mockTransaction = (
  mockDb: DeepMockProxy<AppDatabase>,
  ops?: {
    select?: unknown[][];
    insert?: unknown[][];
    update?: unknown[][];
    delete?: unknown[][];
  },
) => {
  // Mock the transaction to execute the callback immediately
  (mockDb.transaction as unknown as jest.Mock).mockImplementation(
    (callback: (tx: AppDatabase) => unknown) => {
      // Setup chainable methods on the transaction mock
      if (ops?.select) {
        // For select operations, mock the chain
        const mockSelect = jest.fn();
        ops.select.forEach((result, index) => {
          if (index === 0) {
            mockSelect.mockReturnValueOnce(createDbChain(result));
          } else {
            mockSelect.mockReturnValueOnce(createDbChain(result));
          }
        });
        // If there are more calls than results, repeat the last result
        if (ops.select.length > 0) {
          const lastResult = ops.select[ops.select.length - 1];
          mockSelect.mockReturnValue(createDbChain(lastResult));
        }
        (mockDb.select as unknown as jest.Mock) = mockSelect;
      }

      if (ops?.insert) {
        const mockInsert = jest.fn();
        ops.insert.forEach((result, index) => {
          if (index === 0) {
            mockInsert.mockReturnValueOnce(createDbChain(result));
          } else {
            mockInsert.mockReturnValueOnce(createDbChain(result));
          }
        });
        if (ops.insert.length > 0) {
          const lastResult = ops.insert[ops.insert.length - 1];
          mockInsert.mockReturnValue(createDbChain(lastResult));
        }
        (mockDb.insert as unknown as jest.Mock) = mockInsert;
      }

      if (ops?.update) {
        const mockUpdate = jest.fn();
        ops.update.forEach((result, index) => {
          if (index === 0) {
            mockUpdate.mockReturnValueOnce(createDbChain(result));
          } else {
            mockUpdate.mockReturnValueOnce(createDbChain(result));
          }
        });
        if (ops.update.length > 0) {
          const lastResult = ops.update[ops.update.length - 1];
          mockUpdate.mockReturnValue(createDbChain(lastResult));
        }
        (mockDb.update as unknown as jest.Mock) = mockUpdate;
      }

      if (ops?.delete) {
        const mockDelete = jest.fn();
        ops.delete.forEach((result, index) => {
          if (index === 0) {
            mockDelete.mockReturnValueOnce(createDbChain(result));
          } else {
            mockDelete.mockReturnValueOnce(createDbChain(result));
          }
        });
        if (ops.delete.length > 0) {
          const lastResult = ops.delete[ops.delete.length - 1];
          mockDelete.mockReturnValue(createDbChain(lastResult));
        }
        (mockDb.delete as unknown as jest.Mock) = mockDelete;
      }

      // Execute the callback with the mocked transaction
      return callback(mockDb);
    },
  );
}; //END_mockTransaction
