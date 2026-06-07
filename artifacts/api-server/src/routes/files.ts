import { Router, type IRouter } from "express";
import { db, projectsTable, generatedFilesTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import { requireAuth } from "../middlewares/requireAuth";

const router: IRouter = Router();

router.get("/projects/:id/files", requireAuth, async (req, res): Promise<void> => {
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

  const files = await db
    .select()
    .from(generatedFilesTable)
    .where(eq(generatedFilesTable.projectId, id))
    .orderBy(desc(generatedFilesTable.createdAt));

  res.json(files.map((f) => ({
    id: f.id,
    projectId: f.projectId,
    messageId: f.messageId ?? null,
    filename: f.filename,
    fileType: f.fileType,
    fileSize: f.fileSize,
    createdAt: f.createdAt.toISOString(),
  })));
});

router.get("/files/:fileId/download", requireAuth, async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.fileId) ? req.params.fileId[0] : req.params.fileId;
  const fileId = parseInt(rawId, 10);
  if (isNaN(fileId)) {
    res.status(400).json({ error: "Invalid file id" });
    return;
  }

  const [file] = await db
    .select()
    .from(generatedFilesTable)
    .where(eq(generatedFilesTable.id, fileId));

  if (!file) {
    res.status(404).json({ error: "File not found" });
    return;
  }

  const [project] = await db
    .select()
    .from(projectsTable)
    .where(and(eq(projectsTable.id, file.projectId), eq(projectsTable.userId, req.user!.userId)));

  if (!project) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const contentBuffer = Buffer.from(file.fileContent, "utf8");
  res.setHeader("Content-Disposition", `attachment; filename="${file.filename}"`);
  res.setHeader("Content-Type", "application/octet-stream");
  res.setHeader("Content-Length", contentBuffer.length);
  res.send(contentBuffer);
});

export default router;
