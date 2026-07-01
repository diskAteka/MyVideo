using Amazon.S3;
using Amazon.S3.Model;
using MainServer.Enum;
using MainServer.Services.Main;
using Microsoft.Extensions.Options;

namespace MainServer.Services.ForService
{
    public class S3ClientWrapper
    {
        private readonly IAmazonS3 _client;
        private readonly string _bucketName;
        private readonly string _publicBaseUrl;
        private readonly ILogger<S3ClientWrapper> _logger;

        public S3ClientWrapper(IOptions<GarageOptions> options, ILogger<S3ClientWrapper> logger)
        {
            _logger = logger;

            var opts = options.Value;
            _bucketName = opts.BucketName;
            _publicBaseUrl = opts.Endpoint;
            _logger.LogInformation("S3ClientWrapper: Endpoint из конфига = {Endpoint}", _publicBaseUrl);

            var config = new AmazonS3Config
            {
                ServiceURL = "http://garage:3900",
                ForcePathStyle = true,
                AuthenticationRegion = "garage"
            };

            _client = new AmazonS3Client(opts.AccessKey, opts.SecretKey, config);
        }

        public async Task EnsureBucketExistsAsync()
        {
            try
            {
                // Проверяем, существует ли бакет, вместо попытки создания
                var bucketsResponse = await _client.ListBucketsAsync();
                bool bucketExists = bucketsResponse.Buckets.Any(b => b.BucketName == _bucketName);

                if (bucketExists)
                {
                    _logger.LogDebug("Бакет {Bucket} уже существует", _bucketName);
                    return;
                }

                // Создаём бакет, если его нет
                await _client.PutBucketAsync(_bucketName);
                _logger.LogInformation("Бакет {Bucket} успешно создан", _bucketName);
            }
            catch (AmazonS3Exception ex) when (ex.StatusCode == System.Net.HttpStatusCode.Conflict)
            {
                // Бакет уже существует — это нормально при параллельных запросах
                _logger.LogDebug("Бакет {Bucket} уже существует (конфликт при создании)", _bucketName);
            }
            catch (AmazonS3Exception ex)
            {
                // Логируем и пробрасываем другие ошибки S3
                _logger.LogError(ex, "Ошибка S3 при проверке/создании бакета {Bucket}: {StatusCode} - {ErrorCode} - {Message}",
                    _bucketName, ex.StatusCode, ex.ErrorCode, ex.Message);
                throw new ApiException(ErrorType.ServerError,
                    $"Ошибка доступа к хранилищу S3: {ex.Message}");
            }
            catch (Exception ex)
            {
                // Обрабатываем неожиданные ошибки (сетевые, аутентификации и т.д.)
                _logger.LogError(ex, "Неожиданная ошибка при проверке/создании бакета {Bucket}", _bucketName);
                throw new ApiException(ErrorType.ServerError,
                    $"Не удалось подключиться к хранилищу: {ex.Message}");
            }
        }

        // Также улучшим метод UploadFileAsync для дополнительной проверки
        public async Task UploadFileAsync(string filePath, string objectKey, string contentType)
        {
            // Проверяем существование файла перед загрузкой
            if (!File.Exists(filePath))
            {
                _logger.LogError("Файл для загрузки не найден: {FilePath}", filePath);
                throw new FileNotFoundException($"Файл не найден: {filePath}");
            }

            // Проверяем размер файла
            var fileInfo = new FileInfo(filePath);
            if (fileInfo.Length == 0)
            {
                _logger.LogError("Файл пуст: {FilePath}", filePath);
                throw new InvalidOperationException($"Файл пуст: {filePath}");
            }

            await EnsureBucketExistsAsync();

            var request = new PutObjectRequest
            {
                BucketName = _bucketName,
                Key = objectKey,
                FilePath = filePath,
                ContentType = contentType,
                UseChunkEncoding = false
            };

            try
            {
                await _client.PutObjectAsync(request);
                _logger.LogInformation("Загружен объект {Key} ({Size} байт)", objectKey, fileInfo.Length);
            }
            catch (AmazonS3Exception ex)
            {
                _logger.LogError(ex, "Ошибка при загрузке объекта {Key}: {StatusCode} - {ErrorCode}",
                    objectKey, ex.StatusCode, ex.ErrorCode);
                throw new ApiException(ErrorType.ServerError, $"Ошибка загрузки в хранилище: {ex.Message}");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Неожиданная ошибка при загрузке объекта {Key}", objectKey);
                throw new ApiException(ErrorType.ServerError, "Внутренняя ошибка при загрузке файла");
            }
        }

        public async Task<GetObjectResponse> GetObjectAsync(string objectKey)
        {
            var request = new GetObjectRequest
            {
                BucketName = _bucketName,
                Key = objectKey
            };

            return await _client.GetObjectAsync(request);
        }

        public async Task DeleteObjectsAsync(params string[] keys)
        {
            if (keys.Length == 0) return;

            var request = new DeleteObjectsRequest
            {
                BucketName = _bucketName,
                Objects = keys.Select(k => new KeyVersion { Key = k }).ToList()
            };

            var response = await _client.DeleteObjectsAsync(request);

            if (response.DeleteErrors.Any())
            {
                var errors = string.Join(", ", response.DeleteErrors.Select(e => $"{e.Key}: {e.Message}"));
                _logger.LogWarning("Ошибки удаления объектов: {Errors}", errors);
            }
        }

        public Task<string> GeneratePresignedUrlAsync(string objectKey, int expiryHours)
        {
            var request = new GetPreSignedUrlRequest
            {
                BucketName = _bucketName,
                Key = objectKey,
                Verb = HttpVerb.GET,
                Expires = DateTime.UtcNow.AddHours(expiryHours)
            };
            var internalUrl = _client.GetPreSignedURL(request);
            var uri = new Uri(internalUrl);
            var pathAndQuery = uri.PathAndQuery;
            var publicUrl = $"{_publicBaseUrl}{pathAndQuery}";
            _logger.LogInformation(
                "Presigned URL: внутренний={Internal}, публичный={Public}",
                internalUrl,
                publicUrl
            );

            return Task.FromResult(publicUrl);
        }

        public async Task<bool> IsAvailableAsync()
        {
            try
            {
                await _client.ListBucketsAsync();
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "S3-хранилище недоступно");
                return false;
            }
        }
    }
}