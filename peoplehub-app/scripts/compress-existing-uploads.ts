// Script to compress existing uploaded images
// Run with: npx ts-node scripts/compress-existing-uploads.ts

import sharp from "sharp";
import { readdirSync, statSync, existsSync, mkdirSync, renameSync, unlinkSync } from "fs";
import { join, extname, basename, dirname } from "path";

const UPLOAD_DIR = process.env.UPLOAD_DIR || "./public/uploads";
const BACKUP_DIR = "./public/uploads_backup";

// Compression settings
const COMPRESSION_CONFIG = {
    profiles: { maxWidth: 800, maxHeight: 800, quality: 80 },
    receipts: { maxWidth: 1600, maxHeight: 1600, quality: 85 },
    ktp: { maxWidth: 1200, maxHeight: 800, quality: 85 },
    default: { maxWidth: 1600, maxHeight: 1600, quality: 85 },
};

interface CompressionResult {
    file: string;
    originalSize: number;
    compressedSize: number;
    savings: number;
    savingsPercent: number;
    skipped?: boolean;
    error?: string;
}

const results: CompressionResult[] = [];
let totalOriginalSize = 0;
let totalCompressedSize = 0;

async function compressImage(
    filePath: string,
    config: { maxWidth: number; maxHeight: number; quality: number }
): Promise<Buffer> {
    const { maxWidth, maxHeight, quality } = config;

    const image = sharp(filePath);
    const metadata = await image.metadata();

    const needsResize =
        (metadata.width && metadata.width > maxWidth) ||
        (metadata.height && metadata.height > maxHeight);

    let processed = image;

    if (needsResize) {
        processed = processed.resize(maxWidth, maxHeight, {
            fit: "inside",
            withoutEnlargement: true,
        });
    }

    return processed
        .jpeg({
            quality,
            mozjpeg: true,
        })
        .toBuffer();
}

function getConfigForPath(filePath: string) {
    if (filePath.includes("/profiles/")) return COMPRESSION_CONFIG.profiles;
    if (filePath.includes("/receipts/")) return COMPRESSION_CONFIG.receipts;
    if (filePath.includes("/ktp/")) return COMPRESSION_CONFIG.ktp;
    return COMPRESSION_CONFIG.default;
}

async function processFile(filePath: string): Promise<CompressionResult> {
    const ext = extname(filePath).toLowerCase();
    const originalSize = statSync(filePath).size;

    // Skip non-image files
    if (![".jpg", ".jpeg", ".png", ".webp"].includes(ext)) {
        return {
            file: filePath,
            originalSize,
            compressedSize: originalSize,
            savings: 0,
            savingsPercent: 0,
            skipped: true,
        };
    }

    // Skip already small files (< 100KB)
    if (originalSize < 100 * 1024) {
        return {
            file: filePath,
            originalSize,
            compressedSize: originalSize,
            savings: 0,
            savingsPercent: 0,
            skipped: true,
        };
    }

    try {
        const config = getConfigForPath(filePath);
        const compressedBuffer = await compressImage(filePath, config);
        const compressedSize = compressedBuffer.length;

        // Only replace if we actually saved space (at least 10%)
        if (compressedSize < originalSize * 0.9) {
            // Backup original (optional)
            const backupPath = filePath.replace(UPLOAD_DIR, BACKUP_DIR);
            const backupDir = dirname(backupPath);
            if (!existsSync(backupDir)) {
                mkdirSync(backupDir, { recursive: true });
            }
            renameSync(filePath, backupPath);

            // Write compressed file (as .jpeg)
            const newPath = filePath.replace(ext, ".jpeg");
            await sharp(compressedBuffer).toFile(newPath);

            // If original wasn't jpeg, we created a new file - old backup is our only copy
            if (ext !== ".jpeg" && ext !== ".jpg" && existsSync(filePath)) {
                // Original file still exists (shouldn't happen but just in case)
            }

            const savings = originalSize - compressedSize;
            const savingsPercent = Math.round((savings / originalSize) * 100);

            return {
                file: filePath,
                originalSize,
                compressedSize,
                savings,
                savingsPercent,
            };
        } else {
            return {
                file: filePath,
                originalSize,
                compressedSize: originalSize,
                savings: 0,
                savingsPercent: 0,
                skipped: true,
            };
        }
    } catch (error) {
        return {
            file: filePath,
            originalSize,
            compressedSize: originalSize,
            savings: 0,
            savingsPercent: 0,
            error: String(error),
        };
    }
}

function getAllFiles(dir: string): string[] {
    const files: string[] = [];

    if (!existsSync(dir)) {
        console.log(`Directory ${dir} does not exist`);
        return files;
    }

    const items = readdirSync(dir);

    for (const item of items) {
        const fullPath = join(dir, item);
        const stat = statSync(fullPath);

        if (stat.isDirectory()) {
            files.push(...getAllFiles(fullPath));
        } else {
            files.push(fullPath);
        }
    }

    return files;
}

async function main() {
    console.log("=".repeat(60));
    console.log("Compress Existing Uploads Script");
    console.log("=".repeat(60));
    console.log(`Upload directory: ${UPLOAD_DIR}`);
    console.log(`Backup directory: ${BACKUP_DIR}`);
    console.log("");

    const files = getAllFiles(UPLOAD_DIR);
    const imageFiles = files.filter((f) => {
        const ext = extname(f).toLowerCase();
        return [".jpg", ".jpeg", ".png", ".webp"].includes(ext);
    });

    console.log(`Found ${imageFiles.length} image files to process`);
    console.log("");

    for (let i = 0; i < imageFiles.length; i++) {
        const file = imageFiles[i];
        console.log(`[${i + 1}/${imageFiles.length}] Processing: ${basename(file)}`);

        const result = await processFile(file);
        results.push(result);

        totalOriginalSize += result.originalSize;
        totalCompressedSize += result.compressedSize;

        if (result.error) {
            console.log(`  ❌ Error: ${result.error}`);
        } else if (result.skipped) {
            console.log(`  ⏭️  Skipped (already small or not image)`);
        } else {
            console.log(
                `  ✅ Compressed: ${formatBytes(result.originalSize)} → ${formatBytes(result.compressedSize)} (${result.savingsPercent}% saved)`
            );
        }
    }

    // Summary
    console.log("");
    console.log("=".repeat(60));
    console.log("SUMMARY");
    console.log("=".repeat(60));
    console.log(`Total files processed: ${results.length}`);
    console.log(`Files compressed: ${results.filter((r) => !r.skipped && !r.error).length}`);
    console.log(`Files skipped: ${results.filter((r) => r.skipped).length}`);
    console.log(`Files with errors: ${results.filter((r) => r.error).length}`);
    console.log("");
    console.log(`Total original size: ${formatBytes(totalOriginalSize)}`);
    console.log(`Total compressed size: ${formatBytes(totalCompressedSize)}`);
    console.log(`Total savings: ${formatBytes(totalOriginalSize - totalCompressedSize)}`);
    console.log(
        `Overall reduction: ${Math.round(((totalOriginalSize - totalCompressedSize) / totalOriginalSize) * 100)}%`
    );
    console.log("");
    console.log(`Backup files saved to: ${BACKUP_DIR}`);
    console.log("You can delete the backup folder after verifying the compressed images work correctly.");
}

function formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

main().catch(console.error);
