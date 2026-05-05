using SalesSystem.DTOs.Request;
using SalesSystem.DTOs.Response;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SalesSystem.Services;

namespace SalesSystem.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class HospitalsController : ControllerBase
{
    private readonly IHospitalService _hospitalService;

    public HospitalsController(IHospitalService hospitalService)
    {
        _hospitalService = hospitalService;
    }

    [HttpGet]
    public async Task<ActionResult<List<HospitalResponse>>> GetHospitals()
    {
        var hospitals = await _hospitalService.GetAllHospitalsAsync();
        return Ok(hospitals);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<HospitalResponse>> GetHospital(Guid id)
    {
        var hospital = await _hospitalService.GetHospitalByIdAsync(id);
        if (hospital == null)
            return NotFound(new { message = "Hospital not found" });

        return Ok(hospital);
    }

    [HttpPost]
    [Authorize(Roles = "Admin,SalesManager")]
    public async Task<ActionResult<HospitalResponse>> CreateHospital([FromBody] CreateHospitalRequest request)
    {
        var hospital = await _hospitalService.CreateHospitalAsync(request);
        return CreatedAtAction(nameof(GetHospital), new { id = hospital.Id }, hospital);
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Admin,SalesManager")]
    public async Task<ActionResult<HospitalResponse>> UpdateHospital(Guid id, [FromBody] CreateHospitalRequest request)
    {
        var success = await _hospitalService.UpdateHospitalAsync(id, request);
        if (!success)
            return NotFound(new { message = "Hospital not found" });

        return NoContent();
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult> DeleteHospital(Guid id)
    {
        var success = await _hospitalService.DeleteHospitalAsync(id);
        if (!success)
            return NotFound(new { message = "Hospital not found" });

        return NoContent();
    }
}