import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { projectsTable } from "./projects";

export const generatedFilesTable = pgTable("generated_files", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => projectsTable.id, { onDelete: "cascade" }),
  messageId: integer("message_id"),
  filename: text("filename").notNull(),
  fileType: text("file_type").notNull(),
  fileSize: integer("file_size").notNull().default(0),
  fileContent: text("file_content").notNull().default(""),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertGeneratedFileSchema = createInsertSchema(generatedFilesTable).omit({ id: true, createdAt: true });
export type InsertGeneratedFile = z.infer<typeof insertGeneratedFileSchema>;
export type GeneratedFile = typeof generatedFilesTable.$inferSelect;
