//What the mock db returns on each function

// import { DeepMockProxy } from "jest-mock-extended";
// import { AppDatabase } from "../../db/database.service";

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
// export const mockTransaction = (mockDb: DeepMockProxy<AppDatabase>) => {
//   mockDb.transaction.mockImplementation(
//     (callback: (tx: AppDatabase) => unknown) =>
//       callback(mockDb) as ReturnType<AppDatabase['transaction']>,
//   );
// }; //END_mockTransaction

//Operation
// export interface TxOperationResults {
//   select?: unknown[][];
//   insert?: unknown[][];
//   update?: unknown[][];
//   delete?: unknown[][];
// }

// const DB_VERBS = ['select', 'insert', 'update', 'delete'] as const;
// type DbVerb = (typeof DB_VERBS)[number];

// export const mockTransactionOps = (
//   mockDb: DeepMockProxy<AppDatabase>,
//   ops: TxOperationResults,
// ): DeepMockProxy<AppDatabase> => {
//   mockTransaction(mockDb);

//   DB_VERBS.forEach((verb: DbVerb) => {
//     const results = ops[verb];
//     if (!results) return;
//     mockSequentialResults(mockDb[verb] as unknown as jest.Mock, results);
//   });

//   return mockDb;
// }; //END_mockTransactionOps

// //Tables
// export interface TableResultQueue {
//   table: unknown; // eg. Venue, Event
//   results: unknown[][]; // sequential results
// }

// export interface TxTableResults {
//   select?: TableResultQueue[];
//   insert?: TableResultQueue[];
//   update?: TableResultQueue[];
//   delete?: TableResultQueue[];
// }

// const buildTableQueueMap = (
//   entries: TableResultQueue[],
// ): Map<unknown, unknown[][]> => {
//   const map = new Map<unknown, unknown[][]>();
//   entries.forEach(({ table, results }) => {
//     // clone the array so shift() below doesn't mutate the caller's literal
//     map.set(table, [...results]);
//   });
//   return map;
// };

// const nextResultForTable = (
//   queueMap: Map<unknown, unknown[][]>,
//   table: unknown,
// ): unknown[] => {
//   const queue = queueMap.get(table);
//   if (!queue || queue.length === 0) {
//     throw new Error(
//       'mockDbByTable: no more mocked results queued for this table. ' +
//         'Add another entry to the relevant results array, or check the ' +
//         'table reference matches the one imported in the service.',
//     );
//   }
//   return queue.shift() as unknown[];
// };

// //Select needs a from
// export const mockSelectByTable = (
//   mockDb: DeepMockProxy<AppDatabase>,
//   entries: TableResultQueue[],
// ) => {
//   const queueMap = buildTableQueueMap(entries);

//   (mockDb.select as unknown as jest.Mock).mockImplementation(() => {
//     const pending = {} as Record<string, jest.Mock>;
//     pending.from = jest.fn((table: unknown) =>
//       createDbChain(nextResultForTable(queueMap, table)),
//     );
//     return pending;
//   });
// };

// //INSERT/UPDATE?DELETE
// const mockVerbByTable = (mockFn: jest.Mock, entries: TableResultQueue[]) => {
//   const queueMap = buildTableQueueMap(entries);
//   mockFn.mockImplementation((table: unknown) =>
//     createDbChain(nextResultForTable(queueMap, table)),
//   );
// };

// export const mockInsertByTable = (
//   mockDb: DeepMockProxy<AppDatabase>,
//   entries: TableResultQueue[],
// ) => mockVerbByTable(mockDb.insert as unknown as jest.Mock, entries);

// export const mockUpdateByTable = (
//   mockDb: DeepMockProxy<AppDatabase>,
//   entries: TableResultQueue[],
// ) => mockVerbByTable(mockDb.update as unknown as jest.Mock, entries);

// export const mockDeleteByTable = (
//   mockDb: DeepMockProxy<AppDatabase>,
//   entries: TableResultQueue[],
// ) => mockVerbByTable(mockDb.delete as unknown as jest.Mock, entries);

// export const mockTransactionByTable = (
//   mockDb: DeepMockProxy<AppDatabase>,
//   ops: TxTableResults,
// ): DeepMockProxy<AppDatabase> => {
//   mockTransaction(mockDb);
//   if (ops.select) mockSelectByTable(mockDb, ops.select);
//   if (ops.insert) mockInsertByTable(mockDb, ops.insert);
//   if (ops.update) mockUpdateByTable(mockDb, ops.update);
//   if (ops.delete) mockDeleteByTable(mockDb, ops.delete);
//   return mockDb;
// }; //END_mockTransactionByTable
