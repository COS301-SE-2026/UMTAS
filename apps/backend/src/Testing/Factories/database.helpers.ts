//What the mock db returns on each function




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
export function mockSelectResult(
    mockDb: any,
    result: unknown[]
) {
    mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
                limit: jest.fn().mockResolvedValue(result)
            })
        })
    });
}//END_mockSelectResult

//insert().values().returning()
export function mockInsertResult(
    mockDb: any,
    result: unknown[]
){
    mockDb.insert.mockReturnValue({
        values: jest.fn().mockReturnValue({
            returning: jest.fn().mockResolvedValue(result)
        })
    });
}//END_mockInsertResult

//update().set().where().returning()
export function mockUpdateResult(
    mockDb: any,
    result: unknown[]
){
    mockDb.update.mockReturnValue({
        set: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
                returning: jest.fn().mockResolvedValue(result)
            })
        })
    });
}//END_mockUpdateResult


//delete().where()
export function mockDeleteResult(
    mockDb: any
) {
    mockDb.delete.mockReturnValue({
        where: jest.fn().mockResolvedValue(undefined)
    });
}//END_mockDeleteResult