using MainServer.Data;
using MainServer.Interfaces;
using MainServer.Middleware;
using MainServer.Services.DataBaseServices;
using MainServer.Services.ForController;
using MainServer.Services.ForService;
using MainServer.Services.Main;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Http.Features;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using SharedLib.Interfaces;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

var jwtSettings = builder.Configuration.GetSection("JwtSettings").Get<JwtSettings>()
    ?? throw new InvalidOperationException("JwtSettings section is missing or invalid.");
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
    ?? throw new InvalidOperationException("Connection string 'DefaultConnection' is missing.");

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(connectionString)
           .LogTo(Console.WriteLine, LogLevel.Information));

builder.Services.AddHttpContextAccessor();
builder.Services.AddHttpClient();

builder.Services.AddSingleton(jwtSettings);
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwtSettings.Issuer,
            ValidAudience = jwtSettings.Audience,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSettings.SecretKey))
        };
    });
builder.Services.AddAuthorization();

builder.Services.Configure<GarageOptions>(builder.Configuration.GetSection(GarageOptions.Section));
builder.Services.AddSingleton<StoragePathBuilder>(sp =>
{
    var opts = sp.GetRequiredService<IOptions<GarageOptions>>().Value;
    return new StoragePathBuilder(opts.VideoPrefix, opts.PosterPrefix);
});
builder.Services.AddSingleton<S3ClientWrapper>();

builder.Services.AddAutoMapper(typeof(MappingProfile));
builder.Services.AddScoped<IPasswordHasher, PasswordHasher>();
builder.Services.AddScoped<ITokenService, TokenService>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IStorageService, StorageService>();
builder.Services.AddScoped<IVideoService, VideoService>();
builder.Services.AddScoped<IAddObjectService, AddObjectService>();
builder.Services.AddScoped<IUpdateObjectService, UpdateObjectService>();
builder.Services.AddScoped<IGetObjectService, GetObjectSevice>();
builder.Services.AddScoped<IDeleteObjectService, DeleteObjectService>();
builder.Services.AddScoped<PosterService>();
builder.Services.AddHostedService<TempFileCleanupService>();

var allowedOrigins = builder.Configuration.GetSection("CorsOrigins").Get<string[]>();
builder.Services.AddCors(options =>
{
    options.AddPolicy("FrontendPolicy", policy =>
    {
        policy.WithOrigins(allowedOrigins ?? ["https://localhost:3000"])
              .AllowAnyMethod()
              .AllowAnyHeader()
              .AllowCredentials();
    });
});

var maxRequestBodySize = 2L * 1024 * 1024 * 1024; 
builder.Services.Configure<FormOptions>(options =>
{
    options.ValueLengthLimit = int.MaxValue;
    options.MultipartBodyLengthLimit = maxRequestBodySize;
    options.MemoryBufferThreshold = int.MaxValue;
});
builder.WebHost.ConfigureKestrel(options =>
{
    options.Limits.MaxRequestBodySize = maxRequestBodySize;
});

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "API v1 (Client)", Version = "v1" });
    c.SwaggerDoc("v2", new OpenApiInfo { Title = "API v2 (Admin)", Version = "v2" });
    c.SwaggerDoc("v3", new OpenApiInfo { Title = "API v3 (Debag)", Version = "v3" });
});
builder.Services.AddControllers();

var app = builder.Build();

app.UseGlobalExceptionHandler();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("FrontendPolicy");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run();