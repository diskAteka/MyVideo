using MainServer.Data;
using MainServer.Enum;
using MainServer.Services.Main;
using Microsoft.EntityFrameworkCore;
using SharedLib.Contracts.RezultModels;
using SharedLib.Interfaces;

namespace MainServer.Services.DataBaseServices
{
    public class DeleteObjectService : IDeleteObjectService
    {
        private readonly AppDbContext _context;

        public DeleteObjectService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<DeleteResult> DeleteAsync<T>(int id) where T : class, IDeleteble
        {
            var dbSet = _context.Set<T>();
            var entity = await dbSet.FindAsync(id);
            if (entity == null)
                throw new ApiException(ErrorType.NotFound, $"Объект типа {typeof(T)} с id {id} не найден");
            dbSet.Remove(entity);
            var affectedTables = AffectedTableNames();
            int affectedRows = await _context.SaveChangesAsync();
            return new DeleteResult(affectedTables, affectedRows > 0);
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