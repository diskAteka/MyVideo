PRINT '========================================';
PRINT 'Starting: Creating database users';
PRINT '========================================';
GO

USE [videohostingDB];
GO

-- Создаем пользователей, если их нет
IF NOT EXISTS (SELECT * FROM sys.database_principals WHERE name = 'main_server_user')
BEGIN
    CREATE USER [main_server_user] FOR LOGIN [main_server_login] WITH DEFAULT_SCHEMA=[dbo];
    PRINT 'User "main_server_user" created successfully';
END
ELSE
    PRINT 'User "main_server_user" already exists';

IF NOT EXISTS (SELECT * FROM sys.database_principals WHERE name = 'viewing_server_user')
BEGIN
    CREATE USER [viewing_server_user] FOR LOGIN [viewing_server_login] WITH DEFAULT_SCHEMA=[dbo];
    PRINT 'User "viewing_server_user" created successfully';
END
ELSE
    PRINT 'User "viewing_server_user" already exists';

IF NOT EXISTS (SELECT * FROM sys.database_principals WHERE name = 'download_server_user')
BEGIN
    CREATE USER [download_server_user] FOR LOGIN [download_server_login] WITH DEFAULT_SCHEMA=[dbo];
    PRINT 'User "download_server_user" created successfully';
END
ELSE
    PRINT 'User "download_server_user" already exists';

IF NOT EXISTS (SELECT * FROM sys.database_principals WHERE name = 'admin_user')
BEGIN
    CREATE USER [admin_user] FOR LOGIN [admin_login] WITH DEFAULT_SCHEMA=[dbo];
    PRINT 'User "admin_user" created successfully';
END
ELSE
    PRINT 'User "admin_user" already exists';
GO

-- Назначаем роли
PRINT 'Assigning roles...';
ALTER ROLE [db_owner] ADD MEMBER [admin_user];
PRINT '✓ "admin_user" added to db_owner role';
GO

-- Выводим всех пользователей
PRINT '========================================';
PRINT 'Current database users:';
PRINT '========================================';
SELECT name AS 'UserName', type_desc AS 'Type', default_schema_name AS 'DefaultSchema'
FROM sys.database_principals 
WHERE type IN ('S', 'U', 'G') AND name NOT LIKE '##%'
ORDER BY name;
GO

PRINT '========================================';
PRINT 'Users creation completed';
PRINT '========================================';
GO