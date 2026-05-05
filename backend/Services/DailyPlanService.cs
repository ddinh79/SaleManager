using Microsoft.EntityFrameworkCore;
using SalesSystem.Data;
using SalesSystem.DTOs;
using SalesSystem.Entities;
using SalesSystem.Repositories;

namespace SalesSystem.Services;

public class DailyPlanService : IDailyPlanService
{
    private readonly AppDbContext _context;
    private readonly IDoctorRepository _doctorRepo;
    private readonly IDealRepository _dealRepo;
    private readonly IUserRepository _userRepo;
    private readonly CapacityCalculator _capacityCalculator;
    private readonly ActivityMatcher _activityMatcher;
    private readonly AntiGamingMonitor _antiGamingMonitor;

    public DailyPlanService(
        AppDbContext context,
        IDoctorRepository doctorRepo,
        IDealRepository dealRepo,
        IUserRepository userRepo,
        CapacityCalculator capacityCalculator,
        ActivityMatcher activityMatcher,
        AntiGamingMonitor antiGamingMonitor)
    {
        _context = context;
        _doctorRepo = doctorRepo;
        _dealRepo = dealRepo;
        _userRepo = userRepo;
        _capacityCalculator = capacityCalculator;
        _activityMatcher = activityMatcher;
        _antiGamingMonitor = antiGamingMonitor;
    }

    public async Task<DailyPlanResponse> GetDailyPlanAsync(Guid userId, DateTime date)
    {
        var existingPlan = await _context.DailyPlans
            .Include(p => p.Tasks)
            .FirstOrDefaultAsync(p => p.SalesId == userId && p.Date.Date == date.Date);

        if (existingPlan != null)
            return MapToResponse(existingPlan);

        return await GeneratePlanAsync(userId, date);
    }

    private async Task<DailyPlanResponse> GeneratePlanAsync(Guid userId, DateTime date)
    {
        var capacity = await _capacityCalculator.CalculateCapacityAsync(userId);
        var doctors = await _doctorRepo.GetByAssignedSalesIdAsync(userId);
        var deals = await _dealRepo.GetBySalesIdAsync(userId, 1000, 0);
        var now = DateTime.UtcNow;

        var tasks = new List<DailyPlanTask>();

        // Aggregate tasks from Doctor.NextFollowUpAt
        foreach (var doctor in doctors)
        {
            if (doctor.NextFollowUpAt.HasValue && doctor.NextFollowUpAt.Value <= now.AddDays(1))
            {
                var overdueDays = (int)(now - doctor.NextFollowUpAt.Value).TotalDays;
                tasks.Add(new DailyPlanTask
                {
                    Id = Guid.NewGuid(),
                    DoctorId = doctor.Id,
                    DoctorName = doctor.Name,
                    HospitalName = doctor.Hospital?.Name ?? "",
                    TaskType = "FOLLOW_UP",
                    Score = overdueDays > 0 ? 100 : 85,
                    Temperature = doctor.Temperature.ToString(),
                    Category = overdueDays > 0 ? "MUST_DO" : "SHOULD_DO"
                });
            }
        }

        // Aggregate tasks from Deals
        foreach (var deal in deals.Where(d => d.Stage != DealStage.WON && d.Stage != DealStage.LOST))
        {
            var overdueDays = (int)(now - deal.ExpectedCloseDate).TotalDays;
            var closeWithin3Days = deal.ExpectedCloseDate <= now.AddDays(3);

            if (overdueDays > 0 || closeWithin3Days)
            {
                var score = overdueDays > 0 ? 100 : (deal.Stage == DealStage.NEGOTIATION ? 95 : 85);
                tasks.Add(new DailyPlanTask
                {
                    Id = Guid.NewGuid(),
                    DoctorId = deal.DoctorId,
                    DealId = deal.Id,
                    DoctorName = deal.Doctor?.Name ?? "",
                    HospitalName = deal.Doctor?.Hospital?.Name ?? "",
                    TaskType = deal.Stage == DealStage.NEGOTIATION ? "MEETING" : "CALL",
                    DealValue = deal.TotalValue,
                    Score = score,
                    Temperature = deal.Doctor?.Temperature.ToString() ?? "WARM",
                    Category = overdueDays > 0 ? "MUST_DO" : "SHOULD_DO"
                });
            }
        }

        // Sort by score DESC
        tasks = tasks.OrderByDescending(t => t.Score).ToList();

        // Categorize and assign time slots
        var mustDoTasks = tasks.Take(capacity.MustDoLimit).ToList();
        var shouldDoTasks = tasks.Skip(capacity.MustDoLimit).Take(capacity.ShouldDoLimit).ToList();
        var niceToHaveTasks = tasks.Skip(capacity.MustDoLimit + capacity.ShouldDoLimit).ToList();

        // Assign time slots to MUST_DO
        var startTime = capacity.StartTime.TimeOfDay;
        var currentTime = date.Date.Add(startTime);
        foreach (var task in mustDoTasks)
        {
            task.PlannedStart = currentTime;
            task.PlannedDurationMinutes = GetDurationForTaskType(task.TaskType);
            currentTime = currentTime.AddMinutes(task.PlannedDurationMinutes + 5);
        }

        // Create plan entity
        var plan = new DailyPlan
        {
            Id = Guid.NewGuid(),
            SalesId = userId,
            Date = date.Date,
            GeneratedAt = DateTime.UtcNow,
            MustDoLimit = capacity.MustDoLimit,
            ShouldDoLimit = capacity.ShouldDoLimit,
            StartTime = capacity.StartTime,
            Status = PlanStatus.NOT_STARTED,
            Tasks = mustDoTasks.Concat(shouldDoTasks).Concat(niceToHaveTasks).ToList()
        };

        foreach (var task in plan.Tasks)
            task.DailyPlanId = plan.Id;

        _context.DailyPlans.Add(plan);
        await _context.SaveChangesAsync();

        return MapToResponse(plan);
    }

