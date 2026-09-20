using System.Text;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using TaskManagementAPI;
using TaskManagementAPI.Data;
using TaskManagementAPI.Dtos;
using TaskManagementAPI.Services;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
    })
    .ConfigureApiBehaviorOptions(options =>
    {
        // Replace the default ProblemDetails validation response with the same
        // ApiErrorResponse envelope every other error path in this API returns.
        options.InvalidModelStateResponseFactory = context =>
        {
            var modelState = context.ModelState;

            // A missing or syntactically-broken JSON body surfaces under the root key ("" or
            // "$") plus a redundant "field is required" entry for the action parameter itself —
            // collapse that noise into one clean message instead of leaking parser internals.
            var isBodyParsingFailure = modelState.Keys.Any(key => key.Length == 0 || key == "$");
            if (isBodyParsingFailure)
            {
                return new BadRequestObjectResult(new ApiErrorResponse
                {
                    Success = false,
                    StatusCode = StatusCodes.Status400BadRequest,
                    Message = "The request body is missing or is not valid JSON.",
                    TraceId = context.HttpContext.TraceIdentifier
                });
            }

            var errors = modelState
                .Where(kvp => kvp.Value?.Errors.Count > 0)
                .ToDictionary(
                    kvp => kvp.Key,
                    kvp => kvp.Value!.Errors.Select(e => e.ErrorMessage).ToArray());

            var response = new ApiErrorResponse
            {
                Success = false,
                StatusCode = StatusCodes.Status400BadRequest,
                Message = "One or more validation errors occurred.",
                Errors = errors,
                TraceId = context.HttpContext.TraceIdentifier
            };

            return new BadRequestObjectResult(response);
        };
    });

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddScoped<ITaskService, TaskService>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<ITokenService, TokenService>();
builder.Services.AddScoped<IUserService, UserService>();

builder.Services.AddExceptionHandler<GlobalExceptionHandler>();
// Required as a fallback registration by UseExceptionHandler() even though
// GlobalExceptionHandler always handles the exception itself (see below).
builder.Services.AddProblemDetails();

var jwtSection = builder.Configuration.GetSection("Jwt");
var jwtSecret = jwtSection["Secret"];
if (string.IsNullOrWhiteSpace(jwtSecret))
{
    throw new InvalidOperationException(
        "Jwt:Secret is not configured. Set it in appsettings.json or via 'dotnet user-secrets set \"Jwt:Secret\" \"<value>\"'.");
}
if (Encoding.UTF8.GetByteCount(jwtSecret) < TokenService.MinimumSecretBytes)
{
    throw new InvalidOperationException(
        $"Jwt:Secret must be at least {TokenService.MinimumSecretBytes} bytes ({TokenService.MinimumSecretBytes * 8} bits) long " +
        $"for HS256 signing — it is currently {Encoding.UTF8.GetByteCount(jwtSecret)} bytes. Update it in appsettings.json.");
}

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = jwtSection["Issuer"],
            ValidateAudience = true,
            ValidAudience = jwtSection["Audience"],
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret)),
            ValidateLifetime = true,
            ClockSkew = TimeSpan.FromMinutes(1)
        };

        // Without this, a missing/expired/malformed token returns an empty 401/403 body —
        // give the frontend the same ApiErrorResponse envelope it gets everywhere else.
        options.Events = new JwtBearerEvents
        {
            OnChallenge = async context =>
            {
                context.HandleResponse();
                context.Response.StatusCode = StatusCodes.Status401Unauthorized;
                context.Response.ContentType = "application/json";
                var message = context.AuthenticateFailure is SecurityTokenExpiredException
                    ? "Your session has expired. Please log in again."
                    : "You must be logged in to perform this action.";
                await context.Response.WriteAsJsonAsync(new ApiErrorResponse
                {
                    Success = false,
                    StatusCode = StatusCodes.Status401Unauthorized,
                    Message = message,
                    TraceId = context.HttpContext.TraceIdentifier
                });
            },
            OnForbidden = async context =>
            {
                context.Response.StatusCode = StatusCodes.Status403Forbidden;
                context.Response.ContentType = "application/json";
                await context.Response.WriteAsJsonAsync(new ApiErrorResponse
                {
                    Success = false,
                    StatusCode = StatusCodes.Status403Forbidden,
                    Message = "You do not have permission to perform this action.",
                    TraceId = context.HttpContext.TraceIdentifier
                });
            }
        };
    });

builder.Services.AddAuthorization();

const string CorsPolicyName = "FrontendDev";
builder.Services.AddCors(options =>
{
    options.AddPolicy(CorsPolicyName, policy =>
    {
        // Vite auto-increments the port when 5173 is busy, which happens often in dev.
        policy.WithOrigins("http://localhost:5173", "http://localhost:5174", "http://localhost:5175")
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo { Title = "Task Management API", Version = "v1" });

    var securityScheme = new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Enter a valid JWT bearer token."
    };
    options.AddSecurityDefinition("Bearer", securityScheme);
    options.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        { new OpenApiSecurityScheme { Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" } }, Array.Empty<string>() }
    });
});

var app = builder.Build();

app.UseExceptionHandler();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// CORS must run before UseHttpsRedirection: the frontend calls the plain-http port, and a
// preflight OPTIONS request that hits the HTTPS redirect first gets back a 307 with no
// Access-Control-Allow-Origin header, which the browser reports as a CORS failure.
app.UseCors(CorsPolicyName);

app.UseHttpsRedirection();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();
