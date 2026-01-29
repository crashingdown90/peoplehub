"use client";

// @ai:cx - User avatar with name/role

import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface UserAvatarProps {
    name: string;
    role?: string;
    avatar?: string;
    size?: "sm" | "md" | "lg";
}

const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-12 w-12",
};

export function UserAvatar({ name, role, avatar, size = "md" }: UserAvatarProps) {
    const initials = name
        .split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase();

    return (
        <div className="flex items-center gap-2">
            <Avatar className={cn(sizeClasses[size])}>
                {avatar && <AvatarImage src={avatar} alt={name} />}
                <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div className="text-sm leading-tight text-slate-800">
                <p className="font-semibold">{name}</p>
                {role && <p className="text-xs text-slate-500">{role}</p>}
            </div>
        </div>
    );
}
