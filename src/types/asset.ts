export type AssetType =
  | "images"
  | "videos"
  | "documents"
  | "archives"
  | "others"

export interface Asset {
  id: string
  filename: string
  originalName: string
  type: AssetType
  size: number
  url: string
  createdAt: Date | null
}
