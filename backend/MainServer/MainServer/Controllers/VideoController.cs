using MainServer.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SharedLib.Contracts.Request.Video;
using SharedLib.Contracts.Response.Auth;
using SharedLib.Contracts.Response.Video;
using System.Security.Claims;

namespace MainServer.Controllers
{
    [ApiController]
    [Route("api/videos")]
    [ApiExplorerSettings(GroupName = "v1")]
    public class VideoController : ControllerBase
    {
        private readonly IVideoService _videoService;
        private readonly IStorageService _storageService;

        public VideoController(IVideoService videoService, IStorageService storageService)
        {
            _videoService = videoService;
            _storageService = storageService;
        }

        [HttpGet]
        [ProducesResponseType(typeof(List<VideoListItemResponse>), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetAllVideo()
        {
            List<VideoListItemResponse> videos = await _videoService.GetAllVideoAsync();
            return Ok(videos);
        }

        [HttpGet("search")]
        [ProducesResponseType(typeof(List<VideoListItemResponse>), StatusCodes.Status200OK)]
        public async Task<IActionResult> SearchVideo([FromQuery] string query)
        {
            List<VideoListItemResponse> videos = await _videoService.VideoSearchAsync(query);
            return Ok(videos);
        }

        [HttpGet("{id}")]
        [Authorize]
        [ProducesResponseType(typeof(VideoDetailsResponse), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetVideo(int id)
        {
            var nameIdentifier = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(nameIdentifier))
                return Unauthorized(new { message = "Не удалось определить идентификатор пользователя." });

            int userId = int.Parse(nameIdentifier);
            VideoDetailsResponse video = await _videoService.GetVideoAsync(id, userId);
            return Ok(video);
        }

        [HttpPost("{videoId}/reaction")]
        [Authorize]
        [ProducesResponseType(typeof(ReactionRequest), StatusCodes.Status200OK)]
        public async Task<IActionResult> Reaction(int videoId, [FromBody] ReactionRequest reaction)
        {
            var nameIdentifier = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(nameIdentifier))
                return Unauthorized(new { message = "Не удалось определить идентификатор пользователя." });

            int userId = int.Parse(nameIdentifier);

            await _videoService.ReactionAsync(reaction, userId, videoId);
            return Ok();
        }

        [HttpGet("{id}/comments")]
        [ProducesResponseType(typeof(List<CommentResponse>), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetVideoComment(int id)
        {
            List<CommentResponse> comments = await _videoService.GetCommentsAsync(id);
            return Ok(comments);
        }

        [HttpPost("{videoId}/comments")]
        [Authorize]
        [ProducesResponseType(typeof(CreateCommentResponse), StatusCodes.Status200OK)]
        public async Task<IActionResult> NewComment([FromBody] CreateCommentRequest comment, int videoId)
        {
            var nameIdentifier = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(nameIdentifier))
                return Unauthorized(new { message = "Не удалось определить идентификатор пользователя." });

            int userId = int.Parse(nameIdentifier);
            CreateCommentResponse response = new()
            {
                UserId = userId,
                Text = comment.Text,
                VideoId = videoId
            };
            await _videoService.NewCommentAsync(comment, userId, videoId);
            return Ok(response);
        }

        [HttpGet("{id}/stream")]
        [ProducesResponseType(typeof(string), StatusCodes.Status200OK)]
        public async Task<IActionResult> StreamVideo(int id)
        {
            var video = await _videoService.GetVideoMetadataAsync(id);
            var url = await _storageService.GeneratePresignedUrlAsync(video.Link, expiryHours: 1);
            return Redirect(url);
        }

        [HttpPost("upload")]
        [Authorize]
        [ProducesResponseType(typeof(VideoDetailsResponse), StatusCodes.Status200OK)]
        public async Task<IActionResult> UploadVideo([FromForm] VideoUploadRequest request)
        {
            var nameIdentifier = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(nameIdentifier))
                return Unauthorized(new { message = "Не удалось определить идентификатор пользователя." });

            int userId = int.Parse(nameIdentifier);
            int newVideoId = await _videoService.NewVideoAsync(request, userId);
            VideoDetailsResponse video = await _videoService.GetVideoAsync(newVideoId, userId);
            return Ok(video);
        }

        [HttpGet("upload")]
        [Authorize]
        [ProducesResponseType(typeof(List<UserVideoListItemDto>), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetUserVideos()
        {
            var nameIdentifier = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(nameIdentifier))
                return Unauthorized(new { message = "Не удалось определить идентификатор пользователя." });

            int userId = int.Parse(nameIdentifier);
            List<UserVideoListItemDto> videos = await _videoService.GetThisUserVideos(userId);
            return Ok(videos);
        }
    }
}