CREATE TABLE `journey_rewards` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`event_key` text NOT NULL,
	`code` text NOT NULL,
	`title` text NOT NULL,
	`xp` integer NOT NULL,
	`date` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_rewards_user_event` ON `journey_rewards` (`user_id`,`event_key`);--> statement-breakpoint
CREATE INDEX `idx_rewards_user_date` ON `journey_rewards` (`user_id`,`date`);