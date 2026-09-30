// Typed errors so the UI can pick the right recovery path (PROD-038).
export type DataErrorKind = "permission" | "validation" | "not_found" | "conflict" | "network";

export class DataError extends Error {
  constructor(public readonly kind: DataErrorKind, message: string) {
    super(message);
    this.name = "DataError";
  }
}

/** Map a PostgREST/Postgres error to a user-facing DataError. */
export function fromPostgrestError(error: { code?: string; message: string }): DataError {
  switch (error.code) {
    case "42501": // insufficient_privilege (RLS or column grant)
      return new DataError("permission", "You don't have permission to do that in this workspace.");
    case "23505":
      return new DataError("conflict", "That already exists in this workspace.");
    case "23503":
      return new DataError("validation", "That refers to something outside this workspace.");
    case "23514":
    case "22P02":
      return new DataError("validation", "Some values were not accepted. Check the fields and try again.");
    case "P0001":
      return new DataError("validation", error.message);
    case "PGRST116":
      return new DataError("not_found", "That item no longer exists.");
    default:
      return new DataError("network", "Couldn't reach the server. Check your connection and try again.");
  }
}
