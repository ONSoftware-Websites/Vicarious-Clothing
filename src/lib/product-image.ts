const PUBLIC_OBJECT_MARKER = "/storage/v1/object/public/product-images/";

export function productImageVariant(src: string | undefined, variant: "thumb" | "display") {
  if (!src) return "";
  try {
    const url = new URL(src);
    const markerIndex = url.pathname.indexOf(PUBLIC_OBJECT_MARKER);
    if (markerIndex < 0) return src;
    const objectPath = decodeURIComponent(url.pathname.slice(markerIndex + PUBLIC_OBJECT_MARKER.length));
    const filename = objectPath.split("/").pop();
    if (!filename) return src;
    url.pathname = `${PUBLIC_OBJECT_MARKER}variants/${variant}/${encodeURIComponent(filename)}`;
    url.search = "";
    return url.toString();
  } catch {
    return src;
  }
}
