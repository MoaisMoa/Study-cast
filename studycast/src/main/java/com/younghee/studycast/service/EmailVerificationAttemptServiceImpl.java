package com.younghee.studycast.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import com.younghee.studycast.dao.EmailVerificationMapper;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class EmailVerificationAttemptServiceImpl implements EmailVerificationAttemptService{
    
    private final EmailVerificationMapper emailVerificationMapper;
    // 인증번호 실패 횟수는 외부 트랜잭션 롤백과 무관하게 별도 커밋
    @Override
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void increaseAttemptCount(Long verificationNo) {
        emailVerificationMapper.increaseAttemptCount(verificationNo);
    }

}
