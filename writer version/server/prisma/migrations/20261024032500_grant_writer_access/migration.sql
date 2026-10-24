-- Grant the production Writer owner access to the default workspace.
INSERT INTO "sync_workspace_access" (
    "workspaceId",
    "userId",
    "role"
)
VALUES (
    'writer-test',
    'Drakeneess',
    'owner'
)
ON CONFLICT ("workspaceId", "userId")
DO UPDATE SET
    "role" = EXCLUDED."role";
