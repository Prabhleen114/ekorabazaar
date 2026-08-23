import { NextResponse } from 'next/server';
import { requireSeller } from '@/lib/auth';
import { supabaseServer, isSupabaseConfigured } from '@/lib/supabase';
import crypto from 'crypto';

export async function POST(req: Request) {
  try {
    const session = await requireSeller();

    if (!isSupabaseConfigured) {
      return NextResponse.json({ error: "Image upload is not configured yet. Please contact the administrator." }, { status: 500 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // 1. Validate File Size (Max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "Image must be less than 5MB" }, { status: 400 });
    }

    // 2. Validate File Type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json({ error: "Only JPG, JPEG, PNG, and WEBP files are allowed." }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // Generate collision-safe path: product-images/{sellerId}/{timestamp}-{random}-{safeFilename}
    const safeFilename = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '');
    const timestamp = Date.now();
    const random = crypto.randomUUID().slice(0, 8);
    const filePath = `${session.sellerId}/${timestamp}-${random}-${safeFilename}`;

    // Upload to Supabase Storage
    const { data, error } = await supabaseServer
      .storage
      .from('product-images')
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: false
      });

    if (error) {
      console.error("Supabase Storage Error:", error);
      return NextResponse.json({ error: "Failed to upload image to storage." }, { status: 500 });
    }

    // Get public URL
    const { data: publicUrlData } = supabaseServer
      .storage
      .from('product-images')
      .getPublicUrl(filePath);

    return NextResponse.json({ 
      success: true, 
      url: publicUrlData.publicUrl 
    });
  } catch (error: any) {
    console.error("Seller Upload Image Error:", error);
    if (error.message.startsWith("FORBIDDEN") || error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
