namespace SharedLib.Contracts.Admin
{
    public class GetDislikeResponse
    {
        public int Id { get; set; }

        public int VideoId { get; set; }

        public int UserId { get; set; }
    }

    public class PostDislikeRequest
    {
        public int VideoId { get; set; }
        public int UserId { get; set; }
    }
}
