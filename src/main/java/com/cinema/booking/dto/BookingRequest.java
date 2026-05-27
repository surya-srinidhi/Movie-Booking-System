package com.cinema.booking.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class BookingRequest {

    @NotNull(message = "Showtime ID is required")
    private Long showtimeId;

    @NotBlank(message = "Seats are required")
    private String seats; // comma-separated, e.g. "A1,A2"

    // Default Constructor
    public BookingRequest() {}

    // Getters and Setters
    public Long getShowtimeId() {
        return showtimeId;
    }

    public void setShowtimeId(Long showtimeId) {
        this.showtimeId = showtimeId;
    }

    public String getSeats() {
        return seats;
    }

    public void setSeats(String seats) {
        this.seats = seats;
    }
}
