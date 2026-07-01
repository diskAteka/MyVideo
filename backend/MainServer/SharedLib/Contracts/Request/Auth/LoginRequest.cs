using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace SharedLib.Contracts.Request.Auth
{
    public class LoginRequest
    {
        public string? Email { get; set; }
        [JsonPropertyName("username")]
        public string? Username { get; set; }
        [Required(ErrorMessage = "Пароль обязателен")]
        [MinLength(6, ErrorMessage = "Пароль минимум 6 символов")]
        public string Password { get; set; } = string.Empty;
    }
}
