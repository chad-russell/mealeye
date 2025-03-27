CREATE TABLE `ingredient_associations` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`recipe_association_id` integer NOT NULL,
	`ingredient` text NOT NULL,
	`amount` text,
	`step` integer NOT NULL,
	`text` text NOT NULL,
	`created_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`recipe_association_id`) REFERENCES `recipe_associations`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `recipe_associations` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`recipe_id` text NOT NULL,
	`recipe_hash` text NOT NULL,
	`description` text,
	`created_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL
);
