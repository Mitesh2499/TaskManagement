using TaskManagementAPI.Dtos;

namespace TaskManagementAPI.Services;

public class EmailAlreadyExistsException : Exception
{
    public EmailAlreadyExistsException(string email) : base($"An account with email '{email}' already exists.")
    {
    }
}

public interface IAuthService
{
    Task<AuthResponse> RegisterAsync(RegisterRequest request);
    Task<AuthResponse?> LoginAsync(LoginRequest request);
}
