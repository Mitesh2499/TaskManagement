using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace TaskManagementAPI.Data.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Tasks",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Title = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: true),
                    Status = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    Priority = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    AssignedTo = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    CreatedDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ModifiedDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Tasks", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Users",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Email = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: false),
                    PasswordHash = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CreatedDate = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Users", x => x.Id);
                });

            migrationBuilder.InsertData(
                table: "Tasks",
                columns: new[] { "Id", "AssignedTo", "CreatedDate", "Description", "IsDeleted", "ModifiedDate", "Priority", "Status", "Title" },
                values: new object[,]
                {
                    { 1, "Alice Chen", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Configure GitHub Actions for build and test.", false, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "High", "Done", "Set up CI pipeline" },
                    { 2, "Bob Martinez", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Model tasks, users, and relationships.", false, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Critical", "Done", "Design database schema" },
                    { 3, "Alice Chen", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "CRUD endpoints for tasks with filtering.", false, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "High", "InProgress", "Implement task API endpoints" },
                    { 4, "Priya Nair", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "React pages for authentication.", false, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Critical", "InProgress", "Build login and signup UI" },
                    { 5, "Bob Martinez", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Issue and validate bearer tokens.", false, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Critical", "InProgress", "Add JWT authentication" },
                    { 6, "Diego Ruiz", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Cover filtering and sorting logic.", false, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Medium", "ToDo", "Write unit tests for TaskService" },
                    { 7, "Priya Nair", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Colour-code priority in the UI.", false, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Low", "ToDo", "Style task table with priority badges" },
                    { 8, "Diego Ruiz", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Multi-stage build for deployment.", false, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Low", "ToDo", "Set up Dockerfile for API" },
                    { 9, "Alice Chen", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Document how to run API and frontend.", false, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Medium", "ToDo", "Write README setup instructions" },
                    { 10, "Bob Martinez", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Investigate intermittent failure in CI.", false, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "High", "ToDo", "Fix flaky summary endpoint test" }
                });

            migrationBuilder.InsertData(
                table: "Users",
                columns: new[] { "Id", "CreatedDate", "Email", "PasswordHash" },
                values: new object[] { 1, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "demo@example.com", "$2a$11$v031RUj/qYLCCV9cimQLuuyPP4Yr9wTl1wVr4UPAD2XsobNyZoLSy" });

            migrationBuilder.CreateIndex(
                name: "IX_Users_Email",
                table: "Users",
                column: "Email",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Tasks");

            migrationBuilder.DropTable(
                name: "Users");
        }
    }
}
