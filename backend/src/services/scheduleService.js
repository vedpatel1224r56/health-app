const createScheduleService = ({ all }) => {
  const parseMinutes = (value) => {
    if (!/^\d{2}:\d{2}$/.test(String(value || ""))) return null;
    const [hours, minutes] = String(value).split(":").map(Number);
    if (
      Number.isNaN(hours) ||
      Number.isNaN(minutes) ||
      hours < 0 ||
      hours > 23 ||
      minutes < 0 ||
      minutes > 59
    ) {
      return null;
    }
    return hours * 60 + minutes;
  };

  const toTimeLabel = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
  };

  const getDoctorSchedules = async (doctorId) =>
    all(
      `SELECT id, doctor_id, weekday, start_time, end_time, slot_minutes, active
       FROM doctor_availability
       WHERE doctor_id = ? AND active = 1
       ORDER BY weekday ASC, start_time ASC`,
      [doctorId],
    );

  const buildDoctorSlots = async (doctorId, dateText, options = {}) => {
    const excludeAppointmentId = options.excludeAppointmentId ? Number(options.excludeAppointmentId) : null;
    const date = new Date(`${dateText}T00:00:00`);
    if (Number.isNaN(date.getTime())) {
      return { slots: [], error: "Valid date is required." };
    }
    const weekday = date.getDay();
    const schedules = await all(
      `SELECT weekday, start_time, end_time, slot_minutes
       FROM doctor_availability
       WHERE doctor_id = ? AND active = 1 AND weekday = ?
       ORDER BY start_time ASC`,
      [doctorId, weekday],
    );
    if (schedules.length === 0) {
      return { slots: [] };
    }

    const booked = excludeAppointmentId
      ? await all(
          `SELECT scheduled_at
           FROM appointments
           WHERE doctor_id = ?
             AND date(scheduled_at) = date(?)
             AND id != ?
             AND status IN ('approved', 'checked_in')`,
          [doctorId, `${dateText}T00:00:00.000Z`, excludeAppointmentId],
        )
      : await all(
          `SELECT scheduled_at
           FROM appointments
           WHERE doctor_id = ?
             AND date(scheduled_at) = date(?)
             AND status IN ('approved', 'checked_in')`,
          [doctorId, `${dateText}T00:00:00.000Z`],
        );
    const bookedSet = new Set(
      booked.map((row) => {
        const dt = new Date(row.scheduled_at);
        return `${String(dt.getHours()).padStart(2, "0")}:${String(dt.getMinutes()).padStart(2, "0")}`;
      }),
    );

    const slots = [];
    for (const schedule of schedules) {
      const startMinutes = parseMinutes(schedule.start_time);
      const endMinutes = parseMinutes(schedule.end_time);
      const slotMinutes = Number(schedule.slot_minutes) || 20;
      if (startMinutes === null || endMinutes === null || endMinutes <= startMinutes) {
        continue;
      }
      for (let current = startMinutes; current + slotMinutes <= endMinutes; current += slotMinutes) {
        const time = toTimeLabel(current);
        if (!bookedSet.has(time)) {
          slots.push({
            time,
            date: dateText,
            dateTime: `${dateText}T${time}:00`,
          });
        }
      }
    }
    return { slots };
  };

  return {
    parseMinutes,
    toTimeLabel,
    getDoctorSchedules,
    buildDoctorSlots,
  };
};

module.exports = { createScheduleService };
