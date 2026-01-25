// @ai:ag - Clock Button component for clock in/out

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Clock, Loader2 } from "lucide-react";

interface ClockButtonProps {
    type: "in" | "out";
    onClock: () => Promise<void>;
    disabled?: boolean;
    hasClocked?: boolean;
}

export function ClockButton({ type, onClock, disabled = false, hasClocked = false }: ClockButtonProps) {
    const [isLoading, setIsLoading] = useState(false);

    const handleClick = async () => {
        setIsLoading(true);
        try {
            await onClock();
        } finally {
            setIsLoading(false);
        }
    };

    const isClockIn = type === "in";
    const buttonText = isClockIn ? "Clock In" : "Clock Out";
    const buttonColor = isClockIn
        ? "bg-green-600 hover:bg-green-700"
        : "bg-blue-600 hover:bg-blue-700";

    return (
        <Button
            onClick={handleClick}
            disabled={disabled || isLoading || hasClocked}
            className={`w-full h-24 text-lg font-semibold ${buttonColor} ${hasClocked ? "opacity-50 cursor-not-allowed" : ""
                }`}
            size="lg"
        >
            {isLoading ? (
                <>
                    <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                    Memproses...
                </>
            ) : hasClocked ? (
                <>
                    <Clock className="mr-2 h-6 w-6" />
                    Sudah {buttonText}
                </>
            ) : (
                <>
                    <Clock className="mr-2 h-6 w-6" />
                    {buttonText}
                </>
            )}
        </Button>
    );
}
