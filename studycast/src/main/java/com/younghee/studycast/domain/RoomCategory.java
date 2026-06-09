package com.younghee.studycast.domain;

public enum RoomCategory {
    
    LANGUAGE(1L, "어학"),
    PUBLIC_OFFICIAL(2L, "공무원"),
    DEVELOPMENT_IT(3L, "개발·IT"),
    CERTIFICATE(4L, "자격증"),
    JOB_INTERVIEW(5L, "취업·면접"),
    UNIVERSITY(6L, "대학생");

    private final Long categoryNo;
    private final String label;
    
    private RoomCategory(Long categoryNo, String label) {
        this.categoryNo = categoryNo;
        this.label = label;
    }

    public Long getCategoryNo() {
        return categoryNo;
    }

    public String getLabel() {
        return label;
    }

    public static boolean exists(Long categoryNo) {
        if (categoryNo == null) {
            return false;
        }

        for (RoomCategory category : values()) {
            if (category.categoryNo.equals(categoryNo)) {
                return true;
            }
        }

        return false;
    }
    
}
