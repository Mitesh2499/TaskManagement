using TaskManagementAPI.Models;

namespace TaskManagementAPI.Services;

public interface ITokenService
{
    (string Token, DateTime ExpiresAt) CreateToken(User user);
}
