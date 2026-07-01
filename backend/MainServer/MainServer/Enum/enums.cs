using SharedLib.Models;

namespace MainServer.Enum
{
    public enum Tables
    {
        User,
        Comment,
        Video,
        ServerLog
    }

    public enum ErrorType
    {
        NotFound,       // 404
        ValidationError,// 400  
        Unauthorized,   // 401
        Forbidden,      // 403
        Conflict,       // 409
        ServerError     // 500
    }

    public enum UserRole
    {
        Admin,
        Virifier
    }

    public enum AdminTables
    {
        User,
        Comment,
        Video,
        ServerLog,
        Dislike,
        Like,
        View,
        Employee
    }

    public enum FerifierTables
    {
        User,
        Comment,
        Video,
        Dislike,
        Like,
        View
    }

    public static class TableToClassMapper
    {
        private static readonly Dictionary<string, Type> tableToClassMap = new()
        {
            { "User", typeof(User) },
            { "Comment", typeof(Comment) },
            { "Video", typeof(Video) },
            { "ServerLog", typeof(ServerLog) },
            { "Dislike", typeof(Dislike) },
            { "Like", typeof(Like) },
            { "View", typeof(View) },
            { "Employee", typeof(Employee) }
        };

        public static Dictionary<string, Type> TableToClassMap => tableToClassMap;
    }
}
