package com.younghee.studycast.service;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.younghee.studycast.dao.WeekPlanMapper;
import com.younghee.studycast.dto.request.WeekPlanRequest;
import com.younghee.studycast.dto.response.WeekPlanResponse;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class WeekPlanServiceImpl implements WeekPlanService {

    private final WeekPlanMapper weekPlanMapper;

    @Override
    @Transactional(readOnly = true)
    public List<WeekPlanResponse> getWeekPlans(UUID userUuid) {
        return weekPlanMapper.findAllByUser(userUuid).stream()
                .map(WeekPlanResponse::new)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void createWeekPlan(UUID userUuid, WeekPlanRequest req) {
        weekPlanMapper.insert(userUuid, req.getDayOfWeek(), req.getTitle(),
                req.getColor(), req.getStartTime(), req.getEndTime());
    }

    @Override
    @Transactional
    public void updateWeekPlan(UUID userUuid, Long planNo, WeekPlanRequest req) {
        int updated = weekPlanMapper.update(planNo, userUuid, req.getDayOfWeek(),
                req.getTitle(), req.getColor(), req.getStartTime(), req.getEndTime());
        if (updated == 0) {
            throw new IllegalArgumentException("계획을 찾을 수 없습니다.");
        }
    }

    @Override
    @Transactional
    public void deleteWeekPlan(UUID userUuid, Long planNo) {
        int deleted = weekPlanMapper.deleteByIdAndUser(planNo, userUuid);
        if (deleted == 0) {
            throw new IllegalArgumentException("계획을 찾을 수 없습니다.");
        }
    }
}
