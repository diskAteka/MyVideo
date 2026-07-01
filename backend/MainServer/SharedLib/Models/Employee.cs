using SharedLib.Interfaces;

namespace SharedLib.Models
{
    public partial class Employee : IModel, IDeleteble, IUpdateble, IAddble
    {
        public int Id { get; set; }

        public string UserName { get; set; } = null!;

        public string Password { get; set; } = null!;

        public string Role { get; set; } = null!;

        public virtual ICollection<ServerLog> ServerLogs { get; set; } = new List<ServerLog>();
    }
}


