ALTER TABLE "user" ALTER COLUMN "role" SET DEFAULT 'user';
UPDATE "user" SET "role" = 'user' WHERE "role" <> 'sys_admin';
