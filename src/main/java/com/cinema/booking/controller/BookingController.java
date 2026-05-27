package com.cinema.booking.controller;

import com.cinema.booking.dto.BookingRequest;
import com.cinema.booking.model.Booking;
import com.cinema.booking.model.Showtime;
import com.cinema.booking.model.User;
import com.cinema.booking.repository.BookingRepository;
import com.cinema.booking.repository.ShowtimeRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/bookings")
public class BookingController {

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private ShowtimeRepository showtimeRepository;

    private User getLoggedInUser(HttpServletRequest request) {
        HttpSession session = request.getSession(false);
        if (session == null) return null;
        return (User) session.getAttribute("user");
    }

    private boolean isAdmin(HttpServletRequest request) {
        User user = getLoggedInUser(request);
        return user != null && "ADMIN".equalsIgnoreCase(user.getRole());
    }

    @PostMapping
    public ResponseEntity<?> createBooking(@Valid @RequestBody BookingRequest bookingRequest, HttpServletRequest request) {
        User loggedInUser = getLoggedInUser(request);
        if (loggedInUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Authentication required. Please log in first."));
        }

        Optional<Showtime> showtimeOpt = showtimeRepository.findById(bookingRequest.getShowtimeId());
        if (showtimeOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "Invalid showtime ID"));
        }

        Showtime showtime = showtimeOpt.get();

        // Parse seats from request
        List<String> requestedSeats = Arrays.stream(bookingRequest.getSeats().split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .collect(Collectors.toList());

        if (requestedSeats.isEmpty()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "Please select at least one seat"));
        }

        // Fetch already booked seats for this showtime
        List<Booking> activeBookings = bookingRepository.findByShowtimeIdAndStatus(showtime.getId(), "CONFIRMED");
        Set<String> alreadyBookedSeats = activeBookings.stream()
                .flatMap(b -> Arrays.stream(b.getSeats().split(",")))
                .map(String::trim)
                .collect(Collectors.toSet());

        // Check for conflicts
        List<String> occupiedConflicts = new ArrayList<>();
        for (String seat : requestedSeats) {
            if (alreadyBookedSeats.contains(seat)) {
                occupiedConflicts.add(seat);
            }
        }

        if (!occupiedConflicts.isEmpty()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "Seat(s) " + String.join(", ", occupiedConflicts) + " are already booked. Please choose different seats."));
        }

        // Calculate total amount
        double totalAmount = requestedSeats.size() * showtime.getTicketPrice();

        // Create booking
        Booking booking = new Booking();
        booking.setUser(loggedInUser);
        booking.setShowtime(showtime);
        booking.setSeats(String.join(",", requestedSeats));
        booking.setTotalAmount(totalAmount);
        // let PrePersist set bookingNumber and date

        Booking savedBooking = bookingRepository.save(booking);
        return ResponseEntity.status(HttpStatus.CREATED).body(savedBooking);
    }

    @GetMapping("/history")
    public ResponseEntity<?> getBookingHistory(HttpServletRequest request) {
        User loggedInUser = getLoggedInUser(request);
        if (loggedInUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Authentication required."));
        }

        List<Booking> bookings = bookingRepository.findByUserIdOrderByBookingDateDesc(loggedInUser.getId());
        return ResponseEntity.ok(bookings);
    }

    @GetMapping("/showtime/{showtimeId}/booked-seats")
    public ResponseEntity<?> getBookedSeatsForShowtime(@PathVariable Long showtimeId) {
        List<Booking> activeBookings = bookingRepository.findByShowtimeIdAndStatus(showtimeId, "CONFIRMED");
        List<String> bookedSeats = activeBookings.stream()
                .flatMap(b -> Arrays.stream(b.getSeats().split(",")))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .collect(Collectors.toList());

        return ResponseEntity.ok(bookedSeats);
    }

    @GetMapping
    public ResponseEntity<?> getAllBookings(HttpServletRequest request) {
        if (!isAdmin(request)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("message", "Access denied. Admin role required."));
        }

        List<Booking> bookings = bookingRepository.findAll();
        // Sort by booking date descending
        bookings.sort((b1, b2) -> b2.getBookingDate().compareTo(b1.getBookingDate()));
        return ResponseEntity.ok(bookings);
    }

    @PostMapping("/{id}/cancel")
    public ResponseEntity<?> cancelBooking(@PathVariable Long id, HttpServletRequest request) {
        User loggedInUser = getLoggedInUser(request);
        if (loggedInUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Authentication required."));
        }

        Optional<Booking> bookingOpt = bookingRepository.findById(id);
        if (bookingOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", "Booking not found"));
        }

        Booking booking = bookingOpt.get();

        // Check if user owns the booking or is admin
        boolean isOwner = booking.getUser().getId().equals(loggedInUser.getId());
        boolean isUserAdmin = "ADMIN".equalsIgnoreCase(loggedInUser.getRole());

        if (!isOwner && !isUserAdmin) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("message", "Access denied. You can only cancel your own bookings."));
        }

        if ("CANCELLED".equals(booking.getStatus())) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "Booking is already cancelled"));
        }

        booking.setStatus("CANCELLED");
        bookingRepository.save(booking);

        return ResponseEntity.ok(Map.of("message", "Booking successfully cancelled"));
    }
}
