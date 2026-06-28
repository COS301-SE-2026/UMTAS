import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  NotImplementedException,
} from '@nestjs/common';
import { eq, and, SQL } from 'drizzle-orm';
import { DatabaseService } from '../db/database.service';
import { Event, UniversityEvent, PersonalEvent, Course, ModuleEnrollment, Venue, EventVenue } from '../entities/index';
import {
  CreateEventDto,
  EventSingleResponseDto,
  EventFiltersDto,
  EventListResponseDto,
  UpdateEventDto,
  DeleteResponseDto,
  EventCriteriaDto,
  EventDto,
} from './dto/EventDto.dto';

import { AppDatabase } from '../db/database.service';
import { ModuleService } from 'src/Module/module.service';

@Injectable()
export class EventService {
  constructor(
    private readonly dbService: DatabaseService,
    private readonly moduleService: ModuleService
  ) {}

  //Create
  async create(userId: string, dto: CreateEventDto): Promise<EventSingleResponseDto> {

    const moduleId = dto.eventCriteria.moduleID;

    //Create Event
    let event;
    if (moduleId) 
      event = await this.createUniversityEvent(moduleId, dto);
    else
      event = await this.createPersonalEvent(userId, dto);

    return event;
  }//END_Create
  
  //getAllEvents
  async getAllEvents(filters: EventFiltersDto): Promise<EventListResponseDto> {
    
    const conditions: SQL[] = [];

    if (filters.userId)
     { conditions.push(eq(ModuleEnrollment.UserID, filters.userId));}
/*
    //University Owned events
else    if (filters.moduleId)
      {conditions.push(eq(UniversityEvent.moduleID, filters.moduleId));}
*/

    
    if (conditions.length===0)
      throw new BadRequestException('At least one filter required for getAll');

    const events = await this.dbService.db
      .selectDistinct({
        eventID: Event.eventID,
        eventName: Event.eventName,
        eventCode: Event.eventCode,
        eventCriteria: Event.eventCriteria,
        isRecurring: Event.isRecurring
      })
      .from(Event)
      .innerJoin(ModuleEnrollment,eq(ModuleEnrollment.UserID,filters.userId ||""))
      .leftJoin(UniversityEvent, eq(UniversityEvent.eventID, Event.eventID))
      // .leftJoin(PersonalEvent, eq(PersonalEvent.eventID, Event.eventID))
      .where(and(...conditions));

  
   
    return {events: events.map((event) => this.mapEventToDto(event))};
  } //getAllEvents

  //getById - Shouldn't be changing again
  async getById(eventId: string): Promise<EventSingleResponseDto> {
    
    const [event] = await this.dbService.db
      .select()
      .from(Event)
      .where(eq(Event.eventID, eventId))
      .limit(1);

    if (!event)
      throw new InternalServerErrorException(`Event[${eventId}] not found`);

    return {event: this.mapEventToDto(event)};
  } //getById

  async updateEvent(eventId: string,dto: UpdateEventDto):
   Promise<EventSingleResponseDto> {

    //Check that at least one field is provided
    const critUpdate =
      dto.eventCriteria && Object.keys(dto.eventCriteria).length > 0;
    const recUpdate = dto.isRecurring !== undefined;
    const nameUpdate = dto.eventName !== undefined;
    const codeUpdate = dto.eventCode !== undefined;

    if (!critUpdate && !recUpdate && !nameUpdate && !codeUpdate) 
      throw new BadRequestException('At least one update field required');
    //END_field presence check

    const updatedEvent = await this.dbService.db.transaction(
      async (tx: AppDatabase) => {
        //Check that event exists        
        const [existingEvent] = await tx
          .select()
          .from(Event)
          .where(eq(Event.eventID, eventId))
          .limit(1);

        if (!existingEvent)
          throw new NotFoundException(`Event not found for eventId: ${eventId}`);

        //Fetch existing criteria
        const existingCriteria = existingEvent.eventCriteria ?? {};

        //overwrite existing fields if defined in dto
        const mergedCriteria = {
          ...existingCriteria,
          ...dto.eventCriteria
        } as EventCriteriaDto;
        
        const [event] = await tx
          .update(Event)
          .set({
            eventName: dto.eventName?.trim() ?? existingEvent.eventName,
            eventCode: dto.eventCode?.trim() ?? existingEvent.eventCode,
            eventCriteria: mergedCriteria,
            isRecurring: dto.isRecurring ?? existingEvent.isRecurring
          })
          .where(eq(Event.eventID, eventId))
          .returning();

        if (dto.eventCriteria?.moduleID)
        {
          await tx.update(UniversityEvent)
            .set({
              moduleID: dto.eventCriteria.moduleID
            })
            .where(eq(UniversityEvent.eventID,eventId))
        }

        if (!event)
          throw new InternalServerErrorException(`Event[${eventId}] not updated`);

        return event;
      }//END_transaction
    );

    return {event: this.mapEventToDto(updatedEvent)};
  } //update

