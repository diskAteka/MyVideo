using MainServer.Data;
using Microsoft.EntityFrameworkCore;
using SharedLib.Contracts.RezultModels;
using SharedLib.Interfaces;

namespace MainServer.Services.DataBaseServices
{
    public class AddObjectService : IAddObjectService
    {
        private AppDbContext _context;
        public AddObjectService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<AddRezult> AddAsync<T>(T table) where T : class, IAddble
        {
            var dbSet = _context.Set<T>();
            await dbSet.AddAsync(table);
            var affectedTables = AffectedTableNames();
            int affectedRows = await _context.SaveChangesAsync();
            return new AddRezult(affectedTables, affectedRows > 0);
        }

        private List<string?> AffectedTableNames()
        {
            return _context.ChangeTracker.Entries()
                .Where(e => e.State != EntityState.Unchanged)
                .Select(e => e.Metadata.GetTableName())
                .Distinct()
                .ToList();
        }
    }//Класс - сервис отвечающий за добавление сущностей в БД.
     //Реализует интерфейс IAddObjectService, который определяет методы для добавления записей в любые таблицы, кроме таблицы ServerLog.
     //Generic метод реализует добавление сущности и возвращает результат в виде структуры AddRezult,
     //которая содержит информацию об успешности операции и затронутых таблицах.
}
