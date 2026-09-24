import { Injectable, Logger } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import type { AppDatabase } from '../db/database.service';
import { Venue } from '../entities';

type VenueRecord = typeof Venue.$inferSelect;

@Injectable()
export class VenueResolver {
  private readonly logger = new Logger(VenueResolver.name);

  async resolveForUniversity(
    db: AppDatabase,
    universityId: string,
    venueNames: string[],
  ): Promise<string[]> {
    const requestedNames = Array.from(
      new Set(
        venueNames.map((name) => name.trim()).filter((name) => name.length > 0),
      ),
    );

    if (requestedNames.length === 0) {
      return [];
    }

    const existingVenues = await db
      .select()
      .from(Venue)
      .where(eq(Venue.UniversityID, universityId));

    const exactVenueByName = new Map<string, VenueRecord>();
    const normalizedVenuesByName = new Map<string, VenueRecord[]>();

    for (const venue of existingVenues) {
      const exactName = venue.VenueName.trim();

      exactVenueByName.set(exactName, venue);

      const normalizedName = normalizeVenueName(exactName);

      const matches = normalizedVenuesByName.get(normalizedName) ?? [];
      matches.push(venue);
      normalizedVenuesByName.set(normalizedName, matches);
    }

    const resolvedIds = new Set<string>();

    for (const requestedName of requestedNames) {
      const exactVenue = exactVenueByName.get(requestedName);

      if (exactVenue) {
        resolvedIds.add(exactVenue.VenueID);
        continue;
      }

      const normalizedName = normalizeVenueName(requestedName);
      const normalizedMatches =
        normalizedVenuesByName.get(normalizedName) ?? [];

      if (normalizedMatches.length === 1) {
        const matchedVenue = normalizedMatches[0];

        this.logger.log(
          `Resolved PDF venue "${requestedName}" to existing venue "${matchedVenue.VenueName}"`,
        );

        resolvedIds.add(matchedVenue.VenueID);
        continue;
      }

      if (normalizedMatches.length > 1) {
        this.logger.warn(
          `Could not safely resolve PDF venue "${requestedName}" because multiple existing venues matched: ${normalizedMatches
            .map((venue) => venue.VenueName)
            .join(', ')}`,
        );

        continue;
      }

      this.logger.warn(
        `Could not resolve PDF venue "${requestedName}" for university ${universityId}. No new venue will be created.`,
      );
    }

    return Array.from(resolvedIds);
  }
}

function normalizeVenueName(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}
