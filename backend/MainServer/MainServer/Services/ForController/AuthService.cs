using MainServer.Data;
using MainServer.Enum;
using MainServer.Interfaces;
using MainServer.Services.Main;
using Microsoft.EntityFrameworkCore;
using SharedLib.Contracts.Admin;
using SharedLib.Contracts.Request.Auth;
using SharedLib.Contracts.Response.Auth;
using SharedLib.Contracts.Response.Video;
using SharedLib.Contracts.RezultModels;
using SharedLib.Interfaces;
using SharedLib.Models;

namespace MainServer.Services.ForController
{
    public class AuthService : IAuthService
    {
        private readonly IPasswordHasher _passwordHasher;
        private readonly AppDbContext _context;
        private readonly ILogger<AuthService> _logger;
        private readonly ITokenService _tokenService;

        public AuthService(AppDbContext context, ILogger<AuthService> logger, IPasswordHasher passwordHasher, ITokenService tokenService)
        {
            _context = context;
            _logger = logger;
            _passwordHasher = passwordHasher;
            _tokenService = tokenService;
        }

        public async Task<TokenResponse> RegisterAsync(RegisterRequest register)
        {
            User? existingUser = await _context.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Email == register.Email);

            if (existingUser != null)
                throw new ApiException(ErrorType.Conflict, "Пользователь с таким Email уже существует");

            (string hash, string salt) passwordhash = _passwordHasher.HashPassword(register.Password);

            User user = new User
            {
                Name = register.Username.Trim(),
                Email = register.Email.ToLowerInvariant(),
                PasswordHash = passwordhash.hash,
                PasswordSalt = passwordhash.salt,
                RegisteredAt = DateTime.UtcNow,
                IsActive = true,
                CanUpload = false
            };

            await _context.Users.AddAsync(user);
            await _context.SaveChangesAsync();
            string token = _tokenService.GenerateToken(user.Id, user.Name, user.Email, user.CanUpload);
            TokenResponse respose = new()
            {
                Token = token,
                User = new UserResponse()
                {
                    Id = user.Id,
                    Name = user.Name,
                    Email = user.Email,
                    IsActive = user.IsActive,
                    CanUpload = user.CanUpload,
                    RegisteredAt = user.RegisteredAt
                }
            };
            return respose;
        }

        public async Task<TokenResponse> LoginAsync(LoginRequest login)
        {
            // 1. Базовая валидация входных данных
            if (login == null)
                throw new ApiException(ErrorType.ValidationError, "Данные запроса отсутствуют");

            if (string.IsNullOrEmpty(login.Password))
                throw new ApiException(ErrorType.ValidationError, "Пароль обязателен");

            if (string.IsNullOrEmpty(login.Email) && string.IsNullOrEmpty(login.Username))
                throw new ApiException(ErrorType.ValidationError, "Email или имя пользователя обязательны");

            // 2. Подготавливаем значения ДО запроса к БД
            var email = login.Email?.Trim().ToLowerInvariant();
            var userName = login.Username?.Trim().ToLower();

            // 3. Строим запрос динамически
            IQueryable<User> query = _context.Users;

            if (!string.IsNullOrEmpty(email) && !string.IsNullOrEmpty(userName))
                query = query.Where(u => u.Email.ToLower() == email || u.Name.ToLower() == userName);
            else if (!string.IsNullOrEmpty(email))
                query = query.Where(u => u.Email.ToLower() == email);
            else
                query = query.Where(u => u.Name.ToLower() == userName);

            var user = await query.FirstOrDefaultAsync();

            if (user == null)
                throw new ApiException(ErrorType.NotFound, "Пользователь не найден");

            bool isValid = _passwordHasher.VerifyPassword(
                login.Password,
                user.PasswordHash,
                user.PasswordSalt);

            if (!isValid)
                throw new ApiException(ErrorType.Unauthorized, "Неверный пароль");

            if (!user.IsActive)
                throw new ApiException(ErrorType.Forbidden, "Аккаунт деактивирован");

            string token = _tokenService.GenerateToken(
                user.Id,
                user.Name,
                user.Email,
                user.CanUpload);

            return new TokenResponse
            {
                Token = token,
                User = new UserResponse
                {
                    Id = user.Id,
                    Name = user.Name,
                    Email = user.Email,
                    CanUpload = user.CanUpload,
                    RegisteredAt = user.RegisteredAt,
                    IsActive = user.IsActive
                }
            };
        }

