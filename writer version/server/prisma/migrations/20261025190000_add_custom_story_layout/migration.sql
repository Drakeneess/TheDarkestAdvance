ALTER TABLE "published_stories"
ADD COLUMN "layout" JSONB NOT NULL
DEFAULT '{"mode":"preset","html":"","css":""}';
