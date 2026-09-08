"use server";

import { createClient } from "@/lib/supabase/server";

// ─── Upload Item Image ──────────────────────────────────────
export async function uploadItemImage(
  formData: FormData
): Promise<{ url: string | null; error: string | null }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { url: null, error: "Not authenticated" };
  }

  const file = formData.get("file") as File;

  if (!file) {
    return { url: null, error: "No file provided" };
  }

  // Validate file type
  const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  if (!allowedTypes.includes(file.type)) {
    return {
      url: null,
      error: "Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.",
    };
  }

  // Validate file size (max 5MB)
  const maxSize = 5 * 1024 * 1024;
  if (file.size > maxSize) {
    return { url: null, error: "File size must be under 5MB." };
  }

  // Convert file to Buffer & base64 Data URL as reliable fallback
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const base64Data = buffer.toString("base64");
  const dataUrl = `data:${file.type || "image/jpeg"};base64,${base64Data}`;

  try {
    const fileExt = file.name.split(".").pop() || "jpg";
    const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("item-images")
      .upload(fileName, buffer, {
        contentType: file.type,
        cacheControl: "3600",
        upsert: false,
      });

    if (!uploadError) {
      const {
        data: { publicUrl },
      } = supabase.storage.from("item-images").getPublicUrl(fileName);

      if (publicUrl) {
        return { url: publicUrl, error: null };
      }
    }
  } catch (storageErr) {
    console.warn("Supabase Storage bucket upload failed, using Data URL fallback:", storageErr);
  }

  // Fallback to Data URL if Supabase bucket doesn't exist or permissions fail
  return { url: dataUrl, error: null };
}

// ─── Delete Item Image ──────────────────────────────────────
export async function deleteItemImage(
  imageUrl: string
): Promise<{ success: boolean; error: string | null }> {
  if (imageUrl.startsWith("data:")) {
    return { success: true, error: null };
  }

  const supabase = await createClient();

  try {
    const url = new URL(imageUrl);
    const pathParts = url.pathname.split("/storage/v1/object/public/item-images/");
    const filePath = pathParts[1];

    if (!filePath) {
      return { success: false, error: "Invalid image URL." };
    }

    const { error } = await supabase.storage
      .from("item-images")
      .remove([filePath]);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, error: null };
  } catch {
    return { success: true, error: null };
  }
}
