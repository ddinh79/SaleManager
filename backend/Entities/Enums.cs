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
    SILICONE,
    CREAM
}

public enum PotentialLevel
{
    A,
    B,
    C
}

public enum OrderStatus
{
    PENDING_APPROVAL,
    APPROVED,
    READY_TO_SHIP,
    SHIPPED,
    COMPLETED
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

public enum Temperature
{
    HOT,
    WARM,
    COLD
}