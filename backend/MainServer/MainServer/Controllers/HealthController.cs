using MainServer.Data;
using MainServer.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace MainServer.Controllers
{
    [ApiController]
    [Route("health")]
    [ApiExplorerSettings(GroupName = "v3")]
    public class HealthController : ControllerBase
    {
        private readonly AppDbContext _dbContext;
        private readonly IStorageService _storageService;
        private readonly ILogger<HealthController> _logger;

        public HealthController(
            AppDbContext dbContext,
            IStorageService storageService,
            ILogger<HealthController> logger)
        {
            _dbContext = dbContext;
            _storageService = storageService;
            _logger = logger;
        }

        [HttpGet("check")]
        public async Task<IActionResult> CheckServices()
        {
            var databaseStatus = await CheckDatabaseAsync();
            var storageStatus = await CheckStorageAsync();

            var result = new
            {
                Status = databaseStatus.Status == "Healthy" && storageStatus.Status == "Healthy" ? "OK" : "Degraded",
                Timestamp = DateTime.UtcNow,
                Database = databaseStatus,
                Storage = storageStatus
            };

            bool isHealthy = databaseStatus.Status == "Healthy" && storageStatus.Status == "Healthy";
            return isHealthy ? Ok(result) : StatusCode(503, result);
        }

        private async Task<ServiceStatus> CheckDatabaseAsync()
        {
            try
            {
                bool canConnect = await _dbContext.Database.CanConnectAsync();
                return canConnect
                    ? new ServiceStatus("Healthy", "Подключение к базе данных успешно")
                    : new ServiceStatus("Unhealthy", "Не удалось подключиться к базе данных");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Ошибка при проверке базы данных");
                return new ServiceStatus("Error", $"Ошибка: {ex.Message}");
            }
        }

        private async Task<ServiceStatus> CheckStorageAsync()
        {
            try
            {
                bool storageAvailable = await _storageService.CheckStorageAvailabilityAsync();
                return storageAvailable
                    ? new ServiceStatus("Healthy", "Облачное хранилище доступно")
                    : new ServiceStatus("Unhealthy", "Облачное хранилище недоступно");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Ошибка при проверке облачного хранилища");
                return new ServiceStatus("Error", $"Ошибка: {ex.Message}");
            }
        }

        private record ServiceStatus(string Status, string Message);
    }
}