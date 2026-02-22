import { createUploadthing, type FileRouter } from "uploadthing/next";
import { z } from "zod";
import { getSessionActor } from "@/lib/authz";
import { Role } from "@prisma/client";
import { db } from "@/lib/db";
import { recordAuditEvent } from "@/lib/audit";

const f = createUploadthing();

export const ourFileRouter = {
  patientPlanUploader: f({
    pdf: { maxFileSize: "8MB", maxFileCount: 3 },
    image: { maxFileSize: "8MB", maxFileCount: 3 },
  })
    .input(
      z.object({
        patientId: z.string(),
        appointmentId: z.string().optional(),
      }),
    )
    .middleware(async ({ input }) => {
      const actor = await getSessionActor();

      if (actor.role !== Role.DOCTOR && actor.role !== Role.MANAGER) {
        throw new Error("Forbidden");
      }

      const patient = await db.patient.findFirst({
        where: { id: input.patientId, orgId: actor.orgId },
      });

      if (!patient) {
        throw new Error("Patient not found");
      }

      if (input.appointmentId) {
        const appointment = await db.appointment.findFirst({
          where: {
            id: input.appointmentId,
            orgId: actor.orgId,
            patientId: input.patientId,
          },
        });

        if (!appointment) {
          throw new Error("Appointment not found for patient");
        }
      }

      return { actor, input };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      const actor = metadata.actor;
      const patientId = metadata.input.patientId;
      const appointmentId = metadata.input.appointmentId;

      const asset = await db.uploadedAsset.create({
        data: {
          orgId: actor.orgId,
          patientId,
          appointmentId,
          uploadedById: actor.id,
          kind: "plan",
          fileKey: file.key,
          fileName: file.name,
          fileUrl: file.ufsUrl,
          fileSize: file.size,
        },
      });

      await recordAuditEvent({
        orgId: actor.orgId,
        actorId: actor.id,
        action: "asset.upload",
        entityType: "uploaded_asset",
        entityId: asset.id,
        afterJson: asset,
      });

      return { uploadedAssetId: asset.id };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
