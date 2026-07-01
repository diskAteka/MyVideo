PRINT '========================================';
PRINT 'Starting: Creating foreign keys';
PRINT '========================================';
GO

USE [videohostingDB];
GO

-- Foreign Key для Video (AuthorId -> User.Id)
IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_Video_User')
BEGIN
    ALTER TABLE [dbo].[Video] ADD CONSTRAINT [FK_Video_User] FOREIGN KEY ([AuthorId]) REFERENCES [dbo].[User] ([Id]);
    PRINT 'FK_Video_User created';
END
ELSE
    PRINT 'FK_Video_User already exists';
GO

-- Foreign Key для Comment (VideoId -> Video.Id)
IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_Comment_Video')
BEGIN
    ALTER TABLE [dbo].[Comment] ADD CONSTRAINT [FK_Comment_Video] FOREIGN KEY ([VideoId]) REFERENCES [dbo].[Video] ([Id]) ON DELETE CASCADE;
    PRINT 'FK_Comment_Video created';
END
ELSE
    PRINT 'FK_Comment_Video already exists';
GO

-- Foreign Key для Comment (UserId -> User.Id)
IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_Comment_User')
BEGIN
    ALTER TABLE [dbo].[Comment] ADD CONSTRAINT [FK_Comment_User] FOREIGN KEY ([UserId]) REFERENCES [dbo].[User] ([Id]);
    PRINT 'FK_Comment_User created';
END
ELSE
    PRINT 'FK_Comment_User already exists';
GO

-- Foreign Key для Like (VideoId -> Video.Id)
IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_Like_Video')
BEGIN
    ALTER TABLE [dbo].[Like] ADD CONSTRAINT [FK_Like_Video] FOREIGN KEY ([VideoId]) REFERENCES [dbo].[Video] ([Id]) ON DELETE CASCADE;
    PRINT 'FK_Like_Video created';
END
ELSE
    PRINT 'FK_Like_Video already exists';
GO

-- Foreign Key для Like (UserId -> User.Id)
IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_Like_User')
BEGIN
    ALTER TABLE [dbo].[Like] ADD CONSTRAINT [FK_Like_User] FOREIGN KEY ([UserId]) REFERENCES [dbo].[User] ([Id]);
    PRINT 'FK_Like_User created';
END
ELSE
    PRINT 'FK_Like_User already exists';
GO

-- Foreign Key для DisLike (VideoId -> Video.Id)
IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_DisLike_Video')
BEGIN
    ALTER TABLE [dbo].[Dislike] ADD CONSTRAINT [FK_DisLike_Video] FOREIGN KEY ([VideoId]) REFERENCES [dbo].[Video] ([Id]) ON DELETE CASCADE;
    PRINT 'FK_DisLike_Video created';
END
ELSE
    PRINT 'FK_DisLike_Video already exists';
GO

-- Foreign Key для Dislike (UserId -> User.Id)
IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_DisLike_User')
BEGIN
    ALTER TABLE [dbo].[Dislike] ADD CONSTRAINT [FK_DisLike_User] FOREIGN KEY ([UserId]) REFERENCES [dbo].[User] ([Id]);
    PRINT 'FK_DisLike_User created';
END
ELSE
    PRINT 'FK_DisLike_User already exists';
GO

-- Foreign Key для View (VideoId -> Video.Id)
IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_View_Video')
BEGIN
    ALTER TABLE [dbo].[View] ADD CONSTRAINT [FK_View_Video] FOREIGN KEY ([VideoId]) REFERENCES [dbo].[Video] ([Id]) ON DELETE CASCADE;
    PRINT 'FK_View_Video created';
END
ELSE
    PRINT 'FK_View_Video already exists';
GO

-- Foreign Key для View (UserId -> User.Id)
IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_View_User')
BEGIN
    ALTER TABLE [dbo].[View] ADD CONSTRAINT [FK_View_User] FOREIGN KEY ([UserId]) REFERENCES [dbo].[User] ([Id]);
    PRINT 'FK_View_User created';
END
ELSE
    PRINT 'FK_View_User already exists';
GO

-- Foreign Key для ServerLog (EmployeeId -> Employee.Id)
IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_ServerLog_Employee')
BEGIN
    ALTER TABLE [dbo].[ServerLog] ADD CONSTRAINT [FK_ServerLog_Employee] FOREIGN KEY ([EmployeeId]) REFERENCES [dbo].[Employee] ([Id]);
    PRINT 'FK_ServerLog_Employee created';
END
ELSE
    PRINT 'FK_ServerLog_Employee already exists';
GO

PRINT '========================================';
PRINT 'Foreign keys creation completed';
PRINT '========================================';
GO