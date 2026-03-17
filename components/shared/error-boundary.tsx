"use client";

import React from "react";
import { AlertTriangleIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ErrorBoundaryProps {
    children: React.ReactNode;
    fallback?: React.ReactNode;
}

interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends React.Component<
    ErrorBoundaryProps,
    ErrorBoundaryState
> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error };
    }

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="flex flex-col items-center justify-center rounded-xl border border-destructive/20 bg-destructive/5 px-6 py-16 text-center">
                    <div className="mb-4 rounded-full bg-destructive/10 p-3 text-destructive">
                        <AlertTriangleIcon className="h-6 w-6" />
                    </div>
                    <h3 className="text-base font-semibold">Произошла ошибка</h3>
                    <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                        {this.state.error?.message ?? "Неизвестная ошибка"}
                    </p>
                    <Button
                        variant="outline"
                        size="sm"
                        className="mt-4"
                        onClick={() => this.setState({ hasError: false, error: null })}
                    >
                        Попробовать снова
                    </Button>
                </div>
            );
        }

        return this.props.children;
    }
}
