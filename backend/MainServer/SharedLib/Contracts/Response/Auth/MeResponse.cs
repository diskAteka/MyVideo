namespace SharedLib.Contracts.Response.Auth
{
    public class MeResponse
    {
        public bool Success {  get; set; }
        public string? Message { get; set; }
        public string? Name { get; set; }
        public string? Email { get; set; }
        public bool CanUpload { get; set; }
        public bool IsActive { get; set; }
    }
}
