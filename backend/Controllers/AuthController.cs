using SalesSystem.DTOs.Request;
using SalesSystem.DTOs.Response;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SalesSystem.Helpers;
using SalesSystem.Services;

namespace backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;

    public AuthController(IAuthService authService)
    {
        _authService = authService;
    }

    [HttpPost("login")]
    public async Task<ActionResult<LoginResponse>> Login([FromBody] LoginRequest request)
    {
        var response = await _authService.LoginAsync(request);
        if (response == null)
            return Unauthorized(new { message = "Invalid username or password" });

        return Ok(response);
    }

    [Authorize]
    [HttpGet("me")]
    public async Task<ActionResult<UserResponse>> GetCurrentUser()
    {
        var userId = JwtHelper.GetUserIdFromToken(User);
        if (userId == null)
            return Unauthorized(new { message = "Invalid token" });

        var user = await _authService.GetCurrentUserAsync(userId.Value);
        if (user == null)
            return NotFound(new { message = "User not found" });

        return Ok(user);
    }
}