using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using TaskManagementAPI.Data;
using TaskManagementAPI.Dtos;
using TaskManagementAPI.Models;
using TaskManagementAPI.Services;
using TaskManagementAPI.Tests.TestSupport;

namespace TaskManagementAPI.Tests.Services;

public class AuthServiceTests
{
    private readonly AppDbContext _db;
    private readonly AuthService _sut;

    public AuthServiceTests()
    {
        _db = TestDb.CreateInMemory(nameof(AuthServiceTests));
        _sut = new AuthService(_db, new TokenService(TestConfig.CreateJwtConfig()));
    }

    [Fact]
    public async Task RegisterAsync_NewEmail_CreatesUserAndReturnsToken()
    {
        var response = await _sut.RegisterAsync(new RegisterRequest { Email = "New.User@Example.com", Password = "Password123!" });

        response.Token.Should().NotBeNullOrWhiteSpace();
        response.Email.Should().Be("new.user@example.com"); // normalized to lowercase
        (await _db.Users.CountAsync()).Should().Be(1);
    }

    [Fact]
    public async Task RegisterAsync_StoresHashedPassword_NeverPlainText()
    {
        await _sut.RegisterAsync(new RegisterRequest { Email = "user@example.com", Password = "Password123!" });

        var stored = await _db.Users.SingleAsync();
        stored.PasswordHash.Should().NotBe("Password123!");
        BCrypt.Net.BCrypt.Verify("Password123!", stored.PasswordHash).Should().BeTrue();
    }

    [Fact]
    public async Task RegisterAsync_DuplicateEmail_ThrowsEmailAlreadyExistsException()
    {
        await _sut.RegisterAsync(new RegisterRequest { Email = "user@example.com", Password = "Password123!" });

        var act = () => _sut.RegisterAsync(new RegisterRequest { Email = "USER@example.com", Password = "Different1!" });

        await act.Should().ThrowAsync<EmailAlreadyExistsException>();
        (await _db.Users.CountAsync()).Should().Be(1);
    }

    [Fact]
    public async Task LoginAsync_ValidCredentials_ReturnsToken()
    {
        await _sut.RegisterAsync(new RegisterRequest { Email = "user@example.com", Password = "Password123!" });

        var response = await _sut.LoginAsync(new LoginRequest { Email = "user@example.com", Password = "Password123!" });

        response.Should().NotBeNull();
        response!.Token.Should().NotBeNullOrWhiteSpace();
    }

    [Fact]
    public async Task LoginAsync_EmailIsCaseInsensitive()
    {
        await _sut.RegisterAsync(new RegisterRequest { Email = "user@example.com", Password = "Password123!" });

        var response = await _sut.LoginAsync(new LoginRequest { Email = "USER@EXAMPLE.COM", Password = "Password123!" });

        response.Should().NotBeNull();
    }

    [Fact]
    public async Task LoginAsync_WrongPassword_ReturnsNull()
    {
        await _sut.RegisterAsync(new RegisterRequest { Email = "user@example.com", Password = "Password123!" });

        var response = await _sut.LoginAsync(new LoginRequest { Email = "user@example.com", Password = "WrongPassword!" });

        response.Should().BeNull();
    }

    [Fact]
    public async Task LoginAsync_UnknownEmail_ReturnsNull()
    {
        var response = await _sut.LoginAsync(new LoginRequest { Email = "nobody@example.com", Password = "Password123!" });

        response.Should().BeNull();
    }
}
