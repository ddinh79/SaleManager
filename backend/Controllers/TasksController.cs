using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SalesSystem.DTOs;
using SalesSystem.Helpers;
using SalesSystem.Services;

namespace SalesSystem.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class TasksController : ControllerBase
{
    private readonly ITaskService _taskService;

    public TasksController(ITaskService taskService)
    {
        _taskService = taskService;
    }

    [HttpGet]
    public async Task<ActionResult<TasksResponse>> GetTasks(
        [FromQuery] TaskFilter filter = TaskFilter.ALL)
    {
        var userId = JwtHelper.GetUserIdFromToken(User);
        if (userId == null)
            return Unauthorized();

        var result = await _taskService.GetTasksAsync(userId.Value, filter);
        return Ok(result);
    }

    [HttpPost("{taskId}/snooze")]
    public async Task<ActionResult> SnoozeTask(
        Guid taskId,
        [FromBody] SnoozeRequest request)
    {
        var userId = JwtHelper.GetUserIdFromToken(User);
        if (userId == null)
            return Unauthorized();

        // Determine task type from query or body
        var taskType = Request.Query["type"].ToString() ?? "FOLLOW_UP";
        var success = await _taskService.SnoozeTaskAsync(taskId, taskType, request.Days);
        if (!success)
            return NotFound();

        return Ok();
    }

    [HttpPost("{taskId}/complete")]
    public async Task<ActionResult> CompleteTask(Guid taskId)
    {
        var userId = JwtHelper.GetUserIdFromToken(User);
        if (userId == null)
            return Unauthorized();

        var taskType = Request.Query["type"].ToString() ?? "FOLLOW_UP";
        var success = await _taskService.CompleteTaskAsync(taskId, taskType);
        if (!success)
            return NotFound();

        return Ok();
    }
}