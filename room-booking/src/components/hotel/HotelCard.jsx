import React from "react";

export default function HotelCard({ hotel, onBook }) {
  const handleBook = () => {
    localStorage.setItem("selectedHotel", hotel.name);
    localStorage.setItem("hotelPrice", hotel.price);
    localStorage.setItem("hotelType", hotel.type);
    window.location.href = "/booking"; // next page
  };

  return (
    <div className="hotel-card">

      {/* LEFT: IMAGE */}
      <div className="hotel-img-wrap">
        <img src={hotel.image} alt={hotel.name} className="hotel-img" />
      </div>

      {/* CENTER: NAME + INFO */}
      <div className="hotel-info">
        <h4 className="hotel-name">{hotel.name}</h4>
        <p className="hotel-desc">Comfortable stay with clean rooms & basic facilities.</p>
      </div>

      {/* RIGHT: PRICE + TYPE + BUTTON */}
      <div className="hotel-side">
        <div className="hotel-type">
          {hotel.type} ({hotel.persons})
        </div>
        <div className="hotel-price">Rs.{hotel.price}/-</div>

        <button className="hotel-book-btn" onClick={() => onBook(hotel)}>
          Book Now
        </button>
      </div>

    </div>
  );
}
