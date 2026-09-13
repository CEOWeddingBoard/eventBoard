import { NextResponse } from "next/server";
import { validateUploadFile } from "@/lib/upload-validation";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Brak pliku" }, { status: 400 });
    }

    const validationError = validateUploadFile(file);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
      return NextResponse.json(
        {
          error:
            "Upload w produkcji wymaga konfiguracji storage (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_S3_BUCKET).",
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: "S3 upload nie jest jeszcze podłączony — plik przeszedł walidację." },
      { status: 501 }
    );
  } catch {
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
