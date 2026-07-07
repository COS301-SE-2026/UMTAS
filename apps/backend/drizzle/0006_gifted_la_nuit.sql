CREATE TABLE "SelectedUniversity" (
	"UserID" uuid NOT NULL,
	"UniversityID" uuid NOT NULL,
	"role" "RoleType" DEFAULT 'STUDENT' NOT NULL,
	CONSTRAINT "SelectedUniversity_UserID_pk" PRIMARY KEY("UserID")
);
--> statement-breakpoint
ALTER TABLE "SelectedUniversity" ADD CONSTRAINT "SelectedUniversity_UserID_user_id_fk" FOREIGN KEY ("UserID") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "SelectedUniversity" ADD CONSTRAINT "SelectedUniversity_UniversityID_University_UniversityID_fk" FOREIGN KEY ("UniversityID") REFERENCES "public"."University"("UniversityID") ON DELETE cascade ON UPDATE no action;