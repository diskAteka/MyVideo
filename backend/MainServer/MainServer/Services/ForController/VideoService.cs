using MainServer.Data;
using MainServer.Enum;
using MainServer.Interfaces;
using MainServer.Services.Main;
using Microsoft.EntityFrameworkCore;
using SharedLib.Contracts.Request.Video;
using SharedLib.Contracts.Response.Video;
using SharedLib.Contracts.RezultModels;
using SharedLib.Models;
using System.Data.Common;
using View = SharedLib.Models.View;


namespace MainServer.Services.ForController
{
    public class VideoService : IVideoService
    {
        private readonly AppDbContext _context;
        private readonly ILogger<VideoService> _logger;
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly IWebHostEnvironment _environment;
        private readonly IStorageService _storageService;
        private readonly IConfiguration _configuration;

        public VideoService(AppDbContext context, 
            ILogger<VideoService> logger, 
            IHttpContextAccessor httpContextAccessor,
            IWebHostEnvironment environment,
            IStorageService minIOService,
            IConfiguration configuration)
        {
            _context = context;
            _logger = logger;
            _httpContextAccessor = httpContextAccessor;
            _environment = environment;
            _storageService = minIOService;
            _configuration = configuration;
        }

        public async Task<UpdateRezult> VerifyVideoAsync(int videoId)
        {
            var video = await _context.Videos.FirstOrDefaultAsync(v => v.Id == videoId);

            if (video == null)
                throw new ApiException(ErrorType.NotFound, "Видео не найдено");

            video.IsVerified = true;
            var affectedTablesNames = AffectedTableNames();
            await _context.SaveChangesAsync();
            return new UpdateRezult(affectedTablesNames, true);
        }

        public async Task<List<VideoListItemResponse>> GetAllVideoAsync()
        {
            List<VideoListItemResponse> videoList = await _context.Videos
                .AsNoTracking()
                .Include(v => v.Author)
                .OrderByDescending(v => v.Views)
                .Where(v => v.IsVerified)
                .Take(20)
                .Select(v => new VideoListItemResponse
                {
                    Id = v.Id,
                    Name = v.Name,
                    Poster = v.PosterUrl,
                    DateUpload = v.DateUpload,
                    AuthorName = v.Author.Name
                })
                .ToListAsync();

            return videoList;
        }//Возвращает коллекцию из максимум 20 видео или возвращает null

        public async Task<VideoDetailsResponse> GetVideoAsync(int videoId, int userId)
        {
            bool isViewed = await _context.Views.FirstOrDefaultAsync(v => v.UserId == userId && v.VideoId == videoId) != null;

            if (!isViewed)
            {
                await _context.AddAsync(new View { UserId = userId, VideoId = videoId });
                await _context.Videos.Where(v => v.Id == videoId)
                    .ExecuteUpdateAsync(s => s.SetProperty(v => v.Views, v => v.Views + 1));
                await _context.SaveChangesAsync();
            }

            Video? v = await _context.Videos
                .AsNoTracking()
                .Include(v => v.Author)
                .Include(v => v.Comments)
                .ThenInclude(c => c.User)
                .FirstOrDefaultAsync(v => v.Id == videoId);

            if (v == null)
                throw new ApiException(ErrorType.NotFound, "Видео не найдено");

            ICollection<Comment> c = v.Comments ?? new List<Comment>();

            bool isLiked = await _context.Likes.AsNoTracking().AnyAsync(l => l.UserId == userId && l.VideoId == videoId);
            bool isDisliked = await _context.DisLikes.AsNoTracking().AnyAsync(d => d.UserId == userId && d.VideoId == videoId);

            List<CommentResponse> Comments = c.Select(c => new CommentResponse
            {
                AuthorId = c.UserId,
                AuthorName = c.User.Name,
                Text = c.Text,
                CreatedAt = c.Date
            }).ToList();

            var request = _httpContextAccessor.HttpContext?.Request;
            var baseUrl = $"{request?.Scheme}://{request?.Host}";

            VideoDetailsResponse videoDto = new()
            {
                Id = v.Id,
                Name = v.Name,
                Description = v.Description,
                DateUpload = v.DateUpload,
                Link = v.Link,
                Poster = v.Poster,
                Views = v.Views,
                Likes = v.Likes,
                Dislikes = v.Dislikes,
                IsLiked = isLiked,
                IsDisLiked = isDisliked,
                Comments = Comments,
                VideoUrl = $"/api/videos/{v.Id}/stream",
                PosterUrl = $"{baseUrl}/{v.PosterUrl}"
            };

            return videoDto;
        }//Возвращает video по id или возвращает null

