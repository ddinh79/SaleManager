using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SalesSystem.Entities;
using SalesSystem.Repositories;

namespace SalesSystem.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class TasksController : ControllerBase
{
    private readonly IDoctorRepository _doctorRepo;
    private readonly IActivityRepository _activityRepo;

    public TasksController(IDoctorRepository doctorRepo, IActivityRepository activityRepo)
    {
        _doctorRepo = doctorRepo;
        _activityRepo = activityRepo;
    }

    [HttpGet("today")]
    public async Task<ActionResult<List<TaskDto>>> GetTodayTasks()
    {
        var salesId = GetCurrentUserId();
        var role = User.FindFirst(ClaimTypes.Role)?.Value;

        var doctors = (role == "Admin"
            ? await _doctorRepo.GetAllAsync()
            : await _doctorRepo.GetAllAsync()).ToList();

        var today = DateTime.UtcNow.Date;
        var tomorrow = today.AddDays(1);

        var tasks = new List<TaskDto>();

        foreach (var doctor in doctors)
        {
            if (doctor.NextFollowUpAt.HasValue && doctor.NextFollowUpAt.Value < tomorrow)
            {
                var lastActivity = await _activityRepo.GetByDoctorIdAsync(doctor.Id);
                var latestActivity = lastActivity.FirstOrDefault();

                tasks.Add(new TaskDto
                {
                    DoctorId = doctor.Id,
                    DoctorName = doctor.Name,
                    Temperature = doctor.Temperature.ToString(),
                    LastActivityAt = doctor.LastActivityAt,
                    NextFollowUpAt = doctor.NextFollowUpAt.Value,
                    IsOverdue = doctor.NextFollowUpAt.Value < today,
                    LastActivityType = latestActivity?.Type.ToString()
                });
            }
        }

        var sorted = tasks
            .OrderByDescending(t => t.IsOverdue)
            .ThenBy(t => t.NextFollowUpAt)
            .ToList();

        return Ok(sorted);
    }

    private Guid GetCurrentUserId()
    {
        var claim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return Guid.Parse(claim ?? throw new UnauthorizedAccessException());
    }
}

public class TaskDto
{
    public Guid DoctorId { get; set; }
    public string DoctorName { get; set; } = string.Empty;
    public string Temperature { get; set; } = string.Empty;
    public DateTime? LastActivityAt { get; set; }
    public DateTime NextFollowUpAt { get; set; }
    public bool IsOverdue { get; set; }
    public string? LastActivityType { get; set; }
}