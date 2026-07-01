namespace MainServer.Services.ForService
{
    public class StoragePathBuilder
    {
        private readonly string _videoPrefix;
        private readonly string _posterPrefix;

        public StoragePathBuilder(string videoPrefix, string posterPrefix)
        {
            _videoPrefix = videoPrefix.TrimEnd('/') + '/';
            _posterPrefix = posterPrefix.TrimEnd('/') + '/';
        }

        public string BuildVideoKey(string extension) =>
            $"{_videoPrefix}{Guid.NewGuid()}{NormalizeExtension(extension)}";

        public string BuildPosterKey(string extension) =>
            $"{_posterPrefix}{Guid.NewGuid()}{NormalizeExtension(extension)}";

        private static string NormalizeExtension(string ext) =>
            string.IsNullOrEmpty(ext) || ext.StartsWith('.') ? ext : $".{ext}";
    }
}
