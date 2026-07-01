namespace SharedLib.Contracts.Response.Auth
{
    public class RegisterResponse
    {
        public bool Success { get; set; }
        public string? Message {  get; set; }
        public static RegisterResponse Ok(string ex = "Регистрация выполнена успешно")
        {
            RegisterResponse dto = new RegisterResponse
            {
                Success = true,
                Message = ex
            };
            return dto;
        }
    }
}
