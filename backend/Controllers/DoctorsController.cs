using SalesSystem.DTOs.Request;
using SalesSystem.DTOs.Response;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SalesSystem.Helpers;
using SalesSystem.Services;

namespace backend.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class DoctorsController : ControllerBase
{
    private readonly IDoctorService _doctorService;

    public DoctorsController(IDoctorService doctorService)
    {
        _doctorService = doctorService;
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
}

public class AssignDoctorRequest
{
    public Guid? SalesId { get; set; }
}