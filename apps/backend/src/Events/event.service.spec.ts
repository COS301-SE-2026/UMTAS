import { Test } from "@nestjs/testing";

//Constants
import { userId, moduleId, uniId } from '../Testing/constants.spec';

//Table imports
import { Event, UniversityEvent, PersonalEvent, modules } from '../entities/index';

//Actual Service imports
import { DatabaseService } from "../db/database.service";
import { EventService } from "./event.service";
import {ModuleService} from '../Module/module.service';

//Mock Database and factories
import { createMockDatabase } from '../Testing/Mocks/database.mock';
import { mockDeleteResult, mockInsertResult, mockSelectResult, mockSequentialResults } from '../Testing/Mocks/database.helpers';
import {createEvent,createEventForModule, createEventVenue, createPersonalEvent, createUniversityEvent, createVenue} from '../Testing/Factories/event.factory';
import { createMockModuleService } from "../Testing/Factories/module.factory";
import { createModule } from "../Testing/Factories/module.factory";
import { CreateEventDto } from "./dto/EventDto.dto";
import { EventType } from "./dto/event.types";

describe ('EventService', ()=>{

  let service: EventService;

  const {mockDb, reset: resetDb} = createMockDatabase();
  const {mockModuleService, reset: resetModule} = createMockModuleService();

  const existingEvent = createEvent();
  const resultEvent = { ...existingEvent };

  beforeEach(async ()=>{

    const module = await Test.createTestingModule({
      providers: [
        EventService,
        {provide: DatabaseService, useValue: {db: mockDb}},
        {provide: ModuleService, useValue: mockModuleService}
      ]
    }).compile();

    service = module.get(EventService);
  });

  afterEach(()=>{
    resetDb();
    resetModule();
  });


  //TESTS
  //Create
  describe('Test_CreateEvent', ()=>{

    it('should create a simple university event', async ()=>{

      //Arrange
      const module = createModule({moduleID: moduleId});
      const createEventDto: CreateEventDto = {
        eventName: 'Lecture1',
        eventCode: 'Lec1',
        eventCriteria: {
          type: EventType.UNIVERSITY,
          date: 'yyyy-mm-dd',
          startTime: '08:30',
          endTime: '10:20',
          moduleID: moduleId,
          venue: 'IT 2-23'
        },
        isRecurring: true        
      };

      const newEvent = createEventForModule(moduleId);
      const uniEvent = createUniversityEvent({
        moduleID: moduleId, 
        eventID: newEvent.eventID});
      const venue = createVenue({
        VenueName: newEvent.eventCriteria!.venue
      });
      const eventVenue = createEventVenue({
        VenueID: venue.VenueID,
        EventID: newEvent.eventID
      });

      mockSequentialResults(mockDb.insert, [
        [newEvent], [uniEvent], [venue], [eventVenue]
      ]);
      mockModuleService.getUniForModule?.mockResolvedValue({UniversityID: uniId});


      const result = await service.create(userId, createEventDto);

      expect(mockDb.insert).toHaveBeenCalledTimes(4);
      expect(mockModuleService.getUniForModule).toHaveBeenCalledWith(moduleId);
      expect(result.event).toMatchObject(newEvent);
    });
  });

  //GetAll
  describe('Test_GetAllEvents', ()=>{

    it('should return all events for module', async ()=>{

      const event = createEventForModule(moduleId);
      const uniEvent = createUniversityEvent({moduleID: moduleId});

      mockSelectResult(mockDb, [event]);

      const result = await service.getAllEvents(userId, {moduleId: moduleId});

      expect(result).toMatchObject({events: [event]});
    });
  });

});

