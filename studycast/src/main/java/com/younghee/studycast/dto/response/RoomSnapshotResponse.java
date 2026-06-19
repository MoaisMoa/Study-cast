// package com.younghee.studycast.dto.response;

// import java.util.List;

// import lombok.AllArgsConstructor;
// import lombok.Data;
// import lombok.NoArgsConstructor;

// @Data
// @NoArgsConstructor
// @AllArgsConstructor
// @builder
// public class RoomSnapshotResponse {
//     private Long roomId;
//     private String title;
//     private int maxMenber;
//     private String notice;
//     private boolean isHost;
//     private List<MemberInfo> members;
//     private List<ChatMessageInfo> messages;

//     @Data
//     @builder
//     @NoArgsConstructor
//     @AllArgsConstructor
//     public static class MemberInfo {
//         private String userUuid;
//         private String userName;
//         private String userEmail;
//         private String userProfileImage;
//         private boolean cameraStatus;
//         private boolean micStatus;
//         private boolean isHost;
//     }

//     public static class ChatmessageInfo {
//         private Long chatNo;
//         private String userUuid;
//         private String userName;
//         private String userProfileImage;
//         private String message;
//         private String sentAt;
//     }
// }