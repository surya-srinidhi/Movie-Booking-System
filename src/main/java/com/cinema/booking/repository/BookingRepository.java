package com.cinema.booking.repository;

import com.cinema.booking.model.Booking;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface BookingRepository extends JpaRepository<Booking, Long> {
    List<Booking> findByUserIdOrderByBookingDateDesc(Long userId);
    List<Booking> findByShowtimeId(Long showtimeId);
    List<Booking> findByShowtimeIdAndStatus(Long showtimeId, String status);
}
