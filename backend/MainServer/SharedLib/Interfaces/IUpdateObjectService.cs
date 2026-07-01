using SharedLib.Contracts.RezultModels;

namespace SharedLib.Interfaces
{
    public interface IUpdateObjectService
    {
        public Task<UpdateRezult> UpdateAsync<T>(T table) where T : class, IUpdateble;
    }
}
