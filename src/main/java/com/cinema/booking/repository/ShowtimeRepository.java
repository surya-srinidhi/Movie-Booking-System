package com.cinema.booking.repository;

import com.cinema.booking.model.Showtime;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDate;
import java.util.List;

public interface ShowtimeRepository extends JpaRepository<Showtime, Long> {
    List<Showtime> findByMovieId(Long movieId);
    List<Showtime> findByShowDate(LocalDate showDate);
}