        public async Task<List<VideoListItemResponse>> VideoSearchAsync(string query, int limit = 10)
        {
            var searchLower = query.ToLower().Trim();

            if (searchLower.Length < 2) return new List<VideoListItemResponse>();

            var videoQuery = _context.Videos
                .Where(v => v.IsVerified)
                .Include(v => v.Author)
                .Where(v => v.Name.ToLower().Contains(searchLower) ||
                       v.Description != null && v.Description.ToLower().Contains(searchLower));

            var videos = await videoQuery.ToListAsync();

            var respose = videos
                .Select(v => new
                {
                    Video = v,
                    Score = CalculateRelevanceScore(v, searchLower)
                })
                .OrderByDescending(x => x.Score)
                .ThenByDescending(x => x.Video.Views)
                .Take(limit)
                .Select(x => new VideoListItemResponse
                {
                    Id = x.Video.Id,
                    Name = x.Video.Name,
                    Poster = x.Video.PosterUrl,
                    DateUpload = x.Video.DateUpload,
                    AuthorName = x.Video.Author.Name
                })
                .ToList();
            return respose;
        }//Получение массива с данными о 10 видео наиболее соответсвующих

        public async Task NewCommentAsync(CreateCommentRequest request, int userId, int videoId)
        {
            var videoExists = await _context.Videos.AnyAsync(v => v.Id == videoId);

            if (!videoExists)
                throw new ApiException(ErrorType.NotFound, $"Видео {videoId} не найдено");

            if (string.IsNullOrWhiteSpace(request.Text) || request.Text.Length > 1000)
                throw new ApiException(ErrorType.ValidationError, "Комментарий должен содержать 1-1000 символов");

            Comment comment = new()
            {
                VideoId = videoId,
                UserId = userId,
                Text = request.Text,
                Date = DateTime.Now
            };

            await _context.Comments.AddAsync(comment);
            await _context.SaveChangesAsync();
        }//Добавляет новый коментарий в БД

        public async Task<List<CommentResponse>> GetCommentsAsync(int videoId)
        {
            bool videoExists = await _context.Videos.AnyAsync(v => v.Id == videoId);
            if (!videoExists)
                throw new ApiException(ErrorType.NotFound, $"Видео {videoId} не найдено");

            List<CommentResponse> comments = await _context.Comments
                .AsNoTracking()
                .Where(c => c.VideoId == videoId)
                .Include(c => c.User)
                .Select(c => new CommentResponse
                {
                    AuthorId = c.UserId,
                    AuthorName = c.User.Name,
                    CreatedAt = c.Date,
                    Text = c.Text
                })
                .OrderBy(c => c.CreatedAt)
                .ToListAsync();
                
            return comments;
        }//Получает список комментариев к видео

        public async Task ReactionAsync(ReactionRequest request, int userId, int videoId)
        {
            bool IsLike = request.IsLike;
            using var transaction = await _context.Database.BeginTransactionAsync();

            try
            {
                Like? existLike = await _context.Likes.FirstOrDefaultAsync(l => l.UserId == userId && l.VideoId == videoId);
                Dislike? existDislike = await _context.DisLikes.FirstOrDefaultAsync(d => d.UserId == userId && d.VideoId == videoId);

                if (IsLike)
                {
                    if (existLike == null)
                    {
                        if (existDislike != null)
                            await DeleteDislike(existDislike, videoId);

                        await AddLike(userId, videoId);
                    }
                    else
                    {
                        await DeleteLike(existLike, videoId);
                    }
                }
                else
                {
                    if (existDislike == null)
                    {
                        if (existLike != null)
                            await DeleteLike(existLike, videoId);

                        await AddDislike(userId, videoId);
                    }
                    else
                    {
                        await DeleteDislike(existDislike, videoId);
                    }
                }

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();
            }
            catch
            {
                await transaction.RollbackAsync();
                throw; // Пробрасываем исключение для middleware
            }
        }//Обрабатывает реакцию пользователя

