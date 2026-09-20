using System.ComponentModel.DataAnnotations;

namespace TaskManagementAPI.Validation;

/// <summary>
/// Validates that a string property is a valid member of the given enum, producing a
/// friendly "Invalid X. Allowed values are: ..." message instead of a raw JSON binding error.
/// Leaves null/empty values alone so [Required] is the one that reports "X is required."
/// </summary>
public class ValidEnumAttribute : ValidationAttribute
{
    private readonly Type _enumType;

    public ValidEnumAttribute(Type enumType)
    {
        _enumType = enumType;
    }

    protected override ValidationResult? IsValid(object? value, ValidationContext validationContext)
    {
        if (value is null || (value is string s && string.IsNullOrWhiteSpace(s)))
        {
            return ValidationResult.Success;
        }

        if (value is string str && Enum.TryParse(_enumType, str, ignoreCase: true, out _))
        {
            return ValidationResult.Success;
        }

        var allowedValues = string.Join(", ", Enum.GetNames(_enumType));
        var memberName = validationContext.MemberName ?? validationContext.DisplayName;

        return new ValidationResult(
            $"Invalid {validationContext.DisplayName}: '{value}'. Allowed values are: {allowedValues}.",
            new[] { memberName });
    }
}
