using Microsoft.EntityFrameworkCore;
using SalesSystem.Data;
using SalesSystem.DTOs;
using SalesSystem.Entities;
using SalesSystem.Repositories;

namespace SalesSystem.Services;

public class TaskService : ITaskService
{
    private readonly AppDbContext _context;
    private readonly IDoctorRepository _doctorRepo;
    private readonly IDealRepository _dealRepo;
    private readonly IActivityRepository _activityRepo;

    public TaskService(
        AppDbContext context,
        IDoctorRepository doctorRepo,
        IDealRepository dealRepo,
        IActivityRepository activityRepo)
    {
        _context = context;
        _doctorRepo = doctorRepo;
        _dealRepo = dealRepo;
        _activityRepo = activityRepo;
    }

    public async Task<TasksResponse> GetTasksAsync(Guid userId, TaskFilter filter = TaskFilter.ALL)
    {
        var tasks = new List<TaskItem>();
        var now = DateTime.UtcNow;

        // 1. FOLLOW_UP tasks from Doctors
        var doctors = await _doctorRepo.GetByAssignedSalesIdAsync(userId);
        foreach (var doctor in doctors)
        {
            if (doctor.NextFollowUpAt.HasValue && doctor.NextFollowUpAt.Value <= now.AddDays(1))
            {
                var overdueDays = (int)(now - doctor.NextFollowUpAt.Value).TotalDays;
                tasks.Add(new TaskItem
                {
                    Id = doctor.Id,
                    Type = overdueDays > 0 ? TaskType.DEAL_OVERDUE : TaskType.FOLLOW_UP,
                    Priority = overdueDays > 0 ? TaskPriority.HIGH : TaskPriority.MEDIUM,
                    Score = overdueDays > 0 ? 100 : 85,
                    DoctorId = doctor.Id,
                    DoctorName = doctor.Name,
                    HospitalName = doctor.Hospital?.Name ?? "",
                    Temperature = doctor.Temperature.ToString(),
                    DueAt = doctor.NextFollowUpAt.Value,
                    OverdueDays = overdueDays,
                    LastActivityAt = doctor.LastActivityAt
                });
            }
        }

        // 2. DEAL tasks from Deals
        var deals = await _dealRepo.GetBySalesIdAsync(userId, 1000, 0);
        var fiveDaysAgo = now.AddDays(-5);

        foreach (var deal in deals)
        {
            if (deal.Stage == DealStage.WON || deal.Stage == DealStage.LOST)
                continue;

            var overdueDays = (int)(now - deal.ExpectedCloseDate).TotalDays;
            var isOverdue = overdueDays > 0;
            var closeWithin1Day = deal.ExpectedCloseDate <= now.AddDays(1);
            var closeWithin3Days = deal.ExpectedCloseDate <= now.AddDays(3);

            if (filter == TaskFilter.OVERDUE && !isOverdue) continue;
            if (filter == TaskFilter.CLOSING_SOON && !closeWithin3Days) continue;
            if (filter == TaskFilter.TODAY && (isOverdue || !closeWithin1Day)) continue;

            // Skip if not closing soon and filter is CLOSING_SOON
            if (filter == TaskFilter.CLOSING_SOON && !closeWithin3Days && !isOverdue) continue;

            // Calculate priority score
            int baseScore = isOverdue ? 100 : (closeWithin1Day ? 95 : (closeWithin3Days ? 85 : 0));
            int bonus = deal.Stage == DealStage.NEGOTIATION ? 5 : 0;
            if (deal.UpdatedAt < fiveDaysAgo) bonus += 10;

            var task = new TaskItem
            {
                Id = deal.Id,
                Type = isOverdue ? TaskType.DEAL_OVERDUE : TaskType.DEAL_CLOSING,
                DoctorId = deal.DoctorId,
                DoctorName = deal.Doctor?.Name ?? "",
                HospitalName = deal.Doctor?.Hospital?.Name ?? "",
                Temperature = deal.Doctor?.Temperature.ToString() ?? "WARM",
                DealId = deal.Id,
                DealName = deal.Doctor?.Name ?? "",
                DealValue = deal.TotalValue,
                DealStage = deal.Stage.ToString(),
                DueAt = deal.ExpectedCloseDate,
                OverdueDays = overdueDays,
                LastActivityAt = deal.UpdatedAt,
                Score = baseScore + bonus,
                Priority = isOverdue ? TaskPriority.HIGH : (closeWithin1Day ? TaskPriority.HIGH : TaskPriority.MEDIUM)
            };

            // Override priority based on score
            if (task.Score >= 100) task.Priority = TaskPriority.HIGH;
            else if (task.Score >= 90) task.Priority = TaskPriority.HIGH;
            else if (task.Score >= 80) task.Priority = TaskPriority.MEDIUM;
            else task.Priority = TaskPriority.LOW;

            tasks.Add(task);
        }

        // Sort by priority score DESC
        var sortedTasks = tasks.OrderByDescending(t => t.Score).ToList();

        // Calculate summary
        var summary = new TasksSummary
        {
            Total = sortedTasks.Count,
            Overdue = sortedTasks.Count(t => t.Type == TaskType.DEAL_OVERDUE || t.OverdueDays > 0),
            ClosingSoon = sortedTasks.Count(t => t.Type == TaskType.DEAL_CLOSING && t.OverdueDays <= 0),
            Today = sortedTasks.Count(t => t.DueAt <= now.AddDays(1))
        };

        return new TasksResponse { Tasks = sortedTasks, Summary = summary };
    }

    public async Task<bool> SnoozeTaskAsync(Guid taskId, string taskType, int days)
    {
        var futureDate = DateTime.UtcNow.AddDays(days);

        if (taskType == "FOLLOW_UP" || taskType == "DEAL_OVERDUE")
        {
            var doctor = await _doctorRepo.GetByIdAsync(taskId);
            if (doctor == null) return false;
            doctor.NextFollowUpAt = futureDate;
            await _doctorRepo.UpdateAsync(doctor);
            return true;
        }

        // For deal tasks, update the deal's expected close date isn't right
        // Instead we need a separate mechanism or just update doctor
        return false;
    }

    public async Task<bool> CompleteTaskAsync(Guid taskId, string taskType)
    {
        if (taskType == "FOLLOW_UP" || taskType == "DEAL_OVERDUE")
        {
            var doctor = await _doctorRepo.GetByIdAsync(taskId);
            if (doctor == null) return false;
            doctor.NextFollowUpAt = DateTime.UtcNow.AddDays(1);
            await _doctorRepo.UpdateAsync(doctor);
            return true;
        }
        return false;
    }
}