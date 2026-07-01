namespace SharedLib.Contracts.Response.Video
{
    public class VideoListItemResponse
    {
        public int Id { get; set; }
        public string? Name { get; set; }
        public string? Poster { get; set; }
        public DateTime DateUpload { get; set; }
        public string? AuthorName {  get; set; }

    }
    public class UserVideoListItemDto
    {
        public int Id { get; set; }
        public string? Name { get; set; }
        public string? Poster { get; set; }
        public DateTime DateUpload { get; set; }
        public string? AuthorName { get; set; }
        public bool IsVerified { get; set; }
    }
}
