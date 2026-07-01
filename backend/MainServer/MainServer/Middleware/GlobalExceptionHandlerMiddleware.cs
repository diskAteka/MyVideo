using MainServer.Enum;
using MainServer.Services.Main;
using Microsoft.AspNetCore.Diagnostics;
using System.Net;

namespace MainServer.Middleware;

public static class GlobalExceptionHandlerMiddleware
{
    public static IApplicationBuilder UseGlobalExceptionHandler(this IApplicationBuilder app)
    {
        return app.UseExceptionHandler(handler =>
        {
            handler.Run(async context =>
            {
                var feature = context.Features.Get<IExceptionHandlerFeature>();
                var exception = feature?.Error;
                var (statusCode, errorType, message) = MapException(exception);
                context.Response.StatusCode = statusCode;
                context.Response.ContentType = "application/json";
                var env = context.RequestServices.GetService<IWebHostEnvironment>();

                if (env?.IsDevelopment() == true && statusCode == 500)
                {
                    await context.Response.WriteAsJsonAsync(new
                    {
                        ErrorType = errorType,
                        Message = message,
                        Timestamp = DateTime.UtcNow,
                        TraceId = context.TraceIdentifier,
                        Exception = exception?.ToString()
                    });
                }
                else
                {
                    await context.Response.WriteAsJsonAsync(new
                    {
                        ErrorType = errorType,
                        Message = message,
                        Timestamp = DateTime.UtcNow,
                        TraceId = context.TraceIdentifier
                    });
                }
            });
        });
    }

    private static (int StatusCode, string ErrorType, string Message) MapException(Exception? exception)
    {
        if (exception is ApiException apiException)
        {
            return (
                ApiException.GetStatusCode(apiException.ErrorType),
                apiException.ErrorType.ToString(),
                apiException.Message
            );
        }

        if (exception != null)
        {
            var logger = LoggerFactory.Create(builder => builder.AddConsole())
                .CreateLogger("GlobalExceptionHandler");
            logger.LogError(exception, "Unhandled exception");
        }

        return (
            (int)HttpStatusCode.InternalServerError,
            ErrorType.ServerError.ToString(),
            "Internal Server Error"
        );
    }
}