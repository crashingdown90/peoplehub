"use client";

// @ai:cx - File dropzone uploader

import { useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { CloudUpload, X } from "lucide-react";

interface FileDropzoneProps {
    accept?: string;
    multiple?: boolean;
    maxSizeMb?: number;
    onChange: (files: File[]) => void;
    className?: string;
}

export function FileDropzone({ accept, multiple = false, maxSizeMb = 5, onChange, className }: FileDropzoneProps) {
    const inputRef = useRef<HTMLInputElement | null>(null);
    const [dragging, setDragging] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [files, setFiles] = useState<File[]>([]);

    const validate = (incoming: File[]) => {
        const over = incoming.find((f) => f.size > maxSizeMb * 1024 * 1024);
        if (over) {
            setError(`Ukuran file maksimal ${maxSizeMb}MB`);
            return false;
        }
        setError(null);
        return true;
    };

    const handleFiles = (incoming: File[]) => {
        if (!validate(incoming)) return;
        const next = multiple ? [...files, ...incoming] : incoming.slice(0, 1);
        setFiles(next);
        onChange(next);
    };

    const onDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragging(false);
        handleFiles(Array.from(e.dataTransfer.files));
    };

    return (
        <div className={cn("space-y-2", className)}>
            <div
                className={cn(
                    "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-4 py-6 text-center transition",
                    dragging ? "border-blue-400 bg-blue-50" : "border-slate-200 hover:border-slate-300"
                )}
                onClick={() => inputRef.current?.click()}
                onDragOver={(e) => {
                    e.preventDefault();
                    setDragging(true);
                }}
                onDragLeave={(e) => {
                    e.preventDefault();
                    setDragging(false);
                }}
                onDrop={onDrop}
            >
                <CloudUpload className="h-7 w-7 text-slate-500" />
                <p className="text-sm font-semibold text-slate-800">Tarik & lepas atau klik untuk pilih</p>
                <p className="text-xs text-slate-500">
                    {multiple ? "Bisa beberapa file" : "Satu file"} · Maks {maxSizeMb}MB
                </p>
                {accept && <p className="text-xs text-slate-400">Tipe: {accept}</p>}
                <input
                    ref={inputRef}
                    type="file"
                    accept={accept}
                    multiple={multiple}
                    className="hidden"
                    onChange={(e) => {
                        const incoming = e.target.files ? Array.from(e.target.files) : [];
                        handleFiles(incoming);
                    }}
                />
            </div>
            {error && <p className="text-xs text-red-600">{error}</p>}
            {files.length > 0 && (
                <div className="space-y-1 rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-700">
                    {files.map((file) => (
                        <div key={file.name + file.lastModified} className="flex items-center justify-between">
                            <span className="truncate">{file.name}</span>
                            <button
                                type="button"
                                className="text-slate-500 hover:text-red-600"
                                onClick={() => {
                                    const next = files.filter((f) => f !== file);
                                    setFiles(next);
                                    onChange(next);
                                }}
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
