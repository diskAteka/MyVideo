namespace MainServer.Services.Main
{
    public class TempFileCleanupService : BackgroundService
    {
        private readonly string _tempPath;
        private readonly ILogger<TempFileCleanupService> _logger;

        public TempFileCleanupService(IConfiguration configuration, ILogger<TempFileCleanupService> logger)
        {
            _tempPath = configuration["VideoStorage:TempPath"] ?? "/MainServer/temp_videos";
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    if (Directory.Exists(_tempPath))
                    {
                        var files = Directory.GetFiles(_tempPath);
                        var threshold = DateTime.Now.AddHours(-1); 

                        foreach (var file in files)
                        {
                            try
                            {
                                var fileInfo = new FileInfo(file);
                                if (fileInfo.LastAccessTime < threshold)
                                {
                                    fileInfo.Delete();
                                    _logger.LogDebug("Удалён старый временный файл: {File}", file);
                                }
                            }
                            catch (Exception ex)
                            {
                                _logger.LogWarning(ex, "Не удалось удалить временный файл: {File}", file);
                            }
                        }
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Ошибка при очистке временных файлов");
                }

                await Task.Delay(TimeSpan.FromHours(1), stoppingToken);
            }
        }
    }
}
