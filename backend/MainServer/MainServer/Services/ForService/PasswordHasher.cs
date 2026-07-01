using MainServer.Interfaces;
using System.Security.Cryptography;
using System.Text;

namespace MainServer.Services.ForService
{
    public class PasswordHasher : IPasswordHasher
    {
        public (string Hash, string Salt) HashPassword(string password)
        {
            // Генерируем соль
            byte[] salt = new byte[16];
            using (var rng = RandomNumberGenerator.Create())
            {
                rng.GetBytes(salt);
            }
            string saltString = Convert.ToBase64String(salt);

            // Создаём хэш (пароль + соль)
            string hash = GetHash(password + saltString);

            return (hash, saltString);
        }

        public bool VerifyPassword(string password, string hash, string salt)
        {
            hash = hash?.Trim();
            salt = salt?.Trim();

            string newHash = GetHash(password + salt);
            return hash == newHash;
        }

        public string GetHash(string input)
        {
            using (var sha256 = SHA256.Create())
            {
                byte[] bytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(input));
                return Convert.ToBase64String(bytes);
            }
        }
    }
}
