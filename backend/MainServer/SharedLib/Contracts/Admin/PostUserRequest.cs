using System.ComponentModel.DataAnnotations;

namespace SharedLib.Contracts.Admin
{
    public class PostUserRequest
    {
        [Required, MinLength(3), MaxLength(50)] public string UserName { get; set; } = string.Empty;
        [Required, EmailAddress] public string Email { get; set; } = string.Empty;
        [Required, MinLength(6), MaxLength(16)] public string Password { get; set; } = string.Empty;
        [Required] public DateTime RegisteredAt { get; set; } = DateTime.UtcNow;
        [Required] public bool IsActive { get; set; } = true;
        [Required] public bool CanUpload { get; set; } = false;
    }
}
