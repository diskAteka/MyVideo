namespace SharedLib.Contracts.Admin
{
    public class GetViewResponse
    {
        public int Id { get; set; }

        public int VideoId { get; set; }

        public int UserId { get; set; }
    }

    public class PostViewRequest
    {
        public int VideoId { get; set; }
        public int UserId { get; set; }
    }
}
