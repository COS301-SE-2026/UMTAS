//Mocks the actual database used by the API
//Basically replaces DatabaseService
import { DatabaseService } from "src/db/database.service";


export function createMockDatabase() {

    const mockDb = {
        select: jest.fn(),
        insert: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        transaction: jest.fn(),
        execute: jest.fn()
    };

    return {
        mockDb,
        reset: ()=>{jest.clearAllMocks();}
    };
}//END_createMockDatabase