    private int GetDurationForTaskType(string taskType) => taskType switch
    {
        "CALL" => 15,
        "FOLLOW_UP" => 10,
        "MEETING" => 45,
        "DEMO" => 45,
        "SAMPLE" => 30,
        _ => 15
    };

    private DailyPlanResponse MapToResponse(DailyPlan plan)
    {
        return new DailyPlanResponse
        {
            Id = plan.Id,
            Date = plan.Date,
            Status = plan.Status.ToString(),
            ActiveTaskId = plan.ActiveTaskId,
            CompletionRate = plan.CompletionRate,
            ConfidenceScore = plan.ConfidenceScore,
            IsRecoveryMode = plan.IsRecoveryMode,
            Capacity = new CapacityInfo
            {
                MustDoLimit = plan.MustDoLimit,
                ShouldDoLimit = plan.ShouldDoLimit,
                StartTime = plan.StartTime,
                Mode = plan.IsRecoveryMode ? "RECOVERY" : "NORMAL"
            },
            MustDo = plan.Tasks.Where(t => t.Category == "MUST_DO").Select(MapToDto).ToList(),
            ShouldDo = plan.Tasks.Where(t => t.Category == "SHOULD_DO").Select(MapToDto).ToList(),
            NiceToHave = plan.Tasks.Where(t => t.Category == "NICE_TO_HAVE").Select(MapToDto).ToList()
        };
    }

    private DailyPlanTaskDto MapToDto(DailyPlanTask task)
    {
        return new DailyPlanTaskDto
        {
            Id = task.Id,
            PlannedStart = task.PlannedStart,
            ActualStart = task.ActualStart,
            DelayMinutes = task.DelayMinutes,
            PlannedDurationMinutes = task.PlannedDurationMinutes,
            Category = task.Category,
            Score = task.Score,
            Status = task.Status.ToString(),
            IsLowConfidence = task.IsLowConfidence,
            DoctorId = task.DoctorId,
            DoctorName = task.DoctorName,
            HospitalName = task.HospitalName,
            TaskType = task.TaskType,
            DealValue = task.DealValue,
            Temperature = task.Temperature
        };
    }

    public async Task<DailyPlanTaskDto> CompleteTaskAsync(Guid userId, Guid taskId, ManualCompleteRequest request)
    {
        var task = await _context.DailyPlanTasks
            .Include(t => t.DailyPlan)
            .FirstOrDefaultAsync(t => t.Id == taskId);

        if (task == null || task.DailyPlan.SalesId != userId)
            throw new InvalidOperationException("Task not found");

        task.Status = PlanTaskStatus.COMPLETED_MANUAL;
        task.IsLowConfidence = true;
        task.ManualReasonCode = request.ReasonCode;
        task.ManualReasonNote = request.Note;

        await _activityMatcher.UpdateMetricsAfterCompletionAsync(userId, false, true);
        await _context.SaveChangesAsync();

        return MapToDto(task);
    }

