package com.cinema.booking.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDateTime;

@Entity
@Table(name = "bookings")
public class Booking {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "user_id", nullable = false)
    @NotNull(message = "User is required")
    private User user;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "showtime_id", nullable = false)
    @NotNull(message = "Showtime is required")
    private Showtime showtime;

    @NotBlank(message = "Seats are required")
    private String seats; // comma separated e.g. "A3,A4"

    @NotNull(message = "Total amount is required")
    private Double totalAmount;

    @Column(unique = true, nullable = false)
    private String bookingNumber;

    private LocalDateTime bookingDate;

    private String status; // "CONFIRMED" or "CANCELLED"

    @PrePersist
    protected void onCreate() {
        bookingDate = LocalDateTime.now();
        status = "CONFIRMED";
        if (bookingNumber == null || bookingNumber.isEmpty()) {
            bookingNumber = "CBS-" + System.currentTimeMillis();
        }
    }

    // Default Constructor
    public Booking() {}

    // Parameterized Constructor
    public Booking(User user, Showtime showtime, String seats, Double totalAmount, String bookingNumber) {
        this.user = user;
        this.showtime = showtime;
        this.seats = seats;
        this.totalAmount = totalAmount;
        this.bookingNumber = bookingNumber;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public Showtime getShowtime() {
        return showtime;
    }

    public void setShowtime(Showtime showtime) {
        this.showtime = showtime;
    }

    public String getSeats() {
        return seats;
    }

    public void setSeats(String seats) {
        this.seats = seats;
    }

    public Double getTotalAmount() {
        return totalAmount;
    }

    public void setTotalAmount(Double totalAmount) {
        this.totalAmount = totalAmount;
    }

    public String getBookingNumber() {
        return bookingNumber;
    }

    public void setBookingNumber(String bookingNumber) {
        this.bookingNumber = bookingNumber;
    }

    public LocalDateTime getBookingDate() {
        return bookingDate;
    }

    public void setBookingDate(LocalDateTime bookingDate) {
        this.bookingDate = bookingDate;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}
