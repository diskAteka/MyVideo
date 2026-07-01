namespace SharedLib.Contracts.Response.Video
{
    public class VideoDetailsResponse
    {
        public int Id { get; set; }
        public string? Name { get; set; }
        public string? Description { get; set; }
        public DateTime DateUpload { get; set; }
        public string? Link { get; set; }
        public string? Poster { get; set; }
        public int Views { get; set; }
        public int Likes { get; set; }
        public int Dislikes { get; set; }
        public bool IsLiked { get; set; } = false;
        public bool IsDisLiked { get; set; } = false;
        public List<CommentResponse> Comments { get; set; } = [];
        public string? VideoUrl { get; set; }
        public string? PosterUrl { get; set; }
    }
}
