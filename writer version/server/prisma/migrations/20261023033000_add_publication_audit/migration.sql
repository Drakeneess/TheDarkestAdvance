-- CreateTable
CREATE TABLE "publication_audit_events" (
    "id" BIGSERIAL NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "actorUserId" TEXT,
    "storyId" TEXT NOT NULL,
    "chapterId" TEXT,
    "sourceVersionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "publication_audit_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "publication_audit_events_workspaceId_createdAt_idx"
ON "publication_audit_events"("workspaceId", "createdAt");

-- CreateIndex
CREATE INDEX "publication_audit_events_workspaceId_storyId_chapterId_createdAt_idx"
ON "publication_audit_events"("workspaceId", "storyId", "chapterId", "createdAt");
