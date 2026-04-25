using SalesSystem.DTOs.Request;
using SalesSystem.DTOs.Response;
using SalesSystem.Data;
using SalesSystem.Entities;
using SalesSystem.Repositories;
using Microsoft.EntityFrameworkCore;

namespace SalesSystem.Services;

public class HospitalService : IHospitalService
{
    private readonly IRepository<Hospital> _hospitalRepository;
    private readonly AppDbContext _context;

    public HospitalService(IRepository<Hospital> hospitalRepository, AppDbContext context)
    {
        _hospitalRepository = hospitalRepository;
        _context = context;
    }

    public async Task<List<HospitalResponse>> GetAllHospitalsAsync()
    {
        var hospitals = await _hospitalRepository.GetAllAsync();
        return hospitals.Select(MapToHospitalResponse).ToList();
    }

    public async Task<HospitalResponse?> GetHospitalByIdAsync(Guid id)
    {
        var hospital = await _hospitalRepository.GetByIdAsync(id);
        if (hospital == null)
        {
            return null;
        }

        return MapToHospitalResponse(hospital);
    }

    public async Task<HospitalResponse> CreateHospitalAsync(CreateHospitalRequest request)
    {
        var hospital = new Hospital
        {
            Id = Guid.NewGuid(),
            Name = request.Name,
            Address = request.Address,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        await _hospitalRepository.AddAsync(hospital);

        return MapToHospitalResponse(hospital);
    }

    public async Task<bool> UpdateHospitalAsync(Guid id, CreateHospitalRequest request)
    {
        var hospital = await _hospitalRepository.GetByIdAsync(id);
        if (hospital == null)
        {
            return false;
        }

        hospital.Name = request.Name;
        hospital.Address = request.Address;
        hospital.UpdatedAt = DateTime.UtcNow;

        await _hospitalRepository.UpdateAsync(hospital);
        return true;
    }

    public async Task<bool> DeleteHospitalAsync(Guid id)
    {
        var hospital = await _hospitalRepository.GetByIdAsync(id);
        if (hospital == null)
        {
            return false;
        }

        await _hospitalRepository.DeleteAsync(id);
        return true;
    }

    private HospitalResponse MapToHospitalResponse(Hospital hospital)
    {
        return new HospitalResponse
        {
            Id = hospital.Id,
            Name = hospital.Name,
            Address = hospital.Address,
            CreatedAt = hospital.CreatedAt,
            DoctorCount = hospital.Doctors?.Count ?? 0
        };
    }
}