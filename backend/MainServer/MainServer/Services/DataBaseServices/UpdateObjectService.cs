using MainServer.Data;
using MainServer.Enum;
using MainServer.Services.Main;
using Microsoft.EntityFrameworkCore;
using SharedLib.Contracts.RezultModels;
using SharedLib.Interfaces;

namespace MainServer.Services.DataBaseServices
{
    public class UpdateObjectService : IUpdateObjectService
    {
        private AppDbContext _context;

        public UpdateObjectService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<UpdateRezult> UpdateAsync<T>(T table) where T : class, IUpdateble
        {
            var dbSet = _context.Set<T>();
            bool exists = await dbSet.AnyAsync(e => EF.Property<int>(e, "Id") == EF.Property<int>(table, "Id"));

            if (!exists)
                throw new ApiException(ErrorType.NotFound,
                    $"Объект типа {typeof(T)} с id {EF.Property<int>(table, "Id")} не найден");

            dbSet.Update(table);
            var affectedTables = AffectedTableNames();
            int affectedRows = await _context.SaveChangesAsync();
            return new UpdateRezult(affectedTables, affectedRows > 0);
        }

        private List<string?> AffectedTableNames()
        {
            return _context.ChangeTracker.Entries()
                .Where(e => e.State != EntityState.Unchanged)
                .Select(e => e.Metadata.GetTableName())
                .Distinct()
                .ToList();
        }
    }
}