        public async Task<MeResponse> GetMeAsync(int id)
        {
            if (id <= 0)
                throw new ApiException(ErrorType.ValidationError, $"ID должен быть больше 0. Получено: {id}");

            User? user = await _context.Users.FindAsync(id);

            if (user == null)
                throw new ApiException(ErrorType.NotFound, $"Пользователя с ID {id} не существует");

            var result = new MeResponse
            {
                Name = user.Name,
                Email = user.Email,
                CanUpload = user.CanUpload,
                IsActive = user.IsActive,
                Success = true,
                Message = "Пользователь найден"
            };

            return result;
        }

        public async Task<UpdateRezult> ForcedPasswordResetAsync(int id, ForcedPasswordResetRequest request)
        {
            User? existingUser = await _context.Users.FirstOrDefaultAsync(u => u.Id == id);

            if (existingUser == null)
                throw new ApiException(ErrorType.NotFound, $"Пользователь с ID {id} не найден");

            (string hash, string salt) encryptedPassword = _passwordHasher.HashPassword(request.NewPassword);
            existingUser.PasswordHash = encryptedPassword.hash;
            existingUser.PasswordSalt = encryptedPassword.salt;

            var affectedTables = AffectedTableNames();
            int affectedRows = await _context.SaveChangesAsync();
            return new UpdateRezult(affectedTables, affectedRows > 0);
        }

        public async Task<string> EmployeeLoginAsync(EmployeeLoginRequest request)
        {
            if (string.IsNullOrEmpty(request.Username) || string.IsNullOrEmpty(request.Password))
                throw new ApiException(ErrorType.ValidationError, "Неверный формат входящих данных");

            var existingEmployee = await _context.Employees.AsNoTracking().FirstOrDefaultAsync(e => e.UserName == request.Username);

            if (existingEmployee == null)
                throw new ApiException(ErrorType.NotFound, "Сотрудник с таким логином не найден");

            if (existingEmployee.Password != request.Password)
                throw new ApiException(ErrorType.Unauthorized, "Неверный пароль");

            string token = _tokenService.GenerateEmployeeToken(existingEmployee.Id, existingEmployee.UserName, existingEmployee.Role);
            return token;
        }

        public async Task<AddRezult> ForcedUserAddAsync(PostUserRequest request)
        {
            User? existingUser = await _context.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Email == request.Email);

            if (existingUser != null)
                throw new ApiException(ErrorType.Conflict, "Пользователь с таким Email уже существует");

            (string hash, string salt) passwordhash = _passwordHasher.HashPassword(request.Password);

            User user = new User
            {
                Name = request.UserName.Trim(),
                Email = request.Email.ToLowerInvariant(),
                PasswordHash = passwordhash.hash,
                PasswordSalt = passwordhash.salt,
                RegisteredAt = request.RegisteredAt,
                IsActive = request.IsActive,
                CanUpload = request.CanUpload
            };

            await _context.Users.AddAsync(user);
            var affectedTables = AffectedTableNames();
            int affectedRows = await _context.SaveChangesAsync();
            return new AddRezult(affectedTables, affectedRows > 0);
        }

        public async Task<UpdateRezult> ForcedUserUpdateAsync(int id, PutUserRequest request)
        {
            User? existingUser = await _context.Users.FirstOrDefaultAsync(u => u.Id == id);

            if (existingUser == null)
                throw new ApiException(ErrorType.NotFound, $"Пользователь с ID {id} не найден");

            existingUser.Name = request.Name.Trim();
            existingUser.Email = request.Email.ToLowerInvariant();
            existingUser.CanUpload = request.CanUpload;
            existingUser.RegisteredAt = request.RegisteredAt;
            existingUser.IsActive = request.IsActive;

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