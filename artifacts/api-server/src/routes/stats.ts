import { Router } from "express";
import { db, projectsTable, messagesTable } from "@workspace/db";
import { eq, count, desc } from "drizzle-orm";
import { requireAuth, AuthRequest } from "../middlewares/auth";

const router = Router();

router.get("/stats", requireAuth, async (req: AuthRequest, res) => {
  const [projectCount] = await db
    .select({ total: count() })
    .from(projectsTable)
    .where(eq(projectsTable.userId, req.userId!));

  const [messageCount] = await db
    .select({ total: count() })
    .from(messagesTable)
    .innerJoin(projectsTable, eq(messagesTable.projectId, projectsTable.id))
    .where(eq(projectsTable.userId, req.userId!));

  const recentRows = await db
    .select({
      id: projectsTable.id,
      name: projectsTable.name,
      description: projectsTable.description,
      userId: projectsTable.userId,
      createdAt: projectsTable.createdAt,
      updatedAt: projectsTable.updatedAt,
      messageCount: count(messagesTable.id),
    })
    .from(projectsTable)
    .leftJoin(messagesTable, eq(messagesTable.projectId, projectsTable.id))
    .where(eq(projectsTable.userId, req.userId!))
    .groupBy(projectsTable.id)
    .orderBy(desc(projectsTable.updatedAt))
    .limit(5);

  res.json({
    totalProjects: projectCount.total,
    totalMessages: messageCount.total,
    recentProjects: recentRows.map(r => ({
      ...r,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    })),
  });
});

export default router;
