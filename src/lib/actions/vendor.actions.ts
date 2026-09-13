"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import {
  createVendorSchema,
  updateVendorSchema,
  type VendorInput,
  type VendorUpdateInput,
} from "@/lib/validations/vendor";
import { validate } from "@/lib/validations/validation-utils";
import { sanitizeStrings } from "@/lib/validations/sanitize";
import { unlink } from "fs/promises";
import { join } from "path";
import { randomBytes } from "crypto";

function generateVendorPortalToken(): string {
  return randomBytes(16).toString("hex");
}

export async function createVendor(data: VendorInput) {
  const validatedData = validate(createVendorSchema, data, { action: "create_vendor" });

  const newVendor = await prisma.vendor.create({
    data: {
      ...sanitizeStrings(validatedData),
      portalToken: generateVendorPortalToken(),
    },
  });

  revalidatePath("/pl/vendors");
  revalidatePath("/en/vendors");
  return newVendor;
}

export async function updateVendor(id: string, data: VendorUpdateInput) {
  const validatedData = validate(updateVendorSchema, { ...data, id }, { action: "update_vendor" });

  // Remove id from data before updating
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { id: _unused, ...updateData } = validatedData;

  const updatedVendor = await prisma.vendor.update({
    where: { id },
    data: sanitizeStrings(updateData),
  });

  revalidatePath("/pl/vendors");
  revalidatePath("/en/vendors");
  return updatedVendor;
}

export async function deleteVendor(id: string) {
  await prisma.vendor.delete({ where: { id } });
  revalidatePath("/pl/vendors");
  revalidatePath("/en/vendors");
}

// Vendor Document actions
export async function getVendorDocuments(vendorId: string) {
  return await prisma.vendorDocument.findMany({
    where: { vendorId },
    orderBy: { createdAt: "desc" },
  });
}

export async function deleteVendorDocument(id: string) {
  const document = await prisma.vendorDocument.findUnique({
    where: { id },
  });

  if (!document) {
    throw new Error("Document not found");
  }

  // Delete file from filesystem
  try {
    const filePath = join(process.cwd(), "public", document.fileUrl);
    await unlink(filePath);
  } catch (error) {
    console.warn("Failed to delete file from filesystem:", error);
  }

  // Delete database record
  await prisma.vendorDocument.delete({
    where: { id },
  });

  revalidatePath("/pl/vendors");
  revalidatePath("/en/vendors");
}

export async function uploadVendorDocument(formData: FormData) {
  "use server";

  try {
    const file = formData.get("file") as File;
    const vendorId = formData.get("vendorId") as string;
    const type = formData.get("type") as string;
    const weddingId = formData.get("weddingId") as string;

    if (!file || !vendorId || !type || !weddingId) {
      throw new Error("Missing required fields");
    }

    // Validate file type
    const ALLOWED_TYPES = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ];

    if (!ALLOWED_TYPES.includes(file.type)) {
      throw new Error(
        "Invalid file type. Only PDF, DOC, DOCX, XLS, XLSX are allowed.",
      );
    }

    // Validate file size (10MB)
    const MAX_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      throw new Error("File too large. Maximum size is 10MB.");
    }

    // Verify vendor exists
    const vendor = await prisma.vendor.findUnique({
      where: { id: vendorId },
    });

    if (!vendor) {
      throw new Error("Vendor not found");
    }

    // Create uploads directory if it doesn't exist
    const { writeFile, mkdir } = await import("fs/promises");
    const { join: joinPath } = await import("path");

    const uploadsDir = joinPath(process.cwd(), "public", "uploads", "vendor-documents");
    try {
      await mkdir(uploadsDir, { recursive: true });
    } catch {
      // Directory might already exist, ignore error
    }

    // Generate unique filename
    const timestamp = Date.now();
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const fileName = `${timestamp}_${sanitizedName}`;
    const filePath = joinPath(uploadsDir, fileName);

    // Save file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // Create database record
    const document = await prisma.vendorDocument.create({
      data: {
        name: file.name,
        type,
        fileName,
        fileUrl: `/uploads/vendor-documents/${fileName}`,
        fileSize: file.size,
        mimeType: file.type,
        vendorId,
        weddingId: vendor.weddingId,
        eventId: vendor.eventId,
      },
    });

    revalidatePath("/pl/vendors");
    revalidatePath("/en/vendors");

    return { success: true, document };
  } catch (error) {
    console.error("Upload error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Upload failed",
    };
  }
}

