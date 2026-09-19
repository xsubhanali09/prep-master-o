import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, Number(searchParams.get("page") || "1"));
    const baseUrl = process.env.BATCH_API_URL || "https://pwthor.live/api/AllBatches";
    const url = `${baseUrl}?page=${page}`;

    const response = await fetch(url, {
      method: "GET",
      cache: "no-store",
      headers: { Accept: "application/json" },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Batch API returned ${response.status}` },
        { status: response.status }
      );
    }

    const result = await response.json();
    const data = Array.isArray(result.data) ? result.data : [];

    const batches = data.map((item) => ({
      id: item.batchId || item._id || item.id,
      name: item.batchName || item.name || "Unnamed Batch",
      image: item.batchImage || item.image || "",
      language: item.language || "All Languages",
      price: item.batchPrice ?? item.price ?? "Free",
      startDate: item.startDate || "",
      endDate: item.endDate || "",
      isExternal: item.isExternal ?? false,
    }));

    return NextResponse.json({
      data: batches,
      page,
      totalPages: Number(result.totalPages || page),
      totalItems: Number(result.totalItems || batches.length),
    });
  } catch (error) {
    console.error("Batch API error:", error);
    return NextResponse.json(
      { error: "Unable to fetch batches." },
      { status: 502 }
    );
  }
}
