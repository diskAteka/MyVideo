PRINT '========================================';
PRINT 'Starting: Creating tables';
PRINT '========================================';
GO

USE [videohostingDB];
GO

-- Таблица User
IF NOT EXISTS (SELECT * FROM sys.objects WHERE name = 'User' AND type = 'U')
BEGIN
    CREATE TABLE [dbo].[User](
        [Id] [int] IDENTITY(1,1) NOT NULL,
        [Name] [nvarchar](100) NOT NULL,
        [PasswordHash] [char](64) NOT NULL,
        [Email] [nvarchar](254) NOT NULL,
        [CanUpload] [bit] NOT NULL DEFAULT ((0)),
        [PasswordSalt] [char](32) NOT NULL,
        [RegisteredAt] [datetime2](7) NOT NULL DEFAULT (getutcdate()),
        [IsActive] [bit] NOT NULL DEFAULT ((1)),
        CONSTRAINT [PK_User] PRIMARY KEY CLUSTERED ([Id] ASC)
    );
    PRINT 'Table "User" created';
    
    CREATE UNIQUE NONCLUSTERED INDEX [IX_User_Email] ON [dbo].[User] ([Email] ASC);
    CREATE NONCLUSTERED INDEX [IX_User_Name] ON [dbo].[User] ([Name] ASC);
    PRINT 'Indexes for "User" created';
END
ELSE
    PRINT 'Table "User" already exists';
GO

-- Таблица Video
IF NOT EXISTS (SELECT * FROM sys.objects WHERE name = 'Video' AND type = 'U')
BEGIN
    CREATE TABLE [dbo].[Video](
        [Id] [int] IDENTITY(1,1) NOT NULL,
        [Name] [nvarchar](200) NOT NULL,
        [Description] [nvarchar](2000) NULL,
        [DateUpload] [datetime2](7) NOT NULL DEFAULT (getutcdate()),
        [Link] [nvarchar](500) NOT NULL,
        [Poster] [nvarchar](500) NOT NULL,
        [Likes] [int] NOT NULL DEFAULT ((0)),
        [Dislikes] [int] NOT NULL DEFAULT ((0)),
        [IsVerified] [bit] NOT NULL DEFAULT ((0)),
        [Views] [int] NOT NULL DEFAULT ((0)),
        [AuthorId] [int] NOT NULL,
        CONSTRAINT [PK_Video] PRIMARY KEY CLUSTERED ([Id] ASC)
    );
    PRINT 'Table "Video" created';
    
    CREATE NONCLUSTERED INDEX [IX_Video_DateUpload] ON [dbo].[Video] ([DateUpload] ASC);
    CREATE NONCLUSTERED INDEX [IX_Video_IsVerified] ON [dbo].[Video] ([IsVerified] ASC);
    CREATE NONCLUSTERED INDEX [IX_Video_Name] ON [dbo].[Video] ([Name] ASC);
    PRINT 'Indexes for "Video" created';
END
ELSE
    PRINT 'Table "Video" already exists';
GO

-- Таблица Comment
IF NOT EXISTS (SELECT * FROM sys.objects WHERE name = 'Comment' AND type = 'U')
BEGIN
    CREATE TABLE [dbo].[Comment](
        [Id] [int] IDENTITY(1,1) NOT NULL,
        [VideoId] [int] NOT NULL,
        [UserId] [int] NOT NULL,
        [Text] [nvarchar](1000) NOT NULL,
        [Date] [datetime2](7) NOT NULL DEFAULT (getutcdate()),
        CONSTRAINT [PK_Comment] PRIMARY KEY CLUSTERED ([Id] ASC)
    );
    PRINT 'Table "Comment" created';
    
    CREATE NONCLUSTERED INDEX [IX_Comment_Date] ON [dbo].[Comment] ([Date] ASC);
    CREATE NONCLUSTERED INDEX [IX_Comment_VideoId_Date] ON [dbo].[Comment] ([VideoId] ASC, [Date] ASC);
    PRINT 'Indexes for "Comment" created';
END
ELSE
    PRINT 'Table "Comment" already exists';
GO

