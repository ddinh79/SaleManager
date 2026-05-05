using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SalesSystem.DTOs.Request;
using SalesSystem.DTOs.Response;
using SalesSystem.Services;

namespace SalesSystem.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class TranslationsController : ControllerBase
{
    private readonly ITranslationService _service;

    public TranslationsController(ITranslationService service)
    {
        _service = service;
    }

    private Guid GetCurrentUserId()
    {
        var claim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(claim) || !Guid.TryParse(claim, out var userId))
            throw new UnauthorizedAccessException("Invalid user token");
        return userId;
    }

    [HttpGet]
    public async Task<ActionResult<I18nResponse>> GetTranslations([FromQuery] string locale, [FromQuery] string? ns = null)
    {
        if (string.IsNullOrEmpty(locale))
            return BadRequest("locale is required");

        var result = await _service.GetTranslationsAsync(locale, ns);
        if (result == null)
            return NotFound();

        return Ok(result);
    }

    [HttpGet("keys")]
    public async Task<ActionResult<TranslationKeyListResponse>> GetKeys()
    {
        var result = await _service.GetKeysAsync();
        return Ok(result);
    }

    [HttpGet("missing")]
    public async Task<ActionResult<List<TranslationKeyResponse>>> GetMissing([FromQuery] string locale)
    {
        var result = await _service.GetMissingKeysAsync(locale);
        return Ok(result);
    }

    [HttpPut("{key}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<TranslationUpdateResponse>> UpdateTranslation(string key, [FromBody] UpdateTranslationRequest request)
    {
        try
        {
            var result = await _service.UpdateTranslationAsync(key, request.Locale, request.Value, request.ExpectedVersion, GetCurrentUserId());
            if (result == null)
                return NotFound($"Key '{key}' not found");

            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            if (ex.Message.Contains("version"))
                return Conflict(ex.Message);
            return BadRequest(ex.Message);
        }
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<TranslationKeyResponse>> CreateKey([FromBody] CreateTranslationRequest request)
    {
        try
        {
            var result = await _service.CreateKeyAsync(request.Key, request.Category, request.Description, request.InitialValues, GetCurrentUserId());
            return CreatedAtAction(nameof(GetKeys), result);
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(ex.Message);
        }
    }

    [HttpPost("bulk")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<BulkUpdateResponse>> BulkUpdate([FromBody] BulkTranslationRequest request)
    {
        try
        {
            var result = await _service.BulkUpdateAsync(request.Locale, request.Changes, GetCurrentUserId());
            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpDelete("{key}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult> DeleteKey(string key)
    {
        await _service.SoftDeleteKeyAsync(key);
        return NoContent();
    }

    [HttpPost("missing-log")]
    public async Task<ActionResult> LogMissing([FromBody] MissingKeyLogRequest request)
    {
        await _service.LogMissingKeyAsync(request.Key, request.Locale);
        return NoContent();
    }
}