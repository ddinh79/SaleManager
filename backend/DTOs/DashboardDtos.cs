namespace SalesSystem.DTOs;

// ============ CEO Dashboard ============

public class CEODashboardResponse
{
    public decimal TotalRevenue { get; set; }
    public decimal PipelineValue { get; set; }
    public decimal WeightedForecast { get; set; }
    public decimal ConversionRate { get; set; }
    public int TotalDeals { get; set; }
    public int WonDeals { get; set; }
    public int ActiveDeals { get; set; }
    public List<TopDoctorItem> TopDoctors { get; set; } = new();
    public List<RevenueBySalesItem> RevenueBySales { get; set; } = new();
}

public class TopDoctorItem
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Hospital { get; set; } = string.Empty;
    public decimal TotalValue { get; set; }
}

public class RevenueBySalesItem
{
    public Guid SalesId { get; set; }
    public string SalesName { get; set; } = string.Empty;
    public decimal Revenue { get; set; }
    public int DealsWon { get; set; }
}

// ============ Manager Dashboard ============

public class DealClosingSoonItem
{
    public Guid DealId { get; set; }
    public string DealName { get; set; } = string.Empty;
    public decimal TotalValue { get; set; }
    public DateTime ExpectedCloseDate { get; set; }
    public string SalesName { get; set; } = string.Empty;
    public string HospitalName { get; set; } = string.Empty;
}

public class ManagerDashboardResponse
{
    public int TeamSize { get; set; }
    public decimal TeamPipelineValue { get; set; }
    public decimal TeamWeightedForecast { get; set; }
    public List<DealClosingSoonItem> DealsClosingSoon { get; set; } = new();
    public int DealsClosingSoonCount { get; set; }
    public List<InactiveSalesItem> InactiveSalesMembers { get; set; } = new();
    public List<TeamPerformanceItem> TeamPerformance { get; set; } = new();
}

public class InactiveSalesItem
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public DateTime LastActivity { get; set; }
    public int DaysInactive { get; set; }
}

public class TeamPerformanceItem
{
    public Guid SalesId { get; set; }
    public string SalesName { get; set; } = string.Empty;
    public int DealsWon { get; set; }
    public decimal Revenue { get; set; }
    public int TasksCompleted { get; set; }
}

// ============ Sales Dashboard ============

public class MyDealItem
{
    public Guid DealId { get; set; }
    public string DoctorName { get; set; } = string.Empty;
    public string HospitalName { get; set; } = string.Empty;
    public decimal TotalValue { get; set; }
    public string Stage { get; set; } = string.Empty;
    public DateTime ExpectedCloseDate { get; set; }
    public int Probability { get; set; }
}

public class SalesDashboardResponse
{
    public int MyDeals { get; set; }
    public decimal MyPipelineValue { get; set; }
    public decimal MyWeightedForecast { get; set; }
    public int TasksToday { get; set; }
    public int TasksOverdue { get; set; }
    public KpiProgressItem KpiProgress { get; set; } = new();
    public List<RecentActivityItem> RecentActivities { get; set; } = new();
    public List<MyDealItem> MyDealDetails { get; set; } = new();
}

public class KpiProgressItem
{
    public decimal TargetRevenue { get; set; }
    public decimal CurrentRevenue { get; set; }
    public int TargetDeals { get; set; }
    public int WonDeals { get; set; }
}

public class RecentActivityItem
{
    public Guid Id { get; set; }
    public string Type { get; set; } = string.Empty;
    public string DoctorName { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}