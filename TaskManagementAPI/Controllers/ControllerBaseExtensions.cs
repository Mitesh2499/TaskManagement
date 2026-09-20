using Microsoft.AspNetCore.Mvc;
using TaskManagementAPI.Dtos;

namespace TaskManagementAPI.Controllers;

public static class ControllerBaseExtensions
{
    /// <summary>
    /// Builds an ApiErrorResponse-wrapped result so every hand-written error path
    /// (not-found, unauthorized, etc.) matches the envelope validation and the
    /// global exception handler already return.
    /// </summary>
    public static ObjectResult ApiError(
        this ControllerBase controller,
        int statusCode,
        string message,
        IDictionary<string, string[]>? errors = null)
    {
        var response = new ApiErrorResponse
        {
            Success = false,
            StatusCode = statusCode,
            Message = message,
            Errors = errors,
            TraceId = controller.HttpContext.TraceIdentifier
        };

        return new ObjectResult(response) { StatusCode = statusCode };
    }
}
