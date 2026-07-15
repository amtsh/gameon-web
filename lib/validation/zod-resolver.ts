import type { FieldError, FieldErrors, FieldValues, Resolver } from "react-hook-form";
import type { ZodError, ZodType } from "zod";

function zodIssuesToFieldErrors<T extends FieldValues>(error: ZodError<T>): FieldErrors<T> {
  const errors: Record<string, FieldError | Record<string, unknown>> = {};

  for (const issue of error.issues) {
    const { path } = issue;
    const fieldError: FieldError = {
      type: issue.code,
      message: issue.message,
    };

    if (path.length === 0) {
      errors.root = fieldError;
      continue;
    }

    let current = errors;
    for (let index = 0; index < path.length - 1; index += 1) {
      const key = String(path[index]);
      const next = current[key];
      if (!next || typeof next !== "object" || "message" in next) {
        current[key] = {};
      }
      current = current[key] as Record<string, FieldError | Record<string, unknown>>;
    }

    current[String(path[path.length - 1])] = fieldError;
  }

  return errors as FieldErrors<T>;
}

export function zodResolver<T extends FieldValues>(schema: ZodType<T>): Resolver<T> {
  return async (values) => {
    const result = await schema.safeParseAsync(values);

    if (result.success) {
      return { values: result.data, errors: {} };
    }

    return {
      values: {},
      errors: zodIssuesToFieldErrors(result.error),
    };
  };
}
