package com.younghee.studycast.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

// 카테고리 DTO
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CategoriesDTO {
    private Long categoryNo;    // 카테고리 고유 번호
    private String categoryName;// 카테고리 명칭
}