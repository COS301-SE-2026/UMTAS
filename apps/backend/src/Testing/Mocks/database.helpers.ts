//What the mock db returns on each function


export function createDbChain(result: any){

    const chain: any = {};

    const chainable = [
        'from', 'where', 'and', 'limit',
        'leftJoin', 'innerJoin',
        'values', 'set', 'returning', 'execute'
    ];

    chainable.forEach((method)=>{
        chain[method] = jest.fn(()=>chain);
    });

    chain.then = jest.fn((resolve: any, reject?: any)=>
        Promise.resolve(result).then(resolve, reject)
    );
    chain.catch = jest.fn((reject: any) => Promise.resolve(result).catch(reject));
    chain.finally = jest.fn((cb: any) => Promise.resolve(result).finally(cb));

    return chain;
}//END_createDbChain



//select().from.where()
export function mockSelectAllResult(
    mockDb: any,
    result: unknown[]
){
    mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
            where: jest.fn().mockResolvedValue(result)
        })
    });
}//mockSelectAllResult

// select().from().where().limit()
export function mockSelectResult(mockDb: any, result: unknown[]){
    mockDb.select.mockReturnValue(createDbChain(result));
}//END_mockSelectResult

//Select distinct
export function mockSelectDistinctResult(mockDb: any, result: unknown[]){
    mockDb.selectDistinct.mockReturnValue(createDbChain(result));
}

//insert().values().returning()
export function mockInsertResult(mockDb: any, result: unknown[]){
    mockDb.insert.mockReturnValue(createDbChain(result));
}//END_mockInsertResult

//update().set().where().returning()
export function mockUpdateResult(mockDb: any, result: unknown[]){
    mockDb.update.mockReturnValue(createDbChain(result));
}//END_mockUpdateResult


//delete().where()
export function mockDeleteResult(mockDb: any, result: unknown=undefined){
    mockDb.delete.mockReturnValue(createDbChain(result));
}//END_mockDeleteResult


//methods called more than once with their respective results
export function mockSequentialResults(mockFn: jest.Mock, results: unknown[][]){
    results.forEach((result) => mockFn.mockReturnValueOnce(createDbChain(result)));
}