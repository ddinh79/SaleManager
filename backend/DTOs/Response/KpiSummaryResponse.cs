namespace SalesSystem.DTOs.Response;

public class KpiSummaryResponse
{
    public int TotalCalls { get; set; }
    public int TotalMeetings { get; set; }
    public int TotalDeals { get; set; }
    public int WonDeals { get; set; }
    public int LostDeals { get; set; }
    public decimal TotalRevenue { get; set; }
    public decimal ConversionRate { get; set; }
    public int ActivityScore { get; set; }
}

public class DailyKpiResponse
{
    public DateTime Date { get; set; }
    public int Calls { get; set; }
    public int Meetings { get; set; }
    public int NewDeals { get; set; }
    public decimal Revenue { get; set; }
}

public class WeeklyKpiResponse
{
    public int WeekNumber { get; set; }
    public int Calls { get; set; }
    public int Meetings { get; set; }
    public int WonDeals { get; set; }
    public decimal ConversionRate { get; set; }
}

public class MonthlyKpiResponse
{
    public int Month { get; set; }
    public int Year { get; set; }
    public decimal Revenue { get; set; }
    public decimal TargetPercent { get; set; }
    public decimal AvgDealSize { get; set; }
}