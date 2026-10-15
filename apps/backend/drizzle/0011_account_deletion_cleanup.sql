CREATE FUNCTION cleanup_deleted_user_timetables() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  DELETE FROM "Timetable" t
    WHERE EXISTS (SELECT 1 FROM "UserTimetable" u
      WHERE u."TimetableID" = t."timetableID" AND u."UserID" = OLD.id)
    AND NOT EXISTS (SELECT 1 FROM "UserTimetable" u
      WHERE u."TimetableID" = t."timetableID" AND u."UserID" <> OLD.id);
  RETURN OLD;
END;
$$;
--> statement-breakpoint
CREATE TRIGGER deleted_user_cleanup BEFORE DELETE ON "user"
  FOR EACH ROW EXECUTE FUNCTION cleanup_deleted_user_timetables();
