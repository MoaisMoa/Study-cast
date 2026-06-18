package com.younghee.studycast.dao;

import java.util.UUID;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import com.younghee.studycast.dto.EmailVerificationDTO;

@Mapper
public interface EmailVerificationMapper {

    // 인증번호 저장
    int insert(EmailVerificationDTO emailVerification);

    // 해당 이메일의 비밀번호 재설정용 최신 인증번호 조회
    EmailVerificationDTO findLatestPasswordResetCode(@Param("userEmail") String userEmail);

    // 인증 실패 횟수 증가
    int increaseAttemptCount(@Param("verificationNo") Long verificationNo);

    // 인증 성공 처리
    int markVerified(@Param("verificationNo") Long verificationNo);

    // 비밀번호 변경 완료 후 인증번호 사용 처리
    int markUsed(@Param("verificationNo") Long verificationNo);
    
    // 기존 미사용 인증번호 폐기 처리
    int markUnusedCodesAsUsed(
        @Param("userUuid") UUID userUuid,
        @Param("purpose") String purpose
    );

    // 확장1) 해당 이메일의 가장 최근 인증번호 요청 기록 조회
    EmailVerificationDTO findLatestByEmailAndPurpose (
        @Param("userEmail") String userEmail,
        @Param("purpose") String purpose
    );

    // 확장2) 사용 완료 또는 만료일 지난 인증번호 30일 보관 후 삭제
    int deleteExpiredOrUsedCodes();
}
