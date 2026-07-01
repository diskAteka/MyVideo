using SharedLib.Contracts.Admin;

namespace SharedLib.Interfaces
{
    public interface IGetObjectService
    {
        public Task<List<T>> GetObjectsAsync<T>(QueryParameters parameters) where T : class , IModel;

        public Task<int> GetCountOfRecordsAsync<T>() where T : class, IModel;

        public Task<IModel> GetObjectAsync<T>(int id) where T : class, IModel;
    }
}
