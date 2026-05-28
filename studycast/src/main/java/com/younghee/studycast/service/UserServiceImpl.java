package com.younghee.studycast.service;

import java.util.UUID;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.younghee.studycast.dao.RoleMapper;
import com.younghee.studycast.dao.UserMapper;
import com.younghee.studycast.dto.SignupRequest;
import com.younghee.studycast.dto.UserDTO;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService{
    
    private final UserMapper userMapper;
    private final RoleMapper roleMapper;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public int signup(SignupRequest request) {

        // 입력값 검증
        validateSignup(request);

        log.info("회원가입 요청: email={}", request.getUserEmail());
        // 이메일 중복 확인
        UserDTO existingUser = userMapper.findByEmail(request.getUserEmail());
        if (existingUser != null) {
            throw new RuntimeException("이미 사용 중인 이메일입니다.");
        }
        // UserDTO 생성
        UserDTO user = new UserDTO();
        // UUID 생성
        user.setUserUuid(UUID.randomUUID());
        // 회원가입 요청값 세팅
        user.setUserEmail(request.getUserEmail());
        user.setUserName(request.getUserName());
        // 비밀번호 암호화
        String encodedPassword = passwordEncoder.encode(request.getUserPassword());
        user.setUserPassword(encodedPassword);
        // 기본 상태 설정
        user.setUserStatus("ACTIVE");
        // users 테이블 저장
        int result = userMapper.insertUser(user);
        // roles 테이블에 기본 권한 저장
        roleMapper.insertDefaultRole(user.getUserUuid());

        log.info("회원가입 성공: userUuid={}, email={}", user.getUserUuid(), user.getUserEmail());

        return result;
    }

    // 프로필 수정
    @Override
    @Transactional
    public void updateProfile(UUID userUuid, UserDTO dto) {
        log.info("프로필 수정 요청 시작 userUuid: {}", userUuid);
        dto.setUserUuid(userUuid);

        userMapper.updateProfile(dto);
        userMapper.deleteUserInterests(userUuid);

        if(dto.getCategories() != null && !dto.getCategories().isEmpty()) {
            for(String categoryName : dto.getCategories()) {
                log.info("관심 카테고리 추가 등록: userUuid={}, categoryName={}", userUuid, categoryName);
                userMapper.insertUserInterest(userUuid, categoryName);
            }
        }
        log.info("프로필 수정 성공 userUuid: {}", userUuid);
    }

    private void validateSignup(SignupRequest request) {
        if (request == null) {
            throw new RuntimeException("회원 정보가 없습니다.");
        }
        if (request.getUserEmail() == null || request.getUserEmail().isBlank()) {
            throw new RuntimeException("이메일을 입력하세요.");
        }
        if (!request.getUserEmail().matches("^[A-Za-z0-9+_.-]+@(.+)$")) {
            throw new RuntimeException("이메일 형식이 올바르지 않습니다.");
        }
        if (request.getUserPassword() == null || request.getUserPassword().isBlank()) {
            throw new RuntimeException("비밀번호를 입력하세요.");
        }
        if (!request.getUserPassword().matches("^(?=.*[A-Za-z])(?=.*\\d)(?=.*[!@#$%^&*()]).{8,16}$")) {
            throw new RuntimeException("비밀번호는 영문자, 숫자, 특수문자를 포함한 8~16자리여야 합니다.");
        }
        if (request.getUserPasswordConfirm() == null || request.getUserPasswordConfirm().isBlank()) {
            throw new RuntimeException("비밀번호 확인을 입력하세요.");
        }
        if (!request.getUserPassword().equals(request.getUserPasswordConfirm())) {
            throw new RuntimeException("비밀번호가 일치하지 않습니다.");
        }
        if (request.getUserName() == null || request.getUserName().isBlank()) {
            throw new RuntimeException("이름을 입력하세요.");
        }
        if (!request.getUserName().matches("^[가-힣]{2,5}$")) {
            throw new RuntimeException("이름을 입력해주세요.");
        }
    }

}
