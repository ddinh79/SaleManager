using SalesSystem.DTOs;

namespace SalesSystem.Services;

public interface ITaskService
{
    Task<TasksResponse> GetTasksAsync(Guid userId, TaskFilter filter = TaskFilter.ALL);
    Task<bool> SnoozeTaskAsync(Guid taskId, string taskType, int days);
    Task<bool> CompleteTaskAsync(Guid taskId, string taskType);
}