        public async Task<Video> GetVideoMetadataAsync(int videoId)
        {
            var video = await _context.Videos
                .AsNoTracking()
                .FirstOrDefaultAsync(v => v.Id == videoId);
            if (video == null)
                throw new ApiException(ErrorType.NotFound, "Видео не найдено");

            return video;
        }//Получение метаданных видео

        public async Task<int> NewVideoAsync(VideoUploadRequest request, int AuthorId)
        {
            if (request == null)
                throw new ApiException(ErrorType.ValidationError, "Запрос не может быть пустым");

            if (request.Video == null || request.Video.Length == 0)
                throw new ApiException(ErrorType.ValidationError, "Файл видео не выбран");

            if (string.IsNullOrWhiteSpace(request.Title))
                throw new ApiException(ErrorType.ValidationError, "Название видео обязательно");

            string safeTitle = string.Join("_", request.Title.Split(Path.GetInvalidFileNameChars()));
            var extension = Path.GetExtension(request.Video.FileName).ToLowerInvariant();
            var allowedExtensions = new[] { ".mp4" };

            if (!allowedExtensions.Contains(extension))
                throw new ApiException(ErrorType.ValidationError, $"Неподдерживаемый формат. Разрешены: {string.Join(", ", allowedExtensions)}");

            var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == AuthorId);

            if (user == null)
                throw new ApiException(ErrorType.NotFound, "Пользователь не найден");

            if (!user.CanUpload)
                throw new ApiException(ErrorType.Forbidden, "У вас нет прав на загрузку видео");

            const long maxFileSize = 2L * 1024 * 1024 * 1024;
            if (request.Video.Length > maxFileSize)
                throw new ApiException(ErrorType.Conflict, $"Файл слишком большой. Максимальный размер 2GB");

            string tempDir = _configuration["VideoStorage:TempPath"] ?? "/MainServer/temp_videos";
            Directory.CreateDirectory(tempDir);
            string tempFileName = $"{Guid.NewGuid()}{extension}";
            string tempFilePath = Path.Combine(tempDir, tempFileName);

            try
            {
                using (var stream = new FileStream(tempFilePath, FileMode.CreateNew))
                    await request.Video.CopyToAsync(stream);

                if (!File.Exists(tempFilePath))
                    throw new ApiException(ErrorType.ServerError, "Не удалось сохранить временный файл");

                var fileInfo = new FileInfo(tempFilePath);
                if (fileInfo.Length == 0)
                    throw new ApiException(ErrorType.ServerError, "Временный файл пуст");

                using var transaction = await _context.Database.BeginTransactionAsync();

                try
                {
                    var uploadResult = await _storageService.UploadToStorageAsync(request, AuthorId, tempFilePath);

                    var newVideo = new Video
                    {
                        Name = request.Title,
                        Description = request.Description,
                        DateUpload = DateTime.UtcNow,
                        Link = uploadResult.VideoKey,
                        Poster = uploadResult.PosterKey,
                        Likes = 0,
                        Dislikes = 0,
                        Views = 0,
                        IsVerified = false,
                        AuthorId = AuthorId
                    };

                    await _context.Videos.AddAsync(newVideo);
                    await _context.SaveChangesAsync();
                    await transaction.CommitAsync();

                    _logger.LogInformation("Видео успешно загружено. ID: {VideoId}, Пользователь: {AuthorId}", newVideo.Id, AuthorId);
                    return newVideo.Id;
                }
                catch
                {
                    await transaction.RollbackAsync();
                    throw; // Пробрасываем исключение дальше для middleware
                }
            }
            catch (Exception ex) when (ex is not ApiException)
            {
                _logger.LogError(ex, "Неожиданная ошибка при добавлении видео");
                throw new ApiException(ErrorType.ServerError, "Внутренняя ошибка сервера");
            }
            finally
            {
                if (File.Exists(tempFilePath))
                {
                    try
                    {
                        File.Delete(tempFilePath);
                        _logger.LogDebug("Временный файл удалён: {TempFilePath}", tempFilePath);
                    }
                    catch (Exception ex)
                    {
                        _logger.LogWarning(ex, "Не удалось удалить временный файл: {TempFilePath}", tempFilePath);
                    }
                }
            }
        }

