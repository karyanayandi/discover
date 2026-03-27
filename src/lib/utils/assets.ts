export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B"
  const k = 1024
  const sizes = ["B", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${Number.parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`
}

export function getAssetType(
  filename: string,
): "images" | "videos" | "documents" | "archives" | "others" {
  const ext = filename.split(".").pop()?.toLowerCase() ?? ""

  const imageExts = ["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp", "ico"]
  const videoExts = ["mp4", "webm", "mov", "avi", "mkv", "flv"]
  const documentExts = [
    "pdf",
    "doc",
    "docx",
    "txt",
    "rtf",
    "odt",
    "xls",
    "xlsx",
    "ppt",
    "pptx",
  ]
  const archiveExts = ["zip", "rar", "7z", "gz", "tar", "bz2"]

  if (imageExts.includes(ext)) return "images"
  if (videoExts.includes(ext)) return "videos"
  if (documentExts.includes(ext)) return "documents"
  if (archiveExts.includes(ext)) return "archives"
  return "others"
}
