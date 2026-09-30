CREATE TABLE `user_versions` (
	`user_id` text PRIMARY KEY NOT NULL,
	`revision` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
ALTER TABLE `operations` ADD `revision` integer DEFAULT 0 NOT NULL;