import { Router, type IRouter } from "express";
import { db, projectsTable, messagesTable, generatedFilesTable } from "@workspace/db";
import { eq, and, asc } from "drizzle-orm";
import { SendMessageBody, SendMessageParams } from "@workspace/api-zod";
import { requireAuth } from "../middlewares/requireAuth";
import { chatWithGroq, extractFileManifests } from "../lib/groq";

const router: IRouter = Router();

router.get("/projects/:id/messages", requireAuth, async (req, res): Promise<void> => {
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

  const messages = await db
    .select()
    .from(messagesTable)
    .where(eq(messagesTable.projectId, id))
    .orderBy(asc(messagesTable.createdAt));

  res.json(messages.map((m) => ({
    id: m.id,
    projectId: m.projectId,
    role: m.role,
    content: m.content,
    createdAt: m.createdAt.toISOString(),
  })));
});

router.post("/projects/:id/messages", requireAuth, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid project id" });
    return;
  }

  const parsed = SendMessageBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
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

  const [userMessage] = await db
    .insert(messagesTable)
    .values({ projectId: id, role: "user", content: parsed.data.content })
    .returning();

  const history = await db
    .select()
    .from(messagesTable)
    .where(eq(messagesTable.projectId, id))
    .orderBy(asc(messagesTable.createdAt));

  const groqMessages = history.map((m) => ({
    role: m.role as "user" | "assistant",
    content: m.content,
  }));

  const aiContent = await chatWithGroq(groqMessages);

  const [aiMessage] = await db
    .insert(messagesTable)
    .values({ projectId: id, role: "assistant", content: aiContent })
    .returning();

  await db
    .update(projectsTable)
    .set({ updatedAt: new Date() })
    .where(eq(projectsTable.id, id));

  const manifests = extractFileManifests(aiContent);
  for (const manifest of manifests) {
    const sourceContent = manifest.source || "";
    const fileSize = Buffer.byteLength(sourceContent, "utf8");
    await db.insert(generatedFilesTable).values({
      projectId: id,
      messageId: aiMessage.id,
      filename: manifest.filename,
      fileType: manifest.type,
      fileSize,
      fileContent: sourceContent,
    });
  }

  res.json({
    id: aiMessage.id,
    projectId: aiMessage.projectId,
    role: aiMessage.role,
    content: aiMessage.content,
    createdAt: aiMessage.createdAt.toISOString(),
  });
});

export default router;
