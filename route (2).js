import { NextResponse } from "next/server";

function text(value, fallback = "") {
  if (typeof value === "string") return value.trim() || fallback;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return fallback;
}

function imageUrl(value) {
  const valueText = text(value, "");
  return valueText;
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const rawPage = Number(searchParams.get("page") || "1");
    const page = Number.isFinite(rawPage) ? Math.max(1, Math.floor(rawPage)) : 1;

    const baseUrl =
      process.env.BATCH_API_URL || "https://pwthor.live/api/AllBatches";

    const apiUrl = new URL(baseUrl);
    apiUrl.searchParams.set("page", String(page));

    const response = await fetch(apiUrl.toString(), {
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

    const rawData = Array.isArray(result?.data)
      ? result.data
      : Array.isArray(result?.batches)
        ? result.batches
        : [];

    const batches = rawData
      .filter((item) => item && typeof item === "object")
      .map((item, index) => {
        const rawId = item.batchId ?? item._id ?? item.id;

        return {
          id: text(rawId, `external-${page}-${index}`),
          name: text(item.batchName ?? item.name, "Unnamed Batch"),
          image: imageUrl(item.batchImage ?? item.image),
          language: text(item.language, "All Languages"),
          price: text(item.batchPrice ?? item.price, "Free"),
          description: text(item.description, ""),
          teacher: text(item.teacher, ""),
          startDate: text(item.startDate, ""),
          endDate: text(item.endDate, ""),
          isExternal: Boolean(item.isExternal),
          subjects: Array.isArray(item.subjects)
            ? item.subjects.map((subject) => text(subject)).filter(Boolean)
            : [],
          content: Array.isArray(item.content) ? item.content : [],
        };
      });

    const rawTotalPages =
      result?.totalPages ??
      result?.pagination?.totalPages ??
      result?.meta?.totalPages ??
      page;

    const rawTotalItems =
      result?.totalItems ??
      result?.pagination?.totalItems ??
      result?.meta?.totalItems ??
      batches.length;

    const totalPages = Number(rawTotalPages);
    const totalItems = Number(rawTotalItems);

    return NextResponse.json({
      data: batches,
      page,
      totalPages:
        Number.isFinite(totalPages) && totalPages > 0 ? Math.floor(totalPages) : page,
      totalItems:
        Number.isFinite(totalItems) && totalItems >= 0 ? Math.floor(totalItems) : batches.length,
    });
  } catch (error) {
    console.error("Batch API error:", error);
    return NextResponse.json(
      { error: "Unable to fetch batches." },
      { status: 502 }
    );
  }
}
