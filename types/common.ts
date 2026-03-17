export type PaginatedParams = {
    page?: number;
    pageSize?: number;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
};

export type PaginatedResponse<T> = {
    data: T[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
};
