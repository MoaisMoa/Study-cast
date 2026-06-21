package com.younghee.studycast.service;

import java.util.List;
import java.util.UUID;

import com.younghee.studycast.dto.request.WeekPlanRequest;
import com.younghee.studycast.dto.response.WeekPlanResponse;

public interface WeekPlanService {
    List<WeekPlanResponse> getWeekPlans(UUID userUuid);
    void createWeekPlan(UUID userUuid, WeekPlanRequest req);
    void updateWeekPlan(UUID userUuid, Long planNo, WeekPlanRequest req);
    void deleteWeekPlan(UUID userUuid, Long planNo);
}
