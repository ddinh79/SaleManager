using System.Security.Claims;
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
public class UsersController : ControllerBase
{
    private readonly IUserService _userService;

    public UsersController(IUserService userService)
    {
        _userService = userService;
    }

    [HttpGet]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<List<UserResponse>>> GetAllUsers()
    {
        var users = await _userService.GetAllUsersAsync();
        return Ok(users);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<UserResponse>> GetUser(Guid id)
    {
        var currentUserId = JwtHelper.GetUserIdFromToken(User);
        var currentUserRole = User.FindFirst(ClaimTypes.Role)?.Value;

        // SalesMember can only view own profile
        if (currentUserRole == "SalesMember" && currentUserId != id)
            return Forbid();

        var user = await _userService.GetUserByIdAsync(id);
        if (user == null)
            return NotFound(new { message = "User not found" });

        return Ok(user);
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<UserResponse>> Register([FromBody] RegisterRequest request)
    {
        try
        {
            var user = await _userService.RegisterAsync(request);
            return CreatedAtAction(nameof(GetUser), new { id = user.Id }, user);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<UserResponse>> UpdateUser(Guid id, [FromBody] UpdateUserRequest request)
    {
        var success = await _userService.UpdateUserAsync(id, request);
        if (!success)
            return NotFound(new { message = "User not found" });

        return NoContent();
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult> DeleteUser(Guid id)
    {
        var success = await _userService.DeleteUserAsync(id);
        if (!success)
            return NotFound(new { message = "User not found" });

        return NoContent();
    }

    [HttpGet("sales-members")]
    [Authorize(Roles = "Admin,SalesManager")]
    public async Task<ActionResult<List<UserResponse>>> GetSalesMembers()
    {
        var members = await _userService.GetSalesMembersAsync();
        return Ok(members);
    }

    [HttpGet("managers")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<List<UserResponse>>> GetManagers()
    {
        var managers = await _userService.GetManagersAsync();
        return Ok(managers);
    }
}