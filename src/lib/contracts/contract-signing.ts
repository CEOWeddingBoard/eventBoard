"use server";

import crypto from "crypto";
import { prisma } from "@/lib/prisma";

export async function generateContractSigningToken(contractId: string): Promise<string> {
  const token = crypto.randomBytes(32).toString("hex");
  const hash = crypto.createHash("sha256").update(token).digest("hex");

  await prisma.contract.update({
    where: { id: contractId },
    data: {
      signingTokenHash: hash,
      signingTokenExp: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });

  return token;
}

export async function verifyContractSigningToken(
  token: string,
): Promise<{
  valid: boolean;
  contractId?: string;
  reservationId?: string;
  error?: string;
}> {
  const hash = crypto.createHash("sha256").update(token).digest("hex");

  const contract = await prisma.contract.findFirst({
    where: { signingTokenHash: hash },
    select: {
      id: true,
      reservationId: true,
      signingTokenExp: true,
      status: true,
    },
  });

  if (!contract) {
    return { valid: false, error: "Nieprawidłowy link do podpisu." };
  }

  if (contract.signingTokenExp && contract.signingTokenExp < new Date()) {
    return { valid: false, error: "Link do podpisu wygasł." };
  }

  if (contract.status === "SIGNED_BOTH" || contract.status === "SIGNED_BY_COUPLE") {
    return { valid: false, error: "Umowa została już podpisana." };
  }

  if (contract.status === "REJECTED") {
    return { valid: false, error: "Umowa została odrzucona." };
  }

  return {
    valid: true,
    contractId: contract.id,
    reservationId: contract.reservationId,
  };
}
