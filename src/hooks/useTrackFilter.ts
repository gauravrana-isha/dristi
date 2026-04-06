import { useState } from "react";

export type Track = "hate" | "misinfo";

export function useTrackFilter(initial: Track = "hate") {
  const [track, setTrack] = useState<Track>(initial);
  return { track, setTrack };
}
