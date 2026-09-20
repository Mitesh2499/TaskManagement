using System.ComponentModel.DataAnnotations;

namespace TaskManagementAPI.Dtos;

public class RegisterRequest
{
    [Required(ErrorMessage = "Name is required.")]
    [MaxLength(100, ErrorMessage = "Name must be at most 100 characters.")]
    public string Name { get; set; } = string.Empty;

    [Required(ErrorMessage = "Email is required.")]
    [EmailAddress(ErrorMessage = "A valid email address is required.")]
    [MaxLength(256)]
    public string Email { get; set; } = string.Empty;

    [Required(ErrorMessage = "Password is required.")]
    [MinLength(8, ErrorMessage = "Password must be at least 8 characters long.")]
    // BCrypt only hashes the first 72 bytes of its input and silently ignores the rest, so two
    // different passwords sharing a 72-byte prefix would otherwise hash identically — reject
    // anything past that limit instead of accepting a password that isn't fully honored.
    [MaxLength(72, ErrorMessage = "Password must be at most 72 characters.")]
    public string Password { get; set; } = string.Empty;
}

public class LoginRequest
{
    [Required(ErrorMessage = "Email is required.")]
    [EmailAddress(ErrorMessage = "A valid email address is required.")]
    [MaxLength(256)]
    public string Email { get; set; } = string.Empty;

    [Required(ErrorMessage = "Password is required.")]
    // Not a correctness requirement here (unlike RegisterRequest — this only compares against
    // an already-truncated hash), just a sane cap so an oversized payload can't be used to load
    // extra work onto the bcrypt comparison.
    [MaxLength(256, ErrorMessage = "Password is too long.")]
    public string Password { get; set; } = string.Empty;
}

public class AuthResponse
{
    public string Token { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public DateTime ExpiresAt { get; set; }
}
