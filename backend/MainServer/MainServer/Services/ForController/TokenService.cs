using MainServer.Services.Main;
using Microsoft.IdentityModel.Tokens;
using SharedLib.Interfaces;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace MainServer.Services.ForController
{
    public class TokenService : ITokenService
    {
        private readonly JwtSettings _settings;
        private readonly SymmetricSecurityKey _securityKey;

        public TokenService(JwtSettings settings)
        {
            _settings = settings;
            _securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(settings.SecretKey));
        }

        public string GenerateToken(int userId, string userName, string email, bool canUpload)
        {
            List<Claim> claims =
            [
                new Claim(ClaimTypes.NameIdentifier, userId.ToString()),
                new Claim(ClaimTypes.Name, userName),
                new Claim(ClaimTypes.Email, email),
                new Claim("canUpload", canUpload.ToString())
            ];

            return GenerateJwtToken(claims);
        }

        public string GenerateEmployeeToken(int employeeId, string userName, string role)
        {
            List<Claim> claims =
            [
                new Claim(ClaimTypes.NameIdentifier, employeeId.ToString()),
                new Claim(ClaimTypes.Name, userName),
                new Claim(ClaimTypes.Role, role),
                new Claim("token_type", "employee") // Маркер типа токена
            ];

            return GenerateJwtToken(claims);
        }

        private string GenerateJwtToken(List<Claim> claims)
        {
            SigningCredentials credentials = new SigningCredentials(_securityKey, SecurityAlgorithms.HmacSha256);

            JwtSecurityToken token = new(
                issuer: _settings.Issuer,
                audience: _settings.Audience,
                claims: claims,
                expires: DateTime.UtcNow.AddHours(_settings.ExpiresHours),
                signingCredentials: credentials);

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        public ClaimsPrincipal ValidateToken(string token)
        {
            JwtSecurityTokenHandler tokenHandler = new JwtSecurityTokenHandler();
            TokenValidationParameters validationParameters = new TokenValidationParameters()
            {
                ValidateIssuer = true,
                ValidateAudience = true,
                ValidateLifetime = true,
                ValidateIssuerSigningKey = true,
                ValidIssuer = _settings.Issuer,
                ValidAudience = _settings.Audience,
                IssuerSigningKey = _securityKey
            };

            return tokenHandler.ValidateToken(token, validationParameters, out _);
        }

        public bool IsEmployeeToken(ClaimsPrincipal principal)
        {
            return principal.FindFirst("token_type")?.Value == "employee";
        }
    }
}