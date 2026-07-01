using System.Security.Claims;

namespace SharedLib.Interfaces
{
    public interface ITokenService
    {
        string GenerateToken(int userId, string userName, string email, bool canUpload);
        string GenerateEmployeeToken(int employeeId, string userName, string role);
        ClaimsPrincipal ValidateToken(string token);
        bool IsEmployeeToken(ClaimsPrincipal principal);
    }
}
