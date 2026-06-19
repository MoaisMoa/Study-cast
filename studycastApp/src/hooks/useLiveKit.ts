import { useEffect, useRef, useState } from "react";
import { Room, RoomEvent, Track } from "livekit-client";
import type { LocalVideoTrack, RemoteVideoTrack } from "livekit-client";
import type { DeviceError } from "@/types/studyRoom";
import { fetchLiveKitToken } from "@/services/studyRoomService";

export type LiveKitVideoTrack = LocalVideoTrack | RemoteVideoTrack;

export interface UseLiveKitResult {
  connected: boolean;
  selfIdentity: string | null;
  // identity(userUuid) → LiveKit 비디오 트랙 (카메라 OFF면 없음)
  videoTracks: Map<string, LiveKitVideoTrack>;
}

export function useLiveKit(
  roomId: string | undefined,
  camOn: boolean,
  micOn: boolean,
  onCamError: (e: DeviceError) => void,
  onMicError: (e: DeviceError) => void,
): UseLiveKitResult {
  const roomRef = useRef<Room | null>(null);
  const [connected, setConnected] = useState(false);
  const [selfIdentity, setSelfIdentity] = useState<string | null>(null);
  const [videoTracks, setVideoTracks] = useState<Map<string, LiveKitVideoTrack>>(new Map());

  function collectTracks(room: Room) {
    const map = new Map<string, LiveKitVideoTrack>();

    // 내 카메라 트랙 — track 객체 자체를 저장 (attach/detach 사용)
    const localPub = room.localParticipant.getTrackPublication(Track.Source.Camera);
    const localTrack = localPub?.videoTrack as LocalVideoTrack | undefined;
    if (localTrack && !localPub?.isMuted) {
      map.set(room.localParticipant.identity, localTrack);
    }

    // 원격 참여자 카메라 트랙
    for (const [, p] of room.remoteParticipants) {
      const pub = p.getTrackPublication(Track.Source.Camera);
      const track = pub?.videoTrack as RemoteVideoTrack | undefined;
      if (track && !pub?.isMuted) {
        map.set(p.identity, track);
      }
    }

    setVideoTracks(new Map(map));
  }

  // 최초 연결
  useEffect(() => {
    if (!roomId) return;
    let cancelled = false;
    const room = new Room();
    roomRef.current = room;

    const update = () => collectTracks(room);
    room.on(RoomEvent.TrackSubscribed, update);
    room.on(RoomEvent.TrackUnsubscribed, update);
    room.on(RoomEvent.LocalTrackPublished, update);
    room.on(RoomEvent.LocalTrackUnpublished, update);
    room.on(RoomEvent.TrackMuted, update);
    room.on(RoomEvent.TrackUnmuted, update);
    room.on(RoomEvent.ParticipantConnected, update);
    room.on(RoomEvent.ParticipantDisconnected, update);

    (async () => {
      try {
        const { url, token } = await fetchLiveKitToken(roomId);
        if (cancelled) return;

        await room.connect(url, token);
        if (cancelled) { room.disconnect(); return; }

        setSelfIdentity(room.localParticipant.identity);
        console.log("[LK] selfIdentity:", room.localParticipant.identity);

        if (camOn) {
          try {
            console.log("[LK] setCameraEnabled(true) 호출");
            await room.localParticipant.setCameraEnabled(true);
            console.log("[LK] setCameraEnabled(true) 완료");
          } catch (e) {
            const msg = e instanceof Error ? e.message.toLowerCase() : "";
            onCamError(msg.includes("permission") || msg.includes("notallowed") ? "denied" : "unavailable");
          }
        }
        if (micOn) {
          try {
            await room.localParticipant.setMicrophoneEnabled(true);
          } catch (e) {
            const msg = e instanceof Error ? e.message.toLowerCase() : "";
            onMicError(msg.includes("permission") || msg.includes("notallowed") ? "denied" : "unavailable");
          }
        }

        setConnected(true);
        collectTracks(room);
      } catch (e) {
        if (!cancelled) console.error("[LiveKit] 연결 실패:", e);
      }
    })();

    return () => {
      cancelled = true;
      room.disconnect();
      roomRef.current = null;
      setConnected(false);
      setSelfIdentity(null);
      setVideoTracks(new Map());
    };
  // roomId가 바뀔 때만 재연결 (cam/mic 초기값은 연결 시점 1회만 사용)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId]);

  // 카메라 ON/OFF 동기화
  useEffect(() => {
    if (!connected || !roomRef.current) return;
    roomRef.current.localParticipant.setCameraEnabled(camOn)
      .then(() => collectTracks(roomRef.current!))
      .catch((e) => {
        const msg = e instanceof Error ? e.message.toLowerCase() : "";
        onCamError(msg.includes("permission") || msg.includes("notallowed") ? "denied" : "unavailable");
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [camOn, connected]);

  // 마이크 ON/OFF 동기화
  useEffect(() => {
    if (!connected || !roomRef.current) return;
    roomRef.current.localParticipant.setMicrophoneEnabled(micOn)
      .catch((e) => {
        const msg = e instanceof Error ? e.message.toLowerCase() : "";
        onMicError(msg.includes("permission") || msg.includes("notallowed") ? "denied" : "unavailable");
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [micOn, connected]);

  return { connected, selfIdentity, videoTracks };
}
