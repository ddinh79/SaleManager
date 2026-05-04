using SalesSystem.DTOs;
using SalesSystem.Entities;

namespace SalesSystem.Services;

public interface IDealService
{
    Task<DealResponse> CreateDealAsync(CreateDealRequest request, Guid salesId);
    Task<DealResponse?> GetDealByIdAsync(Guid id);
    Task<DealResponse?> UpdateDealAsync(Guid id, UpdateDealRequest request, Guid salesId, string userRole);
    Task<bool> DeleteDealAsync(Guid id, Guid salesId, string userRole);
    Task<PipelineResponse> GetPipelineAsync(Guid? managerId, string userRole, Guid currentUserId, int limit = 50);
    Task<ForecastResponse> GetForecastAsync();
    Task<DealResponse?> UpdateStageAsync(Guid id, UpdateStageRequest request, Guid salesId, string userRole);
    Task RebalanceStageAsync(DealStage stage);
}