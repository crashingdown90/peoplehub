// @ai:ag - Work Mode Selector for WFO/WFH selection

"use client";

import { MapPin, Home } from "lucide-react";

interface WorkModeSelectorProps {
    value: "WFO" | "WFH";
    onChange: (mode: "WFO" | "WFH") => void;
    disabled?: boolean;
    allowedModes?: ("WFO" | "WFH")[];
}

export function WorkModeSelector({
    value,
    onChange,
    disabled = false,
    allowedModes = ["WFO", "WFH"],
}: WorkModeSelectorProps) {
    const modes = [
        {
            value: "WFO" as const,
            label: "WFO",
            description: "Work From Office (Kantor)",
            icon: MapPin,
            color: "blue",
        },
        {
            value: "WFH" as const,
            label: "WFH",
            description: "Work From Home (Rumah)",
            icon: Home,
            color: "green",
        },
    ];

    const availableModes = modes.filter((mode) => allowedModes.includes(mode.value));

    return (
        <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">
                Mode Kerja <span className="text-red-600">*</span>
            </label>

            <div className="grid grid-cols-2 gap-3">
                {availableModes.map((mode) => {
                    const Icon = mode.icon;
                    const isSelected = value === mode.value;
                    const isDisabled = disabled || !allowedModes.includes(mode.value);

                    return (
                        <button
                            key={mode.value}
                            type="button"
                            onClick={() => !isDisabled && onChange(mode.value)}
                            disabled={isDisabled}
                            className={`
                relative p-4 rounded-lg border-2 transition-all
                ${isSelected
                                    ? `border-${mode.color}-500 bg-${mode.color}-50`
                                    : "border-slate-200 bg-white hover:border-slate-300"
                                }
                ${isDisabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
                ${!isDisabled && !isSelected ? "hover:bg-slate-50" : ""}
              `}
                        >
                            {/* Selected indicator */}
                            {isSelected && (
                                <div className="absolute top-2 right-2">
                                    <div className={`w-5 h-5 rounded-full bg-${mode.color}-600 flex items-center justify-center`}>
                                        <svg
                                            className="w-3 h-3 text-white"
                                            fill="currentColor"
                                            viewBox="0 0 20 20"
                                        >
                                            <path
                                                fillRule="evenodd"
                                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                                clipRule="evenodd"
                                            />
                                        </svg>
                                    </div>
                                </div>
                            )}

                            {/* Icon */}
                            <div className="flex flex-col items-center gap-2">
                                <div
                                    className={`p-3 rounded-full ${isSelected ? `bg-${mode.color}-100` : "bg-slate-100"
                                        }`}
                                >
                                    <Icon
                                        className={`h-6 w-6 ${isSelected ? `text-${mode.color}-600` : "text-slate-600"
                                            }`}
                                    />
                                </div>

                                {/* Label */}
                                <div className="text-center">
                                    <p
                                        className={`font-semibold ${isSelected ? `text-${mode.color}-700` : "text-slate-700"
                                            }`}
                                    >
                                        {mode.label}
                                    </p>
                                    <p
                                        className={`text-xs mt-1 ${isSelected ? `text-${mode.color}-600` : "text-slate-500"
                                            }`}
                                    >
                                        {mode.description}
                                    </p>
                                </div>
                            </div>
                        </button>
                    );
                })}
            </div>

            {/* Info message */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-xs text-blue-900">
                    {value === "WFO" ? (
                        <>
                            <strong>WFO:</strong> Lokasi GPS akan divalidasi untuk memastikan Anda berada di area kantor.
                        </>
                    ) : (
                        <>
                            <strong>WFH:</strong> Lokasi GPS opsional, namun foto selfie tetap diperlukan.
                        </>
                    )}
                </p>
            </div>
        </div>
    );
}
