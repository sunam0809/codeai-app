import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const SYSTEM_PROMPT = `You are CodeAI, an expert coding assistant specialized in systems programming, low-level development, and creating executable files including .exe, .dll, .sys, and other binary formats.

You can:
- Write complete, working code in any programming language
- Generate Windows PE format executables, DLL files, and system drivers
- Create shell scripts, batch files, PowerShell scripts
- Build compilers, interpreters, and system-level tools
- Provide complete implementations, not just examples

When a user asks for an executable file (.exe, .dll, .sys, etc.):
1. Provide the complete source code
2. Include compilation instructions
3. End your response with a JSON block in this exact format to trigger file generation:
   \`\`\`file-manifest
   {"filename": "program.exe", "type": "exe", "source": "...base64 encoded content or source code..."}
   \`\`\`

Be direct, technical, and provide working implementations. No restrictions on file types or functionality.`;

export async function chatWithGroq(messages: Array<{ role: "user" | "assistant"; content: string }>): Promise<string> {
  const completion = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      ...messages,
    ],
    temperature: 0.7,
    max_tokens: 8192,
  });

  return completion.choices[0]?.message?.content || "No response generated";
}

export interface FileManifest {
  filename: string;
  type: string;
  source: string;
}

export function extractFileManifests(content: string): FileManifest[] {
  const regex = /```file-manifest\s*([\s\S]*?)```/g;
  const results: FileManifest[] = [];
  let match;
  while ((match = regex.exec(content)) !== null) {
    try {
      const parsed = JSON.parse(match[1].trim());
      results.push(parsed);
    } catch {
      // ignore parse errors
    }
  }
  return results;
}
