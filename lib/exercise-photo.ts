import { createClient } from "@/lib/supabase/client";

const MEDIA_BUCKET = "movelib-media";
const MAX_PHOTO_SIZE = 5 * 1024 * 1024;

const ALLOWED_PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"];

export function validateExercisePhoto(file: File) {
  if (!ALLOWED_PHOTO_TYPES.includes(file.type)) {
    return "La foto deve essere JPG, PNG o WebP.";
  }

  if (file.size > MAX_PHOTO_SIZE) {
    return "La foto non può superare 5 MB.";
  }

  return null;
}

function getFileExtension(file: File) {
  switch (file.type) {
    case "image/jpeg":
      return "jpg";
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    default:
      throw new Error("Formato immagine non supportato.");
  }
}

export async function uploadExercisePhoto(exerciseId: string, file: File) {
  const validationError = validateExercisePhoto(file);

  if (validationError) {
    throw new Error(validationError);
  }

  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Utente non autenticato.");
  }

  const extension = getFileExtension(file);

  const storagePath = `media/${user.id}/${crypto.randomUUID()}.${extension}`;

  const { error: uploadError } = await supabase.storage
    .from(MEDIA_BUCKET)
    .upload(storagePath, file, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    throw uploadError;
  }

  const { error: mediaError } = await supabase.from("exercise_media").insert({
    exercise_id: exerciseId,
    media_type: "PHOTO",
    storage_path: storagePath,
    uploaded_by: user.id,
  });

  if (mediaError) {
    await supabase.storage.from(MEDIA_BUCKET).remove([storagePath]);

    throw mediaError;
  }
}
