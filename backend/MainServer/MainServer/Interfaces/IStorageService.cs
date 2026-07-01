using Amazon.S3.Model;
using MainServer.Services.ForService;
using SharedLib.Contracts.Request.Video;

namespace MainServer.Interfaces
{
    public interface IStorageService
    {
        Task<StorageUploadResult> UploadToStorageAsync(VideoUploadRequest request, int authorId, string tempFilePath);
        Task<GetObjectResponse> GetObjectAsync(string bucketName, string key);
        Task<bool> DeleteVideoFilesAsync(string videoKey, string posterKey);
        Task<string> GeneratePresignedUrlAsync(string objectKey, int expiryHours = 1);
        Task<bool> CheckStorageAvailabilityAsync();
    }
}
