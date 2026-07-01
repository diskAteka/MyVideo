using SharedLib.Interfaces;


namespace SharedLib.Models
{
    public partial class View : IModel, IDeleteble, IUpdateble, IAddble
    {
        public int Id { get; set; }

        public int VideoId { get; set; }

        public int UserId { get; set; }

        public virtual User User { get; set; } = null!;

        public virtual Video Video { get; set; } = null!;
    }
}
