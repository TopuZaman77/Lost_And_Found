ALTER TABLE `items` ADD `searchText` varchar(512) NOT NULL;--> statement-breakpoint
CREATE INDEX `items_search_text_idx` ON `items` (`searchText`);