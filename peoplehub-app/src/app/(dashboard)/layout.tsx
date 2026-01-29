import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { DashboardLayout } from "@/components/layout";

export default async function DashboardLayoutWrapper({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await getSession();

    if (!session) {
        redirect("/login");
    }

    return (
        <DashboardLayout>
            {children}
        </DashboardLayout>
    );
}

