using Xabe.FFmpeg;

namespace MainServer.Services.ForController
{
    public class PosterService
    {
        private readonly string _outputDirectory;
        private readonly string _placeholderPath;
        private readonly ILogger<PosterService> _logger;

        public PosterService(IConfiguration configuration, ILogger<PosterService> logger)
        {
            _outputDirectory = configuration["VideoStorage:TempPath"] ?? "/MainServer/temp_videos";
            _placeholderPath = Path.Combine(AppContext.BaseDirectory, "Resources", "placeholder.png");
            _logger = logger;

            Directory.CreateDirectory(_outputDirectory);
        }

        public async Task<string> ExtractPoster(string videoPath)
        {
            if (!File.Exists(videoPath))
            {
                _logger.LogWarning("Видеофайл не найден: {VideoPath}", videoPath);
                throw new FileNotFoundException($"Видеофайл не найден: {videoPath}");
            }

            var fileName = Path.Combine(_outputDirectory, $"poster_{Guid.NewGuid()}.jpg");

            try
            {
                var mediaInfo = await FFmpeg.GetMediaInfo(videoPath);
                if (mediaInfo.Duration.TotalSeconds < 5)
                {
                    _logger.LogWarning("Видео слишком короткое для извлечения постера: {Duration}с",
                        mediaInfo.Duration.TotalSeconds);
                }

                var conversion = await FFmpeg.Conversions.FromSnippet.Snapshot(
                    videoPath,
                    fileName,
                    TimeSpan.FromSeconds(Math.Min(5, mediaInfo.Duration.TotalSeconds / 2))
                );

                await conversion.Start();

                if (!File.Exists(fileName))
                    throw new InvalidOperationException("Не удалось создать постер: файл не был создан");

                return fileName;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Ошибка при создании постера для {VideoPath}", videoPath);
                if (File.Exists(fileName))
                {
                    try
                    {
                        File.Delete(fileName);
                    }
                    catch (Exception deleteEx)
                    {
                        _logger.LogWarning(deleteEx, "Не удалось удалить повреждённый постер {FileName}", fileName);
                    }
                }

                if (!File.Exists(_placeholderPath))
                {
                    _logger.LogError("Placeholder-изображение не найдено: {Path}", _placeholderPath);
                    throw new InvalidOperationException("Placeholder-изображение отсутствует", ex);
                }

                _logger.LogInformation("Использован placeholder-постер из-за ошибки создания");
                return _placeholderPath;
            }
        }
    }
}