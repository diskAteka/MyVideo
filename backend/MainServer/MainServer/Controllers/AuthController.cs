using MainServer.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SharedLib.Contracts.Request.Auth;
using SharedLib.Contracts.Response.Auth;
using System.Security.Claims;

namespace MainServer.Controllers
{
    [ApiController]
    [Route("api/auth")]
    [ApiExplorerSettings(GroupName = "v1")]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;

        public AuthController(IAuthService authService)
        {
            _authService = authService;
        }

        [HttpPost("register")]
        [ProducesResponseType(typeof(TokenResponse), StatusCodes.Status200OK)]
        public async Task<IActionResult> Register([FromBody] RegisterRequest request)
        {
            TokenResponse result = await _authService.RegisterAsync(request);
            return Ok(result);
        }

        [HttpPost("login")]
        [ProducesResponseType(typeof(TokenResponse), StatusCodes.Status200OK)]
        public async Task<IActionResult> Login([FromBody] LoginRequest request)
        {
            TokenResponse result = await _authService.LoginAsync(request);
            return Ok(result);
        }

        [HttpGet("me")]
        [Authorize]
        [ProducesResponseType(typeof(MeResponse), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetMe()
        {
            var nameIdentifier = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(nameIdentifier))
                return Unauthorized(new { message = "Не удалось определить идентификатор пользователя." });

            int id = int.Parse(nameIdentifier);
            MeResponse result = await _authService.GetMeAsync(id);
            return Ok(result);
        }
    }
}