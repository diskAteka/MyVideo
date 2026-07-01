using SharedLib.Contracts.Response.Video;

namespace SharedLib.Contracts.Response.Auth
{
    public class TokenResponse
    {
        public string? Token { get; set; }
        public UserResponse? User { get; set; }
    }
}
