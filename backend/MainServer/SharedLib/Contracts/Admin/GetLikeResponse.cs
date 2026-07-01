
namespace SharedLib.Contracts.Admin
{
    public class GetLikeResponse
    {
        public int Id { get; set; }

        public int VideoId { get; set; }

        public int UserId { get; set; }
    }

    public class PostLikeRequest
    {
        public int VideoId { get; set; }
        public int UserId { get; set; }
    }
}
