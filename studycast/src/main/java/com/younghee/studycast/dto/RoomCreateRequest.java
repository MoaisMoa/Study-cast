package com.younghee.studycast.dto;

import java.time.LocalDateTime;

public class RoomCreateRequest {
    private Integer categoryNo;
    private String roomTitle;
    private String roomDescription;
    private Integer maxUsers;
    private String roomPassword;
    private String roomNotice;
    private Boolean roomPrivate;
    private Boolean roomPremium;
    private String roomThumbnail;
    private LocalDateTime expiredAt;

    public Integer getCategoryNo() {
        return categoryNo;
    }

    public void setCategoryNo(Integer categoryNo) {
        this.categoryNo = categoryNo;
    }

    public String getRoomTitle() {
        return roomTitle;
    }

    public void setRoomTitle(String roomTitle) {
        this.roomTitle = roomTitle;
    }

    public String getRoomDescription() {
        return roomDescription;
    }

    public void setRoomDescription(String roomDescription) {
        this.roomDescription = roomDescription;
    }

    public Integer getMaxUsers() {
        return maxUsers;
    }

    public void setMaxUsers(Integer maxUsers) {
        this.maxUsers = maxUsers;
    }

    public String getRoomPassword() {
        return roomPassword;
    }

    public void setRoomPassword(String roomPassword) {
        this.roomPassword = roomPassword;
    }

    public String getRoomNotice() {
        return roomNotice;
    }

    public void setRoomNotice(String roomNotice) {
        this.roomNotice = roomNotice;
    }

    public Boolean getRoomPrivate() {
        return roomPrivate;
    }

    public void setRoomPrivate(Boolean roomPrivate) {
        this.roomPrivate = roomPrivate;
    }

    public Boolean getRoomPremium() {
        return roomPremium;
    }

    public void setRoomPremium(Boolean roomPremium) {
        this.roomPremium = roomPremium;
    }

    public String getRoomThumbnail() {
        return roomThumbnail;
    }

    public void setRoomThumbnail(String roomThumbnail) {
        this.roomThumbnail = roomThumbnail;
    }

    public LocalDateTime getExpiredAt() {
        return expiredAt;
    }

    public void setExpiredAt(LocalDateTime expiredAt) {
        this.expiredAt = expiredAt;
    }
}
