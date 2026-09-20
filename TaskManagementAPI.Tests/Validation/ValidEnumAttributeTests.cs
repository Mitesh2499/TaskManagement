using System.ComponentModel.DataAnnotations;
using FluentAssertions;
using TaskManagementAPI.Models;
using TaskManagementAPI.Validation;

namespace TaskManagementAPI.Tests.Validation;

public class ValidEnumAttributeTests
{
    private class Dummy
    {
        public string? Status { get; set; }
    }

    private static ValidationContext CreateContext() => new(new Dummy()) { MemberName = "Status" };

    [Fact]
    public void GetValidationResult_NullValue_ReturnsSuccess()
    {
        var attribute = new ValidEnumAttribute(typeof(TaskState));

        var result = attribute.GetValidationResult(null, CreateContext());

        result.Should().Be(ValidationResult.Success);
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    public void GetValidationResult_EmptyOrWhitespace_ReturnsSuccess(string value)
    {
        // Blank values are the [Required] attribute's job to reject, not this one's.
        var attribute = new ValidEnumAttribute(typeof(TaskState));

        var result = attribute.GetValidationResult(value, CreateContext());

        result.Should().Be(ValidationResult.Success);
    }

    [Theory]
    [InlineData("ToDo")]
    [InlineData("todo")]
    [InlineData("TODO")]
    [InlineData("InProgress")]
    [InlineData("Done")]
    public void GetValidationResult_ValidEnumNameAnyCase_ReturnsSuccess(string value)
    {
        var attribute = new ValidEnumAttribute(typeof(TaskState));

        var result = attribute.GetValidationResult(value, CreateContext());

        result.Should().Be(ValidationResult.Success);
    }

    [Fact]
    public void GetValidationResult_InvalidEnumName_ReturnsErrorListingAllowedValues()
    {
        var attribute = new ValidEnumAttribute(typeof(TaskState));

        var result = attribute.GetValidationResult("Blocked", CreateContext());

        result.Should().NotBeNull();
        result!.ErrorMessage.Should().Contain("Blocked").And.Contain("ToDo").And.Contain("InProgress").And.Contain("Done");
        result.MemberNames.Should().ContainSingle().Which.Should().Be("Status");
    }

    [Fact]
    public void GetValidationResult_InvalidPriorityName_ListsPriorityValues()
    {
        var attribute = new ValidEnumAttribute(typeof(TaskPriority));

        var result = attribute.GetValidationResult("Urgent", CreateContext());

        result.Should().NotBeNull();
        result!.ErrorMessage.Should().Contain("Low").And.Contain("Medium").And.Contain("High").And.Contain("Critical");
    }
}
