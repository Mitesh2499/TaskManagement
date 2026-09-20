using System.Text.Json.Serialization;

namespace TaskManagementAPI.Dtos;

/// <summary>
/// The single, consistent shape every error response uses — validation failures,
/// auth failures, not-found, and unhandled exceptions all come back looking like this
/// so the frontend only ever needs one error-handling code path.
/// </summary>
public class ApiErrorResponse
{
    public bool Success { get; init; } = false;
    public int StatusCode { get; init; }
    public string Message { get; init; } = string.Empty;
    public IDictionary<string, string[]>? Errors { get; init; }
    public string TraceId { get; init; } = string.Empty;

    // Development-only debugging aid; never populated outside Development, so it's
    // omitted from the JSON entirely in every other environment.
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public object? Debug { get; init; }
}