  //Delete event
  async deleteEvent(eventId: string):
   Promise<DeleteResponseDto> {
 
    //fetch event
    const existingEvent = await this.getById(eventId);

    if (!existingEvent) throw new NotFoundException(`Event [${eventId}] doesn't exist`);

    await this.dbService.db
      .delete(Event)
      .where(eq(Event.eventID, eventId));

    return {
      eventName: existingEvent.event.eventName,
      eventCode: existingEvent.event.eventCode,
      success: true
    };
  } //delete

  //=======================================================
  //🎅's Little Helpers

  //Create Personal Event helper
  async createPersonalEvent(userId: string, dto: CreateEventDto): Promise<EventDto> {
    //Create Personal Event
      //Create Event entity
      //-> Create PersonalEvent join table entity
      //Currently no venue

    //Create Event
    const event = await this.createEvent(dto, userId);
    
    //Create PersonalEvent table entry
    const [persEvent] = await this.dbService.db
      .insert(PersonalEvent)
      .values({
        UserID: userId,
        eventID: event.eventID
      }).returning();

    if (!persEvent) throw new InternalServerErrorException(`Failed to create personalEvent relationship for User[${userId}] | Event[${event.eventID}]`);

    return event;
  }//END_createPersonalEvent

  //Create University Owned Event helper
  async createUniversityEvent(moduleId: string, dto: CreateEventDto): Promise<EventDto> {

    //Create University event
      //Create Event entity
      //-> Create UniversityEvent JOin table entity
      //-> If venue present -> Create venue entity and link through EventVenue

    const event = await this.createEvent(dto);

    //-> Create UniversityEvent JOin table entity
    const [uniEvent] = await this.dbService.db
      .insert(UniversityEvent)
      .values({
        moduleID: moduleId,
        eventID: event.eventID
      }).returning();

    if (!uniEvent) throw new InternalServerErrorException(`Failed to create University event for module[${moduleId}] | event[${event.eventID}]`);

    //-> If venue present
    //Get university ID through module
    const uni = await this.moduleService.getUniForModule(moduleId);

    const venueName = dto.eventCriteria.venue ?? `[${event.eventName}]_venue`;

    const [venue] = await this.dbService.db
      .insert(Venue)
      .values({
        VenueName: venueName,
        UniversityID: uni.UniversityID
      }).returning();

    if (!venue) 
      throw new InternalServerErrorException(`Failed to create venue[${venueName}] for event[${event.eventName}]`);

    //-> Create venue entity and link through EventVenue
    const [eventVenue] = await this.dbService.db
      .insert(EventVenue)
      .values({
        EventID: event.eventID,
        VenueID: venue.VenueID
      }).returning();

    if (!eventVenue)
      throw new InternalServerErrorException(`Failed to create EventVenue relation for Event[${event.eventID}] - Venue[${Venue.VenueID}]`);

    return event;
  }//END_createUniversityEvent
  
  //Create simple event entity
  private async createEvent(dto: CreateEventDto, userId?: string): Promise<EventDto> {

    //Define fields
    const eventCriteria = dto.eventCriteria;

    let eventName;
    let eventCode;
    let isRec;

    if (userId) {//Implies personal event fields are being created

      eventName = dto.eventName ?? `Event_${userId.slice(0,20)}`;
      eventCode = dto.eventCode ?? `Pers_Event`;
      isRec = dto.isRecurring ?? false;//Personal events might not recur
    } else {//Create University event fields

      eventName = dto.eventName ?? `Event_For_Uni}`;
      eventCode = dto.eventCode ?? `Uni_Event`;
      isRec = dto.isRecurring ?? true;//University events usually recur
    }//END_if-else

    const [event] = await this.dbService.db
      .insert(Event)
      .values({
        eventName: eventName,
        eventCode: eventCode,
        eventCriteria: eventCriteria,
        isRecurring: isRec
      }).returning();

      if (!event) throw new InternalServerErrorException(`Failed to create event Name[${eventName}] | Code[${eventCode}]`);
    
      return this.mapEventToDto(event);
  }//END_createEvent

  //Map an event to the DTO - idk why this is even necessary but I kept getting type errors when returning an event which is literally fetched straight from the database
  private mapEventToDto(event: typeof Event.$inferSelect): EventDto {

    return {
      eventID: event.eventID,
      eventName: event.eventName,
      eventCode: event.eventCode ?? undefined,
      eventCriteria: event.eventCriteria as EventCriteriaDto,
      isRecurring: event.isRecurring
    };
  }//END_mapEventToDto
} //EventService
