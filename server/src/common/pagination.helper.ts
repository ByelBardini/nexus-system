export interface PaginateParams {
  page?: number;
  limit?: number;
}

export interface PaginateOptions {
  maxLimit?: number;
  defaultLimit?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export function paginateParams(
  params: PaginateParams,
  options: PaginateOptions = {},
): { page: number; limit: number; skip: number } {
  const { maxLimit = 100, defaultLimit = 15 } = options;
  const page = Math.max(1, params.page ?? 1);
  const limit = Math.min(maxLimit, Math.max(1, params.limit ?? defaultLimit));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

export async function paginate<T>(
  findManyFn: (skip: number, take: number) => Promise<T[]>,
  countFn: () => Promise<number>,
  params: PaginateParams,
  options: PaginateOptions = {},
): Promise<PaginatedResult<T>> {
  const { page, limit, skip } = paginateParams(params, options);
  const [data, total] = await Promise.all([
    findManyFn(skip, limit),
    countFn(),
  ]);
  return {
    data,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}
