using SalesSystem.DTOs.Request;
using SalesSystem.DTOs.Response;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SalesSystem.Helpers;
using SalesSystem.Services;
using SalesSystem.Entities;
using SalesSystem.Repositories;

namespace backend.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class DoctorsController : ControllerBase
{
    private readonly IDoctorService _doctorService;
    private readonly IDoctorRepository _doctorRepo;

    public DoctorsController(IDoctorService doctorService, IDoctorRepository doctorRepo)
    {
        _doctorService = doctorService;
        _doctorRepo = doctorRepo;
    }

    [HttpGet]
    public async Task<ActionResult<PaginatedResponse<DoctorResponse>>> GetDoctors(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] string? search = null,
        [FromQuery] string? potentialLevel = null,
        [FromQuery] Guid? hospitalId = null)
    {
        var result = await _doctorService.GetDoctorsAsync(page, pageSize, search, potentialLevel, hospitalId);
        return Ok(result);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<DoctorResponse>> GetDoctor(Guid id)
    {
        var doctor = await _doctorService.GetDoctorByIdAsync(id);
        if (doctor == null)
            return NotFound(new { message = "Doctor not found" });

        return Ok(doctor);
    }

    [HttpPost]
    [Authorize(Roles = "Admin,SalesManager,SalesMember")]
    public async Task<ActionResult<DoctorResponse>> CreateDoctor([FromBody] CreateDoctorRequest request)
    {
        try
        {
            var doctor = await _doctorService.CreateDoctorAsync(request);
            return CreatedAtAction(nameof(GetDoctor), new { id = doctor.Id }, doctor);
        }
        catch (InvalidOperationException ex) when (ex.Message.Contains("already exists"))
        {
            return Conflict(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<DoctorResponse>> UpdateDoctor(Guid id, [FromBody] UpdateDoctorRequest request)
    {
        try
        {
            var success = await _doctorService.UpdateDoctorAsync(id, request);
            if (!success)
                return NotFound(new { message = "Doctor not found" });

            return NoContent();
        }
        catch (InvalidOperationException ex) when (ex.Message.Contains("already exists"))
        {
            return Conflict(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin,SalesManager")]
    public async Task<ActionResult> DeleteDoctor(Guid id)
    {
        var success = await _doctorService.DeleteDoctorAsync(id);
        if (!success)
            return NotFound(new { message = "Doctor not found" });

        return NoContent();
    }

    [HttpGet("assigned")]
    public async Task<ActionResult<List<DoctorResponse>>> GetAssignedDoctors()
    {
        var userId = JwtHelper.GetUserIdFromToken(User);
        if (userId == null)
            return Unauthorized(new { message = "Invalid token" });

        var doctors = await _doctorService.GetAssignedDoctorsAsync(userId.Value);
        return Ok(doctors);
    }

    [HttpPut("{id}/assign")]
    [Authorize(Roles = "Admin,SalesManager")]
    public async Task<ActionResult> AssignDoctor(Guid id, [FromBody] AssignDoctorRequest request)
    {
        var success = await _doctorService.AssignDoctorToSalesAsync(id, request.SalesId);
        if (!success)
            return NotFound(new { message = "Doctor not found" });

        return NoContent();
    }

    [HttpPost("{id}/temperature")]
    public async Task<ActionResult> UpdateTemperature(Guid id, [FromBody] UpdateTemperatureRequest request)
    {
        var doctor = await _doctorRepo.GetByIdAsync(id);
        if (doctor == null) return NotFound();

        if (Enum.TryParse<Temperature>(request.Temperature, true, out var temp))
        {
            doctor.Temperature = temp;
            await _doctorRepo.UpdateAsync(doctor);
            return Ok();
        }

        return BadRequest("Invalid temperature value");
    }

    [HttpPost("{id}/snooze")]
    public async Task<ActionResult> SnoozeTask(Guid id, [FromBody] SnoozeRequest request)
    {
        var doctor = await _doctorRepo.GetByIdAsync(id);
        if (doctor == null) return NotFound();

        if (doctor.NextFollowUpAt.HasValue)
        {
            doctor.NextFollowUpAt = doctor.NextFollowUpAt.Value.AddDays(request.Days);
            await _doctorRepo.UpdateAsync(doctor);
            return Ok();
        }

        return BadRequest("No task to snooze");
    }
}

public class AssignDoctorRequest
{
    public Guid? SalesId { get; set; }
}

public class UpdateTemperatureRequest
{
    public string Temperature { get; set; } = string.Empty;
}

public class SnoozeRequest
{
    public int Days { get; set; }
}