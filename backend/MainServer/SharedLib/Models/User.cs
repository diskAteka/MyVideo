using SharedLib.Interfaces;


namespace SharedLib.Models
{
    public partial class User : IModel, IDeleteble, IUpdateble , IAddble
    {
        public int Id { get; set; }

        public string Name { get; set; } = null!;

        public string PasswordHash { get; set; } = null!;

        public string Email { get; set; } = null!;

        public bool CanUpload { get; set; }

        public string PasswordSalt { get; set; } = null!;

        public DateTime RegisteredAt { get; set; }

        public bool IsActive { get; set; }

        public virtual ICollection<Comment> Comments { get; set; } = new List<Comment>();

        public virtual ICollection<Dislike> Dislikes { get; set; } = new List<Dislike>();

        public virtual ICollection<Like> Likes { get; set; } = new List<Like>();

        public virtual ICollection<ServerLog> ServerLogs { get; set; } = new List<ServerLog>();

        public virtual ICollection<Video> Videos { get; set; } = new List<Video>();

        public virtual ICollection<View> Views { get; set; } = new List<View>();
    }
}
