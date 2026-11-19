import { CoachError } from "./coach";

export const ok = (data: unknown) => Response.json(data);
export const bad = (error: string, status = 400) => Response.json({ error }, { status });

export async function body<T = Record<string, unknown>>(req: Request): Promise<Partial<T>> {
  try {
    return (await req.json()) as Partial<T>;
  } catch {
    return {};
  }
}

/** Wrap a route handler so coach/validation errors come back as JSON messages. */
export function handle(fn: (req: Request) => Promise<Response>) {
  return async (req: Request) => {
    try {
      return await fn(req);
    } catch (e) {
      if (e instanceof CoachError) return bad(e.message, 502);
      console.error(e);
      return bad(e instanceof Error ? e.message : "Something went wrong", 500);
    }
  };
}
