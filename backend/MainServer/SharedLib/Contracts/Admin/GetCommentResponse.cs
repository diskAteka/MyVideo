namespace SharedLib.Contracts.Admin
{
    public class GetCommentResponse
    {
        public int Id { get; set; }

        public int VideoId { get; set; }

        public int UserId { get; set; }

        public string Text { get; set; } = null!;

        public DateTime Date { get; set; }
    }

    public class PostPutCommentRequest
    {
        public int VideoId { get; set; }

        public int UserId { get; set; }

        public string Text { get; set; } = null!;

        public DateTime Date { get; set; }
    }
}
