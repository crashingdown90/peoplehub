/**
 * Validation Schemas for Attendance Clock-in
 * Using Zod for runtime validation
 */

import { z } from 'zod';

/**
 * Work mode enum
 */
export const WorkModeEnum = z.enum(['WFO', 'WFH']);


/**
 * Clock-in request schema
 */
export const ClockInRequestSchema = z.object({
    workMode: WorkModeEnum,

    // GPS coordinates (required for WFO)
    latitude: z.number()
        .min(-90, 'Latitude harus antara -90 dan 90')
        .max(90, 'Latitude harus antara -90 dan 90')
        .optional()
        .nullable(),

    longitude: z.number()
        .min(-180, 'Longitude harus antara -180 dan 180')
        .max(180, 'Longitude harus antara -180 dan 180')
        .optional()
        .nullable(),

    gpsAccuracy: z.number()
        .min(0)
        .optional()
        .nullable(),

    // Face detection results
    faceDetected: z.boolean(),

    faceConfidence: z.number()
        .min(0, 'Face confidence harus antara 0 dan 1')
        .max(1, 'Face confidence harus antara 0 dan 1'),

    // Liveness detection results
    livenessScore: z.number()
        .min(0, 'Liveness score harus antara 0 dan 1')
        .max(1, 'Liveness score harus antara 0 dan 1'),

    // Optional metadata
    deviceInfo: z.string()
        .max(500, 'Device info maksimal 500 karakter')
        .optional()
        .nullable(),
})
    .refine(
        (data) => {
            // If WFO, GPS coordinates are required
            if (data.workMode === 'WFO') {
                return data.latitude !== null && data.latitude !== undefined &&
                    data.longitude !== null && data.longitude !== undefined;
            }
            return true;
        },
        {
            message: 'Lokasi GPS diperlukan untuk mode WFO',
            path: ['latitude'],
        }
    );

export type ClockInRequest = z.infer<typeof ClockInRequestSchema>;

/**
 * Face detection validation schema
 */
export const FaceDetectionSchema = z.object({
    faceDetected: z.literal(true),
    faceConfidence: z.number()
        .min(0.70, 'Confidence wajah kurang dari 70%'),
});

/**
 * Liveness validation schema
 */
export const LivenessValidationSchema = z.object({
    livenessScore: z.number()
        .min(0.80, 'Liveness score kurang dari 80%'),
});
