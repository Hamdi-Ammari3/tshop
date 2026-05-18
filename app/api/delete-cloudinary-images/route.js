import { v2 as cloudinary } from "cloudinary";
import { NextResponse } from "next/server";

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

function extractPublicId(url) {

  try {

    const afterUpload =
      url.split("/upload/")[1];

    if (!afterUpload) {
      return null;
    }

    const parts =
      afterUpload.split("/");

    const versionIndex =
      parts.findIndex((part) =>
        /^v\d+$/.test(part)
      );

    if (versionIndex === -1) {
      return null;
    }

    const publicIdWithExtension =
      parts
        .slice(versionIndex + 1)
        .join("/");

    const publicId =
      publicIdWithExtension.replace(
        /\.[^/.]+$/,
        ""
      );

    console.log(
      "publicId:",
      publicId
    );

    return publicId;

  } catch (error) {

    console.log(error);

    return null;
  }
}

export async function POST(req) {

  try {

    const body = await req.json();

    const { images } = body;

    if (
      !images ||
      !Array.isArray(images)
    ) {

      return NextResponse.json(
        {
          error: "Images invalides",
        },
        {
          status: 400,
        }
      );
    }

    const publicIds =
      images
        .map(extractPublicId)
        .filter(Boolean);

    if (publicIds.length === 0) {

      return NextResponse.json({
        success: true,
      });

    }

    await cloudinary.api.delete_resources(
      publicIds
    );

    return NextResponse.json({
      success: true,
    });

  } catch (error) {

    console.log(
      "DELETE CLOUDINARY ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Erreur suppression images",
      },
      {
        status: 500,
      }
    );
  }
}