
using SharedLib.Interfaces;


namespace SharedLib.Models
{
    public partial class ServerLog : IModel, IAddble
    {
        public int Id { get; set; }

        public string Text { get; set; } = null!;

        public string AffectedTable { get; set; } = null!;

        public string ActionType { get; set; } = null!;

        public int EmployeeId { get; set; }

        public DateTime Date { get; set; }

        public virtual Employee Employee { get; set; } = null!;
    }
}
