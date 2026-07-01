namespace SharedLib.Contracts.Response.Auth
{
    public class LogoutResultDto
    {
        public bool Success { get; set; }
        public string? Ex { get; set; }

        public static LogoutResultDto Ok(string message = "Выход выполнен успешно")
        {
            return new LogoutResultDto { Success = true, Ex = message };
        }

        public static LogoutResultDto Fail(string message)
        {
            return new LogoutResultDto { Success = false, Ex = message };
        }
    }
}
