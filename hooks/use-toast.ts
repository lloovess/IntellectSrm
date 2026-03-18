import { useCallback } from "react";

export type Toast = {
    title: string;
    description?: string;
    variant?: "default" | "destructive";
};

// Simple toast hook - in a real app you'd use a toast library like sonner or react-toastify
export function useToast() {
    const toast = useCallback((props: Toast) => {
        // For now, just log to console
        // In production, integrate with a real toast library
        if (props.variant === "destructive") {
            console.error(`[${props.title}] ${props.description}`);
        } else {
            console.log(`[${props.title}] ${props.description}`);
        }
    }, []);

    return { toast };
}
