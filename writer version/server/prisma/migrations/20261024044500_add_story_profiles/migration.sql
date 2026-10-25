ALTER TABLE "published_stories"
ADD COLUMN "profile" JSONB NOT NULL DEFAULT '{"subtitle":"","authorName":"","status":"ongoing","language":"es","genres":[],"tags":[],"contentRating":null}'::jsonb,
ADD COLUMN "assets" JSONB NOT NULL DEFAULT '{"coverImageUrl":null,"heroImageUrl":null,"logoImageUrl":null}'::jsonb,
ADD COLUMN "visuals" JSONB NOT NULL DEFAULT '{"accent":null,"accentSoft":null,"background":null,"panel":null,"displayFontKey":null,"bodyFontKey":null,"ornamentKey":null,"textureKey":null,"readerWidth":"standard"}'::jsonb;
