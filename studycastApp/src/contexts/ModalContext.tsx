import { createContext, useContext, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { Room } from "@/types";

type ModalContextValue = (room: Room | null) => void;

interface ModalProviderState {
  room: Room | null;
  setModalRoom: ModalContextValue;
}

const ModalCtx = createContext<ModalProviderState | null>(null);

export function ModalProvider({ children }: { children: ReactNode }) {
  const [room, setModalRoom] = useState<Room | null>(null);
  const value = useMemo<ModalProviderState>(() => ({ room, setModalRoom }), [room]);
  return <ModalCtx.Provider value={value}>{children}</ModalCtx.Provider>;
}

/** 기존 사용 패턴 유지: `const setModalRoom = useModal();` */
export function useModal(): ModalContextValue {
  const ctx = useContext(ModalCtx);
  if (!ctx) throw new Error("useModal must be used within ModalProvider");
  return ctx.setModalRoom;
}

/** 현재 열려있는 룸 데이터 */
export function useModalRoom(): Room | null {
  const ctx = useContext(ModalCtx);
  if (!ctx) throw new Error("useModalRoom must be used within ModalProvider");
  return ctx.room;
}
