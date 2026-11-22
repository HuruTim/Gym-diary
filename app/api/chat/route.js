import { Mistral } from "@mistralai/mistralai";

const client = new Mistral({ apiKey: process.env.MISTRAL_API_KEY ?? "" });

export async function POST(request) {
  if (!process.env.MISTRAL_API_KEY) {
    return Response.json(
      { error: "MISTRAL_API_KEY is not set on the server." },
      { status: 500 },
    );
  }

  let messages;
  try {
    const body = await request.json();
    messages = body?.messages;
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (
    !Array.isArray(messages) ||
    messages.length === 0 ||
    messages.some(
      (m) =>
        !m ||
        (m.role !== "user" && m.role !== "assistant") ||
        typeof m.content !== "string",
    )
  ) {
    return Response.json(
      { error: 'Expected a non-empty "messages" array of { role, content }.' },
      { status: 400 },
    );
  }

  try {
    const result = await client.chat.complete({
      model: "mistral-small-latest",
      messages,
    });

    const raw = result.choices?.[0]?.message?.content ?? "";
    const text =
      typeof raw === "string"
        ? raw
        : raw.map((chunk) => chunk.text ?? "").join("");

    return Response.json({ message: { role: "assistant", content: text } });
  } catch (err) {
    console.error("Mistral API error:", err?.message || err);
    return Response.json(
      { error: "Failed to get a response from the Mistral API." },
      { status: 502 },
    );
  }
}
