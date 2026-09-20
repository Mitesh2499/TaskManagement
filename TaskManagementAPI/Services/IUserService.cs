using TaskManagementAPI.Dtos;

namespace TaskManagementAPI.Services;

public interface IUserService
{
    Task<IEnumerable<UserDto>> GetUsersAsync();
}
