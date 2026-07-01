PRINT '========================================';
PRINT 'Starting: Creating server logins';
PRINT '========================================';
GO

USE [master];
GO

-- Создаем логины, если их нет
IF NOT EXISTS (SELECT * FROM sys.server_principals WHERE name = 'main_server_login')
BEGIN
    CREATE LOGIN main_server_login WITH PASSWORD = 'main_server', CHECK_POLICY = OFF;
    PRINT 'Login "main_server_login" created successfully';
END
ELSE
    PRINT 'Login "main_server_login" already exists';

IF NOT EXISTS (SELECT * FROM sys.server_principals WHERE name = 'viewing_server_login')
BEGIN
    CREATE LOGIN viewing_server_login WITH PASSWORD = 'viewing_server', CHECK_POLICY = OFF;
    PRINT 'Login "viewing_server_login" created successfully';
END
ELSE
    PRINT 'Login "viewing_server_login" already exists';

IF NOT EXISTS (SELECT * FROM sys.server_principals WHERE name = 'download_server_login')
BEGIN
    CREATE LOGIN download_server_login WITH PASSWORD = 'download_server', CHECK_POLICY = OFF;
    PRINT 'Login "download_server_login" created successfully';
END
ELSE
    PRINT 'Login "download_server_login" already exists';

IF NOT EXISTS (SELECT * FROM sys.server_principals WHERE name = 'admin_login')
BEGIN
    CREATE LOGIN admin_login WITH PASSWORD = 'admin_password', CHECK_POLICY = OFF;
    PRINT 'Login "admin_login" created successfully';
END
ELSE
    PRINT 'Login "admin_login" already exists';
GO

-- Выводим все логины для проверки
PRINT '========================================';
PRINT 'Current server logins:';
PRINT '========================================';
SELECT name AS 'LoginName', type_desc AS 'Type', is_disabled AS 'Disabled' 
FROM sys.server_principals 
WHERE type IN ('S', 'U', 'G') 
ORDER BY name;
GO

PRINT '========================================';
PRINT 'Logins initialization completed';
PRINT '========================================';
GO