import { Router, type IRouter } from "express";
import { db, projectsTable, messagesTable, generatedFilesTable } from "@workspace/db";
import { eq, and, count, desc } from "drizzle-orm";
import { CreateProjectBody, GetProjectParams, DeleteProjectParams } from "@workspace/api-zod";
import { requireAuth } from "../middlewares/requireAuth";

const router: IRouter = Router();

router.get("/projects", requireAuth, async (req, res): Promise<void> => {
  const projects = await db
    .select()
    .from(projectsTable)
    .where(eq(projectsTable.userId, req.user!.userId))
    .orderBy(desc(projectsTable.updatedAt));

  const projectsWithCount = await Promise.all(
    projects.map(async (p) => {
      const [{ value }] = await db
        .select({ value: count() })
        .from(messagesTable)
        .where(eq(messagesTable.projectId, p.id));
      return {
        id: p.id,
        userId: p.userId,
        name: p.name,
        description: p.description ?? null,
        messageCount: Number(value),
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
      };
    })
  );

  res.json(projectsWithCount);
});

router.post("/projects", requireAuth, async (req, res): Promise<void> => {
  const parsed = CreateProjectBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [project] = await db
    .insert(projectsTable)
    .values({ userId: req.user!.userId, name: parsed.data.name, description: parsed.data.description ?? null })
    .returning();

  res.status(201).json({
    id: project.id,
    userId: project.userId,
    name: project.name,
    description: project.description ?? null,
    messageCount: 0,
    createdAt: project.createdAt.toISOString(),
    updatedAt: project.updatedAt.toISOString(),
  });
});

router.get("/projects/:id", requireAuth, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid project id" });
    return;
  }

  const [project] = await db
    .select()
    .from(projectsTable)
    .where(and(eq(projectsTable.id, id), eq(projectsTable.userId, req.user!.userId)));

  if (!project) {
    res.status(404).json({ error: "Project not found" });
    return;
  }

  const [{ value }] = await db
    .select({ value: count() })
    .from(messagesTable)
    .where(eq(messagesTable.projectId, id));

  res.json({
    id: project.id,
    userId: project.userId,
    name: project.name,
    description: project.description ?? null,
    messageCount: Number(value),
    createdAt: project.createdAt.toISOString(),
    updatedAt: project.updatedAt.toISOString(),
  });
});

router.delete("/projects/:id", requireAuth, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid project id" });
    return;
  }

  const [project] = await db
    .delete(projectsTable)
    .where(and(eq(projectsTable.id, id), eq(projectsTable.userId, req.user!.userId)))
    .returning();

  if (!project) {
    res.status(404).json({ error: "Project not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
