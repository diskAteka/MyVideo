using Amazon.S3.Model;
using MainServer.Interfaces;
using MainServer.Services.ForService;
using SharedLib.Contracts.Request.Video;
using SharedLib.Models;

namespace MainServer.Services.ForController;

public class StorageService : IStorageService
{
    private readonly S3ClientWrapper _s3;
    private readonly StoragePathBuilder _paths;
    private readonly PosterService _posterService;
    private readonly string _tempPath;
    private readonly ILogger<StorageService> _logger;

    public StorageService(
        S3ClientWrapper s3,
        StoragePathBuilder paths,
        PosterService posterService,
        IConfiguration configuration,
        ILogger<StorageService> logger)
    {
        _s3 = s3;
        _paths = paths;
        _posterService = posterService;
        _logger = logger;
        _tempPath = configuration["VideoStorage"] ?? "/MainServer/temp_videos";
        Directory.CreateDirectory(_tempPath);
    }

    public async Task<StorageUploadResult> UploadToStorageAsync(VideoUploadRequest request, int authorId, string tempFilePath)
    {
        if (!File.Exists(tempFilePath))
            throw new FileNotFoundException($"Видео не найдено: {tempFilePath}");
        var videoExt = Path.GetExtension(tempFilePath);
        var videoKey = _paths.BuildVideoKey(videoExt);
        await _s3.UploadFileAsync(tempFilePath, videoKey, GetMime(videoExt));
        var posterPath = await _posterService.ExtractPoster(tempFilePath);
        string posterKey = null!;
        try
        {
            var posterExt = Path.GetExtension(posterPath);
            posterKey = _paths.BuildPosterKey(posterExt);
            await _s3.UploadFileAsync(posterPath, posterKey, GetMime(posterExt));
        }
        finally
        {
            if (File.Exists(posterPath))
            {
                try
                {
                    File.Delete(posterPath);
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex,
                        "Не удалось удалить временный постер: {PosterPath}",
                        posterPath);
                }
            }
        }

        return new StorageUploadResult
        {
            VideoKey = videoKey,
            PosterKey = posterKey
        };
    }

    public async Task<GetObjectResponse> GetObjectAsync(string bucketName, string key)
    {
        return await _s3.GetObjectAsync(key);
    }

    public async Task<bool> DeleteVideoFilesAsync(string videoKey, string posterKey)
    {
        try
        {
            await _s3.DeleteObjectsAsync(videoKey, posterKey);
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Ошибка удаления видеофайлов");
            return false;
        }
    }

    public async Task<string> GeneratePresignedUrlAsync(string objectKey, int expiryHours = 1)
    {
        return await _s3.GeneratePresignedUrlAsync(objectKey, expiryHours);
    }

    public async Task<bool> CheckStorageAvailabilityAsync()
    {
        return await _s3.IsAvailableAsync();
    }

    private static string GetMime(string ext) => ext.ToLowerInvariant() switch
    {
        ".jpg" or ".jpeg" => "image/jpeg",
        ".png" => "image/png",
        ".gif" => "image/gif",
        ".webp" => "image/webp",
        ".mp4" => "video/mp4",
        ".webm" => "video/webm",
        ".avi" => "video/x-msvideo",
        ".mov" => "video/quicktime",
        _ => "application/octet-stream"
    };
}