package com.younghee.studycast.service;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.younghee.studycast.dao.DdayMapper;
import com.younghee.studycast.dto.request.DdayCreateRequest;
import com.younghee.studycast.dto.response.DdayResponse;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class DdayService {

    private final DdayMapper ddayMapper;

    @Transactional(readOnly = true)
    public List<DdayResponse> getDdays(UUID userUuid) {
        return ddayMapper.findAllByUser(userUuid).stream()
                .map(DdayResponse::new)
                .collect(Collectors.toList());
    }

    @Transactional
    public void createDday(UUID userUuid, DdayCreateRequest req) {
        LocalDate targetDate = LocalDate.parse(req.getTargetDate());
        String type = (req.getType() != null && !req.getType().isBlank()) ? req.getType() : "기타";
        ddayMapper.insert(userUuid, req.getTitle(), type, targetDate);
    }

    @Transactional
    public void deleteDday(UUID userUuid, Long ddayNo) {
        int deleted = ddayMapper.deleteByIdAndUser(ddayNo, userUuid);
        if (deleted == 0) {
            throw new IllegalArgumentException("해당 일정을 찾을 수 없습니다.");
        }
    }
}
