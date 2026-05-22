import { useRT } from "@/theme";
import { Icon } from "@/components/ui/Icon";
import type { IconName } from "@/components/ui/Icon";

export interface DeviceTogglesProps {
  camOn: boolean;
  micOn: boolean;
  setCamOn: (v: boolean) => void;
  setMicOn: (v: boolean) => void;
  isMobile: boolean;
}

export function DeviceToggles({ camOn, micOn, setCamOn, setMicOn, isMobile }: DeviceTogglesProps) {
  const T = useRT();
  const items: Array<{ on: boolean; toggle: () => void; icon: IconName; label: string }> = [
    { on: camOn, toggle: () => setCamOn(!camOn), icon: "camera", label: "카메라" },
    { on: micOn, toggle: () => setMicOn(!micOn), icon: "mic",    label: "마이크" },
  ];

  return (
    <div style={{ display: "flex", gap: 10 }}>
      {items.map(({ on, toggle, icon, label }) => (
        <button
          key={label}
          onClick={toggle}
          style={{
            flex: isMobile ? 1 : undefined,
            display: "flex",
            alignItems: "center",
            justifyContent: isMobile ? "center" : "flex-start",
            gap: 8,
            padding: isMobile ? "10px 0" : "10px 18px",
            border: on ? `1.5px solid ${T.red}` : `1px solid ${T.border}`,
            borderRadius: 8,
            background: on ? "rgba(230,50,50,0.07)" : T.surface2,
            color: on ? T.red : T.muted,
            cursor: "pointer",
            transition: "all 0.15s",
          }}
        >
          <Icon name={icon} size={15} color={on ? T.red : T.muted} />
          <span style={{ fontSize: 13, fontWeight: 600 }}>{label}</span>
          <span style={{
            fontSize: 11,
            fontWeight: 700,
            padding: "2px 7px",
            borderRadius: 4,
            background: on ? T.red : T.muted2,
            color: on ? "#fff" : "#888",
          }}>
            {on ? "ON" : "OFF"}
          </span>
        </button>
      ))}
    </div>
  );
}
