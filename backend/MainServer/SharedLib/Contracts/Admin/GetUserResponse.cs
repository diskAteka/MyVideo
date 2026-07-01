namespace SharedLib.Contracts.Admin
{
    public class GetUserResponse
    {
        public int Id { get; set; }

        public string Name { get; set; } = null!;

        public string Email { get; set; } = null!;

        public bool CanUpload { get; set; }

        public DateTime RegisteredAt { get; set; }

        public bool IsActive { get; set; }
    }

    public class PutUserRequest
    {
        public string Name { get; set; } = null!;

        public string Email { get; set; } = null!;

        public bool CanUpload { get; set; }

        public DateTime RegisteredAt { get; set; }

        public bool IsActive { get; set; }
    }
}
