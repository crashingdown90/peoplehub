import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { RoleSidebar } from "@/components/ui/sidebar";

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await getSession();

    if (!session) {
        redirect("/login");
    }

    return (
        <div className="min-h-screen bg-[var(--color-bg)]">
            {/* Skip to content link for accessibility */}
            <a
                href="#main-content"
                className="sr-only focus:not-sr-only focus:absolute focus:z-[9999] focus:top-4 focus:left-4 focus:px-4 focus:py-2 focus:bg-[var(--color-accent)] focus:text-white focus:rounded-lg focus:outline-none"
            >
                Langsung ke konten utama
            </a>

            <RoleSidebar role={session.role} />
            <main id="main-content" className="md:ml-64" tabIndex={-1}>
                {children}
            </main>
        </div>
    );
}

