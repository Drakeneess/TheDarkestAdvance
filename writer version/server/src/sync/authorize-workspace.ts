import {
  db,
} from '../db'

type AuthorizeWorkspaceInput = {
  workspaceId: string
  userId: string
}

export async function canAccessWorkspace({
  workspaceId,
  userId,
}: AuthorizeWorkspaceInput) {
  const access =
    await db.syncWorkspaceAccess.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId,
        },
      },

      select: {
        workspaceId: true,
      },
    })

  return access !== null
}
