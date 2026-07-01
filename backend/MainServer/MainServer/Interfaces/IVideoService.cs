using SharedLib.Contracts.Admin;
using SharedLib.Contracts.Request.Video;
using SharedLib.Contracts.Response.Video;
using SharedLib.Contracts.RezultModels;
using SharedLib.Models;

namespace MainServer.Interfaces
{
    public interface IVideoService
    {
        public Task<List<VideoListItemResponse>> GetAllVideoAsync();
        public Task<VideoDetailsResponse> GetVideoAsync(int videoId, int userId);
        public Task<List<VideoListItemResponse>> VideoSearchAsync(string query, int limit = 10);
        public Task NewCommentAsync(CreateCommentRequest request, int userId, int videoId);
        public Task ReactionAsync(ReactionRequest request, int userId, int videoId);
        public Task<List<CommentResponse>> GetCommentsAsync(int videoId);
        public Task<Video> GetVideoMetadataAsync(int videoId);
        public Task<int> NewVideoAsync(VideoUploadRequest request, int AuthorId);
        public Task<List<UserVideoListItemDto>> GetThisUserVideos(int userId);
        public Task<DeleteResult> DeleteVideoAsync(int videoId);
        public Task<UpdateRezult> VerifyVideoAsync(int videoId);

    }
}
