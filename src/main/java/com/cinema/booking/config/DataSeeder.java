package com.cinema.booking.config;

import com.cinema.booking.model.Movie;
import com.cinema.booking.model.Showtime;
import com.cinema.booking.model.User;
import com.cinema.booking.repository.MovieRepository;
import com.cinema.booking.repository.ShowtimeRepository;
import com.cinema.booking.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

@Component
public class DataSeeder implements CommandLineRunner {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private MovieRepository movieRepository;

    @Autowired
    private ShowtimeRepository showtimeRepository;

    @Override
    public void run(String... args) throws Exception {
        seedUsers();
        seedMoviesAndShowtimes();
    }

    private void seedUsers() {
        if (userRepository.count() == 0) {
            // Seed Admin
            User admin = new User("Cinema Admin", "admin@cinema.com", "admin", "ADMIN");
            userRepository.save(admin);

            // Seed standard customer
            User customer = new User("Customer", "user@cinema.com", "password", "CUSTOMER");
            userRepository.save(customer);

            System.out.println(">>> Database Seeded: Default Admin (admin@cinema.com / admin) and Customer (user@cinema.com / password) created!");
        }
    }

    private void seedMoviesAndShowtimes() {
        if (movieRepository.count() == 0) {
            List<Movie> movies = new ArrayList<>();

            movies.add(new Movie(
                    "Most Eligible Bachelor",
                    "A romantic Telugu comedy-drama exploring the journey of Harsha, an NRI who returns to India looking for his perfect bride, only to have his views challenged by Vibha, a strong-willed stand-up comedian.",
                    "Romance / Comedy / Drama",
                    "Telugu",
                    150,
                    "https://upload.wikimedia.org/wikipedia/en/3/30/Most_Eligible_Bachelor_Poster.jpeg",
                    LocalDate.of(2021, 10, 15)
            ));

            movies.add(new Movie(
                    "Hi Nanna",
                    "A heart-wrenching emotional family drama following Viraj, a single-father photographer, and his young daughter Mahi, whose lives change forever when they meet a mysterious woman who connects them to their past.",
                    "Family / Drama / Romance",
                    "Telugu",
                    155,
                    "https://upload.wikimedia.org/wikipedia/en/d/d7/Hi_Nanna_poster.jpg",
                    LocalDate.of(2023, 12, 7)
            ));

            movies.add(new Movie(
                    "Godavari",
                    "A timeless classical romance set aboard the wooden houseboat 'Mavavari' as it sails down the scenic Godavari River. It tells the beautiful, serene story of Ram and Seetha as their paths cross and they fall in love.",
                    "Romance / Drama",
                    "Telugu",
                    140,
                    "https://upload.wikimedia.org/wikipedia/en/e/e7/Godavari_2006_poster.jpg",
                    LocalDate.of(2006, 5, 19)
            ));

            movies.add(new Movie(
                    "Anand",
                    "A delightful Telugu romantic drama subtitled 'Manchi Coffee Lanti Pelli' (A Marriage like a Good Cup of Coffee). It showcases the independent and sweet relationship between Anand and Rupa, whose love brews gradually amidst life's challenges.",
                    "Romance / Family",
                    "Telugu",
                    135,
                    "https://m.media-amazon.com/images/M/MV5BNDQ3Y2RlOTgtNTFmMy00NmM0LWFmNzYtOTI5OTNhYmM2NmJmXkEyXkFqcGc@._V1_FMjpg_UX1000_.jpg",
                    LocalDate.of(2004, 10, 15)
            ));

            List<Movie> savedMovies = movieRepository.saveAll(movies);
            System.out.println(">>> Database Seeded: 4 Telugu Movies created!");

            // Seed Showtimes spanning today, tomorrow and day after
            LocalDate today = LocalDate.now();
            LocalDate tomorrow = today.plusDays(1);
            LocalDate dayAfter = today.plusDays(2);

            List<Showtime> showtimes = new ArrayList<>();

            // Most Eligible Bachelor showtimes (₹200 to ₹300)
            Movie bachelor = savedMovies.get(0);
            showtimes.add(new Showtime(bachelor, "IMAX Theater", today, LocalTime.of(13, 0), 250.00));
            showtimes.add(new Showtime(bachelor, "IMAX Theater", today, LocalTime.of(18, 30), 300.00));
            showtimes.add(new Showtime(bachelor, "IMAX Theater", tomorrow, LocalTime.of(15, 0), 250.00));
            showtimes.add(new Showtime(bachelor, "Screen 1 (Dolby)", dayAfter, LocalTime.of(20, 0), 200.00));

            // Hi Nanna showtimes (₹200 to ₹300)
            Movie nanna = savedMovies.get(1);
            showtimes.add(new Showtime(nanna, "Screen 2", today, LocalTime.of(14, 30), 220.00));
            showtimes.add(new Showtime(nanna, "Screen 2", tomorrow, LocalTime.of(19, 0), 280.00));

            // Godavari showtimes (₹200 to ₹300)
            Movie godavari = savedMovies.get(2);
            showtimes.add(new Showtime(godavari, "Screen 1 (Dolby)", today, LocalTime.of(16, 0), 200.00));
            showtimes.add(new Showtime(godavari, "IMAX Theater", tomorrow, LocalTime.of(11, 0), 250.00));
            showtimes.add(new Showtime(godavari, "Screen 1 (Dolby)", dayAfter, LocalTime.of(17, 30), 200.00));

            // Anand showtimes (₹200 to ₹300)
            Movie anand = savedMovies.get(3);
            showtimes.add(new Showtime(anand, "VIP Lounge", today, LocalTime.of(15, 0), 300.00));
            showtimes.add(new Showtime(anand, "VIP Lounge", tomorrow, LocalTime.of(17, 0), 300.00));
            showtimes.add(new Showtime(anand, "Screen 2", dayAfter, LocalTime.of(12, 0), 200.00));

            showtimeRepository.saveAll(showtimes);
            System.out.println(">>> Database Seeded: 12 Movie Showtimes populated successfully!");
        }
    }
}
