package com.younghee.studycast.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CategoriesDTO {
    private Long categoryNo;        // 카테고리 식별 번호
    private String categoryName;    // 카테고리 이름
}