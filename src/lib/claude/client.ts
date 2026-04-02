import { query } from "@anthropic-ai/claude-agent-sdk";
import type { SDKUserMessage } from "@anthropic-ai/claude-agent-sdk";
import { MEDUSA_CLAUDE_MODEL } from "./models";

export type ClaudeTextBlock = {
  type: "text";
  text: string;
};

export type ClaudeImageBlock = {
  type: "image";
  source: {
    type: "base64";
    media_type: "image/jpeg" | "image/png" | "image/webp";
    data: string;
  };
};

export type ClaudeContentBlock = ClaudeTextBlock | ClaudeImageBlock;

interface RunClaudeJsonQueryParams {
  content: string | ClaudeContentBlock[];
  systemPrompt: string;
  schema: Record<string, unknown>;
  errorTag: string;
}

export async function runClaudeJsonQuery<T>({
  content,
  systemPrompt,
  schema,
  errorTag,
}: RunClaudeJsonQueryParams): Promise<T> {
  assertClaudeRuntime();

  const sessionId = crypto.randomUUID();

  async function* makeMessages(): AsyncIterable<SDKUserMessage> {
    yield {
      type: "user",
      session_id: sessionId,
      parent_tool_use_id: null,
      // The SDK expects Claude message content here.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      message: { role: "user", content } as any,
    };
  }

  let result: T | null = null;
  const seenMessageTypes = new Set<string>();

  for await (const msg of query({
    prompt: makeMessages(),
    options: {
      model: MEDUSA_CLAUDE_MODEL,
      maxTurns: 5,
      systemPrompt,
      tools: [],
      outputFormat: {
        type: "json_schema",
        schema,
      },
      permissionMode: "bypassPermissions",
      allowDangerouslySkipPermissions: true,
    },
  })) {
    seenMessageTypes.add(`${msg.type}${"subtype" in msg && msg.subtype ? `:${msg.subtype}` : ""}`);

    if (msg.type !== "result") {
      continue;
    }

    if (msg.subtype === "success" && msg.structured_output) {
      result = msg.structured_output as T;
      continue;
    }

    if (msg.subtype === "success" && !msg.structured_output) {
      console.error(`[${errorTag}] Success but no structured output. Result text:`, msg.result);
      throw new Error("Agent returned no structured output");
    }

    const errors = (msg as unknown as { errors?: string[] }).errors ?? [];
    console.error(`[${errorTag}] Agent error - subtype:`, msg.subtype, "| errors:", errors);
    throw new Error(errors[0] ?? "Agent returned an error");
  }

  if (!result) {
    const detail = [...seenMessageTypes].join(", ");
    throw new Error(
      detail
        ? `Agent produced no structured output. SDK events seen: ${detail}`
        : "Agent produced no structured output"
    );
  }

  return result;
}

function assertClaudeRuntime() {
  const hasApiKey = Boolean(process.env.ANTHROPIC_API_KEY?.trim());
  const hasOauthToken = Boolean(process.env.CLAUDE_CODE_OAUTH_TOKEN?.trim());

  if (!hasApiKey && !hasOauthToken) {
    throw new Error("Missing Claude credentials. Set ANTHROPIC_API_KEY or CLAUDE_CODE_OAUTH_TOKEN.");
  }
}
