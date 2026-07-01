using AutoMapper;
using SharedLib.Contracts.Admin;
using SharedLib.Models;

namespace MainServer.Services.ForService
{
    public class MappingProfile : Profile
    {
        public MappingProfile()
        {
            CreateMap<User, GetUserResponse>();
            CreateMap<Comment, GetCommentResponse>();
            CreateMap<Video, GetVideoResponse>();
            CreateMap<Like, GetLikeResponse>();
            CreateMap<Dislike, GetDislikeResponse>();
            CreateMap<View, GetViewResponse>();
            CreateMap<ServerLog, GetServerLogResponse>();

            CreateMap<PostPutCommentRequest, Comment>();
            CreateMap<PostVideoRequest, Video>();
            CreateMap<PostLikeRequest, Like>();
            CreateMap<PostDislikeRequest, Dislike>();
            CreateMap<PostViewRequest, View>();
            CreateMap<PostLikeRequest, Like>();
            CreateMap<PostPutEmployeeRequest, Employee>();
        }
    }
}
