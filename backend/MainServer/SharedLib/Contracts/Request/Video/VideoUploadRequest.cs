using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System.ComponentModel.DataAnnotations;

namespace SharedLib.Contracts.Request.Video
{
    public class VideoUploadRequest
    {
        [FromForm(Name = "title")]
        [Required(ErrorMessage = "Title is required")]
        public string Title { get; set; } = null!;

        [FromForm(Name = "description")]
        public string? Description { get; set; }

        [FromForm(Name = "video")]
        public IFormFile? Video {  get; set; }
    }
}
