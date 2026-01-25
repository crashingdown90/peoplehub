// @ai:cx - Global loading state with skeleton animation

export default function GlobalLoading() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-[var(--color-bg)]">
            <div className="flex flex-col items-center gap-4">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-[var(--color-accent)] border-t-transparent" />
                <p className="text-sm text-[var(--color-text-subtle)]">Memuat...</p>
            </div>
        </div>
    );
}
