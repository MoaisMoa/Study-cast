const DEFAULT_ROOM_IMAGES = [
  "https://images.unsplash.com/photo-1513258496099-48168024aec0?w=400&q=75",
  "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=400&q=75",
  "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=400&q=75",
  "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=400&q=75",
  "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=400&q=75",
];

const API_BASE = "";

function hashName(name: string): number {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return h;
}

export function getDefaultRoomImage(roomName: string): string {
  return DEFAULT_ROOM_IMAGES[hashName(roomName) % DEFAULT_ROOM_IMAGES.length];
}

/** 서버에서 내려온 상대 경로(/room-images/...)에 API 도메인을 붙여 절대 URL로 변환 */
export function prefixRoomImageUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  return url.startsWith("/") ? `${API_BASE}${url}` : url;
}

/** 썸네일이 있으면 절대 URL로, 없으면 방 이름 기반 기본 이미지 반환 */
export function resolveRoomThumbnail(thumbnail: string | null | undefined, roomName: string): string {
  if (!thumbnail) return getDefaultRoomImage(roomName);
  return thumbnail.startsWith("/") ? `${API_BASE}${thumbnail}` : thumbnail;
}
