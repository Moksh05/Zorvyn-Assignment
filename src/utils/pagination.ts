import { ParsedQs } from "qs";

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export async function paginate<T>(
  modelQuery: {
    skip(n: number): typeof modelQuery;
    limit(n: number): typeof modelQuery;
    exec(): Promise<T[]>;
  },
  countQuery: { exec(): Promise<number> } | (() => Promise<number>),
  page: number,
  limit: number
): Promise<PaginatedResult<T>> {
  const skip = (page - 1) * limit;

  const [data, total] = await Promise.all([
    modelQuery.skip(skip).limit(limit).exec(),
    typeof countQuery === "function" ? countQuery() : countQuery.exec(),
  ]);

  return {
    data,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export function getPaginationParams(query: ParsedQs): {
  page: number;
  limit: number;
} {
  const rawPage = Number(query["page"]);
  const rawLimit = Number(query["limit"]);

  const page = !isNaN(rawPage) && rawPage > 0 ? Math.floor(rawPage) : 1;
  const limit =
    !isNaN(rawLimit) && rawLimit > 0 ? Math.min(Math.floor(rawLimit), 100) : 10;

  return { page, limit };
}
