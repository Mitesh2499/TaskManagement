using Microsoft.AspNetCore.Diagnostics;
using Microsoft.Data.SqlClient;
using TaskManagementAPI.Dtos;
using TaskManagementAPI.Services;

namespace TaskManagementAPI;

/// <summary>
/// Catches every otherwise-unhandled exception and turns it into the same ApiErrorResponse
/// envelope used everywhere else in the API, instead of a raw stack trace or a bare 500.
/// </summary>
public class GlobalExceptionHandler : IExceptionHandler
{
    private readonly ILogger<GlobalExceptionHandler> _logger;
    private readonly IHostEnvironment _environment;

    public GlobalExceptionHandler(ILogger<GlobalExceptionHandler> logger, IHostEnvironment environment)
    {
        _logger = logger;
        _environment = environment;
    }

    public async ValueTask<bool> TryHandleAsync(
        HttpContext httpContext,
        Exception exception,
        CancellationToken cancellationToken)
    {
        var (status, message, logLevel) = Classify(exception);

        _logger.Log(logLevel, exception, "Handled exception ({Status}) processing {Method} {Path}",
            status, httpContext.Request.Method, httpContext.Request.Path);

        var response = new ApiErrorResponse
        {
            Success = false,
            StatusCode = status,
            Message = message,
            TraceId = httpContext.TraceIdentifier,
            // Only leak raw exception info in Development — production/frontend only ever
            // sees the friendly message above.
            Debug = _environment.IsDevelopment()
                ? new { exception = exception.GetType().Name, exceptionMessage = exception.Message }
                : null
        };

        httpContext.Response.StatusCode = status;
        httpContext.Response.ContentType = "application/json";
        await httpContext.Response.WriteAsJsonAsync(response, cancellationToken);

        return true;
    }

    private static (int Status, string Message, LogLevel LogLevel) Classify(Exception exception) =>
        exception switch
        {
            EmailAlreadyExistsException => (
                StatusCodes.Status409Conflict,
                exception.Message,
                LogLevel.Information),

            JwtConfigurationException => (
                StatusCodes.Status500InternalServerError,
                "Authentication is misconfigured on the server. Please contact support.",
                LogLevel.Critical),

            UnauthorizedAccessException => (
                StatusCodes.Status401Unauthorized,
                "You are not authorized to perform this action.",
                LogLevel.Information),

            KeyNotFoundException => (
                StatusCodes.Status404NotFound,
                "The requested resource could not be found.",
                LogLevel.Information),

            ArgumentException or FormatException => (
                StatusCodes.Status400BadRequest,
                exception.Message,
                LogLevel.Information),

            SqlException or TimeoutException => (
                StatusCodes.Status503ServiceUnavailable,
                "The database could not be reached. Please try again shortly.",
                LogLevel.Error),

            _ => (
                StatusCodes.Status500InternalServerError,
                "Something went wrong on our end. If this keeps happening, please contact support and include the trace ID below.",
                LogLevel.Error)
        };
}