        public async Task<List<UserVideoListItemDto>> GetThisUserVideos(int userId)
        {
            List<UserVideoListItemDto> videoList = await _context.Videos
                .AsNoTracking()
                .Include(v => v.Author)
                .OrderByDescending(v => v.Views)
                .Where(v => v.AuthorId == userId)
                .Select(v => new UserVideoListItemDto
                {
                    Id = v.Id,
                    Name = v.Name,
                    Poster = v.PosterUrl,
                    DateUpload = v.DateUpload,
                    AuthorName = v.Author.Name,
                    IsVerified = v.IsVerified
                })
                .ToListAsync();
            return videoList;
        }

        public async Task<DeleteResult> DeleteVideoAsync(int videoId)
        {
            var video = await _context.Videos.FirstOrDefaultAsync(v => v.Id == videoId);
            if (video == null)
                throw new ApiException(ErrorType.NotFound, "Видео не найдено");
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                bool success = await _storageService.DeleteVideoFilesAsync(video.Link, video.Poster);
                if (!success)
                    throw new ApiException(ErrorType.ServerError, "Ошибка при удалении видео из хранилища");
                _context.Videos.Remove(video);
                await _context.SaveChangesAsync();
                await transaction.CommitAsync();
                return new DeleteResult(AffectedTableNames(), true);
            }
            catch
            {
                await transaction.RollbackAsync();
                throw;
            }
        }

        private async Task DeleteLike(Like like, int videoId)
        {
            _context.Remove(like);
            await _context.Videos.Where(v => v.Id == videoId).ExecuteUpdateAsync(s => s.SetProperty(v => v.Likes, v => v.Likes - 1));
        }

        private async Task AddLike(int userId, int videoId)
        {
            await _context.Likes.AddAsync(new Like { UserId = userId, VideoId = videoId });
            await _context.Videos.Where(v => v.Id == videoId).ExecuteUpdateAsync(s => s.SetProperty(v => v.Likes, v => v.Likes + 1));
        }

        private async Task DeleteDislike(Dislike dislike, int videoId)
        {
            _context.Remove(dislike);
            await _context.Videos.Where(v => v.Id == videoId).ExecuteUpdateAsync(s => s.SetProperty(v => v.Dislikes, v => v.Dislikes - 1));
        }

        private async Task AddDislike(int userId, int videoId)
        {
            await _context.DisLikes.AddAsync(new Dislike { UserId = userId, VideoId = videoId });
            await _context.Videos.Where(v => v.Id == videoId).ExecuteUpdateAsync(s => s.SetProperty(v => v.Dislikes, v => v.Dislikes + 1));
        }

        private int CalculateRelevanceScore(Video video, string searchLower)
        {
            int score = 0;
            var nameLower = video.Name.ToLower();
            var descLower = video.Description?.ToLower() ?? "";

            // Точное совпадение названия
            if (nameLower == searchLower) score += 200;

            // Начинается с поисковой строки
            if (nameLower.StartsWith(searchLower)) score += 100;

            // Слово начинается с поисковой строки
            var words = nameLower.Split(new[] { ' ', '.', ',', '!', '?' }, StringSplitOptions.RemoveEmptyEntries);
            if (words.Any(word => word.StartsWith(searchLower))) score += 80;

            // Содержится в названии (чем раньше - тем лучше)
            var index = nameLower.IndexOf(searchLower);
            if (index >= 0) score += Math.Max(0, 50 - index); // Максимум 50 баллов

            // Содержится в описании
            if (descLower.Contains(searchLower)) score += 30;

            return score;
        }

        private List<string?> AffectedTableNames()
        {
            return _context.ChangeTracker.Entries()
                .Where(e => e.State != EntityState.Unchanged)
                .Select(e => e.Metadata.GetTableName())
                .Distinct()
                .ToList();
        }

    }
}
