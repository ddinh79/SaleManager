using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using SalesSystem.Data;
using SalesSystem.Hubs;
using SalesSystem.Middleware;
using SalesSystem.Repositories;
using SalesSystem.Services;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
        options.JsonSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
    });
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "JWT Authorization header using the Bearer scheme. Enter 'Bearer' [space] and then your token",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });
    options.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

// Configure DbContext with UseSqlite
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlite(builder.Configuration.GetConnectionString("DefaultConnection")));

// Configure JWT Authentication
var jwtKey = builder.Configuration["Jwt:Key"]!;
var key = Encoding.ASCII.GetBytes(jwtKey);

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.RequireHttpsMetadata = false;
    options.SaveToken = true;
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(key),
        ValidateIssuer = true,
        ValidIssuer = builder.Configuration["Jwt:Issuer"],
        ValidateAudience = true,
        ValidAudience = builder.Configuration["Jwt:Audience"],
        ClockSkew = TimeSpan.Zero
    };
});

builder.Services.AddAuthorization();

// Register repositories
builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<IHospitalRepository, HospitalRepository>();
builder.Services.AddScoped<IDoctorRepository, DoctorRepository>();
builder.Services.AddScoped<IActivityRepository, ActivityRepository>();
builder.Services.AddScoped<IDealRepository, DealRepository>();
builder.Services.AddScoped<IOrderRepository, OrderRepository>();

// Register generic repositories
builder.Services.AddScoped(typeof(IRepository<>), typeof(Repository<>));

// Register services
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddScoped<IHospitalService, HospitalService>();
builder.Services.AddScoped<IDoctorService, DoctorService>();
builder.Services.AddScoped<IKpiService, KpiService>();
builder.Services.AddScoped<IActivityService, ActivityService>();
builder.Services.AddScoped<IDealService, DealService>();
builder.Services.AddScoped<IOrderService, OrderService>();
builder.Services.AddScoped<IDashboardService, DashboardService>();
builder.Services.AddScoped<ITaskService, TaskService>();
builder.Services.AddScoped<CapacityCalculator>();
builder.Services.AddScoped<ActivityMatcher>();
builder.Services.AddScoped<AntiGamingMonitor>();
builder.Services.AddScoped<IDailyPlanService, DailyPlanService>();

// i18n Translation services
builder.Services.AddScoped<ITranslationRepository, TranslationRepository>();
builder.Services.AddScoped<ITranslationService, TranslationService>();

// Translation cache - in-memory only (Redis optional, falls back automatically)
builder.Services.AddSingleton<ITranslationCache>(sp => new HybridTranslationCache(null));

// Background services
builder.Services.AddHostedService<NotificationBackgroundService>();

// SignalR
builder.Services.AddSignalR(options => {
    options.EnableDetailedErrors = true;
});
// Configure SignalR CORS to allow frontend origin
builder.Services.AddCors(options => {
    options.AddPolicy("SignalR", policy => {
        policy.SetIsOriginAllowed(_ => true)
              .AllowAnyMethod()
              .AllowAnyHeader()
              .AllowCredentials();
    });
});
builder.Services.AddSingleton<INotificationHubContext, NotificationHubContext>();
builder.Services.AddScoped<INotificationService, NotificationService>();
builder.Services.AddHttpContextAccessor(); // Required for DealHub
builder.Services.AddScoped<DealHub>();

var app = builder.Build();

// Ensure database created and seeded on startup
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.EnsureCreated();
    SeedTranslations.Seed(db);
}

// Configure the HTTP request pipeline.
app.UseExceptionMiddleware();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// CORS must be BEFORE SignalR hub mapping
app.UseCors("SignalR");

app.UseAuthentication();
app.UseAuthorization();
app.UseJwtMiddleware();

app.MapControllers();
app.MapHub<NotificationHub>("/hubs/notifications");
app.MapHub<TaskHub>("/hubs/tasks");
app.MapHub<DealHub>("/hubs/deals");
app.MapHub<DailyPlanHub>("/hubs/daily-plan");
app.MapHub<TranslationHub>("/hubs/translations");

var urls = builder.Configuration["urls"] ?? "http://localhost:5100";
app.Urls.Add(urls);

app.Run();