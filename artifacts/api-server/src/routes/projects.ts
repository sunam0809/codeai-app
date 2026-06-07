import { Router } from "express";
import { db, projectsTable, messagesTable } from "@workspace/db";
import { eq, and, count, desc } from "drizzle-orm";
import { requireAuth, AuthRequest } from "../middlewares/auth";

const router = Router();

router.get("/projects", requireAuth, async (req: AuthRequest, res) => {
  const rows = await db
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
    .orderBy(desc(projectsTable.updatedAt));

  res.json(rows.map(r => ({
    ...r,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  })));
});

router.post("/projects", requireAuth, async (req: AuthRequest, res) => {
  const { name, description } = req.body;
  if (!name || typeof name !== "string") {
    res.status(400).json({ error: "Name is required" });
    return;
  }
  const [project] = await db.insert(projectsTable).values({
    name: name.trim(),
    description: description || null,
    userId: req.userId!,
  }).returning();
  res.status(201).json({
    ...project,
    messageCount: 0,
    createdAt: project.createdAt.toISOString(),
    updatedAt: project.updatedAt.toISOString(),
  });
});

router.get("/projects/:id", requireAuth, async (req: AuthRequest, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const rows = await db
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
    .where(and(eq(projectsTable.id, id), eq(projectsTable.userId, req.userId!)))
    .groupBy(projectsTable.id)
    .limit(1);

  if (rows.length === 0) { res.status(404).json({ error: "Not found" }); return; }
  const r = rows[0];
  res.json({ ...r, createdAt: r.createdAt.toISOString(), updatedAt: r.updatedAt.toISOString() });
});

router.delete("/projects/:id", requireAuth, async (req: AuthRequest, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  await db.delete(projectsTable).where(and(eq(projectsTable.id, id), eq(projectsTable.userId, req.userId!)));
  res.status(204).send();
});

export default router;
