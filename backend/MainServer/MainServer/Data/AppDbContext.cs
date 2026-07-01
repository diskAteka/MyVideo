using System;
using System.Collections.Generic;
using SharedLib.Models;
using Microsoft.EntityFrameworkCore;

namespace MainServer.Data;

public partial class AppDbContext : DbContext
{
    public AppDbContext()
    {
    }

    public AppDbContext(DbContextOptions<AppDbContext> options)
        : base(options)
    {
    }
    public virtual DbSet<Comment> Comments { get; set; }

    public virtual DbSet<Dislike> DisLikes { get; set; }

    public virtual DbSet<Employee> Employees { get; set; }

    public virtual DbSet<Like> Likes { get; set; }

    public virtual DbSet<ServerLog> ServerLogs { get; set; }

    public virtual DbSet<User> Users { get; set; }

    public virtual DbSet<Video> Videos { get; set; }

    public virtual DbSet<View> Views { get; set; }


    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Comment>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__Comment__3214EC0777B85258");

            entity.ToTable("Comment");

            entity.HasIndex(e => e.Date, "IX_Comment_Date");

            entity.HasIndex(e => new { e.VideoId, e.Date }, "IX_Comment_VideoId_Date");

            entity.Property(e => e.Date).HasDefaultValueSql("(getutcdate())");
            entity.Property(e => e.Text).HasMaxLength(1000);

            entity.HasOne(d => d.User).WithMany(p => p.Comments)
                .HasForeignKey(d => d.UserId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__Comment__UserId__5BE2A6F2");

            entity.HasOne(d => d.Video).WithMany(p => p.Comments)
                .HasForeignKey(d => d.VideoId)
                .HasConstraintName("FK__Comment__VideoId__5AEE82B9");
        });

        modelBuilder.Entity<Dislike>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__DisLike__3214EC07DD447E75");

            entity.ToTable("DisLike");

            entity.HasIndex(e => new { e.VideoId, e.UserId }, "IX_DisLike_VideoId_UserId").IsUnique();

            entity.HasOne(d => d.User).WithMany(p => p.Dislikes)
                .HasForeignKey(d => d.UserId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__DisLike__UserId__6754599E");

            entity.HasOne(d => d.Video).WithMany(p => p.DislikesNavigation)
                .HasForeignKey(d => d.VideoId)
                .HasConstraintName("FK__DisLike__VideoId__66603565");
        });

        modelBuilder.Entity<Employee>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__Employee__3214EC076E392F1E");

            entity.ToTable("Employee");

            entity.Property(e => e.Id).ValueGeneratedNever();
            entity.Property(e => e.Password).HasMaxLength(50);
            entity.Property(e => e.Role).HasMaxLength(20);
            entity.Property(e => e.UserName).HasMaxLength(50);
        });

        modelBuilder.Entity<Like>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__Like__3214EC070D20842B");

            entity.ToTable("Like");

            entity.HasIndex(e => new { e.VideoId, e.UserId }, "IX_Like_VideoId_UserId").IsUnique();

            entity.HasOne(d => d.User).WithMany(p => p.Likes)
                .HasForeignKey(d => d.UserId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__Like__UserId__6383C8BA");

            entity.HasOne(d => d.Video).WithMany(p => p.LikesNavigation)
                .HasForeignKey(d => d.VideoId)
                .HasConstraintName("FK__Like__VideoId__628FA481");
        });

        modelBuilder.Entity<ServerLog>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__ServerLo__3214EC07A40AC643");

            entity.ToTable("ServerLog");

            entity.HasIndex(e => e.Date, "IX_ServerLog_Date");

            entity.HasIndex(e => e.EmployeeId, "IX_ServerLog_EmployeeId");

            entity.Property(e => e.ActionType).HasMaxLength(50);
            entity.Property(e => e.AffectedTable).HasMaxLength(128);
            entity.Property(e => e.Date)
                .HasDefaultValueSql("(getdate())")
                .HasColumnType("datetime");

            entity.HasOne(d => d.Employee).WithMany(p => p.ServerLogs)
                .HasForeignKey(d => d.EmployeeId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_ServerLog_Employee");
        });

        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__User__3214EC073D4293A5");

            entity.ToTable("User");

            entity.HasIndex(e => e.Email, "IX_User_Email").IsUnique();

            entity.HasIndex(e => e.Name, "IX_User_Name");

            entity.Property(e => e.Email).HasMaxLength(254);
            entity.Property(e => e.IsActive).HasDefaultValue(true);
            entity.Property(e => e.Name).HasMaxLength(100);
            entity.Property(e => e.PasswordHash)
                .HasMaxLength(64)
                .IsUnicode(false)
                .IsFixedLength();
            entity.Property(e => e.PasswordSalt)
                .HasMaxLength(32)
                .IsUnicode(false)
                .IsFixedLength();
            entity.Property(e => e.RegisteredAt).HasDefaultValueSql("(getutcdate())");
        });

        modelBuilder.Entity<Video>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__Video__3214EC07AC3F4D4F");

            entity.ToTable("Video");

            entity.HasIndex(e => e.DateUpload, "IX_Video_DateUpload");

            entity.HasIndex(e => e.IsVerified, "IX_Video_IsVerified");

            entity.HasIndex(e => e.Name, "IX_Video_Name");

            entity.Property(e => e.DateUpload).HasDefaultValueSql("(getutcdate())");
            entity.Property(e => e.Description).HasMaxLength(2000);
            entity.Property(e => e.Link).HasMaxLength(500);
            entity.Property(e => e.Name).HasMaxLength(200);
            entity.Property(e => e.Poster).HasMaxLength(500);

            entity.HasOne(d => d.Author).WithMany(p => p.Videos)
                .HasForeignKey(d => d.AuthorId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__Video__AuthorId__571DF1D5");
        });

        modelBuilder.Entity<View>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__View__3214EC0777CFEF53");

            entity.ToTable("View");

            entity.HasIndex(e => new { e.VideoId, e.UserId }, "IX_View_VideoId_UserId").IsUnique();

            entity.HasOne(d => d.User).WithMany(p => p.Views)
                .HasForeignKey(d => d.UserId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__View__UserId__6B24EA82");

            entity.HasOne(d => d.Video).WithMany(p => p.ViewsNavigation)
                .HasForeignKey(d => d.VideoId)
                .HasConstraintName("FK__View__VideoId__6A30C649");
        });

        OnModelCreatingPartial(modelBuilder);
    }

    partial void OnModelCreatingPartial(ModelBuilder modelBuilder);
}
