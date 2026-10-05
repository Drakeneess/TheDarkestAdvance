-- CreateTable
CREATE TABLE "sync_entities" (
    "workspaceId" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "serverVersion" BIGINT NOT NULL,
    "payload" JSONB NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sync_entities_pkey" PRIMARY KEY ("workspaceId","entityType","entityId")
);

-- CreateTable
CREATE TABLE "sync_changes" (
    "cursor" BIGSERIAL NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "serverVersion" BIGINT NOT NULL,
    "payload" JSONB NOT NULL,
    "sourceDeviceId" TEXT NOT NULL,
    "sourceMutationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sync_changes_pkey" PRIMARY KEY ("cursor")
);

-- CreateTable
CREATE TABLE "sync_mutations" (
    "mutationId" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "clientRevision" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "serverVersion" BIGINT,
    "cursor" BIGINT,
    "result" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sync_mutations_pkey" PRIMARY KEY ("mutationId")
);

-- CreateIndex
CREATE INDEX "sync_entities_workspaceId_serverVersion_idx" ON "sync_entities"("workspaceId", "serverVersion");

-- CreateIndex
CREATE INDEX "sync_changes_workspaceId_cursor_idx" ON "sync_changes"("workspaceId", "cursor");

-- CreateIndex
CREATE INDEX "sync_changes_workspaceId_entityType_entityId_idx" ON "sync_changes"("workspaceId", "entityType", "entityId");

-- CreateIndex
CREATE INDEX "sync_mutations_workspaceId_deviceId_idx" ON "sync_mutations"("workspaceId", "deviceId");
