export interface PaginationQuery {
  page?: number;
  limit?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

export function paginate<T>(data: T[], total: number, query: PaginationQuery): PaginatedResult<T> {
  const page = query.page ?? 1;
  const limit = query.limit ?? 10;
  return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
}

export function getSkipTake(query: PaginationQuery) {
  const page = query.page ?? 1;
  const limit = Math.min(query.limit ?? 10, 100);
  return { skip: (page - 1) * limit, take: limit };
}
