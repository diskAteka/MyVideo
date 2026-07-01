namespace SharedLib.Contracts.Request.Video
{
    public class CreateCommentRequest
    {
        public string? Text { get; set; }
    }

    public class CreateCommentResponse
    {
        public int UserId { get; set; }
        public string? Text { get; set; }
        public int VideoId { get; set; }
    }
}
