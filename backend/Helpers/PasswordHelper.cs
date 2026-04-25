namespace SalesSystem.Helpers;

public static class PasswordHelper
{
    private const int CostFactor = 12;

    public static string HashPassword(string password)
    {
        return BCrypt.Net.BCrypt.HashPassword(password, CostFactor);
    }

    public static bool VerifyPassword(string password, string hash)
    {
        return BCrypt.Net.BCrypt.Verify(password, hash);
    }
}