    public async Task<DailyPlanTaskDto> SkipTaskAsync(Guid userId, Guid taskId, SkipTaskRequest request)
    {
        var task = await _context.DailyPlanTasks
            .Include(t => t.DailyPlan)
            .FirstOrDefaultAsync(t => t.Id == taskId);

        if (task == null || task.DailyPlan.SalesId != userId)
            throw new InvalidOperationException("Task not found");

        task.Status = PlanTaskStatus.SKIPPED;
        task.ManualReasonCode = request.ReasonCode;
        task.ManualReasonNote = request.Note;

        await _context.SaveChangesAsync();
        return MapToDto(task);
    }

    public async Task<DailyPlanTaskDto> ActivateTaskAsync(Guid userId, Guid taskId)
    {
        var plan = await _context.DailyPlans
            .Include(p => p.Tasks)
            .FirstOrDefaultAsync(p => p.SalesId == userId && p.Date.Date == DateTime.UtcNow.Date);

        if (plan == null)
            throw new InvalidOperationException("Plan not found");

        var task = plan.Tasks.FirstOrDefault(t => t.Id == taskId);
        if (task == null)
            throw new InvalidOperationException("Task not found");

        plan.ActiveTaskId = taskId;
        task.Status = PlanTaskStatus.IN_PROGRESS;

        await _context.SaveChangesAsync();
        return MapToDto(task);
    }

    public async Task<CapacityInfo> GetCapacityAsync(Guid userId)
    {
        return await _capacityCalculator.CalculateCapacityAsync(userId);
    }

    public async Task<CapacityInfo> UpdateCapacityAsync(Guid userId, CapacityUpdateRequest request)
    {
        var settings = await _capacityCalculator.GetOrCreateSettingsAsync(userId);
        settings.CapacityMultiplierOverride = request.CapacityMultiplierOverride;
        settings.PreferredStartTime = request.PreferredStartTime;
        await _context.SaveChangesAsync();
        return await _capacityCalculator.CalculateCapacityAsync(userId);
    }

    public async Task<TeamDailyPlanResponse> GetTeamPlansAsync(Guid managerId, DateTime date)
    {
        var teamSales = await _userRepo.FindAsync(u => u.ManagerId == managerId);
        var teamPlans = new List<TeamMemberPlanDto>();

        foreach (var sales in teamSales)
        {
            var plan = await GetDailyPlanAsync(sales.Id, date);
            var activeTask = plan.MustDo.Concat(plan.ShouldDo).FirstOrDefault(t => t.Id == plan.ActiveTaskId);

            ActiveTaskDto? activeTaskDto = null;
            if (activeTask != null)
            {
                var doctorName = activeTask.DoctorName;
                var startedAt = activeTask.ActualStart;
                activeTaskDto = new ActiveTaskDto { Task = $"Call {doctorName}", StartedAt = startedAt };
            }

            teamPlans.Add(new TeamMemberPlanDto
            {
                SalesId = sales.Id,
                SalesName = sales.FullName,
                PlanStatus = plan.Status,
                ActiveTask = activeTaskDto,
                Completed = plan.MustDo.Count(t => t.Status == "COMPLETED_AUTO" || t.Status == "COMPLETED_MANUAL"),
                MustDo = plan.MustDo.Count,
                OverdueCount = plan.MustDo.Count(t => t.DelayMinutes > 0),
                LastActivityAt = DateTime.UtcNow
            });
        }

        return new TeamDailyPlanResponse
        {
            Date = date,
            TeamPlans = teamPlans,
            Summary = new TeamSummaryDto
            {
                TeamOnTrack = teamPlans.Count(p => p.PlanStatus == "ON_TRACK"),
                TeamOffTrack = teamPlans.Count(p => p.PlanStatus == "OFF_TRACK"),
                TeamNotStarted = teamPlans.Count(p => p.PlanStatus == "NOT_STARTED"),
                TotalCompleted = teamPlans.Sum(p => p.Completed),
                TotalMustDo = teamPlans.Sum(p => p.MustDo)
            }
        };
    }
}