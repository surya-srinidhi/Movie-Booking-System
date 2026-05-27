package com.cinema.booking.controller;

import com.cinema.booking.model.Movie;
import com.cinema.booking.model.Showtime;
import com.cinema.booking.model.User;
import com.cinema.booking.repository.MovieRepository;
import com.cinema.booking.repository.ShowtimeRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/showtimes")
public class ShowtimeController {

    @Autowired
    private ShowtimeRepository showtimeRepository;

    @Autowired
    private MovieRepository movieRepository;

    private boolean isAdmin(HttpServletRequest request) {
        HttpSession session = request.getSession(false);
        if (session == null) return false;
        User user = (User) session.getAttribute("user");
        return user != null && "ADMIN".equalsIgnoreCase(user.getRole());
    }

    @GetMapping
    public List<Showtime> getAllShowtimes() {
        return showtimeRepository.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getShowtimeById(@PathVariable Long id) {
        Optional<Showtime> showtime = showtimeRepository.findById(id);
        if (showtime.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", "Showtime not found"));
        }
        return ResponseEntity.ok(showtime.get());
    }

    @GetMapping("/movie/{movieId}")
    public List<Showtime> getShowtimesByMovie(@PathVariable Long movieId) {
        return showtimeRepository.findByMovieId(movieId);
    }

    @PostMapping
    public ResponseEntity<?> createShowtime(@Valid @RequestBody Map<String, Object> payload, HttpServletRequest request) {
        if (!isAdmin(request)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("message", "Access denied. Admin role required."));
        }

        try {
            Long movieId = Long.valueOf(payload.get("movieId").toString());
            String screenName = payload.get("screenName").toString();
            String showDateStr = payload.get("showDate").toString();
            String showTimeStr = payload.get("showTime").toString();
            Double ticketPrice = Double.valueOf(payload.get("ticketPrice").toString());

            Optional<Movie> movieOpt = movieRepository.findById(movieId);
            if (movieOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("message", "Invalid Movie ID"));
            }

            Showtime showtime = new Showtime(
                    movieOpt.get(),
                    screenName,
                    java.time.LocalDate.parse(showDateStr),
                    java.time.LocalTime.parse(showTimeStr),
                    ticketPrice
            );

            Showtime savedShowtime = showtimeRepository.save(showtime);
            return ResponseEntity.status(HttpStatus.CREATED).body(savedShowtime);

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "Invalid request body: " + e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteShowtime(@PathVariable Long id, HttpServletRequest request) {
        if (!isAdmin(request)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("message", "Access denied. Admin role required."));
        }

        Optional<Showtime> showtimeOpt = showtimeRepository.findById(id);
        if (showtimeOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", "Showtime not found"));
        }

        showtimeRepository.delete(showtimeOpt.get());
        return ResponseEntity.ok(Map.of("message", "Showtime successfully deleted"));
    }
}
