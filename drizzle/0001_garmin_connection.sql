CREATE TABLE `garmin_connection` (
	`user_id` text PRIMARY KEY NOT NULL,
	`oauth1_token` text NOT NULL,
	`oauth2_token` text NOT NULL,
	`connected_at` integer NOT NULL,
	`last_refreshed_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
