import type { RoomMember } from "@/types/studyRoom";
import { useT } from "@/theme";
import { Av, WarnIc } from "./RoomIcons";

export function KickConfirm({ member, onConfirm, onCancel }: { member: RoomMember; onConfirm: () => void; onCancel: () => void }) {
  const T = useT();
  const redbg = T.dark ? "rgba(239,83,80,.18)" : "#FFEBEE";
  return (
    <div onClick={onCancel} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.55)", zIndex: 10000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: T.surface, borderRadius: 16, boxShadow: "0 20px 60px rgba(0,0,0,.35)", width: 340, padding: "28px 26px 22px", display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div style={{ width: 60, height: 60, borderRadius: "50%", background: redbg, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
          <WarnIc s={28} c={T.red} />
        </div>
        <div style={{ fontSize: 17, fontWeight: 700, color: T.text, marginBottom: 12 }}>멤버 추방</div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, background: T.surface2, borderRadius: 10, padding: "10px 14px", width: "100%", marginBottom: 14 }}>
          <div style={{ flexShrink: 0 }}><Av name={member.short} color={member.color} size={38} /></div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: T.text, marginBottom: 2 }}>{member.name}</div>
            <div style={{ fontSize: 12, color: T.text3 }}>{member.email}</div>
          </div>
        </div>
        <p style={{ fontSize: 13, color: T.text2, textAlign: "center", lineHeight: 1.8, marginBottom: 22 }}>
          추방된 멤버는 즉시 퇴장되며<br />다시 초대해야 입장할 수 있습니다.
        </p>
        <div style={{ display: "flex", gap: 10, width: "100%" }}>
          <button onClick={onCancel} style={{ flex: 1, padding: "11px 0", borderRadius: 9, border: `1px solid ${T.border}`, background: "none", color: T.text2, fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>취소</button>
          <button onClick={onConfirm} style={{ flex: 1, padding: "11px 0", borderRadius: 9, border: "none", background: T.red, color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>추방하기</button>
        </div>
      </div>
    </div>
  );
}

export function ExitConfirm({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
  const T = useT();
  return (
    <div onClick={onCancel} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.55)", zIndex: 10000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: T.surface, borderRadius: 14, width: 300, padding: "24px 22px", boxShadow: "0 16px 40px rgba(0,0,0,.4)", textAlign: "center" }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: T.text, marginBottom: 8 }}>스터디룸을 나갈까요?</div>
        <div style={{ fontSize: 13, color: T.text3, marginBottom: 22, lineHeight: 1.6 }}>누적 공부 시간은 저장됩니다.</div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={onCancel} style={{ flex: 1, padding: "10px 0", borderRadius: 8, border: `1px solid ${T.border}`, background: "none", color: T.text2, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>취소</button>
          <button onClick={onConfirm} style={{ flex: 1, padding: "10px 0", borderRadius: 8, border: "none", background: T.red, color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>나가기</button>
        </div>
      </div>
    </div>
  );
}
