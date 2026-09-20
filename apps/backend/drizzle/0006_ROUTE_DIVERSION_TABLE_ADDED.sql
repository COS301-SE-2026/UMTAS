CREATE TABLE "RouteDiversion" (
	"RouteID" uuid NOT NULL,
	"Diversion" double precision DEFAULT 0 NOT NULL,
	"DivertToRoute" uuid NOT NULL,
	CONSTRAINT "RouteDiversion_RouteID_DivertToRoute_pk" PRIMARY KEY("RouteID","DivertToRoute"),
	CONSTRAINT "diversion_range" CHECK ("RouteDiversion"."Diversion" >= 0 AND "RouteDiversion"."Diversion" <= 1),
	CONSTRAINT "no_self_diversion" CHECK ("RouteDiversion"."RouteID"<>"RouteDiversion"."DivertToRoute")
);
--> statement-breakpoint
ALTER TABLE "RouteDiversion" ADD CONSTRAINT "RouteDiversion_RouteID_Route_RouteID_fk" FOREIGN KEY ("RouteID") REFERENCES "public"."Route"("RouteID") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "RouteDiversion" ADD CONSTRAINT "RouteDiversion_DivertToRoute_Route_RouteID_fk" FOREIGN KEY ("DivertToRoute") REFERENCES "public"."Route"("RouteID") ON DELETE cascade ON UPDATE no action;