using MainServer.Data;
using MainServer.Enum;
using MainServer.Services.Main;
using Microsoft.EntityFrameworkCore;
using SharedLib.Contracts.Admin;
using SharedLib.Interfaces;
using System.Linq.Dynamic.Core;

namespace MainServer.Services.DataBaseServices
{
    public class GetObjectSevice : IGetObjectService
    {
        private AppDbContext _context;

        public GetObjectSevice(AppDbContext context)
        {
            _context = context;
        }

        public async Task<List<T>> GetObjectsAsync<T>(QueryParameters parameters) where T : class, IModel
        {
            var query = _context.Set<T>().AsNoTracking();
            query = ApplySortingDynamic(query, parameters);

            int skip = (parameters.Page - 1) * parameters.PageSize;
            var result = await query
                .Skip(skip)
                .Take(parameters.PageSize)
                .ToListAsync();

            return result;
        }

        public async Task<int> GetCountOfRecordsAsync<T>() where T : class, IModel
        {
            return await _context.Set<T>().CountAsync();
        }

        public async Task<IModel> GetObjectAsync<T>(int id) where T : class, IModel
        {
            var entity = await _context.Set<T>().FindAsync(id);
            return entity ?? throw new ApiException(ErrorType.NotFound, $"Объект типа {typeof(T)} с id {id} не найден");
        }

        private IQueryable<T> ApplySortingDynamic<T>(IQueryable<T> query, QueryParameters parameters)
        {
            if (string.IsNullOrWhiteSpace(parameters.SortBy))
            {
                return parameters.SortAscending
                    ? query.OrderBy("Id ASC")
                    : query.OrderBy("Id DESC");
            }

            string orderByString = $"{parameters.SortBy} {(parameters.SortAscending ? "ASC" : "DESC")}";

            try
            {
                return query.OrderBy(orderByString);
            }
            catch
            {
                return query.OrderBy("Id ASC");
            }
        }
    }
}