using System.ComponentModel.DataAnnotations;

namespace SalesSystem.Entities;

public class UserPlanSettings
{
    [Key]
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;

    public decimal? CapacityMultiplierOverride { get; set; } // 0.8 → 1.2
    public DateTime? PreferredStartTime { get; set; }

    // System-calculated (read-only for user)
    public int CalculatedMustDoLimit { get; set; }
    public int CalculatedShouldDoLimit { get; set; }
    public decimal AvgTasksPerDay { get; set; }
}