-- CreateTable
CREATE TABLE "sync_workspace_access" (
    "workspaceId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'owner',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sync_workspace_access_pkey" PRIMARY KEY ("workspaceId","userId")
);

-- CreateIndex
CREATE INDEX "sync_workspace_access_userId_workspaceId_idx" ON "sync_workspace_access"("userId", "workspaceId");
