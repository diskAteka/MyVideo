namespace SharedLib.Contracts.Admin
{
    public class PostPutEmployeeRequest
    {
        public string UserName { get; set; } = null!;

        public string Password { get; set; } = null!;

        public string Role { get; set; } = null!;
    }
}
