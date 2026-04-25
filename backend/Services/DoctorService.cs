using SalesSystem.DTOs.Request;
using SalesSystem.DTOs.Response;
using SalesSystem.Data;
using SalesSystem.Entities;
using SalesSystem.Repositories;
using Microsoft.EntityFrameworkCore;

namespace SalesSystem.Services;

public class DoctorService : IDoctorService
{
    private readonly IDoctorRepository _doctorRepository;
    private readonly AppDbContext _context;

    public DoctorService(IDoctorRepository doctorRepository, AppDbContext context)
    {
        _doctorRepository = doctorRepository;
        _context = context;
    }

    public async Task<PaginatedResponse<DoctorResponse>> GetDoctorsAsync(int page, int pageSize, string? search, string? potentialLevel, Guid? hospitalId)
    {
        var doctors = await _doctorRepository.GetAllWithDetailsAsync(page, pageSize, search, potentialLevel, hospitalId);
        var totalCount = await _doctorRepository.GetTotalCountAsync(search, potentialLevel, hospitalId);

        return new PaginatedResponse<DoctorResponse>
        {
            Data = doctors.Select(MapToDoctorResponse).ToList(),
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize
        };
    }

    public async Task<DoctorResponse?> GetDoctorByIdAsync(Guid id)
    {
        var doctor = await _doctorRepository.GetByIdWithDetailsAsync(id);

        if (doctor == null)
        {
            return null;
        }

        return MapToDoctorResponse(doctor);
    }

    public async Task<DoctorResponse> CreateDoctorAsync(CreateDoctorRequest request)
    {
        var existingDoctor = await _doctorRepository.GetByPhoneAsync(request.Phone);
        if (existingDoctor != null)
        {
            throw new InvalidOperationException($"A doctor with phone '{request.Phone}' already exists.");
        }

        var doctor = new Doctor
        {
            Id = Guid.NewGuid(),
            Name = request.Name,
            Specialty = request.Specialty,
            Phone = request.Phone,
            Zalo = request.Zalo,
            HospitalId = request.HospitalId,
            Address = request.Address,
            PotentialLevel = Enum.TryParse<PotentialLevel>(request.PotentialLevel, out var level) ? level : PotentialLevel.C,
            AssignedSalesId = request.AssignedSalesId,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        await _doctorRepository.AddAsync(doctor);

        var hospital = await _context.Hospitals.FindAsync(doctor.HospitalId);
        var assignedSales = request.AssignedSalesId.HasValue ? await _context.Users.FindAsync(request.AssignedSalesId.Value) : null;

        return new DoctorResponse
        {
            Id = doctor.Id,
            Name = doctor.Name,
            Specialty = doctor.Specialty,
            Phone = doctor.Phone,
            Zalo = doctor.Zalo,
            HospitalId = doctor.HospitalId,
            HospitalName = hospital?.Name,
            Address = doctor.Address,
            PotentialLevel = doctor.PotentialLevel.ToString(),
            AssignedSalesId = doctor.AssignedSalesId,
            AssignedSalesName = assignedSales?.FullName,
            CreatedAt = doctor.CreatedAt
        };
    }

    public async Task<bool> UpdateDoctorAsync(Guid id, UpdateDoctorRequest request)
    {
        var doctor = await _doctorRepository.GetByIdAsync(id);
        if (doctor == null)
        {
            return false;
        }

        var existingDoctorWithPhone = await _doctorRepository.GetByPhoneAsync(request.Phone);
        if (existingDoctorWithPhone != null && existingDoctorWithPhone.Id != id)
        {
            throw new InvalidOperationException($"A doctor with phone '{request.Phone}' already exists.");
        }

        doctor.Name = request.Name;
        doctor.Specialty = request.Specialty;
        doctor.Phone = request.Phone;
        doctor.Zalo = request.Zalo;
        doctor.HospitalId = request.HospitalId;
        doctor.Address = request.Address;
        doctor.PotentialLevel = Enum.TryParse<PotentialLevel>(request.PotentialLevel, out var level) ? level : PotentialLevel.C;
        doctor.AssignedSalesId = request.AssignedSalesId;
        doctor.UpdatedAt = DateTime.UtcNow;

        await _doctorRepository.UpdateAsync(doctor);
        return true;
    }

    public async Task<bool> DeleteDoctorAsync(Guid id)
    {
        var doctor = await _doctorRepository.GetByIdAsync(id);
        if (doctor == null)
        {
            return false;
        }

        await _doctorRepository.DeleteAsync(id);
        return true;
    }

    public async Task<List<DoctorResponse>> GetAssignedDoctorsAsync(Guid salesId)
    {
        var doctors = await _context.Doctors
            .Include(d => d.Hospital)
            .Include(d => d.AssignedSales)
            .Where(d => d.AssignedSalesId == salesId)
            .ToListAsync();

        return doctors.Select(MapToDoctorResponse).ToList();
    }

    public async Task<bool> AssignDoctorToSalesAsync(Guid doctorId, Guid? salesId)
    {
        var doctor = await _doctorRepository.GetByIdAsync(doctorId);
        if (doctor == null)
        {
            return false;
        }

        doctor.AssignedSalesId = salesId;
        doctor.UpdatedAt = DateTime.UtcNow;

        await _doctorRepository.UpdateAsync(doctor);
        return true;
    }

    private DoctorResponse MapToDoctorResponse(Doctor doctor)
    {
        return new DoctorResponse
        {
            Id = doctor.Id,
            Name = doctor.Name,
            Specialty = doctor.Specialty,
            Phone = doctor.Phone,
            Zalo = doctor.Zalo,
            HospitalId = doctor.HospitalId,
            HospitalName = doctor.Hospital?.Name,
            Address = doctor.Address,
            PotentialLevel = doctor.PotentialLevel.ToString(),
            AssignedSalesId = doctor.AssignedSalesId,
            AssignedSalesName = doctor.AssignedSales?.FullName,
            CreatedAt = doctor.CreatedAt
        };
    }
}