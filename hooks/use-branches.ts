"use client";

import { useEffect, useState } from "react";

export type Branch = {
    id: string;
    name: string;
};

export function useBranches() {
    const [branches, setBranches] = useState<Branch[] | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        const fetchBranches = async () => {
            try {
                const response = await fetch("/api/branches");
                if (!response.ok) {
                    throw new Error("Failed to fetch branches");
                }
                const data = await response.json();
                setBranches(data.data);
            } catch (err) {
                setError(err instanceof Error ? err : new Error("Unknown error"));
            } finally {
                setLoading(false);
            }
        };

        fetchBranches();
    }, []);

    return { branches, loading, error };
}
