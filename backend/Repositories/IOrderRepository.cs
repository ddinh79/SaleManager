using SalesSystem.Entities;

namespace SalesSystem.Repositories;

public interface IOrderRepository : IRepository<Order>
{
    Task<Order?> GetByIdWithDetailsAsync(Guid id);
    Task<IEnumerable<Order>> GetAllWithDetailsAsync();
    Task<IEnumerable<Order>> GetByStatusAsync(OrderStatus status);
    Task<IEnumerable<Order>> GetByDoctorIdAsync(Guid doctorId);
}