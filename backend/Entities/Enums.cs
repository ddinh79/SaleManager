namespace SalesSystem.Entities;

public enum UserRole
{
    Admin,
    SalesManager,
    SalesMember
}

public enum ActivityType
{
    CALL,
    MESSAGE,
    MEETING,
    DEMO,
    SAMPLE_SENT
}

public enum ActivityResult
{
    Interested,
    NotInterested,
    FollowUp
}

public enum DealStage
{
    NEW,
    IN_PROGRESS,
    NEGOTIATION,
    WON,
    LOST
}

public enum ProductType
{
    SCAR_SHEET,
    SCAR_CREAM,
    BOTH
}

public enum PotentialLevel
{
    A,
    B,
    C
}

public enum OrderStatus
{
    Pending,
    Shipped,
    Completed
}

public enum NotificationType
{
    FollowUpReminder,
    DealClosing,
    InactiveAlert
}

public enum GpsStatus
{
    VALID,
    SUSPICIOUS,
    MISSING
}