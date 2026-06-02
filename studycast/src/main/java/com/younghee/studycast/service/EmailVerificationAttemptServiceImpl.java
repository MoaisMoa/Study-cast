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
    // 실패횟수 롤백 별도 처리
    @Override
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void increaseAttemptCount(Long verificationNo) {
        emailVerificationMapper.increaseAttemptCount(verificationNo);
    }

}
