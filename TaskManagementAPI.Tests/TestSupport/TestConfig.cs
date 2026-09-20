using Microsoft.Extensions.Configuration;

namespace TaskManagementAPI.Tests.TestSupport;

public static class TestConfig
{
    public static IConfiguration CreateJwtConfig()
    {
        var settings = new Dictionary<string, string?>
        {
            ["Jwt:Secret"] = "Test-Only-Signing-Key-That-Is-At-Least-32-Bytes-Long!!",
            ["Jwt:Issuer"] = "TaskManagementAPI.Tests",
            ["Jwt:Audience"] = "TaskManagementAPI.Tests",
            ["Jwt:ExpiryMinutes"] = "60",
        };

        return new ConfigurationBuilder().AddInMemoryCollection(settings).Build();
    }
}
