using SalesSystem.DTOs;

namespace SalesSystem.Services;

public interface IDailyPlanService
{
    Task<DailyPlanResponse> GetDailyPlanAsync(Guid userId, DateTime date);
    Task<DailyPlanTaskDto> CompleteTaskAsync(Guid userId, Guid taskId, ManualCompleteRequest request);
    Task<DailyPlanTaskDto> SkipTaskAsync(Guid userId, Guid taskId, SkipTaskRequest request);
    Task<DailyPlanTaskDto> ActivateTaskAsync(Guid userId, Guid taskId);
    Task<CapacityInfo> GetCapacityAsync(Guid userId);
    Task<CapacityInfo> UpdateCapacityAsync(Guid userId, CapacityUpdateRequest request);
    Task<TeamDailyPlanResponse> GetTeamPlansAsync(Guid managerId, DateTime date);
}