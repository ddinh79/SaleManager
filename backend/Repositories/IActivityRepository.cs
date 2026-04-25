using SalesSystem.Entities;

namespace SalesSystem.Repositories;

public interface IActivityRepository : IRepository<Activity>
{
    Task<List<Activity>> GetBySalesIdAsync(Guid salesId);
    Task<List<Activity>> GetByDoctorIdAsync(Guid doctorId);
    Task<List<Activity>> GetFilteredAsync(Guid? salesId, Guid? doctorId, DateTime? from, DateTime? to, ActivityType? type);
}