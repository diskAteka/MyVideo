using MainServer.Enum;

namespace MainServer.Services.Main
{
    public class ApiException : Exception
    {
        public ErrorType ErrorType { get; }

        public ApiException(ErrorType type, string message) : base (message)
        {
            ErrorType = type;
        }

        public static int GetStatusCode(ErrorType type)
        {
            switch (type)
            {
                case ErrorType.NotFound:
                    return 404;
                case ErrorType.ValidationError:
                    return 400;
                case ErrorType.Unauthorized:
                    return 401;
                case ErrorType.Forbidden:
                    return 403;
                case ErrorType.Conflict:
                    return 409;
                default:
                    return 500;
            }
        }
    }
}
