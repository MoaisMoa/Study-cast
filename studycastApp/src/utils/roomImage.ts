const DEFAULT_ROOM_IMAGES = [
  "https://images.unsplash.com/photo-1513258496099-48168024aec0?w=400&q=75",
  "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=400&q=75",
  "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=400&q=75",
  "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=400&q=75",
  "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=400&q=75",
];

export function getDefaultRoomImage(roomNo: number): string {
  return DEFAULT_ROOM_IMAGES[roomNo % DEFAULT_ROOM_IMAGES.length];
}
