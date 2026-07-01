PRINT '========================================';
PRINT 'Starting: Granting permissions';
PRINT '========================================';
GO

USE [videohostingDB];
GO

-- Права для main_server_user (полный доступ)
ALTER ROLE [db_datareader] ADD MEMBER [main_server_user];
ALTER ROLE [db_datawriter] ADD MEMBER [main_server_user];
ALTER ROLE [db_ddladmin] ADD MEMBER [main_server_user];
GRANT EXECUTE TO [main_server_user];
PRINT 'Permissions granted to main_server_user';

-- Права для viewing_server_user (только чтение)
ALTER ROLE [db_datareader] ADD MEMBER [viewing_server_user];
PRINT 'Permissions granted to viewing_server_user';

-- Права для download_server_user (только чтение)
ALTER ROLE [db_datareader] ADD MEMBER [download_server_user];
PRINT 'Permissions granted to download_server_user';

PRINT '========================================';
PRINT 'Permissions granted successfully';
PRINT '========================================';
GO