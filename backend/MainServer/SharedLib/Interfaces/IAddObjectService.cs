using SharedLib.Contracts.RezultModels;

namespace SharedLib.Interfaces
{
    public interface IAddObjectService
    {
        public Task<AddRezult> AddAsync<T>(T table) where T : class, IAddble; 
        //Наследование от интерфейса IAdd гарантирует что не будут переданы объекты,
        //которые не предназначены для добавления в базу данных
    }
}
