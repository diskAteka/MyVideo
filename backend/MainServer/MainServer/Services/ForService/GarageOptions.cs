namespace MainServer.Services.ForService
{
    public class GarageOptions
    {
        public const string Section = "Garage";

        public string Endpoint { get; set; } = string.Empty;
        public string AccessKey { get; set; } = string.Empty;
        public string SecretKey { get; set; } = string.Empty;
        public string BucketName { get; set; } = string.Empty;
        public string VideoPrefix { get; set; } = "videos/";
        public string PosterPrefix { get; set; } = "posters/";
    }
}
