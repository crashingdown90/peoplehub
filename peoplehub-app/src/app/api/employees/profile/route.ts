// @ai:cl - Profile API with local file storage
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getRequestContext } from "@/lib/request-context";
import { saveProfilePhoto, deleteFile } from "@/lib/upload";
import { handlePrismaError } from "@/lib/api-utils";

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
        return handlePrismaError(error);
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
            const fullName = formData.get("fullName") as string | null;
            const phone = formData.get("phone") as string | null;
            const address = formData.get("address") as string | null;
            const emergencyContactName = formData.get("emergencyContactName") as string | null;
            const emergencyContactPhone = formData.get("emergencyContactPhone") as string | null;

            if (fullName !== null) {
                const trimmed = fullName.trim();
                if (trimmed.length < 3) {
                    return NextResponse.json(
                        { success: false, error: { code: "VALIDATION_ERROR", message: "Nama lengkap minimal 3 karakter" } },
                        { status: 400 }
                    );
                }
                updateData.fullName = trimmed;
            }
            if (phone !== null) updateData.phone = phone;
            if (address !== null) updateData.address = address;
            if (emergencyContactName !== null) updateData.emergencyContactName = emergencyContactName;
            if (emergencyContactPhone !== null) updateData.emergencyContactPhone = emergencyContactPhone;
        } else {
            // Handle JSON body
            const body = await request.json();

            // Only allow updating certain fields
            const allowedFields = ["fullName", "phone", "address", "emergencyContactName", "emergencyContactPhone"];
            for (const field of allowedFields) {
                if (body[field] !== undefined) {
                    if (field === "fullName") {
                        const trimmed = String(body[field]).trim();
                        if (trimmed.length < 3) {
                            return NextResponse.json(
                                { success: false, error: { code: "VALIDATION_ERROR", message: "Nama lengkap minimal 3 karakter" } },
                                { status: 400 }
                            );
                        }
                        updateData[field] = trimmed;
                        continue;
                    }
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

        // Separate user fields from employee fields
        const userFields = ["photoUrl", "fullName"];
        const employeeFields = ["fullName", "phone", "address", "emergencyContactName", "emergencyContactPhone"];

        const userUpdateData: Record<string, string | null> = {};
        const employeeUpdateData: Record<string, string | null> = {};

        for (const [key, value] of Object.entries(updateData)) {
            if (key === "fullName") {
                userUpdateData[key] = value;
                employeeUpdateData[key] = value;
                continue;
            }
            if (userFields.includes(key)) {
                userUpdateData[key] = value;
            } else if (employeeFields.includes(key)) {
                employeeUpdateData[key] = value;
            }
        }

        // Update user if there are user fields
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let updatedUser: Record<string, any> | null = null;
        if (Object.keys(userUpdateData).length > 0) {
            updatedUser = await prisma.user.update({
                where: { id: context.userId },
                data: userUpdateData,
                select: {
                    id: true,
                    email: true,
                    fullName: true,
                    photoUrl: true,
                },
            });
        }

        // Update employee if there are employee fields
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let updatedEmployee: Record<string, any> | null = null;
        if (Object.keys(employeeUpdateData).length > 0 && context.employeeId) {
            updatedEmployee = await prisma.employee.update({
                where: { id: context.employeeId },
                data: employeeUpdateData,
                select: {
                    id: true,
                    phone: true,
                    address: true,
                    fullName: true,
                    emergencyContactName: true,
                    emergencyContactPhone: true,
                },
            });
        }

        // Delete old photo if new one was uploaded
        if (userUpdateData.photoUrl && oldPhotoUrl && oldPhotoUrl.startsWith("/uploads/")) {
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
            data: {
                ...updatedUser,
                ...updatedEmployee,
            },
        });
    } catch (error) {
        console.error("Update profile error:", error);
        return handlePrismaError(error);
    }
}