-- Таблица Like (исправлено имя, чтобы избежать конфликта с ключевым словом)
IF NOT EXISTS (SELECT * FROM sys.objects WHERE name = '[Like]' AND type = 'U')
BEGIN
    CREATE TABLE [dbo].[Like](
        [Id] [int] IDENTITY(1,1) NOT NULL,
        [VideoId] [int] NOT NULL,
        [UserId] [int] NOT NULL,
        CONSTRAINT [PK_Like] PRIMARY KEY CLUSTERED ([Id] ASC)
    );
    PRINT 'Table "Like" created';
    
    CREATE UNIQUE NONCLUSTERED INDEX [IX_Like_VideoId_UserId] ON [dbo].[Like] ([VideoId] ASC, [UserId] ASC);
    PRINT 'Indexes for "Like" created';
END
ELSE
    PRINT 'Table "Like" already exists';
GO

-- Таблица Dislike
IF NOT EXISTS (SELECT * FROM sys.objects WHERE name = 'Dislike' AND type = 'U')
BEGIN
    CREATE TABLE [dbo].[Dislike](
        [Id] [int] IDENTITY(1,1) NOT NULL,
        [VideoId] [int] NOT NULL,
        [UserId] [int] NOT NULL,
        CONSTRAINT [PK_DisLike] PRIMARY KEY CLUSTERED ([Id] ASC)
    );
    PRINT 'Table "Dislike" created';
    
    CREATE UNIQUE NONCLUSTERED INDEX [IX_DisLike_VideoId_UserId] ON [dbo].[Dislike] ([VideoId] ASC, [UserId] ASC);
    PRINT 'Indexes for "Dislike" created';
END
ELSE
    PRINT 'Table "Dislike" already exists';
GO

-- Таблица View
IF NOT EXISTS (SELECT * FROM sys.objects WHERE name = 'View' AND type = 'U')
BEGIN
    CREATE TABLE [dbo].[View](
        [Id] [int] IDENTITY(1,1) NOT NULL,
        [VideoId] [int] NOT NULL,
        [UserId] [int] NOT NULL,
        CONSTRAINT [PK_View] PRIMARY KEY CLUSTERED ([Id] ASC)
    );
    PRINT 'Table "View" created';
    
    CREATE UNIQUE NONCLUSTERED INDEX [IX_View_VideoId_UserId] ON [dbo].[View] ([VideoId] ASC, [UserId] ASC);
    PRINT 'Indexes for "View" created';
END
ELSE
    PRINT 'Table "View" already exists';
GO

-- Таблица Employee
IF NOT EXISTS (SELECT * FROM sys.objects WHERE name = 'Employee' AND type = 'U')
BEGIN
    CREATE TABLE [dbo].[Employee](
        [Id] [int] NOT NULL,
        [UserName] [nvarchar](50) NOT NULL,
        [Password] [nvarchar](50) NOT NULL,
        [Role] [nvarchar](20) NOT NULL,
        CONSTRAINT [PK_Employee] PRIMARY KEY CLUSTERED ([Id] ASC),
        CONSTRAINT [CHK_Employee_Role] CHECK (([Role]='Verifier' OR [Role]='Admin'))
    );
    PRINT 'Table "Employee" created';
END
ELSE
    PRINT 'Table "Employee" already exists';
GO

-- Таблица ServerLog
IF NOT EXISTS (SELECT * FROM sys.objects WHERE name = 'ServerLog' AND type = 'U')
BEGIN
    CREATE TABLE [dbo].[ServerLog](
        [Id] [int] IDENTITY(1,1) NOT NULL,
        [Text] [nvarchar](max) NOT NULL,
        [AffectedTable] [nvarchar](128) NOT NULL,
        [ActionType] [nvarchar](50) NOT NULL,
        [EmployeeId] [int] NOT NULL,
        [Date] [datetime] NOT NULL DEFAULT (getdate()),
        CONSTRAINT [PK_ServerLog] PRIMARY KEY CLUSTERED ([Id] ASC),
        CONSTRAINT [CHK_ServerLog_ActionType] CHECK (([ActionType]='EXECUTE' OR [ActionType]='SELECT' OR [ActionType]='DELETE' OR [ActionType]='UPDATE' OR [ActionType]='INSERT'))
    );
    PRINT '✓ Table "ServerLog" created';
    
    CREATE NONCLUSTERED INDEX [IX_ServerLog_Date] ON [dbo].[ServerLog] ([Date] ASC);
    CREATE NONCLUSTERED INDEX [IX_ServerLog_EmployeeId] ON [dbo].[ServerLog] ([EmployeeId] ASC);
    PRINT '✓ Indexes for "ServerLog" created';
END
ELSE
    PRINT '! Table "ServerLog" already exists';
GO

PRINT '========================================';
PRINT 'Tables creation completed';
PRINT '========================================';
GO