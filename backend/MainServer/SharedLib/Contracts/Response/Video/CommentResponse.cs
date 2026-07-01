namespace SharedLib.Contracts.Response.Video
{
    public class CommentResponse
    {
        public int AuthorId { get; set; }
        public string? AuthorName { get; set; }
        public string? Text { get; set; }
        public DateTime CreatedAt { get; set; }

    }
}
