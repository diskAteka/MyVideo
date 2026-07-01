using SharedLib.Contracts.RezultModels;

namespace SharedLib.Interfaces
{
    public interface IDeleteObjectService
    {
        //Этот интерфейс должен отвечать за удаление любых сущностей в БД

        public Task<DeleteResult> DeleteAsync<T>(int id) where T : class, IDeleteble;
    }
}
