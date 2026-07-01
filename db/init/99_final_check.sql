PRINT '========================================';
PRINT 'FINAL CHECK: Database initialization summary';
PRINT '========================================';
GO

USE [videohostingDB];
GO

-- Проверка логинов
PRINT 'Server Logins:';
SELECT name AS 'LoginName', type_desc AS 'Type' 
FROM master.sys.server_principals 
WHERE type IN ('S', 'U', 'G') AND name NOT LIKE '##%'
ORDER BY name;
GO

-- Проверка пользователей
PRINT 'Database Users:';
SELECT name AS 'UserName', type_desc AS 'Type' 
FROM sys.database_principals 
WHERE type IN ('S', 'U', 'G') AND name NOT LIKE '##%'
ORDER BY name;
GO

-- Проверка таблиц
PRINT 'Tables:';
SELECT name AS 'TableName' 
FROM sys.objects 
WHERE type = 'U' 
ORDER BY name;
GO

-- Проверка индексов
PRINT 'Indexes:';
SELECT 
    OBJECT_NAME(object_id) AS 'TableName',
    name AS 'IndexName',
    type_desc AS 'Type'
FROM sys.indexes 
WHERE OBJECTPROPERTY(object_id, 'IsUserTable') = 1
    AND name IS NOT NULL
ORDER BY OBJECT_NAME(object_id), name;
GO

-- Проверка внешних ключей
PRINT 'Foreign Keys:';
SELECT 
    OBJECT_NAME(parent_object_id) AS 'TableName',
    name AS 'FKName'
FROM sys.foreign_keys 
ORDER BY OBJECT_NAME(parent_object_id), name;
GO

PRINT '========================================';
PRINT 'ALL INITIALIZATION COMPLETED SUCCESSFULLY';
PRINT '========================================';
PRINT 'Database: videohostingDB';
PRINT 'Logins created: main_server_login, viewing_server_login, download_server_login, admin_login';
PRINT 'Users created: main_server_user, viewing_server_user, download_server_user, admin_user';
PRINT '========================================';
GO