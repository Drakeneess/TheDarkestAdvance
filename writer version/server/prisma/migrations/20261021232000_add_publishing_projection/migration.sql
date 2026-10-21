-- CreateTable
CREATE TABLE "published_stories" (
    "workspaceId" TEXT NOT NULL,
    "storyId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "themeKey" TEXT NOT NULL,
    "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "published_stories_pkey" PRIMARY KEY ("workspaceId", "storyId")
);

-- CreateTable
CREATE TABLE "published_chapters" (
    "workspaceId" TEXT NOT NULL,
    "storyId" TEXT NOT NULL,
    "chapterId" TEXT NOT NULL,
    "sourceVersionId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "published_chapters_pkey" PRIMARY KEY ("workspaceId", "storyId", "chapterId")
);

-- CreateIndex
CREATE UNIQUE INDEX "published_stories_slug_key" ON "published_stories"("slug");

-- CreateIndex
CREATE INDEX "published_stories_workspaceId_idx" ON "published_stories"("workspaceId");

-- CreateIndex
CREATE UNIQUE INDEX "published_chapters_workspaceId_storyId_slug_key" ON "published_chapters"("workspaceId", "storyId", "slug");

-- CreateIndex
CREATE INDEX "published_chapters_workspaceId_storyId_order_idx" ON "published_chapters"("workspaceId", "storyId", "order");

-- AddForeignKey
ALTER TABLE "published_chapters"
ADD CONSTRAINT "published_chapters_workspaceId_storyId_fkey"
FOREIGN KEY ("workspaceId", "storyId")
REFERENCES "published_stories"("workspaceId", "storyId")
ON DELETE CASCADE
ON UPDATE CASCADE;
