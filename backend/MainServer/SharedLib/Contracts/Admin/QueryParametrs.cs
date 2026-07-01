namespace SharedLib.Contracts.Admin
{
    public class QueryParameters
    {
        public int Page { get; set; } = 1;   
        public int PageSize { get; set; } = 20; 
        public string? SortBy { get; set; } = "Id"; 
        public bool SortAscending { get; set; } = true;
    }

    public class UserQueryParameters : QueryParameters
    {
        public int UserId { get; set; }
    }
}
