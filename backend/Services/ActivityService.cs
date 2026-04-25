using SalesSystem.DTOs.Request;
using SalesSystem.DTOs.Response;
using SalesSystem.Entities;
using SalesSystem.Repositories;

namespace SalesSystem.Services;

public class ActivityService : IActivityService
{
    private readonly IActivityRepository _activityRepo;
    private readonly IDoctorRepository _doctorRepo;
    private readonly IHospitalRepository _hospitalRepo;

    public ActivityService(
        IActivityRepository activityRepo,
        IDoctorRepository doctorRepo,
        IHospitalRepository hospitalRepo)
    {
        _activityRepo = activityRepo;
        _doctorRepo = doctorRepo;
        _hospitalRepo = hospitalRepo;
    }

    public async Task<ActivityResponse> CreateAsync(CreateActivityRequest request, Guid salesId)
    {
        // Validate GPS for MEETING/DEMO
        if (request.Type == ActivityType.MEETING || request.Type == ActivityType.DEMO)
        {
            if (!request.Lat.HasValue || !request.Lng.HasValue)
            {
                throw new ArgumentException("GPS coordinates required for MEETING or DEMO activities");
            }
        }

        var doctor = await _doctorRepo.GetByIdAsync(request.DoctorId)
            ?? throw new ArgumentException("Doctor not found");

        // Calculate GPS status
        var gpsStatus = GpsStatus.MISSING;
        int? distanceMeters = null;

        if (request.Type == ActivityType.MEETING || request.Type == ActivityType.DEMO)
        {
            if (request.Lat.HasValue && request.Lng.HasValue)
            {
                var hospital = await _hospitalRepo.GetByIdAsync(doctor.HospitalId);
                if (hospital != null && hospital.Lat.HasValue && hospital.Lng.HasValue)
                {
                    distanceMeters = CalculateHaversineDistance(
                        (double)request.Lat.Value,
                        (double)request.Lng.Value,
                        (double)hospital.Lat.Value,
                        (double)hospital.Lng.Value
                    );

                    gpsStatus = distanceMeters <= 100 ? GpsStatus.VALID : GpsStatus.SUSPICIOUS;
                }
            }
        }

        var activity = new Activity
        {
            Id = Guid.NewGuid(),
            SalesId = salesId,
            DoctorId = request.DoctorId,
            Type = request.Type,
            Content = request.Content,
            Result = string.IsNullOrEmpty(request.Result)
                ? ActivityResult.Interested
                : Enum.TryParse<ActivityResult>(request.Result, out var result)
                    ? result
                    : ActivityResult.Interested,
            NextFollowUpDate = request.NextFollowUpAt,
            CheckinLat = request.Lat,
            CheckinLng = request.Lng,
            GpsStatus = gpsStatus,
            DistanceMeters = distanceMeters,
            DeviceId = request.DeviceId,
            CreatedAt = DateTime.UtcNow
        };

        await _activityRepo.AddAsync(activity);

        // Update doctor
        doctor.LastActivityAt = DateTime.UtcNow;
        if (request.NextFollowUpAt.HasValue)
        {
            doctor.NextFollowUpAt = request.NextFollowUpAt;
        }

        // Auto-update temperature based on result
        if (request.Result == "interested")
        {
            doctor.Temperature = Temperature.HOT;
        }
        else if (request.Result == "follow_up_needed")
        {
            doctor.Temperature = Temperature.WARM;
        }
        else
        {
            doctor.Temperature = Temperature.COLD;
        }

        // Auto-set next_follow_up_at based on activity type
        if (!request.NextFollowUpAt.HasValue)
        {
            if (request.Type == ActivityType.MEETING)
            {
                doctor.NextFollowUpAt = DateTime.UtcNow.AddDays(2);
            }
            else if (request.Type == ActivityType.CALL)
            {
                doctor.NextFollowUpAt = DateTime.UtcNow.AddDays(3);
            }
        }

        await _doctorRepo.UpdateAsync(doctor);

        return MapToResponse(activity, doctor.Name);
    }

    public async Task<List<ActivityResponse>> GetFilteredAsync(Guid? salesId, Guid? doctorId, DateTime? from, DateTime? to, string? type)
    {
        ActivityType? activityType = null;
        if (!string.IsNullOrEmpty(type) && Enum.TryParse<ActivityType>(type, out var parsed))
        {
            activityType = parsed;
        }

        var activities = await _activityRepo.GetFilteredAsync(salesId, doctorId, from, to, activityType);
        return activities.Select(a => MapToResponse(a, a.Doctor?.Name ?? "Unknown")).ToList();
    }

    public async Task<ActivityResponse?> GetByIdAsync(Guid id)
    {
        var activity = await _activityRepo.GetByIdAsync(id);
        if (activity == null) return null;
        return MapToResponse(activity, activity.Doctor?.Name ?? "Unknown");
    }

    private ActivityResponse MapToResponse(Activity activity, string doctorName)
    {
        return new ActivityResponse
        {
            Id = activity.Id,
            SalesId = activity.SalesId,
            SalesName = activity.Sales?.FullName ?? "Unknown",
            DoctorId = activity.DoctorId,
            DoctorName = doctorName,
            Type = activity.Type.ToString(),
            Content = activity.Content,
            Result = activity.Result.ToString(),
            NextFollowUpAt = activity.NextFollowUpDate,
            CheckinLat = activity.CheckinLat,
            CheckinLng = activity.CheckinLng,
            GpsStatus = activity.GpsStatus.ToString(),
            DistanceMeters = activity.DistanceMeters,
            CreatedAt = activity.CreatedAt
        };
    }

    private static int CalculateHaversineDistance(double lat1, double lng1, double lat2, double lng2)
    {
        const double R = 6371000; // Earth radius in meters
        var dLat = ToRadians(lat2 - lat1);
        var dLng = ToRadians(lng2 - lng1);
        var a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2) +
                Math.Cos(ToRadians(lat1)) * Math.Cos(ToRadians(lat2)) *
                Math.Sin(dLng / 2) * Math.Sin(dLng / 2);
        var c = 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));
        return (int)(R * c);
    }

    private static double ToRadians(double degrees) => degrees * Math.PI / 180;
}