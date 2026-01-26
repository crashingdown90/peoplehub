// @ai:cl - Profile API with local file storage
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getRequestContext } from "@/lib/request-context";
import { saveProfilePhoto, deleteFile } from "@/lib/upload";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png"];

// GET /api/employees/profile - Get current user profile with photo
export async function GET() {
    try {
        const context = await getRequestContext();

        if (!context) {
            return NextResponse.json(
                { success: false, error: { code: "UNAUTHORIZED", message: "Authentication required" } },
                { status: 401 }
            );
        }

        const user = await prisma.user.findUnique({
            where: { id: context.userId },
            select: {
                id: true,
                email: true,
                phone: true,
                fullName: true,
                photoUrl: true,
                address: true,
                nik: true,
                npwp: true,
                bankName: true,
                bankAccountNumber: true,
                bankAccountHolder: true,
                emergencyContactName: true,
                emergencyContactPhone: true,
            },
        });

        if (!user) {
            return NextResponse.json(
                { success: false, error: { code: "NOT_FOUND", message: "User not found" } },
                { status: 404 }
            );
        }

        return NextResponse.json({ success: true, data: user });
    } catch (error) {
        console.error("Get profile error:", error);
        return NextResponse.json(
            { success: false, error: { code: "INTERNAL_ERROR", message: "Server error" } },
            { status: 500 }
        );
    }
}

// PATCH /api/employees/profile - Update profile including photo
export async function PATCH(request: NextRequest) {
    try {
        const context = await getRequestContext();

        if (!context) {
            return NextResponse.json(
                { success: false, error: { code: "UNAUTHORIZED", message: "Authentication required" } },
                { status: 401 }
            );
        }

        const contentType = request.headers.get("content-type") || "";

        let updateData: Record<string, string | null> = {};
        let oldPhotoUrl: string | null = null;

        // Get current photo URL to delete later if updated
        const currentUser = await prisma.user.findUnique({
            where: { id: context.userId },
            select: { photoUrl: true },
        });
        oldPhotoUrl = currentUser?.photoUrl || null;

        if (contentType.includes("multipart/form-data")) {
            // Handle file upload via FormData
            const formData = await request.formData();
            const photo = formData.get("photo") as File | null;

            if (photo) {
                // Validate file type
                if (!ALLOWED_TYPES.includes(photo.type)) {
                    return NextResponse.json(
                        { success: false, error: { code: "INVALID_FILE_TYPE", message: "Format file harus JPG atau PNG" } },
                        { status: 400 }
                    );
                }

                // Validate file size
                if (photo.size > MAX_FILE_SIZE) {
                    return NextResponse.json(
                        { success: false, error: { code: "FILE_TOO_LARGE", message: "Ukuran file maksimal 5MB" } },
                        { status: 400 }
                    );
                }

                // Convert to buffer and save locally
                const arrayBuffer = await photo.arrayBuffer();
                const buffer = Buffer.from(arrayBuffer);
                const extension = photo.type.split("/")[1];

                const uploadResult = await saveProfilePhoto(
                    buffer,
                    context.tenantId,
                    context.userId,
                    extension
                );

                if (!uploadResult.success) {
                    return NextResponse.json(
                        { success: false, error: { code: "UPLOAD_FAILED", message: uploadResult.error || "Gagal upload foto" } },
                        { status: 500 }
                    );
                }

                updateData.photoUrl = uploadResult.url!;
            }

            // Get other form fields
            const phone = formData.get("phone") as string | null;
            const address = formData.get("address") as string | null;
            const emergencyContactName = formData.get("emergencyContactName") as string | null;
            const emergencyContactPhone = formData.get("emergencyContactPhone") as string | null;

            if (phone !== null) updateData.phone = phone;
            if (address !== null) updateData.address = address;
            if (emergencyContactName !== null) updateData.emergencyContactName = emergencyContactName;
            if (emergencyContactPhone !== null) updateData.emergencyContactPhone = emergencyContactPhone;
        } else {
            // Handle JSON body
            const body = await request.json();

            // Only allow updating certain fields
            const allowedFields = ["phone", "address", "emergencyContactName", "emergencyContactPhone"];
            for (const field of allowedFields) {
                if (body[field] !== undefined) {
                    updateData[field] = body[field];
                }
            }

            // Handle base64 photo upload
            if (body.photoBase64) {
                const base64Data = body.photoBase64;
                const matches = base64Data.match(/^data:image\/(jpeg|jpg|png);base64,(.+)$/);

                if (!matches) {
                    return NextResponse.json(
                        { success: false, error: { code: "INVALID_FILE_TYPE", message: "Format file harus JPG atau PNG" } },
                        { status: 400 }
                    );
                }

                const extension = matches[1];
                const base64Content = matches[2];
                const buffer = Buffer.from(base64Content, "base64");

                // Check size
                if (buffer.length > MAX_FILE_SIZE) {
                    return NextResponse.json(
                        { success: false, error: { code: "FILE_TOO_LARGE", message: "Ukuran file maksimal 5MB" } },
                        { status: 400 }
                    );
                }

                // Save locally
                const uploadResult = await saveProfilePhoto(
                    buffer,
                    context.tenantId,
                    context.userId,
                    extension
                );

                if (!uploadResult.success) {
                    return NextResponse.json(
                        { success: false, error: { code: "UPLOAD_FAILED", message: uploadResult.error || "Gagal upload foto" } },
                        { status: 500 }
                    );
                }

                updateData.photoUrl = uploadResult.url!;
            }
        }

        if (Object.keys(updateData).length === 0) {
            return NextResponse.json(
                { success: false, error: { code: "NO_DATA", message: "Tidak ada data yang diupdate" } },
                { status: 400 }
            );
        }

        // Update user
        const updatedUser = await prisma.user.update({
            where: { id: context.userId },
            data: updateData,
            select: {
                id: true,
                email: true,
                phone: true,
                fullName: true,
                photoUrl: true,
                address: true,
                emergencyContactName: true,
                emergencyContactPhone: true,
            },
        });

        // Delete old photo if new one was uploaded
        if (updateData.photoUrl && oldPhotoUrl && oldPhotoUrl.startsWith("/uploads/")) {
            await deleteFile(oldPhotoUrl);
        }

        // Log audit
        await prisma.auditLog.create({
            data: {
                tenantId: context.tenantId,
                actorId: context.userId,
                action: "PROFILE_UPDATED",
                objectType: "User",
                objectId: context.userId,
            },
        });

        return NextResponse.json({
            success: true,
            message: "Profil berhasil diupdate",
            data: updatedUser,
        });
    } catch (error) {
        console.error("Update profile error:", error);
        return NextResponse.json(
            { success: false, error: { code: "INTERNAL_ERROR", message: "Server error" } },
            { status: 500 }
        );
    }
}
